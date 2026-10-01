/**
 * @file src/components/DashboardStats.tsx
 * @description KPI metric cards presenting invoice counts, transmission success rate,
 * IVA collected vs credit, tax liability balance, and API response latency.
 */

import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Receipt,
  Scale,
  Zap,
} from 'lucide-react';
import { TaxReportSummary } from '../types';

interface DashboardStatsProps {
  summary: TaxReportSummary | null;
}

/**
 * Renders executive KPI metrics for Costa Rica tax compliance.
 */
export const DashboardStats: React.FC<DashboardStatsProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => {
    return '₡' + (amount || 0).toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total Emitidos */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Emitidos</span>
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">{summary?.totalEmitidos ?? 0}</span>
          <span className="text-xs text-slate-400">docs</span>
        </div>
        <div className="mt-1 flex items-center text-[11px] text-emerald-400">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          <span>{summary?.tasaExito ?? '100'}% Tasa Aprobación</span>
        </div>
      </div>

      {/* Aceptados */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Aprobados Hacienda</span>
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">{summary?.aceptados ?? 0}</span>
          <span className="text-xs text-slate-400">autorizados</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400 flex items-center">
          <Zap className="w-3 h-3 mr-1 text-amber-400" />
          <span>{summary?.avgResponseTimeMs ?? 380}ms latencia prom.</span>
        </div>
      </div>

      {/* En Cola / Pendientes */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">En Cola / Errores</span>
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-3">
          <span className="text-2xl font-bold font-mono text-amber-300">{summary?.enProceso ?? 0}</span>
          <span className="text-xs text-slate-400">en cola</span>
          {Boolean(summary?.rechazados) && (
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
              {summary?.rechazados} rechazados
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          Validación asíncrona v4.3
        </div>
      </div>

      {/* Balance Fiscal IVA */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-all bg-gradient-to-br from-slate-900 to-indigo-950/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">IVA Fiscal por Declarar</span>
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1">
          <span className="text-2xl font-bold font-mono text-indigo-300">
            {formatCurrency(summary?.balanceIvaPagar ?? 0)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
          <span>Déb: {formatCurrency(summary?.ivaDebitoFiscal ?? 0)}</span>
          <span>Créd: {formatCurrency(summary?.ivaCreditoFiscal ?? 0)}</span>
        </div>
      </div>
    </div>
  );
};
