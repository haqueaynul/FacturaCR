/**
 * @file src/components/BulkProcessor.tsx
 * @description Bulk invoice generation and high-throughput batch submission engine.
 * Fully supports multi-language (EN / ES) and dark/bright theme.
 */

import React, { useState } from 'react';
import {
  Layers,
  Play,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { Company } from '../types';

interface BulkProcessorProps {
  lang: Language;
  theme: 'dark' | 'bright';
  company: Company | null;
  onRunBulk: (batchCount: number, taxRegime: string, baseAmount: number) => Promise<{ success: boolean; batchSize: number }>;
  isProcessing: boolean;
}

export const BulkProcessor: React.FC<BulkProcessorProps> = ({
  lang,
  theme,
  company,
  onRunBulk,
  isProcessing,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';

  const [batchCount, setBatchCount] = useState<number>(5);
  const [taxRegime, setTaxRegime] = useState<string>('tradicional');
  const [baseAmount, setBaseAmount] = useState<number>(75000);
  const [lastBatchResult, setLastBatchResult] = useState<{ count: number; timestamp: string } | null>(null);

  const handleExecute = async () => {
    const res = await onRunBulk(batchCount, taxRegime, baseAmount);
    if (res.success) {
      setLastBatchResult({
        count: res.batchSize,
        timestamp: new Date().toLocaleTimeString('es-CR'),
      });
    }
  };

  return (
    <div className={`${isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'} border rounded-xl p-5 shadow-sm mb-8 transition-colors`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b ${isBright ? 'border-slate-100' : 'border-slate-800'} gap-3`}>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold tracking-tight ${isBright ? 'text-slate-900' : 'text-white'}`}>
              {t.bulkTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {t.bulkSubtitle} ({company?.nombre})
            </p>
          </div>
        </div>

        {lastBatchResult && (
          <div className="text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{lastBatchResult.count} docs · {lastBatchResult.timestamp}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            {t.bulkBatchSize}
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[5, 10, 20, 50].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setBatchCount(num)}
                className={`py-1.5 text-xs font-mono font-semibold rounded border transition-colors ${
                  batchCount === num
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : (isBright ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700')
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            {t.bulkRegime}
          </label>
          <select
            value={taxRegime}
            onChange={(e) => setTaxRegime(e.target.value)}
            className={`w-full rounded-lg px-3 py-2 text-xs border focus:outline-none ${
              isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="tradicional">Régimen Tradicional (General 13%)</option>
            <option value="simplificado">Régimen Simplificado</option>
            <option value="zona_franca">Zona Franca (Exento)</option>
            <option value="agropecuario">Régimen Agropecuario</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            {t.bulkAvgAmount} (₡)
          </label>
          <input
            type="number"
            step="5000"
            value={baseAmount}
            onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
            className={`w-full rounded-lg px-3 py-2 text-xs font-mono border focus:outline-none ${
              isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-emerald-400'
            }`}
          />
        </div>
      </div>

      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <div className="flex items-center space-x-3 text-xs">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold">{lang === 'en' ? 'Concurrent Pipeline:' : 'Canal Concurrente:'}</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {t.bulkPipelineDesc}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExecute}
          disabled={isProcessing}
          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          <span>
            {isProcessing ? t.bulkProcessingText : `${t.bulkExecuteBtn} (${batchCount})`}
          </span>
        </button>
      </div>
    </div>
  );
};
