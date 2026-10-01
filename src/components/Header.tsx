/**
 * @file src/components/Header.tsx
 * @description Main application navigation header with theme switching (Dark / Bright),
 * language switching (EN / ES), multi-company session switcher, and user role profile.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Bell,
  RefreshCw,
  FileCheck,
  Key,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  Trash2,
  Sun,
  Moon,
  Globe,
  Building,
  ChevronDown,
  Plus,
  User as UserIcon,
  LogOut,
  LogIn,
  Calculator,
  Scale,
  Shield,
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { Company, NotificationItem, User } from '../types';

interface HeaderProps {
  lang: Language;
  theme: 'dark' | 'bright';
  company: Company | null;
  companies: Company[];
  user: User | null;
  notifications: NotificationItem[];
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onSelectCompany: (companyId: string) => void;
  onOpenNewCompany: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  onOpenReports: () => void;
  onOpenTestScenarios: () => void;
  onClearNotifications: () => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  theme,
  company,
  companies,
  user,
  notifications,
  onToggleTheme,
  onToggleLang,
  onSelectCompany,
  onOpenNewCompany,
  onOpenAuth,
  onSignOut,
  onOpenSettings,
  onOpenReports,
  onOpenTestScenarios,
  onClearNotifications,
  onRefreshAll,
  isRefreshing,
}) => {
  const t = translations[lang];
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'accountant':
        return <Calculator className="w-3.5 h-3.5 text-blue-400" />;
      case 'lawyer':
        return <Scale className="w-3.5 h-3.5 text-indigo-400" />;
      case 'admin':
      default:
        return <Shield className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'accountant':
        return t.roleAccountant;
      case 'lawyer':
        return t.roleLawyer;
      case 'admin':
      default:
        return t.roleAdmin;
    }
  };

  return (
    <header className={`${theme === 'bright' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'} border-b sticky top-0 z-40 shadow-sm transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Costa Rica Ministry of Finance Emblem */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-md shrink-0">
              <div className={`w-full h-full ${theme === 'bright' ? 'bg-white text-emerald-600' : 'bg-slate-900 text-emerald-400'} rounded-[7px] flex items-center justify-center font-bold text-base tracking-wider`}>
                CR
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`font-bold text-base sm:text-lg tracking-tight ${theme === 'bright' ? 'text-slate-900' : 'text-slate-100'}`}>
                  {t.appTitle}
                </span>
                <span className="text-[10px] px-2 py-0.5 font-mono font-medium rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {t.versionBadge}
                </span>
              </div>
              <p className={`text-xs ${theme === 'bright' ? 'text-slate-500' : 'text-slate-400'} hidden sm:block`}>
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Active Company Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowCompanyMenu(!showCompanyMenu)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center space-x-2 transition-colors ${
                theme === 'bright'
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block font-normal leading-none">{t.currentCompany}</span>
                <span className="font-semibold truncate max-w-[170px] block leading-tight">{company?.nombre || 'Seleccionar Empresa'}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
            </button>

            {showCompanyMenu && (
              <div className={`absolute left-0 mt-2 w-72 rounded-xl shadow-2xl border z-50 overflow-hidden ${
                theme === 'bright' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'
              }`}>
                <div className={`p-2.5 border-b text-[11px] font-semibold uppercase tracking-wider flex justify-between items-center ${
                  theme === 'bright' ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}>
                  <span>{t.switchCompany}</span>
                  <button
                    onClick={() => {
                      setShowCompanyMenu(false);
                      onOpenNewCompany();
                    }}
                    className="text-emerald-500 hover:text-emerald-600 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{lang === 'en' ? 'New' : 'Nueva'}</span>
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800">
                  {companies.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        onSelectCompany(c.id);
                        setShowCompanyMenu(false);
                      }}
                      className={`p-2.5 text-xs cursor-pointer transition-colors ${
                        c.id === company?.id
                          ? (theme === 'bright' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'bg-emerald-500/10 text-emerald-300 font-semibold')
                          : (theme === 'bright' ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-slate-800/60 text-slate-300')
                      }`}
                    >
                      <div className="truncate">{c.nombre}</div>
                      <span className="text-[10px] text-slate-400 font-mono">Cédula: {c.cedula}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Tools: Language, Theme, User Pill, Notifications */}
          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <button
              onClick={onToggleLang}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                theme === 'bright'
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
              title="Switch language between English and Spanish"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>{lang === 'es' ? 'EN' : 'ES'}</span>
            </button>

            {/* Bright / Dark Theme Switcher */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-lg border transition-colors ${
                theme === 'bright'
                  ? 'bg-slate-100 border-slate-200 text-amber-600 hover:bg-slate-200/70'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title={t.themeToggle}
            >
              {theme === 'bright' ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center space-x-1.5 transition-colors ${
                  theme === 'bright'
                    ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200/70'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                {getRoleIcon(user?.role)}
                <span className="font-semibold hidden lg:inline max-w-[120px] truncate">{user?.name || 'Usuario'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl border z-50 overflow-hidden ${
                  theme === 'bright' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}>
                  <div className="p-3 border-b border-slate-800">
                    <span className="text-xs font-bold block truncate">{user?.name}</span>
                    <span className="text-[11px] text-slate-400 block truncate">{user?.email}</span>
                    <span className="mt-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {getRoleLabel(user?.role)}
                    </span>
                    {user?.licenseNumber && (
                      <span className="text-[10px] font-mono text-slate-500 block mt-1">
                        {user.licenseNumber}
                      </span>
                    )}
                  </div>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenAuth();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-slate-800/50 flex items-center space-x-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lang === 'en' ? 'Switch User / Sign In' : 'Cambiar Usuario / Entrar'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-rose-500/10 text-rose-400 flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.signOut}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings & Credentials */}
            <button
              onClick={onOpenSettings}
              className={`p-2 rounded-lg border transition-colors ${
                theme === 'bright'
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Configuración de Hacienda y Certificado .p12"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg border transition-colors ${
                  theme === 'bright'
                    ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
                title="Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl border z-50 overflow-hidden ${
                  theme === 'bright' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}>
                  <div className={`p-3 border-b flex items-center justify-between ${
                    theme === 'bright' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
                  }`}>
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Notificaciones ({notifications.length})
                    </span>
                    {notifications.length > 0 && (
                      <button onClick={onClearNotifications} className="text-xs text-slate-400 hover:text-rose-400 flex items-center space-x-1">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Limpiar</span>
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        {lang === 'en' ? 'No pending notifications.' : 'No hay notificaciones pendientes.'}
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div key={item.id} className="p-3 hover:bg-slate-800/40 text-xs flex items-start space-x-2.5">
                          {item.type === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
                          {item.type === 'ERROR' && <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold">{item.title}</div>
                            <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-2">{item.message}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(item.timestamp).toLocaleTimeString('es-CR')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
