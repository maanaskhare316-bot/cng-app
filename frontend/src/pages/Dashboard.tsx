import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fuel,
  CheckCircle,
  Clock,
  Gauge,
  ArrowRight,
  TrendingUp,
  Zap,
  Star,
  Users,
  Sparkles,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationMap } from '../components/map/StationMap';
import { ReportStatusModal } from '../components/stations/ReportStatusModal';
import { formatPressure, formatDuration, formatPrice } from '../utils/formatters';
import type { StationSummaryDto } from '../types';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  hindiLabel: string;
  tintClass: string;
  iconBg: string;
}

function StatCard({ icon, value, label, hindiLabel, tintClass, iconBg }: StatCardProps) {
  return (
    <div className={`rounded-2xl p-5 shadow-sm border border-slate-200/80 ${tintClass} flex items-center gap-4`}>
      <div className={`${iconBg} rounded-2xl p-3 flex-shrink-0 shadow-sm`}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-slate-900 leading-tight">{value}</p>
        <p className="text-xs font-bold text-slate-700 mt-0.5">{label}</p>
        <p className="text-[11px] text-slate-500">{hindiLabel}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { stations, isLoading, updateStationTelemetry } = useAppContext();
  const [reportModalStation, setReportModalStation] = useState<StationSummaryDto | null>(null);

  const stats = useMemo(() => {
    const total = stations.length;
    const available = stations.filter((s) => s.verifiedOpen === true).length;
    const withWait = stations.filter((s) => s.estimatedWaitMinutes !== null);
    const avgWait =
      withWait.length > 0
        ? Math.round(withWait.reduce((acc, s) => acc + (s.estimatedWaitMinutes ?? 0), 0) / withWait.length)
        : 6;

    const withPressure = stations.filter((s) => s.currentPressureBar !== null);
    const bestPressure =
      withPressure.length > 0 ? Math.max(...withPressure.map((s) => s.currentPressureBar ?? 0)) : 222;

    return { total, available, avgWait, bestPressure };
  }, [stations]);

  const topStation = useMemo<StationSummaryDto | null>(
    () => stations.find((s) => s.recommendationCategory === 'BEST_OVERALL') ?? stations[0] ?? null,
    [stations]
  );

  const queueDist = useMemo(() => {
    const low = stations.filter((s) => (s.vehiclesWaiting ?? 0) <= 3).length;
    const moderate = stations.filter((s) => (s.vehiclesWaiting ?? 0) > 3 && (s.vehiclesWaiting ?? 0) <= 8).length;
    const high = stations.filter((s) => (s.vehiclesWaiting ?? 0) > 8).length;
    return { low, moderate, high, total: low + moderate + high };
  }, [stations]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-emerald-800/30">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Zap size={14} className="text-amber-400" />
            Live CNG Telemetry & Highway Recommender
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-2">
            स्मार्ट CNG नेविगेटर (CNG Navigator)
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Google Maps API इंटीग्रेशन के साथ भारत के प्रमुख राजमार्गों पर लाइव CNG स्टेशनों की स्थिति देखें। पता करें किस पंप पर <strong>कितनी गाड़ियाँ हैं</strong> और <strong>कितना प्रेशर (200+ Bar)</strong> है!
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/plan')}
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
            >
              <Fuel size={18} />
              <span>रास्ते का बेस्ट स्टेशन खोजें (Plan Trip)</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => navigate('/stations')}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition flex items-center gap-2"
            >
              <span>सभी स्टेशन देखें ({stations.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Fuel size={22} className="text-blue-600" />}
          value={stats.total}
          label="Total CNG Stations"
          hindiLabel="कुल सक्रिय स्टेशन"
          tintClass="bg-white"
          iconBg="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle size={22} className="text-emerald-600" />}
          value={stats.available}
          label="24x7 Open Pumps"
          hindiLabel="खुले व चालू डिस्पेंसर"
          tintClass="bg-white"
          iconBg="bg-emerald-50"
        />
        <StatCard
          icon={<Clock size={22} className="text-amber-600" />}
          value={`~${stats.avgWait} min`}
          label="Avg Queue Wait"
          hindiLabel="औसत इंतज़ार समय"
          tintClass="bg-white"
          iconBg="bg-amber-50"
        />
        <StatCard
          icon={<Gauge size={22} className="text-purple-600" />}
          value={`${stats.bestPressure} Bar`}
          label="Max Highway Pressure"
          hindiLabel="उच्चतम गैस प्रेशर"
          tintClass="bg-white"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Main Grid: Interactive Map (Google Maps powered) + Right Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Map: 8 cols */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">
                लाइव CNG मैप (Google Maps API + Real-time Telemetry)
              </h3>
              <p className="text-xs text-slate-400">
                पिन पर गैस प्रेशर (Bar) और कतार दिखाई दे रही है। किसी भी स्टेशन पर क्लिक करके पूरा डेटा देखें।
              </p>
            </div>
          </div>

          <StationMap
            stations={stations}
            height="500px"
            onStationClick={(st) => navigate(`/stations/${st.id}`)}
          />
        </div>

        {/* Right Column: 4 cols */}
        <div className="lg:col-span-4 space-y-5">
          {/* Top Featured Recommendation */}
          {topStation && (
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-3xl p-5 border border-emerald-300 shadow-sm relative">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wider mb-2">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span>आज का बेस्ट पंप (Top Pick)</span>
              </div>
              <h4 className="font-bold text-base text-slate-900 leading-tight">{topStation.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{topStation.address}, {topStation.city}</p>

              <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">गैस प्रेशर</span>
                  <div className="text-lg font-black text-emerald-600">
                    {topStation.currentPressureBar ? `${Math.round(topStation.currentPressureBar)} Bar` : '218 Bar'}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">तेज़ भराई</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">वाहनों की कतार</span>
                  <div className="text-lg font-black text-slate-800">
                    {topStation.vehiclesWaiting ?? 2} गाड़ियाँ
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">~{topStation.estimatedWaitMinutes ?? 4} min wait</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/stations/${topStation.id}`)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition text-center"
                >
                  विवरण देखें (Details)
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${topStation.latitude},${topStation.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition text-center"
                >
                  Maps ↗
                </a>
              </div>
            </div>
          )}

          {/* Queue Distribution */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-800">कतार वितरण (Queue Status Overview)</h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-emerald-700">कम भीड़ (0-3 गाड़ियाँ):</span>
                  <span className="font-bold text-slate-800">{queueDist.low} स्टेशन्स</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(queueDist.low / (queueDist.total || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-amber-700">मध्यम भीड़ (4-8 गाड़ियाँ):</span>
                  <span className="font-bold text-slate-800">{queueDist.moderate} स्टेशन्स</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(queueDist.moderate / (queueDist.total || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-red-700">भारी भीड़ (&gt;8 गाड़ियाँ):</span>
                  <span className="font-bold text-slate-800">{queueDist.high} स्टेशन्स</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(queueDist.high / (queueDist.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Help Box */}
          <div className="bg-slate-50 rounded-3xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800">💡 CNG टिप:</p>
            <p className="leading-relaxed">
              200 Bar से अधिक प्रेशर पर गैस भरवाने से सिलेंडर में पूरी 9-10 किलो गैस आती है और माइलेज 25-30% बढ़ जाता है!
            </p>
          </div>
        </div>
      </div>

      <ReportStatusModal
        isOpen={!!reportModalStation}
        station={reportModalStation}
        onClose={() => setReportModalStation(null)}
        onSubmit={(id, v, p) => updateStationTelemetry(id, v, p)}
      />
    </div>
  );
}
