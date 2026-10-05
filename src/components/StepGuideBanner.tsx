/**
 * @file src/components/StepGuideBanner.tsx
 * @description Automated Next-Step Suggestion component.
 * Evaluates current workflow state and prompts beginner users with the exact next step to take,
 * providing one-click action buttons and plain-language explanations.
 * Fully supports Light (Bright) and Dark themes with high-contrast text and background colors.
 */

import React from 'react';
import {
  Sparkles,
  RotateCw,
  Send,
  FileCode,
  X,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { ElectronicDocument } from '../types';

interface StepGuideBannerProps {
  lang: Language;
  theme?: 'dark' | 'bright';
  latestDoc?: ElectronicDocument;
  onActionClick: (actionType: string, docId?: string) => void;
  onDismiss: () => void;
  isDismissed: boolean;
}

export const StepGuideBanner: React.FC<StepGuideBannerProps> = ({
  lang,
  theme = 'bright',
  latestDoc,
  onActionClick,
  onDismiss,
  isDismissed,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';

  if (isDismissed || !latestDoc) {
    return null;
  }

  // Determine suggestion based on the latest document's status
  let message = t.stepGenCompleted;
  let nextAction = t.stepGenNextAction;
  let actionType = 'sign_submit';
  let badgeColor = isBright
    ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold'
    : 'bg-blue-500/20 text-blue-300 border-blue-500/30 font-medium';

  if (latestDoc.estado === 'firmado') {
    message = lang === 'en'
      ? `Invoice ${latestDoc.consecutivo} is signed with XAdES-EPES cryptographic key.`
      : `Factura ${latestDoc.consecutivo} está firmada con llave XAdES-EPES.`;
    nextAction = lang === 'en'
      ? 'Next Step: Transmit base64 XML package to Ministerio de Hacienda Sandbox.'
      : 'Siguiente Paso: Transmitir el paquete XML base64 al Sandbox del Ministerio de Hacienda.';
    actionType = 'sign_submit';
    badgeColor = isBright
      ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold'
      : 'bg-blue-500/20 text-blue-300 border-blue-500/30 font-medium';
  } else if (latestDoc.estado === 'procesando') {
    message = t.stepSubCompleted;
    nextAction = t.stepSubNextAction;
    actionType = 'check_async';
    badgeColor = isBright
      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
      : 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-medium';
  } else if (latestDoc.estado === 'aceptado') {
    message = t.stepAppCompleted;
    nextAction = t.stepAppNextAction;
    actionType = 'view_xml';
    badgeColor = isBright
      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-medium';
  } else if (latestDoc.estado === 'error_envio' || latestDoc.estado === 'rechazado') {
    message = t.stepErrDetected;
    nextAction = t.stepErrNextAction;
    actionType = 'retry_transient';
    badgeColor = isBright
      ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
      : 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-medium';
  }

  return (
    <div
      className={`mb-6 rounded-xl border p-4 shadow-sm transition-all ${
        isBright
          ? 'bg-gradient-to-r from-blue-50 via-indigo-50/80 to-emerald-50/70 border-indigo-200 text-slate-800'
          : 'bg-gradient-to-r from-indigo-950/80 via-slate-900 to-emerald-950/50 border-indigo-500/40 text-slate-100 shadow-md'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div
            className={`p-2 rounded-lg shrink-0 mt-0.5 sm:mt-0 ${
              isBright ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/20 text-indigo-400'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${isBright ? 'text-indigo-700' : 'text-indigo-300'} animate-pulse`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isBright ? 'text-indigo-950 font-extrabold' : 'text-indigo-300'
                }`}
              >
                {t.guideTitle}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeColor}`}>
                {latestDoc.estado.toUpperCase()}
              </span>
            </div>
            <p className={`text-xs mt-1 font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>
              {message}
            </p>
            <p className={`text-xs mt-0.5 font-medium ${isBright ? 'text-indigo-950' : 'text-indigo-200'}`}>
              {nextAction}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
          {actionType === 'sign_submit' && (
            <button
              onClick={() => onActionClick('sign_submit', latestDoc.id)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Transmit to Sandbox' : 'Transmitir a Sandbox'}</span>
            </button>
          )}

          {actionType === 'check_async' && (
            <button
              onClick={() => onActionClick('check_async', latestDoc.id)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Query Status' : 'Consultar Estado'}</span>
            </button>
          )}

          {actionType === 'view_xml' && (
            <button
              onClick={() => onActionClick('view_xml', latestDoc.id)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'View Accepted XML' : 'Ver XML Aceptado'}</span>
            </button>
          )}

          {actionType === 'retry_transient' && (
            <button
              onClick={() => onActionClick('retry_transient', latestDoc.id)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Retry Now' : 'Reintentar Ahora'}</span>
            </button>
          )}

          <button
            onClick={onDismiss}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isBright ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={t.guideDismiss}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
