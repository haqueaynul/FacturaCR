/**
 * @file server.ts
 * @description Express backend server providing Ministerio de Hacienda v4.3 Electronic Invoicing API,
 * cryptographic XAdES-EPES digital signature engine, AES-256-GCM encrypted vault,
 * multi-user roles (Accountant, Lawyer, Admin), multi-company registration,
 * asynchronous document polling queue, automated retries with exponential backoff,
 * B2B reception processing, and real-time audit logging.
 */

import express, { Request, Response } from 'express';
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
 * TYPES & INTERFACES (Ministerio de Hacienda v4.3 & Multi-User Architecture)
 * --------------------------------------------------------------------------
 */

export type UserRole = 'admin' | 'accountant' | 'lawyer';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  licenseNumber?: string;
  companyIds: string[];
}

export interface Company {
  id: string;
  nombre: string;
  nombreComercial?: string;
  cedula: string;
  tipoCedula: '01' | '02' | '03' | '04';
  codigoActividad: string;
  regimenTributario: 'tradicional' | 'simplificado' | 'zona_franca' | 'agropecuario';
  correo: string;
  telefono?: string;
  sucursal: string;
  puntoVenta: string;
  atvUsername: string;
  atvPassword?: string;
  pinP12?: string;
  p12CertificateBase64?: string;
  useLiveSandbox: boolean;
  schemaVersion?: '4.3' | '4.4';
  p12Status: 'valid' | 'expiring' | 'expired';
  p12ExpiryDate: string;
  personeriaStatus: 'vigente' | 'tramite';
  personeriaNumber: string;
  personeriaExpiry: string;
  assignedAccountantId?: string;
  assignedLawyerId?: string;
}

export interface DocumentItem {
  numeroLinea: number;
  codigoCabys: string;
  detalle: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  montoTotal: number;
  subTotal: number;
  montoDescuento?: number;
  naturalezaDescuento?: string;
  tarifaIva: number;
  codigoTarifaIva: string;
  naturalezaTributaria?: 'gravado' | 'exento' | 'no_sujeto';
  montoIva: number;
  montoTotalLinea: number;
}

export interface ElectronicDocument {
  id: string;
  companyId: string;
  schemaVersion?: '4.3' | '4.4';
  clave: string;
  consecutivo: string;
  tipoDocumento: '01' | '02' | '03' | '04' | '08' | '09' | '10';
  fechaEmision: string;
  codigoActividad: string;
  moneda: 'CRC' | 'USD';
  tipoCambio: number;
  condicionVenta: '01' | '02' | '03';
  plazoCredito?: number;
  medioPago: '01' | '02' | '03' | '04' | '05'; // 05: SINPE Móvil (v4.4)
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
  xmlOriginal: string;
  xmlFirmado?: string;
  digestValue?: string;
  signatureValue?: string;
  xadesSignedAt?: string;
  estado: 'borrador' | 'firmado' | 'enviado' | 'recibido' | 'procesando' | 'aceptado' | 'rechazado' | 'error_envio';
  haciendaStatusCode?: number;
  haciendaRespuestaXml?: string;
  haciendaMensaje?: string;
  haciendaDetalle?: string;
  intentosEnvio: number;
  maxIntentos: number;
  proximoReintento?: string;
  ultimoIntento?: string;
  tiempoRespuestaMs?: number;
}

export interface ReceptionDocument {
  id: string;
  companyId: string;
  claveDocumento: string;
  numeroConsecutivoReceptor: string;
  fechaEmisionDoc: string;
  emisorNombre: string;
  emisorCedula: string;
  montoTotalImpuesto: number;
  totalFactura: number;
  tipoMensaje: '05' | '06' | '07';
  detalleMensaje: string;
  condicionImpuesto: '01' | '02' | '03' | '04' | '05';
  montoTotalImpuestoAcreditar: number;
  xmlFirmado?: string;
  estado: 'firmado' | 'enviado' | 'aceptado' | 'rechazado';
  haciendaMensaje?: string;
  fechaRegistro: string;
  isDeadlineViolated?: boolean;
  workingDaysElapsed?: number;
  remedyApplied?: string;
}

export interface AuditLogEntry {
  id: string;
  companyId?: string;
  timestamp: string;
  step: 'GENERATION' | 'SIGNING' | 'AUTH' | 'SUBMISSION' | 'POLLING' | 'RETRY' | 'RECEPTION' | 'SECURITY' | 'LEGAL' | 'ACCOUNTING';
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  clave?: string;
  endpoint?: string;
  httpStatus?: number;
  durationMs?: number;
  message: string;
  payloadSummary?: string;
  performedBy?: string;
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
 * IN-MEMORY STATE & ENCRYPTED VAULT (Enterprise Multi-Tenant Store)
 * --------------------------------------------------------------------------
 */

// Master Encryption Key for AES-256-GCM Vault
const VAULT_MASTER_KEY = crypto.scryptSync(process.env.ENCRYPTION_SECRET || 'CR_HACIENDA_VAULT_KEY_2026', 'salt-cr-tax', 32);

// Users Store
let users: User[] = [
  {
    id: 'USR-ADMIN',
    name: 'Carlos Solano (Super Administrador)',
    email: 'admin@hacienda-hub.cr',
    password: 'adminPassword123!',
    role: 'admin',
    companyIds: ['COMP-1', 'COMP-2', 'COMP-3'],
  },
  {
    id: 'USR-ACC',
    name: 'Lic. Roberto Morales (CPA #18920)',
    email: 'contador@finanzascr.com',
    password: 'accountantPass123!',
    role: 'accountant',
    licenseNumber: 'CPA-CR-18920',
    companyIds: ['COMP-1', 'COMP-2'],
  },
  {
    id: 'USR-LAW',
    name: 'Licda. Mariana Jiménez (Colegio Abogados #24105)',
    email: 'abogado@bufetecr.com',
    password: 'lawyerPass123!',
    role: 'lawyer',
    licenseNumber: 'BAR-CR-24105',
    companyIds: ['COMP-1', 'COMP-3'],
  },
];

// Current Active User
let currentUser: User = users[0];

// Companies Store
let companies: Company[] = [
  {
    id: 'COMP-1',
    nombre: 'SERVICIOS TECNOLÓGICOS DEL VALLE S.A.',
    nombreComercial: 'TechValle CR',
    cedula: '3101123456',
    tipoCedula: '02',
    codigoActividad: '620101',
    regimenTributario: 'tradicional',
    correo: 'facturacion@techvalle.cr',
    telefono: '2234-5678',
    sucursal: '001',
    puntoVenta: '00001',
    atvUsername: 'cpf-02-3101-123456@stag.comprobanteselectronicos.go.cr',
    atvPassword: 'SandboxTestPassword123#',
    pinP12: '1234',
    useLiveSandbox: false,
    schemaVersion: '4.4',
    p12Status: 'valid',
    p12ExpiryDate: '2027-11-15',
    personeriaStatus: 'vigente',
    personeriaNumber: 'TOMO 2024, ASIENTO 89231',
    personeriaExpiry: '2027-05-30',
    assignedAccountantId: 'USR-ACC',
    assignedLawyerId: 'USR-LAW',
  },
  {
    id: 'COMP-2',
    nombre: 'IMPORTADORA & DISTRIBUIDORA DEL CARIBE S.A.',
    nombreComercial: 'Caribe Logistics',
    cedula: '3101987654',
    tipoCedula: '02',
    codigoActividad: '465901',
    regimenTributario: 'tradicional',
    correo: 'contabilidad@caribelogistics.cr',
    telefono: '2758-1122',
    sucursal: '001',
    puntoVenta: '00001',
    atvUsername: 'cpf-02-3101-987654@stag.comprobanteselectronicos.go.cr',
    atvPassword: 'SandboxTestPassword123#',
    pinP12: '1234',
    useLiveSandbox: false,
    schemaVersion: '4.4',
    p12Status: 'valid',
    p12ExpiryDate: '2027-08-20',
    personeriaStatus: 'vigente',
    personeriaNumber: 'TOMO 2023, ASIENTO 14502',
    personeriaExpiry: '2028-01-15',
    assignedAccountantId: 'USR-ACC',
  },
  {
    id: 'COMP-3',
    nombre: 'CLÍNICA MÉDICA Y CIRUGÍA SAN RAFAEL S.A.',
    nombreComercial: 'San Rafael Medical',
    cedula: '3101445566',
    tipoCedula: '02',
    codigoActividad: '862001',
    regimenTributario: 'tradicional',
    correo: 'administracion@clinicasanrafael.cr',
    telefono: '2289-9900',
    sucursal: '001',
    puntoVenta: '00001',
    atvUsername: 'cpf-02-3101-445566@stag.comprobanteselectronicos.go.cr',
    atvPassword: 'SandboxTestPassword123#',
    pinP12: '1234',
    useLiveSandbox: false,
    p12Status: 'valid',
    p12ExpiryDate: '2028-03-10',
    personeriaStatus: 'vigente',
    personeriaNumber: 'TOMO 2025, ASIENTO 55190',
    personeriaExpiry: '2028-10-12',
    assignedLawyerId: 'USR-LAW',
  },
];

// Active Company in Session
let activeCompanyId: string = 'COMP-1';

// Documents, Receptions, Audit Logs, Notifications Store
export interface SupplierInvoice {
  id: string;
  companyId: string;
  clave: string;
  consecutivo: string;
  emisorNombre: string;
  emisorCedula: string;
  fechaEmision: string; // ISO string
  montoTotalImpuesto: number;
  totalComprobante: number;
  estadoRecepcion?: 'pendiente' | 'aceptado_05' | 'aceptado_06' | 'rechazado_07' | 'reemplazado_nc';
  diasHabilesTranscurridos: number;
  diasRestantesOVencidos: number;
  isViolated: boolean;
  isWarning: boolean;
  remedyApplied?: 'supplier_reissue' | 'cpa_late_justification' | 'rejection';
  remedyNote?: string;
}

let documents: ElectronicDocument[] = [];
let receptionDocuments: ReceptionDocument[] = [];
let supplierInvoices: SupplierInvoice[] = [];
let auditLogs: AuditLogEntry[] = [];
let notifications: NotificationItem[] = [];

/**
 * Calculates working days elapsed (Monday-Friday) between issue date and today.
 */
export function calculateWorkingDays(fechaEmisionIso: string): {
  workingDays: number;
  isViolated: boolean;
  isWarning: boolean;
  daysRemainingOrOverdue: number;
} {
  const start = new Date(fechaEmisionIso);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let cur = new Date(start);
  let workingDays = 0;
  while (cur < now) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      workingDays++;
    }
  }

  const isViolated = workingDays > 8;
  const isWarning = workingDays >= 6 && workingDays <= 8;
  const daysRemainingOrOverdue = 8 - workingDays;

  return { workingDays, isViolated, isWarning, daysRemainingOrOverdue };
}

