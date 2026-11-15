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
      <div className="max-w-xl mx-auto my-12 text-center bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
          🛣️
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Route Planned Yet</h2>
        <p className="text-slate-500 text-xs sm:text-sm mb-6 leading-relaxed">
          Please select your origin and destination in Trip Planner to find the best CNG stations.
        </p>
        <button
          onClick={() => navigate('/plan')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition"
        >
          Plan Your Trip
        </button>
      </div>
    );
  }

  const { totalDistanceKm, totalDurationMinutes, routeGeometry, stations, bestOverall } = activeRouteResult;

  const startCoord = routeGeometry && routeGeometry.length > 0 ? { lat: routeGeometry[0][0], lng: routeGeometry[0][1] } : undefined;
  const destCoord = routeGeometry && routeGeometry.length > 1 ? { lat: routeGeometry[routeGeometry.length - 1][0], lng: routeGeometry[routeGeometry.length - 1][1] } : undefined;

  const handleReportSubmit = (stationId: number, vehicles: number, pressure: number) => {
    updateStationTelemetry(stationId, vehicles, pressure);
    const target = stations.find((s) => s.id === stationId);
    if (target) {
      target.vehiclesWaiting = vehicles;
      target.currentPressureBar = pressure;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-16 px-1 sm:px-0">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/plan')}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
              Route Recommendations
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Distance: <strong>{totalDistanceKm} km</strong> • Est. Drive: <strong>~{totalDurationMinutes} mins</strong> • <strong>{stations.length}</strong> Stations Found
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/plan')}
          className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
        >
          <RotateCcw size={13} /> <span>Change Route</span>
        </button>
      </div>

      {/* 🏆 BEST RECOMMENDATION HERO CARD */}
      {bestOverall && (
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden border border-emerald-500/30">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
                <Star size={13} className="fill-slate-950" />
                Top AI Recommendation (Short Queue + High Bar)
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">{bestOverall.name}</h2>
                <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
                  {bestOverall.operator} • {bestOverall.city}, {bestOverall.state}
                </p>
              </div>

              <p className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-xs sm:text-sm leading-relaxed text-emerald-50">
                {bestOverall.recommendationReason}
              </p>

              {/* 3 Metrics: Queue + Pressure + Detour */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
                <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 text-center sm:text-left">
                  <div className="text-[10px] text-emerald-200 uppercase font-bold flex items-center justify-center sm:justify-start gap-1">
                    <Users size={11} /> Queue
                  </div>
                  <div className="text-base sm:text-xl font-black text-amber-300">
                    {bestOverall.vehiclesWaiting ?? 0} Cars
                  </div>
                  <div className="text-[10px] text-emerald-100 truncate">
                    ~{bestOverall.estimatedWaitMinutes ?? 2} min wait
                  </div>
                </div>

                <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 text-center sm:text-left">
                  <div className="text-[10px] text-emerald-200 uppercase font-bold flex items-center justify-center sm:justify-start gap-1">
                    <Zap size={11} /> Pressure
                  </div>
                  <div className="text-base sm:text-xl font-black text-emerald-300">
                    {bestOverall.currentPressureBar ? `${Math.round(bestOverall.currentPressureBar)} Bar` : '216 Bar'}
                  </div>
                  <div className="text-[10px] text-emerald-100">Super Fast Fill</div>
                </div>

                <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 text-center sm:text-left">
                  <div className="text-[10px] text-emerald-200 uppercase font-bold flex items-center justify-center sm:justify-start gap-1">
                    <Navigation size={11} /> Detour
                  </div>
                  <div className="text-base sm:text-xl font-black text-white">
                    +{bestOverall.extraDetourKm ?? 0.4} km
                  </div>
                  <div className="text-[10px] text-emerald-100 truncate">
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
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center border border-white/20 transition flex items-center justify-center gap-1.5"
              >
                <span>View Live Telemetry</span> ↗
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tab Switcher: Map vs List */}
      <div className="flex lg:hidden bg-white p-1 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileView('map')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
            mobileView === 'map' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
          }`}
        >
          <MapIcon size={14} /> <span>Interactive Map</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
            mobileView === 'list' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
          }`}
        >
          <List size={14} /> <span>Stations List ({stations.length})</span>
        </button>
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Map Column */}
        <div className={`lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm border border-slate-200 space-y-2.5 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">Live Highway Map View</h3>
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
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">
              Stations Along Route ({stations.length})
            </h3>
            <span className="text-[10px] sm:text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              Sorted by Convenience
            </span>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-0.5">
            {stations.map((st, index) => {
              const isBest = st.recommendationCategory === 'BEST_OVERALL';
              const isSelected = selectedStation?.id === st.id;
              const pressure = st.currentPressureBar ? Math.round(st.currentPressureBar) : null;
              const isHighPressure = pressure && pressure >= 195;

              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className={`rounded-2xl p-3.5 sm:p-4 border transition cursor-pointer relative ${
                    isBest
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : isSelected
                      ? 'border-slate-800 bg-slate-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {isBest && (
                    <span className="absolute -top-2.5 right-3 bg-amber-400 text-slate-950 text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Star size={10} className="fill-slate-950" /> Best Choice
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black text-slate-400">#{index + 1}</span>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{st.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {st.operator || 'CNG'} • {st.city}
                      </p>
                    </div>
                  </div>

                  {/* 3 Metric Mini Cards */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 mb-3 text-center">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Queue</div>
                      <div className="text-xs sm:text-sm font-extrabold text-slate-800">
                        {st.vehiclesWaiting ?? 0} Cars
                      </div>
                      <div className="text-[9px] text-slate-500">
                        ~{st.estimatedWaitMinutes ?? 2} min
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Pressure</div>
                      <div
                        className={`text-xs sm:text-sm font-extrabold ${
                          isHighPressure ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {pressure ? `${pressure} Bar` : 'N/A'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {isHighPressure ? 'Fast Fill' : 'Moderate'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Detour</div>
                      <div className="text-xs sm:text-sm font-extrabold text-slate-800">
                        +{st.extraDetourKm != null ? `${st.extraDetourKm} km` : '0.4 km'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        ~{st.estimatedDetourMinutes ?? 1} min
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Navigation size={12} /> Directions ↗
                    </a>
                    <Link
                      to={`/stations/${st.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
                    >
                      Details
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportModalStation(st);
                      }}
                      title="Update Live Status"
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition text-xs"
                    >
                      📝
                    </button>
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
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}
