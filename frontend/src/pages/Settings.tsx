import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  RotateCcw,
  Info,
  Key,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Bell,
  Award,
  TrendingUp,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getStoredGoogleApiKey, storeGoogleApiKey, resetGoogleMapsLoader } from '../services/googleMapsLoader';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-700'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-lg overflow-hidden text-slate-100">
      <div className="bg-[#0c1220] border-b border-slate-800 px-6 py-3.5">
        <h2 className="font-extrabold text-white text-xs uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const {
    settings,
    updateSettings,
    clearSelection,
    driverProfile,
    visitedStations,
    updateAlertPreferences,
  } = useAppContext();
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState(getStoredGoogleApiKey());
  const [saved, setSaved] = useState(false);

  const save = (patch: any) => {
    updateSettings(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveApiKey = () => {
    storeGoogleApiKey(apiKey);
    resetGoogleMapsLoader();
    save({ googleMapsApiKey: apiKey, mapProvider: 'google' });
  };

  const handleClearApiKey = () => {
    setApiKey('');
    storeGoogleApiKey('');
    resetGoogleMapsLoader();
    save({ googleMapsApiKey: '' });
  };

  const resetAll = () => {
    localStorage.clear();
    clearSelection();
    navigate('/');
    window.location.reload();
  };

  const alertPrefs = settings.alertPreferences;
  const accuracyRate =
    driverProfile.totalReportsSubmitted > 0
      ? Math.round((driverProfile.acceptedReports / driverProfile.totalReportsSubmitted) * 100)
      : 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Settings &amp; Driver Profile</h1>
          <p className="text-xs text-slate-400 mt-0.5">Configure maps, smart corridor alerts, and trust credentials</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-300 animate-in fade-in">
            <CheckCircle2 size={16} /> Settings saved successfully
          </div>
        )}
      </div>

      {/* 🛡️ SECTION 5: DRIVER TRUST AND REPORT VERIFICATION */}
      <Section title="🏅 Driver Trust & Contributor Profile">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#0a1526] rounded-2xl border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg border border-white/20">
                <UserCheck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Driver {driverProfile.driverId}
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {driverProfile.trustBadge.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Verified Mobility Contributor • {visitedStations.length} Stations Verified
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Trust Reliability</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-400">{driverProfile.trustScore}%</span>
                <span className="text-[11px] text-slate-400">score</span>
              </div>
            </div>
          </div>

          {/* Trust Score Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1 font-bold text-slate-400">
              <span>Contributor Reliability Index</span>
              <span className="text-emerald-400">{accuracyRate}% Accuracy Rate</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${driverProfile.trustScore}%` }}
              />
            </div>
          </div>

          {/* Stats 4-box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#0c1220] p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Reports</span>
              <span className="text-base font-extrabold text-white mt-0.5 block">
                {driverProfile.totalReportsSubmitted}
              </span>
            </div>
            <div className="bg-[#0c1220] p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Accepted</span>
              <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">
                {driverProfile.acceptedReports}
              </span>
            </div>
            <div className="bg-[#0c1220] p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Rejected / Outliers</span>
              <span className="text-base font-extrabold text-rose-400 mt-0.5 block">
                {driverProfile.rejectedReports}
              </span>
            </div>
            <div className="bg-[#0c1220] p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Visited Verified</span>
              <span className="text-base font-extrabold text-blue-400 mt-0.5 block">
                {visitedStations.length}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#131d2e] rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Abuse Prevention Policy: </strong>
            Trust score is earned through verified telemetry agreement and post-visit confirmations. Spammed reports, duplicate submissions within 10 minutes, or values outside physical safety limits (120–245 Bar) are rejected automatically.
          </div>
        </div>
      </Section>

      {/* 🔔 SECTION 4: SMART ALERT SYSTEM PREFERENCES */}
      <Section title="🔔 Smart Highway Alert Preferences">
        <div className="space-y-4">
          <SettingRow
            label="Queue Spike Alerts"
            description="Notify when wait queue jumps by 3 or more vehicles unexpectedly"
          >
            <Toggle
              checked={alertPrefs.queueSpikes}
              onChange={(v) => updateAlertPreferences({ queueSpikes: v })}
            />
          </SettingRow>

          <SettingRow
            label="Station Closure & Out-of-Stock Alerts"
            description="High-priority instant notification when a station goes offline or runs out of gas"
          >
            <Toggle
              checked={alertPrefs.stationClosure}
              onChange={(v) => updateAlertPreferences({ stationClosure: v })}
            />
          </SettingRow>

          <SettingRow
            label="Pressure Drop Alerts"
            description="Alert when compressor bank pressure falls below 165 Bar (slow pumping)"
          >
            <Toggle
              checked={alertPrefs.pressureDrops}
              onChange={(v) => updateAlertPreferences({ pressureDrops: v })}
            />
          </SettingRow>

          <SettingRow
            label="Station Metadata Changes"
            description="Notify when operating hours, nozzle count, or CNG price updates"
          >
            <Toggle
              checked={alertPrefs.infoChanges}
              onChange={(v) => updateAlertPreferences({ infoChanges: v })}
            />
          </SettingRow>
        </div>
      </Section>

      {/* Google Maps Configuration */}
      <Section title="🗺️ Google Maps JavaScript API">
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Enter your Google Cloud Maps API key to activate full Google Vector Maps, Live Road Traffic Layer, and Directions Services.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              API Key (Places &amp; Directions Enabled)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-slate-700 bg-[#162032] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md"
              >
                Save Key
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  className="px-3 py-2.5 rounded-xl border border-slate-700 bg-[#162032] text-slate-300 hover:text-white font-bold text-xs transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#131d2e] border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <ShieldCheck size={16} />
              <span>Need a Google Maps Key?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enable <strong>Maps JavaScript API</strong>, <strong>Directions API</strong>, and <strong>Places API</strong> on Google Cloud Console and paste the generated key above. Without a key, the app continues working on the high-tech Dark OpenStreetMap engine.
            </p>
          </div>
        </div>
      </Section>

      {/* Telemetry Preferences */}
      <Section title="⚡ Telemetry & Simulation Preferences">
        <SettingRow
          label="Live SCADA Telemetry Simulator"
          description="Simulates periodic vehicle queue fluctuations and compressor pressure cycles"
        >
          <Toggle
            checked={settings.simulationEnabled ?? true}
            onChange={(v) => save({ simulationEnabled: v })}
          />
        </SettingRow>

        <SettingRow
          label="Max Highway Detour Limit"
          description="Default maximum kilometer detour when filtering highway stations"
        >
          <span className="font-extrabold text-emerald-400 bg-[#162032] px-3 py-1 rounded-xl border border-slate-800 text-xs">
            {settings.maxDetourKm ?? 5} km
          </span>
        </SettingRow>
      </Section>

      {/* Danger Zone */}
      <Section title="⚠️ App Reset">
        <SettingRow
          label="Reset Local Application Cache"
          description="Clears all stored preferences, saved route history, and station selections"
        >
          <button
            type="button"
            onClick={resetAll}
            className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw size={13} />
            <span>Reset All Data</span>
          </button>
        </SettingRow>
      </Section>
    </div>
  );
}
