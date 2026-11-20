import React, { useState } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Gauge,
  CheckCircle2,
  Trash2,
  Sliders,
} from 'lucide-react';
import type { StationAlertNotification, AlertPreferences } from '../../types';

interface SmartAlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: StationAlertNotification[];
  onDismissAlert: (id: string) => void;
  onClearAll: () => void;
  preferences: AlertPreferences;
  onUpdatePreferences: (prefs: Partial<AlertPreferences>) => void;
}

export const SmartAlertDrawer: React.FC<SmartAlertDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onDismissAlert,
  onClearAll,
  preferences,
  onUpdatePreferences,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  if (!isOpen) return null;

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f172a] w-full max-w-md h-full border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="bg-[#111827] px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">Smart Corridor Alerts</h3>
              <p className="text-[11px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} new live updates` : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg border transition ${
                showSettings
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500'
                  : 'bg-[#162032] text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Alert Preferences"
            >
              <Sliders size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Alert Preferences Settings Panel (Collapsible) */}
        {showSettings && (
          <div className="bg-[#0b1322] p-4 border-b border-slate-800 space-y-3 text-xs">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10.5px]">
              Alert Subscriptions &amp; Notification Triggers
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Configure which real-world events trigger route notifications:
            </p>

            <div className="space-y-2 pt-1">
              {[
                {
                  id: 'queueSpikes',
                  label: 'Significant Queue Buildup',
                  sub: 'Alert when queue spikes by +3 or more vehicles',
                },
                {
                  id: 'stationClosure',
                  label: 'Station Closure & Out-of-Stock',
                  sub: 'Urgent alert if pump closes or runs out of gas',
                },
                {
                  id: 'pressureDrops',
                  label: 'Compressor Pressure Drops',
                  sub: 'Alert if pressure dips below 165 Bar (slow fill)',
                },
                {
                  id: 'infoChanges',
                  label: 'Operating & Nozzle Changes',
                  sub: 'Alert on active nozzle reductions or price adjustments',
                },
              ].map((item) => (
                <label
                  key={item.id}
                  className="flex items-start justify-between gap-3 p-2 rounded-xl bg-[#162032] border border-slate-800 cursor-pointer hover:border-slate-700"
                >
                  <div>
                    <span className="font-bold text-white block">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block">{item.sub}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={(preferences as any)[item.id]}
                    onChange={(e) =>
                      onUpdatePreferences({ [item.id]: e.target.checked } as any)
                    }
                    className="accent-emerald-500 rounded mt-1"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Alert List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#162032] border border-slate-800 flex items-center justify-center text-slate-500 text-2xl">
                🛡️
              </div>
              <h4 className="font-extrabold text-sm text-slate-200">No Active Alerts</h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                All highway stations on your corridor are currently operating within normal parameters. Alerts trigger automatically when real updates occur.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isCritical = alert.severity === 'CRITICAL';
              const isWarning = alert.severity === 'WARNING';

              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl p-3.5 border transition shadow-md relative space-y-1.5 ${
                    isCritical
                      ? 'bg-red-950/40 border-red-500/40'
                      : isWarning
                      ? 'bg-amber-950/40 border-amber-500/40'
                      : 'bg-[#162032] border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      {isCritical ? (
                        <XCircle size={15} className="text-red-400 flex-shrink-0" />
                      ) : isWarning ? (
                        <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
                      ) : (
                        <TrendingUp size={15} className="text-blue-400 flex-shrink-0" />
                      )}
                      <span className={isCritical ? 'text-red-300' : isWarning ? 'text-amber-300' : 'text-blue-300'}>
                        {alert.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDismissAlert(alert.id)}
                      className="text-slate-500 hover:text-slate-300 p-1"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">{alert.message}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>📍 {alert.stationName}</span>
                    <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {alerts.length > 0 && (
          <div className="p-3 bg-[#111827] border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">{alerts.length} Total Notification(s)</span>
            <button
              type="button"
              onClick={onClearAll}
              className="text-slate-400 hover:text-red-400 font-bold transition flex items-center gap-1 text-[11px]"
            >
              <Trash2 size={12} />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartAlertDrawer;
