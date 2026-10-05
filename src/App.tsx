/**
 * @file src/App.tsx
 * @description Main application container integrating Costa Rica Factura Electrónica v4.3,
 * multi-language (EN / ES), dark/bright theme, multi-user roles (Accountant, Lawyer, Admin),
 * multi-company management, automated next-step suggestions, and full accounting reports.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Inbox,
  Layers,
  Shield,
  Calculator,
  Scale,
  Building,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Language, translations } from './i18n';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { StepGuideBanner } from './components/StepGuideBanner';
import { DocumentGenerator } from './components/DocumentGenerator';
import { SubmissionQueue } from './components/SubmissionQueue';
import { B2BReception } from './components/B2BReception';
import { BulkProcessor } from './components/BulkProcessor';
import { AuditLogViewer } from './components/AuditLogViewer';
import { AccountantDesk } from './components/AccountantDesk';
import { LawyerDesk } from './components/LawyerDesk';
import { AdminHub } from './components/AdminHub';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { SandboxSettingsModal } from './components/SandboxSettingsModal';
import { ScheduledReportsModal } from './components/ScheduledReportsModal';
import { CompanyModal } from './components/CompanyModal';
import { AuthModal } from './components/AuthModal';
import { VersionComparisonModal } from './components/VersionComparisonModal';
import { ApiDocsModal } from './components/ApiDocsModal';

import {
  ElectronicDocument,
  ReceptionDocument,
  SupplierInvoice,
  Company,
  AuditLogEntry,
  NotificationItem,
  TaxReportSummary,
  User,
  SchemaVersion,
} from './types';

import {
  fetchCurrentUser,
  signIn,
  signUp,
  signOut,
  fetchCompanies,
  registerCompany,
  activateCompany,
  fetchTaxpayerConfig,
  updateTaxpayerConfig,
  updateSchemaVersion,
  fetchDocuments,
  createDocument,
  submitDocument,
  queryDocumentStatus,
  submitB2BReception,
  fetchReceptions,
  fetchSupplierInvoices,
  applyDeadlineRemedy,
  runBulkProcessing,
  loadPresetScenario,
  fetchAuditLogs,
  fetchNotifications,
  clearNotifications,
  fetchTaxSummary,
} from './services/api';

export default function App() {
  // Localization & Theme Preferences
  const [lang, setLang] = useState<Language>('en'); // Default to English per user request
  const [theme, setTheme] = useState<'dark' | 'bright'>(() => {
    try {
      const saved = localStorage.getItem('cr_factura_theme');
      return saved === 'dark' ? 'dark' : 'bright'; // Light theme is default
    } catch {
      return 'bright';
    }
  });

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'bright' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('cr_factura_theme', next);
    } catch {
      // Ignore storage errors
    }
  };

  // Navigation
  const [activeTab, setActiveTab] = useState<'emision' | 'recepcion' | 'bulk' | 'auditoria' | 'accountant' | 'lawyer' | 'admin'>('emision');

  // Multi-user & Multi-company
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Core Data
  const [documents, setDocuments] = useState<ElectronicDocument[]>([]);
  const [receptions, setReceptions] = useState<ReceptionDocument[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxReportSummary | null>(null);

  // Modals
  const [selectedDocument, setSelectedDocument] = useState<ElectronicDocument | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);
  const [isSwitchingVersion, setIsSwitchingVersion] = useState(false);

  // Next-Step Guide Banner
  const [isGuideDismissed, setIsGuideDismissed] = useState(false);

  // Loading States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
  const [isSubmittingRec, setIsSubmittingRec] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const t = translations[lang];

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const isSyncingRef = React.useRef(false);

  /**
   * Refreshes all system states with resilient settled results.
   */
  const loadAllData = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      setIsRefreshing(true);
      const results = await Promise.allSettled([
        fetchCurrentUser(),
        fetchCompanies(),
        fetchTaxpayerConfig(),
        fetchDocuments(),
        fetchReceptions(),
        fetchSupplierInvoices(),
        fetchAuditLogs(),
        fetchNotifications(),
        fetchTaxSummary(),
      ]);

      const [usr, comps, cfg, docs, recs, suppInvs, logs, notifs, summary] = results;

      if (usr.status === 'fulfilled' && usr.value) setUser(usr.value);
      if (comps.status === 'fulfilled' && comps.value) setCompanies(comps.value);
      if (cfg.status === 'fulfilled' && cfg.value) setCompany(cfg.value);
      if (docs.status === 'fulfilled' && docs.value) setDocuments(docs.value);
      if (recs.status === 'fulfilled' && recs.value) setReceptions(recs.value);
      if (suppInvs.status === 'fulfilled' && suppInvs.value) setSupplierInvoices(suppInvs.value);
      if (logs.status === 'fulfilled' && logs.value) setAuditLogs(logs.value);
      if (notifs.status === 'fulfilled' && notifs.value) setNotifications(notifs.value);
      if (summary.status === 'fulfilled' && summary.value) setTaxSummary(summary.value);
    } catch (err: unknown) {
      // Gracefully handle any unexpected sync exception without crashing the UI
      console.warn('Sync notice:', err instanceof Error ? err.message : String(err));
    } finally {
      isSyncingRef.current = false;
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 5000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // Actions
  const handleCreateDocument = async (payload: Record<string, unknown>) => {
    try {
      setIsSubmittingDoc(true);
      const created = await createDocument(payload);
      showToast(lang === 'en' ? `Invoice ${created.consecutivo} emitted & signed.` : `Factura ${created.consecutivo} emitida y firmada.`);
      setIsGuideDismissed(false); // Re-show guide for next step
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  const handleRetryDocument = async (docId: string) => {
    try {
      await submitDocument(docId);
      showToast(lang === 'en' ? 'Retry triggered successfully.' : 'Reintento ejecutado con éxito.');
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg, 'error');
    }
  };

  const handleCheckStatus = async (docId: string) => {
    try {
      const statusRes = await queryDocumentStatus(docId);
      showToast(lang === 'en' ? `Status: ${statusRes.estado?.toUpperCase()}` : `Estado: ${statusRes.estado?.toUpperCase()}`);
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg, 'error');
    }
  };

  const handleSubmitReception = async (payload: Record<string, unknown>) => {
    try {
      setIsSubmittingRec(true);
      await submitB2BReception(payload);
      showToast(lang === 'en' ? 'B2B Reception message validated by Hacienda.' : 'Mensaje Receptor B2B procesado y validado.');
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmittingRec(false);
    }
  };

  const handleApplyRemedy = async (
    invoiceId: string,
    remedyType: 'supplier_reissue' | 'cpa_late_justification' | 'rejection',
    note?: string
  ) => {
    try {
      await applyDeadlineRemedy(invoiceId, remedyType, note);
      showToast(
        lang === 'en'
          ? (remedyType === 'supplier_reissue'
              ? 'Supplier re-issuance simulated: 8-day clock reset!'
              : remedyType === 'cpa_late_justification'
              ? 'Late acceptance recorded with CPA audit note (Condition 04).'
              : 'Invoice formally rejected (Mensaje Receptor 07).')
          : (remedyType === 'supplier_reissue'
              ? '¡Refacturación del proveedor simulada: Plazo legal reiniciado!'
              : remedyType === 'cpa_late_justification'
              ? 'Aceptación tardía registrada con nota CPA (Condición 04).'
              : 'Factura rechazada formalmente (Mensaje Receptor 07).')
      );
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg, 'error');
    }
  };

  const handleRunBulk = async (batchCount: number, taxRegime: string, baseAmount: number) => {
    try {
      setIsProcessingBulk(true);
      const res = await runBulkProcessing(batchCount, taxRegime, baseAmount);
      showToast(lang === 'en' ? `Bulk batch of ${res.batchSize} invoices transmitted.` : `Lote masivo de ${res.batchSize} facturas procesado.`);
      await loadAllData();
      return res;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg, 'error');
      return { success: false, batchSize: 0 };
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleSelectCompany = async (companyId: string) => {
    try {
      const active = await activateCompany(companyId);
      setCompany(active);
      showToast(lang === 'en' ? `Switched active company to ${active.nombre}.` : `Cambiado a empresa ${active.nombre}.`);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterCompany = async (payload: Record<string, unknown>) => {
    try {
      setIsSavingCompany(true);
      const created = await registerCompany(payload);
      showToast(lang === 'en' ? `Company ${created.nombre} enrolled.` : `Empresa ${created.nombre} inscrita.`);
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg, 'error');
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleSignIn = async (email: string, password?: string) => {
    try {
      setIsAuthSubmitting(true);
      const usr = await signIn(email, password);
      setUser(usr);
      showToast(lang === 'en' ? `Signed in as ${usr.name} (${usr.role}).` : `Sesión iniciada como ${usr.name}.`);
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg, 'error');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleSignUp = async (name: string, email: string, password?: string, role?: string, licenseNumber?: string) => {
    try {
      setIsAuthSubmitting(true);
      const usr = await signUp(name, email, password, role, licenseNumber);
      setUser(usr);
      showToast(lang === 'en' ? `Account created for ${usr.name}.` : `Cuenta creada para ${usr.name}.`);
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg, 'error');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    showToast(lang === 'en' ? 'Signed out.' : 'Sesión cerrada.');
    await loadAllData();
  };

  const handleSaveTaxpayerConfig = async (updated: Partial<Company>) => {
    try {
      setIsSavingSettings(true);
      await updateTaxpayerConfig(updated);
      showToast(lang === 'en' ? 'Company settings & vault updated.' : 'Configuración actualizada en bóveda.');
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg, 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTriggerScenario = async (scenarioKey: string) => {
    try {
      await loadPresetScenario(scenarioKey);
      showToast(lang === 'en' ? 'Sandbox test scenario executed.' : 'Escenario de prueba ejecutado.');
      setIsGuideDismissed(false);
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg, 'error');
    }
  };

  const handleGuideAction = (actionType: string, docId?: string) => {
    if (actionType === 'sign_submit' && docId) {
      submitDocument(docId);
    } else if (actionType === 'check_async' && docId) {
      handleCheckStatus(docId);
    } else if (actionType === 'view_xml' && docId) {
      const doc = documents.find((d) => d.id === docId);
      if (doc) setSelectedDocument(doc);
    } else if (actionType === 'retry_transient' && docId) {
      handleRetryDocument(docId);
    }
  };

  const isBright = theme === 'bright';
  const latestDoc = documents[0];
  const activeVersion: SchemaVersion = company?.schemaVersion || '4.4';

  const handleSwitchVersion = async (targetVersion: SchemaVersion) => {
    try {
      setIsSwitchingVersion(true);
      const res = await updateSchemaVersion(targetVersion);
      setCompany(res.company);
      showToast(`${t.switchSuccessToast} v${targetVersion}`);
      await loadAllData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg, 'error');
    } finally {
      setIsSwitchingVersion(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isBright ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Header */}
      <Header
        lang={lang}
        theme={theme}
        company={company}
        companies={companies}
        user={user}
        notifications={notifications}
        activeVersion={activeVersion}
        onSwitchVersion={handleSwitchVersion}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
        onToggleTheme={handleToggleTheme}
        onToggleLang={() => setLang(lang === 'es' ? 'en' : 'es')}
        onSelectCompany={handleSelectCompany}
        onOpenNewCompany={() => setIsCompanyModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onOpenReports={() => setIsReportsOpen(true)}
        onOpenTestScenarios={() => setIsSettingsOpen(true)}
        onClearNotifications={() => { clearNotifications(); setNotifications([]); }}
        onRefreshAll={loadAllData}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Summary Cards */}
        <DashboardStats lang={lang} theme={theme} summary={taxSummary} />

        {/* Automated Next-Step Suggestion Guide */}
        <StepGuideBanner
          lang={lang}
          latestDoc={latestDoc}
          onActionClick={handleGuideAction}
          onDismiss={() => setIsGuideDismissed(true)}
          isDismissed={isGuideDismissed}
        />

        {/* Primary Navigation Tabs */}
        <div className={`flex space-x-2 border-b mb-6 overflow-x-auto pb-1 text-xs font-semibold ${
          isBright ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('emision')}
            className={`px-3.5 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'emision'
                ? (isBright ? 'bg-white text-emerald-600 border border-slate-200 shadow-xs' : 'bg-slate-900 text-emerald-400 border border-slate-800')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t.tabInvoicing}</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
              {documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recepcion')}
            className={`px-3.5 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'recepcion'
                ? (isBright ? 'bg-white text-indigo-600 border border-slate-200 shadow-xs' : 'bg-slate-900 text-indigo-400 border border-slate-800')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>{t.tabB2BReception}</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
              {receptions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-3.5 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'bulk'
                ? (isBright ? 'bg-white text-emerald-600 border border-slate-200 shadow-xs' : 'bg-slate-900 text-emerald-400 border border-slate-800')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.tabBulk}</span>
          </button>

          <button
            onClick={() => setActiveTab('accountant')}
            className={`px-3.5 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'accountant'
                ? (isBright ? 'bg-white text-blue-600 border border-slate-200 shadow-xs' : 'bg-slate-900 text-blue-400 border border-slate-800')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4 text-blue-500" />
            <span>{t.tabAccountantDesk}</span>
          </button>

          <button
            onClick={() => setActiveTab('lawyer')}
            className={`px-3.5 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'lawyer'
                ? (isBright ? 'bg-white text-purple-600 border border-slate-200 shadow-xs' : 'bg-slate-900 text-purple-400 border border-slate-800')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4 text-indigo-400" />
            <span>{t.tabLawyerDesk}</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3.5 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'admin'
                ? (isBright ? 'bg-white text-purple-600 border border-slate-200 shadow-xs' : 'bg-slate-900 text-purple-400 border border-slate-800')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4 text-purple-500" />
            <span>{t.tabAdminHub}</span>
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-3.5 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'auditoria'
                ? (isBright ? 'bg-white text-emerald-600 border border-slate-200 shadow-xs' : 'bg-slate-900 text-emerald-400 border border-slate-800')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{t.tabAudit}</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Invoicing */}
        {activeTab === 'emision' && (
          <div>
            <DocumentGenerator
              lang={lang}
              theme={theme}
              company={company}
              onSubmit={handleCreateDocument}
              isSubmitting={isSubmittingDoc}
            />

            <SubmissionQueue
              lang={lang}
              theme={theme}
              documents={documents}
              onSelectDocument={(doc) => setSelectedDocument(doc)}
              onRetryDocument={handleRetryDocument}
              onCheckStatus={handleCheckStatus}
              isProcessing={isRefreshing}
            />
          </div>
        )}

        {/* Tab 2: B2B Reception */}
        {activeTab === 'recepcion' && (
          <B2BReception
            lang={lang}
            theme={theme}
            receptions={receptions}
            supplierInvoices={supplierInvoices}
            onSubmitReception={handleSubmitReception}
            onApplyRemedy={handleApplyRemedy}
            isSubmitting={isSubmittingRec}
          />
        )}

        {/* Tab 3: Bulk Processing */}
        {activeTab === 'bulk' && (
          <div>
            <BulkProcessor
              lang={lang}
              theme={theme}
              company={company}
              onRunBulk={handleRunBulk}
              isProcessing={isProcessingBulk}
            />

            <SubmissionQueue
              lang={lang}
              theme={theme}
              documents={documents}
              onSelectDocument={(doc) => setSelectedDocument(doc)}
              onRetryDocument={handleRetryDocument}
              onCheckStatus={handleCheckStatus}
              isProcessing={isRefreshing}
            />
          </div>
        )}

        {/* Tab 4: Accountant Desk */}
        {activeTab === 'accountant' && (
          <AccountantDesk
            lang={lang}
            theme={theme}
            company={company}
            documents={documents}
            receptions={receptions}
            summary={taxSummary}
            onOpenNewDoc={() => setActiveTab('emision')}
            onOpenB2B={() => setActiveTab('recepcion')}
          />
        )}

        {/* Tab 5: Lawyer Desk */}
        {activeTab === 'lawyer' && (
          <LawyerDesk
            lang={lang}
            theme={theme}
            company={company}
            documents={documents}
          />
        )}

        {/* Tab 6: Admin Enterprise Hub */}
        {activeTab === 'admin' && (
          <AdminHub
            lang={lang}
            theme={theme}
            companies={companies}
            activeCompanyId={company?.id || 'COMP-1'}
            onActivateCompany={handleSelectCompany}
            onOpenNewCompanyModal={() => setIsCompanyModalOpen(true)}
          />
        )}

        {/* Tab 7: Audit Logs */}
        {activeTab === 'auditoria' && (
          <AuditLogViewer lang={lang} theme={theme} logs={auditLogs} />
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-4 text-xs ${
        isBright ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-900 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="space-y-1">
            <div className={`font-semibold ${isBright ? 'text-slate-800' : 'text-slate-300'}`}>
              {t.footerAuthority}
            </div>
            <div className="text-[11px] text-slate-400">
              {t.footerRegulations}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 font-sans">
              {t.footerEnvironment} (v{activeVersion})
            </span>
            <span className="text-slate-500">
              {t.footerSecurity}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedDocument && (
        <DocumentDetailModal
          lang={lang}
          theme={theme}
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {isSettingsOpen && (
        <SandboxSettingsModal
          lang={lang}
          theme={theme}
          taxpayer={company}
          onSave={handleSaveTaxpayerConfig}
          onTriggerScenario={handleTriggerScenario}
          onClose={() => setIsSettingsOpen(false)}
          isSaving={isSavingSettings}
        />
      )}

      {isReportsOpen && (
        <ScheduledReportsModal
          lang={lang}
          theme={theme}
          summary={taxSummary}
          taxpayer={company}
          documents={documents}
          receptions={receptions}
          onClose={() => setIsReportsOpen(false)}
        />
      )}

      {isCompanyModalOpen && (
        <CompanyModal
          lang={lang}
          theme={theme}
          onRegister={handleRegisterCompany}
          onClose={() => setIsCompanyModalOpen(false)}
          isSubmitting={isSavingCompany}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal
          lang={lang}
          theme={theme}
          currentUser={user}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onSignOut={handleSignOut}
          onClose={() => setIsAuthModalOpen(false)}
          isSubmitting={isAuthSubmitting}
        />
      )}

      {isVersionModalOpen && (
        <VersionComparisonModal
          lang={lang}
          theme={theme}
          activeVersion={activeVersion}
          onSwitchVersion={handleSwitchVersion}
          onClose={() => setIsVersionModalOpen(false)}
          isSwitching={isSwitchingVersion}
        />
      )}

      {isApiDocsOpen && (
        <ApiDocsModal
          lang={lang}
          theme={theme}
          onClose={() => setIsApiDocsOpen(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-slide-up border ${
          toast.type === 'error'
            ? isBright
              ? 'bg-white border-rose-400 text-rose-800 shadow-rose-100'
              : 'bg-slate-900 border-rose-500/50 text-rose-300'
            : toast.type === 'info'
            ? isBright
              ? 'bg-white border-sky-400 text-sky-800 shadow-sky-100'
              : 'bg-slate-900 border-sky-500/50 text-sky-300'
            : isBright
            ? 'bg-white border-emerald-400 text-emerald-800 shadow-emerald-100'
            : 'bg-slate-900 border-emerald-500/40 text-emerald-300'
        }`}>
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-sky-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
