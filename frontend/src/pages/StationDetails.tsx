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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 bg-white rounded-3xl border border-slate-200 text-center">
        <span className="text-5xl">⛽</span>
        <h2 className="text-xl font-bold text-slate-800">Station Not Found</h2>
        <p className="text-slate-500 text-xs">This station ID is not available or has been moved.</p>
        <button
          onClick={() => navigate('/stations')}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-700 transition"
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
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 transition shadow-sm"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
        >
          <Sparkles size={14} className="text-amber-300" />
          <span>Report Live Telemetry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Station Hero Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                {isBest && (
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                    <Star size={12} className="fill-slate-950" /> Best Overall Choice
                  </span>
                )}
                <h1 className="text-2xl font-black text-slate-900 leading-tight">{station.name}</h1>
                <p className="text-xs font-semibold text-emerald-700 mt-0.5">{station.operator}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>📍</span> {station.address}, {station.city}, {station.state}
                </p>
              </div>

              <span
                className={`flex-shrink-0 text-xs font-extrabold px-3 py-1 rounded-full border ${
                  station.verifiedOpen
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-red-100 text-red-800 border-red-300'
                }`}
              >
                {station.verifiedOpen ? '● Open 24x7' : '● Closed'}
              </span>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">CNG Price</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  ₹{station.verifiedPricePerKg ?? 82.5}/kg
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Active Nozzles</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  {station.activeDispensers ?? 4}/{station.totalDispensers ?? 4} Disp.
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Hours</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  {station.operatingHours ?? '24x7 Open'}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Pumping Rate</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  {station.dispenserCapacityPerHour ?? 140} kg/hr
                </p>
              </div>
            </div>

            {/* Amenities */}
            {station.amenities && station.amenities.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Available Amenities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {station.amenities.map((am, i) => (
                    <span
                      key={i}
                      className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2.5 py-1 rounded-xl"
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
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between mb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Zap size={14} className="text-emerald-600" /> Live Gas Pressure
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  LIVE SCADA
                </span>
              </div>

              <PressureGauge value={station.currentPressureBar} size="md" />

              <div className="w-full mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Min Safe Limit</span>
                  <span className="font-bold text-slate-700">{station.minSafeLimitBar ?? 140} Bar</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Max Safe Limit</span>
                  <span className="font-bold text-slate-700">{station.maxSafeLimitBar ?? 240} Bar</span>
                </div>
              </div>
            </div>

            {/* Queue Visualizer */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
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
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm text-center shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2"
            >
              <Navigation size={18} />
              <span>Start Google Maps Navigation</span>
            </a>

            <button
              onClick={() => toggleStationSelection(Number(station.id))}
              className={`py-4 px-6 rounded-2xl font-bold text-xs border transition ${
                isSelected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isSelected ? '✓ In Compare' : '+ Compare'}
            </button>
          </div>
        </div>

        {/* Right Column: Map + Trend Charts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mini Station Map Preview */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-sm text-slate-800">Station Location (Google Maps)</h3>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 font-bold hover:underline"
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
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Pressure History (Last 2 Hours)
              </h3>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                Telemetry Log
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={pData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis domain={[150, 240]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [`${v} Bar`, 'Gas Pressure']} />
                <Line type="monotone" dataKey="bar" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Queue History Chart */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Queue History (Hourly Trend)
              </h3>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                Car Count
              </span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={qData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [`${v} Vehicles`, 'Cars Waiting']} />
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