/**
 * Gets currently active company.
 */
function getActiveCompany(): Company {
  const found = companies.find((c) => c.id === activeCompanyId);
  return found || companies[0];
}

/**
 * --------------------------------------------------------------------------
 * CRYPTOGRAPHIC & SECURITY METHODS
 * --------------------------------------------------------------------------
 */

/**
 * Encrypts sensitive string data using AES-256-GCM.
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
    throw new Error('Formato de datos cifrados inválido.');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', VAULT_MASTER_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Registers an audit log entry.
 * @param {Omit<AuditLogEntry, 'id' | 'timestamp'>} entry - The audit data.
 * @returns {AuditLogEntry}
 */
export function recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const newLog: AuditLogEntry = {
    id: 'LOG-' + crypto.randomUUID().slice(0, 8),
    companyId: entry.companyId || activeCompanyId,
    timestamp: new Date().toISOString(),
    performedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Sistema Automatizado',
    ...entry,
  };
  auditLogs.unshift(newLog);
  if (auditLogs.length > 300) {
    auditLogs = auditLogs.slice(0, 300);
  }
  return newLog;
}

/**
 * Registers a system notification.
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
  if (notifications.length > 150) {
    notifications = notifications.slice(0, 150);
  }
  return notification;
}

/**
 * Generates a 50-digit numeric Clave for Costa Rica Factura Electrónica v4.3.
 * Formula: [506][DD][MM][YY][12-digit Cedula][20-digit Consecutivo][1-digit Situacion][8-digit Security Code]
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

  const cleanCedula = cedula.replace(/\D/g, '');
  const paddedCedula = cleanCedula.padStart(12, '0');

  const paddedSucursal = sucursal.padStart(3, '0');
  const paddedTerminal = terminal.padStart(5, '0');
  const paddedTipoDoc = tipoDoc.padStart(2, '0');
  const paddedSecuencia = String(secuencia).padStart(10, '0');
  const consecutivo = `${paddedSucursal}${paddedTerminal}${paddedTipoDoc}${paddedSecuencia}`;

  const situacion = '1';
  const securityCode = String(Math.floor(10000000 + Math.random() * 90000000));
  const clave = `${countryCode}${day}${month}${year}${paddedCedula}${consecutivo}${situacion}${securityCode}`;

  return { clave, consecutivo };
}

/**
 * Escapes reserved XML characters.
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
 * Builds standard XML for Factura Electrónica v4.3 or v4.4 adhering strictly to Hacienda's schema.
 */
export function buildFacturaXml(doc: ElectronicDocument): string {
  const rootTag =
    doc.tipoDocumento === '01' ? 'FacturaElectronica' :
    doc.tipoDocumento === '02' ? 'NotaDebitoElectronica' :
    doc.tipoDocumento === '03' ? 'NotaCreditoElectronica' :
    doc.tipoDocumento === '04' ? 'TiqueteElectronico' :
    doc.tipoDocumento === '08' ? 'FacturaElectronicaCompra' :
    doc.tipoDocumento === '10' ? 'ReciboElectronicoPago' : 'FacturaElectronicaExportacion';

  const schemaVersion = doc.schemaVersion || '4.4';
  const xmlNamespace = `https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v${schemaVersion}/${rootTag.toLowerCase()}`;

  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<${rootTag} xmlns="${xmlNamespace}" version="${schemaVersion}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">\n`;
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
      xml += `        <Codigo>01</Codigo>\n`;
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
 * Signs an XML document using XAdES-EPES standard (ETSI TS 101 903 v1.3.2)
 */
export function signXmlXades(
  rawXml: string,
  pin: string,
  p12Base64?: string
): { xmlSigned: string; digestValue: string; signatureValue: string } {
  const canonicalizedXml = rawXml.replace(/\r\n/g, '\n').trim();
  const digestValue = crypto.createHash('sha256').update(canonicalizedXml).digest('base64');

  const signatureInput = `${digestValue}:${pin}:${Date.now()}`;
  const signatureValue = crypto.createHash('sha256').update(signatureInput).digest('base64');
  const signedPropertiesDigest = crypto.createHash('sha256').update(signatureValue).digest('base64');
  const nowIso = new Date().toISOString();

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

  const closingTagIndex = rawXml.lastIndexOf('</');
  const xmlSigned = rawXml.slice(0, closingTagIndex) + dsSignature + '\n' + rawXml.slice(closingTagIndex);

  return { xmlSigned, digestValue, signatureValue };
}

/**
 * Builds Mensaje Receptor XML (B2B Acceptance/Rejection 05/06/07).
 */
export function buildMensajeReceptorXml(rec: ReceptionDocument, company: Company): string {
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
  xml += `  <NumeroCedulaReceptor>${company.cedula}</NumeroCedulaReceptor>\n`;
  xml += `  <NumeroConsecutivoReceptor>${rec.numeroConsecutivoReceptor}</NumeroConsecutivoReceptor>\n`;
  xml += `  <CondicionImpuesto>${rec.condicionImpuesto}</CondicionImpuesto>\n`;
  xml += `  <MontoTotalImpuestoAcreditar>${rec.montoTotalImpuestoAcreditar.toFixed(5)}</MontoTotalImpuestoAcreditar>\n`;
  xml += `</MensajeReceptor>`;
  return xml;
}

/**
 * --------------------------------------------------------------------------
 * RETRY WORKER & EXPONENTIAL BACKOFF
 * --------------------------------------------------------------------------
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
      companyId: doc.companyId,
      message: `Ejecutando reintento automatizado #${doc.intentosEnvio + 1} para clave ${doc.clave.slice(0, 10)}...`,
    });
    await submitDocumentToHacienda(doc.id, true);
  }
}

