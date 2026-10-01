/**
 * @file src/services/api.ts
 * @description API client for Costa Rica Factura Electrónica v4.3 backend.
 * Provides documented methods for document creation, XAdES-EPES cryptographic signing,
 * sandbox submission, asynchronous status polling, B2B reception, bulk processing,
 * and compliance reporting.
 */

import {
  ElectronicDocument,
  ReceptionDocument,
  TaxpayerConfig,
  AuditLogEntry,
  NotificationItem,
  TaxReportSummary,
} from '../types';

/**
 * Fetches current taxpayer configuration and security vault status.
 * @returns {Promise<TaxpayerConfig>} Taxpayer details and sandbox mode.
 */
export async function fetchTaxpayerConfig(): Promise<TaxpayerConfig> {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Error al obtener la configuración del contribuyente.');
  return res.json();
}

/**
 * Updates taxpayer configuration, ATV credentials, and cryptographic certificate.
 * @param {Partial<TaxpayerConfig> & { atvPassword?: string; pinP12?: string; p12CertificateBase64?: string }} data - Config payload.
 * @returns {Promise<{ success: boolean; message: string }>} Server response.
 */
export async function updateTaxpayerConfig(
  data: Partial<TaxpayerConfig> & { atvPassword?: string; pinP12?: string; p12CertificateBase64?: string }
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al guardar la configuración en la bóveda cifrada.');
  return res.json();
}

/**
 * Lists all electronic documents stored in the system.
 * @param {string} [estado] - Optional filter by status ('aceptado', 'procesando', 'rechazado', etc.).
 * @param {string} [tipo] - Optional filter by document type ('01', '04', etc.).
 * @returns {Promise<ElectronicDocument[]>} Array of electronic documents.
 */
export async function fetchDocuments(estado?: string, tipo?: string): Promise<ElectronicDocument[]> {
  const params = new URLSearchParams();
  if (estado) params.append('estado', estado);
  if (tipo) params.append('tipo', tipo);
  const url = `/api/documents${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al consultar los comprobantes electrónicos.');
  return res.json();
}

/**
 * Creates and digitally signs a new Factura Electrónica v4.3 document.
 * @param {Record<string, unknown>} payload - Document header, receptor, and line items.
 * @returns {Promise<ElectronicDocument>} Created and signed document.
 */
export async function createDocument(payload: Record<string, unknown>): Promise<ElectronicDocument> {
  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al emitir el comprobante electrónico.');
  }
  return res.json();
}

/**
 * Triggers manual submission or re-submission of an electronic document to Hacienda Sandbox.
 * @param {string} documentId - Document ID.
 * @returns {Promise<{ success: boolean; status: string; message: string }>} Submission outcome.
 */
export async function submitDocument(documentId: string): Promise<{ success: boolean; status: string; message: string }> {
  const res = await fetch(`/api/documents/${documentId}/submit`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Fallo en la comunicación con el Sandbox de Hacienda.');
  }
  return res.json();
}

/**
 * Queries asynchronous processing status of a document from Hacienda Sandbox.
 * @param {string} documentId - Document ID.
 * @returns {Promise<Partial<ElectronicDocument>>} Updated document status details.
 */
export async function queryDocumentStatus(documentId: string): Promise<Partial<ElectronicDocument>> {
  const res = await fetch(`/api/documents/${documentId}/status`);
  if (!res.ok) throw new Error('Error al consultar el estado asíncrono en Hacienda.');
  return res.json();
}

/**
 * Submits B2B supplier reception (Mensaje Receptor 05, 06, 07).
 * @param {Record<string, unknown>} payload - B2B reception details.
 * @returns {Promise<ReceptionDocument>} Created reception record.
 */
export async function submitB2BReception(payload: Record<string, unknown>): Promise<ReceptionDocument> {
  const res = await fetch('/api/reception', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al procesar la recepción B2B del comprobante.');
  }
  return res.json();
}

/**
 * Fetches all B2B reception records.
 * @returns {Promise<ReceptionDocument[]>}
 */
export async function fetchReceptions(): Promise<ReceptionDocument[]> {
  const res = await fetch('/api/reception');
  if (!res.ok) throw new Error('Error al obtener recepciones B2B.');
  return res.json();
}

/**
 * Executes bulk processing of multiple invoices.
 * @param {number} batchCount - Number of documents to generate.
 * @param {string} taxRegime - Tax regime.
 * @param {number} baseAmount - Base invoice amount.
 * @returns {Promise<{ success: boolean; batchSize: number }>}
 */
export async function runBulkProcessing(
  batchCount: number,
  taxRegime: string,
  baseAmount: number
): Promise<{ success: boolean; batchSize: number }> {
  const res = await fetch('/api/documents/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batchCount, taxRegime, baseAmount }),
  });
  if (!res.ok) throw new Error('Error en el procesamiento masivo de facturación.');
  return res.json();
}

/**
 * Loads pre-configured test scenarios for sandbox verification.
 * @param {string} scenarioKey - Scenario identifier.
 * @returns {Promise<ElectronicDocument>} Created document under scenario rules.
 */
export async function loadPresetScenario(scenarioKey: string): Promise<ElectronicDocument> {
  const res = await fetch('/api/sandbox/preset-scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioKey }),
  });
  if (!res.ok) throw new Error('Error al cargar el escenario tributario de prueba.');
  return res.json();
}

/**
 * Fetches the real-time compliance audit log trail.
 * @returns {Promise<AuditLogEntry[]>} Array of logged events.
 */
export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  const res = await fetch('/api/logs');
  if (!res.ok) throw new Error('Error al obtener registros de auditoría.');
  return res.json();
}

/**
 * Fetches system notifications.
 * @returns {Promise<NotificationItem[]>}
 */
export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch('/api/notifications');
  if (!res.ok) throw new Error('Error al obtener notificaciones.');
  return res.json();
}

/**
 * Clears in-app notifications.
 * @returns {Promise<{ success: boolean }>}
 */
export async function clearNotifications(): Promise<{ success: boolean }> {
  const res = await fetch('/api/notifications/clear', { method: 'POST' });
  if (!res.ok) throw new Error('Error al limpiar notificaciones.');
  return res.json();
}

/**
 * Computes tax analytics, IVA debit, credit, and transmission metrics.
 * @returns {Promise<TaxReportSummary>} Tax summary calculations.
 */
export async function fetchTaxSummary(): Promise<TaxReportSummary> {
  const res = await fetch('/api/reports/summary');
  if (!res.ok) throw new Error('Error al calcular el resumen tributario.');
  return res.json();
}
