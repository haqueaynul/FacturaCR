/**
 * @file src/components/CompanyModal.tsx
 * @description Modal for registering new client companies.
 * Includes complete beginner-friendly form validation with field tooltips and suggestions.
 */

import React, { useState } from 'react';
import {
  X,
  Building2,
  HelpCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { Company, TaxRegime } from '../types';

interface CompanyModalProps {
  lang: Language;
  onRegister: (payload: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  lang,
  onRegister,
  onClose,
  isSubmitting,
}) => {
  const t = translations[lang];

  const [nombre, setNombre] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [cedula, setCedula] = useState('');
  const [tipoCedula, setTipoCedula] = useState<'01' | '02' | '03' | '04'>('02');
  const [codigoActividad, setCodigoActividad] = useState('620101');
  const [regimenTributario, setRegimenTributario] = useState<TaxRegime>('tradicional');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('2200-0000');
  const [sucursal, setSucursal] = useState('001');
  const [puntoVenta, setPuntoVenta] = useState('00001');

  // Active field explanation tooltip
  const [activeHint, setActiveHint] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !cedula.trim() || !correo.trim()) {
      alert(lang === 'en' ? 'Please complete all required fields.' : 'Por favor completa todos los campos requeridos.');
      return;
    }

    const payload = {
      nombre,
      nombreComercial: nombreComercial || nombre,
      cedula: cedula.replace(/\D/g, ''),
      tipoCedula,
      codigoActividad,
      regimenTributario,
      correo,
      telefono,
      sucursal: sucursal.padStart(3, '0'),
      puntoVenta: puntoVenta.padStart(5, '0'),
    };

    await onRegister(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl text-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {lang === 'en' ? 'Register New Client Company' : 'Inscribir Nueva Empresa Cliente'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'en' ? 'Enrolls company for accounting and legal representation.' : 'Inscribe a la empresa para representación contable y legal.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto max-h-[80vh] font-sans text-xs space-y-4">
          {/* Active Hint Banner */}
          {activeHint && (
            <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg text-blue-200 text-xs flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>{activeHint}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {lang === 'en' ? 'Legal Name / Business Name *' : 'Razón Social / Nombre Legal *'}
              </label>
              <input
                type="text"
                required
                value={nombre}
                onFocus={() => setActiveHint(lang === 'en' ? 'Official corporate name as registered in Costa Rica National Registry (Registro Nacional).' : 'Nombre oficial registrado en el Registro Nacional de Costa Rica.')}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="EJEMPLO COSTA RICA S.A."
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {lang === 'en' ? 'Trade / Commercial Name' : 'Nombre Comercial'}
              </label>
              <input
                type="text"
                value={nombreComercial}
                onFocus={() => setActiveHint(lang === 'en' ? 'Commercial brand or store name known by the public.' : 'Nombre de fantasía o marca comercial conocida por el público.')}
                onChange={(e) => setNombreComercial(e.target.value)}
                placeholder="Ejemplo Brand"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {lang === 'en' ? 'Tax ID Type' : 'Tipo Identificación'}
              </label>
              <select
                value={tipoCedula}
                onChange={(e) => setTipoCedula(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="02">02 - Cédula Jurídica</option>
                <option value="01">01 - Cédula Física</option>
                <option value="03">03 - DIMEX</option>
                <option value="04">04 - NITE</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                {lang === 'en' ? 'Tax ID Number (Cédula) *' : 'Número de Cédula Tributaria *'}
              </label>
              <input
                type="text"
                required
                value={cedula}
                onFocus={() => setActiveHint(t.hintCedula)}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="3101XXXXXX (10 dígitos para jurídica)"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {lang === 'en' ? 'Economic Activity Code (6 digits)' : 'Código Actividad Económica (6 dígitos)'}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={codigoActividad}
                onFocus={() => setActiveHint(lang === 'en' ? '6-digit CIIU classification registered at Ministry of Finance (e.g. 620101 Software, 465901 Wholesale, 862001 Health).' : 'Código CIIU de 6 dígitos inscrito ante Tributación (ej: 620101 Software, 862001 Medicina).')}
                onChange={(e) => setCodigoActividad(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {lang === 'en' ? 'Tax Regime' : 'Régimen Tributario'}
              </label>
              <select
                value={regimenTributario}
                onChange={(e) => setRegimenTributario(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="tradicional">Régimen Tradicional (General)</option>
                <option value="simplificado">Régimen de Tributación Simplificada</option>
                <option value="zona_franca">Régimen de Zona Franca (Exento)</option>
                <option value="agropecuario">Régimen Agropecuario</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {lang === 'en' ? 'Official Tax Email *' : 'Correo Electrónico Notificaciones *'}
              </label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="facturas@empresa.cr"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {lang === 'en' ? 'Phone Number' : 'Teléfono'}
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="2234-5678"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-0.5">Sucursal (3d)</label>
              <input
                type="text"
                maxLength={3}
                value={sucursal}
                onChange={(e) => setSucursal(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-0.5">Terminal (5d)</label>
              <input
                type="text"
                maxLength={5}
                value={puntoVenta}
                onChange={(e) => setPuntoVenta(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg shadow-md transition-all flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? (lang === 'en' ? 'Enrolling Company...' : 'Inscribiendo...') : (lang === 'en' ? 'Save & Enroll Company' : 'Guardar e Inscribir')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