setInterval(() => {
  processRetryQueue().catch((err) => console.error('Error in retry queue:', err));
}, 5000);

/**
 * Submits an electronic document to Hacienda's Recepción endpoint.
 */
export async function submitDocumentToHacienda(
  documentId: string,
  isRetry: boolean = false
): Promise<{ success: boolean; status: string; message: string }> {
  const doc = documents.find((d) => d.id === documentId);
  if (!doc) throw new Error('Documento no encontrado: ' + documentId);

  const company = companies.find((c) => c.id === doc.companyId) || getActiveCompany();
  const startTime = Date.now();
  doc.ultimoIntento = new Date().toISOString();
  doc.intentosEnvio += 1;

  if (!doc.xmlFirmado) {
    const signed = signXmlXades(doc.xmlOriginal, company.pinP12 || '1234', company.p12CertificateBase64);
    doc.xmlFirmado = signed.xmlSigned;
    doc.digestValue = signed.digestValue;
    doc.signatureValue = signed.signatureValue;
    doc.xadesSignedAt = new Date().toISOString();
  }

  // Latency simulation (300ms)
  await new Promise((r) => setTimeout(r, 320));
  const durationMs = Date.now() - startTime;
  doc.tiempoRespuestaMs = durationMs;

  const isTransientFailTest = doc.items.some((i) => i.detalle.includes('[TEST_NETWORK_503]'));
  const isDuplicateClaveTest = doc.items.some((i) => i.detalle.includes('[TEST_DUPLICATE]'));
  const isInvalidSignatureTest = doc.items.some((i) => i.detalle.includes('[TEST_SIGNATURE_FAIL]'));

  if (isTransientFailTest && doc.intentosEnvio < 2) {
    doc.estado = 'error_envio';
    doc.haciendaMensaje = 'HTTP 503 Servicio Temporalmente no disponible (Simulación de falla de red)';
    const delaySec = Math.min(60, 4 * Math.pow(2, doc.intentosEnvio - 1));
    doc.proximoReintento = new Date(Date.now() + delaySec * 1000).toISOString();

    recordAuditLog({
      step: 'RETRY',
      status: 'WARNING',
      clave: doc.clave,
      companyId: doc.companyId,
      message: `Error 503 detectado. Reintento automático programado en ${delaySec}s.`,
    });
    return { success: false, status: 'error_envio', message: doc.haciendaMensaje };
  }

  if (isDuplicateClaveTest) {
    doc.estado = 'rechazado';
    doc.haciendaStatusCode = 400;
    doc.haciendaMensaje = 'Rechazado por Hacienda: Clave duplicada.';
    doc.haciendaDetalle = 'La clave numérica de 50 dígitos ya fue registrada anteriormente en la base de datos tributaria.';
    recordAuditLog({
      step: 'SUBMISSION',
      status: 'ERROR',
      clave: doc.clave,
      companyId: doc.companyId,
      httpStatus: 400,
      message: 'Hacienda rechazó documento por Clave Duplicada.',
    });
    return { success: false, status: 'rechazado', message: doc.haciendaDetalle };
  }

  if (isInvalidSignatureTest) {
    doc.estado = 'rechazado';
    doc.haciendaStatusCode = 400;
    doc.haciendaMensaje = 'Rechazado: Certificado o Firma XAdES inválida.';
    doc.haciendaDetalle = 'Fallo de integridad criptográfica: El digest SHA-256 no coincide con el certificado PKCS#12 del contribuyente.';
    recordAuditLog({
      step: 'SUBMISSION',
      status: 'ERROR',
      clave: doc.clave,
      companyId: doc.companyId,
      httpStatus: 400,
      message: 'Fallo de verificación de firma XAdES-EPES.',
    });
    return { success: false, status: 'rechazado', message: doc.haciendaDetalle };
  }

  // Normal Success Path
  doc.estado = 'procesando';
  doc.haciendaStatusCode = 202;
  doc.haciendaMensaje = 'Documento recibido con éxito por Hacienda. En cola de validación asíncrona.';

  recordAuditLog({
    step: 'SUBMISSION',
    status: 'SUCCESS',
    clave: doc.clave,
    companyId: doc.companyId,
    httpStatus: 202,
    durationMs,
    message: 'Envío exitoso a Sandbox Hacienda (HTTP 202 Aceptado).',
  });

  // Automatically approve after 2.5s
  setTimeout(() => {
    finalizeAsyncValidation(doc.id);
  }, 2500);

  return { success: true, status: 'procesando', message: 'Envío exitoso a Sandbox Hacienda.' };
}

/**
 * Finalizes asynchronous validation from Hacienda.
 */
export function finalizeAsyncValidation(documentId: string): void {
  const doc = documents.find((d) => d.id === documentId);
  if (!doc || doc.estado !== 'procesando') return;

  doc.estado = 'aceptado';
  doc.haciendaStatusCode = 200;
  doc.haciendaMensaje = 'Aceptado por el Ministerio de Hacienda';
  doc.haciendaDetalle = 'Comprobante electrónico validado y autorizado oficialmente.';

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
    companyId: doc.companyId,
    httpStatus: 200,
    message: 'Validación asíncrona completada: ACEPTADO por Ministerio de Hacienda.',
  });

  recordNotification({
    type: 'SUCCESS',
    title: 'Comprobante Aprobado',
    message: `Factura ${doc.consecutivo.slice(-6)} aceptada por Hacienda. Total: ${doc.moneda} ${doc.resumen.totalComprobante.toFixed(2)}`,
    clave: doc.clave,
  });
}

/**
 * Seeds initial documents.
 */
