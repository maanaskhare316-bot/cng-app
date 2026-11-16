import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  MapPin,
  Zap,
  Clock,
  Navigation,
  RotateCcw,
  Users,
  Sparkles,
  Map as MapIcon,
  List,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationMap } from '../components/map/StationMap';
import { ReportStatusModal } from '../components/stations/ReportStatusModal';
import type { StationSummaryDto } from '../types';

export default function RouteResults() {
  const navigate = useNavigate();
  const { activeRouteResult, updateStationTelemetry } = useAppContext();

  const [selectedStation, setSelectedStation] = useState<StationSummaryDto | null>(() => {
    return activeRouteResult?.bestOverall || (activeRouteResult?.stations && activeRouteResult.stations[0]) || null;
  });

  const [reportModalStation, setReportModalStation] = useState<StationSummaryDto | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  if (!activeRouteResult || !activeRouteResult.stations || activeRouteResult.stations.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center bg-[#111827] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-lg text-slate-100">
        <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
          🛣️
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Route Planned Yet</h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
          Please select your origin and destination in Trip Planner to find the best CNG stations.
        </p>
        <button
          onClick={() => navigate('/plan')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md"
        >
          Plan Your Trip
        </button>
      </div>
    );
  }

  const { totalDistanceKm, totalDurationMinutes, routeGeometry, stations, bestOverall } = activeRouteResult;

  const startCoord =
    routeGeometry && routeGeometry.length > 0 ? { lat: routeGeometry[0][0], lng: routeGeometry[0][1] } : undefined;
  const destCoord =
    routeGeometry && routeGeometry.length > 1
      ? { lat: routeGeometry[routeGeometry.length - 1][0], lng: routeGeometry[routeGeometry.length - 1][1] }
      : undefined;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-16 px-1 sm:px-0 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/plan')}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-800 bg-[#162032] hover:bg-[#1f2c44] text-slate-200 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
              Route Recommendations
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Distance: <strong className="text-white">{totalDistanceKm} km</strong> • Est. Drive:{' '}
              <strong className="text-white">~{totalDurationMinutes} mins</strong> •{' '}
              <strong className="text-emerald-400">{stations.length}</strong> Stations Found
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/plan')}
          className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-slate-200 bg-[#162032] border border-slate-700/80 rounded-xl hover:bg-[#1f2c44] transition flex items-center gap-1.5 shadow-sm"
        >
          <RotateCcw size={13} /> <span>Change Route</span>
        </button>
      </div>

      {/* 🏆 BEST RECOMMENDATION HERO CARD */}
      {bestOverall && (
        <div className="bg-gradient-to-r from-[#0a2725] via-[#0d2138] to-[#0c1626] rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-emerald-500/40">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
                <Star size={13} className="fill-slate-950" />
                Top AI Recommendation (Short Queue + High Bar)
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight text-white">{bestOverall.name}</h2>
                <p className="text-emerald-300 text-xs sm:text-sm mt-0.5">
                  {bestOverall.operator} • {bestOverall.city}, {bestOverall.state}
                </p>
              </div>

              <p className="p-2.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-xs sm:text-sm leading-relaxed text-slate-200">
                {bestOverall.recommendationReason}
              </p>

              {/* 3 Metrics: Queue + Pressure + Detour */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
                <div className="bg-black/40 rounded-xl p-2.5 border border-white/10 text-center sm:text-left">
                  <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center sm:justify-start gap-1">
                    <Users size={11} className="text-blue-400" /> Queue
                  </div>
                  <div className="text-base sm:text-xl font-black text-amber-400">
                    {bestOverall.vehiclesWaiting ?? 0} Cars
                  </div>
                  <div className="text-[10px] text-slate-300 truncate">
                    ~{bestOverall.estimatedWaitMinutes ?? 2} min wait
                  </div>
                </div>

                <div className="bg-black/40 rounded-xl p-2.5 border border-white/10 text-center sm:text-left">
                  <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center sm:justify-start gap-1">
                    <Zap size={11} className="text-emerald-400" /> Pressure
                  </div>
                  <div className="text-base sm:text-xl font-black text-emerald-400">
                    {bestOverall.currentPressureBar ? `${Math.round(bestOverall.currentPressureBar)} Bar` : '216 Bar'}
                  </div>
                  <div className="text-[10px] text-emerald-300">Super Fast Fill</div>
                </div>

                <div className="bg-black/40 rounded-xl p-2.5 border border-white/10 text-center sm:text-left">
                  <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center sm:justify-start gap-1">
                    <Navigation size={11} className="text-cyan-400" /> Detour
                  </div>
                  <div className="text-base sm:text-xl font-black text-white">
                    +{bestOverall.extraDetourKm ?? 0.4} km
                  </div>
                  <div className="text-[10px] text-slate-300 truncate">
                    ~{bestOverall.estimatedDetourMinutes ?? 1} min detour
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-60 flex-shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${bestOverall.latitude},${bestOverall.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider text-center shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Navigation size={15} /> Start Navigation in Maps ↗
              </a>

              <Link
                to={`/stations/${bestOverall.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <span>View Live Telemetry</span> ↗
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tab Switcher: Map vs List */}
      <div className="flex lg:hidden bg-[#111827] p-1 rounded-2xl border border-slate-800 shadow-md text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileView('map')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
            mobileView === 'map' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <MapIcon size={14} /> <span>Interactive Map</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
            mobileView === 'list' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <List size={14} /> <span>Stations List ({stations.length})</span>
        </button>
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Map Column */}
        <div
          className={`lg:col-span-7 bg-[#111827] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg border border-slate-800 space-y-2.5 ${
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white">Live Highway Map View</h3>
              <p className="text-[11px] text-slate-400">Route and stations with real-time pressure & queue badges</p>
            </div>
          </div>

          <StationMap
            stations={stations}
            routeGeometry={routeGeometry}
            startPoint={startCoord}
            destPoint={destCoord}
            selectedStationId={selectedStation?.id}
            onStationClick={(st) => setSelectedStation(st)}
            height="460px"
          />
        </div>

        {/* Stations List Column */}
        <div className={`lg:col-span-5 space-y-3.5 ${mobileView === 'map' ? 'hidden lg:block' : 'block'}`}>
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-xs sm:text-sm text-white">
              Stations Along Route ({stations.length})
            </h3>
            <span className="text-[10px] sm:text-xs text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              Sorted by Convenience
            </span>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-0.5">
            {stations.map((st) => {
              const isBest = st.recommendationCategory === 'BEST_OVERALL';
              const isSelected = selectedStation?.id === st.id;
              const pressure = st.currentPressureBar ? Math.round(st.currentPressureBar) : null;
              const isHighPressure = pressure && pressure >= 195;

              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className={`rounded-2xl p-3.5 sm:p-4 border transition cursor-pointer relative shadow-md ${
                    isBest
                      ? 'border-emerald-500/80 bg-emerald-950/30 ring-2 ring-emerald-500/20'
                      : isSelected
                      ? 'border-slate-700 bg-[#162032]'
                      : 'border-slate-800 bg-[#111827] hover:border-slate-700'
                  }`}
                >
                  {isBest && (
                    <span className="absolute -top-2.5 right-4 bg-amber-400 text-slate-950 text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Star size={10} className="fill-slate-950" /> Best Choice
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-white leading-tight truncate">{st.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {st.operator || 'CNG'} • {st.city}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-white">+{st.extraDetourKm ?? 0.4} km</span>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        ~{st.estimatedDetourMinutes ?? 1}m detour
                      </span>
                    </div>
                  </div>

                  {/* 2-box metric: Pressure + Queue */}
                  <div className="grid grid-cols-2 gap-2 bg-[#0c1220] rounded-xl p-2.5 border border-slate-800 my-2.5">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Gas Pressure</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span
                          className={`text-sm font-black ${
                            isHighPressure ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {pressure ? `${pressure} Bar` : 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isHighPressure ? 'Full Fill' : 'Moderate'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Queue Line</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-white">{st.vehiclesWaiting ?? 0} Cars</span>
                        <span className="text-[10px] text-slate-400">~{st.estimatedWaitMinutes ?? 2}m wait</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-[11px] font-bold text-emerald-400">₹{st.verifiedPricePerKg ?? 82.5}/kg</span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportModalStation(st);
                        }}
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-amber-400 hover:bg-[#162032] transition"
                        title="Report Status"
                      >
                        <Sparkles size={13} className="text-amber-400" />
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition flex items-center gap-1 shadow-sm"
                      >
                        <span>Maps</span>
                        <Navigation size={11} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
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
