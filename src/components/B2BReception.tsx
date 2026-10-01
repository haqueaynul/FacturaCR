/**
 * @file src/components/B2BReception.tsx
 * @description Step 5: B2B Acceptance / Rejection (Recepción de Comprobantes - Mensaje Receptor v4.3).
 * Fully supports multi-language (EN / ES), dark/bright theme, and beginner guidance.
 */

import React, { useState } from 'react';
import {
  Inbox,
  CheckCircle,
  Hash,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { ReceptionDocument } from '../types';

interface B2BReceptionProps {
  lang: Language;
  theme: 'dark' | 'bright';
  receptions: ReceptionDocument[];
  onSubmitReception: (payload: Record<string, unknown>) => Promise<void>;
  isSubmitting: boolean;
}

export const B2BReception: React.FC<B2BReceptionProps> = ({
  lang,
  theme,
  receptions,
  onSubmitReception,
  isSubmitting,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';

  const [claveDocumento, setClaveDocumento] = useState('');
  const [emisorNombre, setEmisorNombre] = useState('INSTITUTO COSTARRICENSE DE ELECTRICIDAD (ICE)');
  const [emisorCedula, setEmisorCedula] = useState('4000042139');
  const [montoTotalImpuesto, setMontoTotalImpuesto] = useState(13000);
  const [totalFactura, setTotalFactura] = useState(113000);
  const [tipoMensaje, setTipoMensaje] = useState<'05' | '06' | '07'>('05');
  const [detalleMensaje, setDetalleMensaje] = useState('Servicios de telecomunicaciones y energía aceptados con crédito pleno.');
  const [condicionImpuesto, setCondicionImpuesto] = useState<'01' | '02' | '03' | '04' | '05'>('01');
  const [montoCredito, setMontoCredito] = useState(13000);

  const [activeHint, setActiveHint] = useState<string | null>(t.hintB2BMensaje);

  const handleFillSampleClave = () => {
    const day = String(new Date().getDate()).padStart(2, '0');
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const year = String(new Date().getFullYear()).slice(-2);
    const mockClave = `506${day}${month}${year}00400004213900100001010000008899187654321`;
    setClaveDocumento(mockClave);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claveDocumento || claveDocumento.length !== 50) {
      alert(lang === 'en' ? 'Supplier invoice 50-digit clave must be exactly 50 digits.' : 'La clave del comprobante debe ser exactamente de 50 dígitos.');
      return;
    }

    const payload = {
      claveDocumento,
      emisorNombre,
      emisorCedula,
      montoTotalImpuesto,
      totalFactura,
      tipoMensaje,
      detalleMensaje,
      condicionImpuesto,
      montoTotalImpuestoAcreditar: condicionImpuesto === '04' ? 0 : montoCredito,
    };

    await onSubmitReception(payload);
    setClaveDocumento('');
  };

  return (
    <div className={`${isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'} border rounded-xl p-5 shadow-sm mb-8 transition-colors`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b ${isBright ? 'border-slate-100' : 'border-slate-800'} gap-3`}>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold tracking-tight ${isBright ? 'text-slate-900' : 'text-white'}`}>
              {t.b2bTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {t.b2bSubtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFillSampleClave}
          className={`text-xs px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-colors self-start sm:self-auto ${
            isBright ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-800 border-indigo-500/30 text-indigo-300 hover:bg-slate-700'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>{t.b2bSampleBtn}</span>
        </button>
      </div>

      {/* Beginner Tooltip */}
      {activeHint && (
        <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 text-xs flex items-start space-x-2.5">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>{activeHint}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              {t.b2bClaveInput}
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={claveDocumento}
              onFocus={() => setActiveHint(t.hintClave50)}
              onChange={(e) => setClaveDocumento(e.target.value.replace(/\D/g, ''))}
              placeholder="506DDMMAAYYYYYYYYYYYY001000010100000000011XXXXXXXX"
              className={`w-full rounded-lg px-3 py-2 text-xs font-mono border focus:outline-none ${
                isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-emerald-400'
              }`}
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {claveDocumento.length} / 50 dígitos
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              {t.b2bDecision}
            </label>
            <select
              value={tipoMensaje}
              onFocus={() => setActiveHint(t.hintB2BMensaje)}
              onChange={(e) => setTipoMensaje(e.target.value as any)}
              className={`w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none ${
                isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <option value="05">{t.b2bDecision05}</option>
              <option value="06">{t.b2bDecision06}</option>
              <option value="07">{t.b2bDecision07}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.b2bSupplierName}</label>
            <input
              type="text"
              required
              value={emisorNombre}
              onChange={(e) => setEmisorNombre(e.target.value)}
              className={`w-full rounded px-2.5 py-1.5 text-xs border focus:outline-none ${
                isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.b2bSupplierId}</label>
            <input
              type="text"
              required
              value={emisorCedula}
              onChange={(e) => setEmisorCedula(e.target.value)}
              className={`w-full rounded px-2.5 py-1.5 text-xs font-mono border focus:outline-none ${
                isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.b2bInvoiceTotal} (₡)</label>
            <input
              type="number"
              step="0.01"
              required
              value={totalFactura}
              onChange={(e) => setTotalFactura(parseFloat(e.target.value) || 0)}
              className={`w-full rounded px-2.5 py-1.5 text-xs font-mono border focus:outline-none ${
                isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.b2bVatTotal} (₡)</label>
            <input
              type="number"
              step="0.01"
              required
              value={montoTotalImpuesto}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setMontoTotalImpuesto(val);
                setMontoCredito(val);
              }}
              className={`w-full rounded px-2.5 py-1.5 text-xs font-mono border focus:outline-none ${
                isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-indigo-400'
              }`}
            />
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 rounded-lg border ${
          isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.b2bTaxCondition}</label>
            <select
              value={condicionImpuesto}
              onFocus={() => setActiveHint(t.hintTaxCredit)}
              onChange={(e) => setCondicionImpuesto(e.target.value as any)}
              className={`w-full rounded px-2.5 py-1.5 text-xs border focus:outline-none ${
                isBright ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <option value="01">01 - {lang === 'en' ? 'Full VAT Credit (100%)' : 'Crédito Fiscal Pleno (100%)'}</option>
              <option value="02">02 - {lang === 'en' ? 'Partial VAT Credit' : 'Crédito Fiscal Parcial'}</option>
              <option value="03">03 - {lang === 'en' ? 'Capital Assets' : 'Bienes de Capital'}</option>
              <option value="04">04 - {lang === 'en' ? 'Non-Deductible Expense' : 'Gasto Corriente No Deducible'}</option>
              <option value="05">05 - {lang === 'en' ? 'Proportionality' : 'Proporcionalidad'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.b2bCreditAmount} (₡)</label>
            <input
              type="number"
              step="0.01"
              disabled={condicionImpuesto === '04'}
              value={condicionImpuesto === '04' ? 0 : montoCredito}
              onChange={(e) => setMontoCredito(parseFloat(e.target.value) || 0)}
              className={`w-full rounded px-2.5 py-1.5 text-xs font-mono border focus:outline-none disabled:opacity-40 ${
                isBright ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-emerald-400'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.b2bDetailNote}</label>
            <input
              type="text"
              value={detalleMensaje}
              onChange={(e) => setDetalleMensaje(e.target.value)}
              className={`w-full rounded px-2.5 py-1.5 text-xs border focus:outline-none ${
                isBright ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs rounded-lg shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? (lang === 'en' ? 'Signing & Submitting...' : 'Transmitiendo...') : t.b2bSubmitBtn}</span>
          </button>
        </div>
      </form>

      {/* History */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          {t.b2bHistoryTitle} ({receptions.length})
        </h4>
        <div className={`overflow-x-auto rounded-lg border ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
          <table className="w-full text-left text-xs">
            <thead className={`${isBright ? 'bg-slate-100 text-slate-600' : 'bg-slate-800/80 text-slate-400'} uppercase text-[10px] tracking-wider border-b`}>
              <tr>
                <th className="py-2.5 px-3">Consecutivo Receptor</th>
                <th className="py-2.5 px-3">Clave Factura Proveedor</th>
                <th className="py-2.5 px-3">Proveedor</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-right">IVA Acreditado</th>
                <th className="py-2.5 px-3 text-center">Decisión</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${isBright ? 'bg-white divide-slate-100 text-slate-800' : 'bg-slate-900/60 divide-slate-800 text-slate-300'}`}>
              {receptions.map((rec) => (
                <tr key={rec.id} className={isBright ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}>
                  <td className="py-2.5 px-3 font-semibold">{rec.numeroConsecutivoReceptor}</td>
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-[170px]">{rec.claveDocumento}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <div>{rec.emisorNombre}</div>
                    <span className="text-[10px] text-slate-400">Céd: {rec.emisorCedula}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">₡{rec.totalFactura.toLocaleString('es-CR')}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-500 font-bold">₡{rec.montoTotalImpuestoAcreditar.toLocaleString('es-CR')}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-500">
                      {rec.tipoMensaje === '05' ? '05 Aceptado' : rec.tipoMensaje}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-sans">
                    <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                    Validado
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
