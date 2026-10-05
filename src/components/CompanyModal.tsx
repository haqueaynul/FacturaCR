/**
 * @file src/components/CompanyModal.tsx
 * @description Modal for registering new client companies.
 * Includes complete beginner-friendly form validation with field tooltips and suggestions.
 * Fully supports Light (Bright) and Dark themes.
 */

import React, { useState } from 'react';
import {
  X,
  Building2,
  HelpCircle,
  Save,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { TaxRegime } from '../types';

interface CompanyModalProps {
  lang: Language;
  theme?: 'dark' | 'bright';
  onRegister: (payload: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  lang,
  theme = 'bright',
  onRegister,
  onClose,
  isSubmitting,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';

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
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !cedula.trim() || !correo.trim()) {
      setFormError(lang === 'en' ? 'Please complete all required fields (Name, Tax ID, Email).' : 'Por favor completa todos los campos requeridos (Nombre, Cédula, Correo).');
      return;
    }
    setFormError(null);

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
    <div className={`fixed inset-0 ${isBright ? 'bg-slate-900/50' : 'bg-black/80'} backdrop-blur-xs flex items-center justify-center z-50 p-4`}>
      <div
        className={`border rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl transition-colors ${
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isBright ? 'text-slate-900' : 'text-white'}`}>
                {lang === 'en' ? 'Register New Client Company' : 'Inscribir Nueva Empresa Cliente'}
              </h3>
              <p className={`text-xs ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
                {lang === 'en' ? 'Enrolls company for accounting and legal representation.' : 'Inscribe a la empresa para representación contable y legal.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isBright ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto max-h-[80vh] font-sans text-xs space-y-4">
          {/* Form Error Banner */}
          {formError && (
            <div className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
              isBright
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
            }`}>
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError(null)} className="font-bold ml-2 hover:opacity-75">✕</button>
            </div>
          )}

          {/* Active Hint Banner */}
          {activeHint && (
            <div className={`p-3 rounded-lg text-xs flex items-start space-x-2 border ${
              isBright
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-blue-950/40 border-blue-500/30 text-blue-200'
            }`}>
              <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>{activeHint}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                {lang === 'en' ? 'Legal Name / Business Name *' : 'Razón Social / Nombre Legal *'}
              </label>
              <input
                type="text"
                required
                value={nombre}
                onFocus={() => setActiveHint(lang === 'en' ? 'Official corporate name as registered in Costa Rica National Registry (Registro Nacional).' : 'Nombre oficial registrado en el Registro Nacional de Costa Rica.')}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="EJEMPLO COSTA RICA S.A."
                className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                  isBright
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                {lang === 'en' ? 'Trade / Commercial Name' : 'Nombre Comercial'}
              </label>
              <input
                type="text"
                value={nombreComercial}
                onFocus={() => setActiveHint(lang === 'en' ? 'Commercial brand or store name known by the public.' : 'Nombre de fantasía o marca comercial conocida por el público.')}
                onChange={(e) => setNombreComercial(e.target.value)}
                placeholder="Ejemplo Brand"
                className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                  isBright
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                {lang === 'en' ? 'Tax ID Type' : 'Tipo Identificación'}
              </label>
              <select
                value={tipoCedula}
                onChange={(e) => setTipoCedula(e.target.value as any)}
                className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                  isBright
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="02">02 - Cédula Jurídica</option>
                <option value="01">01 - Cédula Física</option>
                <option value="03">03 - DIMEX</option>
                <option value="04">04 - NITE</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                {lang === 'en' ? 'Tax ID Number (Cédula) *' : 'Número de Cédula Tributaria *'}
              </label>
              <input
                type="text"
                required
                value={cedula}
                onFocus={() => setActiveHint(t.hintCedula)}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="3101XXXXXX (10 dígitos para jurídica)"
                className={`w-full rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none border ${
                  isBright
                    ? 'bg-slate-50 border-slate-300 text-emerald-700 focus:bg-white focus:border-emerald-500 font-semibold'
                    : 'bg-slate-800 border-slate-700 text-emerald-400'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                {lang === 'en' ? 'Economic Activity Code (6 digits)' : 'Código Actividad Económica (6 dígitos)'}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={codigoActividad}
                onFocus={() => setActiveHint(lang === 'en' ? '6-digit CIIU classification registered at Ministry of Finance (e.g. 620101 Software, 465901 Wholesale, 862001 Health).' : 'Código CIIU de 6 dígitos inscrito ante Tributación (ej: 620101 Software, 862001 Medicina).')}
                onChange={(e) => setCodigoActividad(e.target.value)}
                className={`w-full rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none border ${
                  isBright
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                {lang === 'en' ? 'Tax Regime' : 'Régimen Tributario'}
              </label>
              <select
                value={regimenTributario}
                onChange={(e) => setRegimenTributario(e.target.value as any)}
                className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                  isBright
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="tradicional">{t.cfgRegimeTraditional}</option>
                <option value="simplificado">{t.cfgRegimeSimplified}</option>
                <option value="zona_franca">{t.cfgRegimeFreeZone}</option>
                <option value="agropecuario">{t.cfgRegimeAgro}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                {lang === 'en' ? 'Official Tax Email *' : 'Correo Electrónico Notificaciones *'}
              </label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="facturas@empresa.cr"
                className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                  isBright
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                {lang === 'en' ? 'Phone Number' : 'Teléfono'}
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="2234-5678"
                className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                  isBright
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div
            className={`grid grid-cols-2 gap-3 p-3 rounded-lg border ${
              isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div>
              <label className={`block mb-0.5 ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                {lang === 'en' ? 'Branch (3 digits)' : 'Sucursal (3d)'}
              </label>
              <input
                type="text"
                maxLength={3}
                value={sucursal}
                onChange={(e) => setSucursal(e.target.value)}
                className={`w-full rounded px-2 py-1 text-xs font-mono focus:outline-none border ${
                  isBright
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block mb-0.5 ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                {lang === 'en' ? 'Terminal (5 digits)' : 'Terminal (5d)'}
              </label>
              <input
                type="text"
                maxLength={5}
                value={puntoVenta}
                onChange={(e) => setPuntoVenta(e.target.value)}
                className={`w-full rounded px-2 py-1 text-xs font-mono focus:outline-none border ${
                  isBright
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className={`flex justify-end pt-3 border-t ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
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
