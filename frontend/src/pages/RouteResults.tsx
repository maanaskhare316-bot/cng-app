import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  MapPin,
  Zap,
  Clock,
  Gauge,
  Navigation,
  CheckCircle,
  Share2,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Users,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationMap } from '../components/map/StationMap';
import { ReportStatusModal } from '../components/stations/ReportStatusModal';
import { formatDistance, formatDuration, formatPressure, formatPrice } from '../utils/formatters';
import type { StationSummaryDto, RouteSearchResultDto } from '../types';

export default function RouteResults() {
  const navigate = useNavigate();
  const { activeRouteResult, updateStationTelemetry } = useAppContext();

  const [selectedStation, setSelectedStation] = useState<StationSummaryDto | null>(() => {
    return activeRouteResult?.bestOverall || (activeRouteResult?.stations && activeRouteResult.stations[0]) || null;
  });

  const [reportModalStation, setReportModalStation] = useState<StationSummaryDto | null>(null);

  if (!activeRouteResult || !activeRouteResult.stations || activeRouteResult.stations.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
          🛣️
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">कोई यात्रा परिणाम नहीं मिला</h2>
        <p className="text-slate-500 text-xs mb-6 leading-relaxed">
          कृपया पहले यात्रा योजनाकार (Trip Planner) में जाकर शुरुआत और गंतव्य चुनकर खोजें।
        </p>
        <button
          onClick={() => navigate('/plan')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition"
        >
          यात्रा प्लान करें (Go to Trip Planner)
        </button>
      </div>
    );
  }

  const { totalDistanceKm, totalDurationMinutes, routeGeometry, stations, bestOverall } = activeRouteResult;

  const startCoord = routeGeometry && routeGeometry.length > 0 ? { lat: routeGeometry[0][0], lng: routeGeometry[0][1] } : undefined;
  const destCoord = routeGeometry && routeGeometry.length > 1 ? { lat: routeGeometry[routeGeometry.length - 1][0], lng: routeGeometry[routeGeometry.length - 1][1] } : undefined;

  const handleReportSubmit = (stationId: number, vehicles: number, pressure: number) => {
    updateStationTelemetry(stationId, vehicles, pressure);
    // Update active route result station locally
    const target = stations.find((s) => s.id === stationId);
    if (target) {
      target.vehiclesWaiting = vehicles;
      target.currentPressureBar = pressure;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/plan')}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              यात्रा परिणाम: सर्वोत्तम CNG स्टेशन सुझाव
            </h1>
            <p className="text-xs text-slate-500">
              कुल दूरी: <strong>{totalDistanceKm} km</strong> • अनुमानित समय: <strong>~{totalDurationMinutes} mins</strong> •{' '}
              <strong>{stations.length}</strong> CNG पंप मार्ग में मिले
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/plan')}
          className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"
        >
          <RotateCcw size={14} /> रूट बदलें (Change Route)
        </button>
      </div>

      {/* 🏆 BEST OVERALL RECOMMENDATION HERO CARD */}
      {bestOverall && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/30">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                <Star size={14} className="fill-slate-950" />
                सर्वोत्तम सुझाव (AI Recommended Choice)
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{bestOverall.name}</h2>
                <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
                  {bestOverall.operator} • {bestOverall.address}, {bestOverall.city}
                </p>
              </div>

              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs sm:text-sm leading-relaxed text-emerald-50">
                {bestOverall.recommendationReason}
              </div>

              {/* 3 Metric Badges: Less Queue + High Pressure + Low Detour */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="bg-black/25 rounded-2xl p-3 border border-white/10">
                  <div className="text-[10px] text-emerald-200 uppercase font-bold flex items-center gap-1">
                    <Users size={12} /> कतार (Queue)
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-300">
                    {bestOverall.vehiclesWaiting ?? 0} गाड़ियाँ
                  </div>
                  <div className="text-[10px] text-emerald-100">
                    ~{bestOverall.estimatedWaitMinutes ?? 2} मिनट वेटिंग
                  </div>
                </div>

                <div className="bg-black/25 rounded-2xl p-3 border border-white/10">
                  <div className="text-[10px] text-emerald-200 uppercase font-bold flex items-center gap-1">
                    <Zap size={12} /> प्रेशर (Pressure)
                  </div>
                  <div className="text-lg sm:text-xl font-black text-emerald-300">
                    {bestOverall.currentPressureBar ? `${Math.round(bestOverall.currentPressureBar)} Bar` : '218 Bar'}
                  </div>
                  <div className="text-[10px] text-emerald-100">सुपर फास्ट गैस भराई</div>
                </div>

                <div className="bg-black/25 rounded-2xl p-3 border border-white/10">
                  <div className="text-[10px] text-emerald-200 uppercase font-bold flex items-center gap-1">
                    <Navigation size={12} /> डिटूर (Detour)
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white">
                    +{bestOverall.extraDetourKm ?? 0.4} km
                  </div>
                  <div className="text-[10px] text-emerald-100">
                    ~{bestOverall.estimatedDetourMinutes ?? 1} मिनट अतिरिक्त
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons on hero card */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-64 flex-shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${bestOverall.latitude},${bestOverall.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider text-center shadow-lg transition flex items-center justify-center gap-2"
              >
                <Navigation size={16} /> Google Maps नेविगेशन शुरू करें
              </a>

              <Link
                to={`/stations/${bestOverall.id}`}
                className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center border border-white/20 transition flex items-center justify-center gap-1.5"
              >
                <span>लाइव टेलीमेट्री व इतिहास</span> ↗
              </Link>

              <button
                type="button"
                onClick={() => setReportModalStation(bestOverall)}
                className="w-full py-2.5 px-4 rounded-2xl bg-black/30 hover:bg-black/50 text-emerald-200 font-semibold text-xs text-center border border-emerald-400/30 transition flex items-center justify-center gap-1.5"
              >
                <span>पंप स्थिति रिपोर्ट करें (Report Live)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Interactive Map + Station Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Map */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">मार्ग दृश्य (Route & Stations on Google Map)</h3>
              <p className="text-xs text-slate-400">
                रूट के सभी स्टेशन दिखाए गए हैं। किसी भी स्टेशन पर क्लिक करके जानकारी देखें।
              </p>
            </div>
          </div>

          <StationMap
            stations={stations}
            routeGeometry={routeGeometry}
            startPoint={startCoord}
            destPoint={destCoord}
            selectedStationId={selectedStation?.id}
            onStationClick={(st) => setSelectedStation(st)}
            height="560px"
          />
        </div>

        {/* Right: Station Ranked Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-sm text-slate-800">
              मार्ग के सभी CNG स्टेशन ({stations.length})
            </h3>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              कम गाड़ी + ज्यादा प्रेशर के क्रम में
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {stations.map((st, index) => {
              const isBest = st.recommendationCategory === 'BEST_OVERALL';
              const isSelected = selectedStation?.id === st.id;
              const pressure = st.currentPressureBar ? Math.round(st.currentPressureBar) : null;
              const isHighPressure = pressure && pressure >= 195;

              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className={`rounded-2xl p-4 border transition cursor-pointer relative ${
                    isBest
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : isSelected
                      ? 'border-slate-800 bg-slate-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {isBest && (
                    <span className="absolute -top-2.5 right-4 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Star size={10} className="fill-slate-950" /> सर्वोत्तम (Best)
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-400">#{index + 1}</span>
                        <h4 className="font-bold text-sm text-slate-900 truncate">{st.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {st.operator || 'CNG'} • {st.city}
                      </p>
                    </div>
                  </div>

                  {/* Metrics bar */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 mb-3 text-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">कतार (Queue)</div>
                      <div className="text-sm font-extrabold text-slate-800">
                        {st.vehiclesWaiting ?? 0} गाड़ियाँ
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ~{st.estimatedWaitMinutes ?? 2} min
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">प्रेशर (Pressure)</div>
                      <div
                        className={`text-sm font-extrabold ${
                          isHighPressure ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {pressure ? `${pressure} Bar` : 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isHighPressure ? 'तेज़ भराई' : 'मध्यम'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">डिटूर (Detour)</div>
                      <div className="text-sm font-extrabold text-slate-800">
                        +{st.extraDetourKm != null ? `${st.extraDetourKm} km` : '0.4 km'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ~{st.estimatedDetourMinutes ?? 1} min
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1"
                    >
                      <Navigation size={13} /> दिशा-निर्देश (Directions)
                    </a>
                    <Link
                      to={`/stations/${st.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
                    >
                      विवरण (Details)
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportModalStation(st);
                      }}
                      title="Update Live Telemetry"
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition text-xs font-semibold"
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

      {/* Crowdsourced Report Modal */}
      <ReportStatusModal
        isOpen={!!reportModalStation}
        station={reportModalStation}
        onClose={() => setReportModalStation(null)}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}
