import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  ArrowLeft,
  Phone,
  Clock,
  Zap,
  Navigation,
  CheckCircle,
  Share2,
  Users,
  ShieldCheck,
  Star,
  Sparkles,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationMap } from '../components/map/StationMap';
import PressureGauge from '../components/stations/PressureGauge';
import QueueVisualizer from '../components/stations/QueueVisualizer';
import ReportStatusModal from '../components/stations/ReportStatusModal';
import ReportIncorrectModal from '../components/stations/ReportIncorrectModal';
import DataStatusBadge from '../components/stations/DataStatusBadge';
import ArrivalPredictionCard from '../components/stations/ArrivalPredictionCard';
import { computeArrivalPrediction } from '../utils/predictionEngine';
import { formatPressure, formatPrice, formatTimestamp } from '../utils/formatters';
import type {
  StationSummaryDto,
  CommunityReportPayload,
  IncorrectInfoFlagPayload,
} from '../types';

export default function StationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    stations,
    selectedStations,
    toggleStationSelection,
    submitCommunityReport,
    submitIncorrectFlag,
  } = useAppContext();

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFlagOpen, setIsFlagOpen] = useState(false);

  const station = stations.find((s) => String(s.id) === id);

  if (!station) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 bg-[#111827] rounded-3xl border border-slate-800 text-center text-slate-100">
        <span className="text-5xl">⛽</span>
        <h2 className="text-xl font-bold text-white">Station Not Found</h2>
        <p className="text-slate-400 text-xs">This station ID is not available or has been moved.</p>
        <button
          onClick={() => navigate('/stations')}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-500 transition shadow-md"
        >
          Back to Stations
        </button>
      </div>
    );
  }

  const isSelected = selectedStations.includes(Number(station.id));
  const isBest = station.recommendationCategory === 'BEST_OVERALL';
  const pressureVal = station.currentPressureBar ? Math.round(station.currentPressureBar) : 200;

  // Compute live arrival prediction for this station (assuming ~15 km typical highway query)
  const stationPrediction = useMemo(() => {
    const dist = station.distanceFromStartKm ?? 15;
    const etaMins = Math.max(3, Math.round((dist / 65) * 60));
    return computeArrivalPrediction(station, dist, etaMins);
  }, [station]);

  // Mock 2-hour telemetry history for charts
  const pData = [
    { time: '10:00', bar: Math.max(160, pressureVal - 8) },
    { time: '10:30', bar: Math.max(160, pressureVal - 4) },
    { time: '11:00', bar: Math.max(160, pressureVal - 12) },
    { time: '11:30', bar: Math.min(230, pressureVal + 3) },
    { time: '12:00', bar: pressureVal },
  ];

  const qData = [
    { time: '10:00', vehicles: Math.max(1, (station.vehiclesWaiting ?? 2) + 2) },
    { time: '10:30', vehicles: Math.max(1, (station.vehiclesWaiting ?? 2) + 4) },
    { time: '11:00', vehicles: Math.max(0, (station.vehiclesWaiting ?? 2) - 1) },
    { time: '11:30', vehicles: Math.max(1, (station.vehiclesWaiting ?? 2) + 1) },
    { time: '12:00', vehicles: station.vehiclesWaiting ?? 2 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-slate-100">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-[#162032] px-3.5 py-2 rounded-xl border border-slate-700/80 transition shadow-md"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-2">
          {/* Flag Incorrect Info */}
          <button
            type="button"
            onClick={() => setIsFlagOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-[#162032] font-bold text-xs transition flex items-center gap-1.5"
          >
            <AlertTriangle size={13} />
            <span>Report Issue</span>
          </button>

          {/* Submit Community Report */}
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Update Live Telemetry</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Station Hero Card */}
          <div className="bg-[#111827] rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                {isBest && (
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 shadow-sm">
                    <Star size={12} className="fill-slate-950" /> Best Overall Choice
                  </span>
                )}
                <h1 className="text-2xl font-black text-white leading-tight">{station.name}</h1>
                <p className="text-xs font-semibold text-emerald-400 mt-0.5">{station.operator}</p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <span>📍</span> {station.address}, {station.city}, {station.state}
                </p>
              </div>

              {/* Status Pill */}
              <div className="flex flex-col items-start sm:items-end gap-1.5">
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                    station.verifiedOpen && station.cngAvailability === 'AVAILABLE'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                      : 'bg-red-950 text-red-400 border-red-500/40'
                  }`}
                >
                  {station.verifiedOpen && station.cngAvailability === 'AVAILABLE'
                    ? '● Open & Available'
                    : station.cngAvailability === 'OUT_OF_STOCK'
                    ? '● Out of CNG Stock'
                    : '● Temporarily Closed'}
                </span>

                <DataStatusBadge
                  status={station.verificationStatus}
                  dataSourceLabel={station.dataSourceLabel}
                  lastUpdatedTimestamp={station.lastUpdatedTimestamp}
                  confidenceScore={station.dataConfidenceScore}
                  isDemoData={station.isDemoData}
                />
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="bg-[#0c1220] p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">CNG Price</span>
                <p className="text-base font-extrabold text-white mt-0.5">
                  ₹{station.verifiedPricePerKg ?? 82.5}/kg
                </p>
              </div>
              <div className="bg-[#0c1220] p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Active Nozzles</span>
                <p className="text-base font-extrabold text-white mt-0.5">
                  {station.activeDispensers ?? 4}/{station.totalDispensers ?? 4} Disp.
                </p>
              </div>
              <div className="bg-[#0c1220] p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Operating Hours</span>
                <p className="text-base font-extrabold text-white mt-0.5">
                  {station.operatingHours ?? '24x7 Open'}
                </p>
              </div>
              <div className="bg-[#0c1220] p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Pumping Rate</span>
                <p className="text-base font-extrabold text-white mt-0.5">
                  {station.dispenserCapacityPerHour ?? 140} kg/hr
                </p>
              </div>
            </div>

            {/* Amenities */}
            {station.amenities && station.amenities.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Available Station Amenities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {station.amenities.map((am, i) => (
                    <span
                      key={i}
                      className="bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold px-2.5 py-1 rounded-xl"
                    >
                      ✓ {am}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 🧠 Smart Arrival Prediction Section */}
          <ArrivalPredictionCard prediction={stationPrediction} />

          {/* Telemetry Live Row: Pressure Gauge + Queue Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Pressure Gauge */}
            <div className="bg-[#111827] rounded-3xl border border-slate-800 p-6 shadow-xl flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between mb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Zap size={14} className="text-emerald-400" /> Measured Gas Pressure
                </h3>
                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
                  SCADA FEED
                </span>
              </div>

              <PressureGauge value={station.currentPressureBar} size="md" />

              <div className="w-full mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 text-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Min Safe Limit</span>
                  <span className="font-bold text-slate-300">{station.minSafeLimitBar ?? 140} Bar</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Max Safe Limit</span>
                  <span className="font-bold text-slate-300">{station.maxSafeLimitBar ?? 240} Bar</span>
                </div>
              </div>
            </div>

            {/* Queue Visualizer */}
            <div className="bg-[#111827] rounded-3xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
              <QueueVisualizer
                vehiclesWaiting={station.vehiclesWaiting}
                estimatedWaitMinutes={station.estimatedWaitMinutes}
                activeDispensers={station.activeDispensers}
                totalDispensers={station.totalDispensers}
              />
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm text-center shadow-lg transition flex items-center justify-center gap-2"
            >
              <Navigation size={18} />
              <span>Start Turn-by-Turn Navigation in Google Maps</span>
            </a>

            <button
              onClick={() => toggleStationSelection(Number(station.id))}
              className={`py-4 px-6 rounded-2xl font-bold text-xs border transition ${
                isSelected
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500'
                  : 'bg-[#162032] text-slate-300 border-slate-700 hover:bg-[#1f2c44]'
              }`}
            >
              {isSelected ? '✓ In Compare' : '+ Compare'}
            </button>
          </div>
        </div>

        {/* Right Column: Map + Trend Charts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mini Station Map Preview */}
          <div className="bg-[#111827] rounded-3xl border border-slate-800 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-sm text-white">Station Location on Map</h3>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                Open Full Maps ↗
              </a>
            </div>

            <StationMap
              stations={[station]}
              startPoint={{ lat: station.latitude, lng: station.longitude }}
              height="260px"
            />
          </div>

          {/* Pressure History Chart */}
          <div className="bg-[#111827] rounded-3xl border border-slate-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Pressure Cycle History (Last 2 Hours)
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Telemetry Log
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={pData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[150, 240]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  formatter={(v: any) => [`${v} Bar`, 'Gas Pressure']}
                />
                <Line type="monotone" dataKey="bar" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Queue History Chart */}
          <div className="bg-[#111827] rounded-3xl border border-slate-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Queue Trend History (Hourly)
              </h3>
              <span className="text-[10px] text-blue-400 font-bold bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-500/30">
                Car Count
              </span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={qData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  formatter={(v: any) => [`${v} Vehicles`, 'Cars Waiting']}
                />
                <Bar dataKey="vehicles" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Community Report Modal */}
      <ReportStatusModal
        isOpen={isReportOpen}
        station={station}
        onClose={() => setIsReportOpen(false)}
        onSubmit={(payload) => submitCommunityReport(payload)}
      />

      {/* Flag Incorrect Info Modal */}
      <ReportIncorrectModal
        isOpen={isFlagOpen}
        station={station}
        onClose={() => setIsFlagOpen(false)}
        onSubmitFlag={(payload) => submitIncorrectFlag(payload)}
      />
    </div>
  );
}
