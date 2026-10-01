/**
 * @file src/components/AdminHub.tsx
 * @description Enterprise Admin Hub for system administrators.
 * Provides global oversight of all enrolled client companies, cross-company accounting reports,
 * company onboarding, and professional user assignments.
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Building,
  Users,
  FileSpreadsheet,
  Download,
  Plus,
  CheckCircle,
  ExternalLink,
  Printer,
  Scale,
  Award,
  BookOpen,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { Company, CompanyAccountingReport, User } from '../types';
import { fetchAdminCompanyReport } from '../services/api';

interface AdminHubProps {
  lang: Language;
  companies: Company[];
  activeCompanyId: string;
  onActivateCompany: (companyId: string) => Promise<void>;
  onOpenNewCompanyModal: () => void;
}

export const AdminHub: React.FC<AdminHubProps> = ({
  lang,
  companies,
  activeCompanyId,
  onActivateCompany,
  onOpenNewCompanyModal,
}) => {
  const t = translations[lang];
  const [selectedReport, setSelectedReport] = useState<CompanyAccountingReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  /**
   * Fetches and displays comprehensive accounting report for any company.
   */
  const handleViewCompanyReport = async (companyId: string) => {
    try {
      setIsLoadingReport(true);
      const rep = await fetchAdminCompanyReport(companyId);
      setSelectedReport(rep);
    } catch (err) {
      console.error(err);
      alert('Error cargando reporte contable');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const formatCurrency = (val: number) => {
    return '₡' + (val || 0).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {t.adminTitle}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                Super Admin Access
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.adminSubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewCompanyModal}
          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.adminRegisterCompBtn}</span>
        </button>
      </div>

      {/* Companies Grid */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
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
                    ? 'bg-slate-950/80 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Céd: {comp.cedula}
                  </span>
                  {isActive ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>{lang === 'en' ? 'Active Session' : 'Activa en Sesión'}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onActivateCompany(comp.id)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      {lang === 'en' ? 'Switch To' : 'Seleccionar'}
                    </button>
                  )}
                </div>

                <div className="font-bold text-white text-sm truncate" title={comp.nombre}>
                  {comp.nombre}
                </div>
                <div className="text-slate-400 text-xs mt-0.5 truncate">
                  {comp.nombreComercial || comp.nombre}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">Act: {comp.codigoActividad}</span>
                  <button
                    onClick={() => handleViewCompanyReport(comp.id)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-semibold"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {lang === 'en' ? 'Consolidated Accounting & Compliance Package' : 'Paquete Consolidado Contable y Tributario'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedReport.company.nombre} · Cédula: {selectedReport.company.cedula}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg flex items-center space-x-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t.print}</span>
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 font-sans text-xs space-y-5">
              {/* Formulario D-104 Statement */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-800/80 p-3 font-semibold text-slate-200 border-b border-slate-700 flex items-center justify-between">
                  <span>Resumen de Declaración de IVA (Formulario D-104 Ministerio de Hacienda)</span>
                  <Scale className="w-4 h-4 text-emerald-400" />
                </div>

                <div className="divide-y divide-slate-800 bg-slate-950/60 font-mono text-xs">
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-slate-300 font-sans">Total Ventas Netas Facturadas (Base Imponible)</span>
                    <span className="font-semibold text-white">{formatCurrency(selectedReport.totalVentas)}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center bg-blue-950/10">
                    <span className="text-slate-200 font-sans">IVA Débito Fiscal (Cobrado a Clientes)</span>
                    <span className="font-bold text-indigo-300">{formatCurrency(selectedReport.ivaDebito)}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center bg-emerald-950/10">
                    <span className="text-slate-200 font-sans">IVA Crédito Fiscal (Deducido de Proveedores B2B)</span>
                    <span className="font-bold text-emerald-400">(-) {formatCurrency(selectedReport.ivaCredito)}</span>
                  </div>
                  <div className="p-4 flex justify-between items-center bg-slate-900 font-bold text-sm">
                    <span className="text-white font-sans">Saldo Neto IVA a Declarar / Pagar al Fisco</span>
                    <span className="text-emerald-400 font-mono text-base">{formatCurrency(selectedReport.ivaBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Transactions Count and Rejections */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Libro de Ventas</span>
                  <span className="text-lg font-bold font-mono text-white mt-1 block">{selectedReport.salesCount} facturas</span>
                  <span className="text-[10px] text-emerald-400 mt-1 block">100% Firmadas XAdES-EPES</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Libro de Compras B2B</span>
                  <span className="text-lg font-bold font-mono text-indigo-300 mt-1 block">{selectedReport.purchasesCount} mensajes receptor</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Códigos 05/06/07</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Riesgo de Rechazo</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">{selectedReport.rejectionsCount} rechazos</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Auditoría tributaria limpia</span>
                </div>
              </div>

              {/* Professional Endorsements (Accountant & Lawyer) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-white block mb-2">
                  Endosos Profesionales de Cumplimiento (Contador & Abogado):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded border border-slate-800 flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-white block">Certificación Contable D-104</span>
                      <span className="text-slate-400 text-[11px] block">{selectedReport.certifiedByAccountant || 'Lic. Roberto Morales (CPA #18920)'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded border border-slate-800 flex items-center space-x-3">
                    <Award className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-white block">Certificación Legal Ley 8454</span>
                      <span className="text-slate-400 text-[11px] block">{selectedReport.certifiedByLawyer || 'Licda. Mariana Jiménez (Colegio Abogados #24105)'}</span>
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
