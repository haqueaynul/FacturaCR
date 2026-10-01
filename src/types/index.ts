/**
 * @file src/types/index.ts
 * @description TypeScript type definitions for Costa Rica Factura Electrónica v4.3 integration.
 */

export type DocumentType = '01' | '02' | '03' | '04' | '08' | '09';

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

export interface TaxpayerConfig {
  cedula: string;
  tipoCedula: '01' | '02' | '03' | '04';
  nombre: string;
  nombreComercial?: string;
  correo: string;
  telefono?: string;
  codigoActividad: string;
  regimenTributario: TaxRegime;
  sucursal: string;
  puntoVenta: string;
  atvUsername: string;
  hasPassword?: boolean;
  hasP12Certificate?: boolean;
  hasPin?: boolean;
  useLiveSandbox: boolean;
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
  montoIva: number;
  montoTotalLinea: number;
}

export interface ElectronicDocument {
  id: string;
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