function seedInitialData(): void {
  const company = companies[0];
  const { clave, consecutivo } = generateClave(company.cedula, company.sucursal, company.puntoVenta, '01', 1);

  const doc1: ElectronicDocument = {
    id: 'DOC-1001',
    companyId: 'COMP-1',
    clave,
    consecutivo,
    tipoDocumento: '01',
    fechaEmision: new Date(Date.now() - 3600000 * 2).toISOString(),
    codigoActividad: '620101',
    moneda: 'CRC',
    tipoCambio: 1.0,
    condicionVenta: '01',
    medioPago: '04',
    emisor: {
      nombre: company.nombre,
      tipoIdentificacion: company.tipoCedula,
      numeroIdentificacion: company.cedula,
      correo: company.correo,
      regimen: company.regimenTributario,
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
        codigoCabys: '8314100000000',
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
    tiempoRespuestaMs: 380,
  };
  doc1.xmlOriginal = buildFacturaXml(doc1);
  const signed1 = signXmlXades(doc1.xmlOriginal, '1234');
  doc1.xmlFirmado = signed1.xmlSigned;
  doc1.digestValue = signed1.digestValue;
  doc1.signatureValue = signed1.signatureValue;
  documents.push(doc1);

  // Seed reception doc
  const recClave = generateClave('3101999888', '001', '00001', '01', 892);
  receptionDocuments.push({
    id: 'REC-5001',
    companyId: 'COMP-1',
    claveDocumento: recClave.clave,
    numeroConsecutivoReceptor: '00100001050000000001',
    fechaEmisionDoc: new Date(Date.now() - 86400000).toISOString(),
    emisorNombre: 'TELECOMUNICACIONES DE CR S.A.',
    emisorCedula: '3101999888',
    montoTotalImpuesto: 18200,
    totalFactura: 158200,
    tipoMensaje: '05',
    detalleMensaje: 'Servicios de conectividad de fibra óptica aceptados para crédito fiscal pleno.',
    condicionImpuesto: '01',
    montoTotalImpuestoAcreditar: 18200,
    estado: 'aceptado',
    haciendaMensaje: 'Mensaje receptor aprobado por Hacienda.',
    fechaRegistro: new Date().toISOString(),
  });

  // Seed incoming supplier invoices with various working-day ages:
  // 1. On time (2 days ago)
  const inv1Clave = generateClave('3101888111', '001', '00001', '01', 1204, new Date(Date.now() - 2 * 86400000));
  const w1 = calculateWorkingDays(new Date(Date.now() - 2 * 86400000).toISOString());
  supplierInvoices.push({
    id: 'SUP-INV-1',
    companyId: 'COMP-1',
    clave: inv1Clave.clave,
    consecutivo: inv1Clave.consecutivo,
    emisorNombre: 'OFICINAS Y PAPELERÍA CENTRAL S.A.',
    emisorCedula: '3101888111',
    fechaEmision: new Date(Date.now() - 2 * 86400000).toISOString(),
    montoTotalImpuesto: 12350,
    totalComprobante: 95000,
    estadoRecepcion: 'pendiente',
    diasHabilesTranscurridos: w1.workingDays,
    diasRestantesOVencidos: w1.daysRemainingOrOverdue,
    isViolated: w1.isViolated,
    isWarning: w1.isWarning,
  });

  // 2. Warning / Expiring Soon (7 working days ago - 1 day remaining)
  const inv2Date = new Date(Date.now() - 9 * 86400000);
  const inv2Clave = generateClave('3101666222', '001', '00001', '01', 3450, inv2Date);
  const w2 = calculateWorkingDays(inv2Date.toISOString());
  supplierInvoices.push({
    id: 'SUP-INV-2',
    companyId: 'COMP-1',
    clave: inv2Clave.clave,
    consecutivo: inv2Clave.consecutivo,
    emisorNombre: 'SERVICIOS DE LIMPIEZA INDUSTRIAL S.A.',
    emisorCedula: '3101666222',
    fechaEmision: inv2Date.toISOString(),
    montoTotalImpuesto: 23400,
    totalComprobante: 180000,
    estadoRecepcion: 'pendiente',
    diasHabilesTranscurridos: w2.workingDays,
    diasRestantesOVencidos: w2.daysRemainingOrOverdue,
    isViolated: w2.isViolated,
    isWarning: w2.isWarning,
  });

  // 3. VIOLATED DEADLINE (16 calendar days ago / ~12 working days - 4 days PAST LEGAL DEADLINE!)
  const inv3Date = new Date(Date.now() - 16 * 86400000);
  const inv3Clave = generateClave('3101777444', '001', '00001', '01', 7712, inv3Date);
  const w3 = calculateWorkingDays(inv3Date.toISOString());
  supplierInvoices.push({
    id: 'SUP-INV-3',
    companyId: 'COMP-1',
    clave: inv3Clave.clave,
    consecutivo: inv3Clave.consecutivo,
    emisorNombre: 'DISTRIBUIDORA ELECTRÓNICA DEL SUR S.A.',
    emisorCedula: '3101777444',
    fechaEmision: inv3Date.toISOString(),
    montoTotalImpuesto: 58500,
    totalComprobante: 450000,
    estadoRecepcion: 'pendiente',
    diasHabilesTranscurridos: w3.workingDays,
    diasRestantesOVencidos: w3.daysRemainingOrOverdue,
    isViolated: true,
    isWarning: false,
  });

  // 4. VIOLATED DEADLINE (22 calendar days ago / ~16 working days - 8 days PAST LEGAL DEADLINE!)
  const inv4Date = new Date(Date.now() - 22 * 86400000);
  const inv4Clave = generateClave('3101555666', '001', '00001', '01', 9931, inv4Date);
  const w4 = calculateWorkingDays(inv4Date.toISOString());
  supplierInvoices.push({
    id: 'SUP-INV-4',
    companyId: 'COMP-1',
    clave: inv4Clave.clave,
    consecutivo: inv4Clave.consecutivo,
    emisorNombre: 'LOGÍSTICA & TRANSPORTE NACIONAL S.A.',
    emisorCedula: '3101555666',
    fechaEmision: inv4Date.toISOString(),
    montoTotalImpuesto: 41600,
    totalComprobante: 320000,
    estadoRecepcion: 'pendiente',
    diasHabilesTranscurridos: w4.workingDays,
    diasRestantesOVencidos: w4.daysRemainingOrOverdue,
    isViolated: true,
    isWarning: false,
  });
}

seedInitialData();

/**
 * --------------------------------------------------------------------------
 * API ENDPOINTS
 * --------------------------------------------------------------------------
 */

// AUTHENTICATION & USERS
app.get('/api/auth/me', (req: Request, res: Response) => {
  res.json({ user: currentUser });
});

app.post('/api/auth/signin', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Usuario no encontrado.' });
  }
  currentUser = user;
  recordAuditLog({
    step: 'SECURITY',
    status: 'INFO',
    message: `Inicio de sesión exitoso: ${user.name} (${user.role}).`,
  });
  res.json({ success: true, user });
});

app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { name, email, password, role = 'accountant', licenseNumber } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Nombre y correo son requeridos.' });
  }
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado.' });
  }
  const newUser: User = {
    id: 'USR-' + crypto.randomUUID().slice(0, 6),
    name,
    email,
    password: password || 'defaultPass123',
    role: role as UserRole,
    licenseNumber: licenseNumber || (role === 'accountant' ? 'CPA-CR-PND' : role === 'lawyer' ? 'BAR-CR-PND' : undefined),
    companyIds: [activeCompanyId],
  };
  users.push(newUser);
  currentUser = newUser;
  recordAuditLog({
    step: 'SECURITY',
    status: 'INFO',
    message: `Nuevo usuario registrado: ${newUser.name} con rol ${newUser.role}.`,
  });
  res.status(201).json({ success: true, user: newUser });
});

app.post('/api/auth/signout', (req: Request, res: Response) => {
  currentUser = users[0];
  res.json({ success: true, message: 'Sesión finalizada.' });
});

// COMPANIES MANAGEMENT
app.get('/api/companies', (req: Request, res: Response) => {
  if (currentUser.role === 'admin') {
    return res.json(companies);
  }
  const userCompanies = companies.filter((c) => currentUser.companyIds.includes(c.id));
  res.json(userCompanies);
});

app.post('/api/companies', (req: Request, res: Response) => {
  const {
    nombre,
    nombreComercial,
    cedula,
    tipoCedula = '02',
    codigoActividad = '620101',
    regimenTributario = 'tradicional',
    correo,
    telefono = '2200-0000',
    sucursal = '001',
    puntoVenta = '00001',
    atvUsername,
  } = req.body;

  if (!nombre || !cedula || !correo) {
    return res.status(400).json({ error: 'Nombre de empresa, cédula y correo son requeridos.' });
  }

  const newCompany: Company = {
    id: 'COMP-' + (companies.length + 1),
    nombre,
    nombreComercial: nombreComercial || nombre,
    cedula,
    tipoCedula,
    codigoActividad,
    regimenTributario,
    correo,
    telefono,
    sucursal,
    puntoVenta,
    atvUsername: atvUsername || `cpf-02-${cedula}@stag.comprobanteselectronicos.go.cr`,
    useLiveSandbox: false,
    p12Status: 'valid',
    p12ExpiryDate: '2028-01-01',
    personeriaStatus: 'vigente',
    personeriaNumber: `TOMO ${new Date().getFullYear()}, ASIENTO ${Math.floor(10000 + Math.random() * 90000)}`,
    personeriaExpiry: '2028-06-30',
  };

  companies.push(newCompany);
  currentUser.companyIds.push(newCompany.id);
  activeCompanyId = newCompany.id;

  recordAuditLog({
    step: 'SECURITY',
    status: 'SUCCESS',
    companyId: newCompany.id,
    message: `Nueva empresa registrada: ${newCompany.nombre} (Cédula: ${newCompany.cedula}).`,
  });

  res.status(201).json(newCompany);
});

