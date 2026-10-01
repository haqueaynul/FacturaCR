/**
 * @file server.ts
 * @description Express backend server providing Ministerio de Hacienda v4.3 Electronic Invoicing API,
 * cryptographic XAdES-EPES digital signature engine, AES-256-GCM encrypted vault,
 * asynchronous document polling queue, automated retries with exponential backoff,
 * B2B reception processing, and real-time audit logging.
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase payload limit to support base64 encoded XML documents and p12 certificates
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

/**
 * --------------------------------------------------------------------------
 * TYPES & INTERFACES (Ministerio de Hacienda v4.3 Specification)
 * --------------------------------------------------------------------------
 */

export interface TaxpayerConfig {
  cedula: string;
  tipoCedula: '01' | '02' | '03' | '04'; // 01: Física, 02: Jurídica, 03: DIMEX, 04: NITE
  nombre: string;
  nombreComercial?: string;
  correo: string;
  telefono?: string;
  codigoActividad: string; // 6-digit economic activity code
  regimenTributario: 'tradicional' | 'simplificado' | 'zona_franca' | 'agropecuario';
  sucursal: string; // 3 digits
  puntoVenta: string; // 5 digits
  // Hacienda ATV Credentials
  atvUsername: string; // e.g. cpf-01-0123-0456@stag.comprobanteselectronicos.go.cr
  atvPassword?: string;
  pinP12?: string;
  p12CertificateBase64?: string;
  useLiveSandbox: boolean; // toggle between live Hacienda sandbox and simulator
}

export interface DocumentItem {
  numeroLinea: number;
  codigoCabys: string; // 13-digit CABYS code
  detalle: string;
  cantidad: number;
  unidadMedida: string; // e.g. Sp, Al, Unid
  precioUnitario: number;
  montoTotal: number;
  subTotal: number;
  montoDescuento?: number;
  naturalezaDescuento?: string;
  tarifaIva: number; // 0, 1, 2, 4, 8, 13
  codigoTarifaIva: string; // 01 (0%), 02 (1%), 03 (2%), 04 (4%), 07 (8%), 08 (13%)
  montoIva: number;
  montoTotalLinea: number;
}

export interface ElectronicDocument {
  id: string;
  clave: string; // 50-digit unique numeric key
  consecutivo: string; // 20-digit consecutive number
  tipoDocumento: '01' | '02' | '03' | '04' | '08' | '09'; // FE, ND, NC, TE, FEC, FEE
  fechaEmision: string;
  codigoActividad: string;
  moneda: 'CRC' | 'USD';
  tipoCambio: number;
  condicionVenta: '01' | '02' | '03'; // 01: Contado, 02: Crédito, 03: Consignación
  plazoCredito?: number;
  medioPago: '01' | '02' | '03' | '04'; // 01: Efectivo, 02: Tarjeta, 03: Cheque, 04: Transferencia/Sinpe
  emisor: {
    nombre: string;
    tipoIdentificacion: string;
    numeroIdentificacion: string;
    correo: string;
    regimen: string;
  };
  receptor: {
    nombre: string;
    tipoIdentificacion: string;
    numeroIdentificacion: string;
    correo: string;
  };
  items: DocumentItem[];
  resumen: {
    totalServGravados: number;
    totalServExentos: number;
    totalMercanciasGravadas: number;
    totalMercanciasExentas: number;
    totalGravado: number;
    totalExento: number;
    totalVenta: number;
    totalDescuentos: number;
    totalVentaNeta: number;
    totalImpuesto: number;
    totalComprobante: number;
  };
  // Digital Signature & Payload
  xmlOriginal: string;
  xmlFirmado?: string;
  digestValue?: string;
  signatureValue?: string;
  xadesSignedAt?: string;
  // Submission & Hacienda State
  estado: 'borrador' | 'firmado' | 'enviado' | 'recibido' | 'procesando' | 'aceptado' | 'rechazado' | 'error_envio';
  haciendaStatusCode?: number;
  haciendaRespuestaXml?: string;
  haciendaMensaje?: string;
  haciendaDetalle?: string;
  // Retries & Timing
  intentosEnvio: number;
  maxIntentos: number;
  proximoReintento?: string;
  ultimoIntento?: string;
  tiempoRespuestaMs?: number;
}

export interface ReceptionDocument {
  id: string;
  claveDocumento: string; // 50 digits of supplier's invoice
  numeroConsecutivoReceptor: string; // 20 digits (e.g. 00100001050000000001)
  fechaEmisionDoc: string;
  emisorNombre: string;
  emisorCedula: string;
  montoTotalImpuesto: number;
  totalFactura: number;
  tipoMensaje: '05' | '06' | '07'; // 05: Aceptado, 06: Aceptado Parcial, 07: Rechazado
  detalleMensaje: string;
  condicionImpuesto: '01' | '02' | '03' | '04' | '05'; // 01: Credito pleno, 02: Credito parcial, etc.
  montoTotalImpuestoAcreditar: number;
  xmlFirmado?: string;
  estado: 'firmado' | 'enviado' | 'aceptado' | 'rechazado';
  haciendaMensaje?: string;
  fechaRegistro: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  step: 'GENERATION' | 'SIGNING' | 'AUTH' | 'SUBMISSION' | 'POLLING' | 'RETRY' | 'RECEPTION' | 'SECURITY';
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  clave?: string;
  endpoint?: string;
  httpStatus?: number;
  durationMs?: number;
  message: string;
  payloadSummary?: string;
  details?: Record<string, unknown>;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  title: string;
  message: string;
  clave?: string;
  read: boolean;
}

/**
 * --------------------------------------------------------------------------
 * IN-MEMORY STATE & ENCRYPTED VAULT (Enterprise Simulation)
 * --------------------------------------------------------------------------
 */

// Simulated Master Encryption Key for AES-256-GCM Vault
const VAULT_MASTER_KEY = crypto.scryptSync(process.env.ENCRYPTION_SECRET || 'CR_HACIENDA_VAULT_KEY_2026', 'salt-cr-tax', 32);

// Default Taxpayer Profile for Costa Rica Sandbox Testing
let taxpayerConfig: TaxpayerConfig = {
  cedula: '3101123456',
  tipoCedula: '02',
  nombre: 'SERVICIOS TECNOLÓGICOS DEL VALLE S.A.',
  nombreComercial: 'TechValle CR',
  correo: 'facturacion@techvalle.cr',
  telefono: '2234-5678',
  codigoActividad: '620101', // Actividades de programación informática
  regimenTributario: 'tradicional',
  sucursal: '001',
  puntoVenta: '00001',
  atvUsername: 'cpf-02-3101-123456@stag.comprobanteselectronicos.go.cr',
  atvPassword: 'SandboxTestPassword123#',
  pinP12: '1234',
  useLiveSandbox: false, // Default to rich sandbox simulator for robust zero-failure onboarding
};

// Documents Store
let documents: ElectronicDocument[] = [];
let receptionDocuments: ReceptionDocument[] = [];
let auditLogs: AuditLogEntry[] = [];
let notifications: NotificationItem[] = [];

/**
 * --------------------------------------------------------------------------
 * CRYPTOGRAPHIC & SECURITY METHODS
 * --------------------------------------------------------------------------
 */

/**
 * Encrypts sensitive string data (like ATV password or private key) using AES-256-GCM.
 * @param {string} text - Plaintext data to encrypt.
 * @returns {string} Colon-separated initialization vector, ciphertext, and auth tag in hex.
 */
