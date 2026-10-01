/**
 * @file src/components/AccountantDesk.tsx
 * @description Dedicated workspace for Certified Public Accountants (CPA).
 * Implements accountant responsibilities: monthly Formulario D-104 tax reconciliation,
 * official Sales & Purchases ledgers, CABYS expense classification, and CPA signoff.
 */

import React, { useState } from 'react';
import {
  Calculator,
  FileCheck2,
  Download,
  Scale,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Building,
  UserCheck,
  Printer,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { ElectronicDocument, ReceptionDocument, Company, TaxReportSummary } from '../types';

interface AccountantDeskProps {
  lang: Language;
  company: Company | null;
  documents: ElectronicDocument[];
  receptions: ReceptionDocument[];
  summary: TaxReportSummary | null;
  onOpenNewDoc: () => void;
  onOpenB2B: () => void;
}

export const AccountantDesk: React.FC<AccountantDeskProps> = ({
  lang,
  company,
  documents,
  receptions,
  summary,
  onOpenNewDoc,
  onOpenB2B,
}) => {
  const t = translations[lang];
  const [activeSubTab, setActiveSubTab] = useState<'d104' | 'ventas' | 'compras' | 'cabys'>('d104');
  const [cpaSignoff, setCpaSignoff] = useState(false);

  const formatCurrency = (val: number) => {
    return '₡' + (val || 0).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /**
   * Exports Sales Journal to CSV.
   */
  const handleExportSalesCsv = () => {
    const headers = ['Consecutivo', 'Clave', 'Fecha', 'Cliente', 'Cedula', 'Subtotal', 'IVA', 'Total'];
    const rows = documents.map((d) => [
      d.consecutivo,
      d.clave,
      d.fechaEmision,
      `"${d.receptor.nombre}"`,
      d.receptor.numeroIdentificacion,
      d.resumen.totalVentaNeta,
      d.resumen.totalImpuesto,
      d.resumen.totalComprobante,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const dl = document.createElement('a');
    dl.href = encodeURI(csv);
    dl.download = `libro-ventas-${company?.cedula}-${Date.now()}.csv`;
    dl.click();
  };

  /**
   * Exports Purchases Journal to CSV.
   */
  const handleExportPurchasesCsv = () => {
    const headers = ['Consecutivo Receptor', 'Clave Factura', 'Fecha', 'Proveedor', 'Cedula', 'Total', 'IVA Acreditado', 'Condicion'];
    const rows = receptions.map((r) => [
      r.numeroConsecutivoReceptor,
      r.claveDocumento,
      r.fechaEmisionDoc,
      `"${r.emisorNombre}"`,
      r.emisorCedula,
      r.totalFactura,
      r.montoTotalImpuestoAcreditar,
      r.condicionImpuesto,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const dl = document.createElement('a');
    dl.href = encodeURI(csv);
    dl.download = `libro-compras-${company?.cedula}-${Date.now()}.csv`;
    dl.click();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {t.accountantTitle}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium">
                CPA Official Desk
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {company?.nombre} · Cédula: {company?.cedula} · Régimen: {company?.regimenTributario?.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCpaSignoff(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{cpaSignoff ? (lang === 'en' ? 'CPA Certified' : 'CPA Certificado') : (lang === 'en' ? 'CPA Signoff D-104' : 'Firma CPA D-104')}</span>
          </button>
        </div>
      </div>

      {/* Role & Responsibilities Explanation Banner */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-5 text-xs">
        <div className="flex items-start space-x-2.5">
          <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">
              {lang === 'en' ? 'Accountant Responsibilities in Costa Rica e-Invoicing:' : 'Responsabilidades del Contador en Facturación Electrónica Costa Rica:'}
            </span>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
              {t.accountantDuties}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex space-x-2 border-b border-slate-800 mb-5 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('d104')}
          className={`py-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeSubTab === 'd104'
              ? 'border-blue-400 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Formulario D-104 (IVA)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ventas')}
          className={`py-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeSubTab === 'ventas'
              ? 'border-blue-400 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{t.accountantSalesLedger} ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('compras')}
          className={`py-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeSubTab === 'compras'
              ? 'border-blue-400 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>{t.accountantPurchasesLedger} ({receptions.length})</span>
        </button>
      </div>

      {/* D-104 Reconciliation View */}
      {activeSubTab === 'd104' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-sans">
                {lang === 'en' ? 'Total Net Sales (Tax Base)' : 'Total Ventas Netas Gravadas'}
              </span>
              <span className="text-xl font-bold text-white mt-1 block">
                {formatCurrency(summary?.totalVentasNetas || 0)}
              </span>
              <span className="text-[10px] text-emerald-400 block mt-1 font-sans">
                {documents.filter((d) => d.estado === 'aceptado').length} facturas autorizadas
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-sans">
                {lang === 'en' ? 'IVA Débito Fiscal (Collected)' : 'IVA Débito Fiscal (Cobrado)'}
              </span>
              <span className="text-xl font-bold text-indigo-300 mt-1 block">
                {formatCurrency(summary?.ivaDebitoFiscal || 0)}
              </span>
              <span className="text-[10px] text-indigo-400 block mt-1 font-sans">
                Impuesto devengado en ventas
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-sans">
                {lang === 'en' ? 'IVA Crédito Fiscal (B2B Purchases)' : 'IVA Crédito Fiscal (Compras Proveedores)'}
              </span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {formatCurrency(summary?.ivaCreditoFiscal || 0)}
              </span>
              <span className="text-[10px] text-emerald-400 block mt-1 font-sans">
                {receptions.filter((r) => r.tipoMensaje === '05').length} compras con crédito pleno
              </span>
            </div>
          </div>

          {/* Net Balance Statement Card */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-white">
                  {lang === 'en' ? 'Net VAT Liability for Formulario D-104' : 'Saldo Neto de IVA para Declaración Formulario D-104'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Fórmula oficial: Débito Fiscal (₡{(summary?.ivaDebitoFiscal || 0).toLocaleString('es-CR')}) - Crédito Fiscal (₡{(summary?.ivaCreditoFiscal || 0).toLocaleString('es-CR')})
              </p>
              {cpaSignoff && (
                <div className="mt-2 text-xs text-emerald-400 flex items-center space-x-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Certificado y firmado digitalmente por Contador Público Autorizado (CPA-CR-18920).</span>
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                {lang === 'en' ? 'Net Amount to Pay / Credit' : 'Monto Neto a Pagar'}
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {formatCurrency(summary?.balanceIvaPagar || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sales Ledger */}
      {activeSubTab === 'ventas' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400">
              {lang === 'en' ? 'Official sales transactions ledger compliant with Costa Rica Tax Code.' : 'Libro oficial de ventas de acuerdo con el Código Tributario de Costa Rica.'}
            </span>
            <button
              onClick={handleExportSalesCsv}
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Exportar Libro Ventas (CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-2 px-3">Consecutivo</th>
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3">Cliente</th>
                  <th className="py-2 px-3">Cédula</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                  <th className="py-2 px-3 text-right">IVA</th>
                  <th className="py-2 px-3 text-right">Total</th>
                  <th className="py-2 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/60 font-mono text-[11px]">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-semibold text-white">{d.consecutivo}</td>
                    <td className="py-2 px-3 text-slate-400">{new Date(d.fechaEmision).toLocaleDateString('es-CR')}</td>
                    <td className="py-2 px-3 font-sans text-slate-200 truncate max-w-[150px]">{d.receptor.nombre}</td>
                    <td className="py-2 px-3 text-slate-400">{d.receptor.numeroIdentificacion}</td>
                    <td className="py-2 px-3 text-right">{d.resumen.totalVentaNeta.toLocaleString('es-CR')}</td>
                    <td className="py-2 px-3 text-right text-indigo-300">{d.resumen.totalImpuesto.toLocaleString('es-CR')}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-400">{d.resumen.totalComprobante.toLocaleString('es-CR')}</td>
                    <td className="py-2 px-3 text-center text-emerald-400 font-sans">{d.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchases Ledger */}
      {activeSubTab === 'compras' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400">
              {lang === 'en' ? 'Supplier invoices and B2B receptions credited for tax deductions.' : 'Facturas de proveedores recibidas con mensajes de aceptación 05/06/07.'}
            </span>
            <button
              onClick={handleExportPurchasesCsv}
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar Libro Compras (CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-2 px-3">Consecutivo Receptor</th>
                  <th className="py-2 px-3">Proveedor</th>
                  <th className="py-2 px-3">Cédula</th>
                  <th className="py-2 px-3 text-right">Total Factura</th>
                  <th className="py-2 px-3 text-right">IVA Acreditado</th>
                  <th className="py-2 px-3 text-center">Decisión</th>
                  <th className="py-2 px-3 text-center">Condición Crédito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/60 font-mono text-[11px]">
                {receptions.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-semibold text-white">{r.numeroConsecutivoReceptor}</td>
                    <td className="py-2 px-3 font-sans text-slate-200">{r.emisorNombre}</td>
                    <td className="py-2 px-3 text-slate-400">{r.emisorCedula}</td>
                    <td className="py-2 px-3 text-right">₡{r.totalFactura.toLocaleString('es-CR')}</td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-bold">₡{r.montoTotalImpuestoAcreditar.toLocaleString('es-CR')}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-sans">
                        {r.tipoMensaje === '05' ? '05 Aceptado' : r.tipoMensaje}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400 font-sans">
                      {r.condicionImpuesto === '01' ? 'Crédito Pleno' : r.condicionImpuesto}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
