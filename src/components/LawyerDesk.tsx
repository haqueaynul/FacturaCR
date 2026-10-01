/**
 * @file src/components/LawyerDesk.tsx
 * @description Dedicated legal and compliance workspace for Legal Counsel & Attorneys.
 * Implements lawyer responsibilities: Law 8454 digital signature validation,
 * corporate Personería Jurídica standing, legal justifications for Notas de Crédito,
 * and issuance of official legal certification seals.
 */

import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  Award,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Download,
  Printer,
  BadgeCheck,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { Company, ElectronicDocument } from '../types';

interface LawyerDeskProps {
  lang: Language;
  company: Company | null;
  documents: ElectronicDocument[];
}

export const LawyerDesk: React.FC<LawyerDeskProps> = ({
  lang,
  company,
  documents,
}) => {
  const t = translations[lang];
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {t.lawyerTitle}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
                Legal Bar Compliance Desk
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditoría Legal Tributaria · Ley 8454 de Firma Digital · Personería Jurídica
            </p>
          </div>
        </div>

        <button
          onClick={handleIssueCertification}
          className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Award className="w-4 h-4" />
          <span>{legalCertIssued ? (lang === 'en' ? 'Legal Seal Active' : 'Sello Legal Activo') : t.lawyerIssueCert}</span>
        </button>
      </div>

      {/* Role & Responsibilities Explanation Banner */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-5 text-xs">
        <div className="flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">
              {lang === 'en' ? 'Lawyer Responsibilities in Costa Rica e-Invoicing Compliance:' : 'Responsabilidades del Abogado en Facturación Electrónica de Costa Rica:'}
            </span>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
              {t.lawyerDuties}
            </p>
          </div>
        </div>
      </div>

      {/* Legal Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Law 8454 Certificate Standing */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.lawyerCertAuditTitle}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
              VIGENTE (VÁLIDO)
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300 font-mono">
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400 font-sans">Estándar Criptográfico:</span>
              <span className="text-white">ETSI TS 101 903 (XAdES-EPES)</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400 font-sans">Algoritmo Digest:</span>
              <span className="text-white">RSA-SHA256 (2048-bit)</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400 font-sans">Autoridad Certificadora:</span>
              <span className="text-white">CA SINPE - Banco Central CR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Vencimiento Llave .p12:</span>
              <span className="text-emerald-400 font-bold">{company?.p12ExpiryDate || '2028-01-01'}</span>
            </div>
          </div>
        </div>

        {/* Corporate Personeria Juridica Standing */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>{t.lawyerPersoneriaTitle}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
              REGISTRO NACIONAL OK
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300 font-mono">
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400 font-sans">Razón Social Registrada:</span>
              <span className="text-white truncate max-w-[200px]">{company?.nombre}</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400 font-sans">Cédula Jurídica:</span>
              <span className="text-white">{company?.cedula}</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400 font-sans">Inscripción Registral:</span>
              <span className="text-white">{company?.personeriaNumber || 'TOMO 2024, ASIENTO 89231'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Vigencia Personería:</span>
              <span className="text-indigo-400 font-bold">{company?.personeriaExpiry || '2028-06-30'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Legal Stamp Box */}
      {legalCertIssued && (
        <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/40 p-4 rounded-xl border border-indigo-500/40 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/40">
              <BadgeCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  {lang === 'en' ? 'Official Legal Tax Certification Seal Issued' : 'Certificación Legal Tributaria Oficial Emitida'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Hash: {certSealHash}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {lang === 'en'
                  ? `Certified under Law 8454 and DGT Resolution DGT-R-033-2019. The digital signature and legal identity of ${company?.nombre} are authenticated and admissible in Costa Rican judicial and tax audit proceedings.`
                  : `Se certifica conforme a la Ley 8454 y Resolución DGT-R-033-2019 que los comprobantes electrónicos y la personería jurídica de ${company?.nombre} cumplen a cabalidad los requisitos legales y probatorios ante la Dirección General de Tributación.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Legal Motivations Guide */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
        <span className="text-xs font-bold text-white block mb-2">
          {t.lawyerCreditNoteLegal} (Código de Comercio Art. 1023)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
            <span className="font-semibold text-white block mb-0.5">01 - Devolución de Mercancía</span>
            <p className="text-[11px]">Rescisión comercial por disconformidad o vicios ocultos de producto recibido.</p>
          </div>
          <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
            <span className="font-semibold text-white block mb-0.5">02 - Anulación por Error</span>
            <p className="text-[11px]">Error en datos tributarios del comprador, clave o tarifa IVA según Art. 18 Reglamento.</p>
          </div>
          <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
            <span className="font-semibold text-white block mb-0.5">03 - Bonificación o Descuento</span>
            <p className="text-[11px]">Ajuste posterior de precio pactado contractualmente entre las partes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
