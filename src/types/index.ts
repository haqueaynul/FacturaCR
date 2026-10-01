/**
 * @file src/types/index.ts
 * @description TypeScript type definitions for Costa Rica Factura Electrónica v4.3 integration,
 * multi-user roles (Accountants, Lawyers, Admins), multi-company management, and compliance reports.
 */

export type DocumentType = '01' | '02' | '03' | '04' | '08' | '09' | '10'; // 10: REP (Recibo Electrónico de Pago v4.4)

export type SchemaVersion = '4.3' | '4.4';

export type DocumentStatus =
  | 'borrador'
  | 'firmado'
  | 'enviado'
  | 'recibido'
  | 'procesando'
  | 'aceptado'
  | 'rechazado'
  | 'error_envio';

export type TaxRegime = 'tradicional' | 'simplificado' | 'zona_franca' | 'agropecuario';

export type UserRole = 'admin' | 'accountant' | 'lawyer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  licenseNumber?: string; // CPA number or Bar Association number
  companyIds: string[]; // Companies user has access to
}

export interface Company {
  id: string;
  nombre: string;
  nombreComercial?: string;
  cedula: string;
  tipoCedula: '01' | '02' | '03' | '04';
  codigoActividad: string;
  regimenTributario: TaxRegime;
  correo: string;
  telefono?: string;
  sucursal: string;
  puntoVenta: string;
  atvUsername: string;
  hasPassword?: boolean;
  hasP12Certificate?: boolean;
  hasPin?: boolean;
  useLiveSandbox: boolean;
  schemaVersion?: SchemaVersion; // '4.3' or '4.4'
  // Legal & Audit Status
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
  companyId?: string;
  schemaVersion?: SchemaVersion;
  clave: string;
  consecutivo: string;
  tipoDocumento: DocumentType;
  fechaEmision: string;
  codigoActividad: string;
  moneda: 'CRC' | 'USD';
  tipoCambio: number;
  condicionVenta: '01' | '02' | '03';
  plazoCredito?: number;
  medioPago: '01' | '02' | '03' | '04';
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
  estado: DocumentStatus;
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
  companyId?: string;
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

export interface TaxReportSummary {
  totalEmitidos: number;
  aceptados: number;
  rechazados: number;
  enProceso: number;
  errorEnvio: number;
  tasaExito: string;
  ivaDebitoFiscal: number;
  ivaCreditoFiscal: number;
  balanceIvaPagar: number;
  totalVentasNetas: number;
  avgResponseTimeMs: number;
  fechaCorte: string;
}

export interface CabysItem {
  codigo: string;
  descripcion: string;
  tarifaIva: number;
  codigoTarifa: string;
  categoria: string;
}

export interface StepGuideSuggestion {
  id: string;
  stepNumber: number;
  title: string;
  message: string;
  actionText: string;
  actionType: 'sign_submit' | 'check_async' | 'view_xml' | 'b2b_reception' | 'retry_transient' | 'open_accountant' | 'open_lawyer';
  targetDocId?: string;
}

export interface CompanyAccountingReport {
  company: Company;
  summary?: TaxReportSummary;
  salesCount: number;
  purchasesCount: number;
  rejectionsCount: number;
  totalVentas: number;
  ivaDebito: number;
  ivaCredito: number;
  ivaBalance: number;
  generatedAt: string;
  certifiedByLawyer?: string;
  certifiedByAccountant?: string;
}

export type TaxpayerConfig = Company;
