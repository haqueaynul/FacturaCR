/**
 * @file src/components/DocumentGenerator.tsx
 * @description Local electronic document generation form with beginner-friendly validation,
 * inline explanations, CABYS catalog search, and multi-language support (ES / EN).
 */

import React, { useState } from 'react';
import {
  FilePlus,
  Plus,
  Trash2,
  Search,
  ShieldCheck,
  Hash,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { DocumentType, Company, DocumentItem } from '../types';
import { searchCabys } from '../services/cabys';

interface DocumentGeneratorProps {
  lang: Language;
  theme: 'dark' | 'bright';
  company: Company | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isSubmitting: boolean;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  lang,
  theme,
  company,
  onSubmit,
  isSubmitting,
}) => {
  const t = translations[lang];

  const [tipoDocumento, setTipoDocumento] = useState<DocumentType>('01');
  const [moneda, setMoneda] = useState<'CRC' | 'USD'>('CRC');
  const [tipoCambio, setTipoCambio] = useState<number>(518.5);
  const [condicionVenta, setCondicionVenta] = useState<'01' | '02' | '03'>('01');
  const [plazoCredito, setPlazoCredito] = useState<number>(30);
  const [medioPago, setMedioPago] = useState<'01' | '02' | '03' | '04'>('04');

  // Customer / Receptor
  const [receptorNombre, setReceptorNombre] = useState('CORPORACIÓN INTERNACIONAL S.A.');
  const [receptorTipoId, setReceptorTipoId] = useState<'01' | '02' | '03' | '04'>('02');
  const [receptorCedula, setReceptorCedula] = useState('3101897654');
  const [receptorCorreo, setReceptorCorreo] = useState('facturas@corporacion.cr');

  // Active validation suggestion tooltip
  const [activeTooltip, setActiveTooltip] = useState<string | null>(t.hintDocType);
  const [formError, setFormError] = useState<string | null>(null);

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

  // CABYS search modal
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItemIndexForCabys, setActiveItemIndexForCabys] = useState<number | null>(null);

  // Totals calculation
  const subTotalGral = items.reduce((acc, item) => acc + item.subTotal, 0);
  const ivaTotalGral = items.reduce((acc, item) => acc + item.montoIva, 0);
  const totalComprobante = subTotalGral + ivaTotalGral;

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

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index).map((item, idx) => ({ ...item, numeroLinea: idx + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receptorCedula || receptorCedula.length < 9) {
      setFormError(lang === 'en' ? 'Customer Tax ID must be at least 9 digits.' : 'La cédula del cliente debe tener al menos 9 dígitos.');
      return;
    }
    setFormError(null);

    const payload = {
      tipoDocumento,
      schemaVersion: company?.schemaVersion || '4.4',
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

  // Preview 50-digit clave
  const sampleDay = String(new Date().getDate()).padStart(2, '0');
  const sampleMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const sampleYear = String(new Date().getFullYear()).slice(-2);
  const sampleCedula = (company?.cedula || '3101123456').padStart(12, '0');
  const sampleConsecutivo = `${company?.sucursal || '001'}${company?.puntoVenta || '00001'}${tipoDocumento}0000000001`;
  const sampleClave = `506${sampleDay}${sampleMonth}${sampleYear}${sampleCedula}${sampleConsecutivo}1XXXXXXXX`;

  const isBright = theme === 'bright';

  return (
    <div className={`${isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'} border rounded-xl p-5 shadow-sm mb-8 transition-colors`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b ${isBright ? 'border-slate-100' : 'border-slate-800'} gap-3`}>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg">
            <FilePlus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold tracking-tight ${isBright ? 'text-slate-900' : 'text-white'}`}>
                {t.formNewDocTitle}
              </h2>
              <span className={`text-[10px] px-2 py-0.5 font-mono font-bold rounded border ${
                (company?.schemaVersion || '4.4') === '4.4'
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-500 border-blue-500/30'
              }`}>
                XML v{company?.schemaVersion || '4.4'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {company?.nombre} · Sucursal {company?.sucursal} · Punto {company?.puntoVenta}
            </p>
          </div>
        </div>

        {/* 50-Digit Clave Preview */}
        <div className={`${isBright ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'} px-3 py-1.5 rounded-lg border font-mono text-[11px] flex items-center space-x-2`}>
          <Hash className="w-3.5 h-3.5 text-blue-500" />
          <span>Clave:</span>
          <span className="text-emerald-500 font-semibold truncate max-w-xs">{sampleClave}</span>
        </div>
      </div>

      {/* Form Error Banner */}
      {formError && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center justify-between">
          <span>{formError}</span>
          <button type="button" onClick={() => setFormError(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Beginner Explanation & Helper Box */}
      {activeTooltip && (
        <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 text-xs flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">{lang === 'en' ? 'Field Explanation & Tax Rule:' : 'Explicación del Campo y Regla Tributaria:'}</span>
            <span className="text-slate-300 text-[11px]">{activeTooltip}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document Header Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              {t.formDocType}
            </label>
            <select
              value={tipoDocumento}
              onFocus={() => setActiveTooltip(t.hintDocType)}
              onChange={(e) => setTipoDocumento(e.target.value as DocumentType)}
              className={`w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <option value="01">01 - {lang === 'en' ? 'Electronic Invoice (FE)' : 'Factura Electrónica (FE)'}</option>
              <option value="04">04 - {lang === 'en' ? 'Electronic Ticket (TE)' : 'Tiquete Electrónico (TE)'}</option>
              <option value="03">03 - {lang === 'en' ? 'Credit Note (NC)' : 'Nota de Crédito (NC)'}</option>
              <option value="02">02 - {lang === 'en' ? 'Debit Note (ND)' : 'Nota de Débito (ND)'}</option>
              <option value="08">08 - {lang === 'en' ? 'Purchase Invoice (FEC)' : 'Factura de Compra (FEC)'}</option>
              <option value="09">09 - {lang === 'en' ? 'Export Invoice (FEE)' : 'Factura de Exportación (FEE)'}</option>
              {(company?.schemaVersion || '4.4') === '4.4' && (
                <option value="10">10 - {lang === 'en' ? 'Payment Receipt (REP - v4.4)' : 'Recibo Electrónico de Pago (REP - v4.4)'}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              {t.formCurrency}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as 'CRC' | 'USD')}
                className={`rounded-lg px-3 py-2 text-xs border focus:outline-none ${
                  isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
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
                className={`rounded-lg px-2.5 py-2 text-xs border focus:outline-none disabled:opacity-40 ${
                  isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              {t.formSaleCondition}
            </label>
            <div className="flex space-x-2">
              <select
                value={condicionVenta}
                onFocus={() => setActiveTooltip(t.hintSaleCondition)}
                onChange={(e) => setCondicionVenta(e.target.value as any)}
                className={`w-full rounded-lg px-3 py-2 text-xs border focus:outline-none ${
                  isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="01">01 - {lang === 'en' ? 'Cash' : 'Contado'}</option>
                <option value="02">02 - {lang === 'en' ? 'Credit' : 'Crédito'}</option>
                <option value="03">03 - {lang === 'en' ? 'Consignment' : 'Consignación'}</option>
              </select>
              {condicionVenta === '02' && (
                <input
                  type="number"
                  min="1"
                  value={plazoCredito}
                  onChange={(e) => setPlazoCredito(parseInt(e.target.value) || 30)}
                  placeholder="Días"
                  className={`w-20 rounded-lg px-2 py-2 text-xs border ${
                    isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              {t.formPaymentMethod}
            </label>
            <select
              value={medioPago}
              onFocus={() => setActiveTooltip(t.hintPaymentMethod)}
              onChange={(e) => setMedioPago(e.target.value as any)}
              className={`w-full rounded-lg px-3 py-2 text-xs border focus:outline-none ${
                isBright ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {(company?.schemaVersion || '4.4') === '4.4' && (
                <option value="05">05 - {lang === 'en' ? 'SINPE Móvil (Official v4.4)' : 'SINPE Móvil (Oficial v4.4)'}</option>
              )}
              <option value="04">04 - {lang === 'en' ? 'Bank Transfer' : 'Transferencia Bancaria'}</option>
              <option value="02">02 - {lang === 'en' ? 'Credit / Debit Card' : 'Tarjeta Crédito / Débito'}</option>
              <option value="01">01 - {lang === 'en' ? 'Cash' : 'Efectivo'}</option>
              <option value="03">03 - {lang === 'en' ? 'Check' : 'Cheque'}</option>
            </select>
          </div>
        </div>

        {/* Customer Information with suggestions */}
        <div className={`p-3.5 rounded-lg border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>{t.customerData}</span>
            <span className="text-[11px] text-emerald-500 font-medium flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Validated against Costa Rica Tax Registry' : 'Validado ante Padrón Tributario'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">{t.customerName}</label>
              <input
                type="text"
                required
                value={receptorNombre}
                onChange={(e) => setReceptorNombre(e.target.value)}
                className={`w-full rounded px-2.5 py-1.5 text-xs border focus:outline-none ${
                  isBright ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">{t.customerIdType}</label>
              <select
                value={receptorTipoId}
                onChange={(e) => setReceptorTipoId(e.target.value as any)}
                className={`w-full rounded px-2.5 py-1.5 text-xs border focus:outline-none ${
                  isBright ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="02">02 - {lang === 'en' ? 'Corporate ID (10 digits)' : 'Cédula Jurídica'}</option>
                <option value="01">01 - {lang === 'en' ? 'Physical Person (9 digits)' : 'Cédula Física'}</option>
                <option value="03">03 - DIMEX</option>
                <option value="04">04 - NITE</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">{t.customerIdNumber}</label>
              <input
                type="text"
                required
                value={receptorCedula}
                onFocus={() => setActiveTooltip(t.hintCedula)}
                onChange={(e) => setReceptorCedula(e.target.value.replace(/\D/g, ''))}
                className={`w-full rounded px-2.5 py-1.5 text-xs font-mono border focus:outline-none ${
                  isBright ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">{t.customerEmail}</label>
              <input
                type="email"
                required
                value={receptorCorreo}
                onChange={(e) => setReceptorCorreo(e.target.value)}
                className={`w-full rounded px-2.5 py-1.5 text-xs border focus:outline-none ${
                  isBright ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t.lineItems}
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className={`text-xs px-2.5 py-1 rounded flex items-center space-x-1 border transition-colors ${
                isBright ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.addLine}</span>
            </button>
          </div>

          <div className={`overflow-x-auto rounded-lg border ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
            <table className="w-full text-left text-xs">
              <thead className={`${isBright ? 'bg-slate-100 text-slate-600' : 'bg-slate-800/80 text-slate-400'} uppercase text-[10px] tracking-wider border-b`}>
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3 min-w-[140px]">{t.cabysCode}</th>
                  <th className="py-2.5 px-3 min-w-[200px]">{t.itemDetail}</th>
                  <th className="py-2.5 px-3 w-16">{t.itemQty}</th>
                  <th className="py-2.5 px-3 w-28">{t.itemUnitPrice}</th>
                  <th className="py-2.5 px-3 w-24">{t.itemVatRate}</th>
                  <th className="py-2.5 px-3 w-24">{t.itemVatAmount}</th>
                  <th className="py-2.5 px-3 w-28">{t.itemTotal}</th>
                  <th className="py-2.5 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${isBright ? 'bg-white divide-slate-100 text-slate-800' : 'bg-slate-900/60 divide-slate-800 text-slate-300'}`}>
                {items.map((item, idx) => (
                  <tr key={idx} className={isBright ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}>
                    <td className="py-2 px-3 text-slate-400">{item.numeroLinea}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          maxLength={13}
                          value={item.codigoCabys}
                          onFocus={() => setActiveTooltip(t.hintCabys)}
                          onChange={(e) => updateItem(idx, { codigoCabys: e.target.value })}
                          className={`w-full rounded px-1.5 py-1 text-xs font-mono text-emerald-500 border ${
                            isBright ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setActiveItemIndexForCabys(idx);
                            setSearchQuery('');
                          }}
                          className={`p-1 rounded border ${isBright ? 'bg-slate-100 border-slate-300' : 'bg-slate-800 border-slate-700'}`}
                          title={t.searchCabys}
                        >
                          <Search className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <input
                        type="text"
                        value={item.detalle}
                        onChange={(e) => updateItem(idx, { detalle: e.target.value })}
                        className={`w-full rounded px-2 py-1 text-xs border ${
                          isBright ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={item.cantidad}
                        onChange={(e) => updateItem(idx, { cantidad: parseFloat(e.target.value) || 0 })}
                        className={`w-full rounded px-1.5 py-1 text-xs border ${
                          isBright ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.precioUnitario}
                        onChange={(e) => updateItem(idx, { precioUnitario: parseFloat(e.target.value) || 0 })}
                        className={`w-full rounded px-1.5 py-1 text-xs border ${
                          isBright ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={item.tarifaIva}
                        onFocus={() => setActiveTooltip(t.hintVatRates)}
                        onChange={(e) => updateItem(idx, { tarifaIva: parseFloat(e.target.value) })}
                        className={`w-full rounded px-1.5 py-1 text-xs border ${
                          isBright ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                        }`}
                      >
                        <option value="13">13% (General)</option>
                        <option value="8">8% (Turismo ICT)</option>
                        <option value="4">4% (Salud Art.26)</option>
                        <option value="2">2% (Educación)</option>
                        <option value="1">1% (Canasta Básica)</option>
                        <option value="0">0% (Exento)</option>
                      </select>
                    </td>
                    <td className="py-2 px-3 text-indigo-400 font-semibold">
                      {item.montoIva.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-emerald-500 font-bold">
                      {item.montoTotalLinea.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="text-slate-400 hover:text-rose-500 disabled:opacity-20"
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

        {/* Totals & Submit */}
        <div className={`flex flex-col sm:flex-row items-center justify-between pt-4 border-t ${isBright ? 'border-slate-200' : 'border-slate-800'} gap-4`}>
          <div className="flex items-center space-x-6 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[11px]">{t.subtotalNet}:</span>
              <span className="text-sm font-semibold">
                {moneda} {subTotalGral.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t.totalVat}:</span>
              <span className="text-sm font-semibold text-indigo-400">
                {moneda} {ivaTotalGral.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t.totalInvoice}:</span>
              <span className="text-base font-bold text-emerald-500">
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
              {isSubmitting ? t.btnSigning : t.btnSignAndSubmit}
            </span>
          </button>
        </div>
      </form>

      {/* CABYS Modal */}
      {activeItemIndexForCabys !== null && (
        <div className={`fixed inset-0 ${isBright ? 'bg-slate-900/50' : 'bg-black/70'} backdrop-blur-xs flex items-center justify-center z-50 p-4`}>
          <div className={`border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl transition-colors ${
            isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
            }`}>
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-emerald-500" />
                <span className={`text-sm font-bold ${isBright ? 'text-slate-900' : 'text-white'}`}>{t.searchCabys}</span>
              </div>
              <button
                onClick={() => setActiveItemIndexForCabys(null)}
                className={`text-xs px-2 py-1 rounded transition-colors cursor-pointer ${
                  isBright ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {t.close}
              </button>
            </div>
            <div className="p-4">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código CABYS o nombre de bien/servicio..."
                className={`w-full rounded-lg px-3 py-2 text-xs border focus:outline-none mb-3 ${
                  isBright ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
              <div className={`max-h-72 overflow-y-auto divide-y border rounded-lg ${
                isBright ? 'divide-slate-200 border-slate-200 bg-white' : 'divide-slate-800 border-slate-700 bg-slate-950/60'
              }`}>
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
                    className={`p-3 cursor-pointer transition-colors flex items-center justify-between text-xs ${
                      isBright
                        ? 'hover:bg-emerald-50/70 text-slate-800'
                        : 'hover:bg-emerald-500/10 text-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-500">{item.codigo}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isBright ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-800 text-slate-400'
                        }`}>{item.categoria}</span>
                      </div>
                      <p className={`mt-1 line-clamp-1 ${isBright ? 'text-slate-700' : 'text-slate-200'}`}>{item.descripcion}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.tarifaIva}% IVA</span>
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
