import React, { useState, useEffect, useRef } from 'react';
import { Activity, Pause, Play, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { StationSummaryDto } from '../types';

function pressureColor(bar: number | null | undefined) {
  if (!bar) return '#64748b';
  if (bar >= 195) return '#10b981';
  if (bar >= 175) return '#f59e0b';
  return '#f43f5e';
}

function queueStatus(v: number) {
  if (v <= 3) return { text: 'Low Queue', cls: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' };
  if (v <= 8) return { text: 'Moderate', cls: 'bg-amber-950/60 text-amber-300 border-amber-500/40' };
  return { text: 'Busy', cls: 'bg-rose-950/60 text-rose-300 border-rose-500/40' };
}

function MiniPressureBar({ value, max = 220 }: { value: number | null; max?: number }) {
  const pct = value ? Math.min(100, (value / max) * 100) : 0;
  const color = pressureColor(value);
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>Gas Pressure</span>
        <span style={{ color }} className="font-bold">{value ? `${Math.round(value)} Bar` : '—'}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded-full transition-all duration-700" />
      </div>
    </div>
  );
}

function StationMonitorCard({ station }: { station: StationSummaryDto }) {
  const q = queueStatus(station.vehiclesWaiting ?? 0);
  const cars = Math.min(station.vehiclesWaiting ?? 0, 6);
  return (
    <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 shadow-lg text-slate-100">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-bold text-white text-sm leading-tight">{station.name}</h3>
          <p className="text-xs text-slate-400">{station.city}</p>
        </div>
        <span className={`text-[10.5px] font-bold rounded-full px-2.5 py-0.5 border flex-shrink-0 ${q.cls}`}>{q.text}</span>
      </div>
      {/* Vehicle queue row */}
      <div className="flex items-center gap-1 mb-3 bg-[#0c1220] p-2 rounded-xl border border-slate-800">
        {Array.from({ length: cars }).map((_, i) => <span key={i} className="text-lg">🚗</span>)}
        {(station.vehiclesWaiting ?? 0) > 6 && <span className="text-xs text-slate-400 ml-1 font-bold">+{(station.vehiclesWaiting ?? 0) - 6} more</span>}
        {(station.vehiclesWaiting ?? 0) === 0 && <span className="text-xs text-emerald-400 font-semibold italic">No queue</span>}
        <span className="ml-auto text-lg">⛽</span>
      </div>
      <MiniPressureBar value={station.currentPressureBar ?? null} />
      <div className="flex justify-between mt-3 text-xs text-slate-400">
        <span>⏱️ ~{station.estimatedWaitMinutes ?? 0} min wait</span>
        <span>🔧 {station.activeDispensers ?? 0} active nozzles</span>
      </div>
      <p className="text-[10px] text-slate-400 mt-2 italic">Telemetry simulation active</p>
    </div>
  );
}

function jitter(value: number, pct: number, min: number, max: number) {
  const delta = value * pct;
  return Math.min(max, Math.max(min, value + (Math.random() - 0.5) * 2 * delta));
}

export default function LiveMonitoring() {
  const { stations: baseStations } = useAppContext();
  const [stations, setStations] = useState<StationSummaryDto[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStations(baseStations.map(s => ({ ...s })));
  }, [baseStations]);

  useEffect(() => {
    if (isPaused) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setStations(prev => prev.map(s => ({
        ...s,
        vehiclesWaiting: Math.round(jitter(s.vehiclesWaiting ?? 4, 0.15, 0, 20)),
        estimatedWaitMinutes: Math.round(jitter(s.estimatedWaitMinutes ?? 10, 0.15, 0, 60)),
        currentPressureBar: s.currentPressureBar ? Math.round(jitter(s.currentPressureBar, 0.01, 160, 225) * 10) / 10 : s.currentPressureBar,
      })));
      setTick(t => t + 1);
    }, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused]);

  const reset = () => setStations(baseStations.map(s => ({ ...s })));

  const totalVehicles = stations.reduce((s, x) => s + (x.vehiclesWaiting ?? 0), 0);
  const avgWait = stations.length ? Math.round(stations.reduce((s, x) => s + (x.estimatedWaitMinutes ?? 0), 0) / stations.length) : 0;
  const totalDispensers = stations.reduce((s, x) => s + (x.activeDispensers ?? 0), 0);
  const avgPressure = (() => {
    const withP = stations.filter(x => x.currentPressureBar);
    return withP.length ? Math.round(withP.reduce((s, x) => s + (x.currentPressureBar ?? 0), 0) / withP.length) : 0;
  })();

  const summaryCards = [
    { icon: '🚗', label: 'Total Vehicles Waiting', value: totalVehicles, color: 'text-blue-400' },
    { icon: '⏱️', label: 'Avg Wait Time', value: `${avgWait} min`, color: 'text-amber-400' },
    { icon: '⛽', label: 'Active Dispensers', value: totalDispensers, color: 'text-emerald-400' },
    { icon: '⚡', label: 'Avg Pressure', value: `${avgPressure} Bar`, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-slate-100">
      {/* Demo banner */}
      <div className="flex items-center gap-3 bg-[#111827] border border-amber-500/30 rounded-2xl px-4 py-3 shadow-md">
        <Activity size={18} className="text-amber-400" />
        <div>
          <span className="font-extrabold text-amber-300 text-sm">LIVE SIMULATION TICKER</span>
          <span className="text-slate-400 text-xs ml-2">— Telemetry cycles simulate real car arrivals and compressor pressures.</span>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-slate-700 bg-[#162032] hover:bg-[#1e2a42] text-slate-200 transition font-bold"
          >
            {isPaused ? <Play size={12} className="text-emerald-400" /> : <Pause size={12} className="text-amber-400" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-slate-700 bg-[#162032] hover:bg-[#1e2a42] text-slate-200 transition font-bold"
          >
            <RefreshCw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* Summary metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-[#111827] rounded-2xl border border-slate-800 p-4 shadow-md">
            <span className="text-2xl mb-1 block">{c.icon}</span>
            <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Station monitor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.map(s => <StationMonitorCard key={s.id} station={s} />)}
      </div>
    </div>
  );
}
