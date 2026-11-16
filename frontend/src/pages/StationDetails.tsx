import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationMap } from '../components/map/StationMap';
import PressureGauge from '../components/stations/PressureGauge';
import QueueVisualizer from '../components/stations/QueueVisualizer';
import ReportStatusModal from '../components/stations/ReportStatusModal';
import { formatPressure, formatPrice, formatTimestamp } from '../utils/formatters';
import type { StationSummaryDto, PressureReading, QueueObservation } from '../types';

export default function StationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stations, selectedStations, toggleStationSelection, updateStationTelemetry } = useAppContext();

  const [isReportOpen, setIsReportOpen] = useState(false);

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

  // Mock 2-hour telemetry history for charts
  const pData = [
    { time: '10:00', bar: pressureVal - 8 },
    { time: '10:30', bar: pressureVal - 4 },
    { time: '11:00', bar: pressureVal - 12 },
    { time: '11:30', bar: pressureVal + 3 },
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
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-[#162032] px-3.5 py-2 rounded-xl border border-slate-700/80 transition shadow-md"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
        >
          <Sparkles size={14} className="text-amber-400" />
          <span>Report Live Telemetry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Station Hero Card */}
          <div className="bg-[#111827] rounded-3xl border border-slate-800 p-6 shadow-lg space-y-4">
            <div className="flex items-start justify-between gap-4">
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

              <span
                className={`flex-shrink-0 text-xs font-extrabold px-3 py-1 rounded-full border ${
                  station.verifiedOpen
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                }`}
              >
                {station.verifiedOpen ? '● Open 24x7' : '● Closed'}
              </span>
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
                <span className="text-[10px] text-slate-400 font-bold uppercase">Hours</span>
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
                  Available Amenities
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

          {/* Telemetry Live Row: Pressure Gauge + Queue Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Pressure Gauge */}
            <div className="bg-[#111827] rounded-3xl border border-slate-800 p-6 shadow-lg flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between mb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Zap size={14} className="text-emerald-400" /> Live Gas Pressure
                </h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
                  LIVE SCADA
                </span>
              </div>

              <PressureGauge value={station.currentPressureBar} size="md" />

              <div className="w-full mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Min Safe Limit</span>
                  <span className="font-bold text-slate-300">{station.minSafeLimitBar ?? 140} Bar</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Max Safe Limit</span>
                  <span className="font-bold text-slate-300">{station.maxSafeLimitBar ?? 240} Bar</span>
                </div>
              </div>
            </div>

            {/* Queue Visualizer */}
            <div className="bg-[#111827] rounded-3xl border border-slate-800 p-2 shadow-lg flex flex-col justify-between">
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
              className="flex-1 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm text-center shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2"
            >
              <Navigation size={18} />
              <span>Start Google Maps Navigation</span>
            </a>

            <button
              onClick={() => toggleStationSelection(Number(station.id))}
              className={`py-4 px-6 rounded-2xl font-bold text-xs border transition ${
                isSelected
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                  : 'bg-[#162032] text-slate-300 border-slate-700 hover:bg-[#1e2a42]'
              }`}
            >
              {isSelected ? '✓ In Compare' : '+ Compare'}
            </button>
          </div>
        </div>

        {/* Right Column: Map + Trend Charts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mini Station Map Preview */}
          <div className="bg-[#111827] rounded-3xl border border-slate-800 p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-sm text-white">Station Location (Google Maps)</h3>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                Open Full Map ↗
              </a>
            </div>

            <StationMap
              stations={[station]}
              startPoint={{ lat: station.latitude, lng: station.longitude }}
              height="260px"
            />
          </div>

          {/* Pressure History Chart */}
          <div className="bg-[#111827] rounded-3xl border border-slate-800 p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Pressure History (Last 2 Hours)
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Telemetry Log
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={pData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                <YAxis domain={[150, 240]} tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(v: any) => [`${v} Bar`, 'Gas Pressure']}
                />
                <Line type="monotone" dataKey="bar" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Queue History Chart */}
          <div className="bg-[#111827] rounded-3xl border border-slate-800 p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Queue History (Hourly Trend)
              </h3>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Car Count
              </span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={qData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(v: any) => [`${v} Vehicles`, 'Cars Waiting']}
                />
                <Bar dataKey="vehicles" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ReportStatusModal
        isOpen={isReportOpen}
        station={station}
        onClose={() => setIsReportOpen(false)}
        onSubmit={(sId, v, p) => updateStationTelemetry(sId, v, p)}
      />
    </div>
  );
}
