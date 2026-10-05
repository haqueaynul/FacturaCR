/**
 * @file src/components/SandboxSettingsModal.tsx
 * @description Configuration modal for Ministerio de Hacienda Sandbox credentials,
 * PKCS#12 cryptographic certificates, AES-256-GCM encrypted vault, and test scenario triggering.
 * Fully internationalized (EN / ES) with dark and bright theme support.
 */

import React, { useState } from 'react';
import {
  X,
  Shield,
  Key,
  Server,
  Upload,
  Save,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { Company } from '../types';

interface SandboxSettingsModalProps {
  lang: Language;
  theme: 'dark' | 'bright';
  taxpayer: Company | null;
  onSave: (updated: Partial<Company> & { atvPassword?: string; pinP12?: string; p12CertificateBase64?: string }) => Promise<void>;
  onTriggerScenario: (scenarioKey: string) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}

/**
 * Settings modal for sandbox environment, cryptographic certificate, and test regimes.
 */
export const SandboxSettingsModal: React.FC<SandboxSettingsModalProps> = ({
  lang,
  theme,
  taxpayer,
  onSave,
  onTriggerScenario,
  onClose,
  isSaving,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';
  const [activeTab, setActiveTab] = useState<'hacienda' | 'scenarios' | 'vault'>('hacienda');

  // Form state
  const [cedula, setCedula] = useState(taxpayer?.cedula || '3101123456');
  const [tipoCedula] = useState(taxpayer?.tipoCedula || '02');
  const [nombre, setNombre] = useState(taxpayer?.nombre || 'SERVICIOS TECNOLÓGICOS DEL VALLE S.A.');
  const [correo, setCorreo] = useState(taxpayer?.correo || 'facturacion@techvalle.cr');
  const [codigoActividad, setCodigoActividad] = useState(taxpayer?.codigoActividad || '620101');
  const [regimenTributario, setRegimenTributario] = useState(taxpayer?.regimenTributario || 'tradicional');
  const [sucursal, setSucursal] = useState(taxpayer?.sucursal || '001');
  const [puntoVenta, setPuntoVenta] = useState(taxpayer?.puntoVenta || '00001');

  // ATV Sandbox Credentials
  const [atvUsername, setAtvUsername] = useState(taxpayer?.atvUsername || 'cpf-02-3101-123456@stag.comprobanteselectronicos.go.cr');
  const [atvPassword, setAtvPassword] = useState('');
  const [pinP12, setPinP12] = useState('');
  const [p12FileName, setP12FileName] = useState<string | null>(null);
  const [p12Base64, setP12Base64] = useState<string | null>(null);
  const [useLiveSandbox, setUseLiveSandbox] = useState<boolean>(taxpayer?.useLiveSandbox || false);
  const [schemaVersion, setSchemaVersion] = useState<'4.3' | '4.4'>(taxpayer?.schemaVersion || '4.4');

  /**
   * Handles user file upload for .p12 cryptographic certificate.
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setP12FileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        setP12Base64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Saves settings to backend AES-256-GCM encrypted vault.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Company> & { atvPassword?: string; pinP12?: string; p12CertificateBase64?: string } = {
      cedula,
      tipoCedula,
      nombre,
      correo,
      codigoActividad,
      regimenTributario,
      sucursal,
      puntoVenta,
      atvUsername,
      useLiveSandbox,
      schemaVersion,
    };
    if (atvPassword) payload.atvPassword = atvPassword;
    if (pinP12) payload.pinP12 = pinP12;
    if (p12Base64) payload.p12CertificateBase64 = p12Base64;

    await onSave(payload);
    onClose();
  };

  return (
    <div className={`fixed inset-0 ${isBright ? 'bg-slate-900/50' : 'bg-black/80'} backdrop-blur-xs flex items-center justify-center z-50 p-4`}>
      <div
        className={`border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-colors ${
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
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isBright ? 'text-slate-900' : 'text-white'}`}>
                {t.cfgModalTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {t.cfgModalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isBright ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div
          className={`px-4 border-b flex space-x-4 text-xs font-semibold ${
            isBright ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <button
            onClick={() => setActiveTab('hacienda')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'hacienda'
                ? 'border-emerald-400 text-emerald-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{t.cfgTabHacienda}</span>
          </button>

          <button
            onClick={() => setActiveTab('scenarios')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'scenarios'
                ? 'border-emerald-400 text-emerald-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.cfgTabScenarios}</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'vault'
                ? 'border-emerald-400 text-emerald-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.cfgTabVault}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 font-sans text-xs">
          {activeTab === 'hacienda' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Version Selector: v4.3 vs v4.4 */}
              <div className={`p-4 rounded-xl border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                  {t.cfgVersionTitle}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setSchemaVersion('4.4')}
                    className={`cursor-pointer p-3 rounded-lg border transition-all ${
                      schemaVersion === '4.4'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                        : isBright ? 'bg-white border-slate-300 text-slate-600 hover:border-slate-400' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-500">{t.cfgV44Title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-semibold">{t.cfgV44Badge}</span>
                    </div>
                    <p className={`text-[11px] mt-1 ${isBright ? 'text-slate-600' : 'text-slate-300'}`}>
                      {t.cfgV44Desc}
                    </p>
                  </div>

                  <div
                    onClick={() => setSchemaVersion('4.3')}
                    className={`cursor-pointer p-3 rounded-lg border transition-all ${
                      schemaVersion === '4.3'
                        ? 'bg-blue-500/10 border-blue-500/50 text-white'
                        : isBright ? 'bg-white border-slate-300 text-slate-600 hover:border-slate-400' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-500">{t.cfgV43Title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-semibold">{t.cfgV43Badge}</span>
                    </div>
                    <p className={`text-[11px] mt-1 ${isBright ? 'text-slate-600' : 'text-slate-300'}`}>
                      {t.cfgV43Desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sandbox Mode Selector */}
              <div className={`p-4 rounded-xl border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                  {t.cfgSandboxModeTitle}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setUseLiveSandbox(false)}
                    className={`cursor-pointer p-3 rounded-lg border transition-all ${
                      !useLiveSandbox
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                        : isBright ? 'bg-white border-slate-300 text-slate-600 hover:border-slate-400' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold text-emerald-500 flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4" />
                      <span>{t.cfgSimTitle}</span>
                    </div>
                    <p className={`text-[11px] mt-1 ${isBright ? 'text-slate-600' : 'text-slate-300'}`}>
                      {t.cfgSimDesc}
                    </p>
                  </div>

                  <div
                    onClick={() => setUseLiveSandbox(true)}
                    className={`cursor-pointer p-3 rounded-lg border transition-all ${
                      useLiveSandbox
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : isBright ? 'bg-white border-slate-300 text-slate-600 hover:border-slate-400' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold text-amber-500 flex items-center space-x-1.5">
                      <Server className="w-4 h-4" />
                      <span>{t.cfgLiveTitle}</span>
                    </div>
                    <p className={`text-[11px] mt-1 ${isBright ? 'text-slate-600' : 'text-slate-300'}`}>
                      {t.cfgLiveDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Taxpayer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 ${isBright ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{t.cfgTaxpayerName}</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                      isBright ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 ${isBright ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{t.cfgTaxpayerId}</label>
                  <input
                    type="text"
                    required
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className={`w-full rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none border ${
                      isBright ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 ${isBright ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{t.cfgEconomicCode}</label>
                  <input
                    type="text"
                    required
                    value={codigoActividad}
                    onChange={(e) => setCodigoActividad(e.target.value)}
                    className={`w-full rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none border ${
                      isBright ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 ${isBright ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{t.cfgTaxRegime}</label>
                  <select
                    value={regimenTributario}
                    onChange={(e) => setRegimenTributario(e.target.value as any)}
                    className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                      isBright ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="tradicional">{t.cfgRegimeTraditional}</option>
                    <option value="simplificado">{t.cfgRegimeSimplified}</option>
                    <option value="zona_franca">{t.cfgRegimeFreeZone}</option>
                    <option value="agropecuario">{t.cfgRegimeAgro}</option>
                  </select>
                </div>
              </div>

              {/* ATV Sandbox Credentials */}
              <div className={`p-4 rounded-xl border space-y-3 ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider block ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                  {t.cfgAtvTitle}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block mb-1 ${isBright ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{t.cfgAtvUsername}</label>
                    <input
                      type="text"
                      value={atvUsername}
                      onChange={(e) => setAtvUsername(e.target.value)}
                      placeholder="cpf-02-3101-123456@stag.comprobanteselectronicos.go.cr"
                      className={`w-full rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none border ${
                        isBright ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block mb-1 ${isBright ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{t.cfgAtvPassword}</label>
                    <input
                      type="password"
                      value={atvPassword}
                      onChange={(e) => setAtvPassword(e.target.value)}
                      placeholder={taxpayer?.hasPassword ? t.cfgAtvEncryptedPass : t.cfgAtvEnterPass}
                      className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                        isBright ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* .p12 Cryptographic Certificate */}
                <div className={`pt-2 border-t ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${isBright ? 'text-slate-800' : 'text-slate-300'}`}>{t.cfgP12Title}</span>
                    <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                      {t.cfgP12Badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block mb-1 ${isBright ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{t.cfgP12Pin}</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={pinP12}
                        onChange={(e) => setPinP12(e.target.value)}
                        placeholder={t.cfgP12PinPlaceholder}
                        className={`w-full rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none border ${
                          isBright ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block mb-1 ${isBright ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{t.cfgP12Upload}</label>
                      <label className={`flex items-center justify-center space-x-2 px-3 py-1.5 rounded cursor-pointer transition-colors border ${
                        isBright ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      }`}>
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="truncate">{p12FileName || t.cfgP12SelectFile}</span>
                        <input type="file" accept=".p12,.pfx" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? t.cfgBtnSaving : t.cfgBtnSave}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'scenarios' && (
            <div className="space-y-3">
              <p className="text-slate-400 mb-2">
                {t.cfgScenariosDesc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Scenario 1 */}
                <div className={`p-3 rounded-lg border flex items-start justify-between ${
                  isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div>
                    <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>{t.cfgScen1Title}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.cfgScen1Desc}
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('standard_sale_13'); onClose(); }}
                    className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-semibold shrink-0 ml-2 cursor-pointer"
                  >
                    {t.cfgBtnTest}
                  </button>
                </div>

                {/* Scenario 2 */}
                <div className={`p-3 rounded-lg border flex items-start justify-between ${
                  isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div>
                    <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>{t.cfgScen2Title}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.cfgScen2Desc}
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('health_services_4'); onClose(); }}
                    className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-semibold shrink-0 ml-2 cursor-pointer"
                  >
                    {t.cfgBtnTest}
                  </button>
                </div>

                {/* Scenario 3 */}
                <div className={`p-3 rounded-lg border flex items-start justify-between ${
                  isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div>
                    <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>{t.cfgScen3Title}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.cfgScen3Desc}
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('tourism_services_8'); onClose(); }}
                    className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-semibold shrink-0 ml-2 cursor-pointer"
                  >
                    {t.cfgBtnTest}
                  </button>
                </div>

                {/* Scenario 4 */}
                <div className={`p-3 rounded-lg border flex items-start justify-between ${
                  isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div>
                    <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>{t.cfgScen4Title}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.cfgScen4Desc}
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('export_invoice_fee'); onClose(); }}
                    className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 border border-blue-500/30 rounded text-[11px] font-semibold shrink-0 ml-2 cursor-pointer"
                  >
                    {t.cfgBtnTest}
                  </button>
                </div>

                {/* Scenario 5 */}
                <div className={`p-3 rounded-lg border flex items-start justify-between ${
                  isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div>
                    <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>{t.cfgScen5Title}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.cfgScen5Desc}
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('simplified_regime_fec'); onClose(); }}
                    className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-400 border border-indigo-500/30 rounded text-[11px] font-semibold shrink-0 ml-2 cursor-pointer"
                  >
                    {t.cfgBtnTest}
                  </button>
                </div>

                {/* Scenario 6 - Error Testing: Duplicate Clave */}
                <div className={`p-3 rounded-lg border flex items-start justify-between ${
                  isBright ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-950 border-rose-900/40'
                }`}>
                  <div>
                    <span className="font-semibold text-rose-500">{t.cfgScen6Title}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.cfgScen6Desc}
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('test_duplicate_clave'); onClose(); }}
                    className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold shrink-0 ml-2 cursor-pointer"
                  >
                    {t.cfgBtnTest}
                  </button>
                </div>

                {/* Scenario 7 - Error Testing: Corrupt Signature */}
                <div className={`p-3 rounded-lg border flex items-start justify-between ${
                  isBright ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-950 border-rose-900/40'
                }`}>
                  <div>
                    <span className="font-semibold text-rose-500">{t.cfgScen7Title}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.cfgScen7Desc}
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('test_signature_failure'); onClose(); }}
                    className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold shrink-0 ml-2 cursor-pointer"
                  >
                    {t.cfgBtnTest}
                  </button>
                </div>

                {/* Scenario 8 - Transient Failure & Exponential Retry */}
                <div className={`p-3 rounded-lg border flex items-start justify-between ${
                  isBright ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-950 border-amber-900/40'
                }`}>
                  <div>
                    <span className="font-semibold text-amber-500">{t.cfgScen8Title}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.cfgScen8Desc}
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('test_network_503_retry'); onClose(); }}
                    className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-400 border border-amber-500/30 rounded text-[11px] font-semibold shrink-0 ml-2 cursor-pointer"
                  >
                    {t.cfgBtnTest}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border space-y-3 ${
                isBright ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                <div className="flex items-center space-x-2 text-emerald-500 font-semibold">
                  <Shield className="w-4 h-4" />
                  <span>{t.cfgVaultTitle}</span>
                </div>
                <p className="leading-relaxed">
                  {t.cfgVaultDesc}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
                  <div className={`p-2.5 rounded border ${isBright ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <span className="text-[10px] text-slate-400 block">{t.cfgVaultAlgo}</span>
                    <span className={`font-bold ${isBright ? 'text-slate-900' : 'text-white'}`}>AES-256-GCM</span>
                  </div>
                  <div className={`p-2.5 rounded border ${isBright ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <span className="text-[10px] text-slate-400 block">{t.cfgVaultSig}</span>
                    <span className="font-bold text-emerald-500">XAdES-EPES RSA-SHA256</span>
                  </div>
                  <div className={`p-2.5 rounded border ${isBright ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <span className="text-[10px] text-slate-400 block">{t.cfgVaultMasking}</span>
                    <span className="font-bold text-blue-500">{t.cfgVaultMaskingActive}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
