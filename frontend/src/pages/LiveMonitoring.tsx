import React, { useState, useEffect, useRef } from 'react';
import { Activity, Pause, Play, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { StationSummaryDto } from '../types';

function pressureColor(bar: number | null | undefined) {
  if (!bar) return '#94a3b8';
  if (bar >= 195) return '#10b981';
  if (bar >= 175) return '#f59e0b';
  return '#ef4444';
}

function queueStatus(v: number) {
  if (v <= 3) return { text: 'Low', cls: 'bg-emerald-100 text-emerald-700' };
  if (v <= 8) return { text: 'Moderate', cls: 'bg-amber-100 text-amber-700' };
  return { text: 'High', cls: 'bg-red-100 text-red-700' };
}

function MiniPressureBar({ value, max = 220 }: { value: number | null; max?: number }) {
  const pct = value ? Math.min(100, (value / max) * 100) : 0;
  const color = pressureColor(value);
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Pressure</span>
        <span style={{ color }} className="font-semibold">{value ? `${Math.round(value)} Bar` : '—'}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded-full transition-all duration-700" />
      </div>
    </div>
  );
}

function StationMonitorCard({ station }: { station: StationSummaryDto }) {
  const q = queueStatus(station.vehiclesWaiting ?? 0);
  const cars = Math.min(station.vehiclesWaiting ?? 0, 6);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm leading-tight">{station.name}</h3>
          <p className="text-xs text-slate-500">{station.city}</p>
        </div>
        <span className={`text-xs font-semibold rounded-full px-2 py-0.5 flex-shrink-0 ${q.cls}`}>{q.text}</span>
      </div>
      {/* Vehicle queue row */}
      <div className="flex items-center gap-0.5 mb-3">
        {Array.from({ length: cars }).map((_, i) => <span key={i} className="text-lg">🚗</span>)}
        {(station.vehiclesWaiting ?? 0) > 6 && <span className="text-xs text-slate-500 ml-1">+{(station.vehiclesWaiting ?? 0) - 6}</span>}
        {(station.vehiclesWaiting ?? 0) === 0 && <span className="text-xs text-slate-400 italic">No queue</span>}
        <span className="ml-auto text-lg">⛽</span>
      </div>
      <MiniPressureBar value={station.currentPressureBar ?? null} />
      <div className="flex justify-between mt-3 text-xs text-slate-500">
        <span>⏱️ ~{station.estimatedWaitMinutes ?? 0} min wait</span>
        <span>🔧 {station.activeDispensers ?? 0} dispensers</span>
      </div>
      <p className="text-xs text-slate-300 mt-2 italic">Updated just now • SIMULATED</p>
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
    { icon: '🚗', label: 'Total Vehicles Waiting', value: totalVehicles, color: 'text-blue-600' },
    { icon: '⏱️', label: 'Avg Wait Time', value: `${avgWait} min`, color: 'text-amber-600' },
    { icon: '⛽', label: 'Active Dispensers', value: totalDispensers, color: 'text-emerald-600' },
    { icon: '🔵', label: 'Avg Pressure', value: `${avgPressure} Bar`, color: 'text-purple-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Demo banner */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <Activity size={16} className="text-amber-600" />
        <div>
          <span className="font-bold text-amber-800 text-sm">⚠️ SIMULATED DEMO DATA</span>
          <span className="text-amber-700 text-xs ml-2">— All values are locally generated. Not real station conditions.</span>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setIsPaused(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${isPaused ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'}`}>
            {isPaused ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
          </button>
          <button onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition">
            <RefreshCw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Queue Monitoring</h1>
          <p className="text-sm text-slate-500 mt-0.5">Simulation updates every 8 seconds • Tick #{tick}</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${isPaused ? 'text-slate-500' : 'text-emerald-600'}`}>
          <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`} />
          {isPaused ? 'Paused' : 'Live Simulation'}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-2xl mb-1">{c.icon}</p>
            <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Station grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3">Station-by-Station Status ({stations.length} stations)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stations.map(s => <StationMonitorCard key={s.id} station={s} />)}
        </div>
      </div>

      <p className="text-xs text-slate-400 italic text-center pb-4">
        ⚠️ All queue and pressure data is SIMULATED DEMO DATA generated locally by the client. 
        These numbers do not represent actual CNG station conditions.
      </p>
    </div>
  );
}
