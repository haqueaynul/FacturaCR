/**
 * @file src/components/AuditLogViewer.tsx
 * @description Real-time compliance audit trail inspector.
 * Logs all regulatory steps with multi-language (EN / ES) and dark/bright theme support.
 */

import React, { useState } from 'react';
import {
  Shield,
  Search,
  Download,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { AuditLogEntry } from '../types';

interface AuditLogViewerProps {
  lang: Language;
  theme: 'dark' | 'bright';
  logs: AuditLogEntry[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  lang,
  theme,
  logs,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';

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
      (log.performedBy && log.performedBy.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchesStep && matchesStatus && matchesKeyword;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `auditoria-hacienda-cr-${Date.now()}.json`);
    dl.click();
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Step', 'Status', 'HTTP Status', 'DurationMs', 'PerformedBy', 'Clave', 'Message'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      l.step,
      l.status,
      l.httpStatus || '',
      l.durationMs || '',
      `"${l.performedBy || ''}"`,
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
        return <span className="text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">1. Generación</span>;
      case 'SIGNING':
        return <span className="text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">2. Firma XAdES</span>;
      case 'AUTH':
        return <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">3. Auth IDP</span>;
      case 'SUBMISSION':
        return <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">4. Envío API</span>;
      case 'POLLING':
        return <span className="text-teal-500 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">5. Validación</span>;
      case 'RECEPTION':
        return <span className="text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">6. B2B Receptor</span>;
      case 'RETRY':
        return <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">7. Reintento</span>;
      case 'SECURITY':
        return <span className="text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">8. Bóveda</span>;
      default:
        return <span className="text-slate-400">{step}</span>;
    }
  };

  return (
    <div className={`${isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'} border rounded-xl p-5 shadow-sm mb-8 transition-colors`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b ${isBright ? 'border-slate-100' : 'border-slate-800'} gap-3`}>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold tracking-tight flex items-center space-x-2 ${isBright ? 'text-slate-900' : 'text-white'}`}>
              <span>{t.auditTitle}</span>
              <span className="text-xs font-mono font-medium text-slate-400">
                ({filteredLogs.length})
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {t.auditSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className={`px-2.5 py-1.5 text-xs font-medium border rounded-lg flex items-center space-x-1.5 transition-colors ${
              isBright ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.auditExportCsv}</span>
          </button>
          <button
            onClick={handleExportJson}
            className={`px-2.5 py-1.5 text-xs font-medium border rounded-lg flex items-center space-x-1.5 transition-colors ${
              isBright ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>{t.auditExportJson}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400">{t.auditFilterStep}:</span>
          <select
            value={filterStep}
            onChange={(e) => setFilterStep(e.target.value)}
            className={`rounded px-2 py-1 border focus:outline-none ${
              isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="todos">Todos los Pasos</option>
            <option value="GENERATION">1. Generación</option>
            <option value="SIGNING">2. Firma XAdES</option>
            <option value="AUTH">3. Autenticación</option>
            <option value="SUBMISSION">4. Envío API</option>
            <option value="POLLING">5. Validación</option>
            <option value="RECEPTION">6. Recepción B2B</option>
            <option value="RETRY">7. Reintentos</option>
            <option value="SECURITY">8. Bóveda Cifrada</option>
          </select>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400">{t.auditFilterStatus}:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`rounded px-2 py-1 border focus:outline-none ${
              isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="todos">Todos los Estados</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
            <option value="INFO">INFO</option>
          </select>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Buscar por mensaje, clave, usuario..."
            className={`w-full rounded pl-7 pr-3 py-1 text-xs border focus:outline-none ${
              isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
        </div>
      </div>

      {/* Logs Table */}
      <div className={`overflow-x-auto rounded-lg border max-h-96 ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
        <table className="w-full text-left text-xs">
          <thead className={`uppercase text-[10px] tracking-wider border-b sticky top-0 z-10 backdrop-blur-xs ${
            isBright ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800/80 text-slate-400 border-slate-700'
          }`}>
            <tr>
              <th className="py-2 px-3 w-24">{t.auditColTime}</th>
              <th className="py-2 px-3 w-32">{t.auditColStep}</th>
              <th className="py-2 px-3 w-20">{t.auditColStatus}</th>
              <th className="py-2 px-3 w-16">{t.auditColHttp}</th>
              <th className="py-2 px-3 w-20">{t.auditColLatency}</th>
              <th className="py-2 px-3 min-w-[220px]">{t.auditColDetail}</th>
              <th className="py-2 px-3 w-32">{t.auditColClave}</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-mono text-[11px] ${
            isBright ? 'bg-white divide-slate-100 text-slate-800' : 'bg-slate-950/60 divide-slate-800 text-slate-300'
          }`}>
            {filteredLogs.map((log) => (
              <tr key={log.id} className={isBright ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}>
                <td className="py-2 px-3 text-slate-400">{new Date(log.timestamp).toLocaleTimeString('es-CR')}</td>
                <td className="py-2 px-3 font-sans">{getStepBadge(log.step)}</td>
                <td className="py-2 px-3">
                  {log.status === 'SUCCESS' && <span className="text-emerald-500 font-bold">OK</span>}
                  {log.status === 'WARNING' && <span className="text-amber-500 font-bold">WARN</span>}
                  {log.status === 'ERROR' && <span className="text-rose-500 font-bold">ERR</span>}
                  {log.status === 'INFO' && <span className="text-blue-500 font-bold">INFO</span>}
                </td>
                <td className="py-2 px-3">
                  {log.httpStatus ? <span className="font-bold">{log.httpStatus}</span> : '-'}
                </td>
                <td className="py-2 px-3 text-slate-400">{log.durationMs ? `${log.durationMs}ms` : '-'}</td>
                <td className="py-2 px-3 font-sans">
                  <div>{log.message}</div>
                  {log.performedBy && <span className="text-[10px] text-slate-400 block font-mono">Por: {log.performedBy}</span>}
                </td>
                <td className="py-2 px-3 text-slate-400 truncate max-w-[130px]" title={log.clave}>
                  {log.clave ? `${log.clave.slice(0, 8)}...` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