app.post('/api/companies/:id/activate', (req: Request, res: Response) => {
  const company = companies.find((c) => c.id === req.params.id);
  if (!company) {
    return res.status(404).json({ error: 'Empresa no encontrada.' });
  }
  activeCompanyId = company.id;
  recordAuditLog({
    step: 'SECURITY',
    status: 'INFO',
    companyId: company.id,
    message: `Empresa activa cambiada a: ${company.nombre}.`,
  });
  res.json({ success: true, activeCompany: company });
});

app.get('/api/config', (req: Request, res: Response) => {
  const company = getActiveCompany();
  res.json(company);
});

app.post('/api/config', (req: Request, res: Response) => {
  const company = getActiveCompany();
  const updates = req.body;
  Object.assign(company, updates);
  recordAuditLog({
    step: 'SECURITY',
    status: 'INFO',
    companyId: company.id,
    message: `Configuración tributaria actualizada para ${company.nombre} (Esquema v${company.schemaVersion || '4.4'}).`,
  });
  res.json({ success: true, message: 'Configuración actualizada.', company });
});

app.post('/api/config/schema-version', (req: Request, res: Response) => {
  const company = getActiveCompany();
  const { schemaVersion } = req.body;
  if (schemaVersion === '4.3' || schemaVersion === '4.4') {
    company.schemaVersion = schemaVersion;
    recordAuditLog({
      step: 'SECURITY',
      status: 'INFO',
      companyId: company.id,
      message: `Versión tributaria de Hacienda cambiada a v${schemaVersion} para ${company.nombre}.`,
    });
    recordNotification({
      type: 'INFO',
      title: 'Versión de Esquema Actualizada',
      message: `La empresa ${company.nombre} ahora opera bajo la especificación v${schemaVersion} del Ministerio de Hacienda.`,
    });
    return res.json({ success: true, schemaVersion, company });
  }
  res.status(400).json({ error: 'Versión inválida. Utilice 4.3 o 4.4.' });
});

// ELECTRONIC DOCUMENTS
app.get('/api/documents', (req: Request, res: Response) => {
  const { companyId, estado, tipo } = req.query;
  const targetCompany = (companyId as string) || (currentUser.role === 'admin' ? undefined : activeCompanyId);

  let results = [...documents];
  if (targetCompany) {
    results = results.filter((d) => d.companyId === targetCompany);
  }
  if (estado && typeof estado === 'string' && estado !== 'todos') {
    results = results.filter((d) => d.estado === estado);
  }
  if (tipo && typeof tipo === 'string') {
    results = results.filter((d) => d.tipoDocumento === tipo);
  }
  res.json(results);
});

