import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Navigation,
  Star,
  Zap,
  RotateCcw,
  Sparkles,
  Map as MapIcon,
  List,
  Info,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Compass,
  UserCheck,
  Fuel,
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
import { DEFAULT_CORRIDOR } from '../data/corridors';
import type {
  StationSummaryDto,
  RecommendationCategory,
} from '../types';

export default function RouteResults() {
  const navigate = useNavigate();
  const {
    activeRouteResult,
    isLoading,
    planSmartRoute,
    submitCommunityReport,
    submitIncorrectFlag,
    markStationVisited,
    driverProfile,
  } = useAppContext();

  const [selectedStation, setSelectedStation] = useState<StationSummaryDto | null>(null);
  const [reportModalStation, setReportModalStation] = useState<StationSummaryDto | null>(null);
  const [flagModalStation, setFlagModalStation] = useState<StationSummaryDto | null>(null);
  const [postVisitStation, setPostVisitStation] = useState<StationSummaryDto | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [activeTabCategory, setActiveTabCategory] = useState<RecommendationCategory>('BEST_OVERALL');
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);

  useEffect(() => {
    if (!activeRouteResult && !isLoading) {
      planSmartRoute({
        startLat: DEFAULT_CORRIDOR.startLat,
        startLng: DEFAULT_CORRIDOR.startLng,
        startAddress: DEFAULT_CORRIDOR.startAddress,
        destLat: DEFAULT_CORRIDOR.destLat,
        destLng: DEFAULT_CORRIDOR.destLng,
        destAddress: DEFAULT_CORRIDOR.destAddress,
        maxDetourKm: 5,
      }).catch(() => {});
    }
  }, [activeRouteResult, isLoading, planSmartRoute]);

  if (isLoading || !activeRouteResult || !activeRouteResult.stations || activeRouteResult.stations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-2 sm:px-4">
        <RouteResultsSkeleton />
      </div>
    );
  }

  const {
    startAddress,
    destAddress,
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

  const heroStation =
    activeTabCategory === 'BEST_OVERALL'
      ? bestOverall || stations[0]
      : activeTabCategory === 'FASTEST_REFUELING'
      ? fastestRefueling || stations[0]
      : nearestStation || stations[0];

  const originDisplay = startAddress || stations[0]?.city || 'Origin Corridor';
  const destDisplay = destAddress || stations[stations.length - 1]?.city || 'Destination';

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-[#243447]">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/plan')}
            aria-label="Back to Journey Planner"
            className="p-2 sm:p-2.5 rounded-xl border border-[#DCE5EE] bg-[#F8FAFC] hover:bg-[#E8EEF5] text-[#64748B] hover:text-[#14283F] transition shadow-xs"
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bg-[#14283F] text-[#16B8C9] rounded-lg">
                <Fuel size={14} />
              </span>
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#14283F]">
                CNG Navigator
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-[#14283F] bg-[#E8EEF5] border border-[#DCE5EE] px-2 py-0.5 rounded-full">
                Trip Intelligence
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-semibold mt-0.5">
              Corridor Telemetry &amp; Smart Refueling Guidance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {driverProfile && (
            <Link
              to="/settings"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5EE] text-xs font-bold text-[#243447] hover:border-[#16B8C9] transition shadow-xs"
              title="View Contributor Profile"
            >
              <UserCheck size={14} className="text-[#16B8C9]" />
              <span className="text-[11px]">{driverProfile.driverId}</span>
              <span className="text-[10px] text-[#26734D] font-black">({driverProfile.trustScore}%)</span>
            </Link>
          )}

          <button
            onClick={() => navigate('/plan')}
            className="px-3.5 py-2 text-xs font-bold text-[#14283F] bg-[#F8FAFC] border border-[#DCE5EE] rounded-xl hover:bg-[#E8EEF5] transition flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw size={13} className="text-[#16B8C9]" />
            <span>Change Route</span>
          </button>
        </div>
      </div>

      {/* 2. ROUTE SUMMARY HERO CARD (Deep Navy Minimal) */}
      <div className="bg-[#14283F] rounded-[14px] p-5 sm:p-6 shadow-sm relative overflow-hidden text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-[#16B8C9] border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16B8C9] animate-pulse" />
                Live Corridor Optimized
              </span>
              <span className="text-[10.5px] font-bold text-slate-300 uppercase tracking-wider">
                Multi-Factor Score Active
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-lg font-black text-white">
              <span className="truncate max-w-[150px] sm:max-w-[220px]">
                {originDisplay}
              </span>
              <div className="flex items-center gap-1.5 text-[#16B8C9] flex-shrink-0">
                <span className="h-[2px] w-6 sm:w-10 bg-[#16B8C9]/40 rounded-full" />
                <ArrowRight size={14} className="text-[#16B8C9]" />
                <span className="h-[2px] w-6 sm:w-10 bg-[#16B8C9]/40 rounded-full" />
              </div>
              <span className="truncate max-w-[150px] sm:max-w-[220px]">
                {destDisplay}
              </span>
            </div>

            <p className="text-[11.5px] text-slate-300 leading-relaxed">
              Highway trajectory scanned across <strong>{stations.length} CNG stations</strong>. Recommendations prioritize high compression pressure (&gt;200 Bar), vehicle queue length, and minimal detour overhead.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 flex-shrink-0">
            <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300 block">Distance</span>
              <span className="text-base sm:text-xl font-black text-white mt-0.5 block">{totalDistanceKm} km</span>
              <span className="text-[9.5px] text-slate-400 block font-medium">total route</span>
            </div>

            <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300 block">Travel Time</span>
              <span className="text-base sm:text-xl font-black text-[#16B8C9] mt-0.5 block">~{totalDurationMinutes}m</span>
              <span className="text-[9.5px] text-slate-400 block font-medium">highway drive</span>
            </div>

            <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300 block">CNG Stations</span>
              <span className="text-base sm:text-xl font-black text-[#26734D] mt-0.5 block">{stations.length}</span>
              <span className="text-[9.5px] text-slate-400 block font-medium">evaluated</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-[#16B8C9] flex-shrink-0" />
            <span>
              <strong className="text-white">Transparency Notice:</strong> Telemetry runs on simulated baseline SCADA data for evaluation. Community driver reports and forecasts update live.
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider bg-white/10 text-slate-200 border border-white/20 px-2 py-0.5 rounded-md">
            DEMO DATA FEED
          </span>
        </div>
      </div>

      {/* 3. 3-CATEGORY SELECTOR TABS */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-[#F8FAFC] p-1.5 rounded-[14px] border border-[#DCE5EE] shadow-card">
        <button
          type="button"
          onClick={() => setActiveTabCategory('BEST_OVERALL')}
          className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 text-center ${
            activeTabCategory === 'BEST_OVERALL'
              ? 'bg-[#14283F] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#14283F] hover:bg-[#E8EEF5]'
          }`}
        >
          <Star size={14} className={activeTabCategory === 'BEST_OVERALL' ? 'text-[#16B8C9]' : ''} />
          <span className="truncate">1. BEST OVERALL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabCategory('FASTEST_REFUELING')}
          className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 text-center ${
            activeTabCategory === 'FASTEST_REFUELING'
              ? 'bg-[#14283F] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#14283F] hover:bg-[#E8EEF5]'
          }`}
        >
          <Zap size={14} className={activeTabCategory === 'FASTEST_REFUELING' ? 'text-[#16B8C9]' : ''} />
          <span className="truncate">2. FASTEST REFUEL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabCategory('NEAREST_STATION')}
          className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 text-center ${
            activeTabCategory === 'NEAREST_STATION'
              ? 'bg-[#14283F] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#14283F] hover:bg-[#E8EEF5]'
          }`}
        >
          <Navigation size={14} className={activeTabCategory === 'NEAREST_STATION' ? 'text-[#16B8C9]' : ''} />
          <span className="truncate">3. NEAREST STATION</span>
        </button>
      </div>

      {/* 4. HERO RECOMMENDATION CARD */}
      {heroStation && (
        <div className="bg-[#F8FAFC] rounded-[14px] p-5 sm:p-7 text-[#243447] shadow-card relative overflow-hidden border border-[#DCE5EE] border-l-4 border-l-[#16B8C9] space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-[#E8EEF5] text-[#14283F] border border-[#DCE5EE]"
                >
                  <Star size={12} className="text-[#16B8C9] fill-[#16B8C9]" />
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
                <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-[#14283F]">
                  {heroStation.name}
                </h2>
                <p className="text-[#64748B] text-xs sm:text-sm font-semibold mt-0.5">
                  {heroStation.operator} • {heroStation.address}, {heroStation.city}
                </p>
              </div>

              <div className="p-3.5 bg-[#E8EEF5] rounded-xl border border-[#DCE5EE] text-xs sm:text-sm leading-relaxed text-[#243447]">
                <span className="font-black text-[#14283F]">Why recommended: </span>
                {heroStation.recommendationReason}
              </div>
            </div>

            <div className="w-full lg:w-64 space-y-2.5 flex-shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${heroStation.latitude},${heroStation.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white font-extrabold text-xs uppercase tracking-wider text-center shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Navigation size={16} /> Start Turn-by-Turn Nav ↗
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportModalStation(heroStation)}
                  className="py-2 px-3 rounded-xl bg-[#E8EEF5] hover:bg-[#DCE5EE] text-[#14283F] font-bold text-xs text-center border border-[#DCE5EE] transition flex items-center justify-center gap-1"
                >
                  <Sparkles size={13} className="text-[#98651C]" />
                  <span>Report</span>
                </button>

                <Link
                  to={`/stations/${heroStation.id}`}
                  className="py-2 px-3 rounded-xl bg-[#E8EEF5] hover:bg-[#DCE5EE] text-[#14283F] font-bold text-xs text-center border border-[#DCE5EE] transition flex items-center justify-center gap-1"
                >
                  <span>Details ↗</span>
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setPostVisitStation(heroStation)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#E3F4EC] hover:bg-[#D0EDDF] text-[#26734D] font-bold text-xs text-center border border-[#C0E4D0] transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 size={14} />
                <span>Mark as Visited &amp; Verify</span>
              </button>
            </div>
          </div>

          {heroStation.arrivalPrediction && (
            <div className="pt-2">
              <ArrivalPredictionCard prediction={heroStation.arrivalPrediction} />
            </div>
          )}
        </div>
      )}

      {/* 5. Alternative Comparison Matrix */}
      <AlternativeComparisonTable
        stations={stations}
        onSelectStation={(st) => setSelectedStation(st)}
      />

      {/* 6. Mobile View Switcher */}
      <div className="flex lg:hidden bg-[#F8FAFC] p-1.5 rounded-xl border border-[#DCE5EE] shadow-card text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileView('map')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
            mobileView === 'map'
              ? 'bg-[#14283F] text-white shadow-xs'
              : 'text-[#64748B]'
          }`}
        >
          <MapIcon size={14} /> <span>Interactive Map View</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
            mobileView === 'list'
              ? 'bg-[#14283F] text-white shadow-xs'
              : 'text-[#64748B]'
          }`}
        >
          <List size={14} /> <span>Stations List ({stations.length})</span>
        </button>
      </div>

      {/* 7. Main Grid: Map & Station List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Map Column */}
        <div
          className={`lg:col-span-7 bg-[#F8FAFC] rounded-[14px] p-3.5 sm:p-4 shadow-card border border-[#DCE5EE] space-y-3 ${
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-[#14283F] flex items-center gap-1.5">
                <Compass size={14} className="text-[#16B8C9]" />
                <span>Live Google Maps Corridor</span>
              </h3>
              <p className="text-[11px] text-[#64748B]">
                {activeRouteResult.routeSource || 'Google Routes API with live traffic & telemetry'}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-[#64748B] font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#26734D]" /> &gt;195 Bar
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#98651C]" /> Moderate
              </span>
            </div>
          </div>

          {/* Alternative Routes Selector (Google Routes API) */}
          {activeRouteResult.drivingRouteOptions && activeRouteResult.drivingRouteOptions.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-1">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex-shrink-0">
                Routes:
              </span>
              {activeRouteResult.drivingRouteOptions.map((opt: any, idx: number) => {
                const isSelected = selectedRouteIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedRouteIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border flex-shrink-0 ${
                      isSelected
                        ? 'bg-[#14283F] text-white border-[#14283F] shadow-xs'
                        : 'bg-[#E8EEF5] text-[#64748B] border-[#DCE5EE] hover:bg-[#DCE5EE] hover:text-[#14283F]'
                    }`}
                  >
                    <span>{idx === 0 ? 'Primary Route' : `Alternative ${idx}`}</span>
                    <span className="text-[10.5px] opacity-90 font-mono">
                      {opt.distanceKm} km • ~{opt.durationInTrafficMinutes || opt.durationMinutes}m
                    </span>
                    {opt.trafficDelayMinutes > 0 && (
                      <span className="text-[9.5px] text-[#F59E0B] font-bold">
                        (+{opt.trafficDelayMinutes}m traffic)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <StationMap
            stations={stations}
            routeGeometry={
              activeRouteResult.drivingRouteOptions && activeRouteResult.drivingRouteOptions[selectedRouteIndex]
                ? activeRouteResult.drivingRouteOptions[selectedRouteIndex].geometry
                : routeGeometry
            }
            startPoint={startCoord}
            destPoint={destCoord}
            selectedStationId={selectedStation?.id || heroStation?.id}
            onStationClick={(st) => setSelectedStation(st)}
            height="530px"
            alternativeRoutes={activeRouteResult.drivingRouteOptions}
            selectedRouteIndex={selectedRouteIndex}
            onSelectRouteIndex={(idx) => setSelectedRouteIndex(idx)}
          />
        </div>

        {/* Stations List Column */}
        <div
          className={`lg:col-span-5 space-y-3.5 ${
            mobileView === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-xs sm:text-sm text-[#14283F]">
              All Stations on Route ({stations.length})
            </h3>
            <span className="text-[10px] text-[#14283F] font-black bg-[#E8EEF5] border border-[#DCE5EE] px-2 py-0.5 rounded-md uppercase tracking-wider">
              Ranked by Score
            </span>
          </div>

          <div className="space-y-3 max-h-[710px] overflow-y-auto pr-0.5 scrollbar-thin">
            {stations.map((st, index) => {
              const isHero = heroStation && heroStation.id === st.id;
              const isSelected = selectedStation?.id === st.id;
              const pressure = st.currentPressureBar ? Math.round(st.currentPressureBar) : null;
              const isHighPressure = pressure && pressure >= 195;

              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className={`rounded-[14px] p-4 border transition cursor-pointer relative shadow-card ${
                    isHero
                      ? 'border-[#14283F] bg-[#F8FAFC] ring-2 ring-[#16B8C9]/30'
                      : isSelected
                      ? 'border-[#16B8C9] bg-[#E8EEF5]'
                      : 'border-[#DCE5EE] bg-[#F8FAFC] hover:border-[#CBD5E1]'
                  }`}
                >
                  {st.recommendationCategory && (
                    <span className="absolute -top-2.5 right-4 bg-[#14283F] text-white text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <Star size={10} className="text-[#16B8C9] fill-[#16B8C9]" />
                      {st.recommendationCategory.replace('_', ' ')}
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[#64748B]">#{index + 1}</span>
                        <h4 className="font-bold text-xs sm:text-sm text-[#14283F] truncate">{st.name}</h4>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5 truncate font-medium">
                        {st.operator || 'CNG'} • {st.city}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-[#14283F]">+{st.extraDetourKm ?? 0.4} km</span>
                      <span className="text-[10px] text-[#64748B] block font-semibold">
                        ~{st.estimatedDetourMinutes ?? 1}m detour
                      </span>
                    </div>
                  </div>

                  <div className="mb-2.5">
                    <DataStatusBadge
                      status={st.verificationStatus}
                      dataSourceLabel={st.dataSourceLabel}
                      lastUpdatedTimestamp={st.lastUpdatedTimestamp}
                      confidenceScore={st.dataConfidenceScore}
                      size="sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#E8EEF5] rounded-xl p-2.5 border border-[#DCE5EE] my-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#64748B] block">
                        Measured Pressure
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span
                          className={`text-sm font-black ${
                            isHighPressure ? 'text-[#26734D]' : 'text-[#98651C]'
                          }`}
                        >
                          {pressure ? `${pressure} Bar` : 'N/A'}
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          {isHighPressure ? '(Fast Fill)' : '(Standard)'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#64748B] block">
                        Measured Queue
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-[#14283F]">
                          {st.vehiclesWaiting ?? 0} Cars
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          ~{st.estimatedWaitMinutes ?? 2}m wait
                        </span>
                      </div>
                    </div>
                  </div>

                  {st.arrivalPrediction && (
                    <div className="mb-2.5">
                      <ArrivalPredictionCard prediction={st.arrivalPrediction} compact={true} />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2.5 border-t border-[#DCE5EE] text-xs">
                    <span className="text-[11px] font-black text-[#14283F]">
                      ₹{st.verifiedPricePerKg ?? 82.5}/kg
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFlagModalStation(st);
                        }}
                        className="p-1.5 rounded-lg border border-[#DCE5EE] text-[#64748B] hover:text-[#B54747] hover:bg-[#FCEAEA] transition"
                        title="Report incorrect information"
                      >
                        <AlertTriangle size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPostVisitStation(st);
                        }}
                        className="p-1.5 rounded-lg border border-[#C0E4D0] text-[#26734D] hover:bg-[#E3F4EC] transition"
                        title="Mark as Visited & Verify Accuracy"
                      >
                        <CheckCircle2 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportModalStation(st);
                        }}
                        className="py-1 px-2 rounded-lg bg-[#E8EEF5] text-[#14283F] hover:bg-[#DCE5EE] border border-[#DCE5EE] text-[11px] font-bold transition flex items-center gap-1"
                        title="Update Live Status"
                      >
                        <Sparkles size={12} className="text-[#98651C]" />
                        <span>Update</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-1 px-2.5 rounded-lg bg-[#14283F] hover:bg-[#1D3854] text-white font-bold text-[11px] transition flex items-center gap-1 shadow-xs"
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

      <ReportStatusModal
        isOpen={!!reportModalStation}
        station={reportModalStation}
        onClose={() => setReportModalStation(null)}
        onSubmit={(payload) => submitCommunityReport(payload)}
      />

      <ReportIncorrectModal
        isOpen={!!flagModalStation}
        station={flagModalStation}
        onClose={() => setFlagModalStation(null)}
        onSubmitFlag={(payload) => submitIncorrectFlag(payload)}
      />

      <PostVisitModal
        isOpen={!!postVisitStation}
        station={postVisitStation}
        onClose={() => setPostVisitStation(null)}
        onSubmitVisit={(record) => markStationVisited(record)}
      />
    </div>
  );
}
