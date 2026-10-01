/**
 * @file src/components/SubmissionQueue.tsx
 * @description Real-time submission queue component displaying electronic documents,
 * validation states from Hacienda Sandbox, automated retry indicators, and XML inspection triggers.
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
  ExternalLink,
  ShieldAlert,
  Hash,
} from 'lucide-react';
import { ElectronicDocument, DocumentStatus } from '../types';

interface SubmissionQueueProps {
  documents: ElectronicDocument[];
  onSelectDocument: (doc: ElectronicDocument) => void;
  onRetryDocument: (docId: string) => Promise<void>;
  onCheckStatus: (docId: string) => Promise<void>;
  isProcessing: boolean;
}

/**
 * Queue listing submitted documents and their real-time Hacienda validation states.
 */
export const SubmissionQueue: React.FC<SubmissionQueueProps> = ({
  documents,
  onSelectDocument,
  onRetryDocument,
  onCheckStatus,
  isProcessing,
}) => {
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
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aceptado
          </span>
        );
      case 'procesando':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
            <Clock className="w-3 h-3 mr-1" />
            En Validación
          </span>
        );
      case 'rechazado':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </span>
        );
      case 'error_envio':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Reintento ({doc.intentosEnvio}/{doc.maxIntentos})
          </span>
        );
      case 'firmado':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Firmado XAdES
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-8 text-slate-200">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Cola de Envío y Validación Asíncrona</span>
            <span className="text-xs font-mono font-medium text-slate-400">
              ({filteredDocs.length} de {documents.length})
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Monitoreo en tiempo real de estados de recepción, respuestas oficiales de Hacienda y reintentos automatizados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="todos">Todos los Estados</option>
            <option value="aceptado">Aceptados</option>
            <option value="procesando">En Validación</option>
            <option value="rechazado">Rechazados</option>
            <option value="error_envio">Con Error / En Reintento</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchClave}
              onChange={(e) => setSearchClave(e.target.value)}
              placeholder="Buscar clave o cliente..."
              className="bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white focus:outline-none w-44 sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
            <tr>
              <th className="py-2.5 px-3">Tipo / Consecutivo</th>
              <th className="py-2.5 px-3">Clave Numérica (50 dígitos)</th>
              <th className="py-2.5 px-3">Cliente / Receptor</th>
              <th className="py-2.5 px-3">Fecha Emisión</th>
              <th className="py-2.5 px-3 text-right">Monto Total</th>
              <th className="py-2.5 px-3 text-center">Estado Hacienda</th>
              <th className="py-2.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans text-xs">
                  No se encontraron comprobantes electrónicos en este filtro.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Consecutivo */}
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white">{getDocTypeLabel(doc.tipoDocumento)}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{doc.consecutivo}</div>
                  </td>

                  {/* Clave */}
                  <td className="py-2.5 px-3">
                    <div
                      onClick={() => onSelectDocument(doc)}
                      className="font-mono text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center space-x-1"
                      title="Click para ver desglose de clave de 50 dígitos"
                    >
                      <Hash className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[200px]">{doc.clave}</span>
                    </div>
                    {doc.tiempoRespuestaMs && (
                      <span className="text-[10px] text-slate-500 block">
                        Latencia: {doc.tiempoRespuestaMs}ms
                      </span>
                    )}
                  </td>

                  {/* Receptor */}
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-medium text-slate-200 truncate max-w-[180px]">
                      {doc.receptor.nombre}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Cédula: {doc.receptor.numeroIdentificacion}
                    </div>
                  </td>

                  {/* Fecha */}
                  <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                    {new Date(doc.fechaEmision).toLocaleDateString('es-CR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  {/* Total */}
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-bold text-white">
                      {doc.moneda} {doc.resumen.totalComprobante.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="block text-[10px] text-indigo-300">
                      IVA: {doc.moneda} {doc.resumen.totalImpuesto.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="py-2.5 px-3 text-center">
                    <div>{getStatusBadge(doc.estado, doc)}</div>
                    {doc.proximoReintento && (
                      <span className="text-[10px] text-amber-300 block mt-0.5">
                        Próx: {new Date(doc.proximoReintento).toLocaleTimeString('es-CR')}
                      </span>
                    )}
                    {doc.haciendaDetalle && doc.estado === 'rechazado' && (
                      <span className="text-[10px] text-rose-300 block mt-0.5 font-sans truncate max-w-[140px]" title={doc.haciendaDetalle}>
                        {doc.haciendaDetalle}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right font-sans">
                    <div className="flex items-center justify-end space-x-1.5">
                      {/* Check Async Status */}
                      {doc.estado === 'procesando' && (
                        <button
                          type="button"
                          onClick={() => onCheckStatus(doc.id)}
                          title="Consultar estado asíncrono en Hacienda"
                          className="p-1.5 text-amber-300 hover:bg-slate-800 rounded border border-amber-500/30"
                        >
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        </button>
                      )}

                      {/* Retry on Error */}
                      {doc.estado === 'error_envio' && (
                        <button
                          type="button"
                          onClick={() => onRetryDocument(doc.id)}
                          title="Forzar reintento manual inmediato"
                          className="px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded text-[11px] font-semibold flex items-center space-x-1"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Reintentar</span>
                        </button>
                      )}

                      {/* View XML & Detail */}
                      <button
                        type="button"
                        onClick={() => onSelectDocument(doc)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] font-medium flex items-center space-x-1"
                        title="Ver comprobante, firma XAdES y respuesta de Hacienda"
                      >
                        <FileCode className="w-3.5 h-3.5 text-blue-400" />
                        <span>Detalle</span>
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
