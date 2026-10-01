/**
 * @file src/components/Header.tsx
 * @description Main application navigation header displaying system environment,
 * IDP token status, cryptographic vault state, notifications drawer, and action shortcuts.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Bell,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  Key,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { TaxpayerConfig, NotificationItem } from '../types';

interface HeaderProps {
  taxpayer: TaxpayerConfig | null;
  notifications: NotificationItem[];
  onOpenSettings: () => void;
  onOpenReports: () => void;
  onOpenTestScenarios: () => void;
  onClearNotifications: () => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
}

/**
 * Header component with real-time sandbox status and compliance shortcuts.
 */
export const Header: React.FC<HeaderProps> = ({
  taxpayer,
  notifications,
  onOpenSettings,
  onOpenReports,
  onOpenTestScenarios,
  onClearNotifications,
  onRefreshAll,
  isRefreshing,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Costa Rica Ministry of Hacienda Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[7px] flex items-center justify-center font-bold text-emerald-400 text-lg tracking-wider">
                CR
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-100">
                  Factura Electrónica CR
                </span>
                <span className="text-xs px-2 py-0.5 font-mono font-medium rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v4.3 DGT
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Ministerio de Hacienda · Sistema Oficial de Emisión y Recepción
              </p>
            </div>
          </div>

          {/* Sandbox & Vault Status Badges */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Environment Badge */}
            <div
              onClick={onOpenSettings}
              className={`cursor-pointer px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1.5 border transition-all ${
                taxpayer?.useLiveSandbox
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
              }`}
            >
              <span className={`w-2 h-2 rounded-full animate-pulse ${taxpayer?.useLiveSandbox ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span>
                {taxpayer?.useLiveSandbox ? 'Sandbox ATV En Vivo (stag)' : 'Sandbox Simulador Inteligente'}
              </span>
            </div>

            {/* Cryptographic Vault Status */}
            <div
              onClick={onOpenSettings}
              title="Bóveda Criptográfica AES-256-GCM para llaves criptográficas .p12 y contraseñas ATV"
              className="cursor-pointer px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center space-x-1.5 hover:border-slate-600 transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-blue-400" />
              <span>XAdES-EPES PKCS#12</span>
            </div>

            <div
              title="Seguridad de datos cifrada en reposo y en tránsito"
              className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800/80 border border-slate-700 text-emerald-400 flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AES-256-GCM</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Quick Test Scenarios */}
            <button
              onClick={onOpenTestScenarios}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 rounded-lg hover:bg-indigo-600/50 transition-colors flex items-center space-x-1.5"
              title="Probar escenarios tributarios (13%, 4% Salud, 8% Turismo, Exportación, Reintentos 503)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Escenarios Sandbox</span>
            </button>

            {/* Reports D-104 */}
            <button
              onClick={onOpenReports}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center space-x-1.5"
              title="Ver reporte fiscal de IVA Débito vs Crédito (D-104)"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Reporte D-104</span>
            </button>

            {/* Config & Certificate */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/70 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
              title="Configuración de contribuyente y credenciales de Hacienda"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Refresh */}
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/70 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Sincronizar y actualizar estado"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-300 hover:text-white bg-slate-800/70 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
                title="Notificaciones en tiempo real"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-100">
                  <div className="p-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                        Alertas y Notificaciones ({notifications.length})
                      </span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearNotifications}
                        className="text-xs text-slate-400 hover:text-rose-400 flex items-center space-x-1"
                        title="Limpiar todas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Limpiar</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No hay notificaciones pendientes. Todos los envíos están sincronizados.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 hover:bg-slate-800/50 transition-colors text-xs flex items-start space-x-2.5"
                        >
                          {item.type === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
                          {item.type === 'ERROR' && <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />}
                          {item.type === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}
                          {item.type === 'INFO' && <HelpCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-200">{item.title}</div>
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
