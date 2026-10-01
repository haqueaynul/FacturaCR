/**
 * @file src/components/DashboardStats.tsx
 * @description KPI metric cards presenting invoice counts, transmission success rate,
 * IVA collected vs credit, tax liability balance, and API response latency.
 * Supports multi-language (EN / ES) and dark/bright theme.
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total Emitidos */}
      <div className={`${cardBg} border p-4 rounded-xl transition-all`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t.statIssued}</span>
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className={`text-2xl font-bold font-mono ${isBright ? 'text-slate-900' : 'text-white'}`}>
            {summary?.totalEmitidos ?? 0}
          </span>
          <span className="text-xs text-slate-400">docs</span>
        </div>
        <div className="mt-1 flex items-center text-[11px] text-emerald-500">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          <span>{summary?.tasaExito ?? '100'}% {t.statSuccessRate}</span>
        </div>
      </div>

      {/* Aceptados */}
      <div className={`${cardBg} border p-4 rounded-xl transition-all`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t.statApproved}</span>
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-emerald-500">{summary?.aceptados ?? 0}</span>
          <span className="text-xs text-slate-400">autorizados</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400 flex items-center">
          <Zap className="w-3 h-3 mr-1 text-amber-500" />
          <span>{summary?.avgResponseTimeMs ?? 380}ms {t.statAvgLatency}</span>
        </div>
      </div>

      {/* En Cola / Pendientes */}
      <div className={`${cardBg} border p-4 rounded-xl transition-all`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t.statPending}</span>
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-3">
          <span className="text-2xl font-bold font-mono text-amber-500">{summary?.enProceso ?? 0}</span>
          <span className="text-xs text-slate-400">en cola</span>
          {Boolean(summary?.rechazados) && (
            <span className="text-xs font-mono font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
              {summary?.rechazados} {t.statRejected}
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          Ministerio de Hacienda v4.3
        </div>
      </div>

      {/* Balance Fiscal IVA */}
      <div className={`${cardBg} border p-4 rounded-xl transition-all bg-gradient-to-br from-indigo-950/20 to-slate-900/40`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">{t.statTaxBalance}</span>
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1">
          <span className="text-2xl font-bold font-mono text-indigo-400">
            {formatCurrency(summary?.balanceIvaPagar ?? 0)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
          <span>{t.statDebit}: {formatCurrency(summary?.ivaDebitoFiscal ?? 0)}</span>
          <span>{t.statCredit}: {formatCurrency(summary?.ivaCreditoFiscal ?? 0)}</span>
        </div>
      </div>
    </div>
  );
};
