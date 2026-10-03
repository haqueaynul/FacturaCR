/**
 * @file src/services/api.ts
 * @description Robust API client for Costa Rica Factura Electrónica v4.3 backend.
 * Provides documented methods for document creation, XAdES-EPES cryptographic signing,
 * sandbox submission, asynchronous status polling, B2B reception, bulk processing,
 * multi-user authentication, multi-company registration, and compliance reporting.
 */

import {
  ElectronicDocument,
  ReceptionDocument,
  SupplierInvoice,
  TaxpayerConfig,
  AuditLogEntry,
  NotificationItem,
  TaxReportSummary,
  User,
  Company,
  CompanyAccountingReport,
} from '../types';

/**
 * Robust JSON fetch wrapper with retry logic, explicit Accept headers,
 * and safe content-type verification to prevent HTML parsing errors.
 */
async function requestJson<T>(
  url: string,
  options?: RequestInit,
  retries = 2,
  baseDelayMs = 300
): Promise<T> {
  const headers = new Headers(options?.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!res.ok) {
        if (isJson) {
          const errData = await res.json().catch(() => null);
          const message = errData?.error || `HTTP ${res.status}: ${res.statusText}`;
          throw new Error(message);
        } else {
          // If server returned non-JSON (e.g. 502 warmup or gateway error), retry if attempts remain
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt)));
            continue;
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText || 'Error del servidor'}`);
        }
      }

      // If status is OK (200) but content-type is HTML or not JSON (e.g. Vite SPA fallback before route is active)
      if (!isJson) {
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt)));
          continue;
        }
        throw new Error('Respuesta no válida del servidor (se esperaba JSON).');
      }

      const json = await res.json();
      return json as T;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Retry transient network errors (like Safari "Load failed" during quick server restart)
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt)));
        continue;
      }
    }
  }

  throw lastError || new Error('Error de conexión con el servidor.');
}

/**
 * Fetches current authenticated user.
 */
export async function fetchCurrentUser(): Promise<User> {
  const data = await requestJson<{ user: User }>('/api/auth/me');
  return data.user;
}

/**
 * Signs in a user by email and password.
 */
export async function signIn(email: string, password?: string): Promise<User> {
  const data = await requestJson<{ user: User }>('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
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
  const data = await requestJson<{ user: User }>('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role, licenseNumber }),
  });
  return data.user;
}

/**
 * Signs out current user.
 */
export async function signOut(): Promise<void> {
  await requestJson<{ success: boolean }>('/api/auth/signout', { method: 'POST' });
}

/**
 * Lists all companies accessible by current user (or all if admin).
 */
export async function fetchCompanies(): Promise<Company[]> {
  return requestJson<Company[]>('/api/companies');
}

/**
 * Registers a new client company.
 */
export async function registerCompany(payload: Record<string, unknown>): Promise<Company> {
  return requestJson<Company>('/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Switches the active company session.
 */
export async function activateCompany(companyId: string): Promise<Company> {
  const data = await requestJson<{ activeCompany: Company }>(`/api/companies/${companyId}/activate`, {
    method: 'POST',
  });
  return data.activeCompany;
}

/**
 * Fetches active company configuration.
 */
export async function fetchTaxpayerConfig(): Promise<Company> {
  return requestJson<Company>('/api/config');
}

/**
 * Updates taxpayer configuration, ATV credentials, and cryptographic certificate.
 */
export async function updateTaxpayerConfig(
  data: Partial<Company> & { atvPassword?: string; pinP12?: string; p12CertificateBase64?: string }
): Promise<{ success: boolean; message: string }> {
  return requestJson<{ success: boolean; message: string }>('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Switches the active tax schema version between v4.3 and v4.4.
 */
export async function updateSchemaVersion(
  schemaVersion: '4.3' | '4.4'
): Promise<{ success: boolean; schemaVersion: '4.3' | '4.4'; company: Company }> {
  return requestJson<{ success: boolean; schemaVersion: '4.3' | '4.4'; company: Company }>(
    '/api/config/schema-version',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemaVersion }),
    }
  );
}

/**
 * Lists electronic documents.
 */
export async function fetchDocuments(
  companyId?: string,
  estado?: string,
  tipo?: string
): Promise<ElectronicDocument[]> {
  const params = new URLSearchParams();
  if (companyId) params.append('companyId', companyId);
  if (estado) params.append('estado', estado);
  if (tipo) params.append('tipo', tipo);
  const url = `/api/documents${params.toString() ? '?' + params.toString() : ''}`;
  return requestJson<ElectronicDocument[]>(url);
}

/**
 * Creates and digitally signs a new Factura Electrónica v4.3 document.
 */
export async function createDocument(payload: Record<string, unknown>): Promise<ElectronicDocument> {
  return requestJson<ElectronicDocument>('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Triggers manual submission or re-submission.
 */
export async function submitDocument(
  documentId: string
): Promise<{ success: boolean; status: string; message: string }> {
  return requestJson<{ success: boolean; status: string; message: string }>(
    `/api/documents/${documentId}/submit`,
    { method: 'POST' }
  );
}

/**
 * Queries asynchronous processing status of a document.
 */
export async function queryDocumentStatus(documentId: string): Promise<Partial<ElectronicDocument>> {
  return requestJson<Partial<ElectronicDocument>>(`/api/documents/${documentId}/status`);
}

/**
 * Submits B2B supplier reception.
 */
export async function submitB2BReception(payload: Record<string, unknown>): Promise<ReceptionDocument> {
  return requestJson<ReceptionDocument>('/api/reception', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches all B2B reception records.
 */
export async function fetchReceptions(companyId?: string): Promise<ReceptionDocument[]> {
  const url = companyId ? `/api/reception?companyId=${companyId}` : '/api/reception';
  return requestJson<ReceptionDocument[]>(url);
}

/**
 * Fetches incoming supplier invoices awaiting B2B reception confirmation,
 * including 8-working-day legal deadline calculation.
 */
export async function fetchSupplierInvoices(companyId?: string): Promise<SupplierInvoice[]> {
  const url = companyId ? `/api/reception/supplier-invoices?companyId=${companyId}` : '/api/reception/supplier-invoices';
  return requestJson<SupplierInvoice[]>(url);
}

/**
 * Applies a legal or accounting remedy for an 8-working-day deadline violation.
 */
export async function applyDeadlineRemedy(
  invoiceId: string,
  remedyType: 'supplier_reissue' | 'cpa_late_justification' | 'rejection',
  note?: string
): Promise<{ success: boolean; invoice: SupplierInvoice; remedyType: string }> {
  return requestJson<{ success: boolean; invoice: SupplierInvoice; remedyType: string }>(
    '/api/reception/supplier-invoices/remedy',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, remedyType, note }),
    }
  );
}

/**
 * Executes bulk processing of multiple invoices.
 */
export async function runBulkProcessing(
  batchCount: number,
  taxRegime: string,
  baseAmount: number
): Promise<{ success: boolean; batchSize: number }> {
  return requestJson<{ success: boolean; batchSize: number }>('/api/documents/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batchCount, taxRegime, baseAmount }),
  });
}

/**
 * Loads pre-configured test scenarios.
 */
export async function loadPresetScenario(scenarioKey: string): Promise<ElectronicDocument> {
  return requestJson<ElectronicDocument>('/api/sandbox/preset-scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioKey }),
  });
}

/**
 * Fetches real-time compliance audit logs.
 */
export async function fetchAuditLogs(companyId?: string): Promise<AuditLogEntry[]> {
  const url = companyId ? `/api/logs?companyId=${companyId}` : '/api/logs';
  return requestJson<AuditLogEntry[]>(url);
}

/**
 * Fetches system notifications.
 */
export async function fetchNotifications(): Promise<NotificationItem[]> {
  return requestJson<NotificationItem[]>('/api/notifications');
}

/**
 * Clears in-app notifications.
 */
export async function clearNotifications(): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>('/api/notifications/clear', { method: 'POST' });
}

/**
 * Computes tax analytics, IVA debit, credit, and transmission metrics.
 */
export async function fetchTaxSummary(companyId?: string): Promise<TaxReportSummary> {
  const url = companyId ? `/api/reports/summary?companyId=${companyId}` : '/api/reports/summary';
  return requestJson<TaxReportSummary>(url);
}

/**
 * Fetches consolidated company accounting report for Admin Hub.
 */
export async function fetchAdminCompanyReport(companyId: string): Promise<CompanyAccountingReport> {
  return requestJson<CompanyAccountingReport>(`/api/admin/reports/${companyId}`);
}
