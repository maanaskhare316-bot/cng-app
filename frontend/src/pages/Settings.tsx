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
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#16B8C9]' : 'bg-[#E3EAF0]'}`}
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
    <div className="bg-white rounded-[14px] border border-[#E3EAF0] shadow-sm overflow-hidden">
      <div className="bg-[#F4F7FA] border-b border-[#E3EAF0] px-6 py-3.5">
        <h2 className="font-extrabold text-[#14283F] text-xs uppercase tracking-wider">{title}</h2>
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
        <p className="text-sm font-bold text-[#243447]">{label}</p>
        {description && <p className="text-xs text-[#718096] mt-0.5">{description}</p>}
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
    <div className="max-w-3xl mx-auto space-y-6 pb-16 text-[#243447]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#14283F]">Settings &amp; Driver Profile</h1>
          <p className="text-xs text-[#718096] mt-0.5">Configure maps, smart corridor alerts, and trust credentials</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 bg-[#E3F4EC] border border-[#C0E4D0] rounded-xl px-3 py-1.5 text-xs font-bold text-[#26734D] animate-in fade-in">
            <CheckCircle2 size={16} /> Settings saved successfully
          </div>
        )}
      </div>

      {/* 🛡️ SECTION: DRIVER TRUST AND REPORT VERIFICATION */}
      <Section title="🏅 Driver Trust &amp; Contributor Profile">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#F4F7FA] rounded-2xl border border-[#E3EAF0]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#14283F] flex items-center justify-center text-white text-xl shadow-sm">
                <UserCheck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-[#14283F]">
                    Driver {driverProfile.driverId}
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#E3F4EC] text-[#26734D] border border-[#C0E4D0]">
                    {driverProfile.trustBadge.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-[#718096] mt-0.5">
                  Verified Mobility Contributor • {visitedStations.length} Stations Verified
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-[#718096] block">Trust Reliability</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#16B8C9]">{driverProfile.trustScore}%</span>
                <span className="text-[11px] text-[#718096]">score</span>
              </div>
            </div>
          </div>

          {/* Trust Score Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1 font-bold text-[#718096]">
              <span>Contributor Reliability Index</span>
              <span className="text-[#16B8C9]">{accuracyRate}% Accuracy Rate</span>
            </div>
            <div className="w-full h-2.5 bg-[#E3EAF0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#16B8C9] transition-all duration-500"
                style={{ width: `${driverProfile.trustScore}%` }}
              />
            </div>
          </div>

          {/* Stats 4-box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#F4F7FA] p-3 rounded-xl border border-[#E3EAF0] text-center">
              <span className="text-[10px] text-[#718096] font-bold uppercase block">Total Reports</span>
              <span className="text-base font-extrabold text-[#243447] mt-0.5 block">
                {driverProfile.totalReportsSubmitted}
              </span>
            </div>
            <div className="bg-[#F4F7FA] p-3 rounded-xl border border-[#E3EAF0] text-center">
              <span className="text-[10px] text-[#718096] font-bold uppercase block">Accepted</span>
              <span className="text-base font-extrabold text-[#26734D] mt-0.5 block">
                {driverProfile.acceptedReports}
              </span>
            </div>
            <div className="bg-[#F4F7FA] p-3 rounded-xl border border-[#E3EAF0] text-center">
              <span className="text-[10px] text-[#718096] font-bold uppercase block">Rejected / Outliers</span>
              <span className="text-base font-extrabold text-[#B54747] mt-0.5 block">
                {driverProfile.rejectedReports}
              </span>
            </div>
            <div className="bg-[#F4F7FA] p-3 rounded-xl border border-[#E3EAF0] text-center">
              <span className="text-[10px] text-[#718096] font-bold uppercase block">Visited Verified</span>
              <span className="text-base font-extrabold text-[#16B8C9] mt-0.5 block">
                {visitedStations.length}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#F4F7FA] rounded-xl border border-[#E3EAF0] text-[11px] text-[#718096] leading-relaxed">
            <strong className="text-[#243447]">Abuse Prevention Policy: </strong>
            Trust score is earned through verified telemetry agreement and post-visit confirmations. Spammed reports, duplicate submissions within 10 minutes, or values outside physical safety limits (120–245 Bar) are rejected automatically.
          </div>
        </div>
      </Section>

      {/* 🔔 SECTION: SMART ALERT SYSTEM PREFERENCES */}
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
            label="Station Closure &amp; Out-of-Stock Alerts"
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
          <p className="text-xs text-[#718096] leading-relaxed">
            Enter your Google Cloud Maps API key to activate full Google Vector Maps, Live Road Traffic Layer, and Directions Services.
          </p>

          <div>
            <label className="block text-xs font-bold text-[#718096] uppercase tracking-wider mb-1.5">
              API Key (Places &amp; Directions Enabled)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-[#E3EAF0] bg-white text-[#243447] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16B8C9] transition"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-5 py-2.5 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white font-bold text-xs transition shadow-sm"
              >
                Save Key
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  className="px-3 py-2.5 rounded-xl border border-[#E3EAF0] bg-white text-[#718096] hover:text-[#243447] font-bold text-xs transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#F4F7FA] border border-[#E3EAF0] rounded-2xl p-4 text-xs text-[#718096] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#16B8C9]">
              <ShieldCheck size={16} />
              <span>Need a Google Maps Key?</span>
            </div>
            <p className="text-[11px] text-[#718096] leading-relaxed">
              Enable <strong>Maps JavaScript API</strong>, <strong>Directions API</strong>, and <strong>Places API</strong> on Google Cloud Console and paste the generated key above. Without a key, the app continues working on the high-tech OpenStreetMap engine.
            </p>
          </div>
        </div>
      </Section>

      {/* Telemetry Preferences */}
      <Section title="⚡ Telemetry &amp; Simulation Preferences">
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
          <span className="font-extrabold text-[#16B8C9] bg-[#F4F7FA] px-3 py-1 rounded-xl border border-[#E3EAF0] text-xs">
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
            className="px-4 py-2 rounded-xl bg-[#FCEAEA] hover:bg-[#f8d5d5] text-[#B54747] border border-[#f0c0c0] text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw size={13} />
            <span>Reset All Data</span>
          </button>
        </SettingRow>
      </Section>
    </div>
  );
}
