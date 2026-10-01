/**
 * @file src/components/AuditLogViewer.tsx
 * @description Real-time compliance audit trail inspector.
 * Logs all 10 regulatory steps: Document Generation, Cryptographic Signing, API Auth,
 * Sandbox Submission, Asynchronous Polling, B2B Reception, Automated Retries, and Encrypted Vault operations.
 */

import React, { useState } from 'react';
import {
  Shield,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  Key,
  Hash,
} from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditLogViewerProps {
  logs: AuditLogEntry[];
}

/**
 * Audit log trail viewer for regulatory compliance and API diagnostics.
 */
export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
  const [filterStep, setFilterStep] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    const matchesStep = filterStep === 'todos' || log.step === filterStep;
    const matchesStatus = filterStatus === 'todos' || log.status === filterStatus;
    const matchesKeyword =
      !searchKeyword ||
      log.message.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (log.clave && log.clave.includes(searchKeyword)) ||
      (log.payloadSummary && log.payloadSummary.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchesStep && matchesStatus && matchesKeyword;
  });

  /**
   * Exports audit log records to JSON.
   */
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `auditoria-hacienda-cr-${Date.now()}.json`);
    dl.click();
  };

  /**
   * Exports audit log records to CSV.
   */
  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Paso', 'Estado', 'HTTP Status', 'DuracionMs', 'Clave', 'Mensaje'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      l.step,
      l.status,
      l.httpStatus || '',
      l.durationMs || '',
      l.clave || '',
      `"${l.message.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const dl = document.createElement('a');
    dl.setAttribute('href', encodeURI(csvContent));
    dl.setAttribute('download', `auditoria-hacienda-cr-${Date.now()}.csv`);
    dl.click();
  };

  const getStepBadge = (step: string) => {
    switch (step) {
      case 'GENERATION':
        return <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">1. Generación</span>;
      case 'SIGNING':
        return <span className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">2. Firma XAdES</span>;
      case 'AUTH':
        return <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">3. Auth IDP</span>;
      case 'SUBMISSION':
        return <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">4. Envío API</span>;
      case 'POLLING':
        return <span className="text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">5. Validación</span>;
      case 'RECEPTION':
        return <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">6. B2B Receptor</span>;
      case 'RETRY':
        return <span className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">7. Reintento</span>;
      case 'SECURITY':
        return <span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">8. Bóveda Cifrada</span>;
      default:
        return <span className="text-slate-400">{step}</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-8 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Pistas de Auditoría y Bitácora de Transmisiones (Audit Trail)</span>
              <span className="text-xs font-mono font-medium text-slate-400">
                ({filteredLogs.length} eventos)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Registro inmutable de firmas criptográficas, peticiones HTTP, tiempos de respuesta y respuestas de Hacienda.
            </p>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Exportar JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
        {/* Step Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400">Paso:</span>
          <select
            value={filterStep}
            onChange={(e) => setFilterStep(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none"
          >
            <option value="todos">Todos los Pasos</option>
            <option value="GENERATION">1. Generación Local</option>
            <option value="SIGNING">2. Firma XAdES-EPES</option>
            <option value="AUTH">3. Autenticación IDP</option>
            <option value="SUBMISSION">4. Envío API Hacienda</option>
            <option value="POLLING">5. Validación Asíncrona</option>
            <option value="RECEPTION">6. B2B Mensaje Receptor</option>
            <option value="RETRY">7. Reintentos Automatizados</option>
            <option value="SECURITY">8. Bóveda Cifrada</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400">Estado:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none"
          >
            <option value="todos">Todos los Estados</option>
            <option value="SUCCESS">Éxito (SUCCESS)</option>
            <option value="WARNING">Advertencia / Retry (WARNING)</option>
            <option value="ERROR">Error / Rechazado (ERROR)</option>
            <option value="INFO">Informativo (INFO)</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Buscar por mensaje, clave, error..."
            className="w-full bg-slate-800 border border-slate-700 rounded pl-7 pr-3 py-1 text-xs text-white focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-96">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700 sticky top-0 z-10 backdrop-blur-xs">
            <tr>
              <th className="py-2 px-3 w-28">Hora</th>
              <th className="py-2 px-3 w-32">Paso del Proceso</th>
              <th className="py-2 px-3 w-20">Estado</th>
              <th className="py-2 px-3 w-16">HTTP</th>
              <th className="py-2 px-3 w-20">Latencia</th>
              <th className="py-2 px-3 min-w-[240px]">Detalle y Mensaje de Auditoría</th>
              <th className="py-2 px-3 w-40">Clave Asociada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/60 font-mono text-[11px]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans text-xs">
                  No hay registros de auditoría que coincidan con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  {/* Timestamp */}
                  <td className="py-2 px-3 text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString('es-CR')}
                  </td>

                  {/* Step */}
                  <td className="py-2 px-3 font-sans text-[11px]">
                    {getStepBadge(log.step)}
                  </td>

                  {/* Status */}
                  <td className="py-2 px-3">
                    {log.status === 'SUCCESS' && <span className="text-emerald-400 font-bold">ÉXITO</span>}
                    {log.status === 'WARNING' && <span className="text-amber-400 font-bold">ALERTA</span>}
                    {log.status === 'ERROR' && <span className="text-rose-400 font-bold">ERROR</span>}
                    {log.status === 'INFO' && <span className="text-blue-400 font-bold">INFO</span>}
                  </td>

                  {/* HTTP Status */}
                  <td className="py-2 px-3">
                    {log.httpStatus ? (
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          log.httpStatus >= 200 && log.httpStatus < 300
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {log.httpStatus}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="py-2 px-3 text-slate-400">
                    {log.durationMs ? `${log.durationMs}ms` : '-'}
                  </td>

                  {/* Message */}
                  <td className="py-2 px-3 font-sans text-slate-200">
                    <div>{log.message}</div>
                    {log.payloadSummary && (
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                        {log.payloadSummary}
                      </span>
                    )}
                  </td>

                  {/* Clave */}
                  <td className="py-2 px-3 text-slate-400 truncate max-w-[160px]" title={log.clave}>
                    {log.clave ? `${log.clave.slice(0, 10)}...${log.clave.slice(-8)}` : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
