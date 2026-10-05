/**
 * @file src/components/AuthModal.tsx
 * @description Authentication modal providing user Sign In, Sign Up, and quick user switching.
 * Supports distinct professional roles (Accountants, Lawyers, Admins) with license credentials.
 * Fully supports Light (Bright) and Dark themes.
 */

import React, { useState } from 'react';
import {
  X,
  UserCheck,
  KeyRound,
  Mail,
  Shield,
  Calculator,
  Scale,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { User, UserRole } from '../types';

interface AuthModalProps {
  lang: Language;
  theme?: 'dark' | 'bright';
  currentUser: User | null;
  onSignIn: (email: string, password?: string) => Promise<void>;
  onSignUp: (name: string, email: string, password?: string, role?: string, licenseNumber?: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  lang,
  theme = 'bright',
  onSignIn,
  onSignUp,
  onClose,
  isSubmitting,
}) => {
  const t = translations[lang];
  const isBright = theme === 'bright';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('accountant');
  const [licenseNumber, setLicenseNumber] = useState('');

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await onSignIn(email, password);
    onClose();
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    await onSignUp(name, email, password, role, licenseNumber);
    onClose();
  };

  return (
    <div className={`fixed inset-0 ${isBright ? 'bg-slate-900/50' : 'bg-black/80'} backdrop-blur-xs flex items-center justify-center z-50 p-4`}>
      <div
        className={`border rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl transition-colors ${
          isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isBright ? 'text-slate-900' : 'text-white'}`}>
                {mode === 'signin' ? t.signIn : t.signUp}
              </h3>
              <p className={`text-xs ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
                {lang === 'en' ? 'Multi-user access with Accountant & Lawyer roles' : 'Acceso multi-usuario con roles de Contador y Abogado'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isBright ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Account Switcher */}
        <div
          className={`p-4 border-b ${
            isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
            {lang === 'en' ? 'Quick Demo Login / Fast Switch:' : 'Acceso Rápido de Demostración:'}
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                onSignIn('admin@hacienda-hub.cr', 'adminPassword123!');
                onClose();
              }}
              className={`p-2 rounded-lg text-left transition-colors border cursor-pointer ${
                isBright
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400 text-xs font-semibold">
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </div>
              <span className={`text-[10px] block truncate ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Superuser</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSignIn('contador@finanzascr.com', 'accountantPass123!');
                onClose();
              }}
              className={`p-2 rounded-lg text-left transition-colors border cursor-pointer ${
                isBright
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                <Calculator className="w-3 h-3" />
                <span>Contador</span>
              </div>
              <span className={`text-[10px] block truncate ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>CPA #18920</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSignIn('abogado@bufetecr.com', 'lawyerPass123!');
                onClose();
              }}
              className={`p-2 rounded-lg text-left transition-colors border cursor-pointer ${
                isBright
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                <Scale className="w-3 h-3" />
                <span>Abogado</span>
              </div>
              <span className={`text-[10px] block truncate ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Bar #24105</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 font-sans text-xs">
          {mode === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                  {lang === 'en' ? 'Email Address' : 'Correo Electrónico'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@finanzas.cr"
                    className={`w-full rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none border ${
                      isBright
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                  <Mail className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isBright ? 'text-slate-400' : 'text-slate-400'}`} />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                  {lang === 'en' ? 'Password' : 'Contraseña'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none border ${
                      isBright
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                  <KeyRound className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isBright ? 'text-slate-400' : 'text-slate-400'}`} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (lang === 'en' ? 'Authenticating...' : 'Iniciando...') : t.signIn}
              </button>

              <div className={`pt-2 text-center text-xs ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                {lang === 'en' ? "Don't have an account?" : '¿No tienes cuenta?'}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold ml-1.5 cursor-pointer"
                >
                  {t.signUp}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                  {lang === 'en' ? 'Full Name' : 'Nombre Completo'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lic. Mario Vargas"
                  className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                    isBright
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                  {lang === 'en' ? 'Professional Role' : 'Rol Profesional'}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                    isBright
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="accountant">Contador Público / Privado (CPA)</option>
                  <option value="lawyer">Abogado / Asesor Legal Tributario</option>
                  <option value="admin">Administrador General</option>
                </select>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                  {lang === 'en' ? 'License / Bar Number' : 'Número de Carnet / Colegiatura'}
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="CPA-18920 / Abogados-24105"
                  className={`w-full rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none border ${
                    isBright
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                  {lang === 'en' ? 'Email Address' : 'Correo Electrónico'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@dominio.cr"
                  className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                    isBright
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                  {lang === 'en' ? 'Password' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border ${
                    isBright
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (lang === 'en' ? 'Creating...' : 'Creando...') : t.signUp}
              </button>

              <div className={`pt-2 text-center text-xs ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                {lang === 'en' ? 'Already have an account?' : '¿Ya tienes cuenta?'}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold ml-1.5 cursor-pointer"
                >
                  {t.signIn}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
