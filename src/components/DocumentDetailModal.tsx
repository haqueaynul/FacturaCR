/**
 * @file src/components/DocumentDetailModal.tsx
 * @description Deep inspection modal for Costa Rica electronic documents.
 * Segments the 50-digit numeric Clave, generates official QR code verification payload,
 * displays XAdES-EPES cryptographic signature nodes, and displays Hacienda's official Respuesta XML.
 * Fully supports Light (Bright) and Dark themes.
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
} from 'lucide-react';
import { Language } from '../i18n';
import { ElectronicDocument } from '../types';

interface DocumentDetailModalProps {
  lang: Language;
  theme?: 'dark' | 'bright';
  document: ElectronicDocument | null;
  onClose: () => void;
}

/**
 * Inspection modal for electronic document XML, cryptographic signature, and official response.
 */
export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  lang,
  theme = 'bright',
  document,
  onClose,
}) => {
  const isEn = lang === 'en';
  const isBright = theme === 'bright';
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
    <div className={`fixed inset-0 ${isBright ? 'bg-slate-900/50' : 'bg-black/80'} backdrop-blur-xs flex items-center justify-center z-50 p-4`}>
      <div
        className={`border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-colors ${
          isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className={`font-bold text-base ${isBright ? 'text-slate-900' : 'text-white'}`}>
                  {isEn ? 'Document Consecutivo' : 'Comprobante Consecutivo'} {document.consecutivo}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-mono uppercase ${
                    isBright ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {document.tipoDocumento === '01' ? (isEn ? 'Electronic Invoice' : 'Factura Electrónica') : `Comprobante v${document.schemaVersion || '4.4'}`}
                </span>
              </div>
              <p className={`text-xs ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
                {isEn ? 'Emitted on' : 'Emitido el'} {new Date(document.fechaEmision).toLocaleString(isEn ? 'en-US' : 'es-CR')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownloadXml(document.xmlFirmado || document.xmlOriginal, `${document.clave}-firmado.xml`)}
              className={`px-3 py-1.5 text-xs font-medium border rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isBright
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>{isEn ? 'Download XML' : 'Descargar XML'}</span>
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isBright ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 50-Digit Clave Inspector Banner */}
        <div
          className={`p-4 border-b ${
            isBright ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider ${
              isBright ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <Hash className="w-4 h-4 text-emerald-500" />
              <span>{isEn ? 'Structured 50-Digit Numeric Clave Breakdown' : 'Desglose Estructurado de Clave Numérica (50 Dígitos)'}</span>
            </div>
            <button
              onClick={handleCopyClave}
              className={`text-xs flex items-center space-x-1 cursor-pointer transition-colors ${
                isBright ? 'text-slate-500 hover:text-emerald-600' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              {copiedClave ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedClave ? (isEn ? 'Copied' : 'Copiado') : (isEn ? 'Copy Clave' : 'Copiar Clave')}</span>
            </button>
          </div>

          {/* Color-Coded Segments */}
          <div className="flex flex-wrap gap-1 font-mono text-xs text-center">
            <div
              className={`px-2 py-1 rounded border ${
                isBright ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-blue-900/40 border-blue-600/40'
              }`}
              title="Country Code (506 - Costa Rica)"
            >
              <span className={`font-bold ${isBright ? 'text-blue-700' : 'text-blue-300'}`}>{claveCountry}</span>
              <span className={`block text-[9px] ${isBright ? 'text-blue-500' : 'text-blue-400'}`}>{isEn ? 'Country' : 'País'}</span>
            </div>
            <div
              className={`px-2 py-1 rounded border ${
                isBright ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-indigo-900/40 border-indigo-600/40'
              }`}
              title="Day / Month / Year"
            >
              <span className={`font-bold ${isBright ? 'text-indigo-700' : 'text-indigo-300'}`}>{claveDay}{claveMonth}{claveYear}</span>
              <span className={`block text-[9px] ${isBright ? 'text-indigo-500' : 'text-indigo-400'}`}>{isEn ? 'Date' : 'Fecha'}</span>
            </div>
            <div
              className={`px-2 py-1 rounded border ${
                isBright ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-900/40 border-emerald-600/40'
              }`}
              title="Issuer Tax ID (12 digits)"
            >
              <span className={`font-bold ${isBright ? 'text-emerald-700' : 'text-emerald-300'}`}>{claveCedula}</span>
              <span className={`block text-[9px] ${isBright ? 'text-emerald-500' : 'text-emerald-400'}`}>{isEn ? 'Issuer ID' : 'Cédula Emisor'}</span>
            </div>
            <div
              className={`px-2 py-1 rounded border ${
                isBright ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-900/40 border-amber-600/40'
              }`}
              title="Branch (3) + Terminal (5)"
            >
              <span className={`font-bold ${isBright ? 'text-amber-700' : 'text-amber-300'}`}>{claveSucursal}-{claveTerminal}</span>
              <span className={`block text-[9px] ${isBright ? 'text-amber-600' : 'text-amber-400'}`}>{isEn ? 'Branch/Term' : 'Suc / Term'}</span>
            </div>
            <div
              className={`px-2 py-1 rounded border ${
                isBright ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-purple-900/40 border-purple-600/40'
              }`}
              title="Document Type (2 digits)"
            >
              <span className={`font-bold ${isBright ? 'text-purple-700' : 'text-purple-300'}`}>{claveTipoDoc}</span>
              <span className={`block text-[9px] ${isBright ? 'text-purple-500' : 'text-purple-400'}`}>{isEn ? 'Type' : 'Tipo'}</span>
            </div>
            <div
              className={`px-2 py-1 rounded border ${
                isBright ? 'bg-teal-50 border-teal-200 text-teal-900' : 'bg-teal-900/40 border-teal-600/40'
              }`}
              title="Numeric Sequence (10 digits)"
            >
              <span className={`font-bold ${isBright ? 'text-teal-700' : 'text-teal-300'}`}>{claveSecuencia}</span>
              <span className={`block text-[9px] ${isBright ? 'text-teal-500' : 'text-teal-400'}`}>{isEn ? 'Sequence' : 'Secuencia'}</span>
            </div>
            <div
              className={`px-2 py-1 rounded border ${
                isBright ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-rose-900/40 border-rose-600/40'
              }`}
              title="Document Situation (1: Normal)"
            >
              <span className={`font-bold ${isBright ? 'text-rose-700' : 'text-rose-300'}`}>{claveSituacion}</span>
              <span className={`block text-[9px] ${isBright ? 'text-rose-500' : 'text-rose-400'}`}>{isEn ? 'Sit.' : 'Sit.'}</span>
            </div>
            <div
              className={`px-2 py-1 rounded border ${
                isBright ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700'
              }`}
              title="Security Code (8 digits)"
            >
              <span className={`font-bold ${isBright ? 'text-slate-800' : 'text-slate-300'}`}>{claveSeguridad}</span>
              <span className={`block text-[9px] ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>{isEn ? 'Security' : 'Seguridad'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className={`px-4 border-b flex space-x-4 text-xs font-semibold ${
            isBright ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <button
            onClick={() => setActiveTab('resumen')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'resumen'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : isBright
                ? 'border-transparent text-slate-500 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isEn ? 'Commercial Summary' : 'Resumen Comercial'}
          </button>
          <button
            onClick={() => setActiveTab('xmlFirmado')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'xmlFirmado'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : isBright
                ? 'border-transparent text-slate-500 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>{isEn ? 'Signed XML (XAdES-EPES)' : 'XML Firmado (XAdES-EPES)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('respuestaHacienda')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'respuestaHacienda'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : isBright
                ? 'border-transparent text-slate-500 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isEn ? 'Official Tax Response' : 'Respuesta Oficial Hacienda'}</span>
          </button>
          <button
            onClick={() => setActiveTab('xmlOriginal')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'xmlOriginal'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : isBright
                ? 'border-transparent text-slate-500 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isEn ? 'Original Canonical XML' : 'XML Original'}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto flex-1 font-sans text-xs">
          {activeTab === 'resumen' && (
            <div className="space-y-4">
              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Emisor */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                    isBright ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    {isEn ? 'Issuer / Taxpayer' : 'Emisor / Contribuyente'}
                  </span>
                  <div className={`font-semibold text-sm ${isBright ? 'text-slate-900' : 'text-white'}`}>
                    {document.emisor.nombre}
                  </div>
                  <div className={`font-mono text-[11px] mt-0.5 ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                    {isEn ? 'Tax ID' : 'Cédula'}: {document.emisor.numeroIdentificacion} ({isEn ? 'Type' : 'Tipo'} {document.emisor.tipoIdentificacion})
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>{document.emisor.correo}</div>
                  <div
                    className={`mt-2 text-[10px] inline-block px-2 py-0.5 rounded border ${
                      isBright
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    }`}
                  >
                    {isEn ? 'Regime' : 'Régimen'}: {document.emisor.regimen}
                  </div>
                </div>

                {/* Receptor */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                    isBright ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    {isEn ? 'Customer / Receptor' : 'Receptor / Cliente'}
                  </span>
                  <div className={`font-semibold text-sm ${isBright ? 'text-slate-900' : 'text-white'}`}>
                    {document.receptor.nombre}
                  </div>
                  <div className={`font-mono text-[11px] mt-0.5 ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                    {isEn ? 'Tax ID' : 'Cédula'}: {document.receptor.numeroIdentificacion} ({isEn ? 'Type' : 'Tipo'} {document.receptor.tipoIdentificacion})
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>{document.receptor.correo}</div>
                  <div
                    className={`mt-2 text-[10px] inline-block px-2 py-0.5 rounded border ${
                      isBright
                        ? 'bg-blue-50 text-blue-800 border-blue-200 font-semibold'
                        : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                    }`}
                  >
                    {isEn ? 'Terms' : 'Condición'}: {document.condicionVenta === '01' ? (isEn ? 'Cash' : 'Contado') : (isEn ? 'Credit' : 'Crédito')} · {document.medioPago === '05' ? 'SINPE Móvil' : document.medioPago === '04' ? (isEn ? 'Bank Transfer' : 'Transferencia') : (isEn ? 'Card' : 'Tarjeta')}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className={`border rounded-xl overflow-hidden ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
                <table className="w-full text-left text-xs">
                  <thead
                    className={`text-[10px] uppercase tracking-wider border-b ${
                      isBright ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">CABYS</th>
                      <th className="py-2 px-3">{isEn ? 'Detail' : 'Detalle'}</th>
                      <th className="py-2 px-3 text-right">{isEn ? 'Qty' : 'Cant'}</th>
                      <th className="py-2 px-3 text-right">{isEn ? 'Unit Price' : 'Precio Unit.'}</th>
                      <th className="py-2 px-3 text-right">{isEn ? 'VAT Rate' : 'Tarifa IVA'}</th>
                      <th className="py-2 px-3 text-right">IVA</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`font-mono divide-y ${
                      isBright ? 'bg-white divide-slate-200 text-slate-700' : 'bg-slate-950/60 divide-slate-800 text-slate-300'
                    }`}
                  >
                    {document.items.map((item) => (
                      <tr key={item.numeroLinea} className={isBright ? 'hover:bg-slate-50' : 'hover:bg-slate-900/40'}>
                        <td className="py-2 px-3 text-slate-400">{item.numeroLinea}</td>
                        <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">{item.codigoCabys}</td>
                        <td className={`py-2 px-3 font-sans ${isBright ? 'text-slate-900 font-medium' : 'text-slate-200'}`}>{item.detalle}</td>
                        <td className="py-2 px-3 text-right">{item.cantidad}</td>
                        <td className="py-2 px-3 text-right">{item.precioUnitario.toLocaleString(isEn ? 'en-US' : 'es-CR')}</td>
                        <td className="py-2 px-3 text-right">{item.tarifaIva}%</td>
                        <td className="py-2 px-3 text-right text-indigo-600 dark:text-indigo-300">{item.montoIva.toLocaleString(isEn ? 'en-US' : 'es-CR')}</td>
                        <td className={`py-2 px-3 text-right font-bold ${isBright ? 'text-slate-900' : 'text-white'}`}>{item.montoTotalLinea.toLocaleString(isEn ? 'en-US' : 'es-CR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary and Verification QR Code representation */}
              <div
                className={`flex flex-col sm:flex-row items-start justify-between p-4 rounded-xl border gap-4 ${
                  isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                {/* QR Code */}
                <div className="flex items-center space-x-3">
                  <div className="w-20 h-20 bg-white p-1 rounded-lg flex items-center justify-center border border-slate-300 shadow-sm">
                    <QrCode className="w-16 h-16 text-slate-900" />
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                      {isEn ? 'Tax Verification QR Code' : 'Código QR de Validación Fiscal'}
                    </span>
                    <p className={`text-[11px] max-w-xs truncate font-mono mt-0.5 ${isBright ? 'text-slate-500' : 'text-slate-500'}`}>
                      {qrVerificationUrl}
                    </p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-1">
                      Resolución DGT-R-033-2019 / DGT-R-028-2023
                    </span>
                  </div>
                </div>

                {/* Totals */}
                <div className="w-full sm:w-64 space-y-1 font-mono text-xs">
                  <div className={`flex justify-between ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                    <span>{isEn ? 'Taxable Subtotal:' : 'Subtotal Gravado:'}</span>
                    <span>{document.moneda} {document.resumen.totalGravado.toLocaleString(isEn ? 'en-US' : 'es-CR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className={`flex justify-between ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                    <span>{isEn ? 'Exempt Subtotal:' : 'Subtotal Exento:'}</span>
                    <span>{document.moneda} {document.resumen.totalExento.toLocaleString(isEn ? 'en-US' : 'es-CR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className={`flex justify-between font-semibold ${isBright ? 'text-indigo-700' : 'text-indigo-300'}`}>
                    <span>{isEn ? 'Total VAT:' : 'Total IVA:'}</span>
                    <span>{document.moneda} {document.resumen.totalImpuesto.toLocaleString(isEn ? 'en-US' : 'es-CR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className={`flex justify-between font-bold text-sm pt-2 border-t ${
                    isBright ? 'border-slate-300 text-slate-900' : 'border-slate-800 text-white'
                  }`}>
                    <span>{isEn ? 'Total Invoice:' : 'Total Comprobante:'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{document.moneda} {document.resumen.totalComprobante.toLocaleString(isEn ? 'en-US' : 'es-CR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'xmlFirmado' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-mono ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isEn ? 'XAdES-EPES Digital Signature' : 'Firma XAdES-EPES'} (SHA-256 Digest: {document.digestValue?.slice(0, 32)}...)
                </span>
                <button
                  onClick={() => handleDownloadXml(document.xmlFirmado || '', `${document.clave}-firmado.xml`)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Download Signed XML' : 'Descargar XML Firmado'}</span>
                </button>
              </div>
              <pre className={`p-4 rounded-xl border text-[11px] font-mono overflow-x-auto max-h-96 whitespace-pre leading-relaxed ${
                isBright
                  ? 'bg-slate-900 text-emerald-300 border-slate-700 shadow-inner'
                  : 'bg-slate-950 border-slate-800 text-emerald-300'
              }`}>
                {document.xmlFirmado || (isEn ? 'Document not digitally signed yet.' : 'Documento aún no firmado digitalmente.')}
              </pre>
            </div>
          )}

          {activeTab === 'respuestaHacienda' && (
            <div>
              <div className="mb-2">
                <span className={`text-xs ${isBright ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                  {document.haciendaMensaje || (isEn ? 'Awaiting response from Hacienda asynchronous validation server.' : 'Esperando respuesta del servidor de validación asíncrona de Hacienda.')}
                </span>
              </div>
              <pre className={`p-4 rounded-xl border text-[11px] font-mono overflow-x-auto max-h-96 whitespace-pre leading-relaxed ${
                isBright
                  ? 'bg-slate-900 text-blue-300 border-slate-700 shadow-inner'
                  : 'bg-slate-950 border-slate-800 text-blue-300'
              }`}>
                {document.haciendaRespuestaXml ||
                  (document.estado === 'procesando'
                    ? (isEn ? '<!-- Document in asynchronous validation queue. Hacienda official response will register upon completion. -->' : '<!-- Documento en cola de validación asíncrona. La RespuestaHacienda se registrará una vez autorizada. -->')
                    : document.haciendaDetalle || (isEn ? '<!-- No official response recorded -->' : '<!-- Sin respuesta oficial registrada -->'))}
              </pre>
            </div>
          )}

          {activeTab === 'xmlOriginal' && (
            <div>
              <pre className={`p-4 rounded-xl border text-[11px] font-mono overflow-x-auto max-h-96 whitespace-pre leading-relaxed ${
                isBright
                  ? 'bg-slate-900 text-slate-200 border-slate-700 shadow-inner'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                {document.xmlOriginal}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
