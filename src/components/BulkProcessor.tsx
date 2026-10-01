/**
 * @file src/components/BulkProcessor.tsx
 * @description Bulk invoice generation and high-throughput batch submission engine.
 * Emits multiple invoices concurrently, signs each with XAdES-EPES, and streams to Hacienda Sandbox.
 */

import React, { useState } from 'react';
import {
  Layers,
  Play,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { TaxpayerConfig } from '../types';

interface BulkProcessorProps {
  taxpayer: TaxpayerConfig | null;
  onRunBulk: (batchCount: number, taxRegime: string, baseAmount: number) => Promise<{ success: boolean; batchSize: number }>;
  isProcessing: boolean;
}

/**
 * Bulk processing component for high-volume billing scenarios.
 */
export const BulkProcessor: React.FC<BulkProcessorProps> = ({
  taxpayer,
  onRunBulk,
  isProcessing,
}) => {
  const [batchCount, setBatchCount] = useState<number>(5);
  const [taxRegime, setTaxRegime] = useState<string>('tradicional');
  const [baseAmount, setBaseAmount] = useState<number>(75000);
  const [lastBatchResult, setLastBatchResult] = useState<{ count: number; timestamp: string } | null>(null);

  /**
   * Executes bulk processing operation.
   */
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-8 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Procesamiento Masivo de Comprobantes (Bulk Processing)</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Alta Concurrencia
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Genera lotes masivos de comprobantes electrónicos, firma digitalmente en paralelo y transmite a la cola de Hacienda.
            </p>
          </div>
        </div>

        {lastBatchResult && (
          <div className="text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Último lote: {lastBatchResult.count} docs a las {lastBatchResult.timestamp}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {/* Cantidad de Facturas */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Tamaño del Lote
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
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Régimen Tributario */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Régimen Tributario
          </label>
          <select
            value={taxRegime}
            onChange={(e) => setTaxRegime(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="tradicional">Régimen Tradicional (General 13%)</option>
            <option value="simplificado">Régimen Simplificado</option>
            <option value="zona_franca">Zona Franca (Exento)</option>
            <option value="agropecuario">Régimen Agropecuario</option>
          </select>
        </div>

        {/* Monto Base */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Monto Promedio Factura (₡)
          </label>
          <input
            type="number"
            step="5000"
            value={baseAmount}
            onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* Execution Banner */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-xs">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Pipeline de Procesamiento en Lote:</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              1. Asignación de 50-digit Claves secuenciales · 2. Firma XAdES-EPES PKCS#12 · 3. Envío HTTP 202 a Sandbox
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
            {isProcessing ? 'Procesando Lote Concurrente...' : `Generar y Transmitir Lote de ${batchCount} Facturas`}
          </span>
        </button>
      </div>
    </div>
  );
};
