/**
 * @file src/components/StepGuideBanner.tsx
 * @description Automated Next-Step Suggestion component.
 * Evaluates current workflow state and prompts beginner users with the exact next step to take,
 * providing one-click action buttons and plain-language explanations.
 */

import React from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Send,
  FileCode,
  Inbox,
  X,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { ElectronicDocument, DocumentStatus } from '../types';

interface StepGuideBannerProps {
  lang: Language;
  latestDoc?: ElectronicDocument;
  onActionClick: (actionType: string, docId?: string) => void;
  onDismiss: () => void;
  isDismissed: boolean;
}

export const StepGuideBanner: React.FC<StepGuideBannerProps> = ({
  lang,
  latestDoc,
  onActionClick,
  onDismiss,
  isDismissed,
}) => {
  const t = translations[lang];

  if (isDismissed || !latestDoc) {
    return null;
  }

  // Determine suggestion based on the latest document's status
  let message = t.stepGenCompleted;
  let nextAction = t.stepGenNextAction;
  let actionType = 'sign_submit';
  let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';

  if (latestDoc.estado === 'firmado') {
    message = lang === 'en'
      ? `Invoice ${latestDoc.consecutivo} is signed with XAdES-EPES cryptographic key.`
      : `Factura ${latestDoc.consecutivo} está firmada con llave XAdES-EPES.`;
    nextAction = lang === 'en'
      ? 'Next Step: Transmit base64 XML package to Ministerio de Hacienda Sandbox.'
      : 'Siguiente Paso: Transmitir el paquete XML base64 al Sandbox del Ministerio de Hacienda.';
    actionType = 'sign_submit';
  } else if (latestDoc.estado === 'procesando') {
    message = t.stepSubCompleted;
    nextAction = t.stepSubNextAction;
    actionType = 'check_async';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (latestDoc.estado === 'aceptado') {
    message = t.stepAppCompleted;
    nextAction = t.stepAppNextAction;
    actionType = 'view_xml';
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (latestDoc.estado === 'error_envio' || latestDoc.estado === 'rechazado') {
    message = t.stepErrDetected;
    nextAction = t.stepErrNextAction;
    actionType = 'retry_transient';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  }

  return (
    <div className="mb-6 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-emerald-950/30 p-4 shadow-md transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                {t.guideTitle}
              </span>
              <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${badgeColor}`}>
                {latestDoc.estado.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1 font-medium">
              {message}
            </p>
            <p className="text-xs text-indigo-300/90 mt-0.5">
              {nextAction}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
          {actionType === 'sign_submit' && (
            <button
              onClick={() => onActionClick('sign_submit', latestDoc.id)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Transmit to Sandbox' : 'Transmitir a Sandbox'}</span>
            </button>
          )}

          {actionType === 'check_async' && (
            <button
              onClick={() => onActionClick('check_async', latestDoc.id)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Query Status' : 'Consultar Estado'}</span>
            </button>
          )}

          {actionType === 'view_xml' && (
            <button
              onClick={() => onActionClick('view_xml', latestDoc.id)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'View Accepted XML' : 'Ver XML Aceptado'}</span>
            </button>
          )}

          {actionType === 'retry_transient' && (
            <button
              onClick={() => onActionClick('retry_transient', latestDoc.id)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Retry Now' : 'Reintentar Ahora'}</span>
            </button>
          )}

          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title={t.guideDismiss}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
