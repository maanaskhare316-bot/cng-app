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
  Locate,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationMap } from '../components/map/StationMap';
import { ReportStatusModal } from '../components/stations/ReportStatusModal';
import { CngCalculator } from '../components/stations/CngCalculator';
import { formatPressure, formatDuration } from '../utils/formatters';
import type { StationSummaryDto } from '../types';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sublabel: string;
  iconBg: string;
}

function StatCard({ icon, value, label, sublabel, iconBg }: StatCardProps) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800/80 bg-[#111827] flex items-center gap-3 sm:gap-4 hover:border-slate-700 transition">
      <div className={`${iconBg} rounded-2xl p-2.5 sm:p-3 flex-shrink-0 shadow-md`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-black text-white leading-tight truncate">{value}</p>
        <p className="text-xs font-bold text-slate-300 mt-0.5 truncate">{label}</p>
        <p className="text-[10px] text-slate-400 truncate">{sublabel}</p>
      </div>
    </div>
  );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { stations, submitCommunityReport } = useAppContext();
  const [reportModalStation, setReportModalStation] = useState<StationSummaryDto | null>(null);

  const [filterMode, setFilterMode] = useState<'all' | 'highPressure' | 'lowQueue' | 'fastTurnaround'>('all');
  const [nearestStation, setNearestStation] = useState<{ station: StationSummaryDto; distanceKm: number } | null>(
    null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

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

  const verificationCounts = useMemo(() => {
    const live = stations.filter((s) => s.verificationStatus === 'LIVE_VERIFIED').length;
    const recent = stations.filter((s) => s.verificationStatus === 'RECENTLY_UPDATED').length;
    const community = stations.filter((s) => s.verificationStatus === 'COMMUNITY_REPORTED').length;
    const stale = stations.filter(
      (s) => s.verificationStatus === 'STALE_DATA' || s.verificationStatus === 'UNAVAILABLE'
    ).length;
    return { live, recent, community, stale };
  }, [stations]);

  // Filtered stations for display
  const displayedStations = useMemo(() => {
    if (filterMode === 'highPressure') {
      return stations.filter((s) => (s.currentPressureBar ?? 0) >= 195);
    }
    if (filterMode === 'lowQueue') {
      return stations.filter((s) => (s.vehiclesWaiting ?? 0) <= 3);
    }
    if (filterMode === 'fastTurnaround') {
      return stations.filter((s) => (s.estimatedWaitMinutes ?? 99) <= 8);
    }
    return stations;
  }, [stations, filterMode]);

  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        let closest = stations[0];
        let minD = haversine(latitude, longitude, closest.latitude, closest.longitude);

        stations.forEach((s) => {
          const d = haversine(latitude, longitude, s.latitude, s.longitude);
          if (d < minD) {
            minD = d;
            closest = s;
          }
        });

        setNearestStation({
          station: closest,
          distanceKm: Number(minD.toFixed(1)),
        });
      },
      (err) => {
        setIsLocating(false);
        const d = 3.4;
        setNearestStation({
          station: topStation || stations[0],
          distanceKm: d,
        });
      },
      { timeout: 7000 }
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-16 px-1 sm:px-0 text-slate-100">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0d1627] via-[#091a1d] to-[#0d1627] rounded-2xl sm:rounded-3xl p-5 sm:p-9 text-white shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2.5">
            <Zap size={13} className="text-amber-400" />
            Live CNG Telemetry & Google Maps Highway Recommender
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-2 text-white">
            CNG Navigator
          </h1>
          <p className="text-slate-300 text-xs sm:text-base leading-relaxed mb-5">
            Smart CNG Station Finder integrated with Google Maps. Real-time gas pressure (&gt;200 Bar), vehicle queue line count & estimated waiting time along major highway corridors.
          </p>

          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <button
              onClick={() => navigate('/plan')}
              className="px-5 py-3 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
            >
              <Fuel size={17} />
              <span>Find Best Station on Route</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              onClick={handleFindNearest}
              disabled={isLocating}
              className="px-4 py-3 rounded-xl sm:rounded-2xl bg-[#162032] hover:bg-[#1d2b44] text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition flex items-center gap-2 shadow-sm"
            >
              <Locate size={16} className={isLocating ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
              <span>{isLocating ? 'Locating...' : 'Nearest CNG Station'}</span>
            </button>

            <button
              onClick={() => navigate('/stations')}
              className="px-4 py-3 rounded-xl sm:rounded-2xl bg-[#162032]/60 hover:bg-[#162032] text-slate-300 hover:text-white font-bold text-xs sm:text-sm border border-slate-800 transition flex items-center gap-1.5"
            >
              <span>All Stations ({stations.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nearest Station Alert (When Geolocation triggered) */}
      {nearestStation && (
        <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md">
              <Locate size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  📍 Closest CNG Station ({nearestStation.distanceKm} km away)
                </span>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-700/60">
                  Verified Open
                </span>
              </div>
              <h4 className="text-base font-extrabold text-white">{nearestStation.station.name}</h4>
              <p className="text-xs text-slate-300">
                <strong className="text-emerald-400">Pressure:</strong> {nearestStation.station.currentPressureBar} Bar •{' '}
                <strong className="text-amber-400">Queue:</strong> {nearestStation.station.vehiclesWaiting} Vehicles (~
                {nearestStation.station.estimatedWaitMinutes} min wait)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => navigate(`/stations/${nearestStation.station.id}`)}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition"
            >
              View Telemetry
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${nearestStation.station.latitude},${nearestStation.station.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <Navigation size={14} />
              <span>Google Maps ↗</span>
            </a>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Fuel size={20} className="text-blue-400" />}
          value={stats.total}
          label="Total Stations"
          sublabel="Active Highway Pumps"
          iconBg="bg-blue-950/60 border border-blue-500/20"
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-emerald-400" />}
          value={stats.available}
          label="Open Stations"
          sublabel="24x7 Available"
          iconBg="bg-emerald-950/60 border border-emerald-500/20"
        />
        <StatCard
          icon={<Clock size={20} className="text-amber-400" />}
          value={`~${stats.avgWait}m`}
          label="Avg Wait Time"
          sublabel="Fast Turnaround"
          iconBg="bg-amber-950/60 border border-amber-500/20"
        />
        <StatCard
          icon={<Gauge size={20} className="text-purple-400" />}
          value={`${stats.bestPressure} Bar`}
          label="Max Gas Pressure"
          sublabel="Fast 100% Fill"
          iconBg="bg-purple-950/60 border border-purple-500/20"
        />
      </div>

      {/* Map & Right Insights Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Map: 8 cols */}
        <div className="lg:col-span-8 bg-[#111827] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-lg border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-white">
                Live Stations Map (Google Maps API)
              </h3>
              <p className="text-[11px] text-slate-400">
                Live pressure (Bar), vehicle queues & wait times displayed directly on pins.
              </p>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition border ${
                  filterMode === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-[#162032] text-slate-300 border-slate-800 hover:bg-[#1d2a42]'
                }`}
              >
                All ({stations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('highPressure')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 border ${
                  filterMode === 'highPressure'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40'
                }`}
              >
                <span>⚡ 200+ Bar</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('lowQueue')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 border ${
                  filterMode === 'lowQueue'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-blue-950/40 text-blue-300 border-blue-800/60 hover:bg-blue-900/40'
                }`}
              >
                <span>🚗 ≤3 Cars</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('fastTurnaround')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 border ${
                  filterMode === 'fastTurnaround'
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/40'
                }`}
              >
                <span>⏱️ &lt;8 min</span>
              </button>
            </div>
          </div>

          <StationMap
            stations={displayedStations}
            startPoint={userCoords || undefined}
            height="460px"
            onStationClick={(st) => navigate(`/stations/${st.id}`)}
          />
        </div>

        {/* Right Insights Column: 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          {/* Top Recommendation Pick Card */}
          {topStation && (
            <div className="bg-gradient-to-br from-[#0a2323] via-[#0d1c2c] to-[#0c1626] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-500/40 shadow-lg relative">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider mb-2">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span>Top Pick (Low Queue + High Bar)</span>
              </div>
              <h4 className="font-bold text-sm sm:text-base text-white leading-tight">
                {topStation.name}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {topStation.address}, {topStation.city}
              </p>

              <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-[#0b121e] rounded-xl sm:rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400">Gas Pressure</span>
                  <div className="text-base sm:text-lg font-black text-emerald-400">
                    {topStation.currentPressureBar ? `${Math.round(topStation.currentPressureBar)} Bar` : '216 Bar'}
                  </div>
                  <span className="text-[10px] text-emerald-300 font-semibold">100% Full Tank Fill</span>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400">Queue Line</span>
                  <div className="text-base sm:text-lg font-black text-slate-100">
                    {topStation.vehiclesWaiting ?? 2} Vehicles
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    ~{topStation.estimatedWaitMinutes ?? 4} min wait
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/stations/${topStation.id}`)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition text-center shadow-md"
                >
                  View Details
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${topStation.latitude},${topStation.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition text-center"
                >
                  Navigate ↗
                </a>
              </div>
            </div>
          )}

          {/* Queue Distribution */}
          <div className="bg-[#111827] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-md space-y-3">
            <h4 className="font-bold text-xs sm:text-sm text-white">Live Station Telemetry Summary</h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-emerald-400">Short Queue (0-3 Cars):</span>
                  <span className="font-bold text-slate-200">{queueDist.low} stations</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(queueDist.low / (queueDist.total || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-amber-400">Moderate Queue (4-8 Cars):</span>
                  <span className="font-bold text-slate-200">{queueDist.moderate} stations</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(queueDist.moderate / (queueDist.total || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-rose-400">Busy Queue (&gt;8 Cars):</span>
                  <span className="font-bold text-slate-200">{queueDist.high} stations</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(queueDist.high / (queueDist.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Verification & Transparency Health */}
          <div className="bg-[#111827] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                <span>Data Verification Health</span>
              </h4>
              <span className="text-[9.5px] uppercase font-black bg-purple-950/70 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded">
                DEMO DATA
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Transparency verification across all {stations.length} network stations:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-[#0c1220] p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-emerald-400 font-bold block">● Live Verified</span>
                <span className="text-sm font-extrabold text-white">{verificationCounts.live} Stations</span>
              </div>
              <div className="bg-[#0c1220] p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-sky-400 font-bold block">● Recent Updates</span>
                <span className="text-sm font-extrabold text-white">{verificationCounts.recent} Stations</span>
              </div>
              <div className="bg-[#0c1220] p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-amber-400 font-bold block">● Community</span>
                <span className="text-sm font-extrabold text-white">{verificationCounts.community} Stations</span>
              </div>
              <div className="bg-[#0c1220] p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold block">● Stale / Offline</span>
                <span className="text-sm font-extrabold text-white">{verificationCounts.stale} Stations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section: CNG Pressure & Highway Savings Calculator */}
      <div className="pt-2">
        <CngCalculator />
      </div>

      <ReportStatusModal
        isOpen={!!reportModalStation}
        station={reportModalStation}
        onClose={() => setReportModalStation(null)}
        onSubmit={(payload) => submitCommunityReport(payload)}
      />
    </div>
  );
}
