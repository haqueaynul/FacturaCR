/**
 * @file src/services/api.ts
 * @description API client for Costa Rica Factura Electrónica v4.3 backend.
 * Provides documented methods for document creation, XAdES-EPES cryptographic signing,
 * sandbox submission, asynchronous status polling, B2B reception, bulk processing,
 * multi-user authentication, multi-company registration, and compliance reporting.
 */

import {
  ElectronicDocument,
  ReceptionDocument,
  TaxpayerConfig,
  AuditLogEntry,
  NotificationItem,
  TaxReportSummary,
  User,
  Company,
  CompanyAccountingReport,
} from '../types';

/**
 * Fetches current authenticated user.
 */
export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) throw new Error('Error al obtener usuario actual.');
  const data = await res.json();
  return data.user;
}

/**
 * Signs in a user by email and password.
 */
export async function signIn(email: string, password?: string): Promise<User> {
  const res = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Credenciales inválidas.');
  }
  const data = await res.json();
  return data.user;
}

/**
 * Registers a new user with specific role (Accountant, Lawyer, Admin).
 */
export async function signUp(
  name: string,
  email: string,
  password?: string,
  role: string = 'accountant',
  licenseNumber?: string
): Promise<User> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role, licenseNumber }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al registrar usuario.');
  }
  const data = await res.json();
  return data.user;
}

/**
 * Signs out current user.
 */
export async function signOut(): Promise<void> {
  await fetch('/api/auth/signout', { method: 'POST' });
}

/**
 * Lists all companies accessible by current user (or all if admin).
 */
export async function fetchCompanies(): Promise<Company[]> {
  const res = await fetch('/api/companies');
  if (!res.ok) throw new Error('Error al listar empresas.');
  return res.json();
}

/**
 * Registers a new client company.
 */
export async function registerCompany(payload: Record<string, unknown>): Promise<Company> {
  const res = await fetch('/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al registrar empresa.');
  }
  return res.json();
}

/**
 * Switches the active company session.
 */
export async function activateCompany(companyId: string): Promise<Company> {
  const res = await fetch(`/api/companies/${companyId}/activate`, { method: 'POST' });
  if (!res.ok) throw new Error('Error al cambiar empresa activa.');
  const data = await res.json();
  return data.activeCompany;
}

/**
 * Fetches active company configuration.
 */
export async function fetchTaxpayerConfig(): Promise<Company> {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Error al obtener la configuración del contribuyente.');
  return res.json();
}

/**
 * Updates taxpayer configuration, ATV credentials, and cryptographic certificate.
 */
export async function updateTaxpayerConfig(
  data: Partial<Company> & { atvPassword?: string; pinP12?: string; p12CertificateBase64?: string }
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
 * Switches the active tax schema version between v4.3 and v4.4.
 */
export async function updateSchemaVersion(schemaVersion: '4.3' | '4.4'): Promise<{ success: boolean; schemaVersion: '4.3' | '4.4'; company: Company }> {
  const res = await fetch('/api/config/schema-version', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schemaVersion }),
  });
  if (!res.ok) throw new Error('Error al actualizar la versión de esquema.');
  return res.json();
}

/**
 * Lists electronic documents.
 */
export async function fetchDocuments(companyId?: string, estado?: string, tipo?: string): Promise<ElectronicDocument[]> {
  const params = new URLSearchParams();
  if (companyId) params.append('companyId', companyId);
  if (estado) params.append('estado', estado);
  if (tipo) params.append('tipo', tipo);
  const url = `/api/documents${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al consultar los comprobantes electrónicos.');
  return res.json();
}

/**
 * Creates and digitally signs a new Factura Electrónica v4.3 document.
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
 * Triggers manual submission or re-submission.
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
 * Queries asynchronous processing status of a document.
 */
export async function queryDocumentStatus(documentId: string): Promise<Partial<ElectronicDocument>> {
  const res = await fetch(`/api/documents/${documentId}/status`);
  if (!res.ok) throw new Error('Error al consultar el estado asíncrono en Hacienda.');
  return res.json();
}

/**
 * Submits B2B supplier reception.
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
 */
export async function fetchReceptions(companyId?: string): Promise<ReceptionDocument[]> {
  const url = companyId ? `/api/reception?companyId=${companyId}` : '/api/reception';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener recepciones B2B.');
  return res.json();
}

/**
 * Executes bulk processing of multiple invoices.
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
 * Loads pre-configured test scenarios.
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
 * Fetches real-time compliance audit logs.
 */
export async function fetchAuditLogs(companyId?: string): Promise<AuditLogEntry[]> {
  const url = companyId ? `/api/logs?companyId=${companyId}` : '/api/logs';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener registros de auditoría.');
  return res.json();
}

/**
 * Fetches system notifications.
 */
export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch('/api/notifications');
  if (!res.ok) throw new Error('Error al obtener notificaciones.');
  return res.json();
}

/**
 * Clears in-app notifications.
 */
export async function clearNotifications(): Promise<{ success: boolean }> {
  const res = await fetch('/api/notifications/clear', { method: 'POST' });
  if (!res.ok) throw new Error('Error al limpiar notificaciones.');
  return res.json();
}

/**
 * Computes tax analytics, IVA debit, credit, and transmission metrics.
 */
export async function fetchTaxSummary(companyId?: string): Promise<TaxReportSummary> {
  const url = companyId ? `/api/reports/summary?companyId=${companyId}` : '/api/reports/summary';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al calcular el resumen tributario.');
  return res.json();
}

/**
 * Fetches consolidated company accounting report for Admin Hub.
 */
export async function fetchAdminCompanyReport(companyId: string): Promise<CompanyAccountingReport> {
  const res = await fetch(`/api/admin/reports/${companyId}`);
  if (!res.ok) throw new Error('Error al generar reporte contable consolidado.');
  return res.json();
}
