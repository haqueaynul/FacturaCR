/**
 * @file src/components/DocumentDetailModal.tsx
 * @description Deep inspection modal for Costa Rica electronic documents.
 * Segments the 50-digit numeric Clave, generates official QR code verification payload,
 * displays XAdES-EPES cryptographic signature nodes, and displays Hacienda's official Respuesta XML.
 */

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FileCode,
  ShieldCheck,
  QrCode,
  FileText,
  Hash,
  Clock,
  Printer,
} from 'lucide-react';
import { ElectronicDocument } from '../types';

interface DocumentDetailModalProps {
  document: ElectronicDocument | null;
  onClose: () => void;
}

/**
 * Inspection modal for electronic document XML, cryptographic signature, and official response.
 */
export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'resumen' | 'xmlFirmado' | 'xmlOriginal' | 'respuestaHacienda'>('resumen');
  const [copiedClave, setCopiedClave] = useState(false);

  if (!document) return null;

  // 50-digit Clave breakdown
  const c = document.clave;
  const claveCountry = c.slice(0, 3);
  const claveDay = c.slice(3, 5);
  const claveMonth = c.slice(5, 7);
  const claveYear = c.slice(7, 9);
  const claveCedula = c.slice(9, 21);
  const claveSucursal = c.slice(21, 24);
  const claveTerminal = c.slice(24, 29);
  const claveTipoDoc = c.slice(29, 31);
  const claveSecuencia = c.slice(31, 41);
  const claveSituacion = c.slice(41, 42);
  const claveSeguridad = c.slice(42, 50);

  /**
   * Copies 50-digit clave to clipboard.
   */
  const handleCopyClave = () => {
    navigator.clipboard.writeText(document.clave);
    setCopiedClave(true);
    setTimeout(() => setCopiedClave(false), 2000);
  };

  /**
   * Downloads XML file.
   */
  const handleDownloadXml = (xmlContent: string, fileName: string) => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Official Costa Rica Tributación verification URL
  const qrVerificationUrl = `https://tribunet.hacienda.go.cr/docs/${document.clave}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">
                  Comprobante Consecutivo {document.consecutivo}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded font-mono uppercase bg-slate-700 text-slate-300">
                  {document.tipoDocumento === '01' ? 'Factura Electrónica' : 'Comprobante v4.3'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Emitido el {new Date(document.fechaEmision).toLocaleString('es-CR')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownloadXml(document.xmlFirmado || document.xmlOriginal, `${document.clave}-firmado.xml`)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Descargar XML</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 50-Digit Clave Inspector Banner */}
        <div className="bg-slate-950 p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Hash className="w-4 h-4 text-emerald-400" />
              <span>Desglose Estructurado de Clave Numérica (50 Dígitos)</span>
            </div>
            <button
              onClick={handleCopyClave}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center space-x-1"
            >
              {copiedClave ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedClave ? 'Copiado' : 'Copiar Clave'}</span>
            </button>
          </div>

          {/* Color-Coded Segments */}
          <div className="flex flex-wrap gap-1 font-mono text-xs text-center">
            <div className="bg-blue-900/40 border border-blue-600/40 px-2 py-1 rounded" title="Código País (506 - Costa Rica)">
              <span className="text-blue-300 font-bold">{claveCountry}</span>
              <span className="block text-[9px] text-blue-400">País</span>
            </div>
            <div className="bg-indigo-900/40 border border-indigo-600/40 px-2 py-1 rounded" title="Día / Mes / Año">
              <span className="text-indigo-300 font-bold">{claveDay}{claveMonth}{claveYear}</span>
              <span className="block text-[9px] text-indigo-400">Fecha</span>
            </div>
            <div className="bg-emerald-900/40 border border-emerald-600/40 px-2 py-1 rounded" title="Cédula Emisor (12 dígitos)">
              <span className="text-emerald-300 font-bold">{claveCedula}</span>
              <span className="block text-[9px] text-emerald-400">Cédula Emisor</span>
            </div>
            <div className="bg-amber-900/40 border border-amber-600/40 px-2 py-1 rounded" title="Sucursal (3) + Terminal (5)">
              <span className="text-amber-300 font-bold">{claveSucursal}-{claveTerminal}</span>
              <span className="block text-[9px] text-amber-400">Suc / Term</span>
            </div>
            <div className="bg-purple-900/40 border border-purple-600/40 px-2 py-1 rounded" title="Tipo Documento (2)">
              <span className="text-purple-300 font-bold">{claveTipoDoc}</span>
              <span className="block text-[9px] text-purple-400">Tipo</span>
            </div>
            <div className="bg-teal-900/40 border border-teal-600/40 px-2 py-1 rounded" title="Secuencia Numérica (10)">
              <span className="text-teal-300 font-bold">{claveSecuencia}</span>
              <span className="block text-[9px] text-teal-400">Secuencia</span>
            </div>
            <div className="bg-rose-900/40 border border-rose-600/40 px-2 py-1 rounded" title="Situación del Comprobante (1: Normal)">
              <span className="text-rose-300 font-bold">{claveSituacion}</span>
              <span className="block text-[9px] text-rose-400">Sit.</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 px-2 py-1 rounded" title="Código de Seguridad (8 dígitos)">
              <span className="text-slate-300 font-bold">{claveSeguridad}</span>
              <span className="block text-[9px] text-slate-400">Seguridad</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 border-b border-slate-800 flex space-x-4 bg-slate-900/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'resumen'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Resumen Comercial
          </button>
          <button
            onClick={() => setActiveTab('xmlFirmado')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'xmlFirmado'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>XML Firmado (XAdES-EPES)</span>
          </button>
          <button
            onClick={() => setActiveTab('respuestaHacienda')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'respuestaHacienda'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Respuesta Oficial Hacienda</span>
          </button>
          <button
            onClick={() => setActiveTab('xmlOriginal')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'xmlOriginal'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            XML Original v4.3
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto flex-1 font-sans text-xs">
          {activeTab === 'resumen' && (
            <div className="space-y-4">
              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Emisor */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Emisor / Contribuyente
                  </span>
                  <div className="font-semibold text-white text-sm">{document.emisor.nombre}</div>
                  <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                    Cédula: {document.emisor.numeroIdentificacion} (Tipo {document.emisor.tipoIdentificacion})
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{document.emisor.correo}</div>
                  <div className="mt-2 text-[10px] text-emerald-400 bg-emerald-500/10 inline-block px-2 py-0.5 rounded border border-emerald-500/20">
                    Régimen: {document.emisor.regimen}
                  </div>
                </div>

                {/* Receptor */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Receptor / Cliente
                  </span>
                  <div className="font-semibold text-white text-sm">{document.receptor.nombre}</div>
                  <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                    Cédula: {document.receptor.numeroIdentificacion} (Tipo {document.receptor.tipoIdentificacion})
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{document.receptor.correo}</div>
                  <div className="mt-2 text-[10px] text-blue-400 bg-blue-500/10 inline-block px-2 py-0.5 rounded border border-blue-500/20">
                    Condición: {document.condicionVenta === '01' ? 'Contado' : 'Crédito'} · {document.medioPago === '04' ? 'SINPE Móvil / Transferencia' : 'Tarjeta'}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">CABYS</th>
                      <th className="py-2 px-3">Detalle</th>
                      <th className="py-2 px-3 text-right">Cant</th>
                      <th className="py-2 px-3 text-right">Precio Unit.</th>
                      <th className="py-2 px-3 text-right">Tarifa IVA</th>
                      <th className="py-2 px-3 text-right">IVA</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/60 font-mono">
                    {document.items.map((item) => (
                      <tr key={item.numeroLinea}>
                        <td className="py-2 px-3 text-slate-500">{item.numeroLinea}</td>
                        <td className="py-2 px-3 text-emerald-400">{item.codigoCabys}</td>
                        <td className="py-2 px-3 font-sans text-slate-200">{item.detalle}</td>
                        <td className="py-2 px-3 text-right">{item.cantidad}</td>
                        <td className="py-2 px-3 text-right">{item.precioUnitario.toLocaleString('es-CR')}</td>
                        <td className="py-2 px-3 text-right">{item.tarifaIva}%</td>
                        <td className="py-2 px-3 text-right text-indigo-300">{item.montoIva.toLocaleString('es-CR')}</td>
                        <td className="py-2 px-3 text-right font-bold text-white">{item.montoTotalLinea.toLocaleString('es-CR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary and Verification QR Code representation */}
              <div className="flex flex-col sm:flex-row items-start justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 gap-4">
                {/* QR Code */}
                <div className="flex items-center space-x-3">
                  <div className="w-20 h-20 bg-white p-1 rounded-lg flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-900" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Código QR de Validación Fiscal
                    </span>
                    <p className="text-[11px] text-slate-500 max-w-xs truncate font-mono mt-0.5">
                      {qrVerificationUrl}
                    </p>
                    <span className="text-[10px] text-emerald-400 block mt-1">
                      Resolución DGT-R-033-2019
                    </span>
                  </div>
                </div>

                {/* Totals */}
                <div className="w-full sm:w-64 space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal Gravado:</span>
                    <span>{document.moneda} {document.resumen.totalGravado.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal Exento:</span>
                    <span>{document.moneda} {document.resumen.totalExento.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-indigo-300 font-semibold">
                    <span>Total IVA:</span>
                    <span>{document.moneda} {document.resumen.totalImpuesto.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                    <span>Total Comprobante:</span>
                    <span className="text-emerald-400">{document.moneda} {document.resumen.totalComprobante.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'xmlFirmado' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono">
                  Firma XAdES-EPES (SHA-256 Digest: {document.digestValue?.slice(0, 32)}...)
                </span>
                <button
                  onClick={() => handleDownloadXml(document.xmlFirmado || '', `${document.clave}-firmado.xml`)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar XML Firmado</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-96 whitespace-pre leading-relaxed">
                {document.xmlFirmado || 'Documento aún no firmado digitalmente.'}
              </pre>
            </div>
          )}

          {activeTab === 'respuestaHacienda' && (
            <div>
              <div className="mb-2">
                <span className="text-xs text-slate-400">
                  {document.haciendaMensaje || 'Esperando respuesta del servidor de validación asíncrona de Hacienda.'}
                </span>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-blue-300 overflow-x-auto max-h-96 whitespace-pre leading-relaxed">
                {document.haciendaRespuestaXml ||
                  (document.estado === 'procesando'
                    ? '<!-- Documento en cola de validación asíncrona. La RespuestaHacienda se registrará una vez autorizada. -->'
                    : document.haciendaDetalle || '<!-- Sin respuesta oficial registrada -->')}
              </pre>
            </div>
          )}

          {activeTab === 'xmlOriginal' && (
            <div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96 whitespace-pre leading-relaxed">
                {document.xmlOriginal}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
