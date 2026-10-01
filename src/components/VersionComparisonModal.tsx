/**
 * @file src/components/VersionComparisonModal.tsx
 * @description Educational and technical modal comparing Costa Rica Factura Electrónica
 * specification v4.3 vs v4.4 (Ministerio de Hacienda / Dirección General de Tributación).
 * Provides interactive 1-click schema switching and regulatory breakdown.
 */

import React from 'react';
import {
  X,
  FileCheck2,
  ArrowRightLeft,
  CheckCircle2,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Smartphone,
  BookOpen,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { SchemaVersion } from '../types';

interface VersionComparisonModalProps {
  lang: Language;
  theme: 'dark' | 'bright';
  activeVersion: SchemaVersion;
  onSwitchVersion: (version: SchemaVersion) => Promise<void>;
  onClose: () => void;
  isSwitching?: boolean;
}

export const VersionComparisonModal: React.FC<VersionComparisonModalProps> = ({
  lang,
  theme,
  activeVersion,
  onSwitchVersion,
  onClose,
  isSwitching = false,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';

  const comparisonFeatures = [
    {
      feature: lang === 'en' ? 'Legal Framework & Resolution' : 'Normativa y Resolución Base',
      v43: 'Resolución DGT-R-033-2019 (Sistema ATV estándar)',
      v44: 'Resolución DGT-R-028-2023 / Plataforma TRIBU-CR Modernizada',
      impact: lang === 'en' ? 'Official modern regulatory baseline' : 'Marco normativo moderno obligatorio',
    },
    {
      feature: lang === 'en' ? 'Recibo Electrónico de Pago (REP - Doc 10)' : 'Recibo Electrónico de Pago (REP - Tipo 10)',
      v43: lang === 'en' ? 'Not supported. Credit payments logged externally.' : 'No soportado. Pagos a crédito sin comprobante digital propio.',
      v44: lang === 'en' ? 'Supported & Mandated for credit sales installment tracking.' : 'Soportado y requerido para abonos, cuotas y cancelaciones a crédito.',
      impact: lang === 'en' ? 'Full audit trail of realized cash flow & VAT' : 'Trazabilidad de flujo de caja e IVA devengado',
      highlight: true,
    },
    {
      feature: lang === 'en' ? 'SINPE Móvil Dedicated Payment Method (Code 05)' : 'Medio de Pago dedicado SINPE Móvil (Código 05)',
      v43: lang === 'en' ? 'Must use 04 (Transferencia) or 99 (Otros).' : 'Debe agruparse en 04 (Transferencia) o 99 (Otros).',
      v44: lang === 'en' ? 'Dedicated Code 05 - SINPE Móvil with phone reference.' : 'Código oficial 05 - SINPE Móvil con referencia telefónica.',
      impact: lang === 'en' ? 'Matches massive CR consumer payment adoption' : 'Concordancia con el medio de pago #1 de Costa Rica',
      highlight: true,
    },
    {
      feature: lang === 'en' ? 'Non-Taxable Nature: "Exento" vs "No Sujeto"' : 'Naturaleza Tributaria: "Exento" vs "No Sujeto"',
      v43: lang === 'en' ? 'Unified as 0% or generic exempt category.' : 'Agrupado de forma genérica como exento / no gravado.',
      v44: lang === 'en' ? 'Strict separation: No Sujeto (outside IVA law) vs Exento (statutory exoneration).' : 'Separación estricta entre No Sujeto (fuera de la ley IVA) y Exento (con autorización DGT).',
      impact: lang === 'en' ? 'Prevents misclassification in Form D-104' : 'Evita multas por mala clasificación en Formulario D-104',
      highlight: true,
    },
    {
      feature: lang === 'en' ? 'XML Schema Namespace URL' : 'Espacio de Nombres (Namespace XML)',
      v43: '.../xml-schemas/v4.3/facturaelectronica',
      v44: '.../xml-schemas/v4.4/facturaelectronica',
      impact: lang === 'en' ? 'Hacienda validates against v4.4 XSD validator' : 'Validación estricta de XSD en receptores tributarios',
    },
    {
      feature: lang === 'en' ? 'Reference Information (InformacionReferencia)' : 'Información de Referencia a Documentos Previos',
      v43: lang === 'en' ? 'Permissive reference to original Clave' : 'Referencia básica opcional a Clave original',
      v44: lang === 'en' ? 'Strict validation when issuing NC, ND, or REP against prior Claves' : 'Validación estricta de Claves previas para Notas y REP',
      impact: lang === 'en' ? 'Guarantees integrity of credit note links' : 'Garantiza consistencia cruzada en Hacienda',
    },
    {
      feature: lang === 'en' ? 'CABYS to VAT Rate Concordance' : 'Concordancia de Códigos CABYS con Tarifa IVA',
      v43: lang === 'en' ? 'Basic warning in ATV' : 'Advertencia básica en ATV',
      v44: lang === 'en' ? 'Automated rejection if rate diverges from official catalog' : 'Rechazo automático si la tarifa discrepa del catálogo BCCR',
      impact: lang === 'en' ? 'Zero tolerance for unauthorized rate discounts' : 'Elimina discrepancias en tarifas reducidas',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div
        className={`border rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl transition-colors ${
          isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-emerald-600 text-white rounded-xl shadow-sm">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-base sm:text-lg ${isBright ? 'text-slate-900' : 'text-white'}`}>
                {t.versionModalTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {t.versionModalSubtitle}
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 text-xs font-sans">
          {/* Active Version Status & Quick Switch Action */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              activeVersion === '4.4'
                ? isBright
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : isBright
                ? 'bg-blue-50/70 border-blue-300 text-blue-950'
                : 'bg-blue-950/30 border-blue-500/40 text-blue-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-lg mt-0.5 ${
                  activeVersion === '4.4'
                    ? 'bg-emerald-500/20 text-emerald-600'
                    : 'bg-blue-500/20 text-blue-600'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm">
                    {lang === 'en' ? 'Current Active Tax Specification:' : 'Especificación Tributaria Activa:'}
                  </span>
                  <span
                    className={`px-2 py-0.5 font-mono text-xs font-bold rounded ${
                      activeVersion === '4.4'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    v{activeVersion} {activeVersion === '4.4' ? '(Latest)' : '(Legacy)'}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-1">
                  {activeVersion === '4.4'
                    ? lang === 'en'
                      ? 'All new electronic invoices and payment receipts will generate with XML v4.4 schemas, REP voucher support, and SINPE Móvil code.'
                      : 'Todos los nuevos comprobantes se emitirán con esquemas XML v4.4, soporte para Recibo Electrónico de Pago (REP) y SINPE Móvil.'
                    : lang === 'en'
                    ? 'Operating under legacy v4.3 DGT-R-033-2019 specifications. Historical documents remain completely valid.'
                    : 'Operando bajo la especificación anterior v4.3 DGT-R-033-2019. Los comprobantes históricos mantienen total validez.'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {activeVersion === '4.3' ? (
                <button
                  onClick={() => onSwitchVersion('4.4')}
                  disabled={isSwitching}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Switch to v4.4 (Recommended)' : 'Cambiar a v4.4 (Recomendado)'}</span>
                </button>
              ) : (
                <button
                  onClick={() => onSwitchVersion('4.3')}
                  disabled={isSwitching}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Switch to v4.3 (Legacy)' : 'Cambiar a v4.3 (Anterior)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Explanation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              className={`p-3.5 rounded-xl border ${
                isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/60'
              }`}
            >
              <div className="flex items-center space-x-2 text-emerald-500 font-semibold mb-1">
                <Receipt className="w-4 h-4" />
                <span>{lang === 'en' ? '1. REP Receipt (Doc 10)' : '1. Recibo de Pago (Doc 10)'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'en'
                  ? 'v4.4 introduces the Recibo Electrónico de Pago to formally document and link installment and partial payments made towards credit invoices.'
                  : 'v4.4 introduce el Recibo Electrónico de Pago para documentar abonos, cuotas y pagos parciales a facturas a crédito.'}
              </p>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/60'
              }`}
            >
              <div className="flex items-center space-x-2 text-indigo-400 font-semibold mb-1">
                <Smartphone className="w-4 h-4" />
                <span>{lang === 'en' ? '2. SINPE Móvil Code 05' : '2. SINPE Móvil Código 05'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'en'
                  ? 'Official payment method code 05 directly for Costa Rica SINPE Móvil transactions, replacing the ambiguous 04 transfer classification.'
                  : 'Código oficial 05 específico para transacciones SINPE Móvil de Costa Rica, reemplazando la clasificación ambigua como transferencia.'}
              </p>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/60'
              }`}
            >
              <div className="flex items-center space-x-2 text-blue-400 font-semibold mb-1">
                <BookOpen className="w-4 h-4" />
                <span>{lang === 'en' ? '3. No Sujeto vs Exento' : '3. No Sujeto vs Exento'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'en'
                  ? 'Clarifies operations not subject to VAT by law (No Sujeto) versus operations legally exempt through an exoneration code (Exento).'
                  : 'Distingue con claridad actividades no gravadas por la ley del IVA (No Sujeto) de aquellas exentas con código de exoneración.'}
              </p>
            </div>
          </div>

          {/* Technical Comparison Table */}
          <div>
            <h4 className={`font-bold text-xs uppercase tracking-wider mb-2.5 ${isBright ? 'text-slate-800' : 'text-slate-300'}`}>
              {lang === 'en' ? 'Feature-by-Feature Matrix (v4.3 vs v4.4)' : 'Matriz Comparativa Técnica (v4.3 vs v4.4)'}
            </h4>
            <div className={`overflow-x-auto rounded-xl border ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
              <table className="w-full text-left text-xs">
                <thead
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isBright ? 'bg-slate-100 text-slate-600' : 'bg-slate-800/90 text-slate-300'
                  }`}
                >
                  <tr>
                    <th className="py-2.5 px-3">{lang === 'en' ? 'Tax Aspect / Feature' : 'Aspecto / Requisito'}</th>
                    <th className="py-2.5 px-3">{lang === 'en' ? 'Version 4.3 (Legacy)' : 'Versión 4.3 (Anterior)'}</th>
                    <th className="py-2.5 px-3 text-emerald-500">{lang === 'en' ? 'Version 4.4 (Latest)' : 'Versión 4.4 (Vigente)'}</th>
                    <th className="py-2.5 px-3">{lang === 'en' ? 'Compliance Impact' : 'Impacto Tributario'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-sans ${isBright ? 'divide-slate-200 text-slate-700' : 'divide-slate-800/80 text-slate-300'}`}>
                  {comparisonFeatures.map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        row.highlight
                          ? isBright
                            ? 'bg-emerald-50/30'
                            : 'bg-emerald-950/15'
                          : isBright
                          ? 'hover:bg-slate-50'
                          : 'hover:bg-slate-800/30'
                      }
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        <span className={isBright ? 'text-slate-900' : 'text-white'}>{row.feature}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{row.v43}</td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-400 font-mono text-[11px] flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500 inline" />
                        <span>{row.v44}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">{row.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* How to Switch Instructions */}
          <div
            className={`p-4 rounded-xl border ${
              isBright ? 'bg-amber-50/50 border-amber-200 text-amber-950' : 'bg-amber-950/20 border-amber-600/30 text-amber-200'
            }`}
          >
            <div className="flex items-center space-x-2 font-bold mb-2">
              <Info className="w-4 h-4 text-amber-500" />
              <span>{lang === 'en' ? 'How can I switch to v4.4?' : '¿Cómo puedo cambiar a la versión 4.4?'}</span>
            </div>
            <div className="space-y-1.5 text-[11px] opacity-90 pl-6 list-disc">
              <p>
                <strong>{lang === 'en' ? '1. Top Navigation Bar (Instant Switch):' : '1. Barra de Navegación Superior (Cambio Instantáneo):'}</strong>{' '}
                {lang === 'en'
                  ? 'Click the [ v4.3 | v4.4 ] pill button located right in the main header beside the title.'
                  : 'Haz clic en el control [ v4.3 | v4.4 ] ubicado en el encabezado principal junto al logo.'}
              </p>
              <p>
                <strong>{lang === 'en' ? '2. Right here in this window:' : '2. Directamente en esta ventana:'}</strong>{' '}
                {lang === 'en'
                  ? 'Click the "Switch to v4.4 (Recommended)" button at the top of this modal.'
                  : 'Presiona el botón "Cambiar a v4.4 (Recomendado)" en la tarjeta superior.'}
              </p>
              <p>
                <strong>{lang === 'en' ? '3. Sandbox Settings Modal:' : '3. Modal de Configuración Sandbox:'}</strong>{' '}
                {lang === 'en'
                  ? 'Click "Sandbox Settings" (Gear icon) → Select "Versión 4.4 (TRIBU-CR / Vigente)" and click Save.'
                  : 'Ve a Configuración Sandbox (ícono de engranaje) → Selecciona "Versión 4.4" y guarda los cambios.'}
              </p>
              <p>
                <strong>{lang === 'en' ? 'Historical Integrity:' : 'Integridad Histórica:'}</strong>{' '}
                {lang === 'en'
                  ? 'Switching applies to all subsequent documents. Invoices previously issued under v4.3 remain permanently accessible with their valid v4.3 XAdES-EPES signatures.'
                  : 'El cambio aplica para todos los nuevos documentos. Las facturas emitidas previamente en v4.3 conservan su firma XAdES-EPES y validez legal permanente.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
          }`}
        >
          <div className="text-[11px] text-slate-400">
            {lang === 'en' ? 'Active Company' : 'Empresa Activa'}: <span className="font-semibold text-emerald-400">v{activeVersion}</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              isBright ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
