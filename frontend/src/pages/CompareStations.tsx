import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { formatPrice, formatPressure, formatDistance, formatDuration } from '../utils/formatters';
import type { StationSummaryDto } from '../types';

function best(values: (number | null | undefined)[], higher: boolean): number {
  const nums = values.map(v => v ?? (higher ? -Infinity : Infinity));
  return higher ? Math.max(...nums) : Math.min(...nums);
}

function Cell({ value, isBest, label }: { value: string; isBest: boolean; label?: string }) {
  return (
    <td className={`px-4 py-3 text-center text-sm border-b border-slate-100 ${isBest ? 'font-black text-emerald-700 bg-emerald-50' : 'text-slate-700'}`}>
      {value}{label && <span className="text-xs text-slate-400 ml-0.5">{label}</span>}
      {isBest && <span className="ml-1 text-emerald-500">✓</span>}
    </td>
  );
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

export default function CompareStations() {
  const { stations, selectedStations, toggleStationSelection, clearSelection } = useAppContext();
  const navigate = useNavigate();

  const selected = stations.filter(s => selectedStations.includes(Number(s.id)));

  if (selected.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <p className="text-5xl">⚖️</p>
        <h2 className="text-xl font-bold text-slate-700">Select 2–3 Stations to Compare</h2>
        <p className="text-slate-500">Currently selected: <strong>{selected.length}</strong> station{selected.length !== 1 ? 's' : ''}</p>
        <p className="text-sm text-slate-400">Go to the Stations list and click <strong>Compare</strong> on each station you want to evaluate.</p>
        <Link to="/stations" className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition mt-2">
          Browse Stations
        </Link>
      </div>
    );
  }

  const prices = selected.map(s => s.verifiedPricePerKg);
  const detours = selected.map(s => s.extraDetourKm);
  const queues = selected.map(s => s.vehiclesWaiting);
  const waits = selected.map(s => s.estimatedWaitMinutes);
  const pressures = selected.map(s => s.currentPressureBar);

  const bestPrice = best(prices, false);
  const bestDetour = best(detours, false);
  const bestQueue = best(queues, false);
  const bestWait = best(waits, false);
  const bestPressure = best(pressures, true);

  // Radar chart data
  const normalize = (val: number | null | undefined, min: number, max: number, invert = false) => {
    if (val == null) return 0;
    const n = (val - min) / (max - min);
    return Math.round((invert ? (1 - n) : n) * 100);
  };
  const radarData = [
    { metric: 'Pressure', ...Object.fromEntries(selected.map(s => [s.name.split(' ')[0], normalize(s.currentPressureBar, 160, 220)])) },
    { metric: 'Speed', ...Object.fromEntries(selected.map(s => [s.name.split(' ')[0], normalize(s.estimatedWaitMinutes, 0, 60, true)])) },
    { metric: 'Route', ...Object.fromEntries(selected.map(s => [s.name.split(' ')[0], normalize(s.extraDetourKm, 0, 15, true)])) },
    { metric: 'Price', ...Object.fromEntries(selected.map(s => [s.name.split(' ')[0], normalize(s.verifiedPricePerKg, 70, 90, true)])) },
    { metric: 'Open', ...Object.fromEntries(selected.map(s => [s.name.split(' ')[0], s.verifiedOpen ? 100 : 0])) },
  ];

  const scoreStation = (s: StationSummaryDto) => {
    let score = 0;
    if (s.verifiedPricePerKg === bestPrice) score += 2;
    if (s.extraDetourKm === bestDetour) score += 2;
    if (s.vehiclesWaiting === bestQueue) score += 3;
    if (s.estimatedWaitMinutes === bestWait) score += 2;
    if (s.currentPressureBar === bestPressure) score += 2;
    if (s.verifiedOpen) score += 1;
    return score;
  };
  const winner = [...selected].sort((a, b) => scoreStation(b) - scoreStation(a))[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Station Comparison</h1>
          <p className="text-sm text-slate-500 mt-0.5">Comparing {selected.length} stations</p>
        </div>
        <button onClick={clearSelection} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition">
          <X size={14} /> Clear All
        </button>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Parameter</th>
              {selected.map((s, i) => (
                <th key={s.id} className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.city}</p>
                    </div>
                    <button onClick={() => toggleStationSelection(Number(s.id))} className="text-slate-300 hover:text-red-400 transition ml-1">
                      <X size={12} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {
                label: 'CNG Price', values: selected.map(s => ({ raw: s.verifiedPricePerKg, disp: formatPrice(s.verifiedPricePerKg ?? null) })),
                isBest: (v: any) => v.raw === bestPrice
              },
              {
                label: 'Detour Distance', values: selected.map(s => ({ raw: s.extraDetourKm, disp: s.extraDetourKm != null ? formatDistance(s.extraDetourKm) : 'N/A' })),
                isBest: (v: any) => v.raw === bestDetour
              },
              {
                label: 'Detour Time', values: selected.map(s => ({ raw: s.estimatedDetourMinutes, disp: s.estimatedDetourMinutes != null ? formatDuration(s.estimatedDetourMinutes) : 'N/A' })),
                isBest: (v: any) => v.raw === best(selected.map(x => x.estimatedDetourMinutes), false)
              },
              {
                label: 'Queue Length', values: selected.map(s => ({ raw: s.vehiclesWaiting, disp: `${s.vehiclesWaiting ?? 0} vehicles` })),
                isBest: (v: any) => v.raw === bestQueue
              },
              {
                label: 'Wait Time', values: selected.map(s => ({ raw: s.estimatedWaitMinutes, disp: `~${s.estimatedWaitMinutes ?? 0} min` })),
                isBest: (v: any) => v.raw === bestWait
              },
              {
                label: 'Pressure', values: selected.map(s => ({ raw: s.currentPressureBar, disp: s.currentPressureBar ? formatPressure(s.currentPressureBar) : 'N/A' })),
                isBest: (v: any) => v.raw === bestPressure
              },
              {
                label: 'Active Dispensers', values: selected.map(s => ({ raw: s.activeDispensers, disp: `${s.activeDispensers ?? 0}` })),
                isBest: (v: any) => v.raw === best(selected.map(x => x.activeDispensers), true)
              },
              {
                label: 'Operating Hours', values: selected.map(s => ({ raw: s.operatingHours, disp: s.operatingHours ?? '24x7' })),
                isBest: () => false
              },
              {
                label: 'Availability', values: selected.map(s => ({ raw: s.verifiedOpen ? 1 : 0, disp: s.verifiedOpen ? '✅ Open' : '❌ Closed' })),
                isBest: (v: any) => v.raw === 1
              },
            ].map(row => (
              <tr key={row.label}>
                <td className="px-4 py-3 text-sm font-semibold text-slate-600 border-b border-slate-100 bg-slate-50 whitespace-nowrap">{row.label}</td>
                {row.values.map((v, i) => (
                  <Cell key={i} value={v.disp} isBest={row.isBest(v)} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Winner + Radar side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Winner */}
        <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-300 rounded-2xl p-6 shadow-sm">
          <h2 className="font-black text-emerald-800 text-sm uppercase tracking-wide mb-3">🏆 Overall Recommendation</h2>
          <p className="font-black text-slate-900 text-xl">{winner.name}</p>
          <p className="text-slate-500 text-sm">{winner.city}, {winner.state}</p>
          <p className="text-sm text-slate-600 mt-3">Best combination of price, queue, detour, and pressure across the selected stations.</p>
          <button onClick={() => navigate(`/stations/${winner.id}`)}
            className="mt-4 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition">
            View Details <ArrowRight size={14} />
          </button>
        </div>

        {/* Radar chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 text-sm mb-3">Performance Radar</h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              {selected.map((s, i) => (
                <Radar key={s.id} name={s.name.split(' ')[0]} dataKey={s.name.split(' ')[0]} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
              ))}
              <Legend iconSize={8} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
