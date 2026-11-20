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
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Compass,
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
      <div className="max-w-7xl mx-auto py-8 px-3">
        <RouteResultsSkeleton />
      </div>
    );
  }

  if (!activeRouteResult || !activeRouteResult.stations || activeRouteResult.stations.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center bg-[#101B2D] p-8 sm:p-10 rounded-[18px] border border-[#17263A] shadow-2xl text-slate-100">
        <div className="w-16 h-16 bg-[#17263A] text-[#16C7B2] rounded-[16px] flex items-center justify-center mx-auto mb-4 text-2xl border border-[#16C7B2]/30">
          <Compass size={32} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">No Corridor Active</h2>
        <p className="text-[#758397] text-xs sm:text-sm mb-6 leading-relaxed">
          Select your origin and destination in the Trip Planner to compute arrival predictions, detour dynamics, and live telemetry recommendations.
        </p>
        <button
          onClick={() => navigate('/plan')}
          className="bg-[#16C7B2] hover:bg-[#13b3a0] text-[#101B2D] font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-lg"
        >
          Plan New Journey
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

  // Derive origin & destination labels from station cities or corridor
  const firstCity = stations[0]?.city || 'Origin Corridor';
  const lastCity = stations[stations.length - 1]?.city || 'Destination';

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-slate-100">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. COMPACT MOBILITY HEADER & BREADCRUMBS
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/plan')}
            aria-label="Back to Journey Planner"
            className="p-2 sm:p-2.5 rounded-[12px] border border-[#17263A] bg-[#101B2D] hover:bg-[#17263A] text-slate-300 hover:text-white transition shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider font-extrabold text-[#16C7B2]">
              <span>CNG Navigator</span>
              <span>•</span>
              <span className="text-[#758397]">Route Intelligence</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
              Route Recommendations &amp; Arrival Predictions
            </h1>
          </div>
        </div>

        <button
          onClick={() => navigate('/plan')}
          className="px-3.5 py-2 text-xs font-bold text-slate-200 bg-[#17263A] border border-slate-700/60 rounded-[12px] hover:bg-[#20344f] transition flex items-center gap-1.5 shadow-sm"
        >
          <RotateCcw size={13} className="text-[#16C7B2]" /> <span>Change Corridor</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. ROUTE SUMMARY HERO CARD (Section 2 Requirement)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#101B2D] rounded-[18px] border border-[#17263A] p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle Electric Teal top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#16C7B2] via-[#B8E65A] to-transparent opacity-80" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Origin to Destination Visual Track */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#B8E65A]/15 text-[#B8E65A] border border-[#B8E65A]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8E65A] animate-pulse" />
                Live Corridor Optimized
              </span>
              <span className="text-[10px] font-bold text-[#758397] uppercase tracking-wider">
                Highway Telemetry Active
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-lg font-black text-white">
              <span className="truncate max-w-[160px] sm:max-w-[240px] text-white">
                {firstCity}
              </span>
              <div className="flex items-center gap-1.5 text-[#16C7B2] flex-shrink-0">
                <span className="h-[2px] w-6 sm:w-10 bg-[#16C7B2]/40 rounded-full" />
                <ArrowRight size={14} className="text-[#16C7B2]" />
                <span className="h-[2px] w-6 sm:w-10 bg-[#16C7B2]/40 rounded-full" />
              </div>
              <span className="truncate max-w-[160px] sm:max-w-[240px] text-white">
                {lastCity}
              </span>
            </div>

            <p className="text-[11.5px] text-[#758397]">
              Multi-factor evaluation prioritized by gas pressure (&gt;200 Bar), vehicle queue, and minimal detour.
            </p>
          </div>

          {/* Right: 3 Key Corridor Metrics */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 border-t lg:border-t-0 lg:border-l border-[#17263A] pt-4 lg:pt-0 lg:pl-6 flex-shrink-0">
            <div className="bg-[#17263A] p-3 rounded-[14px] border border-slate-700/40 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#758397] block">Distance</span>
              <span className="text-base sm:text-xl font-black text-white mt-0.5 block">{totalDistanceKm} km</span>
              <span className="text-[9.5px] text-[#758397] block">highway length</span>
            </div>

            <div className="bg-[#17263A] p-3 rounded-[14px] border border-slate-700/40 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#758397] block">Est. Drive</span>
              <span className="text-base sm:text-xl font-black text-[#16C7B2] mt-0.5 block">~{totalDurationMinutes}m</span>
              <span className="text-[9.5px] text-[#758397] block">non-stop drive</span>
            </div>

            <div className="bg-[#17263A] p-3 rounded-[14px] border border-slate-700/40 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#758397] block">CNG Pumps</span>
              <span className="text-base sm:text-xl font-black text-[#B8E65A] mt-0.5 block">{stations.length}</span>
              <span className="text-[9.5px] text-[#758397] block">evaluated</span>
            </div>
          </div>
        </div>

        {/* Transparency Demo Ribbon */}
        <div className="mt-4 pt-3 border-t border-[#17263A] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#758397]">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-[#16C7B2] flex-shrink-0" />
            <span>
              <strong className="text-slate-300">Transparency Notice:</strong> Telemetry runs on simulated baseline SCADA data for testing. Crowdsourced reports and forecasts update live.
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider bg-[#17263A] text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">
            DEMO DATA FEED
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. 3-CATEGORY SELECTOR TABS (Section 3 Requirement)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-[#101B2D] p-1.5 rounded-[16px] border border-[#17263A] shadow-md">
        <button
          type="button"
          onClick={() => setActiveTabCategory('BEST_OVERALL')}
          className={`py-2.5 px-2 sm:px-4 rounded-[12px] text-xs font-black transition flex items-center justify-center gap-1.5 text-center ${
            activeTabCategory === 'BEST_OVERALL'
              ? 'bg-[#B8E65A] text-[#101B2D] shadow-md shadow-[#B8E65A]/20'
              : 'text-[#758397] hover:text-white hover:bg-[#17263A]'
          }`}
        >
          <Star size={14} className={activeTabCategory === 'BEST_OVERALL' ? 'fill-[#101B2D]' : ''} />
          <span className="truncate">1. BEST OVERALL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabCategory('FASTEST_REFUELING')}
          className={`py-2.5 px-2 sm:px-4 rounded-[12px] text-xs font-black transition flex items-center justify-center gap-1.5 text-center ${
            activeTabCategory === 'FASTEST_REFUELING'
              ? 'bg-[#16C7B2] text-[#101B2D] shadow-md shadow-[#16C7B2]/20'
              : 'text-[#758397] hover:text-white hover:bg-[#17263A]'
          }`}
        >
          <Zap size={14} className={activeTabCategory === 'FASTEST_REFUELING' ? 'fill-[#101B2D]' : ''} />
          <span className="truncate">2. FASTEST REFUEL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabCategory('NEAREST_STATION')}
          className={`py-2.5 px-2 sm:px-4 rounded-[12px] text-xs font-black transition flex items-center justify-center gap-1.5 text-center ${
            activeTabCategory === 'NEAREST_STATION'
              ? 'bg-[#17263A] text-[#16C7B2] border border-[#16C7B2]/50 shadow-md'
              : 'text-[#758397] hover:text-white hover:bg-[#17263A]'
          }`}
        >
          <Navigation size={14} />
          <span className="truncate">3. NEAREST STATION</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. HERO RECOMMENDATION CARD (Electric Teal Highlighted)
      ───────────────────────────────────────────────────────────────────────────── */}
      {heroStation && (
        <div className="bg-[#101B2D] rounded-[18px] p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border-2 border-[#16C7B2]/60 space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider shadow-sm ${
                    activeTabCategory === 'BEST_OVERALL'
                      ? 'bg-[#B8E65A] text-[#101B2D]'
                      : activeTabCategory === 'FASTEST_REFUELING'
                      ? 'bg-[#16C7B2] text-[#101B2D]'
                      : 'bg-[#17263A] text-[#16C7B2] border border-[#16C7B2]/40'
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
                <p className="text-[#16C7B2] text-xs sm:text-sm font-semibold mt-0.5">
                  {heroStation.operator} • {heroStation.address}, {heroStation.city}
                </p>
              </div>

              {/* Explicit Reason for Recommendation */}
              <div className="p-3.5 bg-[#17263A] rounded-[14px] border border-slate-700/50 text-xs sm:text-sm leading-relaxed text-slate-200">
                <span className="font-black text-[#B8E65A]">Why recommended: </span>
                {heroStation.recommendationReason}
              </div>
            </div>

            {/* Prominent Action Buttons (Teal Primary) */}
            <div className="w-full lg:w-64 space-y-2.5 flex-shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${heroStation.latitude},${heroStation.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-[#16C7B2] hover:bg-[#13b3a0] text-[#101B2D] font-black text-xs uppercase tracking-wider text-center shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <Navigation size={16} /> Start Turn-by-Turn Nav ↗
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportModalStation(heroStation)}
                  className="py-2 px-3 rounded-xl bg-[#17263A] hover:bg-[#20344f] text-white font-bold text-xs text-center border border-slate-700 transition flex items-center justify-center gap-1"
                >
                  <Sparkles size={13} className="text-[#F4B740]" />
                  <span>Report</span>
                </button>

                <Link
                  to={`/stations/${heroStation.id}`}
                  className="py-2 px-3 rounded-xl bg-[#17263A] hover:bg-[#20344f] text-white font-bold text-xs text-center border border-slate-700 transition flex items-center justify-center gap-1"
                >
                  <span>Details ↗</span>
                </Link>
              </div>

              {/* One-Tap Mark as Visited & Verify */}
              <button
                type="button"
                onClick={() => setPostVisitStation(heroStation)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#B8E65A]/15 hover:bg-[#B8E65A]/25 text-[#B8E65A] font-bold text-xs text-center border border-[#B8E65A]/30 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 size={14} className="text-[#B8E65A]" />
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

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. ALTERNATIVE COMPARISON MATRIX (Top 3 Side-by-Side)
      ───────────────────────────────────────────────────────────────────────────── */}
      <AlternativeComparisonTable
        stations={stations}
        onSelectStation={(st) => setSelectedStation(st)}
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. MOBILE VIEW SWITCHER (Map vs List)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex lg:hidden bg-[#101B2D] p-1.5 rounded-[14px] border border-[#17263A] shadow-md text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileView('map')}
          className={`flex-1 py-2.5 rounded-[10px] flex items-center justify-center gap-1.5 transition ${
            mobileView === 'map'
              ? 'bg-[#16C7B2] text-[#101B2D] font-black shadow-sm'
              : 'text-[#758397]'
          }`}
        >
          <MapIcon size={14} /> <span>Interactive Map View</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2.5 rounded-[10px] flex items-center justify-center gap-1.5 transition ${
            mobileView === 'list'
              ? 'bg-[#16C7B2] text-[#101B2D] font-black shadow-sm'
              : 'text-[#758397]'
          }`}
        >
          <List size={14} /> <span>Stations List ({stations.length})</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          7. MAIN RESPONSIVE GRID: Map (Left 7 cols) & Station List (Right 5 cols)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Map Column */}
        <div
          className={`lg:col-span-7 bg-[#101B2D] rounded-[18px] p-3.5 sm:p-4 shadow-xl border border-[#17263A] space-y-3 ${
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                <Compass size={14} className="text-[#16C7B2]" />
                <span>Live Highway Corridor Map</span>
              </h3>
              <p className="text-[11px] text-[#758397]">
                Turn-by-turn trajectory with live gas pressure &amp; queue pins
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-[#758397] font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#B8E65A]" /> &gt;195 Bar
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#F4B740]" /> Moderate
              </span>
            </div>
          </div>

          <StationMap
            stations={stations}
            routeGeometry={routeGeometry}
            startPoint={startCoord}
            destPoint={destCoord}
            selectedStationId={selectedStation?.id || heroStation?.id}
            onStationClick={(st) => setSelectedStation(st)}
            height="530px"
          />
        </div>

        {/* Stations List Column */}
        <div
          className={`lg:col-span-5 space-y-3.5 ${
            mobileView === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-xs sm:text-sm text-white">
              All Stations on Route ({stations.length})
            </h3>
            <span className="text-[10px] text-[#16C7B2] font-black bg-[#16C7B2]/10 border border-[#16C7B2]/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
              Ranked by Score
            </span>
          </div>

          <div className="space-y-3 max-h-[710px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-800">
            {stations.map((st, index) => {
              const isHero = heroStation && heroStation.id === st.id;
              const isSelected = selectedStation?.id === st.id;
              const pressure = st.currentPressureBar ? Math.round(st.currentPressureBar) : null;
              const isHighPressure = pressure && pressure >= 195;

              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className={`rounded-[16px] p-4 border transition cursor-pointer relative shadow-lg ${
                    isHero
                      ? 'border-[#16C7B2] bg-[#101B2D] ring-2 ring-[#16C7B2]/20'
                      : isSelected
                      ? 'border-slate-500 bg-[#17263A]'
                      : 'border-[#17263A] bg-[#101B2D] hover:border-slate-700'
                  }`}
                >
                  {/* Category Pill if assigned */}
                  {st.recommendationCategory && (
                    <span className="absolute -top-2.5 right-4 bg-[#B8E65A] text-[#101B2D] text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Star size={10} className="fill-[#101B2D]" />
                      {st.recommendationCategory.replace('_', ' ')}
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[#758397]">#{index + 1}</span>
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">{st.name}</h4>
                      </div>
                      <p className="text-[11px] text-[#758397] mt-0.5 truncate font-medium">
                        {st.operator || 'CNG'} • {st.city}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-white">+{st.extraDetourKm ?? 0.4} km</span>
                      <span className="text-[10px] text-[#758397] block font-semibold">
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
                  <div className="grid grid-cols-2 gap-2 bg-[#17263A] rounded-[12px] p-2.5 border border-slate-700/50 my-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#758397] block">
                        Measured Pressure
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span
                          className={`text-sm font-black ${
                            isHighPressure ? 'text-[#B8E65A]' : 'text-[#F4B740]'
                          }`}
                        >
                          {pressure ? `${pressure} Bar` : 'N/A'}
                        </span>
                        <span className="text-[10px] text-[#758397]">
                          {isHighPressure ? '(Fast Fill)' : '(Standard)'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#758397] block">
                        Measured Queue
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-white">
                          {st.vehiclesWaiting ?? 0} Cars
                        </span>
                        <span className="text-[10px] text-[#758397]">
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
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#17263A] text-xs">
                    <span className="text-[11px] font-black text-[#16C7B2]">
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
                        className="p-1.5 rounded-lg border border-slate-700 text-[#758397] hover:text-[#EF6464] hover:bg-[#17263A] transition"
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
                        className="p-1.5 rounded-lg border border-[#B8E65A]/40 text-[#B8E65A] hover:bg-[#B8E65A]/15 transition"
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
                        className="py-1 px-2 rounded-lg bg-[#17263A] text-white hover:bg-[#223752] border border-slate-700 text-[11px] font-bold transition flex items-center gap-1"
                        title="Update Live Status"
                      >
                        <Sparkles size={12} className="text-[#F4B740]" />
                        <span>Update</span>
                      </button>

                      {/* Google Maps Deep-link */}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-1 px-2.5 rounded-lg bg-[#16C7B2] hover:bg-[#13b3a0] text-[#101B2D] font-black text-[11px] transition flex items-center gap-1 shadow-sm"
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

      {/* ─────────────────────────────────────────────────────────────────────────────
          8. PRESERVED INTERACTION MODALS
      ───────────────────────────────────────────────────────────────────────────── */}
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
