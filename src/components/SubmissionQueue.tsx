/**
 * @file src/components/SubmissionQueue.tsx
 * @description Real-time submission queue component displaying electronic documents,
 * validation states from Hacienda Sandbox, automated retry indicators, and XML inspection triggers.
 * Fully supports multi-language (EN / ES) and dark/bright theme.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCw,
  FileCode,
  Search,
  Hash,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { ElectronicDocument, DocumentStatus } from '../types';

interface SubmissionQueueProps {
  lang: Language;
  theme: 'dark' | 'bright';
  documents: ElectronicDocument[];
  onSelectDocument: (doc: ElectronicDocument) => void;
  onRetryDocument: (docId: string) => Promise<void>;
  onCheckStatus: (docId: string) => Promise<void>;
  isProcessing: boolean;
}

export const SubmissionQueue: React.FC<SubmissionQueueProps> = ({
  lang,
  theme,
  documents,
  onSelectDocument,
  onRetryDocument,
  onCheckStatus,
  isProcessing,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';

  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchClave, setSearchClave] = useState<string>('');

  const filteredDocs = documents.filter((doc) => {
    const matchesStatus = filterStatus === 'todos' || doc.estado === filterStatus;
    const matchesSearch =
      !searchClave ||
      doc.clave.includes(searchClave) ||
      doc.consecutivo.includes(searchClave) ||
      doc.receptor.nombre.toLowerCase().includes(searchClave.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: DocumentStatus, doc: ElectronicDocument) => {
    switch (status) {
      case 'aceptado':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {lang === 'en' ? 'Accepted' : 'Aceptado'}
          </span>
        );
      case 'procesando':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse">
            <Clock className="w-3 h-3 mr-1" />
            {lang === 'en' ? 'Validating' : 'En Validación'}
          </span>
        );
      case 'rechazado':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/15 text-rose-500 border border-rose-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            {lang === 'en' ? 'Rejected' : 'Rechazado'}
          </span>
        );
      case 'error_envio':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {lang === 'en' ? 'Retry' : 'Reintento'} ({doc.intentosEnvio}/{doc.maxIntentos})
          </span>
        );
      case 'firmado':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
            {lang === 'en' ? 'Signed XAdES' : 'Firmado XAdES'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getDocTypeLabel = (tipo: string) => {
    switch (tipo) {
      case '01':
        return 'FE (Factura)';
      case '04':
        return 'TE (Tiquete)';
      case '03':
        return 'NC (Nota Crédito)';
      case '02':
        return 'ND (Nota Débito)';
      case '08':
        return 'FEC (Compra)';
      case '09':
        return 'FEE (Exportación)';
      default:
        return tipo;
    }
  };

  return (
    <div className={`${isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'} border rounded-xl p-5 shadow-sm mb-8 transition-colors`}>
      {/* Header and Filter Controls */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b ${isBright ? 'border-slate-100' : 'border-slate-800'} gap-3`}>
        <div>
          <h3 className={`text-base font-bold tracking-tight flex items-center space-x-2 ${isBright ? 'text-slate-900' : 'text-white'}`}>
            <span>{t.queueTitle}</span>
            <span className="text-xs font-mono font-medium text-slate-400">
              ({filteredDocs.length} / {documents.length})
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            {t.queueSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`rounded-lg px-2.5 py-1.5 text-xs border focus:outline-none ${
              isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="todos">{t.filterAllStatus}</option>
            <option value="aceptado">{t.filterAccepted}</option>
            <option value="procesando">{t.filterProcessing}</option>
            <option value="rechazado">{t.filterRejected}</option>
            <option value="error_envio">{t.filterError}</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchClave}
              onChange={(e) => setSearchClave(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none w-44 sm:w-56 ${
                isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className={`overflow-x-auto rounded-lg border ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
        <table className="w-full text-left text-xs">
          <thead className={`${isBright ? 'bg-slate-100 text-slate-600' : 'bg-slate-800/80 text-slate-400'} uppercase text-[10px] tracking-wider border-b`}>
            <tr>
              <th className="py-2.5 px-3">{t.colTypeSeq}</th>
              <th className="py-2.5 px-3">{t.colClave}</th>
              <th className="py-2.5 px-3">{t.colCustomer}</th>
              <th className="py-2.5 px-3">{t.colDate}</th>
              <th className="py-2.5 px-3 text-right">{t.colTotal}</th>
              <th className="py-2.5 px-3 text-center">{t.colHaciendaStatus}</th>
              <th className="py-2.5 px-3 text-right">{t.colActions}</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-mono ${isBright ? 'bg-white divide-slate-100 text-slate-800' : 'bg-slate-900/60 divide-slate-800 text-slate-300'}`}>
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans text-xs">
                  {lang === 'en' ? 'No electronic documents found in this filter.' : 'No se encontraron comprobantes electrónicos en este filtro.'}
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id} className={isBright ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold">{getDocTypeLabel(doc.tipoDocumento)}</div>
                    <div className="text-[10px] text-slate-400">{doc.consecutivo}</div>
                  </td>

                  <td className="py-2.5 px-3">
                    <div
                      onClick={() => onSelectDocument(doc)}
                      className="text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center space-x-1"
                    >
                      <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[190px]">{doc.clave}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-medium truncate max-w-[180px]">{doc.receptor.nombre}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Céd: {doc.receptor.numeroIdentificacion}</div>
                  </td>

                  <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                    {new Date(doc.fechaEmision).toLocaleDateString('es-CR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  <td className="py-2.5 px-3 text-right font-bold">
                    <div>{doc.moneda} {doc.resumen.totalComprobante.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
                    <span className="text-[10px] text-indigo-400 font-normal">
                      IVA: {doc.moneda} {doc.resumen.totalImpuesto.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <div>{getStatusBadge(doc.estado, doc)}</div>
                    {doc.proximoReintento && (
                      <span className="text-[10px] text-amber-500 block mt-0.5">
                        {new Date(doc.proximoReintento).toLocaleTimeString('es-CR')}
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right font-sans">
                    <div className="flex items-center justify-end space-x-1.5">
                      {doc.estado === 'procesando' && (
                        <button
                          type="button"
                          onClick={() => onCheckStatus(doc.id)}
                          className="p-1.5 text-amber-500 rounded border border-amber-500/30 hover:bg-amber-500/10"
                        >
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        </button>
                      )}

                      {doc.estado === 'error_envio' && (
                        <button
                          type="button"
                          onClick={() => onRetryDocument(doc.id)}
                          className="px-2 py-1 bg-amber-500/20 text-amber-500 rounded text-[11px] font-semibold flex items-center space-x-1"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>{t.actionRetry}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectDocument(doc)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center space-x-1 border ${
                          isBright ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5 text-blue-500" />
                        <span>{t.actionDetails}</span>
                      </button>
                    </div>
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
