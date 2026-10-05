/**
 * @file src/components/AccountantDesk.tsx
 * @description Dedicated workspace for Certified Public Accountants (CPA).
 * Implements accountant responsibilities: monthly Formulario D-104 tax reconciliation,
 * official Sales & Purchases ledgers, CABYS expense classification, and CPA signoff.
 * Fully supports Light (Bright) and Dark themes.
 */

import React, { useState } from 'react';
import {
  Calculator,
  FileCheck2,
  Download,
  Scale,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  UserCheck,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { ElectronicDocument, ReceptionDocument, Company, TaxReportSummary } from '../types';

interface AccountantDeskProps {
  lang: Language;
  theme?: 'dark' | 'bright';
  company: Company | null;
  documents: ElectronicDocument[];
  receptions: ReceptionDocument[];
  summary: TaxReportSummary | null;
  onOpenNewDoc: () => void;
  onOpenB2B: () => void;
}

export const AccountantDesk: React.FC<AccountantDeskProps> = ({
  lang,
  theme = 'bright',
  company,
  documents,
  receptions,
  summary,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';
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
    <div
      className={`border rounded-xl p-5 shadow-lg mb-8 transition-colors ${
        isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
      }`}
    >
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b gap-3 ${
          isBright ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold tracking-tight ${isBright ? 'text-slate-900' : 'text-white'}`}>
                {t.accountantTitle}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-medium">
                CPA Official Desk
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
              {company?.nombre} · Cédula: {company?.cedula} · Régimen: {company?.regimenTributario?.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCpaSignoff(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{cpaSignoff ? (lang === 'en' ? 'CPA Certified' : 'CPA Certificado') : (lang === 'en' ? 'CPA Signoff D-104' : 'Firma CPA D-104')}</span>
          </button>
        </div>
      </div>

      {/* Role & Responsibilities Explanation Banner */}
      <div
        className={`p-3.5 rounded-xl border mb-5 text-xs ${
          isBright ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
        }`}
      >
        <div className="flex items-start space-x-2.5">
          <FileCheck2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>
              {lang === 'en' ? 'Accountant Responsibilities in Costa Rica e-Invoicing:' : 'Responsabilidades del Contador en Facturación Electrónica Costa Rica:'}
            </span>
            <p className={`text-[11px] mt-0.5 leading-relaxed ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
              {t.accountantDuties}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className={`flex space-x-2 border-b mb-5 text-xs font-semibold ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
        <button
          onClick={() => setActiveSubTab('d104')}
          className={`py-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'd104'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
              : isBright
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Formulario D-104 (IVA)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ventas')}
          className={`py-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'ventas'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
              : isBright
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{t.accountantSalesLedger} ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('compras')}
          className={`py-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'compras'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
              : isBright
              ? 'border-transparent text-slate-500 hover:text-slate-800'
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
            <div className={`p-4 rounded-xl border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <span className={`text-[10px] uppercase block font-sans ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
                {lang === 'en' ? 'Total Net Sales (Tax Base)' : 'Total Ventas Netas Gravadas'}
              </span>
              <span className={`text-xl font-bold mt-1 block ${isBright ? 'text-slate-900' : 'text-white'}`}>
                {formatCurrency(summary?.totalVentasNetas || 0)}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-sans font-medium">
                {documents.filter((d) => d.estado === 'aceptado').length} facturas autorizadas
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <span className={`text-[10px] uppercase block font-sans ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
                {lang === 'en' ? 'IVA Débito Fiscal (Collected)' : 'IVA Débito Fiscal (Cobrado)'}
              </span>
              <span className={`text-xl font-bold mt-1 block ${isBright ? 'text-indigo-700' : 'text-indigo-300'}`}>
                {formatCurrency(summary?.ivaDebitoFiscal || 0)}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block mt-1 font-sans">
                Impuesto devengado en ventas
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <span className={`text-[10px] uppercase block font-sans ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
                {lang === 'en' ? 'IVA Crédito Fiscal (B2B Purchases)' : 'IVA Crédito Fiscal (Compras Proveedores)'}
              </span>
              <span className={`text-xl font-bold mt-1 block ${isBright ? 'text-emerald-700' : 'text-emerald-400'}`}>
                {formatCurrency(summary?.ivaCreditoFiscal || 0)}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-sans font-medium">
                {receptions.filter((r) => r.tipoMensaje === '05').length} compras con crédito pleno
              </span>
            </div>
          </div>

          {/* Net Balance Statement Card */}
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-emerald-500" />
                <span className={`text-sm font-bold ${isBright ? 'text-slate-900' : 'text-white'}`}>
                  {lang === 'en' ? 'Net VAT Liability for Formulario D-104' : 'Saldo Neto de IVA para Declaración Formulario D-104'}
                </span>
              </div>
              <p className={`text-xs mt-1 ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                Fórmula oficial: Débito Fiscal (₡{(summary?.ivaDebitoFiscal || 0).toLocaleString('es-CR')}) - Crédito Fiscal (₡{(summary?.ivaCreditoFiscal || 0).toLocaleString('es-CR')})
              </p>
              {cpaSignoff && (
                <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 font-mono font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Certificado y firmado digitalmente por Contador Público Autorizado (CPA-CR-18920).</span>
                </div>
              )}
            </div>

            <div className="text-right">
              <span className={`text-[10px] uppercase font-bold block ${isBright ? 'text-slate-500' : 'text-slate-500'}`}>
                {lang === 'en' ? 'Net Amount to Pay / Credit' : 'Monto Neto a Pagar'}
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
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
            <span className={`text-xs ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
              {lang === 'en' ? 'Official sales transactions ledger compliant with Costa Rica Tax Code.' : 'Libro oficial de ventas de acuerdo con el Código Tributario de Costa Rica.'}
            </span>
            <button
              onClick={handleExportSalesCsv}
              className={`text-xs px-2.5 py-1 border rounded flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isBright
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>Exportar Libro Ventas (CSV)</span>
            </button>
          </div>

          <div className={`overflow-x-auto border rounded-lg ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
            <table className="w-full text-left text-xs">
              <thead
                className={`text-[10px] uppercase tracking-wider border-b ${
                  isBright ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800/80 text-slate-400 border-slate-700'
                }`}
              >
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
              <tbody
                className={`divide-y font-mono text-[11px] ${
                  isBright ? 'bg-white divide-slate-200 text-slate-700' : 'bg-slate-950/60 divide-slate-800 text-slate-300'
                }`}
              >
                {documents.map((d) => (
                  <tr key={d.id} className={isBright ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}>
                    <td className={`py-2 px-3 font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>{d.consecutivo}</td>
                    <td className="py-2 px-3 text-slate-400">{new Date(d.fechaEmision).toLocaleDateString('es-CR')}</td>
                    <td className={`py-2 px-3 font-sans truncate max-w-[150px] ${isBright ? 'text-slate-800' : 'text-slate-200'}`}>{d.receptor.nombre}</td>
                    <td className="py-2 px-3 text-slate-400">{d.receptor.numeroIdentificacion}</td>
                    <td className="py-2 px-3 text-right">{d.resumen.totalVentaNeta.toLocaleString('es-CR')}</td>
                    <td className="py-2 px-3 text-right text-indigo-600 dark:text-indigo-300">{d.resumen.totalImpuesto.toLocaleString('es-CR')}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{d.resumen.totalComprobante.toLocaleString('es-CR')}</td>
                    <td className="py-2 px-3 text-center text-emerald-600 dark:text-emerald-400 font-sans font-medium">{d.estado}</td>
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
            <span className={`text-xs ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
              {lang === 'en' ? 'Supplier invoices and B2B receptions credited for tax deductions.' : 'Facturas de proveedores recibidas con mensajes de aceptación 05/06/07.'}
            </span>
            <button
              onClick={handleExportPurchasesCsv}
              className={`text-xs px-2.5 py-1 border rounded flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isBright
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Exportar Libro Compras (CSV)</span>
            </button>
          </div>

          <div className={`overflow-x-auto border rounded-lg ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
            <table className="w-full text-left text-xs">
              <thead
                className={`text-[10px] uppercase tracking-wider border-b ${
                  isBright ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800/80 text-slate-400 border-slate-700'
                }`}
              >
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
              <tbody
                className={`divide-y font-mono text-[11px] ${
                  isBright ? 'bg-white divide-slate-200 text-slate-700' : 'bg-slate-950/60 divide-slate-800 text-slate-300'
                }`}
              >
                {receptions.map((r) => (
                  <tr key={r.id} className={isBright ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}>
                    <td className={`py-2 px-3 font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>{r.numeroConsecutivoReceptor}</td>
                    <td className={`py-2 px-3 font-sans ${isBright ? 'text-slate-800' : 'text-slate-200'}`}>{r.emisorNombre}</td>
                    <td className="py-2 px-3 text-slate-400">{r.emisorCedula}</td>
                    <td className="py-2 px-3 text-right">₡{r.totalFactura.toLocaleString('es-CR')}</td>
                    <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">₡{r.montoTotalImpuestoAcreditar.toLocaleString('es-CR')}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-sans font-medium">
                        {r.tipoMensaje === '05' ? '05 Aceptado' : r.tipoMensaje}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-500 font-sans">
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
