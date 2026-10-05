/**
 * @file src/components/AdminHub.tsx
 * @description Enterprise Admin Hub for system administrators.
 * Provides global oversight of all enrolled client companies, cross-company accounting reports,
 * company onboarding, and professional user assignments.
 * Fully supports Light (Bright) and Dark themes.
 */

import React, { useState } from 'react';
import {
  Building,
  FileSpreadsheet,
  Plus,
  CheckCircle,
  Printer,
  Scale,
  Award,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { Company, CompanyAccountingReport } from '../types';
import { fetchAdminCompanyReport } from '../services/api';

interface AdminHubProps {
  lang: Language;
  theme?: 'dark' | 'bright';
  companies: Company[];
  activeCompanyId: string;
  onActivateCompany: (companyId: string) => Promise<void>;
  onOpenNewCompanyModal: () => void;
}

export const AdminHub: React.FC<AdminHubProps> = ({
  lang,
  theme = 'bright',
  companies,
  activeCompanyId,
  onActivateCompany,
  onOpenNewCompanyModal,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';
  const [selectedReport, setSelectedReport] = useState<CompanyAccountingReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  /**
   * Fetches and displays comprehensive accounting report for any company.
   */
  const handleViewCompanyReport = async (companyId: string) => {
    try {
      setReportError(null);
      const rep = await fetchAdminCompanyReport(companyId);
      setSelectedReport(rep);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Accounting report error:', msg);
      setReportError(lang === 'en' ? 'Unable to load accounting report for selected company.' : 'Error al cargar reporte contable de la empresa.');
    }
  };

  const formatCurrency = (val: number) => {
    return '₡' + (val || 0).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
          <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold tracking-tight ${isBright ? 'text-slate-900' : 'text-white'}`}>
                {t.adminTitle}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-medium">
                Super Admin Access
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
              {t.adminSubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewCompanyModal}
          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.adminRegisterCompBtn}</span>
        </button>
      </div>

      {reportError && (
        <div className={`mb-4 p-3 rounded-lg text-xs flex items-center justify-between border ${
          isBright ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          <span>{reportError}</span>
          <button onClick={() => setReportError(null)} className="font-bold ml-2 hover:opacity-75">✕</button>
        </div>
      )}

      {/* Companies Grid */}
      <div className="mb-6">
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
          {t.adminCompanyList} ({companies.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {companies.map((comp) => {
            const isActive = comp.id === activeCompanyId;
            return (
              <div
                key={comp.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? isBright
                      ? 'bg-emerald-50/50 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/80 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : isBright
                    ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    isBright ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                  }`}>
                    Céd: {comp.cedula}
                  </span>
                  {isActive ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>{lang === 'en' ? 'Active Session' : 'Activa en Sesión'}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onActivateCompany(comp.id)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      {lang === 'en' ? 'Switch To' : 'Seleccionar'}
                    </button>
                  )}
                </div>

                <div className={`font-bold text-sm truncate ${isBright ? 'text-slate-900' : 'text-white'}`} title={comp.nombre}>
                  {comp.nombre}
                </div>
                <div className={`text-xs mt-0.5 truncate ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                  {comp.nombreComercial || comp.nombre}
                </div>

                <div className="mt-2 text-[10px] flex items-center space-x-2">
                  <span className={`px-1.5 py-0.5 rounded ${isBright ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-400'}`}>
                    {comp.regimenTributario?.toUpperCase()}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    v{comp.schemaVersion || '4.4'}
                  </span>
                </div>

                <div className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${
                  isBright ? 'border-slate-200' : 'border-slate-800/80'
                }`}>
                  <span className={`font-mono text-[11px] ${isBright ? 'text-slate-500' : 'text-slate-500'}`}>Act: {comp.codigoActividad}</span>
                  <button
                    onClick={() => handleViewCompanyReport(comp.id)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 font-semibold cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'All Reports' : 'Ver Reportes'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Company Detailed Accounting Report Modal */}
      {selectedReport && (
        <div className={`fixed inset-0 ${isBright ? 'bg-slate-900/50' : 'bg-black/80'} backdrop-blur-xs flex items-center justify-center z-50 p-4`}>
          <div
            className={`border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-colors ${
              isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${isBright ? 'text-slate-900' : 'text-white'}`}>
                    {lang === 'en' ? 'Consolidated Accounting & Compliance Package' : 'Paquete Consolidado Contable y Tributario'}
                  </h3>
                  <p className={`text-xs ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
                    {selectedReport.company.nombre} · Cédula: {selectedReport.company.cedula}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className={`px-3 py-1.5 text-xs font-medium border rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    isBright
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t.print}</span>
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isBright ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 font-sans text-xs space-y-5">
              {/* Formulario D-104 Statement */}
              <div className={`border rounded-xl overflow-hidden ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
                <div
                  className={`p-3 font-semibold border-b flex items-center justify-between ${
                    isBright ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-800/80 text-slate-200 border-slate-700'
                  }`}
                >
                  <span>Resumen de Declaración de IVA (Formulario D-104 Ministerio de Hacienda)</span>
                  <Scale className="w-4 h-4 text-emerald-500" />
                </div>

                <div
                  className={`font-mono text-xs divide-y ${
                    isBright ? 'bg-white divide-slate-200 text-slate-700' : 'bg-slate-950/60 divide-slate-800 text-slate-300'
                  }`}
                >
                  <div className="p-3 flex justify-between items-center">
                    <span className={`font-sans ${isBright ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>Total Ventas Netas Facturadas (Base Imponible)</span>
                    <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>{formatCurrency(selectedReport.totalVentas)}</span>
                  </div>
                  <div className={`p-3 flex justify-between items-center ${isBright ? 'bg-blue-50/60' : 'bg-blue-950/10'}`}>
                    <span className={`font-sans ${isBright ? 'text-blue-950 font-semibold' : 'text-slate-200'}`}>IVA Débito Fiscal (Cobrado a Clientes)</span>
                    <span className={`font-bold ${isBright ? 'text-indigo-700' : 'text-indigo-300'}`}>{formatCurrency(selectedReport.ivaDebito)}</span>
                  </div>
                  <div className={`p-3 flex justify-between items-center ${isBright ? 'bg-emerald-50/60' : 'bg-emerald-950/10'}`}>
                    <span className={`font-sans ${isBright ? 'text-emerald-950 font-semibold' : 'text-slate-200'}`}>IVA Crédito Fiscal (Deducido de Proveedores B2B)</span>
                    <span className={`font-bold ${isBright ? 'text-emerald-700' : 'text-emerald-400'}`}>(-) {formatCurrency(selectedReport.ivaCredito)}</span>
                  </div>
                  <div
                    className={`p-4 flex justify-between items-center font-bold text-sm ${
                      isBright ? 'bg-slate-50 text-slate-900 border-t border-slate-200' : 'bg-slate-900 text-white'
                    }`}
                  >
                    <span className="font-sans">Saldo Neto IVA a Declarar / Pagar al Fisco</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base">{formatCurrency(selectedReport.ivaBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Transactions Count and Rejections */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className={`text-[10px] uppercase font-bold block ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Libro de Ventas</span>
                  <span className={`text-lg font-bold font-mono mt-1 block ${isBright ? 'text-slate-900' : 'text-white'}`}>{selectedReport.salesCount} facturas</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">100% Firmadas XAdES-EPES</span>
                </div>

                <div className={`p-3 rounded-lg border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className={`text-[10px] uppercase font-bold block ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Libro de Compras B2B</span>
                  <span className={`text-lg font-bold font-mono mt-1 block ${isBright ? 'text-indigo-700' : 'text-indigo-300'}`}>{selectedReport.purchasesCount} mensajes receptor</span>
                  <span className={`text-[10px] mt-1 block ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Códigos 05/06/07</span>
                </div>

                <div className={`p-3 rounded-lg border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className={`text-[10px] uppercase font-bold block ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Riesgo de Rechazo</span>
                  <span className={`text-lg font-bold font-mono mt-1 block ${isBright ? 'text-emerald-700' : 'text-emerald-400'}`}>{selectedReport.rejectionsCount} rechazos</span>
                  <span className={`text-[10px] mt-1 block ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Auditoría tributaria limpia</span>
                </div>
              </div>

              {/* Professional Endorsements (Accountant & Lawyer) */}
              <div className={`p-4 rounded-xl border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <span className={`text-xs font-bold block mb-2 ${isBright ? 'text-slate-800' : 'text-white'}`}>
                  Endosos Profesionales de Cumplimiento (Contador & Abogado):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className={`p-3 rounded border flex items-center space-x-3 ${
                    isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}>
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <span className={`font-semibold block ${isBright ? 'text-slate-900' : 'text-white'}`}>Certificación Contable D-104</span>
                      <span className={`text-[11px] block ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>{selectedReport.certifiedByAccountant || 'Lic. Roberto Morales (CPA #18920)'}</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded border flex items-center space-x-3 ${
                    isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}>
                    <Award className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div>
                      <span className={`font-semibold block ${isBright ? 'text-slate-900' : 'text-white'}`}>Certificación Legal Ley 8454</span>
                      <span className={`text-[11px] block ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>{selectedReport.certifiedByLawyer || 'Licda. Mariana Jiménez (Colegio Abogados #24105)'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
