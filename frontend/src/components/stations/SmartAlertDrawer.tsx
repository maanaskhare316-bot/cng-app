import React, { useState } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Sliders,
  Trash2,
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
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full border-l border-[#E3EAF0] shadow-2xl flex flex-col text-[#243447] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-[#E3EAF0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#FFF2DB] text-[#98651C] rounded-xl border border-[#FFE2A4]">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#14283F]">Smart Corridor Alerts</h3>
              <p className="text-[11px] text-[#718096]">
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
                  ? 'bg-[#E3F4EC] text-[#26734D] border-[#26734D]/30'
                  : 'bg-[#F4F7FA] text-[#718096] border-[#E3EAF0] hover:text-[#14283F]'
              }`}
              title="Alert Preferences"
            >
              <Sliders size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#718096] hover:text-[#14283F] hover:bg-[#F4F7FA] transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Alert Preferences Settings Panel (Collapsible) */}
        {showSettings && (
          <div className="bg-[#F4F7FA] p-4 border-b border-[#E3EAF0] space-y-3 text-xs">
            <div className="font-bold text-[#14283F] uppercase tracking-wider text-[10.5px]">
              Alert Subscriptions &amp; Notification Triggers
            </div>
            <p className="text-[11px] text-[#718096] leading-relaxed">
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
                  className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-white border border-[#E3EAF0] cursor-pointer hover:border-[#16B8C9] transition"
                >
                  <div>
                    <span className="font-bold text-[#14283F] block">{item.label}</span>
                    <span className="text-[10px] text-[#718096] block">{item.sub}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={(preferences as any)[item.id]}
                    onChange={(e) =>
                      onUpdatePreferences({ [item.id]: e.target.checked } as any)
                    }
                    className="accent-[#16B8C9] rounded mt-1"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Alert List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#718096] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F4F7FA] border border-[#E3EAF0] flex items-center justify-center text-[#718096] text-2xl">
                🛡️
              </div>
              <h4 className="font-extrabold text-sm text-[#14283F]">No Active Alerts</h4>
              <p className="text-xs text-[#718096] max-w-xs leading-relaxed">
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
                  className={`rounded-[14px] p-3.5 border transition shadow-sm relative space-y-1.5 ${
                    isCritical
                      ? 'bg-[#FCEAEA] border-[#F4BBBB]'
                      : isWarning
                      ? 'bg-[#FFF2DB] border-[#FFE2A4]'
                      : 'bg-[#F4F7FA] border-[#E3EAF0]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      {isCritical ? (
                        <XCircle size={15} className="text-[#B54747] flex-shrink-0" />
                      ) : isWarning ? (
                        <AlertTriangle size={15} className="text-[#98651C] flex-shrink-0" />
                      ) : (
                        <TrendingUp size={15} className="text-[#16B8C9] flex-shrink-0" />
                      )}
                      <span className={isCritical ? 'text-[#B54747]' : isWarning ? 'text-[#98651C]' : 'text-[#14283F]'}>
                        {alert.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDismissAlert(alert.id)}
                      className="text-[#718096] hover:text-[#14283F] p-1"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <p className="text-xs text-[#243447] leading-relaxed">{alert.message}</p>

                  <div className="flex items-center justify-between text-[10px] text-[#718096] pt-1">
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
          <div className="p-3 bg-white border-t border-[#E3EAF0] flex items-center justify-between text-xs">
            <span className="text-[#718096]">{alerts.length} Total Notification(s)</span>
            <button
              type="button"
              onClick={onClearAll}
              className="text-[#718096] hover:text-[#B54747] font-bold transition flex items-center gap-1 text-[11px]"
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