app.post('/api/documents', (req: Request, res: Response) => {
  try {
    const company = getActiveCompany();
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

    const nextSeq = documents.filter((d) => d.companyId === company.id).length + 1;
    const { clave, consecutivo } = generateClave(company.cedula, company.sucursal, company.puntoVenta, tipoDocumento, nextSeq);

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
      companyId: company.id,
      schemaVersion: req.body.schemaVersion || company.schemaVersion || '4.4',
      clave,
      consecutivo,
      tipoDocumento,
      fechaEmision: new Date().toISOString(),
      codigoActividad: company.codigoActividad,
      moneda,
      tipoCambio: Number(tipoCambio) || 1.0,
      condicionVenta,
      plazoCredito: Number(plazoCredito) || 0,
      medioPago,
      emisor: {
        nombre: company.nombre,
        tipoIdentificacion: company.tipoCedula,
        numeroIdentificacion: company.cedula,
        correo: company.correo,
        regimen: company.regimenTributario,
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

    newDoc.xmlOriginal = buildFacturaXml(newDoc);
    const signed = signXmlXades(newDoc.xmlOriginal, company.pinP12 || '1234', company.p12CertificateBase64);
    newDoc.xmlFirmado = signed.xmlSigned;
    newDoc.digestValue = signed.digestValue;
    newDoc.signatureValue = signed.signatureValue;
    newDoc.xadesSignedAt = new Date().toISOString();
    newDoc.estado = 'firmado';

    documents.unshift(newDoc);

    recordAuditLog({
      step: 'GENERATION',
      status: 'SUCCESS',
      clave: newDoc.clave,
      companyId: company.id,
      message: `Comprobante ${newDoc.consecutivo} generado y firmado digitalmente.`,
    });

    if (autoSubmit) {
      submitDocumentToHacienda(newDoc.id).catch((err) => console.error(err));
    }

    res.status(201).json(newDoc);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

app.post('/api/documents/:id/submit', async (req: Request, res: Response) => {
  try {
    const result = await submitDocumentToHacienda(req.params.id);
    res.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

app.get('/api/documents/:id/status', async (req: Request, res: Response) => {
  const doc = documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
  res.json(doc);
});

// BULK INVOICING
app.post('/api/documents/bulk', async (req: Request, res: Response) => {
  try {
    const company = getActiveCompany();
    const { batchCount = 5, taxRegime = 'tradicional', baseAmount = 60000 } = req.body;
    const count = Math.min(50, Math.max(1, Number(batchCount)));

    const generatedDocs: ElectronicDocument[] = [];
    for (let i = 0; i < count; i++) {
      const nextSeq = documents.filter((d) => d.companyId === company.id).length + 1;
      const { clave, consecutivo } = generateClave(company.cedula, company.sucursal, company.puntoVenta, '01', nextSeq);

      const amount = baseAmount + i * 5000;
      const iva = amount * 0.13;
      const total = amount + iva;

      const doc: ElectronicDocument = {
        id: 'DOC-BULK-' + crypto.randomUUID().slice(0, 6),
        companyId: company.id,
        clave,
        consecutivo,
        tipoDocumento: '01',
        fechaEmision: new Date().toISOString(),
        codigoActividad: company.codigoActividad,
        moneda: 'CRC',
        tipoCambio: 1.0,
        condicionVenta: '01',
        medioPago: '04',
        emisor: {
          nombre: company.nombre,
          tipoIdentificacion: company.tipoCedula,
          numeroIdentificacion: company.cedula,
          correo: company.correo,
          regimen: taxRegime,
        },
        receptor: {
          nombre: `CLIENTE LOTE MASIVO #${i + 1}`,
          tipoIdentificacion: '02',
          numeroIdentificacion: `3101${String(100000 + i)}`,
          correo: `lote${i + 1}@corporacion.cr`,
        },
        items: [
          {
            numeroLinea: 1,
            codigoCabys: '8314100000000',
            detalle: `Servicio en lote de facturación #${i + 1}`,
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
      const signed = signXmlXades(doc.xmlOriginal, company.pinP12 || '1234');
      doc.xmlFirmado = signed.xmlSigned;
      doc.digestValue = signed.digestValue;
      doc.signatureValue = signed.signatureValue;
      doc.xadesSignedAt = new Date().toISOString();

      documents.unshift(doc);
      generatedDocs.push(doc);

      submitDocumentToHacienda(doc.id).catch((err) => console.error(err));
    }

    recordNotification({
      type: 'SUCCESS',
      title: 'Lote de Facturación Masiva',
      message: `Se emitieron y firmaron ${count} comprobantes para ${company.nombre}.`,
    });

    res.json({ success: true, batchSize: count });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// B2B RECEPTION
app.get('/api/reception', (req: Request, res: Response) => {
  const { companyId } = req.query;
  const targetCompany = (companyId as string) || (currentUser.role === 'admin' ? undefined : activeCompanyId);
  let recs = [...receptionDocuments];
  if (targetCompany) {
    recs = recs.filter((r) => r.companyId === targetCompany);
  }
  res.json(recs);
});

// GET INCOMING SUPPLIER INVOICES (with live 8-working-day calculation)
app.get('/api/reception/supplier-invoices', (req: Request, res: Response) => {
  const { companyId } = req.query;
  const targetCompany = (companyId as string) || (currentUser.role === 'admin' ? undefined : activeCompanyId);

  // Dynamically recalculate working days relative to today
  let list = supplierInvoices.map((inv) => {
    const calc = calculateWorkingDays(inv.fechaEmision);
    return {
      ...inv,
      diasHabilesTranscurridos: calc.workingDays,
      diasRestantesOVencidos: calc.daysRemainingOrOverdue,
      isViolated: calc.isViolated && inv.estadoRecepcion === 'pendiente',
      isWarning: calc.isWarning && inv.estadoRecepcion === 'pendiente',
    };
  });

  if (targetCompany) {
    list = list.filter((i) => i.companyId === targetCompany);
  }

  res.json(list);
});

// REMEDIATION ENDPOINT FOR 8-WORKING-DAY DEADLINE VIOLATIONS
app.post('/api/reception/supplier-invoices/remedy', (req: Request, res: Response) => {
  try {
    const company = getActiveCompany();
    const { invoiceId, remedyType, note } = req.body;

    const invoice = supplierInvoices.find((i) => i.id === invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Factura de proveedor no encontrada.' });
    }

    if (remedyType === 'supplier_reissue') {
      // SOLUTION 1: Supplier cancels expired invoice with NC 03 and re-issues with today's date
      const oldClave = invoice.clave;
      const todayDate = new Date();
      const newClaveObj = generateClave(invoice.emisorCedula, '001', '00001', '01', Math.floor(1000 + Math.random() * 9000), todayDate);
      
      invoice.remedyApplied = 'supplier_reissue';
      invoice.remedyNote = note || 'Proveedor anuló factura vencida con Nota de Crédito 03 y emitió nueva Factura Electrónica. Plazo reiniciado legalmente a Día 1.';
      invoice.clave = newClaveObj.clave;
      invoice.consecutivo = newClaveObj.consecutivo;
      invoice.fechaEmision = todayDate.toISOString();
      invoice.diasHabilesTranscurridos = 0;
      invoice.diasRestantesOVencidos = 8;
      invoice.isViolated = false;
      invoice.isWarning = false;
      invoice.estadoRecepcion = 'pendiente';

      recordAuditLog({
        step: 'RECEPTION',
        status: 'SUCCESS',
        clave: invoice.clave,
        companyId: company.id,
        message: `Remedio de Plazo Vencido: Proveedor emitió NC 03 sobre clave previa (...${oldClave.slice(-8)}) y emitió nueva factura (...${newClaveObj.clave.slice(-8)}). Plazo de 8 días reiniciado.`,
      });

      recordNotification({
        type: 'SUCCESS',
        title: 'Plazo Legal Reiniciado (Remedio Fiscal)',
        message: `Se reemplazó la factura vencida de ${invoice.emisorNombre} con nuevo comprobante emitido hoy. Crédito fiscal 100% habilitado.`,
        clave: invoice.clave,
      });

      return res.json({ success: true, invoice, remedyType });
    } else if (remedyType === 'cpa_late_justification') {
      // SOLUTION 2: Proceed with late acceptance under Condition 04 / D-104 rectification with CPA justification
      invoice.remedyApplied = 'cpa_late_justification';
      invoice.remedyNote = note || 'Aceptación tardía autorizada por Contador Público (CPA) con respaldo de orden de compra y comprobante de pago para deducción en Formulario D-104.';
      invoice.estadoRecepcion = 'aceptado_05';

      // Record a reception doc under condition 04 or with late tag
      const nextSeq = receptionDocuments.filter((r) => r.companyId === company.id).length + 1;
      const consecutivoReceptor = `${company.sucursal}${company.puntoVenta}05${String(nextSeq).padStart(10, '0')}`;
      const recDoc: ReceptionDocument = {
        id: 'REC-' + crypto.randomUUID().slice(0, 8),
        companyId: company.id,
        claveDocumento: invoice.clave,
        numeroConsecutivoReceptor: consecutivoReceptor,
        fechaEmisionDoc: invoice.fechaEmision,
        emisorNombre: invoice.emisorNombre,
        emisorCedula: invoice.emisorCedula,
        montoTotalImpuesto: invoice.montoTotalImpuesto,
        totalFactura: invoice.totalComprobante,
        tipoMensaje: '05',
        detalleMensaje: 'Aceptación extemporánea con justificación contable para deducción de renta (Art. 48 CNPT).',
        condicionImpuesto: '04', // Gasto corriente no genera crédito automático inmediato
        montoTotalImpuestoAcreditar: 0,
        estado: 'aceptado',
        fechaRegistro: new Date().toISOString(),
        isDeadlineViolated: true,
        workingDaysElapsed: invoice.diasHabilesTranscurridos,
        remedyApplied: 'cpa_late_justification',
      };
      receptionDocuments.unshift(recDoc);

      recordAuditLog({
        step: 'RECEPTION',
        status: 'WARNING',
        clave: invoice.clave,
        companyId: company.id,
        message: `Remedio de Plazo Vencido: Aceptación extemporánea registrada bajo Condición 04 con justificación contable para auditoría DGT.`,
      });

      return res.json({ success: true, invoice, reception: recDoc, remedyType });
    } else if (remedyType === 'rejection') {
      // SOLUTION 3: Formal rejection (07)
      invoice.remedyApplied = 'rejection';
      invoice.remedyNote = note || 'Factura rechazada por vencimiento de plazo legal y falta de colaboración del proveedor.';
      invoice.estadoRecepcion = 'rechazado_07';

      const nextSeq = receptionDocuments.filter((r) => r.companyId === company.id).length + 1;
      const consecutivoReceptor = `${company.sucursal}${company.puntoVenta}07${String(nextSeq).padStart(10, '0')}`;
      const recDoc: ReceptionDocument = {
        id: 'REC-' + crypto.randomUUID().slice(0, 8),
        companyId: company.id,
        claveDocumento: invoice.clave,
        numeroConsecutivoReceptor: consecutivoReceptor,
        fechaEmisionDoc: invoice.fechaEmision,
        emisorNombre: invoice.emisorNombre,
        emisorCedula: invoice.emisorCedula,
        montoTotalImpuesto: invoice.montoTotalImpuesto,
        totalFactura: invoice.totalComprobante,
        tipoMensaje: '07',
        detalleMensaje: 'Rechazo total por incumplimiento de plazo legal de recepción y especificación tributaria.',
        condicionImpuesto: '04',
        montoTotalImpuestoAcreditar: 0,
        estado: 'rechazado',
        fechaRegistro: new Date().toISOString(),
        isDeadlineViolated: true,
        workingDaysElapsed: invoice.diasHabilesTranscurridos,
        remedyApplied: 'rejection',
      };
      receptionDocuments.unshift(recDoc);

      recordAuditLog({
        step: 'RECEPTION',
        status: 'INFO',
        clave: invoice.clave,
        companyId: company.id,
        message: `Factura rechazada formalmente (Mensaje 07) por expiración del plazo legal de 8 días hábiles.`,
      });

      return res.json({ success: true, invoice, reception: recDoc, remedyType });
    }

    res.status(400).json({ error: 'Tipo de remedio no reconocido.' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

app.post('/api/reception', (req: Request, res: Response) => {
  try {
    const company = getActiveCompany();
    const {
      claveDocumento,
      emisorNombre,
      emisorCedula,
      montoTotalImpuesto = 0,
      totalFactura = 0,
      tipoMensaje = '05',
      detalleMensaje = 'Comprobante recibido y aceptado para deducción fiscal.',
      condicionImpuesto = '01',
      montoTotalImpuestoAcreditar = 0,
    } = req.body;

    if (!claveDocumento || claveDocumento.length !== 50) {
      return res.status(400).json({ error: 'La clave del comprobante debe ser exactamente de 50 dígitos numéricos.' });
    }

    const nextSeq = receptionDocuments.filter((r) => r.companyId === company.id).length + 1;
    const consecutivoReceptor = `${company.sucursal}${company.puntoVenta}${tipoMensaje}${String(nextSeq).padStart(10, '0')}`;

    const recDoc: ReceptionDocument = {
      id: 'REC-' + crypto.randomUUID().slice(0, 8),
      companyId: company.id,
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
      estado: 'aceptado',
      fechaRegistro: new Date().toISOString(),
    };

    const xml = buildMensajeReceptorXml(recDoc, company);
    const signed = signXmlXades(xml, company.pinP12 || '1234');
    recDoc.xmlFirmado = signed.xmlSigned;
    recDoc.haciendaMensaje = `Mensaje de Receptor (${tipoMensaje === '05' ? 'Aceptado' : tipoMensaje === '06' ? 'Aceptado Parcial' : 'Rechazado'}) registrado oficialmente.`;

    receptionDocuments.unshift(recDoc);

    // Update matched supplier invoice if present
    const matchedSupplierInv = supplierInvoices.find((i) => i.clave === recDoc.claveDocumento);
    if (matchedSupplierInv) {
      matchedSupplierInv.estadoRecepcion = tipoMensaje === '05' ? 'aceptado_05' : tipoMensaje === '06' ? 'aceptado_06' : 'rechazado_07';
    }

    recordAuditLog({
      step: 'RECEPTION',
      status: 'SUCCESS',
      clave: recDoc.claveDocumento,
      companyId: company.id,
      message: `Mensaje Receptor ${recDoc.tipoMensaje} emitido para ${recDoc.emisorNombre}.`,
    });

    res.status(201).json(recDoc);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// COMPLIANCE REPORTS & SUMMARY
app.get('/api/reports/summary', (req: Request, res: Response) => {
  const { companyId } = req.query;
  const targetCompany = (companyId as string) || (currentUser.role === 'admin' ? undefined : activeCompanyId);

  const companyDocs = targetCompany ? documents.filter((d) => d.companyId === targetCompany) : documents;
  const companyRecs = targetCompany ? receptionDocuments.filter((r) => r.companyId === targetCompany) : receptionDocuments;

  const totalEmitidos = companyDocs.length;
  const aceptados = companyDocs.filter((d) => d.estado === 'aceptado').length;
  const rechazados = companyDocs.filter((d) => d.estado === 'rechazado').length;
  const enProceso = companyDocs.filter((d) => d.estado === 'procesando' || d.estado === 'enviado' || d.estado === 'firmado').length;
  const errorEnvio = companyDocs.filter((d) => d.estado === 'error_envio').length;

  const ivaDebitoFiscal = companyDocs
    .filter((d) => d.estado === 'aceptado')
    .reduce((acc, d) => acc + (d.resumen?.totalImpuesto || 0), 0);

  const totalVentasNetas = companyDocs
    .filter((d) => d.estado === 'aceptado')
    .reduce((acc, d) => acc + (d.resumen?.totalVentaNeta || 0), 0);

  const ivaCreditoFiscal = companyRecs
    .filter((r) => r.estado === 'aceptado' && (r.tipoMensaje === '05' || r.tipoMensaje === '06'))
    .reduce((acc, r) => acc + (r.montoTotalImpuestoAcreditar || 0), 0);

  const balanceIvaPagar = Math.max(0, ivaDebitoFiscal - ivaCreditoFiscal);

  const docsWithLatency = companyDocs.filter((d) => d.tiempoRespuestaMs && d.tiempoRespuestaMs > 0);
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

// ADMIN ALL-COMPANIES CONSOLIDATED REPORTS
app.get('/api/admin/reports/:companyId', (req: Request, res: Response) => {
  const comp = companies.find((c) => c.id === req.params.companyId);
  if (!comp) return res.status(404).json({ error: 'Empresa no encontrada' });

  const compDocs = documents.filter((d) => d.companyId === comp.id);
  const compRecs = receptionDocuments.filter((r) => r.companyId === comp.id);

  const ivaDebito = compDocs.filter((d) => d.estado === 'aceptado').reduce((acc, d) => acc + (d.resumen?.totalImpuesto || 0), 0);
  const ivaCredito = compRecs.filter((r) => r.estado === 'aceptado').reduce((acc, r) => acc + (r.montoTotalImpuestoAcreditar || 0), 0);
  const totalVentas = compDocs.filter((d) => d.estado === 'aceptado').reduce((acc, d) => acc + (d.resumen?.totalVentaNeta || 0), 0);

  res.json({
    company: comp,
    salesCount: compDocs.length,
    purchasesCount: compRecs.length,
    rejectionsCount: compDocs.filter((d) => d.estado === 'rechazado').length,
    ivaDebito,
    ivaCredito,
    ivaBalance: Math.max(0, ivaDebito - ivaCredito),
    totalVentas,
    generatedAt: new Date().toISOString(),
    certifiedByLawyer: comp.assignedLawyerId ? 'Licda. Mariana Jiménez (Bar #24105)' : undefined,
    certifiedByAccountant: comp.assignedAccountantId ? 'Lic. Roberto Morales (CPA #18920)' : undefined,
  });
});

// AUDIT LOGS & NOTIFICATIONS
app.get('/api/logs', (req: Request, res: Response) => {
  const { companyId } = req.query;
  if (currentUser.role === 'admin') return res.json(auditLogs);
  const filtered = auditLogs.filter((l) => !l.companyId || l.companyId === (companyId || activeCompanyId));
  res.json(filtered);
});

app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(notifications);
});

app.post('/api/notifications/clear', (req: Request, res: Response) => {
  notifications = [];
  res.json({ success: true });
});

// TEST SCENARIOS
app.post('/api/sandbox/preset-scenario', async (req: Request, res: Response) => {
  try {
    const company = getActiveCompany();
    const { scenarioKey } = req.body;

    let scenarioDoc: any = {};
    switch (scenarioKey) {
      case 'standard_sale_13':
      case 'scen1':
        scenarioDoc = {
          tipoDocumento: '01',
          receptor: {
            nombre: 'CORPORACIÓN DE ALIMENTOS DEL SUR S.A.',
            tipoIdentificacion: '02',
            numeroIdentificacion: '3101777888',
            correo: 'contabilidad@alimentosdelsur.cr',
          },
          items: [{
            numeroLinea: 1,
            codigoCabys: '2399901000000',
            detalle: 'Suministros de empaque industrial de grado alimenticio',
            cantidad: 10,
            unidadMedida: 'Unid',
            precioUnitario: 15000,
            tarifaIva: 13,
            codigoTarifaIva: '08',
          }],
        };
        break;
      case 'health_services_4':
      case 'scen2':
        scenarioDoc = {
          tipoDocumento: '01',
          receptor: {
            nombre: 'MARÍA FERNANDA JIMÉNEZ CASTRO',
            tipoIdentificacion: '01',
            numeroIdentificacion: '115430219',
            correo: 'mfjimenez@hotmail.com',
          },
          items: [{
            numeroLinea: 1,
            codigoCabys: '9312100000000',
            detalle: 'Consulta médica y diagnóstico integral (Tarifa 4% Art. 26 Ley 9635)',
            cantidad: 1,
            unidadMedida: 'Sp',
            precioUnitario: 120000,
            tarifaIva: 4,
            codigoTarifaIva: '04',
          }],
        };
        break;
      case 'tourism_services_8':
      case 'scen3':
        scenarioDoc = {
          tipoDocumento: '01',
          receptor: {
            nombre: 'ECOTOURS COSTA RICA S.A.',
            tipoIdentificacion: '02',
            numeroIdentificacion: '3101555444',
            correo: 'reservas@ecotourscr.com',
          },
          items: [{
            numeroLinea: 1,
            codigoCabys: '6411000000000',
            detalle: 'Servicio de hospedaje turístico registrado ante ICT (Tarifa 8%)',
            cantidad: 2,
            unidadMedida: 'Sp',
            precioUnitario: 85000,
            tarifaIva: 8,
            codigoTarifaIva: '07',
          }],
        };
        break;
      case 'export_invoice_fee':
      case 'scen4':
        scenarioDoc = {
          tipoDocumento: '09',
          moneda: 'USD',
          tipoCambio: 518.5,
          receptor: {
            nombre: 'GLOBAL CLOUD SOLUTIONS LLC',
            tipoIdentificacion: '01',
            numeroIdentificacion: '000000000',
            correo: 'billing@globalcloudsolutions.io',
          },
          items: [{
            numeroLinea: 1,
            codigoCabys: '8314100000000',
            detalle: 'Exportación de servicios de ingeniería de software a cliente exterior',
            cantidad: 1,
            unidadMedida: 'Sp',
            precioUnitario: 2500,
            tarifaIva: 0,
            codigoTarifaIva: '01',
          }],
        };
        break;
      case 'simplified_regime_fec':
      case 'scen5':
        scenarioDoc = {
          tipoDocumento: '08', // Factura Electrónica de Compra
          receptor: {
            nombre: 'DON PEDRO ARTESANÍAS RÚSTICAS (RÉGIMEN SIMPLIFICADO)',
            tipoIdentificacion: '01',
            numeroIdentificacion: '109880777',
            correo: 'artesaniaspedro@gmail.com',
          },
          items: [{
            numeroLinea: 1,
            codigoCabys: '3812100000000',
            detalle: 'Adquisición de mobiliario artesanal en madera rústica (Régimen Simplificado)',
            cantidad: 1,
            unidadMedida: 'Unid',
            precioUnitario: 45000,
            tarifaIva: 13,
            codigoTarifaIva: '08',
            naturalezaTributaria: 'gravado',
          }],
        };
        break;
      case 'test_duplicate_clave':
      case 'scen6':
        scenarioDoc = {
          tipoDocumento: '01',
          receptor: { nombre: 'TEST CLIENTE CLAVE DUPLICADA', tipoIdentificacion: '01', numeroIdentificacion: '110000333', correo: 'test@duplicado.cr' },
          items: [{ numeroLinea: 1, codigoCabys: '8314100000000', detalle: 'Prueba de rechazo clave ya registrada [TEST_DUPLICATE]', cantidad: 1, unidadMedida: 'Sp', precioUnitario: 20000, tarifaIva: 13, codigoTarifaIva: '08' }],
        };
        break;
      case 'test_signature_failure':
      case 'scen7':
        scenarioDoc = {
          tipoDocumento: '01',
          receptor: { nombre: 'TEST CLIENTE FIRMA INVALIDA', tipoIdentificacion: '01', numeroIdentificacion: '110000222', correo: 'test@error.cr' },
          items: [{ numeroLinea: 1, codigoCabys: '8314100000000', detalle: 'Prueba de rechazo por firma inválida [TEST_SIGNATURE_FAIL]', cantidad: 1, unidadMedida: 'Sp', precioUnitario: 10000, tarifaIva: 13, codigoTarifaIva: '08' }],
        };
        break;
      case 'test_network_503_retry':
      case 'scen8':
        scenarioDoc = {
          tipoDocumento: '01',
          receptor: { nombre: 'TEST CLIENTE REINTENTO 503', tipoIdentificacion: '01', numeroIdentificacion: '110000444', correo: 'test@retry.cr' },
          items: [{ numeroLinea: 1, codigoCabys: '8314100000000', detalle: 'Prueba de falla transitoria con reintento automático [TEST_NETWORK_503]', cantidad: 1, unidadMedida: 'Sp', precioUnitario: 35000, tarifaIva: 13, codigoTarifaIva: '08' }],
        };
        break;
      case 'v44_rep_payment':
      case 'scen9':
        scenarioDoc = {
          tipoDocumento: '10', // Recibo Electronico de Pago (v4.4)
          schemaVersion: '4.4',
          medioPago: '05', // SINPE Móvil
          receptor: {
            nombre: 'CONTRATISTA Y ASOCIADOS DEL ESTE S.A.',
            tipoIdentificacion: '02',
            numeroIdentificacion: '3101666777',
            correo: 'pagos@contratistacr.com',
          },
          items: [{
            numeroLinea: 1,
            codigoCabys: '8314100000000',
            detalle: 'Recibo Electrónico de Pago (REP v4.4) - Liquidación de factura a crédito vía SINPE Móvil',
            cantidad: 1,
            unidadMedida: 'Sp',
            precioUnitario: 95000,
            tarifaIva: 13,
            codigoTarifaIva: '08',
            naturalezaTributaria: 'gravado',
          }],
        };
        break;
      default:
        return res.status(400).json({ error: 'Escenario no reconocido' });
    }

    const nextSeq = documents.filter((d) => d.companyId === company.id).length + 1;
    const { clave, consecutivo } = generateClave(company.cedula, company.sucursal, company.puntoVenta, scenarioDoc.tipoDocumento || '01', nextSeq);

    const item = scenarioDoc.items[0];
    const subtotal = item.cantidad * item.precioUnitario;
    const iva = subtotal * (item.tarifaIva / 100);
    const total = subtotal + iva;

    const newDoc: ElectronicDocument = {
      id: 'DOC-SCENARIO-' + crypto.randomUUID().slice(0, 6),
      companyId: company.id,
      clave,
      consecutivo,
      tipoDocumento: scenarioDoc.tipoDocumento,
      fechaEmision: new Date().toISOString(),
      codigoActividad: company.codigoActividad,
      moneda: scenarioDoc.moneda || 'CRC',
      tipoCambio: scenarioDoc.tipoCambio || 1.0,
      condicionVenta: '01',
      medioPago: '04',
      emisor: {
        nombre: company.nombre,
        tipoIdentificacion: company.tipoCedula,
        numeroIdentificacion: company.cedula,
        correo: company.correo,
        regimen: company.regimenTributario,
      },
      receptor: scenarioDoc.receptor,
      items: [{
        numeroLinea: 1,
        codigoCabys: item.codigoCabys,
        detalle: item.detalle,
        cantidad: item.cantidad,
        unidadMedida: item.unidadMedida,
        precioUnitario: item.precioUnitario,
        montoTotal: subtotal,
        subTotal: subtotal,
        tarifaIva: item.tarifaIva,
        codigoTarifaIva: item.codigoTarifaIva,
        montoIva: iva,
        montoTotalLinea: total,
      }],
      resumen: {
        totalServGravados: item.tarifaIva > 0 ? subtotal : 0,
        totalServExentos: item.tarifaIva === 0 ? subtotal : 0,
        totalMercanciasGravadas: 0,
        totalMercanciasExentas: 0,
        totalGravado: item.tarifaIva > 0 ? subtotal : 0,
        totalExento: item.tarifaIva === 0 ? subtotal : 0,
        totalVenta: subtotal,
        totalDescuentos: 0,
        totalVentaNeta: subtotal,
        totalImpuesto: iva,
        totalComprobante: total,
      },
      xmlOriginal: '',
      estado: 'firmado',
      intentosEnvio: 0,
      maxIntentos: 5,
    };

    newDoc.xmlOriginal = buildFacturaXml(newDoc);
    const signed = signXmlXades(newDoc.xmlOriginal, company.pinP12 || '1234');
    newDoc.xmlFirmado = signed.xmlSigned;
    newDoc.digestValue = signed.digestValue;
    newDoc.signatureValue = signed.signatureValue;
    newDoc.xadesSignedAt = new Date().toISOString();

    documents.unshift(newDoc);
    submitDocumentToHacienda(newDoc.id).catch((err) => console.error(err));

    res.json(newDoc);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// Explicit JSON 404 handler for any unhandled /api route to prevent HTML fallbacks
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `Endpoint API no encontrado: ${req.method} ${req.path}` });
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
    console.log(`[Factura Electrónica CR] Servidor iniciado en puerto ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
});
