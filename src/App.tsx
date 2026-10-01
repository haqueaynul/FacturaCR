/**
 * @file src/App.tsx
 * @description Main application container integrating Costa Rica Ministerio de Hacienda v4.3
 * Electronic Invoicing, XAdES-EPES cryptographic signing, sandbox submission pipeline,
 * B2B reception, bulk processing, and real-time audit logs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Inbox,
  Layers,
  Shield,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { DocumentGenerator } from './components/DocumentGenerator';
import { SubmissionQueue } from './components/SubmissionQueue';
import { B2BReception } from './components/B2BReception';
import { BulkProcessor } from './components/BulkProcessor';
import { AuditLogViewer } from './components/AuditLogViewer';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { SandboxSettingsModal } from './components/SandboxSettingsModal';
import { ScheduledReportsModal } from './components/ScheduledReportsModal';

import {
  ElectronicDocument,
  ReceptionDocument,
  TaxpayerConfig,
  AuditLogEntry,
  NotificationItem,
  TaxReportSummary,
} from './types';

import {
  fetchTaxpayerConfig,
  updateTaxpayerConfig,
  fetchDocuments,
  createDocument,
  submitDocument,
  queryDocumentStatus,
  submitB2BReception,
  fetchReceptions,
  runBulkProcessing,
  loadPresetScenario,
  fetchAuditLogs,
  fetchNotifications,
  clearNotifications,
  fetchTaxSummary,
} from './services/api';

/**
 * Root Application Component.
 */
