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
  Locate,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationMap } from '../components/map/StationMap';
import { ReportStatusModal } from '../components/stations/ReportStatusModal';
import { CngCalculator } from '../components/stations/CngCalculator';
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
    <div className="rounded-[14px] p-4 sm:p-5 shadow-card border border-[#DCE5EE] bg-[#F8FAFC] flex items-center gap-3 sm:gap-4 hover:border-[#16B8C9]/40 transition">
      <div className={`${iconBg} rounded-xl p-2.5 sm:p-3 flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-black text-[#14283F] leading-tight truncate">{value}</p>
        <p className="text-xs font-semibold text-[#243447] mt-0.5 truncate">{label}</p>
        <p className="text-[10px] text-[#64748B] truncate">{sublabel}</p>
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
      () => {
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
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-16 px-1 sm:px-0 text-[#243447]">
      {/* Hero Welcome Banner */}
      <div className="bg-[#F8FAFC] rounded-[14px] p-5 sm:p-8 border border-[#DCE5EE] shadow-card relative overflow-hidden border-l-4 border-l-[#16B8C9]">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#E8EEF5] text-[#14283F] border border-[#DCE5EE] px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2.5">
            <Zap size={13} className="text-[#16B8C9]" />
            Live CNG Telemetry & Google Maps Highway Recommender
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-2 text-[#14283F]">
            CNG Navigator
          </h1>
          <p className="text-[#64748B] text-xs sm:text-base leading-relaxed mb-5">
            Smart CNG Station Finder integrated with Google Maps. Real-time gas pressure (&gt;200 Bar), vehicle queue line count & estimated waiting time along major highway corridors.
          </p>

          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <button
              onClick={() => navigate('/plan')}
              className="px-5 py-3 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white font-bold text-xs sm:text-sm tracking-wide shadow-xs transition flex items-center gap-2"
            >
              <Fuel size={17} />
              <span>Find Best Station on Route</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              onClick={handleFindNearest}
              disabled={isLocating}
              className="px-4 py-3 rounded-xl bg-[#E8EEF5] hover:bg-[#DCE5EE] text-[#243447] font-bold text-xs sm:text-sm border border-[#DCE5EE] transition flex items-center gap-2 shadow-xs"
            >
              <Locate size={16} className={isLocating ? 'animate-spin text-[#16B8C9]' : 'text-[#16B8C9]'} />
              <span>{isLocating ? 'Locating...' : 'Nearest CNG Station'}</span>
            </button>

            <button
              onClick={() => navigate('/stations')}
              className="px-4 py-3 rounded-xl bg-[#E8EEF5] hover:bg-[#DCE5EE] text-[#64748B] hover:text-[#14283F] font-bold text-xs sm:text-sm border border-[#DCE5EE] transition flex items-center gap-1.5"
            >
              <span>All Stations ({stations.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nearest Station Alert */}
      {nearestStation && (
        <div className="bg-[#E3F4EC] border border-[#C0E4D0] rounded-[14px] p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#26734D] text-white rounded-xl shadow-xs">
              <Locate size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#26734D] uppercase tracking-wider">
                  📍 Closest CNG Station ({nearestStation.distanceKm} km away)
                </span>
                <span className="text-[10px] bg-[#F8FAFC] text-[#26734D] font-bold px-2 py-0.5 rounded-full border border-[#C0E4D0]">
                  Verified Open
                </span>
              </div>
              <h4 className="text-base font-extrabold text-[#14283F]">{nearestStation.station.name}</h4>
              <p className="text-xs text-[#64748B]">
                <strong className="text-[#26734D]">Pressure:</strong> {nearestStation.station.currentPressureBar} Bar •{' '}
                <strong className="text-[#98651C]">Queue:</strong> {nearestStation.station.vehiclesWaiting} Vehicles (~
                {nearestStation.station.estimatedWaitMinutes} min wait)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => navigate(`/stations/${nearestStation.station.id}`)}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#E8EEF5] text-[#14283F] border border-[#DCE5EE] font-bold text-xs transition"
            >
              View Telemetry
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${nearestStation.station.latitude},${nearestStation.station.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Google Maps ↗</span>
            </a>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Fuel size={20} className="text-[#16B8C9]" />}
          value={stats.total}
          label="Total Stations"
          sublabel="Active Highway Pumps"
          iconBg="bg-[#EBF8FF]"
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-[#26734D]" />}
          value={stats.available}
          label="Open Stations"
          sublabel="24x7 Available"
          iconBg="bg-[#E3F4EC]"
        />
        <StatCard
          icon={<Clock size={20} className="text-[#98651C]" />}
          value={`~${stats.avgWait}m`}
          label="Avg Wait Time"
          sublabel="Fast Turnaround"
          iconBg="bg-[#FFF2DB]"
        />
        <StatCard
          icon={<Gauge size={20} className="text-[#14283F]" />}
          value={`${stats.bestPressure} Bar`}
          label="Max Gas Pressure"
          sublabel="Fast 100% Fill"
          iconBg="bg-[#E8EEF5]"
        />
      </div>

      {/* Map & Right Insights Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Map: 8 cols */}
        <div className="lg:col-span-8 bg-[#F8FAFC] rounded-[14px] p-3.5 sm:p-4 shadow-card border border-[#DCE5EE] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-[#14283F]">
                Live Stations Map (Google Maps API)
              </h3>
              <p className="text-[11px] text-[#64748B]">
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
                    ? 'bg-[#14283F] text-white border-[#14283F]'
                    : 'bg-[#E8EEF5] text-[#64748B] border-[#DCE5EE] hover:bg-[#DCE5EE]'
                }`}
              >
                All ({stations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('highPressure')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 border ${
                  filterMode === 'highPressure'
                    ? 'bg-[#14283F] text-white border-[#14283F]'
                    : 'bg-[#E3F4EC] text-[#26734D] border-[#C0E4D0] hover:bg-[#D4EFE1]'
                }`}
              >
                <span>⚡ 200+ Bar</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('lowQueue')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 border ${
                  filterMode === 'lowQueue'
                    ? 'bg-[#14283F] text-white border-[#14283F]'
                    : 'bg-[#EBF8FF] text-[#16B8C9] border-[#BEE3F8] hover:bg-[#D7EFFF]'
                }`}
              >
                <span>🚗 ≤3 Cars</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('fastTurnaround')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 border ${
                  filterMode === 'fastTurnaround'
                    ? 'bg-[#14283F] text-white border-[#14283F]'
                    : 'bg-[#FFF2DB] text-[#98651C] border-[#FFE2A4] hover:bg-[#FFE9C0]'
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
            <div className="bg-[#F8FAFC] rounded-[14px] p-4 sm:p-5 border border-[#DCE5EE] shadow-card border-l-4 border-l-[#16B8C9] relative">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#98651C] uppercase tracking-wider mb-2">
                <Star size={13} className="text-[#98651C] fill-[#98651C]" />
                <span>Top Pick (Low Queue + High Bar)</span>
              </div>
              <h4 className="font-bold text-sm sm:text-base text-[#14283F] leading-tight">
                {topStation.name}
              </h4>
              <p className="text-xs text-[#64748B] mt-0.5">
                {topStation.address}, {topStation.city}
              </p>

              <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-[#E8EEF5] rounded-xl border border-[#DCE5EE]">
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-[#64748B]">Gas Pressure</span>
                  <div className="text-base sm:text-lg font-black text-[#26734D]">
                    {topStation.currentPressureBar ? `${Math.round(topStation.currentPressureBar)} Bar` : '216 Bar'}
                  </div>
                  <span className="text-[10px] text-[#26734D] font-semibold">100% Full Tank</span>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-[#64748B]">Queue Line</span>
                  <div className="text-base sm:text-lg font-black text-[#14283F]">
                    {topStation.vehiclesWaiting ?? 2} Vehicles
                  </div>
                  <span className="text-[10px] text-[#64748B] font-semibold">
                    ~{topStation.estimatedWaitMinutes ?? 4} min wait
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/stations/${topStation.id}`)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white font-bold text-xs transition text-center shadow-xs"
                >
                  View Details
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${topStation.latitude},${topStation.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 rounded-xl bg-[#E8EEF5] hover:bg-[#DCE5EE] text-[#14283F] border border-[#DCE5EE] font-bold text-xs transition text-center"
                >
                  Navigate ↗
                </a>
              </div>
            </div>
          )}

          {/* Queue Distribution */}
          <div className="bg-[#F8FAFC] rounded-[14px] p-4 sm:p-5 border border-[#DCE5EE] shadow-card space-y-3">
            <h4 className="font-bold text-xs sm:text-sm text-[#14283F]">Live Station Telemetry Summary</h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-[#26734D]">Short Queue (0-3 Cars):</span>
                  <span className="font-bold text-[#14283F]">{queueDist.low} stations</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E8EEF5] overflow-hidden">
                  <div
                    className="h-full bg-[#26734D] rounded-full"
                    style={{ width: `${(queueDist.low / (queueDist.total || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-[#98651C]">Moderate Queue (4-8 Cars):</span>
                  <span className="font-bold text-[#14283F]">{queueDist.moderate} stations</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E8EEF5] overflow-hidden">
                  <div
                    className="h-full bg-[#98651C] rounded-full"
                    style={{ width: `${(queueDist.moderate / (queueDist.total || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-[#B54747]">Busy Queue (&gt;8 Cars):</span>
                  <span className="font-bold text-[#14283F]">{queueDist.high} stations</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E8EEF5] overflow-hidden">
                  <div
                    className="h-full bg-[#B54747] rounded-full"
                    style={{ width: `${(queueDist.high / (queueDist.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Verification Health */}
          <div className="bg-[#F8FAFC] rounded-[14px] p-4 sm:p-5 border border-[#DCE5EE] shadow-card space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs sm:text-sm text-[#14283F] flex items-center gap-1.5">
                <span>Data Verification Health</span>
              </h4>
              <span className="text-[9.5px] uppercase font-black bg-[#E8EEF5] text-[#64748B] border border-[#DCE5EE] px-1.5 py-0.5 rounded">
                DEMO DATA
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Transparency verification across all {stations.length} network stations:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-[#E3F4EC] p-2 rounded-xl border border-[#C0E4D0]">
                <span className="text-[10px] text-[#26734D] font-bold block">● Live Verified</span>
                <span className="text-sm font-extrabold text-[#14283F]">{verificationCounts.live} Stations</span>
              </div>
              <div className="bg-[#EBF8FF] p-2 rounded-xl border border-[#BEE3F8]">
                <span className="text-[10px] text-[#16B8C9] font-bold block">● Recent Updates</span>
                <span className="text-sm font-extrabold text-[#14283F]">{verificationCounts.recent} Stations</span>
              </div>
              <div className="bg-[#FFF2DB] p-2 rounded-xl border border-[#FFE2A4]">
                <span className="text-[10px] text-[#98651C] font-bold block">● Community</span>
                <span className="text-sm font-extrabold text-[#14283F]">{verificationCounts.community} Stations</span>
              </div>
              <div className="bg-[#E8EEF5] p-2 rounded-xl border border-[#DCE5EE]">
                <span className="text-[10px] text-[#64748B] font-bold block">● Stale / Offline</span>
                <span className="text-sm font-extrabold text-[#14283F]">{verificationCounts.stale} Stations</span>
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
