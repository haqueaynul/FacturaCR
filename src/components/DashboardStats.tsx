/**
 * @file src/components/DashboardStats.tsx
 * @description KPI metric cards presenting invoice counts, transmission success rate,
 * IVA collected vs credit, tax liability balance, and API response latency.
 * Supports multi-language (EN / ES) and dark/bright theme with high-contrast text and backgrounds.
 */

import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Scale,
  Zap,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { TaxReportSummary } from '../types';

interface DashboardStatsProps {
  lang: Language;
  theme: 'dark' | 'bright';
  summary: TaxReportSummary | null;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  lang,
  theme,
  summary,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';

  const formatCurrency = (amount: number) => {
    return '₡' + (amount || 0).toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const cardBg = isBright
    ? 'bg-white border-slate-200 text-slate-800 shadow-xs'
    : 'bg-slate-900/90 border-slate-800 text-slate-200';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Emitidos */}
      <div className={`${cardBg} border p-4 rounded-xl transition-all`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.statIssued}
          </span>
          <div className={`p-2 rounded-lg ${isBright ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/10 text-blue-400'}`}>
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className={`text-2xl font-bold font-mono ${isBright ? 'text-slate-900' : 'text-white'}`}>
            {summary?.totalEmitidos ?? 0}
          </span>
          <span className={`text-xs ${isBright ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>docs</span>
        </div>
        <div className="mt-1 flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" />
          <span>{summary?.tasaExito ?? '100'}% {t.statSuccessRate}</span>
        </div>
      </div>

      {/* Aceptados */}
      <div className={`${cardBg} border p-4 rounded-xl transition-all`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.statApproved}
          </span>
          <div className={`p-2 rounded-lg ${isBright ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400'}`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {summary?.aceptados ?? 0}
          </span>
          <span className={`text-xs ${isBright ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>autorizados</span>
        </div>
        <div className={`mt-1 text-[11px] flex items-center font-medium ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
          <Zap className="w-3.5 h-3.5 mr-1 text-amber-500 shrink-0" />
          <span>{summary?.avgResponseTimeMs ?? 380}ms {t.statAvgLatency}</span>
        </div>
      </div>

      {/* En Cola / Pendientes */}
      <div className={`${cardBg} border p-4 rounded-xl transition-all`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.statPending}
          </span>
          <div className={`p-2 rounded-lg ${isBright ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/10 text-amber-400'}`}>
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-3">
          <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {summary?.enProceso ?? 0}
          </span>
          <span className={`text-xs ${isBright ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>en cola</span>
          {Boolean(summary?.rechazados) && (
            <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-500/20">
              {summary?.rechazados} {t.statRejected}
            </span>
          )}
        </div>
        <div className={`mt-1 text-[11px] font-medium ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
          Ministerio de Hacienda v4.3 / v4.4
        </div>
      </div>

      {/* Balance Fiscal IVA (Redesigned with high contrast and readable text) */}
      <div
        className={`border p-4 rounded-xl transition-all shadow-sm ${
          isBright
            ? 'bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 border-indigo-200 text-slate-900'
            : 'bg-slate-900/90 border-slate-800 text-slate-100 bg-gradient-to-br from-indigo-950/40 to-slate-900/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-extrabold uppercase tracking-wider ${
              isBright ? 'text-indigo-950' : 'text-indigo-300'
            }`}
          >
            {t.statTaxBalance}
          </span>
          <div
            className={`p-2 rounded-lg ${
              isBright ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/20 text-indigo-400'
            }`}
          >
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1">
          <span
            className={`text-2xl font-extrabold font-mono tracking-tight ${
              isBright ? 'text-indigo-950' : 'text-indigo-300'
            }`}
          >
            {formatCurrency(summary?.balanceIvaPagar ?? 0)}
          </span>
        </div>
        <div
          className={`mt-1.5 flex items-center justify-between text-[11px] font-semibold pt-1 border-t ${
            isBright ? 'border-indigo-100 text-slate-700' : 'border-slate-800 text-slate-300'
          }`}
        >
          <span className={isBright ? 'text-indigo-900' : 'text-slate-300'}>
            {t.statDebit}: {formatCurrency(summary?.ivaDebitoFiscal ?? 0)}
          </span>
          <span className={isBright ? 'text-emerald-700 font-bold' : 'text-emerald-400'}>
            {t.statCredit}: {formatCurrency(summary?.ivaCreditoFiscal ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
};
