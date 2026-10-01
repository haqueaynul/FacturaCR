/**
 * @file src/components/SandboxSettingsModal.tsx
 * @description Configuration modal for Ministerio de Hacienda Sandbox credentials,
 * PKCS#12 cryptographic certificates, AES-256-GCM encrypted vault, and test scenario triggering.
 */

import React, { useState } from 'react';
import {
  X,
  Shield,
  Key,
  Lock,
  Server,
  Upload,
  CheckCircle,
  HelpCircle,
  Save,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TaxpayerConfig } from '../types';

interface SandboxSettingsModalProps {
  taxpayer: TaxpayerConfig | null;
  onSave: (updated: Partial<TaxpayerConfig> & { atvPassword?: string; pinP12?: string; p12CertificateBase64?: string }) => Promise<void>;
  onTriggerScenario: (scenarioKey: string) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}

/**
 * Settings modal for sandbox environment, cryptographic certificate, and test regimes.
 */
export const SandboxSettingsModal: React.FC<SandboxSettingsModalProps> = ({
  taxpayer,
  onSave,
  onTriggerScenario,
  onClose,
  isSaving,
}) => {
  const [activeTab, setActiveTab] = useState<'hacienda' | 'scenarios' | 'vault'>('hacienda');

  // Form state
  const [cedula, setCedula] = useState(taxpayer?.cedula || '3101123456');
  const [tipoCedula, setTipoCedula] = useState(taxpayer?.tipoCedula || '02');
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
        // Strip data: prefix if present
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
    const payload: any = {
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Configuración del Sandbox Ministerio de Hacienda & Bóveda Criptográfica
              </h3>
              <p className="text-xs text-slate-400">
                Parámetros oficiales de conexión ATV, llave criptográfica .p12 y escenarios tributarios.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="px-4 border-b border-slate-800 flex space-x-4 bg-slate-900/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('hacienda')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'hacienda'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Credenciales Sandbox & Certificado .p12</span>
          </button>

          <button
            onClick={() => setActiveTab('scenarios')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'scenarios'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Escenarios Tributarios Preconfigurados</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'vault'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Seguridad Bóveda AES-256-GCM</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 font-sans text-xs">
          {activeTab === 'hacienda' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Version Selector: v4.3 vs v4.4 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Versión de Factura Electrónica (Ministerio de Hacienda)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setSchemaVersion('4.4')}
                    className={`cursor-pointer p-3 rounded-lg border transition-all ${
                      schemaVersion === '4.4'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">Versión 4.4 (TRIBU-CR / Vigente)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Recomendado</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Esquemas XML v4.4, Recibo Electrónico de Pago (REP), soporte dedicado para SINPE Móvil, y desglose de "No Sujeto" vs "Exento".
                    </p>
                  </div>

                  <div
                    onClick={() => setSchemaVersion('4.3')}
                    className={`cursor-pointer p-3 rounded-lg border transition-all ${
                      schemaVersion === '4.3'
                        ? 'bg-blue-500/10 border-blue-500/50 text-white'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-400">Versión 4.3 (Estándar Previo / ATV)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Legacy</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Esquemas XML v4.3 (Resolución DGT-R-033-2019), Factura tradicional, Notas de Crédito/Débito y Tiquetes sin REP.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sandbox Mode Selector */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Modalidad de Sandbox Tributario
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setUseLiveSandbox(false)}
                    className={`cursor-pointer p-3 rounded-lg border transition-all ${
                      !useLiveSandbox
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold text-emerald-400 flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4" />
                      <span>Sandbox Simulador Inteligente</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Emula 100% de la API de Hacienda v4.3, valida firmas XAdES-EPES, genera RespuestaHacienda oficial, y permite probar de inmediato sin esperar credenciales ATV.
                    </p>
                  </div>

                  <div
                    onClick={() => setUseLiveSandbox(true)}
                    className={`cursor-pointer p-3 rounded-lg border transition-all ${
                      useLiveSandbox
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold text-amber-400 flex items-center space-x-1.5">
                      <Server className="w-4 h-4" />
                      <span>Sandbox en Vivo ATV (Staging)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Conecta vía proxy a <code>idp.comprobanteselectronicos.go.cr</code> y <code>api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/</code> con tus credenciales reales.
                    </p>
                  </div>
                </div>
              </div>

              {/* Taxpayer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nombre / Razón Social Contribuyente</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Cédula del Emisor</label>
                  <input
                    type="text"
                    required
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Código de Actividad Económica (6 dígitos)</label>
                  <input
                    type="text"
                    required
                    value={codigoActividad}
                    onChange={(e) => setCodigoActividad(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Régimen Tributario</label>
                  <select
                    value={regimenTributario}
                    onChange={(e) => setRegimenTributario(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="tradicional">Régimen Tradicional (General)</option>
                    <option value="simplificado">Régimen de Tributación Simplificada</option>
                    <option value="zona_franca">Régimen de Zona Franca</option>
                    <option value="agropecuario">Régimen Agropecuario</option>
                  </select>
                </div>
              </div>

              {/* ATV Sandbox Credentials */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Credenciales de API ATV (Ministerio de Hacienda)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Usuario ATV (IDP Stag)</label>
                    <input
                      type="text"
                      value={atvUsername}
                      onChange={(e) => setAtvUsername(e.target.value)}
                      placeholder="cpf-02-3101-123456@stag.comprobanteselectronicos.go.cr"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Contraseña API ATV</label>
                    <input
                      type="password"
                      value={atvPassword}
                      onChange={(e) => setAtvPassword(e.target.value)}
                      placeholder={taxpayer?.hasPassword ? '•••••••••••• (Cifrada en bóveda)' : 'Ingresa contraseña API'}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* .p12 Cryptographic Certificate */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-semibold">Certificado Criptográfico PKCS#12 (.p12)</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Firma XAdES-EPES v4.3
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">PIN de la Llave Criptográfica</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={pinP12}
                        onChange={(e) => setPinP12(e.target.value)}
                        placeholder="PIN de 4 dígitos (ej: 1234)"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Subir Archivo .p12</label>
                      <label className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded cursor-pointer transition-colors text-slate-300">
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="truncate">{p12FileName || 'Seleccionar .p12 oficial'}</span>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando en Bóveda...' : 'Guardar y Asegurar en Bóveda'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'scenarios' && (
            <div className="space-y-3">
              <p className="text-slate-400 mb-2">
                Ejecuta con un clic los escenarios de prueba oficiales requeridos por el Ministerio de Hacienda para certificar sistemas de facturación:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Scenario 1 */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-white">1. Venta General 13% IVA</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Régimen Tradicional, factura estándar con IVA general (Tarifa 08).
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('standard_sale_13'); onClose(); }}
                    className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold shrink-0 ml-2"
                  >
                    Probar
                  </button>
                </div>

                {/* Scenario 2 */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-white">2. Servicios de Salud 4% IVA</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tarifa Reducida según Art. 26 Ley 9635 para servicios médicos.
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('health_services_4'); onClose(); }}
                    className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold shrink-0 ml-2"
                  >
                    Probar
                  </button>
                </div>

                {/* Scenario 3 */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-white">3. Servicios de Turismo 8% IVA</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tarifa Transitoria Ley 9882 para hospedaje y agencias registradas ante ICT.
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('tourism_services_8'); onClose(); }}
                    className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold shrink-0 ml-2"
                  >
                    Probar
                  </button>
                </div>

                {/* Scenario 4 */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-white">4. Factura Exportación (FEE 09)</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Servicios exportados en USD, tarifa 0% Exento a cliente no residente.
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('export_invoice_fee'); onClose(); }}
                    className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 rounded text-[11px] font-semibold shrink-0 ml-2"
                  >
                    Probar
                  </button>
                </div>

                {/* Scenario 5 */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-white">5. Factura de Compra (FEC 08)</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Compra a proveedor en Régimen de Tributación Simplificada.
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('simplified_regime_fec'); onClose(); }}
                    className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-semibold shrink-0 ml-2"
                  >
                    Probar
                  </button>
                </div>

                {/* Scenario 6 - Error Testing: Duplicate Clave */}
                <div className="bg-slate-950 p-3 rounded-lg border border-rose-900/40 flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-rose-300">6. Prueba Clave Duplicada (Rechazo)</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Simula rechazo 400 de Hacienda por clave previamente registrada.
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('test_duplicate_clave'); onClose(); }}
                    className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 rounded text-[11px] font-semibold shrink-0 ml-2"
                  >
                    Probar
                  </button>
                </div>

                {/* Scenario 7 - Error Testing: Corrupt Signature */}
                <div className="bg-slate-950 p-3 rounded-lg border border-rose-900/40 flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-rose-300">7. Prueba Firma Inválida (Rechazo)</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Simula rechazo por certificado no autorizado o digest corrupto.
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('test_signature_failure'); onClose(); }}
                    className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 rounded text-[11px] font-semibold shrink-0 ml-2"
                  >
                    Probar
                  </button>
                </div>

                {/* Scenario 8 - Transient Failure & Exponential Retry */}
                <div className="bg-slate-950 p-3 rounded-lg border border-amber-900/40 flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-amber-300">8. Prueba Caída 503 & Reintento</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Simula caída transitoria HTTP 503 y activa cola de reintentos exponenciales.
                    </p>
                  </div>
                  <button
                    onClick={() => { onTriggerScenario('test_network_503_retry'); onClose(); }}
                    className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 rounded text-[11px] font-semibold shrink-0 ml-2"
                  >
                    Probar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <Shield className="w-4 h-4" />
                  <span>Bóveda de Seguridad Criptográfica y Registros Financieros</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Para cumplir con la directriz de seguridad de datos tributarios, todos los registros financieros, certificados PKCS#12, llaves privadas y credenciales del Ministerio de Hacienda se resguardan mediante cifrado autenticado <strong>AES-256-GCM</strong> con derivación PBKDF2 y vectores de inicialización (IV) criptográficamente seguros por cada transacción.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Algoritmo Bóveda</span>
                    <span className="font-bold text-white">AES-256-GCM</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Firma Digital</span>
                    <span className="font-bold text-emerald-400">XAdES-EPES RSA-SHA256</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Enmascaramiento</span>
                    <span className="font-bold text-blue-400">Activo en Auditoría</span>
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
