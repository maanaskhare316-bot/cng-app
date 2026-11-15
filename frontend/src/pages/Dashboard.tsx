import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fuel,
  CheckCircle,
  Clock,
  Gauge,
  ArrowRight,
  Zap,
  Star,
  Users,
  Navigation,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationMap } from '../components/map/StationMap';
import { ReportStatusModal } from '../components/stations/ReportStatusModal';
import { formatPressure, formatDuration } from '../utils/formatters';
import type { StationSummaryDto } from '../types';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sublabel: string;
  tintClass: string;
  iconBg: string;
}

function StatCard({ icon, value, label, sublabel, tintClass, iconBg }: StatCardProps) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 ${tintClass} flex items-center gap-3 sm:gap-4`}>
      <div className={`${iconBg} rounded-2xl p-2.5 sm:p-3 flex-shrink-0 shadow-sm`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight truncate">{value}</p>
        <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">{label}</p>
        <p className="text-[10px] text-slate-400 truncate">{sublabel}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { stations, updateStationTelemetry } = useAppContext();
  const [reportModalStation, setReportModalStation] = useState<StationSummaryDto | null>(null);

  const stats = useMemo(() => {
    const total = stations.length;
    const available = stations.filter((s) => s.verifiedOpen === true).length;
    const withWait = stations.filter((s) => s.estimatedWaitMinutes !== null);
    const avgWait =
      withWait.length > 0
        ? Math.round(withWait.reduce((acc, s) => acc + (s.estimatedWaitMinutes ?? 0), 0) / withWait.length)
        : 5;

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
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-16 px-1 sm:px-0">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-9 text-white shadow-xl relative overflow-hidden border border-emerald-800/30">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2.5">
            <Zap size={13} className="text-amber-400" />
            Live CNG Telemetry & Highway Recommender
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-2">
            CNG Navigator
          </h1>
          <p className="text-slate-300 text-xs sm:text-base leading-relaxed mb-5">
            Smart CNG Station Finder integrated with Google Maps API. Real-time gas pressure (&gt;200 Bar) & live vehicle queues along major Indian highway corridors.
          </p>

          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <button
              onClick={() => navigate('/plan')}
              className="px-5 py-3 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-md transition flex items-center gap-2"
            >
              <Fuel size={17} />
              <span>Find Best Station on Route</span>
              <ArrowRight size={15} />
            </button>

            <button
              onClick={() => navigate('/stations')}
              className="px-4 py-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition flex items-center gap-1.5"
            >
              <span>All Stations ({stations.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Fuel size={20} className="text-blue-600" />}
          value={stats.total}
          label="Total Stations"
          sublabel="Active Highway Pumps"
          tintClass="bg-white"
          iconBg="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-emerald-600" />}
          value={stats.available}
          label="Open Stations"
          sublabel="24x7 Available"
          tintClass="bg-white"
          iconBg="bg-emerald-50"
        />
        <StatCard
          icon={<Clock size={20} className="text-amber-600" />}
          value={`~${stats.avgWait}m`}
          label="Avg Wait Time"
          sublabel="Fast Turnaround"
          tintClass="bg-white"
          iconBg="bg-amber-50"
        />
        <StatCard
          icon={<Gauge size={20} className="text-purple-600" />}
          value={`${stats.bestPressure} Bar`}
          label="Max Gas Pressure"
          sublabel="Fast 100% Fill"
          tintClass="bg-white"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Map & Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Map: 8 cols */}
        <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">
                Live Stations Map (Google Maps API)
              </h3>
              <p className="text-[11px] text-slate-400">
                Tap on any marker to inspect real-time pressure, vehicle queue, and directions.
              </p>
            </div>
          </div>

          <StationMap
            stations={stations}
            height="440px"
            onStationClick={(st) => navigate(`/stations/${st.id}`)}
          />
        </div>

        {/* Right Insights Column: 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          {/* Top Recommendation Pick */}
          {topStation && (
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-300 shadow-sm relative">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wider mb-2">
                <Star size={13} className="text-amber-500 fill-amber-500" />
                <span>Top Pick (Low Queue + High Bar)</span>
              </div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">{topStation.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{topStation.address}, {topStation.city}</p>

              <div className="grid grid-cols-2 gap-2 my-3 p-2.5 sm:p-3 bg-white rounded-xl sm:rounded-2xl border border-emerald-100 shadow-sm">
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400">Gas Pressure</span>
                  <div className="text-base sm:text-lg font-black text-emerald-600">
                    {topStation.currentPressureBar ? `${Math.round(topStation.currentPressureBar)} Bar` : '216 Bar'}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">Fast Fill</span>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400">Queue Line</span>
                  <div className="text-base sm:text-lg font-black text-slate-800">
                    {topStation.vehiclesWaiting ?? 2} Vehicles
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
                  View Details
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${topStation.latitude},${topStation.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition text-center"
                >
                  Navigate ↗
                </a>
              </div>
            </div>
          )}

          {/* Queue Distribution */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-xs sm:text-sm text-slate-800">Queue Status Overview</h4>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-emerald-700">Short Queue (0-3 Cars):</span>
                  <span className="font-bold text-slate-800">{queueDist.low} stations</span>
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
                  <span className="font-semibold text-amber-700">Moderate (4-8 Cars):</span>
                  <span className="font-bold text-slate-800">{queueDist.moderate} stations</span>
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
                  <span className="font-semibold text-red-700">Busy (&gt;8 Cars):</span>
                  <span className="font-bold text-slate-800">{queueDist.high} stations</span>
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
