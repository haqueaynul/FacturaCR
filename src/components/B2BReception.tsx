/**
 * @file src/components/B2BReception.tsx
 * @description Step 5: B2B Acceptance / Rejection (Recepción de Comprobantes - Mensaje Receptor v4.3/v4.4).
 * Enforces the Costa Rica Law 9635 8-working-day statutory deadline, detects violations,
 * displays overdue items, and provides official tax remedies to resolve expired deadlines.
 */

import React, { useState } from 'react';
import {
  Inbox,
  CheckCircle,
  AlertTriangle,
  Clock,
  RotateCcw,
  Copy,
  FileSpreadsheet,
  XCircle,
  Send,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Hash,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { ReceptionDocument, SupplierInvoice } from '../types';

interface B2BReceptionProps {
  lang: Language;
  theme: 'dark' | 'bright';
  receptions: ReceptionDocument[];
  supplierInvoices: SupplierInvoice[];
  onSubmitReception: (payload: Record<string, unknown>) => Promise<void>;
  onApplyRemedy: (invoiceId: string, remedyType: 'supplier_reissue' | 'cpa_late_justification' | 'rejection', note?: string) => Promise<void>;
  isSubmitting: boolean;
}

export const B2BReception: React.FC<B2BReceptionProps> = ({
  lang,
  theme,
  receptions,
  supplierInvoices,
  onSubmitReception,
  onApplyRemedy,
  isSubmitting,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';

  // Active form state
  const [claveDocumento, setClaveDocumento] = useState('');
  const [emisorNombre, setEmisorNombre] = useState('INSTITUTO COSTARRICENSE DE ELECTRICIDAD (ICE)');
  const [emisorCedula, setEmisorCedula] = useState('4000042139');
  const [montoTotalImpuesto, setMontoTotalImpuesto] = useState(13000);
  const [totalFactura, setTotalFactura] = useState(113000);
  const [tipoMensaje, setTipoMensaje] = useState<'05' | '06' | '07'>('05');
  const [detalleMensaje, setDetalleMensaje] = useState('Servicios de telecomunicaciones y energía aceptados con crédito pleno.');
  const [condicionImpuesto, setCondicionImpuesto] = useState<'01' | '02' | '03' | '04' | '05'>('01');
  const [montoCredito, setMontoCredito] = useState(13000);

  // Remediation states
  const [selectedViolatedInvoiceId, setSelectedViolatedInvoiceId] = useState<string | null>(null);
  const [isRemedyPanelOpen, setIsRemedyPanelOpen] = useState(true);
  const [activeHint, setActiveHint] = useState<string | null>(t.hintB2BMensaje);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [remedyLoadingId, setRemedyLoadingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter violated (overdue) supplier invoices
  const violatedInvoices = supplierInvoices.filter((inv) => inv.isViolated && inv.estadoRecepcion === 'pendiente');
  const warningInvoices = supplierInvoices.filter((inv) => inv.isWarning && inv.estadoRecepcion === 'pendiente');

  /**
   * Pre-fills the reception form using a supplier invoice from the inbox.
   */
  const handleSelectInvoice = (inv: SupplierInvoice) => {
    setClaveDocumento(inv.clave);
    setEmisorNombre(inv.emisorNombre);
    setEmisorCedula(inv.emisorCedula);
    setMontoTotalImpuesto(inv.montoTotalImpuesto);
    setTotalFactura(inv.totalComprobante);
    setMontoCredito(inv.montoTotalImpuesto);

    if (inv.isViolated) {
      setCondicionImpuesto('04'); // Operational expense without immediate automatic VAT credit
      setDetalleMensaje(
        lang === 'en'
          ? 'Late acceptance with CPA audit note under Art. 48 of Tax Code for corporate income tax deduction.'
          : 'Aceptación extemporánea con justificación contable para deducción de renta (Art. 48 CNPT).'
      );
    } else {
      setCondicionImpuesto('01');
      setDetalleMensaje(
        lang === 'en'
          ? 'Goods and services accepted on-time with 100% full VAT tax credit.'
          : 'Comprobante recibido dentro del plazo legal con derecho a crédito fiscal pleno (100%).'
      );
    }

    // Scroll smoothly to form
    const formEl = document.getElementById('b2b-form-section');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Generates a formal legal letter to the supplier requesting an annulment Credit Note (03) and re-issuance.
   */
  const handleCopySupplierLetter = (inv: SupplierInvoice) => {
    const letter = `ASUNTO: Solicitud de Nota de Crédito y Refacturación por Vencimiento de Plazo Legal (Ley 9635 Art. 27)

Estimado(a) Departamento de Cuentas por Cobrar de ${inv.emisorNombre}:

Por medio de la presente, solicitamos su colaboración para anular mediante Nota de Crédito Electrónica (código 03) y refacturar con fecha de hoy el siguiente comprobante:

- Número de Clave Numérica: ${inv.clave}
- Consecutivo: ${inv.consecutivo}
- Fecha de Emisión Original: ${new Date(inv.fechaEmision).toLocaleDateString()}
- Monto Total: ₡${inv.totalComprobante.toLocaleString()} (IVA: ₡${inv.montoTotalImpuesto.toLocaleString()})

MOTIVO LEGAL:
De conformidad con el Artículo 27 del Reglamento de la Ley de Fortalecimiento de las Finanzas Públicas (Ley 9635) y resoluciones DGT-R-033-2019 / DGT-R-028-2023 de la Dirección General de Tributación, el plazo de ocho (8) días hábiles para emitir el Mensaje Receptor ha expirado (${inv.diasHabilesTranscurridos} días hábiles transcurridos).

Para mantener la deducibilidad tributaria y el aprovechamiento legal del Crédito Fiscal de IVA sin incurrir en contingencias ante el Ministerio de Hacienda, requerimos amablemente que nos emitan una Nota de Crédito por el monto total y una nueva factura electrónica con fecha actual.

Agradecemos de antemano su pronta atención.

Atentamente,
Departamento de Finanzas y Contabilidad`;

    navigator.clipboard.writeText(letter);
    setCopyFeedback(inv.id);
    setTimeout(() => setCopyFeedback(null), 4000);
  };

  const handleApplyRemedyAction = async (
    invoiceId: string,
    remedyType: 'supplier_reissue' | 'cpa_late_justification' | 'rejection'
  ) => {
    try {
      setRemedyLoadingId(invoiceId);
      await onApplyRemedy(invoiceId, remedyType);
    } finally {
      setRemedyLoadingId(null);
    }
  };

  const handleFillSampleClave = () => {
    const day = String(new Date().getDate()).padStart(2, '0');
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const year = String(new Date().getFullYear()).slice(-2);
    const mockClave = `506${day}${month}${year}00400004213900100001010000008899187654321`;
    setClaveDocumento(mockClave);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claveDocumento || claveDocumento.length !== 50) {
      setFormError(lang === 'en' ? 'Supplier invoice 50-digit clave must be exactly 50 digits.' : 'La clave del comprobante debe ser exactamente de 50 dígitos.');
      return;
    }
    setFormError(null);

    const payload = {
      claveDocumento,
      emisorNombre,
      emisorCedula,
      montoTotalImpuesto,
      totalFactura,
      tipoMensaje,
      detalleMensaje,
      condicionImpuesto,
      montoTotalImpuestoAcreditar: condicionImpuesto === '04' ? 0 : montoCredito,
    };

    await onSubmitReception(payload);
    setClaveDocumento('');
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* SECTION 1: 8-WORKING-DAY LEGAL DEADLINE VIOLATION & REMEDY CENTER   */}
      {/* ------------------------------------------------------------------ */}
      {violatedInvoices.length > 0 && (
        <div className={`rounded-xl border p-5 transition-all shadow-md ${
          isBright ? 'bg-rose-50/90 border-rose-300 text-slate-800' : 'bg-rose-950/30 border-rose-600/50 text-slate-200'
        }`}>
          {/* Violation Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-rose-200 dark:border-rose-900/60 gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-500 rounded-lg shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                    {t.deadlineViolationTitle}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white font-mono">
                    {violatedInvoices.length} {lang === 'en' ? 'Overdue Invoices' : 'Comprobantes Vencidos'}
                  </span>
                </div>
                <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                  {t.deadlineViolationSubtitle}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsRemedyPanelOpen(!isRemedyPanelOpen)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 flex items-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>{isRemedyPanelOpen ? (lang === 'en' ? 'Hide Remedy Guide' : 'Ocultar Guía de Solución') : (lang === 'en' ? 'View Remedy Solutions' : 'Ver Soluciones de Respaldo')}</span>
              {isRemedyPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* List of Violated Documents */}
          <div className="mt-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
              {lang === 'en' ? 'Items Violating the Statutory 8-Day Deadline:' : 'Comprobantes que Superaron el Plazo Legal:'}
            </span>

            <div className="grid grid-cols-1 gap-3">
              {violatedInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                    isBright ? 'bg-white border-rose-200 shadow-xs' : 'bg-slate-900 border-rose-900/60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {inv.emisorNombre}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        (Cédula: {inv.emisorCedula})
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {inv.diasHabilesTranscurridos} {lang === 'en' ? 'working days' : 'días hábiles'} ({Math.abs(inv.diasRestantesOVencidos)} {t.deadlineDaysPast})
                        </span>
                      </span>
                    </div>

                    <div className="font-mono text-xs text-slate-400 truncate max-w-xl">
                      Clave: <span className="text-rose-600 dark:text-rose-400 font-semibold">{inv.clave}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">{lang === 'en' ? 'Invoice Date' : 'Fecha Emisión'}:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(inv.fechaEmision).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-CR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">{lang === 'en' ? 'Total Amount' : 'Monto Total'}:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₡{inv.totalComprobante.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-rose-500 block text-[10px] font-semibold">{t.deadlineTaxRisk}:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          ₡{inv.montoTotalImpuesto.toLocaleString()} IVA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Immediate Action Buttons for this specific item */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-stretch md:self-auto justify-end">
                    <button
                      onClick={() => handleCopySupplierLetter(inv)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
                      title={t.remedySol1CopyLetter}
                    >
                      <Copy className="w-3.5 h-3.5 text-blue-500" />
                      <span>{copyFeedback === inv.id ? (lang === 'en' ? 'Copied!' : '¡Copiado!') : (lang === 'en' ? 'Copy Request Letter' : 'Copiar Carta')}</span>
                    </button>

                    <button
                      onClick={() => handleApplyRemedyAction(inv.id, 'supplier_reissue')}
                      disabled={remedyLoadingId === inv.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                      title={t.remedySol1Desc}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{remedyLoadingId === inv.id ? (lang === 'en' ? 'Re-issuing...' : 'Refacturando...') : (lang === 'en' ? '1. Reset Clock (Supplier NC)' : '1. Reiniciar Plazo (NC)')}</span>
                    </button>

                    <button
                      onClick={() => handleApplyRemedyAction(inv.id, 'cpa_late_justification')}
                      disabled={remedyLoadingId === inv.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                      title={t.remedySol2Desc}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? '2. Late CPA Note' : '2. Aceptar con CPA'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expandable Educational / Regulatory Remedy Guide */}
          {isRemedyPanelOpen && (
            <div className={`mt-5 p-4 rounded-xl border space-y-4 ${
              isBright ? 'bg-white border-rose-200' : 'bg-slate-900/90 border-rose-900/40'
            }`}>
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {t.deadlineRemedyTitle}
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.deadlineRemedySubtitle}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Solution 1 */}
                <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                  isBright ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-700/40'
                }`}>
                  <div>
                    <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>{t.remedySol1Title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {t.remedySol1Desc}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-emerald-200 dark:border-emerald-800/40 text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                    ✓ {lang === 'en' ? '100% Tax Credit protected without audit risk' : '100% Crédito Fiscal protegido sin contingencia'}
                  </div>
                </div>

                {/* Solution 2 */}
                <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                  isBright ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-700/40'
                }`}>
                  <div>
                    <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 font-bold mb-1">
                      <FileSpreadsheet className="w-4 h-4 shrink-0" />
                      <span>{t.remedySol2Title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {t.remedySol2Desc}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-amber-200 dark:border-amber-800/40 text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                    ✓ {lang === 'en' ? 'Supports Income Tax deduction with CPA file' : 'Sustenta deducibilidad en Renta con expediente CPA'}
                  </div>
                </div>

                {/* Solution 3 */}
                <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                  isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700'
                }`}>
                  <div>
                    <div className="flex items-center space-x-1.5 text-rose-500 font-bold mb-1">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>{t.remedySol3Title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {t.remedySol3Desc}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 font-medium">
                    ✓ {lang === 'en' ? 'Removes liability from books' : 'Elimina pasivo fiscal y contable'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 2: INCOMING SUPPLIER INVOICES INBOX (Pending Reception)   */}
      {/* ------------------------------------------------------------------ */}
      <div className={`${isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'} border rounded-xl p-5 shadow-sm transition-colors`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <Inbox className="w-4 h-4 text-indigo-500" />
              <span>{t.incomingInvoicesTitle}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {t.incomingInvoicesSubtitle}
            </p>
          </div>
          <div className="text-xs text-slate-500">
            {supplierInvoices.filter((i) => i.estadoRecepcion === 'pendiente').length} {lang === 'en' ? 'pending' : 'pendientes'}
          </div>
        </div>

        <div className={`overflow-x-auto rounded-lg border ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
          <table className="w-full text-left text-xs">
            <thead className={`${isBright ? 'bg-slate-100 text-slate-600' : 'bg-slate-800/80 text-slate-400'} uppercase text-[10px] tracking-wider border-b`}>
              <tr>
                <th className="py-2.5 px-3">{t.thSupplier}</th>
                <th className="py-2.5 px-3">{t.thClave}</th>
                <th className="py-2.5 px-3">{t.thDate}</th>
                <th className="py-2.5 px-3 text-center">{t.thDeadline8Days}</th>
                <th className="py-2.5 px-3 text-right">{t.thTotal}</th>
                <th className="py-2.5 px-3 text-right">{t.thVat}</th>
                <th className="py-2.5 px-3 text-center">{t.thAction}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isBright ? 'bg-white divide-slate-100 text-slate-800' : 'bg-slate-900/60 divide-slate-800 text-slate-300'}`}>
              {supplierInvoices.map((inv) => (
                <tr key={inv.id} className={isBright ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}>
                  <td className="py-2.5 px-3 font-medium">
                    <div>{inv.emisorNombre}</div>
                    <span className="text-[10px] text-slate-400 font-mono">Céd: {inv.emisorCedula}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 truncate max-w-[150px]">
                    {inv.clave}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                    {new Date(inv.fechaEmision).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-CR')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {inv.estadoRecepcion !== 'pendiente' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-500">
                        {inv.estadoRecepcion === 'aceptado_05' ? (lang === 'en' ? 'Accepted (05)' : 'Aceptada (05)') : inv.estadoRecepcion}
                      </span>
                    ) : inv.isViolated ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30">
                        ⚠️ {inv.diasHabilesTranscurridos}d ({Math.abs(inv.diasRestantesOVencidos)}d {lang === 'en' ? 'overdue' : 'vencido'})
                      </span>
                    ) : inv.isWarning ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        ⏳ {inv.diasHabilesTranscurridos}d ({inv.diasRestantesOVencidos}d {lang === 'en' ? 'rem.' : 'rest.'})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500">
                        ✓ {inv.diasHabilesTranscurridos}d {lang === 'en' ? 'work days' : 'hábiles'}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold">
                    ₡{inv.totalComprobante.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-indigo-400">
                    ₡{inv.montoTotalImpuesto.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {inv.estadoRecepcion === 'pendiente' ? (
                      <button
                        onClick={() => handleSelectInvoice(inv)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors flex items-center space-x-1 mx-auto cursor-pointer ${
                          inv.isViolated
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        <span>{inv.isViolated ? (lang === 'en' ? 'Fix & Accept' : 'Subsanar') : (lang === 'en' ? 'Accept' : 'Aceptar')}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-sans">Completado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 3: B2B RECEPTION SUBMISSION FORM (Mensaje Receptor)       */}
      {/* ------------------------------------------------------------------ */}
      <div id="b2b-form-section" className={`${isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'} border rounded-xl p-5 shadow-sm transition-colors`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b ${isBright ? 'border-slate-100' : 'border-slate-800'} gap-3`}>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold tracking-tight ${isBright ? 'text-slate-900' : 'text-white'}`}>
                {t.b2bTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {t.b2bSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFillSampleClave}
            className={`text-xs px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-colors self-start sm:self-auto cursor-pointer ${
              isBright ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-800 border-indigo-500/30 text-indigo-300 hover:bg-slate-700'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>{t.b2bSampleBtn}</span>
          </button>
        </div>

        {/* Form Error Banner */}
        {formError && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center justify-between">
            <span>{formError}</span>
            <button type="button" onClick={() => setFormError(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        )}

        {/* Beginner Tooltip */}
        {activeHint && (
          <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 text-xs flex items-start space-x-2.5">
            <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>{activeHint}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                {t.b2bClaveInput}
              </label>
              <input
                type="text"
                required
                maxLength={50}
                value={claveDocumento}
                onFocus={() => setActiveHint(t.hintClave50)}
                onChange={(e) => setClaveDocumento(e.target.value.replace(/\D/g, ''))}
                placeholder="506DDMMAAYYYYYYYYYYYY001000010100000000011XXXXXXXX"
                className={`w-full rounded-lg px-3 py-2 text-xs font-mono border focus:outline-none ${
                  isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-emerald-400'
                }`}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {claveDocumento.length} / 50 dígitos
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                {t.b2bDecision}
              </label>
              <select
                value={tipoMensaje}
                onFocus={() => setActiveHint(t.hintB2BMensaje)}
                onChange={(e) => setTipoMensaje(e.target.value as any)}
                className={`w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none ${
                  isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="05">{t.b2bDecision05}</option>
                <option value="06">{t.b2bDecision06}</option>
                <option value="07">{t.b2bDecision07}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.b2bSupplierName}</label>
              <input
                type="text"
                required
                value={emisorNombre}
                onChange={(e) => setEmisorNombre(e.target.value)}
                className={`w-full rounded px-2.5 py-1.5 text-xs border focus:outline-none ${
                  isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.b2bSupplierId}</label>
              <input
                type="text"
                required
                value={emisorCedula}
                onChange={(e) => setEmisorCedula(e.target.value)}
                className={`w-full rounded px-2.5 py-1.5 text-xs font-mono border focus:outline-none ${
                  isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.b2bInvoiceTotal} (₡)</label>
              <input
                type="number"
                step="0.01"
                required
                value={totalFactura}
                onChange={(e) => setTotalFactura(parseFloat(e.target.value) || 0)}
                className={`w-full rounded px-2.5 py-1.5 text-xs font-mono border focus:outline-none ${
                  isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.b2bVatTotal} (₡)</label>
              <input
                type="number"
                step="0.01"
                required
                value={montoTotalImpuesto}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setMontoTotalImpuesto(val);
                  setMontoCredito(val);
                }}
                className={`w-full rounded px-2.5 py-1.5 text-xs font-mono border focus:outline-none ${
                  isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-indigo-400'
                }`}
              />
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 rounded-lg border ${
            isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.b2bTaxCondition}</label>
              <select
                value={condicionImpuesto}
                onFocus={() => setActiveHint(t.hintTaxCredit)}
                onChange={(e) => setCondicionImpuesto(e.target.value as any)}
                className={`w-full rounded px-2.5 py-1.5 text-xs border focus:outline-none ${
                  isBright ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="01">01 - {lang === 'en' ? 'Full VAT Credit (100%)' : 'Crédito Fiscal Pleno (100%)'}</option>
                <option value="02">02 - {lang === 'en' ? 'Partial VAT Credit' : 'Crédito Fiscal Parcial'}</option>
                <option value="03">03 - {lang === 'en' ? 'Capital Assets' : 'Bienes de Capital'}</option>
                <option value="04">04 - {lang === 'en' ? 'Non-Deductible Expense' : 'Gasto Corriente No Deducible'}</option>
                <option value="05">05 - {lang === 'en' ? 'Proportionality' : 'Proporcionalidad'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.b2bCreditAmount} (₡)</label>
              <input
                type="number"
                step="0.01"
                disabled={condicionImpuesto === '04'}
                value={condicionImpuesto === '04' ? 0 : montoCredito}
                onChange={(e) => setMontoCredito(parseFloat(e.target.value) || 0)}
                className={`w-full rounded px-2.5 py-1.5 text-xs font-mono border focus:outline-none disabled:opacity-40 ${
                  isBright ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-emerald-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.b2bDetailNote}</label>
              <input
                type="text"
                value={detalleMensaje}
                onChange={(e) => setDetalleMensaje(e.target.value)}
                className={`w-full rounded px-2.5 py-1.5 text-xs border focus:outline-none ${
                  isBright ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs rounded-lg shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? (lang === 'en' ? 'Signing & Submitting...' : 'Transmitiendo...') : t.b2bSubmitBtn}</span>
            </button>
          </div>
        </form>

        {/* Historical Receptions */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {t.b2bHistoryTitle} ({receptions.length})
          </h4>
          <div className={`overflow-x-auto rounded-lg border ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
            <table className="w-full text-left text-xs">
              <thead className={`${isBright ? 'bg-slate-100 text-slate-600' : 'bg-slate-800/80 text-slate-400'} uppercase text-[10px] tracking-wider border-b`}>
                <tr>
                  <th className="py-2.5 px-3">Consecutivo Receptor</th>
                  <th className="py-2.5 px-3">Clave Factura Proveedor</th>
                  <th className="py-2.5 px-3">Proveedor</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">IVA Acreditado</th>
                  <th className="py-2.5 px-3 text-center">Decisión</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${isBright ? 'bg-white divide-slate-100 text-slate-800' : 'bg-slate-900/60 divide-slate-800 text-slate-300'}`}>
                {receptions.map((rec) => (
                  <tr key={rec.id} className={isBright ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}>
                    <td className="py-2.5 px-3 font-semibold">{rec.numeroConsecutivoReceptor}</td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[170px]">{rec.claveDocumento}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <div>{rec.emisorNombre}</div>
                      <span className="text-[10px] text-slate-400">Céd: {rec.emisorCedula}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">₡{rec.totalFactura.toLocaleString('es-CR')}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-500 font-bold">₡{rec.montoTotalImpuestoAcreditar.toLocaleString('es-CR')}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        rec.tipoMensaje === '05'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : rec.tipoMensaje === '06'
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-rose-500/15 text-rose-500'
                      }`}>
                        {rec.tipoMensaje === '05' ? '05 Aceptado' : rec.tipoMensaje === '06' ? '06 Parcial' : '07 Rechazado'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-500 font-sans">
                      <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                      Validado
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
