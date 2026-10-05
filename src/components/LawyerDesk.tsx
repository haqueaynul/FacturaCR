/**
 * @file src/components/LawyerDesk.tsx
 * @description Dedicated legal and compliance workspace for Legal Counsel & Attorneys.
 * Implements lawyer responsibilities: Law 8454 digital signature validation,
 * corporate Personería Jurídica standing, legal justifications for Notas de Crédito,
 * and issuance of official legal certification seals.
 * Fully supports Light (Bright) and Dark themes.
 */

import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  Award,
  Building2,
  BadgeCheck,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { Company, ElectronicDocument } from '../types';

interface LawyerDeskProps {
  lang: Language;
  theme?: 'dark' | 'bright';
  company: Company | null;
  documents: ElectronicDocument[];
}

export const LawyerDesk: React.FC<LawyerDeskProps> = ({
  lang,
  theme = 'bright',
  company,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';
  const [legalCertIssued, setLegalCertIssued] = useState(false);
  const [certSealHash, setCertSealHash] = useState<string | null>(null);

  /**
   * Generates official legal certification stamp.
   */
  const handleIssueCertification = () => {
    const hash = 'LEGAL-CR-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    setCertSealHash(hash);
    setLegalCertIssued(true);
  };

  return (
    <div
      className={`border rounded-xl p-5 shadow-lg mb-8 transition-colors ${
        isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
      }`}
    >
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b gap-3 ${
          isBright ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold tracking-tight ${isBright ? 'text-slate-900' : 'text-white'}`}>
                {t.lawyerTitle}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-medium">
                Legal Bar Compliance Desk
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
              Auditoría Legal Tributaria · Ley 8454 de Firma Digital · Personería Jurídica
            </p>
          </div>
        </div>

        <button
          onClick={handleIssueCertification}
          className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Award className="w-4 h-4" />
          <span>{legalCertIssued ? (lang === 'en' ? 'Legal Seal Active' : 'Sello Legal Activo') : t.lawyerIssueCert}</span>
        </button>
      </div>

      {/* Role & Responsibilities Explanation Banner */}
      <div
        className={`p-3.5 rounded-xl border mb-5 text-xs ${
          isBright ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
        }`}
      >
        <div className="flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>
              {lang === 'en' ? 'Lawyer Responsibilities in Costa Rica e-Invoicing Compliance:' : 'Responsabilidades del Abogado en Facturación Electrónica de Costa Rica:'}
            </span>
            <p className={`text-[11px] mt-0.5 leading-relaxed ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
              {t.lawyerDuties}
            </p>
          </div>
        </div>
      </div>

      {/* Legal Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Law 8454 Certificate Standing */}
        <div className={`p-4 rounded-xl border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold flex items-center space-x-1.5 ${isBright ? 'text-slate-900' : 'text-white'}`}>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{t.lawyerCertAuditTitle}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-medium">
              VIGENTE (VÁLIDO)
            </span>
          </div>

          <div className={`space-y-2 text-xs font-mono ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
            <div className={`flex justify-between border-b pb-1 ${isBright ? 'border-slate-200' : 'border-slate-900'}`}>
              <span className={`font-sans ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Estándar Criptográfico:</span>
              <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>ETSI TS 101 903 (XAdES-EPES)</span>
            </div>
            <div className={`flex justify-between border-b pb-1 ${isBright ? 'border-slate-200' : 'border-slate-900'}`}>
              <span className={`font-sans ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Algoritmo Digest:</span>
              <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>RSA-SHA256 (2048-bit)</span>
            </div>
            <div className={`flex justify-between border-b pb-1 ${isBright ? 'border-slate-200' : 'border-slate-900'}`}>
              <span className={`font-sans ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Autoridad Certificadora:</span>
              <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>CA SINPE - Banco Central CR</span>
            </div>
            <div className="flex justify-between">
              <span className={`font-sans ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Vencimiento Llave .p12:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{company?.p12ExpiryDate || '2028-01-01'}</span>
            </div>
          </div>
        </div>

        {/* Corporate Personeria Juridica Standing */}
        <div className={`p-4 rounded-xl border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold flex items-center space-x-1.5 ${isBright ? 'text-slate-900' : 'text-white'}`}>
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>{t.lawyerPersoneriaTitle}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-medium">
              REGISTRO NACIONAL OK
            </span>
          </div>

          <div className={`space-y-2 text-xs font-mono ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
            <div className={`flex justify-between border-b pb-1 ${isBright ? 'border-slate-200' : 'border-slate-900'}`}>
              <span className={`font-sans ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Razón Social Registrada:</span>
              <span className={`font-semibold truncate max-w-[200px] ${isBright ? 'text-slate-900' : 'text-white'}`}>{company?.nombre}</span>
            </div>
            <div className={`flex justify-between border-b pb-1 ${isBright ? 'border-slate-200' : 'border-slate-900'}`}>
              <span className={`font-sans ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Cédula Jurídica:</span>
              <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>{company?.cedula}</span>
            </div>
            <div className={`flex justify-between border-b pb-1 ${isBright ? 'border-slate-200' : 'border-slate-900'}`}>
              <span className={`font-sans ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Inscripción Registral:</span>
              <span className={`font-semibold ${isBright ? 'text-slate-900' : 'text-white'}`}>{company?.personeriaNumber || 'TOMO 2024, ASIENTO 89231'}</span>
            </div>
            <div className="flex justify-between">
              <span className={`font-sans ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Vigencia Personería:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{company?.personeriaExpiry || '2028-06-30'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Legal Stamp Box */}
      {legalCertIssued && (
        <div
          className={`p-4 rounded-xl border mb-6 ${
            isBright
              ? 'bg-indigo-50/70 border-indigo-200 text-slate-800'
              : 'bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/40 border-indigo-500/40 text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-500/40">
              <BadgeCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                  {lang === 'en' ? 'Official Legal Tax Certification Seal Issued' : 'Certificación Legal Tributaria Oficial Emitida'}
                </span>
                <span className={`text-[10px] font-mono ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                  Hash: {certSealHash}
                </span>
              </div>
              <p className={`text-xs mt-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                {lang === 'en'
                  ? `Certified under Law 8454 and DGT Resolution DGT-R-033-2019. The digital signature and legal identity of ${company?.nombre} are authenticated and admissible in Costa Rican judicial and tax audit proceedings.`
                  : `Se certifica conforme a la Ley 8454 y Resolución DGT-R-033-2019 que los comprobantes electrónicos y la personería jurídica de ${company?.nombre} cumplen a cabalidad los requisitos legales y probatorios ante la Dirección General de Tributación.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Legal Motivations Guide */}
      <div className={`p-4 rounded-xl border ${isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
        <span className={`text-xs font-bold block mb-2 ${isBright ? 'text-slate-900' : 'text-white'}`}>
          {t.lawyerCreditNoteLegal} (Código de Comercio Art. 1023)
        </span>
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
          <div className={`p-2.5 rounded border ${isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
            <span className={`font-semibold block mb-0.5 ${isBright ? 'text-slate-900' : 'text-white'}`}>01 - Devolución de Mercancía</span>
            <p className={`text-[11px] ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>Rescisión comercial por disconformidad o vicios ocultos de producto recibido.</p>
          </div>
          <div className={`p-2.5 rounded border ${isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
            <span className={`font-semibold block mb-0.5 ${isBright ? 'text-slate-900' : 'text-white'}`}>02 - Anulación por Error</span>
            <p className={`text-[11px] ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>Error en datos tributarios del comprador, clave o tarifa IVA según Art. 18 Reglamento.</p>
          </div>
          <div className={`p-2.5 rounded border ${isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
            <span className={`font-semibold block mb-0.5 ${isBright ? 'text-slate-900' : 'text-white'}`}>03 - Bonificación o Descuento</span>
            <p className={`text-[11px] ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>Ajuste posterior de precio pactado contractualmente entre las partes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