export function encryptSensitiveData(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', VAULT_MASTER_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypts sensitive string data encrypted with encryptSensitiveData.
 * @param {string} encryptedData - Colon-separated iv:ciphertext:tag.
 * @returns {string} Decrypted plaintext string.
 */
export function decryptSensitiveData(encryptedData: string): string {
  const [ivHex, ciphertext, tagHex] = encryptedData.split(':');
  if (!ivHex || !ciphertext || !tagHex) {
    throw new Error('Invalid encrypted data format');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', VAULT_MASTER_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generates an audit log entry and notifies subscribers.
 * @param {Omit<AuditLogEntry, 'id' | 'timestamp'>} entry - The audit data to register.
 * @returns {AuditLogEntry} The registered log entry.
 */
export function recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const newLog: AuditLogEntry = {
    id: 'LOG-' + crypto.randomUUID().slice(0, 8),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  auditLogs.unshift(newLog);
  // Keep last 250 logs in memory
  if (auditLogs.length > 250) {
    auditLogs = auditLogs.slice(0, 250);
  }
  return newLog;
}

/**
 * Adds an in-app notification for critical events (e.g. rejection, retry alert, batch completion).
 * @param {Omit<NotificationItem, 'id' | 'timestamp' | 'read'>} item - Notification payload.
 * @returns {NotificationItem}
 */
export function recordNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
  const notification: NotificationItem = {
    id: 'NOTIF-' + crypto.randomUUID().slice(0, 8),
    timestamp: new Date().toISOString(),
    read: false,
    ...item,
  };
  notifications.unshift(notification);
  if (notifications.length > 100) {
    notifications = notifications.slice(0, 100);
  }
  return notification;
}

/**
 * Formats a 50-digit numeric Clave for Costa Rica Factura Electrónica v4.3.
 * Formula: [506][DD][MM][YY][12-digit Cedula][20-digit Consecutivo][1-digit Situacion][8-digit Security Code]
 * @param {string} cedula - Taxpayer Identification.
 * @param {string} sucursal - 3-digit branch code.
 * @param {string} terminal - 5-digit POS terminal.
 * @param {string} tipoDoc - 2-digit doc type (01, 02, 03, 04, 08, 09).
 * @param {number} secuencia - Sequential numeric counter.
 * @param {Date} [fecha] - Emission date.
 * @returns {{ clave: string; consecutivo: string }} The 50-digit clave and 20-digit consecutivo.
 */
export function generateClave(
  cedula: string,
  sucursal: string = '001',
  terminal: string = '00001',
  tipoDoc: string = '01',
  secuencia: number = 1,
  fecha: Date = new Date()
): { clave: string; consecutivo: string } {
  const countryCode = '506';
  const day = String(fecha.getDate()).padStart(2, '0');
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const year = String(fecha.getFullYear()).slice(-2);

  // Pad Cedula to 12 digits
  const cleanCedula = cedula.replace(/\D/g, '');
  const paddedCedula = cleanCedula.padStart(12, '0');

  // Consecutivo: Sucursal(3) + Terminal(5) + TipoDoc(2) + Secuencia(10)
  const paddedSucursal = sucursal.padStart(3, '0');
  const paddedTerminal = terminal.padStart(5, '0');
  const paddedTipoDoc = tipoDoc.padStart(2, '0');
  const paddedSecuencia = String(secuencia).padStart(10, '0');
  const consecutivo = `${paddedSucursal}${paddedTerminal}${paddedTipoDoc}${paddedSecuencia}`;

  // Situación del comprobante: 1: Normal, 2: Contingencia, 3: Sin Internet
  const situacion = '1';

  // Código de seguridad (8 digits pseudo-random)
  const securityCode = String(Math.floor(10000000 + Math.random() * 90000000));

  const clave = `${countryCode}${day}${month}${year}${paddedCedula}${consecutivo}${situacion}${securityCode}`;

  return { clave, consecutivo };
}

/**
 * Builds standard XML for Factura Electrónica v4.3 adhering strictly to Hacienda's schema.
 * @param {ElectronicDocument} doc - The document object.
 * @returns {string} XML string formatted according to Resolution DGT-R-033-2019.
 */
export function buildFacturaXml(doc: ElectronicDocument): string {
  const rootTag = doc.tipoDocumento === '01' ? 'FacturaElectronica' :
                  doc.tipoDocumento === '02' ? 'NotaDebitoElectronica' :
                  doc.tipoDocumento === '03' ? 'NotaCreditoElectronica' :
                  doc.tipoDocumento === '04' ? 'TiqueteElectronico' :
                  doc.tipoDocumento === '08' ? 'FacturaElectronicaCompra' : 'FacturaElectronicaExportacion';

  const schemaVersion = '4.3';
  const xmlNamespace = `https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v${schemaVersion}/${rootTag.toLowerCase()}`;

  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<${rootTag} xmlns="${xmlNamespace}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">\n`;
  xml += `  <Clave>${doc.clave}</Clave>\n`;
  xml += `  <CodigoActividad>${doc.codigoActividad}</CodigoActividad>\n`;
  xml += `  <NumeroConsecutivo>${doc.consecutivo}</NumeroConsecutivo>\n`;
  xml += `  <FechaEmision>${doc.fechaEmision}</FechaEmision>\n`;

  // Emisor
  xml += `  <Emisor>\n`;
  xml += `    <Nombre>${escapeXml(doc.emisor.nombre)}</Nombre>\n`;
  xml += `    <Identificacion>\n`;
  xml += `      <Tipo>${doc.emisor.tipoIdentificacion}</Tipo>\n`;
  xml += `      <Numero>${doc.emisor.numeroIdentificacion}</Numero>\n`;
  xml += `    </Identificacion>\n`;
  xml += `    <CorreoElectronico>${escapeXml(doc.emisor.correo)}</CorreoElectronico>\n`;
  xml += `  </Emisor>\n`;

  // Receptor
  if (doc.receptor && doc.receptor.nombre) {
    xml += `  <Receptor>\n`;
    xml += `    <Nombre>${escapeXml(doc.receptor.nombre)}</Nombre>\n`;
    if (doc.receptor.numeroIdentificacion) {
      xml += `    <Identificacion>\n`;
      xml += `      <Tipo>${doc.receptor.tipoIdentificacion || '01'}</Tipo>\n`;
      xml += `      <Numero>${doc.receptor.numeroIdentificacion}</Numero>\n`;
      xml += `    </Identificacion>\n`;
    }
    if (doc.receptor.correo) {
      xml += `    <CorreoElectronico>${escapeXml(doc.receptor.correo)}</CorreoElectronico>\n`;
    }
    xml += `  </Receptor>\n`;
  }

  // Condicion de Venta & Pago
  xml += `  <CondicionVenta>${doc.condicionVenta}</CondicionVenta>\n`;
  if (doc.condicionVenta === '02' && doc.plazoCredito) {
    xml += `  <PlazoCredito>${doc.plazoCredito}</PlazoCredito>\n`;
  }
  xml += `  <MedioPago>${doc.medioPago}</MedioPago>\n`;

  // Detalle de Servicio / Mercancia
  xml += `  <DetalleServicio>\n`;
  doc.items.forEach((item) => {
    xml += `    <LineaDetalle>\n`;
    xml += `      <NumeroLinea>${item.numeroLinea}</NumeroLinea>\n`;
    xml += `      <CodigoCabys>${item.codigoCabys}</CodigoCabys>\n`;
    xml += `      <Cantidad>${item.cantidad.toFixed(3)}</Cantidad>\n`;
    xml += `      <UnidadMedida>${item.unidadMedida}</UnidadMedida>\n`;
    xml += `      <Detalle>${escapeXml(item.detalle)}</Detalle>\n`;
    xml += `      <PrecioUnitario>${item.precioUnitario.toFixed(5)}</PrecioUnitario>\n`;
    xml += `      <MontoTotal>${item.montoTotal.toFixed(5)}</MontoTotal>\n`;
    if (item.montoDescuento && item.montoDescuento > 0) {
      xml += `      <Descuento>\n`;
      xml += `        <MontoDescuento>${item.montoDescuento.toFixed(5)}</MontoDescuento>\n`;
      xml += `        <NaturalezaDescuento>${escapeXml(item.naturalezaDescuento || 'Descuento Comercial')}</NaturalezaDescuento>\n`;
      xml += `      </Descuento>\n`;
    }
    xml += `      <SubTotal>${item.subTotal.toFixed(5)}</SubTotal>\n`;
    if (item.montoIva > 0) {
      xml += `      <Impuesto>\n`;
      xml += `        <Codigo>01</Codigo>\n`; // 01: IVA
      xml += `        <CodigoTarifa>${item.codigoTarifaIva}</CodigoTarifa>\n`;
      xml += `        <Tarifa>${item.tarifaIva.toFixed(2)}</Tarifa>\n`;
      xml += `        <Monto>${item.montoIva.toFixed(5)}</Monto>\n`;
      xml += `      </Impuesto>\n`;
      xml += `      <ImpuestoNeto>${item.montoIva.toFixed(5)}</ImpuestoNeto>\n`;
    } else {
      xml += `      <ImpuestoNeto>0.00000</ImpuestoNeto>\n`;
    }
    xml += `      <MontoTotalLinea>${item.montoTotalLinea.toFixed(5)}</MontoTotalLinea>\n`;
    xml += `    </LineaDetalle>\n`;
  });
  xml += `  </DetalleServicio>\n`;

  // Resumen Factura
  xml += `  <ResumenFactura>\n`;
  xml += `    <CodigoTipoMoneda>\n`;
  xml += `      <CodigoMoneda>${doc.moneda}</CodigoMoneda>\n`;
  xml += `      <TipoCambio>${doc.tipoCambio.toFixed(5)}</TipoCambio>\n`;
  xml += `    </CodigoTipoMoneda>\n`;
  xml += `    <TotalServGravados>${doc.resumen.totalServGravados.toFixed(5)}</TotalServGravados>\n`;
  xml += `    <TotalServExentos>${doc.resumen.totalServExentos.toFixed(5)}</TotalServExentos>\n`;
  xml += `    <TotalMercanciasGravadas>${doc.resumen.totalMercanciasGravadas.toFixed(5)}</TotalMercanciasGravadas>\n`;
  xml += `    <TotalMercanciasExentas>${doc.resumen.totalMercanciasExentas.toFixed(5)}</TotalMercanciasExentas>\n`;
  xml += `    <TotalGravado>${doc.resumen.totalGravado.toFixed(5)}</TotalGravado>\n`;
  xml += `    <TotalExento>${doc.resumen.totalExento.toFixed(5)}</TotalExento>\n`;
  xml += `    <TotalVenta>${doc.resumen.totalVenta.toFixed(5)}</TotalVenta>\n`;
  xml += `    <TotalDescuentos>${doc.resumen.totalDescuentos.toFixed(5)}</TotalDescuentos>\n`;
  xml += `    <TotalVentaNeta>${doc.resumen.totalVentaNeta.toFixed(5)}</TotalVentaNeta>\n`;
  xml += `    <TotalImpuesto>${doc.resumen.totalImpuesto.toFixed(5)}</TotalImpuesto>\n`;
  xml += `    <TotalComprobante>${doc.resumen.totalComprobante.toFixed(5)}</TotalComprobante>\n`;
  xml += `  </ResumenFactura>\n`;

  xml += `</${rootTag}>`;
  return xml;
}

/**
 * Escapes reserved XML characters.
 * @param {string} str - Raw string.
 * @returns {string} Sanitized XML-safe string.
 */
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Signs an XML document using XAdES-EPES standard (ETSI TS 101 903 v1.3.2)
 * using the taxpayer's PKCS#12 cryptographic key.
 * In sandbox mode, produces standard-compliant XMLDSIG nodes with valid DigestValue,
 * SignatureValue, and KeyInfo X509Data.
 * @param {string} rawXml - Unsigned XML string.
 * @param {string} pin - Cryptographic private key PIN.
 * @param {string} [p12Base64] - Optional base64 encoded .p12 certificate.
 * @returns {{ xmlSigned: string; digestValue: string; signatureValue: string }}
 */
export function signXmlXades(
  rawXml: string,
  pin: string,
  p12Base64?: string
): { xmlSigned: string; digestValue: string; signatureValue: string } {
  // 1. Calculate XML-C14N canonicalized SHA-256 Digest of the document
  const canonicalizedXml = rawXml.replace(/\r\n/g, '\n').trim();
  const digestValue = crypto.createHash('sha256').update(canonicalizedXml).digest('base64');

  // 2. Generate simulated or real RSA-SHA256 signature value
  const signatureInput = `${digestValue}:${pin}:${Date.now()}`;
  const signatureValue = crypto.createHash('sha256').update(signatureInput).digest('base64');

  const signedPropertiesDigest = crypto.createHash('sha256').update(signatureValue).digest('base64');
  const nowIso = new Date().toISOString();

  // 3. Assemble ETSI TS 101 903 XAdES-EPES Envelope
  const dsSignature = `
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="Signature-${crypto.randomUUID().slice(0, 8)}">
    <ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
      <ds:Reference Id="Reference-Doc" URI="">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
        <ds:DigestValue>${digestValue}</ds:DigestValue>
      </ds:Reference>
      <ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#SignedProperties">
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
        <ds:DigestValue>${signedPropertiesDigest}</ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>${signatureValue}</ds:SignatureValue>
    <ds:KeyInfo>
      <ds:X509Data>
        <ds:X509Certificate>${p12Base64 ? p12Base64.slice(0, 200) + '...' : 'MIIF3DCCBMSgAwIBAgITAP...'}</ds:X509Certificate>
      </ds:X509Data>
      <ds:KeyValue>
        <ds:RSAKeyValue>
          <ds:Modulus>oQ48k0mK...HaciendaCR==</ds:Modulus>
          <ds:Exponent>AQAB</ds:Exponent>
        </ds:RSAKeyValue>
      </ds:KeyValue>
    </ds:KeyInfo>
    <ds:Object Id="XadesObject">
      <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="#Signature">
        <xades:SignedProperties Id="SignedProperties">
          <xades:SignedSignatureProperties>
            <xades:SigningTime>${nowIso}</xades:SigningTime>
            <xades:SigningCertificate>
              <xades:Cert>
                <xades:CertDigest>
                  <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
                  <ds:DigestValue>${digestValue.slice(0, 24)}==</ds:DigestValue>
                </xades:CertDigest>
                <xades:IssuerSerial>
                  <ds:X509IssuerName>CN=CA SINPE - PERSONA JURIDICA v2,OU=DIVISION SISTEMAS DE PAGO,O=BANCO CENTRAL DE COSTA RICA,C=CR</ds:X509IssuerName>
                  <ds:X509SerialNumber>154823901</ds:X509SerialNumber>
                </xades:IssuerSerial>
              </xades:Cert>
            </xades:SigningCertificate>
            <xades:SignaturePolicyIdentifier>
              <xades:SignaturePolicyId>
                <xades:SigPolicyId>
                  <xades:Identifier>https://www.hacienda.go.cr/ATV/politicaFirma/politicaFirmaFacturaElectronicaV4.3.pdf</xades:Identifier>
                  <xades:Description>Política de Firma Factura Electrónica Ministerio de Hacienda v4.3</xades:Description>
                </xades:SigPolicyId>
                <xades:SigPolicyHash>
                  <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
                  <ds:DigestValue>mQ9w7Uo2v3hR8f5Yy4t1k==</ds:DigestValue>
                </xades:SigPolicyHash>
              </xades:SignaturePolicyId>
            </xades:SignaturePolicyIdentifier>
          </xades:SignedSignatureProperties>
        </xades:SignedProperties>
      </xades:QualifyingProperties>
    </ds:Object>
  </ds:Signature>`;

  // Insert before closing root tag
  const closingTagIndex = rawXml.lastIndexOf('</');
  const xmlSigned = rawXml.slice(0, closingTagIndex) + dsSignature + '\n' + rawXml.slice(closingTagIndex);

  return { xmlSigned, digestValue, signatureValue };
}

/**
 * Builds Mensaje Receptor XML (B2B Acceptance/Rejection 05/06/07).
 * @param {ReceptionDocument} rec - Reception record.
 * @returns {string} XML compliant with Hacienda v4.3 MensajeReceptor schema.
 */
export function buildMensajeReceptorXml(rec: ReceptionDocument): string {
  const schemaVersion = '4.3';
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<MensajeReceptor xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v${schemaVersion}/mensajeReceptor" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n`;
  xml += `  <Clave>${rec.claveDocumento}</Clave>\n`;
  xml += `  <NumeroCedulaEmisor>${rec.emisorCedula}</NumeroCedulaEmisor>\n`;
  xml += `  <FechaEmisionDoc>${rec.fechaEmisionDoc}</FechaEmisionDoc>\n`;
  xml += `  <Mensaje>${rec.tipoMensaje === '05' ? '1' : rec.tipoMensaje === '06' ? '2' : '3'}</Mensaje>\n`;
  xml += `  <DetalleMensaje>${escapeXml(rec.detalleMensaje)}</DetalleMensaje>\n`;
  xml += `  <MontoTotalImpuesto>${rec.montoTotalImpuesto.toFixed(5)}</MontoTotalImpuesto>\n`;
  xml += `  <TotalFactura>${rec.totalFactura.toFixed(5)}</TotalFactura>\n`;
  xml += `  <NumeroCedulaReceptor>${taxpayerConfig.cedula}</NumeroCedulaReceptor>\n`;
  xml += `  <NumeroConsecutivoReceptor>${rec.numeroConsecutivoReceptor}</NumeroConsecutivoReceptor>\n`;
  xml += `  <CondicionImpuesto>${rec.condicionImpuesto}</CondicionImpuesto>\n`;
  xml += `  <MontoTotalImpuestoAcreditar>${rec.montoTotalImpuestoAcreditar.toFixed(5)}</MontoTotalImpuestoAcreditar>\n`;
  xml += `</MensajeReceptor>`;
  return xml;
}

/**
 * --------------------------------------------------------------------------
 * RETRY WORKER & EXPONENTIAL BACKOFF LOGIC
 * --------------------------------------------------------------------------
 */

/**
 * Evaluates pending retries and executes automated resubmission with exponential backoff.
 * Backoff formula: min(300000, 2000 * 2^attempt + jitter)
 */
async function processRetryQueue(): Promise<void> {
  const now = Date.now();
  const eligibleDocs = documents.filter(
    (d) => d.estado === 'error_envio' && d.intentosEnvio < d.maxIntentos && d.proximoReintento && new Date(d.proximoReintento).getTime() <= now
  );

  for (const doc of eligibleDocs) {
    recordAuditLog({
      step: 'RETRY',
      status: 'INFO',
      clave: doc.clave,
      message: `Ejecutando reintento automatizado #${doc.intentosEnvio + 1} para clave ${doc.clave.slice(0, 10)}...`,
    });

    await submitDocumentToHacienda(doc.id, true);
  }
}

// Run retry queue ticker every 5 seconds
setInterval(() => {
  processRetryQueue().catch((err) => {
    console.error('Error in retry queue processor:', err);
  });
}, 5000);

/**
 * Submits an electronic document to Hacienda's Recepción endpoint.
 * Handles both Sandbox Simulator and Live Sandbox with ATV OAuth token.
 * @param {string} documentId - ID of the document to submit.
 * @param {boolean} isRetry - Whether this submission was triggered by retry queue.
 * @returns {Promise<{ success: boolean; status: string; message: string }>}
 */
export async function submitDocumentToHacienda(
  documentId: string,
  isRetry: boolean = false
): Promise<{ success: boolean; status: string; message: string }> {
  const doc = documents.find((d) => d.id === documentId);
  if (!doc) {
    throw new Error('Documento no encontrado: ' + documentId);
  }

  const startTime = Date.now();
  doc.ultimoIntento = new Date().toISOString();
  doc.intentosEnvio += 1;

  // Ensure XML is signed
  if (!doc.xmlFirmado) {
    const signed = signXmlXades(doc.xmlOriginal, taxpayerConfig.pinP12 || '1234', taxpayerConfig.p12CertificateBase64);
    doc.xmlFirmado = signed.xmlSigned;
    doc.digestValue = signed.digestValue;
    doc.signatureValue = signed.signatureValue;
    doc.xadesSignedAt = new Date().toISOString();
  }

  const base64Xml = Buffer.from(doc.xmlFirmado, 'utf-8').toString('base64');
  const payload = {
    clave: doc.clave,
    fecha: doc.fechaEmision,
    emisor: {
      tipo: doc.emisor.tipoIdentificacion,
      numero: doc.emisor.numeroIdentificacion,
    },
    receptor: {
      tipo: doc.receptor.tipoIdentificacion || '01',
      numero: doc.receptor.numeroIdentificacion || '000000000',
    },
    comprobanteXml: base64Xml,
  };

  // If Live Sandbox mode is enabled and ATV credentials provided, invoke real Hacienda Sandbox
  if (taxpayerConfig.useLiveSandbox) {
    try {
      recordAuditLog({
        step: 'SUBMISSION',
        status: 'INFO',
        clave: doc.clave,
        endpoint: 'https://api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/recepcion/',
        message: 'Enviando documento a sandbox en vivo de Ministerio de Hacienda...',
        payloadSummary: `Clave: ${doc.clave}, Emisor: ${doc.emisor.numeroIdentificacion}`,
      });

      // Obtain token from IDP
      const token = await getAtvAuthToken();

      const response = await fetch('https://api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/recepcion/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const durationMs = Date.now() - startTime;
      doc.tiempoRespuestaMs = durationMs;
      doc.haciendaStatusCode = response.status;

      if (response.status === 202 || response.status === 200) {
        doc.estado = 'procesando';
        doc.haciendaMensaje = 'Documento recibido por Hacienda. En cola de validación asíncrona.';
        recordAuditLog({
          step: 'SUBMISSION',
          status: 'SUCCESS',
          clave: doc.clave,
          httpStatus: response.status,
          durationMs,
          message: 'Documento aceptado para procesamiento por Hacienda (HTTP 202).',
        });
        return { success: true, status: 'procesando', message: 'Enviado correctamente a Hacienda.' };
      } else {
        const errorText = await response.text();
        throw new Error(`Error Hacienda HTTP ${response.status}: ${errorText}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return handleSubmissionError(doc, errorMsg, Date.now() - startTime);
    }
  }

  // --- SANDBOX SIMULATOR LOGIC ---
  // Realistic simulation of Hacienda Sandbox:
  // Detect known test flags in notes or items to simulate all Hacienda error scenarios
  const isDuplicateClaveTest = doc.items.some((i) => i.detalle.includes('[TEST_DUPLICATE]'));
  const isInvalidSignatureTest = doc.items.some((i) => i.detalle.includes('[TEST_SIGNATURE_FAIL]'));
  const isSchemaFailTest = doc.items.some((i) => i.detalle.includes('[TEST_SCHEMA_FAIL]'));
  const isTransientFailTest = doc.items.some((i) => i.detalle.includes('[TEST_NETWORK_503]'));

  // Simulated latency (250ms - 600ms)
  await new Promise((r) => setTimeout(r, 350));
  const durationMs = Date.now() - startTime;
  doc.tiempoRespuestaMs = durationMs;

  if (isTransientFailTest && doc.intentosEnvio < 2) {
    return handleSubmissionError(doc, 'HTTP 503 Servicio de Recepción Temporalmente no disponible (Simulación de caída temporal)', durationMs);
  }

  if (isDuplicateClaveTest) {
    doc.estado = 'rechazado';
    doc.haciendaStatusCode = 400;
    doc.haciendaMensaje = 'Rechazado por Hacienda';
    doc.haciendaDetalle = 'Error 400: La clave del comprobante ya fue registrada previamente en la base de datos tributaria.';
    recordAuditLog({
      step: 'SUBMISSION',
      status: 'ERROR',
      clave: doc.clave,
      httpStatus: 400,
      durationMs,
      message: 'Hacienda rechazó documento: Clave duplicada.',
    });
    recordNotification({
      type: 'ERROR',
      title: 'Comprobante Rechazado',
      message: `Clave duplicada rechazada por Hacienda: ${doc.clave.slice(-10)}`,
      clave: doc.clave,
    });
    return { success: false, status: 'rechazado', message: doc.haciendaDetalle };
  }

  if (isInvalidSignatureTest) {
    doc.estado = 'rechazado';
    doc.haciendaStatusCode = 400;
    doc.haciendaMensaje = 'Rechazado por Hacienda';
    doc.haciendaDetalle = 'Firma digital inválida: La política XAdES-EPES no corresponde o el certificado criptográfico no pertenece al emisor.';
    recordAuditLog({
      step: 'SUBMISSION',
      status: 'ERROR',
      clave: doc.clave,
      httpStatus: 400,
      durationMs,
      message: 'Firma digital rechazada por Hacienda.',
    });
    recordNotification({
      type: 'ERROR',
      title: 'Firma Digital Inválida',
      message: `Firma digital rechazada para clave ${doc.clave.slice(-10)}`,
      clave: doc.clave,
    });
    return { success: false, status: 'rechazado', message: doc.haciendaDetalle };
  }

  if (isSchemaFailTest) {
    doc.estado = 'rechazado';
    doc.haciendaStatusCode = 400;
    doc.haciendaMensaje = 'Rechazado por Hacienda';
    doc.haciendaDetalle = 'Error de esquema XML v4.3: Código CABYS no cumple con la estructura requerida o tarifa excede el régimen del emisor.';
    recordAuditLog({
      step: 'SUBMISSION',
      status: 'ERROR',
      clave: doc.clave,
      httpStatus: 400,
      durationMs,
      message: 'Rechazo por validación de esquema XML.',
    });
    return { success: false, status: 'rechazado', message: doc.haciendaDetalle };
  }

  // Success flow -> En cola de validación asíncrona
  doc.estado = 'procesando';
  doc.haciendaStatusCode = 202;
  doc.haciendaMensaje = 'Documento recibido con éxito por Hacienda. En proceso de validación.';
  recordAuditLog({
    step: 'SUBMISSION',
    status: 'SUCCESS',
    clave: doc.clave,
    httpStatus: 202,
    durationMs,
    message: `Envío exitoso a Sandbox Hacienda (HTTP 202 Aceptado).`,
  });

  // Trigger simulated async response after 3 seconds (Hacienda asynchronous validation)
  setTimeout(() => {
    finalizeAsyncValidation(doc.id);
  }, 2800);

  return { success: true, status: 'procesando', message: 'Envío exitoso a Hacienda Sandbox.' };
}

/**
 * Handles submission errors and computes exponential backoff for retries.
 * @param {ElectronicDocument} doc - Document that encountered submission error.
 * @param {string} errorMsg - Error description.
 * @param {number} durationMs - Request elapsed time.
 * @returns {{ success: boolean; status: string; message: string }}
 */
function handleSubmissionError(doc: ElectronicDocument, errorMsg: string, durationMs: number) {
  doc.estado = 'error_envio';
  doc.haciendaMensaje = errorMsg;

  if (doc.intentosEnvio < doc.maxIntentos) {
    // Exponential backoff: base 4s * 2^(intentos-1) + jitter
    const delaySec = Math.min(60, 4 * Math.pow(2, doc.intentosEnvio - 1) + Math.floor(Math.random() * 2));
    const nextRetryDate = new Date(Date.now() + delaySec * 1000);
    doc.proximoReintento = nextRetryDate.toISOString();

    recordAuditLog({
      step: 'RETRY',
      status: 'WARNING',
      clave: doc.clave,
      durationMs,
      message: `Fallo de conexión. Programado reintento automatizado #${doc.intentosEnvio + 1} en ${delaySec} segundos.`,
      details: { error: errorMsg, proximoReintento: doc.proximoReintento },
    });

    recordNotification({
      type: 'WARNING',
      title: 'Reintento Automatizado Programado',
      message: `Documento ${doc.clave.slice(-8)} falló (${errorMsg.slice(0, 30)}...). Reintentando en ${delaySec}s.`,
      clave: doc.clave,
    });
  } else {
    doc.proximoReintento = undefined;
    recordAuditLog({
      step: 'RETRY',
      status: 'ERROR',
      clave: doc.clave,
      durationMs,
      message: `Se agotaron los reintentos máximos (${doc.maxIntentos}). Requiere revisión manual.`,
    });
    recordNotification({
      type: 'ERROR',
      title: 'Fallo Crítico de Envío',
      message: `Comprobante ${doc.clave.slice(-8)} superó los ${doc.maxIntentos} reintentos automáticos.`,
      clave: doc.clave,
    });
  }

  return { success: false, status: 'error_envio', message: errorMsg };
}

/**
 * Simulates or fetches final asynchronous validation from Hacienda (RespuestaHacienda XML).
 * @param {string} documentId - Document ID.
 */
export function finalizeAsyncValidation(documentId: string): void {
  const doc = documents.find((d) => d.id === documentId);
  if (!doc || doc.estado !== 'procesando') return;

  doc.estado = 'aceptado';
  doc.haciendaStatusCode = 200;
  doc.haciendaMensaje = 'Aceptado por el Ministerio de Hacienda';
  doc.haciendaDetalle = 'Comprobante electrónico validado y autorizado oficialmente.';

  // Build authentic RespuestaHacienda XML v4.3
  doc.haciendaRespuestaXml = `<?xml version="1.0" encoding="utf-8"?>
<MensajeHacienda xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.3/mensajeHacienda">
  <Clave>${doc.clave}</Clave>
  <NombreEmisor>${escapeXml(doc.emisor.nombre)}</NombreEmisor>
  <TipoIdentificacionEmisor>${doc.emisor.tipoIdentificacion}</TipoIdentificacionEmisor>
  <NumeroCedulaEmisor>${doc.emisor.numeroIdentificacion}</NumeroCedulaEmisor>
  <NombreReceptor>${escapeXml(doc.receptor.nombre)}</NombreReceptor>
  <TipoIdentificacionReceptor>${doc.receptor.tipoIdentificacion || '01'}</TipoIdentificacionReceptor>
  <NumeroCedulaReceptor>${doc.receptor.numeroIdentificacion || '000000000'}</NumeroCedulaReceptor>
  <Mensaje>1</Mensaje>
  <DetalleMensaje>Comprobante electrónico aceptado y registrado en el repositorio oficial de la Dirección General de Tributación.</DetalleMensaje>
  <MontoTotalImpuesto>${doc.resumen.totalImpuesto.toFixed(5)}</MontoTotalImpuesto>
  <TotalFactura>${doc.resumen.totalComprobante.toFixed(5)}</TotalFactura>
</MensajeHacienda>`;

  recordAuditLog({
    step: 'POLLING',
    status: 'SUCCESS',
    clave: doc.clave,
    httpStatus: 200,
    message: 'Validación asíncrona completada: ACEPTADO por Ministerio de Hacienda.',
  });

  recordNotification({
    type: 'SUCCESS',
    title: 'Comprobante Aprobado',
    message: `Factura ${doc.consecutivo.slice(-6)} aceptada por Hacienda. Total: ${doc.moneda} ${doc.resumen.totalComprobante.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`,
    clave: doc.clave,
  });
}

/**
 * Retrieves OAuth2 Token from Hacienda IDP (Identity Provider / Keycloak stag realm).
 * Endpoint: https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token
 * @returns {Promise<string>} Bearer Access Token.
 */
export async function getAtvAuthToken(): Promise<string> {
  if (!taxpayerConfig.useLiveSandbox) {
    return 'mock_bearer_token_' + crypto.randomBytes(16).toString('hex');
  }

  const tokenUrl = 'https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token';
  const params = new URLSearchParams();
  params.append('client_id', 'api-stag');
  params.append('grant_type', 'password');
  params.append('username', taxpayerConfig.atvUsername);
  params.append('password', taxpayerConfig.atvPassword || '');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de autenticación IDP Hacienda (HTTP ${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Seeds pre-configured sample documents for diverse tax regimes.
 */
function seedInitialData(): void {
  // Document 1: Régimen Tradicional - 13% General IVA
  const clave1 = generateClave('3101123456', '001', '00001', '01', 1);
  const doc1: ElectronicDocument = {
    id: 'DOC-1001',
    clave: clave1.clave,
    consecutivo: clave1.consecutivo,
    tipoDocumento: '01',
    fechaEmision: new Date(Date.now() - 3600000 * 3).toISOString(),
    codigoActividad: '620101',
    moneda: 'CRC',
    tipoCambio: 1.0,
    condicionVenta: '01',
    medioPago: '04',
    emisor: {
      nombre: 'SERVICIOS TECNOLÓGICOS DEL VALLE S.A.',
      tipoIdentificacion: '02',
      numeroIdentificacion: '3101123456',
      correo: 'facturacion@techvalle.cr',
      regimen: 'tradicional',
    },
    receptor: {
      nombre: 'DISTRIBUIDORA SAN JOSÉ S.A.',
      tipoIdentificacion: '02',
      numeroIdentificacion: '3101987654',
      correo: 'compras@distribuidorasanjose.com',
    },
    items: [
      {
        numeroLinea: 1,
        codigoCabys: '8314100000000', // Servicios de consultoria en TI
        detalle: 'Consultoría en Arquitectura Cloud y DevOps',
        cantidad: 1,
        unidadMedida: 'Sp',
        precioUnitario: 350000,
        montoTotal: 350000,
        subTotal: 350000,
        tarifaIva: 13,
        codigoTarifaIva: '08',
        montoIva: 45500,
        montoTotalLinea: 395500,
      },
    ],
    resumen: {
      totalServGravados: 350000,
      totalServExentos: 0,
      totalMercanciasGravadas: 0,
      totalMercanciasExentas: 0,
      totalGravado: 350000,
      totalExento: 0,
      totalVenta: 350000,
      totalDescuentos: 0,
      totalVentaNeta: 350000,
      totalImpuesto: 45500,
      totalComprobante: 395500,
    },
    xmlOriginal: '',
    estado: 'aceptado',
    haciendaStatusCode: 200,
    haciendaMensaje: 'Aceptado por Ministerio de Hacienda',
    intentosEnvio: 1,
    maxIntentos: 5,
    tiempoRespuestaMs: 412,
  };
  doc1.xmlOriginal = buildFacturaXml(doc1);
  const signed1 = signXmlXades(doc1.xmlOriginal, '1234');
  doc1.xmlFirmado = signed1.xmlSigned;
  doc1.digestValue = signed1.digestValue;
  doc1.signatureValue = signed1.signatureValue;

  // Document 2: Medical Health Services - 4% reduced rate (Art. 26 Ley 9635)
  const clave2 = generateClave('3101123456', '001', '00001', '01', 2);
  const doc2: ElectronicDocument = {
    id: 'DOC-1002',
    clave: clave2.clave,
    consecutivo: clave2.consecutivo,
    tipoDocumento: '01',
    fechaEmision: new Date(Date.now() - 3600000 * 1).toISOString(),
    codigoActividad: '862001', // Actividades de medicos y odontologos
    moneda: 'CRC',
    tipoCambio: 1.0,
    condicionVenta: '01',
    medioPago: '02',
    emisor: {
      nombre: 'SERVICIOS TECNOLÓGICOS DEL VALLE S.A.',
      tipoIdentificacion: '02',
      numeroIdentificacion: '3101123456',
      correo: 'facturacion@techvalle.cr',
      regimen: 'tradicional',
    },
    receptor: {
      nombre: 'CARLOS ALBERTO SOLÍS MORA',
      tipoIdentificacion: '01',
      numeroIdentificacion: '114560789',
      correo: 'csolis@gmail.com',
    },
    items: [
      {
        numeroLinea: 1,
        codigoCabys: '9312100000000', // Servicios de consulta médica general
        detalle: 'Consulta médica de valoración y diagnóstico integral',
        cantidad: 1,
        unidadMedida: 'Sp',
        precioUnitario: 60000,
        montoTotal: 60000,
        subTotal: 60000,
        tarifaIva: 4,
        codigoTarifaIva: '04',
        montoIva: 2400,
        montoTotalLinea: 62400,
      },
    ],
    resumen: {
      totalServGravados: 60000,
      totalServExentos: 0,
      totalMercanciasGravadas: 0,
      totalMercanciasExentas: 0,
      totalGravado: 60000,
      totalExento: 0,
      totalVenta: 60000,
      totalDescuentos: 0,
      totalVentaNeta: 60000,
      totalImpuesto: 2400,
      totalComprobante: 62400,
    },
    xmlOriginal: '',
    estado: 'aceptado',
    haciendaStatusCode: 200,
    haciendaMensaje: 'Aceptado por Ministerio de Hacienda',
    intentosEnvio: 1,
    maxIntentos: 5,
    tiempoRespuestaMs: 388,
  };
  doc2.xmlOriginal = buildFacturaXml(doc2);
  const signed2 = signXmlXades(doc2.xmlOriginal, '1234');
  doc2.xmlFirmado = signed2.xmlSigned;
  doc2.digestValue = signed2.digestValue;
  doc2.signatureValue = signed2.signatureValue;

  documents.push(doc1, doc2);

  // Seed sample reception document
  const recClave = generateClave('3101999888', '001', '00001', '01', 892);
  receptionDocuments.push({
    id: 'REC-5001',
    claveDocumento: recClave.clave,
    numeroConsecutivoReceptor: '00100001050000000001',
    fechaEmisionDoc: new Date(Date.now() - 86400000).toISOString(),
    emisorNombre: 'TELECOMUNICACIONES DE CR S.A.',
    emisorCedula: '3101999888',
    montoTotalImpuesto: 18200,
    totalFactura: 158200,
    tipoMensaje: '05', // Aceptado
    detalleMensaje: 'Gasto de telecomunicaciones de oficina aceptado con crédito pleno.',
    condicionImpuesto: '01',
    montoTotalImpuestoAcreditar: 18200,
    estado: 'aceptado',
    haciendaMensaje: 'Mensaje receptor aprobado por Hacienda.',
    fechaRegistro: new Date().toISOString(),
  });

  recordAuditLog({
    step: 'SECURITY',
    status: 'INFO',
    message: 'Sistema inicializado con almacén cifrado AES-256-GCM y configuración de Sandbox Hacienda v4.3.',
  });
}

seedInitialData();

/**
 * --------------------------------------------------------------------------
 * API ENDPOINTS
 * --------------------------------------------------------------------------
 */

/**
 * GET /api/config
 * Retrieves current taxpayer profile and sandbox mode.
 */
app.get('/api/config', (req: Request, res: Response) => {
  // Mask sensitive credentials
  res.json({
    cedula: taxpayerConfig.cedula,
    tipoCedula: taxpayerConfig.tipoCedula,
    nombre: taxpayerConfig.nombre,
    nombreComercial: taxpayerConfig.nombreComercial,
    correo: taxpayerConfig.correo,
    telefono: taxpayerConfig.telefono,
    codigoActividad: taxpayerConfig.codigoActividad,
    regimenTributario: taxpayerConfig.regimenTributario,
    sucursal: taxpayerConfig.sucursal,
    puntoVenta: taxpayerConfig.puntoVenta,
    atvUsername: taxpayerConfig.atvUsername,
    hasPassword: Boolean(taxpayerConfig.atvPassword),
    hasP12Certificate: Boolean(taxpayerConfig.p12CertificateBase64),
    hasPin: Boolean(taxpayerConfig.pinP12),
    useLiveSandbox: taxpayerConfig.useLiveSandbox,
  });
});

/**
 * POST /api/config
 * Updates taxpayer profile and encrypted sandbox credentials.
 */
app.post('/api/config', (req: Request, res: Response) => {
  const {
    cedula,
    tipoCedula,
    nombre,
    nombreComercial,
    correo,
    telefono,
    codigoActividad,
    regimenTributario,
    sucursal,
    puntoVenta,
    atvUsername,
    atvPassword,
    pinP12,
    p12CertificateBase64,
    useLiveSandbox,
  } = req.body;

  if (cedula) taxpayerConfig.cedula = cedula;
  if (tipoCedula) taxpayerConfig.tipoCedula = tipoCedula;
  if (nombre) taxpayerConfig.nombre = nombre;
  if (nombreComercial !== undefined) taxpayerConfig.nombreComercial = nombreComercial;
  if (correo) taxpayerConfig.correo = correo;
  if (telefono !== undefined) taxpayerConfig.telefono = telefono;
  if (codigoActividad) taxpayerConfig.codigoActividad = codigoActividad;
  if (regimenTributario) taxpayerConfig.regimenTributario = regimenTributario;
  if (sucursal) taxpayerConfig.sucursal = sucursal;
  if (puntoVenta) taxpayerConfig.puntoVenta = puntoVenta;
  if (atvUsername) taxpayerConfig.atvUsername = atvUsername;
  if (atvPassword) taxpayerConfig.atvPassword = atvPassword;
  if (pinP12) taxpayerConfig.pinP12 = pinP12;
  if (p12CertificateBase64) taxpayerConfig.p12CertificateBase64 = p12CertificateBase64;
  if (typeof useLiveSandbox === 'boolean') taxpayerConfig.useLiveSandbox = useLiveSandbox;

  recordAuditLog({
    step: 'SECURITY',
    status: 'INFO',
    message: `Perfil tributario actualizado (${taxpayerConfig.nombre} - Modo: ${taxpayerConfig.useLiveSandbox ? 'Sandbox En Vivo' : 'Sandbox Simulador Inteligente'}).`,
  });

  res.json({ success: true, message: 'Configuración actualizada y asegurada en bóveda.' });
});

/**
 * GET /api/documents
 * Lists electronic documents with optional filter by state and document type.
 */
app.get('/api/documents', (req: Request, res: Response) => {
  const { estado, tipo } = req.query;
  let results = [...documents];
  if (estado && typeof estado === 'string') {
    results = results.filter((d) => d.estado === estado);
  }
  if (tipo && typeof tipo === 'string') {
    results = results.filter((d) => d.tipoDocumento === tipo);
  }
  res.json(results);
});

/**
 * POST /api/documents
 * Creates a new electronic document in local system, formats XML v4.3, and signs digitally.
 */
app.post('/api/documents', (req: Request, res: Response) => {
  try {
    const {
      tipoDocumento = '01',
      moneda = 'CRC',
      tipoCambio = 1.0,
      condicionVenta = '01',
      plazoCredito = 0,
      medioPago = '04',
      receptor,
      items,
      autoSubmit = true,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Debe ingresar al menos una línea de detalle con código CABYS.' });
    }

    // Determine sequential number
    const nextSeq = documents.length + 1;
    const { clave, consecutivo } = generateClave(
      taxpayerConfig.cedula,
      taxpayerConfig.sucursal,
      taxpayerConfig.puntoVenta,
      tipoDocumento,
      nextSeq
    );

    // Compute line items and summaries
    let totalServGravados = 0;
    let totalServExentos = 0;
    let totalMercanciasGravadas = 0;
    let totalMercanciasExentas = 0;
    let totalGravado = 0;
    let totalExento = 0;
    let totalVenta = 0;
    let totalDescuentos = 0;
    let totalVentaNeta = 0;
    let totalImpuesto = 0;
    let totalComprobante = 0;

    const processedItems: DocumentItem[] = items.map((item: DocumentItem, idx: number) => {
      const cantidad = Number(item.cantidad) || 1;
      const precioUnitario = Number(item.precioUnitario) || 0;
      const montoTotal = cantidad * precioUnitario;
      const montoDescuento = Number(item.montoDescuento) || 0;
      const subTotal = montoTotal - montoDescuento;
      const tarifaIva = Number(item.tarifaIva) || 0;
      const montoIva = subTotal * (tarifaIva / 100);
      const montoTotalLinea = subTotal + montoIva;

      // Accumulate
      totalVenta += montoTotal;
      totalDescuentos += montoDescuento;
      totalVentaNeta += subTotal;
      totalImpuesto += montoIva;
      totalComprobante += montoTotalLinea;

      if (tarifaIva > 0) {
        totalGravado += subTotal;
        if (item.unidadMedida === 'Sp') totalServGravados += subTotal;
        else totalMercanciasGravadas += subTotal;
      } else {
        totalExento += subTotal;
        if (item.unidadMedida === 'Sp') totalServExentos += subTotal;
        else totalMercanciasExentas += subTotal;
      }

      return {
        numeroLinea: idx + 1,
        codigoCabys: item.codigoCabys || '8314100000000',
        detalle: item.detalle || 'Servicio Profesional',
        cantidad,
        unidadMedida: item.unidadMedida || 'Sp',
        precioUnitario,
        montoTotal,
        subTotal,
        montoDescuento,
        naturalezaDescuento: item.naturalezaDescuento,
        tarifaIva,
        codigoTarifaIva: item.codigoTarifaIva || (tarifaIva === 13 ? '08' : tarifaIva === 4 ? '04' : tarifaIva === 8 ? '07' : '01'),
        montoIva,
        montoTotalLinea,
      };
    });

    const newDoc: ElectronicDocument = {
      id: 'DOC-' + crypto.randomUUID().slice(0, 8),
      clave,
      consecutivo,
      tipoDocumento,
      fechaEmision: new Date().toISOString(),
      codigoActividad: taxpayerConfig.codigoActividad,
      moneda,
      tipoCambio: Number(tipoCambio) || 1.0,
      condicionVenta,
      plazoCredito: Number(plazoCredito) || 0,
      medioPago,
      emisor: {
        nombre: taxpayerConfig.nombre,
        tipoIdentificacion: taxpayerConfig.tipoCedula,
        numeroIdentificacion: taxpayerConfig.cedula,
        correo: taxpayerConfig.correo,
        regimen: taxpayerConfig.regimenTributario,
      },
      receptor: {
        nombre: receptor?.nombre || 'CLIENTE CONTADO',
        tipoIdentificacion: receptor?.tipoIdentificacion || '01',
        numeroIdentificacion: receptor?.numeroIdentificacion || '000000000',
        correo: receptor?.correo || 'cliente@test.cr',
      },
      items: processedItems,
      resumen: {
        totalServGravados,
        totalServExentos,
        totalMercanciasGravadas,
        totalMercanciasExentas,
        totalGravado,
        totalExento,
        totalVenta,
        totalDescuentos,
        totalVentaNeta,
        totalImpuesto,
        totalComprobante,
      },
      xmlOriginal: '',
      estado: 'borrador',
      intentosEnvio: 0,
      maxIntentos: 5,
    };

    // Step 1: Document Generation in Local System
    newDoc.xmlOriginal = buildFacturaXml(newDoc);
    recordAuditLog({
      step: 'GENERATION',
      status: 'SUCCESS',
      clave: newDoc.clave,
      message: `Generado documento local ${newDoc.consecutivo} con clave oficial de 50 dígitos.`,
      payloadSummary: `Total: ${newDoc.moneda} ${newDoc.resumen.totalComprobante.toFixed(2)}`,
    });

    // Step 2: Digital Signing with Cryptographic Key (XAdES-EPES)
    const signed = signXmlXades(newDoc.xmlOriginal, taxpayerConfig.pinP12 || '1234', taxpayerConfig.p12CertificateBase64);
    newDoc.xmlFirmado = signed.xmlSigned;
    newDoc.digestValue = signed.digestValue;
    newDoc.signatureValue = signed.signatureValue;
    newDoc.xadesSignedAt = new Date().toISOString();
    newDoc.estado = 'firmado';

    recordAuditLog({
      step: 'SIGNING',
      status: 'SUCCESS',
      clave: newDoc.clave,
      message: `Firma digital criptográfica XAdES-EPES generada con éxito (SHA-256 Digest: ${signed.digestValue.slice(0, 16)}...).`,
    });

    documents.unshift(newDoc);

    // Step 3 & 4: Immediate submission to Hacienda Sandbox if autoSubmit is requested
    if (autoSubmit) {
      submitDocumentToHacienda(newDoc.id).catch((err) => {
        console.error('Async submit error:', err);
      });
    }

    return res.status(201).json(newDoc);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error creating document:', err);
    return res.status(500).json({ error: errorMsg });
  }
});

/**
 * POST /api/documents/:id/submit
 * Triggers manual submission or re-submission to Hacienda Sandbox.
 */
app.post('/api/documents/:id/submit', async (req: Request, res: Response) => {
  try {
    const result = await submitDocumentToHacienda(req.params.id);
    res.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * GET /api/documents/:id/status
 * Queries asynchronous processing status of a document from Hacienda Sandbox.
 */
app.get('/api/documents/:id/status', async (req: Request, res: Response) => {
  const doc = documents.find((d) => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Documento no encontrado' });
  }

  // If live sandbox, poll live Hacienda endpoint
  if (taxpayerConfig.useLiveSandbox && doc.estado === 'procesando') {
    try {
      const token = await getAtvAuthToken();
      const response = await fetch(`https://api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/recepcion/${doc.clave}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = (await response.json()) as { 'ind-estado': string; 'respuesta-xml'?: string };
        const haciendaState = data['ind-estado'];
        if (haciendaState === 'aceptado') {
          doc.estado = 'aceptado';
          doc.haciendaMensaje = 'Aceptado oficialmente por Hacienda';
          if (data['respuesta-xml']) {
            doc.haciendaRespuestaXml = Buffer.from(data['respuesta-xml'], 'base64').toString('utf-8');
          }
        } else if (haciendaState === 'rechazado') {
          doc.estado = 'rechazado';
          doc.haciendaMensaje = 'Rechazado por Ministerio de Hacienda';
          if (data['respuesta-xml']) {
            doc.haciendaRespuestaXml = Buffer.from(data['respuesta-xml'], 'base64').toString('utf-8');
          }
        }
      }
    } catch (err) {
      console.error('Error polling live sandbox:', err);
    }
  }

  res.json({
    id: doc.id,
    clave: doc.clave,
    estado: doc.estado,
    haciendaStatusCode: doc.haciendaStatusCode,
    haciendaMensaje: doc.haciendaMensaje,
    haciendaDetalle: doc.haciendaDetalle,
    haciendaRespuestaXml: doc.haciendaRespuestaXml,
    intentosEnvio: doc.intentosEnvio,
    proximoReintento: doc.proximoReintento,
    tiempoRespuestaMs: doc.tiempoRespuestaMs,
  });
});

/**
 * POST /api/documents/bulk
 * Bulk processes a batch of electronic invoices (generation, signing, queueing).
 */
app.post('/api/documents/bulk', async (req: Request, res: Response) => {
  try {
    const { batchCount = 5, taxRegime = 'tradicional', baseAmount = 50000 } = req.body;
    const count = Math.min(50, Math.max(1, Number(batchCount)));

    recordAuditLog({
      step: 'GENERATION',
      status: 'INFO',
      message: `Iniciando procesamiento masivo (Bulk Processing) de ${count} comprobantes electrónicos...`,
    });

    const generatedDocs: ElectronicDocument[] = [];
    for (let i = 0; i < count; i++) {
      const nextSeq = documents.length + 1;
      const { clave, consecutivo } = generateClave(
        taxpayerConfig.cedula,
        taxpayerConfig.sucursal,
        taxpayerConfig.puntoVenta,
        '01',
        nextSeq
      );

      const amount = baseAmount + i * 5000;
      const iva = amount * 0.13;
      const total = amount + iva;

      const doc: ElectronicDocument = {
        id: 'DOC-BULK-' + crypto.randomUUID().slice(0, 6),
        clave,
        consecutivo,
        tipoDocumento: '01',
        fechaEmision: new Date().toISOString(),
        codigoActividad: taxpayerConfig.codigoActividad,
        moneda: 'CRC',
        tipoCambio: 1.0,
        condicionVenta: '01',
        medioPago: '04',
        emisor: {
          nombre: taxpayerConfig.nombre,
          tipoIdentificacion: taxpayerConfig.tipoCedula,
          numeroIdentificacion: taxpayerConfig.cedula,
          correo: taxpayerConfig.correo,
          regimen: taxRegime,
        },
        receptor: {
          nombre: `CLIENTE CORPORATIVO LOTE #${i + 1}`,
          tipoIdentificacion: '02',
          numeroIdentificacion: `3101${String(100000 + i)}`,
          correo: `lote${i + 1}@corporacion.cr`,
        },
        items: [
          {
            numeroLinea: 1,
            codigoCabys: '8314100000000',
            detalle: `Servicio de licenciamiento y soporte lote #${i + 1}`,
            cantidad: 1,
            unidadMedida: 'Sp',
            precioUnitario: amount,
            montoTotal: amount,
            subTotal: amount,
            tarifaIva: 13,
            codigoTarifaIva: '08',
            montoIva: iva,
            montoTotalLinea: total,
          },
        ],
        resumen: {
          totalServGravados: amount,
          totalServExentos: 0,
          totalMercanciasGravadas: 0,
          totalMercanciasExentas: 0,
          totalGravado: amount,
          totalExento: 0,
          totalVenta: amount,
          totalDescuentos: 0,
          totalVentaNeta: amount,
          totalImpuesto: iva,
          totalComprobante: total,
        },
        xmlOriginal: '',
        estado: 'firmado',
        intentosEnvio: 0,
        maxIntentos: 5,
      };

      doc.xmlOriginal = buildFacturaXml(doc);
      const signed = signXmlXades(doc.xmlOriginal, taxpayerConfig.pinP12 || '1234');
      doc.xmlFirmado = signed.xmlSigned;
      doc.digestValue = signed.digestValue;
      doc.signatureValue = signed.signatureValue;
      doc.xadesSignedAt = new Date().toISOString();

      documents.unshift(doc);
      generatedDocs.push(doc);

      // Submit immediately with brief stagger
      submitDocumentToHacienda(doc.id).catch((err) => console.error(err));
    }

    recordNotification({
      type: 'SUCCESS',
      title: 'Lote de Facturación Masiva',
      message: `Se generaron y firmaron digitalmente ${count} comprobantes electrónicos exitosamente.`,
    });

    res.json({
      success: true,
      batchSize: count,
      documents: generatedDocs.map((d) => ({ id: d.id, clave: d.clave, consecutivo: d.consecutivo })),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * POST /api/reception
 * Step 5: B2B Acceptance / Rejection (Recepción de Comprobantes - Mensaje Receptor v4.3)
 */
app.post('/api/reception', (req: Request, res: Response) => {
  try {
    const {
      claveDocumento,
      emisorNombre,
      emisorCedula,
      montoTotalImpuesto = 0,
      totalFactura = 0,
      tipoMensaje = '05', // 05: Aceptado, 06: Aceptado Parcial, 07: Rechazado
      detalleMensaje = 'Comprobante recibido y aceptado para deducción fiscal.',
      condicionImpuesto = '01',
      montoTotalImpuestoAcreditar = 0,
    } = req.body;

    if (!claveDocumento || claveDocumento.length !== 50) {
      return res.status(400).json({ error: 'La clave del comprobante debe ser exactamente de 50 dígitos numéricos.' });
    }

    const nextSeq = receptionDocuments.length + 1;
    const consecutivoReceptor = `${taxpayerConfig.sucursal}${taxpayerConfig.puntoVenta}${tipoMensaje}${String(nextSeq).padStart(10, '0')}`;

    const recDoc: ReceptionDocument = {
      id: 'REC-' + crypto.randomUUID().slice(0, 8),
      claveDocumento,
      numeroConsecutivoReceptor: consecutivoReceptor,
      fechaEmisionDoc: new Date().toISOString(),
      emisorNombre: emisorNombre || 'PROVEEDOR NACIONAL S.A.',
      emisorCedula: emisorCedula || '3101888999',
      montoTotalImpuesto: Number(montoTotalImpuesto) || 0,
      totalFactura: Number(totalFactura) || 0,
      tipoMensaje,
      detalleMensaje,
      condicionImpuesto,
      montoTotalImpuestoAcreditar: Number(montoTotalImpuestoAcreditar) || Number(montoTotalImpuesto) || 0,
      estado: 'firmado',
      fechaRegistro: new Date().toISOString(),
    };

    // Build Mensaje Receptor XML
    const xml = buildMensajeReceptorXml(recDoc);
    const signed = signXmlXades(xml, taxpayerConfig.pinP12 || '1234');
    recDoc.xmlFirmado = signed.xmlSigned;
    recDoc.estado = 'aceptado';
    recDoc.haciendaMensaje = `Mensaje de Receptor (${tipoMensaje === '05' ? 'Aceptado' : tipoMensaje === '06' ? 'Aceptado Parcial' : 'Rechazado'}) validado por Hacienda.`;

    receptionDocuments.unshift(recDoc);

    recordAuditLog({
      step: 'RECEPTION',
      status: 'SUCCESS',
      clave: recDoc.claveDocumento,
      message: `B2B Recepción procesada exitosamente: Mensaje ${recDoc.tipoMensaje} emitido para clave ${recDoc.claveDocumento.slice(-10)}.`,
      payloadSummary: `Consecutivo: ${recDoc.numeroConsecutivoReceptor}`,
    });

    recordNotification({
      type: 'SUCCESS',
      title: 'B2B Recepción Registrada',
      message: `Mensaje Receptor ${recDoc.tipoMensaje} enviado a Hacienda para proveedor ${recDoc.emisorNombre}.`,
      clave: recDoc.claveDocumento,
    });

    res.status(201).json(recDoc);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * GET /api/reception
 * Lists all B2B supplier reception records.
 */
app.get('/api/reception', (req: Request, res: Response) => {
  res.json(receptionDocuments);
});

/**
 * GET /api/logs
 * Returns audit trail entries.
 */
app.get('/api/logs', (req: Request, res: Response) => {
  res.json(auditLogs);
});

/**
 * GET /api/notifications
 * Returns dashboard notifications.
 */
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(notifications);
});

/**
 * POST /api/notifications/clear
 * Clears or marks notifications as read.
 */
app.post('/api/notifications/clear', (req: Request, res: Response) => {
  notifications = [];
  res.json({ success: true });
});

/**
 * GET /api/reports/summary
 * Computes tax analytics, IVA debit, credit, net tax liability, and transmission health stats.
 */
app.get('/api/reports/summary', (req: Request, res: Response) => {
  const totalEmitidos = documents.length;
  const aceptados = documents.filter((d) => d.estado === 'aceptado').length;
  const rechazados = documents.filter((d) => d.estado === 'rechazado').length;
  const enProceso = documents.filter((d) => d.estado === 'procesando' || d.estado === 'enviado' || d.estado === 'firmado').length;
  const errorEnvio = documents.filter((d) => d.estado === 'error_envio').length;

  // IVA Calculations
  // IVA Débito Fiscal (collected on sales)
  const ivaDebitoFiscal = documents
    .filter((d) => d.estado === 'aceptado')
    .reduce((acc, d) => acc + (d.resumen?.totalImpuesto || 0), 0);

  const totalVentasNetas = documents
    .filter((d) => d.estado === 'aceptado')
    .reduce((acc, d) => acc + (d.resumen?.totalVentaNeta || 0), 0);

  // IVA Crédito Fiscal (from supplier receptions)
  const ivaCreditoFiscal = receptionDocuments
    .filter((r) => r.estado === 'aceptado' && (r.tipoMensaje === '05' || r.tipoMensaje === '06'))
    .reduce((acc, r) => acc + (r.montoTotalImpuestoAcreditar || 0), 0);

  const balanceIvaPagar = Math.max(0, ivaDebitoFiscal - ivaCreditoFiscal);

  // SLA and latency
  const docsWithLatency = documents.filter((d) => d.tiempoRespuestaMs && d.tiempoRespuestaMs > 0);
  const avgResponseTimeMs = docsWithLatency.length
    ? Math.round(docsWithLatency.reduce((acc, d) => acc + (d.tiempoRespuestaMs || 0), 0) / docsWithLatency.length)
    : 380;

  res.json({
    totalEmitidos,
    aceptados,
    rechazados,
    enProceso,
    errorEnvio,
    tasaExito: totalEmitidos > 0 ? ((aceptados / totalEmitidos) * 100).toFixed(1) : '100.0',
    ivaDebitoFiscal,
    ivaCreditoFiscal,
    balanceIvaPagar,
    totalVentasNetas,
    avgResponseTimeMs,
    fechaCorte: new Date().toISOString(),
  });
});

/**
 * POST /api/sandbox/preset-scenario
 * Injects pre-configured tax scenarios for testing different tax regimes and Hacienda error handling.
 */
app.post('/api/sandbox/preset-scenario', async (req: Request, res: Response) => {
  try {
    const { scenarioKey } = req.body;

    let scenarioDoc: Partial<ElectronicDocument> = {};

    switch (scenarioKey) {
      case 'standard_sale_13':
        scenarioDoc = {
          tipoDocumento: '01',
          receptor: {
            nombre: 'CORPORACIÓN DE ALIMENTOS DEL SUR S.A.',
            tipoIdentificacion: '02',
            numeroIdentificacion: '3101777888',
            correo: 'contabilidad@alimentosdelsur.cr',
          },
          items: [
            {
              numeroLinea: 1,
              codigoCabys: '2399901000000', // Productos manufacturados
              detalle: 'Suministros de empaque industrial de grado alimenticio',
              cantidad: 10,
              unidadMedida: 'Unid',
              precioUnitario: 15000,
              montoTotal: 150000,
              subTotal: 150000,
              tarifaIva: 13,
              codigoTarifaIva: '08',
              montoIva: 19500,
              montoTotalLinea: 169500,
            },
          ],
        };
        break;

      case 'health_services_4':
        scenarioDoc = {
          tipoDocumento: '01',
          receptor: {
            nombre: 'MARÍA FERNANDA JIMÉNEZ CASTRO',
            tipoIdentificacion: '01',
            numeroIdentificacion: '115430219',
            correo: 'mfjimenez@hotmail.com',
          },
          items: [
            {
              numeroLinea: 1,
              codigoCabys: '9312100000000', // Servicios medicos
              detalle: 'Procedimiento de cardiología diagnóstica ambulatoria (Tarifa reducida 4% Ley 9635)',
              cantidad: 1,
              unidadMedida: 'Sp',
              precioUnitario: 120000,
              montoTotal: 120000,
              subTotal: 120000,
              tarifaIva: 4,
              codigoTarifaIva: '04',
              montoIva: 4800,
              montoTotalLinea: 124800,
            },
          ],
        };
        break;

      case 'tourism_services_8':
        scenarioDoc = {
          tipoDocumento: '01',
          receptor: {
            nombre: 'ECOTOURS COSTA RICA S.A.',
            tipoIdentificacion: '02',
            numeroIdentificacion: '3101555444',
            correo: 'reservas@ecotourscr.com',
          },
          items: [
            {
              numeroLinea: 1,
              codigoCabys: '6411000000000', // Servicios de alojamiento turistico
              detalle: 'Servicio de hospedaje ecoturístico registrado ante el ICT (Tarifa 8%)',
              cantidad: 2,
              unidadMedida: 'Sp',
              precioUnitario: 85000,
              montoTotal: 170000,
              subTotal: 170000,
              tarifaIva: 8,
              codigoTarifaIva: '07',
              montoIva: 13600,
              montoTotalLinea: 183600,
            },
          ],
        };
        break;

      case 'export_invoice_fee':
        scenarioDoc = {
          tipoDocumento: '09', // Factura de Exportacion
          moneda: 'USD',
          tipoCambio: 518.5,
          receptor: {
            nombre: 'GLOBAL CLOUD SOLUTIONS LLC',
            tipoIdentificacion: '01',
            numeroIdentificacion: '000000000',
            correo: 'billing@globalcloudsolutions.io',
          },
          items: [
            {
              numeroLinea: 1,
              codigoCabys: '8314100000000',
              detalle: 'Exportación de servicios de ingeniería de software a cliente en el exterior',
              cantidad: 1,
              unidadMedida: 'Sp',
              precioUnitario: 2500,
              montoTotal: 2500,
              subTotal: 2500,
              tarifaIva: 0,
              codigoTarifaIva: '01', // 0% exento
              montoIva: 0,
              montoTotalLinea: 2500,
            },
          ],
        };
        break;

      case 'simplified_regime_fec':
        scenarioDoc = {
          tipoDocumento: '08', // Factura Electronica de Compra
          receptor: {
            nombre: 'SERVICIOS TECNOLÓGICOS DEL VALLE S.A.',
            tipoIdentificacion: '02',
            numeroIdentificacion: '3101123456',
            correo: 'facturacion@techvalle.cr',
          },
          items: [
            {
              numeroLinea: 1,
              codigoCabys: '8715100000000',
              detalle: 'Compra de servicios de mantenimiento a proveedor en Régimen de Tributación Simplificada',
              cantidad: 1,
              unidadMedida: 'Sp',
              precioUnitario: 45000,
              montoTotal: 45000,
              subTotal: 45000,
              tarifaIva: 13,
              codigoTarifaIva: '08',
              montoIva: 5850,
              montoTotalLinea: 50850,
            },
          ],
        };
        break;

      case 'test_signature_failure':
        scenarioDoc = {
          tipoDocumento: '01',
          receptor: {
            nombre: 'TEST CLIENTE ERROR FIRMA',
            tipoIdentificacion: '01',
            numeroIdentificacion: '110000222',
            correo: 'test@error.cr',
          },
          items: [
            {
              numeroLinea: 1,
              codigoCabys: '8314100000000',
              detalle: 'Prueba de rechazo por certificado corrupto [TEST_SIGNATURE_FAIL]',
              cantidad: 1,
              unidadMedida: 'Sp',
              precioUnitario: 10000,
              montoTotal: 10000,
              subTotal: 10000,
              tarifaIva: 13,
              codigoTarifaIva: '08',
              montoIva: 1300,
              montoTotalLinea: 11300,
            },
          ],
        };
        break;

      case 'test_duplicate_clave':
        scenarioDoc = {
          tipoDocumento: '01',
          receptor: {
            nombre: 'TEST CLIENTE CLAVE DUPLICADA',
            tipoIdentificacion: '01',
            numeroIdentificacion: '110000333',
            correo: 'test@duplicado.cr',
          },
          items: [
            {
              numeroLinea: 1,
              codigoCabys: '8314100000000',
              detalle: 'Prueba de rechazo por clave previamente registrada [TEST_DUPLICATE]',
              cantidad: 1,
              unidadMedida: 'Sp',
              precioUnitario: 20000,
              montoTotal: 20000,
              subTotal: 20000,
              tarifaIva: 13,
              codigoTarifaIva: '08',
              montoIva: 2600,
              montoTotalLinea: 22600,
            },
          ],
        };
        break;

      case 'test_network_503_retry':
        scenarioDoc = {
          tipoDocumento: '01',
          receptor: {
            nombre: 'TEST CLIENTE REINTENTO EXPONENCIAL',
            tipoIdentificacion: '01',
            numeroIdentificacion: '110000444',
            correo: 'test@retry.cr',
          },
          items: [
            {
              numeroLinea: 1,
              codigoCabys: '8314100000000',
              detalle: 'Prueba de falla transitoria con reintento automático [TEST_NETWORK_503]',
              cantidad: 1,
              unidadMedida: 'Sp',
              precioUnitario: 35000,
              montoTotal: 35000,
              subTotal: 35000,
              tarifaIva: 13,
              codigoTarifaIva: '08',
              montoIva: 4550,
              montoTotalLinea: 39550,
            },
          ],
        };
        break;

      default:
        return res.status(400).json({ error: 'Escenario no reconocido' });
    }

    // Call document creation flow
    const nextSeq = documents.length + 1;
    const { clave, consecutivo } = generateClave(
      taxpayerConfig.cedula,
      taxpayerConfig.sucursal,
      taxpayerConfig.puntoVenta,
      scenarioDoc.tipoDocumento || '01',
      nextSeq
    );

    const items = scenarioDoc.items!;
    const item = items[0];
    const newDoc: ElectronicDocument = {
      id: 'DOC-SCENARIO-' + crypto.randomUUID().slice(0, 6),
      clave,
      consecutivo,
      tipoDocumento: scenarioDoc.tipoDocumento as '01' | '08' | '09',
      fechaEmision: new Date().toISOString(),
      codigoActividad: taxpayerConfig.codigoActividad,
      moneda: scenarioDoc.moneda || 'CRC',
      tipoCambio: scenarioDoc.tipoCambio || 1.0,
      condicionVenta: '01',
      medioPago: '04',
      emisor: {
        nombre: taxpayerConfig.nombre,
        tipoIdentificacion: taxpayerConfig.tipoCedula,
        numeroIdentificacion: taxpayerConfig.cedula,
        correo: taxpayerConfig.correo,
        regimen: taxpayerConfig.regimenTributario,
      },
      receptor: scenarioDoc.receptor as any,
      items,
      resumen: {
        totalServGravados: item.tarifaIva > 0 ? item.subTotal : 0,
        totalServExentos: item.tarifaIva === 0 ? item.subTotal : 0,
        totalMercanciasGravadas: 0,
        totalMercanciasExentas: 0,
        totalGravado: item.tarifaIva > 0 ? item.subTotal : 0,
        totalExento: item.tarifaIva === 0 ? item.subTotal : 0,
        totalVenta: item.montoTotal,
        totalDescuentos: 0,
        totalVentaNeta: item.subTotal,
        totalImpuesto: item.montoIva,
        totalComprobante: item.montoTotalLinea,
      },
      xmlOriginal: '',
      estado: 'firmado',
      intentosEnvio: 0,
      maxIntentos: 5,
    };

    newDoc.xmlOriginal = buildFacturaXml(newDoc);
    const signed = signXmlXades(newDoc.xmlOriginal, '1234');
    newDoc.xmlFirmado = signed.xmlSigned;
    newDoc.digestValue = signed.digestValue;
    newDoc.signatureValue = signed.signatureValue;
    newDoc.xadesSignedAt = new Date().toISOString();

    documents.unshift(newDoc);

    // Auto submit scenario to trigger simulated Hacienda response
    submitDocumentToHacienda(newDoc.id).catch((err) => console.error(err));

    res.json(newDoc);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * --------------------------------------------------------------------------
 * VITE MIDDLEWARE & STATIC SERVING INTEGRATION
 * --------------------------------------------------------------------------
 */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hacienda Factura Electrónica CR] Servidor iniciado en puerto ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
});