export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'emision' | 'recepcion' | 'bulk' | 'auditoria'>('emision');

  // Core Data
  const [taxpayer, setTaxpayer] = useState<TaxpayerConfig | null>(null);
  const [documents, setDocuments] = useState<ElectronicDocument[]>([]);
  const [receptions, setReceptions] = useState<ReceptionDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxReportSummary | null>(null);

  // Modals & Inspection
  const [selectedDocument, setSelectedDocument] = useState<ElectronicDocument | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  // Loading States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
  const [isSubmittingRec, setIsSubmittingRec] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  /**
   * Displays transient toast notification.
   */
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  /**
   * Refreshes all system states from the backend.
   */
  const loadAllData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [cfg, docs, recs, logs, notifs, summary] = await Promise.all([
        fetchTaxpayerConfig(),
        fetchDocuments(),
        fetchReceptions(),
        fetchAuditLogs(),
        fetchNotifications(),
        fetchTaxSummary(),
      ]);

      setTaxpayer(cfg);
      setDocuments(docs);
      setReceptions(recs);
      setAuditLogs(logs);
      setNotifications(notifs);
      setTaxSummary(summary);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and periodic polling (every 4 seconds for asynchronous validation updates)
  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      loadAllData();
    }, 4000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  /**
   * Handles local document creation, signing, and transmission.
   */
  const handleCreateDocument = async (payload: Record<string, unknown>) => {
    try {
      setIsSubmittingDoc(true);
      const created = await createDocument(payload);
      showToast(`Factura ${created.consecutivo} emitida y transmitida.`);
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert('Error en emisión: ' + errorMsg);
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  /**
   * Retries submission of a failed or pending document.
   */
  const handleRetryDocument = async (docId: string) => {
    try {
      await submitDocument(docId);
      showToast('Reintento manual ejecutado con éxito.');
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert('Error al reintentar: ' + errorMsg);
    }
  };

  /**
   * Manually polls asynchronous state from Hacienda for a document.
   */
  const handleCheckStatus = async (docId: string) => {
    try {
      const statusRes = await queryDocumentStatus(docId);
      showToast(`Estado Hacienda: ${statusRes.estado?.toUpperCase()}`);
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert('Error al consultar estado: ' + errorMsg);
    }
  };

  /**
   * Handles B2B supplier reception (Mensaje Receptor 05/06/07).
   */
  const handleSubmitReception = async (payload: Record<string, unknown>) => {
    try {
      setIsSubmittingRec(true);
      await submitB2BReception(payload);
      showToast('Mensaje Receptor B2B procesado y validado.');
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert('Error en recepción: ' + errorMsg);
    } finally {
      setIsSubmittingRec(false);
    }
  };

  /**
   * Runs bulk processing of invoices.
   */
  const handleRunBulk = async (batchCount: number, taxRegime: string, baseAmount: number) => {
    try {
      setIsProcessingBulk(true);
      const res = await runBulkProcessing(batchCount, taxRegime, baseAmount);
      showToast(`Lote masivo de ${res.batchSize} facturas procesado y transmitido.`);
      await loadAllData();
      return res;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert('Error en procesamiento masivo: ' + errorMsg);
      return { success: false, batchSize: 0 };
    } finally {
      setIsProcessingBulk(false);
    }
  };

  /**
   * Saves updated taxpayer profile and encrypted credentials.
   */
  const handleSaveTaxpayerConfig = async (updated: Partial<TaxpayerConfig>) => {
    try {
      setIsSavingSettings(true);
      await updateTaxpayerConfig(updated);
      showToast('Configuración y llaves aseguradas en la bóveda.');
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert('Error guardando configuración: ' + errorMsg);
    } finally {
      setIsSavingSettings(false);
    }
  };

  /**
   * Triggers official sandbox test scenarios.
   */
  const handleTriggerScenario = async (scenarioKey: string) => {
    try {
      await loadPresetScenario(scenarioKey);
      showToast('Escenario tributario ejecutado en Sandbox.');
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert('Error ejecutando escenario: ' + errorMsg);
    }
  };

  /**
   * Clears in-app notifications.
   */
  const handleClearNotifications = async () => {
    await clearNotifications();
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navigation Header */}
      <Header
        taxpayer={taxpayer}
        notifications={notifications}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenReports={() => setIsReportsOpen(true)}
        onOpenTestScenarios={() => setIsSettingsOpen(true)}
        onClearNotifications={handleClearNotifications}
        onRefreshAll={loadAllData}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Summary Cards */}
        <DashboardStats summary={taxSummary} />

        {/* Primary Tabs Navigation */}
        <div className="flex space-x-2 border-b border-slate-800 mb-6 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('emision')}
            className={`px-4 py-2.5 rounded-lg transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'emision'
                ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Emisión & Cola de Envíos</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
              {documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recepcion')}
            className={`px-4 py-2.5 rounded-lg transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'recepcion'
                ? 'bg-slate-900 text-indigo-400 border border-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>2. B2B Recepción (Mensaje Receptor)</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
              {receptions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2.5 rounded-lg transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'bulk'
                ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Procesamiento Masivo (Bulk)</span>
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-4 py-2.5 rounded-lg transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'auditoria'
                ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>4. Auditoría y Bitácora Oficial</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Emisión & Cola */}
        {activeTab === 'emision' && (
          <div>
            <DocumentGenerator
              taxpayer={taxpayer}
              onSubmit={handleCreateDocument}
              isSubmitting={isSubmittingDoc}
            />

            <SubmissionQueue
              documents={documents}
              onSelectDocument={(doc) => setSelectedDocument(doc)}
              onRetryDocument={handleRetryDocument}
              onCheckStatus={handleCheckStatus}
              isProcessing={isRefreshing}
            />
          </div>
        )}

        {/* Tab 2: B2B Recepción */}
        {activeTab === 'recepcion' && (
          <B2BReception
            receptions={receptions}
            onSubmitReception={handleSubmitReception}
            isSubmitting={isSubmittingRec}
          />
        )}

        {/* Tab 3: Bulk Processing */}
        {activeTab === 'bulk' && (
          <div>
            <BulkProcessor
              taxpayer={taxpayer}
              onRunBulk={handleRunBulk}
              isProcessing={isProcessingBulk}
            />

            {/* List the resulting documents */}
            <SubmissionQueue
              documents={documents}
              onSelectDocument={(doc) => setSelectedDocument(doc)}
              onRetryDocument={handleRetryDocument}
              onCheckStatus={handleCheckStatus}
              isProcessing={isRefreshing}
            />
          </div>
        )}

        {/* Tab 4: Audit Logs */}
        {activeTab === 'auditoria' && (
          <AuditLogViewer logs={auditLogs} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Ministerio de Hacienda de Costa Rica · Dirección General de Tributación · Formato v4.3
          </span>
          <span className="font-mono text-[11px] text-slate-600">
            Firma XAdES-EPES · Esquemas XML v4.3 · Bóveda AES-256-GCM
          </span>
        </div>
      </footer>

      {/* Modals */}
      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {isSettingsOpen && (
        <SandboxSettingsModal
          taxpayer={taxpayer}
          onSave={handleSaveTaxpayerConfig}
          onTriggerScenario={handleTriggerScenario}
          onClose={() => setIsSettingsOpen(false)}
          isSaving={isSavingSettings}
        />
      )}

      {isReportsOpen && (
        <ScheduledReportsModal
          summary={taxSummary}
          taxpayer={taxpayer}
          documents={documents}
          receptions={receptions}
          onClose={() => setIsReportsOpen(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
