/**
 * @file src/components/DocumentGenerator.tsx
 * @description Local electronic document generation form strictly adhering to Ministerio de Hacienda
 * resolution DGT-R-033-2019 v4.3 specs. Computes 50-digit Clave, line items, CABYS codes,
 * and initiates digital signing.
 */

import React, { useState } from 'react';
import {
  FilePlus,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Send,
  Eye,
  CheckCircle,
  HelpCircle,
  Hash,
  ShieldCheck,
} from 'lucide-react';
import { DocumentType, TaxpayerConfig, DocumentItem } from '../types';
import { searchCabys, CABYS_CATALOG } from '../services/cabys';

interface DocumentGeneratorProps {
  taxpayer: TaxpayerConfig | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Electronic document generation and calculation component.
 */
export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  taxpayer,
  onSubmit,
  isSubmitting,
}) => {
  const [tipoDocumento, setTipoDocumento] = useState<DocumentType>('01');
  const [moneda, setMoneda] = useState<'CRC' | 'USD'>('CRC');
  const [tipoCambio, setTipoCambio] = useState<number>(518.5);
  const [condicionVenta, setCondicionVenta] = useState<'01' | '02' | '03'>('01');
  const [plazoCredito, setPlazoCredito] = useState<number>(30);
  const [medioPago, setMedioPago] = useState<'01' | '02' | '03' | '04'>('04');

  // Receptor
  const [receptorNombre, setReceptorNombre] = useState('CORPORACIÓN INTERNACIONAL S.A.');
  const [receptorTipoId, setReceptorTipoId] = useState<'01' | '02' | '03' | '04'>('02');
  const [receptorCedula, setReceptorCedula] = useState('3101897654');
  const [receptorCorreo, setReceptorCorreo] = useState('facturas@corporacion.cr');

  // Items
  const [items, setItems] = useState<DocumentItem[]>([
    {
      numeroLinea: 1,
      codigoCabys: '8314100000000',
      detalle: 'Servicios de consultoría y desarrollo de software a la medida',
      cantidad: 1,
      unidadMedida: 'Sp',
      precioUnitario: 250000,
      montoTotal: 250000,
      subTotal: 250000,
      montoDescuento: 0,
      naturalezaDescuento: '',
      tarifaIva: 13,
      codigoTarifaIva: '08',
      montoIva: 32500,
      montoTotalLinea: 282500,
    },
  ]);

  // CABYS Search modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItemIndexForCabys, setActiveItemIndexForCabys] = useState<number | null>(null);

  // Totals
  const subTotalGral = items.reduce((acc, item) => acc + item.subTotal, 0);
  const ivaTotalGral = items.reduce((acc, item) => acc + item.montoIva, 0);
  const totalComprobante = subTotalGral + ivaTotalGral;

  /**
   * Recalculates single line item values when unit price, quantity, or VAT rate changes.
   */
  const updateItem = (index: number, updates: Partial<DocumentItem>) => {
    const updated = [...items];
    const current = { ...updated[index], ...updates };

    const cantidad = Number(current.cantidad) || 0;
    const precio = Number(current.precioUnitario) || 0;
    const descuento = Number(current.montoDescuento) || 0;
    const montoTotal = cantidad * precio;
    const subTotal = Math.max(0, montoTotal - descuento);
    const tarifa = Number(current.tarifaIva) || 0;
    const montoIva = subTotal * (tarifa / 100);
    const montoTotalLinea = subTotal + montoIva;

    // Determine codigoTarifaIva
    let codigoTarifa = '08';
    if (tarifa === 0) codigoTarifa = '01';
    else if (tarifa === 1) codigoTarifa = '02';
    else if (tarifa === 2) codigoTarifa = '03';
    else if (tarifa === 4) codigoTarifa = '04';
    else if (tarifa === 8) codigoTarifa = '07';
    else if (tarifa === 13) codigoTarifa = '08';

    updated[index] = {
      ...current,
      montoTotal,
      subTotal,
      montoIva,
      montoTotalLinea,
      codigoTarifaIva: codigoTarifa,
    };
    setItems(updated);
  };

  /**
   * Adds an empty line item with default IT consult CABYS code.
   */
  const handleAddItem = () => {
    const newItem: DocumentItem = {
      numeroLinea: items.length + 1,
      codigoCabys: '8314100000000',
      detalle: 'Servicio profesional',
      cantidad: 1,
      unidadMedida: 'Sp',
      precioUnitario: 50000,
      montoTotal: 50000,
      subTotal: 50000,
      montoDescuento: 0,
      naturalezaDescuento: '',
      tarifaIva: 13,
      codigoTarifaIva: '08',
      montoIva: 6500,
      montoTotalLinea: 56500,
    };
    setItems([...items, newItem]);
  };

  /**
   * Removes a line item and adjusts line numbers.
   */
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const filtered = items.filter((_, i) => i !== index).map((item, idx) => ({ ...item, numeroLinea: idx + 1 }));
    setItems(filtered);
  };

  /**
   * Submits form to initiate Step 1 (Generation), Step 2 (Signing), and Step 3 (API Submission).
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tipoDocumento,
      moneda,
      tipoCambio: moneda === 'USD' ? tipoCambio : 1.0,
      condicionVenta,
      plazoCredito: condicionVenta === '02' ? plazoCredito : 0,
      medioPago,
      receptor: {
        nombre: receptorNombre,
        tipoIdentificacion: receptorTipoId,
        numeroIdentificacion: receptorCedula,
        correo: receptorCorreo,
      },
      items,
      autoSubmit: true,
    };
    await onSubmit(payload);
  };

  // Preview 50-digit clave structure
  const sampleDay = String(new Date().getDate()).padStart(2, '0');
  const sampleMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const sampleYear = String(new Date().getFullYear()).slice(-2);
  const sampleCedula = (taxpayer?.cedula || '3101123456').padStart(12, '0');
  const sampleConsecutivo = `${taxpayer?.sucursal || '001'}${taxpayer?.puntoVenta || '00001'}${tipoDocumento}0000000001`;
  const sampleClave = `506${sampleDay}${sampleMonth}${sampleYear}${sampleCedula}${sampleConsecutivo}1XXXXXXXX`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-8 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
            <FilePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Emisión de Comprobante Electrónico v4.3</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Paso 1: Generación Local
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Genera XML oficial, calcula clave numérica de 50 dígitos, firma con XAdES-EPES y transmite a Hacienda.
            </p>
          </div>
        </div>

        {/* 50-Digit Clave Preview */}
        <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center space-x-2">
          <Hash className="w-3.5 h-3.5 text-blue-400" />
          <span>Clave 50d:</span>
          <span className="text-emerald-400 font-semibold truncate max-w-xs">{sampleClave}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Document Header Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Tipo de Documento */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Tipo Comprobante
            </label>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value as DocumentType)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="01">01 - Factura Electrónica (FE)</option>
              <option value="04">04 - Tiquete Electrónico (TE)</option>
              <option value="03">03 - Nota de Crédito (NC)</option>
              <option value="02">02 - Nota de Débito (ND)</option>
              <option value="08">08 - Factura Electrónica de Compra (FEC)</option>
              <option value="09">09 - Factura Electrónica de Exportación (FEE)</option>
            </select>
          </div>

          {/* Moneda & Tipo de Cambio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Moneda
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as 'CRC' | 'USD')}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="CRC">CRC (₡)</option>
                <option value="USD">USD ($)</option>
              </select>
              <input
                type="number"
                step="0.01"
                disabled={moneda === 'CRC'}
                value={moneda === 'CRC' ? 1.0 : tipoCambio}
                onChange={(e) => setTipoCambio(parseFloat(e.target.value))}
                placeholder="T.C."
                title="Tipo de Cambio Oficial BCCR"
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none disabled:opacity-40"
              />
            </div>
          </div>

          {/* Condición de Venta */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Condición Venta
            </label>
            <div className="flex space-x-2">
              <select
                value={condicionVenta}
                onChange={(e) => setCondicionVenta(e.target.value as '01' | '02' | '03')}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="01">01 - Contado</option>
                <option value="02">02 - Crédito</option>
                <option value="03">03 - Consignación</option>
              </select>
              {condicionVenta === '02' && (
                <input
                  type="number"
                  min="1"
                  value={plazoCredito}
                  onChange={(e) => setPlazoCredito(parseInt(e.target.value) || 30)}
                  placeholder="Días"
                  title="Plazo crédito en días"
                  className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white"
                />
              )}
            </div>
          </div>

          {/* Medio de Pago */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Medio de Pago
            </label>
            <select
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value as '01' | '02' | '03' | '04')}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="04">04 - Transferencia / SINPE Móvil</option>
              <option value="02">02 - Tarjeta Crédito / Débito</option>
              <option value="01">01 - Efectivo</option>
              <option value="03">03 - Cheque</option>
            </select>
          </div>
        </div>

        {/* Receptor Information */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Datos del Cliente / Receptor</span>
            <span className="text-[11px] text-slate-500 lowercase">validados según padrón tributario</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Nombre / Razón Social</label>
              <input
                type="text"
                required
                value={receptorNombre}
                onChange={(e) => setReceptorNombre(e.target.value)}
                placeholder="Razón Social Cliente"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Tipo Identificación</label>
              <select
                value={receptorTipoId}
                onChange={(e) => setReceptorTipoId(e.target.value as '01' | '02' | '03' | '04')}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="02">02 - Cédula Jurídica</option>
                <option value="01">01 - Cédula Física</option>
                <option value="03">03 - DIMEX</option>
                <option value="04">04 - NITE</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Número de Cédula</label>
              <input
                type="text"
                required
                value={receptorCedula}
                onChange={(e) => setReceptorCedula(e.target.value)}
                placeholder="3101XXXXXX"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Correo para Notificación XML</label>
              <input
                type="email"
                required
                value={receptorCorreo}
                onChange={(e) => setReceptorCorreo(e.target.value)}
                placeholder="cliente@dominio.cr"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Líneas de Detalle (Catálogo CABYS v4.3)
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded flex items-center space-x-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Agregar Línea</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Código CABYS</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Detalle del Servicio / Bien</th>
                  <th className="py-2.5 px-3 w-16">Cant.</th>
                  <th className="py-2.5 px-3 w-28">Precio Unit.</th>
                  <th className="py-2.5 px-3 w-24">Tarifa IVA</th>
                  <th className="py-2.5 px-3 w-24">Impuesto</th>
                  <th className="py-2.5 px-3 w-28">Total Línea</th>
                  <th className="py-2.5 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-500">{item.numeroLinea}</td>
                    {/* CABYS Selector */}
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={item.codigoCabys}
                          onChange={(e) => updateItem(idx, { codigoCabys: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-xs text-emerald-400 focus:outline-none"
                          maxLength={13}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setActiveItemIndexForCabys(idx);
                            setSearchQuery('');
                          }}
                          title="Buscar en catálogo oficial CABYS"
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    {/* Description */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.detalle}
                        onChange={(e) => updateItem(idx, { detalle: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none font-sans"
                      />
                    </td>
                    {/* Quantity */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={item.cantidad}
                        onChange={(e) => updateItem(idx, { cantidad: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-xs text-white focus:outline-none"
                      />
                    </td>
                    {/* Unit Price */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.precioUnitario}
                        onChange={(e) => updateItem(idx, { precioUnitario: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-xs text-white focus:outline-none"
                      />
                    </td>
                    {/* IVA Rate Selector */}
                    <td className="py-2 px-3">
                      <select
                        value={item.tarifaIva}
                        onChange={(e) => updateItem(idx, { tarifaIva: parseFloat(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-xs text-white focus:outline-none"
                      >
                        <option value="13">13% (General)</option>
                        <option value="8">8% (Turismo)</option>
                        <option value="4">4% (Salud)</option>
                        <option value="2">2% (Educación)</option>
                        <option value="1">1% (Canasta Básica)</option>
                        <option value="0">0% (Exento)</option>
                      </select>
                    </td>
                    {/* Impuesto Calculado */}
                    <td className="py-2 px-3 text-slate-300 font-semibold">
                      {item.montoIva.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {/* Total Linea */}
                    <td className="py-2 px-3 text-emerald-400 font-bold">
                      {item.montoTotalLinea.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {/* Delete */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="text-slate-500 hover:text-rose-400 disabled:opacity-20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-800 gap-4">
          <div className="flex items-center space-x-6 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[11px]">Subtotal Neto:</span>
              <span className="text-sm font-semibold text-slate-200">
                {moneda} {subTotalGral.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Total IVA:</span>
              <span className="text-sm font-semibold text-indigo-300">
                {moneda} {ivaTotalGral.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Total Comprobante:</span>
              <span className="text-base font-bold text-emerald-400">
                {moneda} {totalComprobante.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isSubmitting ? 'Firmando y Transmitiendo...' : 'Firmar Digitalmente y Transmitir a Hacienda'}
            </span>
          </button>
        </div>
      </form>

      {/* CABYS Catalog Search Modal */}
      {activeItemIndexForCabys !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">Catálogo Oficial CABYS - BCCR / Hacienda</span>
              </div>
              <button
                onClick={() => setActiveItemIndexForCabys(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                Cerrar
              </button>
            </div>

            <div className="p-4">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código CABYS de 13 dígitos o descripción (ej: software, medicina, turismo)..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-3"
              />

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-lg">
                {searchCabys(searchQuery).map((item) => (
                  <div
                    key={item.codigo}
                    onClick={() => {
                      updateItem(activeItemIndexForCabys, {
                        codigoCabys: item.codigo,
                        detalle: item.descripcion,
                        tarifaIva: item.tarifaIva,
                        codigoTarifaIva: item.codigoTarifa,
                      });
                      setActiveItemIndexForCabys(null);
                    }}
                    className="p-3 hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-emerald-400">{item.codigo}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {item.categoria}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1 line-clamp-1">{item.descripcion}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-xs font-bold text-indigo-300">{item.tarifaIva}% IVA</span>
                      <span className="block text-[10px] text-slate-500">Tarifa Oficial</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
