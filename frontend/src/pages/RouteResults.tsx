import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Navigation,
  Clock,
  Gauge,
  Users,
  Star,
  Zap,
  RotateCcw,
  Sparkles,
  Map as MapIcon,
  List,
  Info,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationMap } from '../components/map/StationMap';
import { ReportStatusModal } from '../components/stations/ReportStatusModal';
import { ReportIncorrectModal } from '../components/stations/ReportIncorrectModal';
import { DataStatusBadge } from '../components/stations/DataStatusBadge';
import { ArrivalPredictionCard } from '../components/stations/ArrivalPredictionCard';
import { AlternativeComparisonTable } from '../components/stations/AlternativeComparisonTable';
import { PostVisitModal } from '../components/stations/PostVisitModal';
import { RouteResultsSkeleton } from '../components/ui/SkeletonCard';
import type {
  StationSummaryDto,
  CommunityReportPayload,
  IncorrectInfoFlagPayload,
  RecommendationCategory,
} from '../types';

export default function RouteResults() {
  const navigate = useNavigate();
  const {
    activeRouteResult,
    isLoading,
    submitCommunityReport,
    submitIncorrectFlag,
    markStationVisited,
  } = useAppContext();

  const [selectedStation, setSelectedStation] = useState<StationSummaryDto | null>(null);
  const [reportModalStation, setReportModalStation] = useState<StationSummaryDto | null>(null);
  const [flagModalStation, setFlagModalStation] = useState<StationSummaryDto | null>(null);
  const [postVisitStation, setPostVisitStation] = useState<StationSummaryDto | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [activeTabCategory, setActiveTabCategory] = useState<RecommendationCategory>('BEST_OVERALL');

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <RouteResultsSkeleton />
      </div>
    );
  }

  if (!activeRouteResult || !activeRouteResult.stations || activeRouteResult.stations.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center bg-[#111827] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl text-slate-100">
        <div className="w-16 h-16 bg-emerald-950/60 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl border border-emerald-500/30">
          🛣️
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Route Planned Yet</h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
          Select your origin and destination in the Trip Planner to get intelligent arrival predictions and multi-factor recommendations.
        </p>
        <button
          onClick={() => navigate('/plan')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-lg"
        >
          Plan Your Trip
        </button>
      </div>
    );
  }

  const {
    totalDistanceKm,
    totalDurationMinutes,
    routeGeometry,
    stations,
    bestOverall,
    fastestRefueling,
    nearestStation,
  } = activeRouteResult;

  const startCoord =
    routeGeometry && routeGeometry.length > 0
      ? { lat: routeGeometry[0][0], lng: routeGeometry[0][1] }
      : undefined;
  const destCoord =
    routeGeometry && routeGeometry.length > 1
      ? { lat: routeGeometry[routeGeometry.length - 1][0], lng: routeGeometry[routeGeometry.length - 1][1] }
      : undefined;

  // Active hero station based on selected category tab
  const heroStation =
    activeTabCategory === 'BEST_OVERALL'
      ? bestOverall || stations[0]
      : activeTabCategory === 'FASTEST_REFUELING'
      ? fastestRefueling || stations[0]
      : nearestStation || stations[0];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-16 px-1 sm:px-0 text-slate-100">
      {/* Transparency Demo Banner */}
      <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2 text-purple-200">
          <Info size={15} className="text-purple-400 flex-shrink-0" />
          <span>
            <strong>Transparency Notice:</strong> Telemetry is running on simulated baseline data for testing. Community driver reports and arrival forecasts update in real-time.
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md flex-shrink-0">
          DEMO DATA
        </span>
      </div>

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/plan')}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-800 bg-[#111827] hover:bg-slate-800 text-slate-300 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
              Route Recommendations &amp; Arrival Predictions
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Corridor: <strong className="text-white">{totalDistanceKm} km</strong> • Est. Drive:{' '}
              <strong className="text-white">~{totalDurationMinutes} mins</strong> •{' '}
              <strong className="text-emerald-400">{stations.length}</strong> Stations Evaluated
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/plan')}
          className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-slate-200 bg-[#162032] border border-slate-700/80 rounded-xl hover:bg-[#1f2c44] transition flex items-center gap-1.5 shadow-sm"
        >
          <RotateCcw size={13} /> <span>Change Corridor</span>
        </button>
      </div>

      {/* 3-CATEGORY SELECTOR TABS (Section 3 Requirement) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-[#0d1525] p-1.5 rounded-2xl border border-slate-800 shadow-md">
        <button
          type="button"
          onClick={() => setActiveTabCategory('BEST_OVERALL')}
          className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 text-center ${
            activeTabCategory === 'BEST_OVERALL'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Star size={14} className={activeTabCategory === 'BEST_OVERALL' ? 'fill-white' : ''} />
          <span className="truncate">1. BEST OVERALL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabCategory('FASTEST_REFUELING')}
          className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 text-center ${
            activeTabCategory === 'FASTEST_REFUELING'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/40'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap size={14} className={activeTabCategory === 'FASTEST_REFUELING' ? 'fill-slate-950' : ''} />
          <span className="truncate">2. FASTEST REFUEL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabCategory('NEAREST_STATION')}
          className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 text-center ${
            activeTabCategory === 'NEAREST_STATION'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/40'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Navigation size={14} />
          <span className="truncate">3. NEAREST STATION</span>
        </button>
      </div>

      {/* 🏆 HERO CARD FOR ACTIVE RECOMMENDED CATEGORY */}
      {heroStation && (
        <div className="bg-gradient-to-r from-[#0a2725] via-[#0d2138] to-[#0c1626] rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-emerald-500/40 space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider shadow-sm ${
                    activeTabCategory === 'BEST_OVERALL'
                      ? 'bg-amber-400 text-slate-950'
                      : activeTabCategory === 'FASTEST_REFUELING'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-sky-500 text-white'
                  }`}
                >
                  <Star size={12} className="fill-current" />
                  {activeTabCategory === 'BEST_OVERALL'
                    ? 'Best Overall Choice'
                    : activeTabCategory === 'FASTEST_REFUELING'
                    ? 'Fastest Refueling Choice'
                    : 'Nearest Highway Station'}
                </span>

                <DataStatusBadge
                  status={heroStation.verificationStatus}
                  dataSourceLabel={heroStation.dataSourceLabel}
                  lastUpdatedTimestamp={heroStation.lastUpdatedTimestamp}
                  confidenceScore={heroStation.dataConfidenceScore}
                  isDemoData={heroStation.isDemoData}
                />
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight text-white">
                  {heroStation.name}
                </h2>
                <p className="text-emerald-300 text-xs sm:text-sm mt-0.5">
                  {heroStation.operator} • {heroStation.address}, {heroStation.city}
                </p>
              </div>

              {/* Explicit Reason for Recommendation */}
              <div className="p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-xs sm:text-sm leading-relaxed text-slate-200">
                <span className="font-extrabold text-amber-300">Why recommended: </span>
                {heroStation.recommendationReason}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full lg:w-64 space-y-2.5 flex-shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${heroStation.latitude},${heroStation.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider text-center shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <Navigation size={16} /> Start Turn-by-Turn Nav ↗
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportModalStation(heroStation)}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center border border-white/20 transition flex items-center justify-center gap-1"
                >
                  <Sparkles size={13} className="text-amber-400" />
                  <span>Report</span>
                </button>

                <Link
                  to={`/stations/${heroStation.id}`}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center border border-white/20 transition flex items-center justify-center gap-1"
                >
                  <span>Details ↗</span>
                </Link>
              </div>

              {/* One-Tap Mark as Visited & Verify */}
              <button
                type="button"
                onClick={() => setPostVisitStation(heroStation)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs text-center border border-emerald-500/30 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Mark as Visited &amp; Verify</span>
              </button>
            </div>
          </div>

          {/* Embedded Arrival Prediction for Hero Station */}
          {heroStation.arrivalPrediction && (
            <div className="pt-2">
              <ArrivalPredictionCard prediction={heroStation.arrivalPrediction} />
            </div>
          )}
        </div>
      )}

      {/* ⚖️ SECTION 3: ALTERNATIVE STATION COMPARISON (Side-by-side Top 3) */}
      <AlternativeComparisonTable
        stations={stations}
        onSelectStation={(st) => setSelectedStation(st)}
      />

      {/* Mobile Tab Switcher: Map vs List */}
      <div className="flex lg:hidden bg-[#111827] p-1 rounded-2xl border border-slate-800 shadow-md text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileView('map')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
            mobileView === 'map' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'
          }`}
        >
          <MapIcon size={14} /> <span>Interactive Map View</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
            mobileView === 'list' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'
          }`}
        >
          <List size={14} /> <span>Stations List ({stations.length})</span>
        </button>
      </div>

      {/* Main Responsive Grid: Map (Left 7 cols) & Station List (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Map Column */}
        <div
          className={`lg:col-span-7 bg-[#111827] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl border border-slate-800 space-y-2.5 ${
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white">Live Highway Corridor Map</h3>
              <p className="text-[11px] text-slate-400">
                Turn-by-turn navigation route with live pressure &amp; queue pins
              </p>
            </div>
          </div>

          <StationMap
            stations={stations}
            routeGeometry={routeGeometry}
            startPoint={startCoord}
            destPoint={destCoord}
            selectedStationId={selectedStation?.id || heroStation?.id}
            onStationClick={(st) => setSelectedStation(st)}
            height="520px"
          />
        </div>

        {/* Stations List Column */}
        <div
          className={`lg:col-span-5 space-y-3.5 ${
            mobileView === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-xs sm:text-sm text-white">
              All Stations on Route ({stations.length})
            </h3>
            <span className="text-[10px] sm:text-xs text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              Ranked by Multi-Factor Score
            </span>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-0.5">
            {stations.map((st, index) => {
              const isHero = heroStation && heroStation.id === st.id;
              const isSelected = selectedStation?.id === st.id;
              const pressure = st.currentPressureBar ? Math.round(st.currentPressureBar) : null;
              const isHighPressure = pressure && pressure >= 195;

              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className={`rounded-2xl p-4 border transition cursor-pointer relative shadow-lg ${
                    isHero
                      ? 'border-emerald-500 bg-emerald-950/20 ring-2 ring-emerald-500/30'
                      : isSelected
                      ? 'border-slate-600 bg-[#162032]'
                      : 'border-slate-800 bg-[#111827] hover:border-slate-700'
                  }`}
                >
                  {/* Category Pill if assigned */}
                  {st.recommendationCategory && (
                    <span className="absolute -top-2.5 right-4 bg-amber-400 text-slate-950 text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Star size={10} className="fill-slate-950" />
                      {st.recommendationCategory.replace('_', ' ')}
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-500">#{index + 1}</span>
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">{st.name}</h4>
                      </div>
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

                  {/* Verification Badge */}
                  <div className="mb-2.5">
                    <DataStatusBadge
                      status={st.verificationStatus}
                      dataSourceLabel={st.dataSourceLabel}
                      lastUpdatedTimestamp={st.lastUpdatedTimestamp}
                      confidenceScore={st.dataConfidenceScore}
                      size="sm"
                    />
                  </div>

                  {/* 2-box metric: Measured Pressure & Queue */}
                  <div className="grid grid-cols-2 gap-2 bg-[#0c1220] rounded-xl p-2.5 border border-slate-800 my-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        Measured Pressure
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span
                          className={`text-sm font-black ${
                            isHighPressure ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {pressure ? `${pressure} Bar` : 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isHighPressure ? '(Fast Fill)' : '(Standard)'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        Measured Queue
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-white">
                          {st.vehiclesWaiting ?? 0} Cars
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ~{st.estimatedWaitMinutes ?? 2}m wait
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Arrival Prediction */}
                  {st.arrivalPrediction && (
                    <div className="mb-2.5">
                      <ArrivalPredictionCard prediction={st.arrivalPrediction} compact={true} />
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 text-xs">
                    <span className="text-[11px] font-bold text-emerald-400">
                      ₹{st.verifiedPricePerKg ?? 82.5}/kg
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Flag Incorrect Info */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFlagModalStation(st);
                        }}
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-[#162032] transition"
                        title="Report incorrect information"
                      >
                        <AlertTriangle size={13} />
                      </button>

                      {/* Mark as Visited */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPostVisitStation(st);
                        }}
                        className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition"
                        title="Mark as Visited & Verify Accuracy"
                      >
                        <CheckCircle2 size={13} />
                      </button>

                      {/* Community Report */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportModalStation(st);
                        }}
                        className="py-1 px-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-[11px] font-bold transition flex items-center gap-1"
                        title="Update Live Status"
                      >
                        <Sparkles size={12} />
                        <span>Update</span>
                      </button>

                      {/* Google Maps Deep-link */}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition flex items-center gap-1 shadow-sm"
                      >
                        <span>Nav</span>
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

      {/* Community Report Modal */}
      <ReportStatusModal
        isOpen={!!reportModalStation}
        station={reportModalStation}
        onClose={() => setReportModalStation(null)}
        onSubmit={(payload) => submitCommunityReport(payload)}
      />

      {/* Flag Incorrect Info Modal */}
      <ReportIncorrectModal
        isOpen={!!flagModalStation}
        station={flagModalStation}
        onClose={() => setFlagModalStation(null)}
        onSubmitFlag={(payload) => submitIncorrectFlag(payload)}
      />

      {/* Post-Visit Verification Modal */}
      <PostVisitModal
        isOpen={!!postVisitStation}
        station={postVisitStation}
        onClose={() => setPostVisitStation(null)}
        onSubmitVisit={(record) => markStationVisited(record)}
      />
    </div>
  );
}
