/**
 * @file src/components/B2BReception.tsx
 * @description Step 5: B2B Acceptance / Rejection (Recepción de Comprobantes - Mensaje Receptor v4.3).
 * Allows the taxpayer to confirm, partially accept, or reject supplier invoices for tax credit deduction.
 */

import React, { useState } from 'react';
import {
  Inbox,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileCheck2,
  Send,
  Building2,
  Hash,
  Scale,
} from 'lucide-react';
import { ReceptionDocument } from '../types';

interface B2BReceptionProps {
  receptions: ReceptionDocument[];
  onSubmitReception: (payload: Record<string, unknown>) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * B2B Reception component adhering to Costa Rica resolution DGT-R-033-2019.
 */
export const B2BReception: React.FC<B2BReceptionProps> = ({
  receptions,
  onSubmitReception,
  isSubmitting,
}) => {
  const [claveDocumento, setClaveDocumento] = useState('');
  const [emisorNombre, setEmisorNombre] = useState('INSTITUTO COSTARRICENSE DE ELECTRICIDAD (ICE)');
  const [emisorCedula, setEmisorCedula] = useState('4000042139');
  const [montoTotalImpuesto, setMontoTotalImpuesto] = useState(13000);
  const [totalFactura, setTotalFactura] = useState(113000);
  const [tipoMensaje, setTipoMensaje] = useState<'05' | '06' | '07'>('05');
  const [detalleMensaje, setDetalleMensaje] = useState('Servicios de telecomunicaciones y energía aceptados con crédito pleno.');
  const [condicionImpuesto, setCondicionImpuesto] = useState<'01' | '02' | '03' | '04' | '05'>('01');
  const [montoCredito, setMontoCredito] = useState(13000);

  /**
   * Generates a realistic sample supplier clave for fast testing.
   */
  const handleFillSampleClave = () => {
    const day = String(new Date().getDate()).padStart(2, '0');
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const year = String(new Date().getFullYear()).slice(-2);
    const mockClave = `506${day}${month}${year}00400004213900100001010000008899187654321`;
    setClaveDocumento(mockClave);
  };

  /**
   * Dispatches B2B acceptance/rejection to Hacienda Sandbox.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claveDocumento || claveDocumento.length !== 50) {
      alert('La clave del comprobante del proveedor debe ser de exactamente 50 dígitos.');
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
    // Reset key
    setClaveDocumento('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-8 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <span>B2B Recepción de Comprobantes (Mensaje Receptor)</span>
              <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Paso 5: Aceptación / Rechazo
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Genera MensajeReceptor v4.3 (Códigos 05, 06, 07) para deducir compras y aplicar crédito fiscal de IVA ante Hacienda.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFillSampleClave}
          className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Generar Clave Proveedor de Prueba</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Clave de 50 dígitos */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Clave Numérica de Factura del Proveedor (50 dígitos) *
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={claveDocumento}
              onChange={(e) => setClaveDocumento(e.target.value.replace(/\D/g, ''))}
              placeholder="506DDMMAAYYYYYYYYYYYY001000010100000000011XXXXXXXX"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              {claveDocumento.length} / 50 dígitos
            </span>
          </div>

          {/* Tipo de Mensaje Receptor */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Decisión del Receptor (Código Hacienda)
            </label>
            <select
              value={tipoMensaje}
              onChange={(e) => setTipoMensaje(e.target.value as '05' | '06' | '07')}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="05">05 - Aceptado (Aceptación Total)</option>
              <option value="06">06 - Aceptado Parcialmente</option>
              <option value="07">07 - Rechazado (Rechazo Total)</option>
            </select>
          </div>
        </div>

        {/* Proveedor y Montos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Razón Social del Proveedor</label>
            <input
              type="text"
              required
              value={emisorNombre}
              onChange={(e) => setEmisorNombre(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Cédula del Proveedor</label>
            <input
              type="text"
              required
              value={emisorCedula}
              onChange={(e) => setEmisorCedula(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Total Factura (₡)</label>
            <input
              type="number"
              step="0.01"
              required
              value={totalFactura}
              onChange={(e) => setTotalFactura(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Monto Total IVA (₡)</label>
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
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-indigo-300 font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* Condicion Impuesto & Credito Fiscal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Condición Impuesto (D-104)</label>
            <select
              value={condicionImpuesto}
              onChange={(e) => setCondicionImpuesto(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="01">01 - Genera Crédito IVA Pleno (100%)</option>
              <option value="02">02 - Genera Crédito IVA Parcial</option>
              <option value="03">03 - Bienes de Capital</option>
              <option value="04">04 - Gasto Corriente No Deducible</option>
              <option value="05">05 - Proporcionalidad</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Monto IVA a Acreditar (₡)</label>
            <input
              type="number"
              step="0.01"
              disabled={condicionImpuesto === '04'}
              value={condicionImpuesto === '04' ? 0 : montoCredito}
              onChange={(e) => setMontoCredito(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none disabled:opacity-40"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Motivo / Detalle del Mensaje</label>
            <input
              type="text"
              value={detalleMensaje}
              onChange={(e) => setDetalleMensaje(e.target.value)}
              placeholder="Detalle de aceptación o justificación de rechazo"
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
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
            <span>
              {isSubmitting ? 'Firmando y Transmitiendo Mensaje...' : 'Firmar y Enviar Mensaje Receptor a Hacienda'}
            </span>
          </button>
        </div>
      </form>

      {/* Received Invoices Table */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Historial de Comprobantes Recibidos de Proveedores ({receptions.length})
        </h4>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Consecutivo Receptor</th>
                <th className="py-2.5 px-3">Clave Factura Proveedor</th>
                <th className="py-2.5 px-3">Proveedor</th>
                <th className="py-2.5 px-3 text-right">Total Factura</th>
                <th className="py-2.5 px-3 text-right">IVA Acreditado</th>
                <th className="py-2.5 px-3 text-center">Decisión (Hacienda)</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
              {receptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 font-sans text-xs">
                    No se han registrado mensajes receptores de compras todavía.
                  </td>
                </tr>
              ) : (
                receptions.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-white">{rec.numeroConsecutivoReceptor}</td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[180px]" title={rec.claveDocumento}>
                      {rec.claveDocumento}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-200">
                      <div>{rec.emisorNombre}</div>
                      <span className="text-[10px] text-slate-400 font-mono">Céd: {rec.emisorCedula}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200">
                      ₡{rec.totalFactura.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                      ₡{rec.montoTotalImpuestoAcreditar.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          rec.tipoMensaje === '05'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : rec.tipoMensaje === '06'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {rec.tipoMensaje === '05' ? '05 Aceptado' : rec.tipoMensaje === '06' ? '06 Parcial' : '07 Rechazado'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center text-[11px] text-emerald-400 font-sans">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Validado
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
