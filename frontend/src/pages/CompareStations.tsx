import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { formatPrice, formatPressure, formatDistance, formatDuration } from '../utils/formatters';
import type { StationSummaryDto } from '../types';

function best(values: (number | null | undefined)[], higher: boolean): number {
  const nums = values.map((v) => v ?? (higher ? -Infinity : Infinity));
  return higher ? Math.max(...nums) : Math.min(...nums);
}

function Cell({ value, isBest, label }: { value: string; isBest: boolean; label?: string }) {
  return (
    <td
      className={`px-4 py-3 text-center text-sm border-b border-slate-800 ${
        isBest ? 'font-black text-emerald-400 bg-emerald-950/40' : 'text-slate-300'
      }`}
    >
      {value}
      {label && <span className="text-xs text-slate-500 ml-0.5">{label}</span>}
      {isBest && <span className="ml-1 text-emerald-400">✓</span>}
    </td>
  );
}

const COLORS = ['#10b981', '#38bdf8', '#f59e0b'];

export default function CompareStations() {
  const { stations, selectedStations, toggleStationSelection, clearSelection } = useAppContext();
  const navigate = useNavigate();

  const selected = stations.filter((s) => selectedStations.includes(Number(s.id)));

  if (selected.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center bg-[#111827] rounded-3xl border border-slate-800 text-slate-100 max-w-xl mx-auto my-12">
        <p className="text-5xl">⚖️</p>
        <h2 className="text-xl font-bold text-white">Select 2–3 Stations to Compare</h2>
        <p className="text-slate-400 text-sm">
          Currently selected: <strong className="text-emerald-400">{selected.length}</strong> station
          {selected.length !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-slate-500 max-w-md">
          Go to the Stations list and click <strong>+ Compare</strong> on each station you want to evaluate side-by-side.
        </p>
        <Link
          to="/stations"
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition mt-2 shadow-md"
        >
          Browse Stations
        </Link>
      </div>
    );
  }

  const prices = selected.map((s) => s.verifiedPricePerKg);
  const detours = selected.map((s) => s.extraDetourKm);
  const queues = selected.map((s) => s.vehiclesWaiting);
  const waits = selected.map((s) => s.estimatedWaitMinutes);
  const pressures = selected.map((s) => s.currentPressureBar);

  const bestPrice = best(prices, false);
  const bestDetour = best(detours, false);
  const bestQueue = best(queues, false);
  const bestWait = best(waits, false);
  const bestPressure = best(pressures, true);

  const normalize = (val: number | null | undefined, min: number, max: number, invert = false) => {
    if (val == null) return 0;
    const n = (val - min) / (max - min);
    return Math.round((invert ? 1 - n : n) * 100);
  };
  const radarData = [
    {
      metric: 'Pressure',
      ...Object.fromEntries(selected.map((s) => [s.name.split(' ')[0], normalize(s.currentPressureBar, 160, 220)])),
    },
    {
      metric: 'Speed',
      ...Object.fromEntries(selected.map((s) => [s.name.split(' ')[0], normalize(s.estimatedWaitMinutes, 0, 60, true)])),
    },
    {
      metric: 'Route',
      ...Object.fromEntries(selected.map((s) => [s.name.split(' ')[0], normalize(s.extraDetourKm, 0, 15, true)])),
    },
    {
      metric: 'Price',
      ...Object.fromEntries(selected.map((s) => [s.name.split(' ')[0], normalize(s.verifiedPricePerKg, 70, 90, true)])),
    },
    {
      metric: 'Open',
      ...Object.fromEntries(selected.map((s) => [s.name.split(' ')[0], s.verifiedOpen ? 100 : 0])),
    },
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Station Comparison</h1>
          <p className="text-xs text-slate-400 mt-0.5">Comparing {selected.length} stations</p>
        </div>
        <button
          onClick={clearSelection}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-[#162032] hover:bg-[#1e2a42] text-slate-300 text-xs font-bold transition"
        >
          <X size={14} /> Clear All
        </button>
      </div>

      {/* Comparison Table */}
      <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-lg overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-[#0c1220] border-b border-slate-800">
              <th className="px-4 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">
                Parameter
              </th>
              {selected.map((s, i) => (
                <th key={s.id} className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                    <div>
                      <p className="font-bold text-white text-sm">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.city}</p>
                    </div>
                    <button
                      onClick={() => toggleStationSelection(Number(s.id))}
                      className="text-slate-500 hover:text-rose-400 transition ml-1"
                    >
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
                label: 'CNG Price',
                values: selected.map((s) => ({
                  raw: s.verifiedPricePerKg,
                  disp: formatPrice(s.verifiedPricePerKg ?? null),
                })),
                isBest: (v: any) => v.raw === bestPrice,
              },
              {
                label: 'Detour Distance',
                values: selected.map((s) => ({
                  raw: s.extraDetourKm,
                  disp: s.extraDetourKm != null ? formatDistance(s.extraDetourKm) : 'N/A',
                })),
                isBest: (v: any) => v.raw === bestDetour,
              },
              {
                label: 'Detour Time',
                values: selected.map((s) => ({
                  raw: s.estimatedDetourMinutes,
                  disp: s.estimatedDetourMinutes != null ? formatDuration(s.estimatedDetourMinutes) : 'N/A',
                })),
                isBest: (v: any) => v.raw === best(selected.map((x) => x.estimatedDetourMinutes), false),
              },
              {
                label: 'Queue Length',
                values: selected.map((s) => ({
                  raw: s.vehiclesWaiting,
                  disp: `${s.vehiclesWaiting ?? 0} vehicles`,
                })),
                isBest: (v: any) => v.raw === bestQueue,
              },
              {
                label: 'Wait Time',
                values: selected.map((s) => ({
                  raw: s.estimatedWaitMinutes,
                  disp: `~${s.estimatedWaitMinutes ?? 0} min`,
                })),
                isBest: (v: any) => v.raw === bestWait,
              },
              {
                label: 'Gas Pressure',
                values: selected.map((s) => ({
                  raw: s.currentPressureBar,
                  disp: s.currentPressureBar ? formatPressure(s.currentPressureBar) : 'N/A',
                })),
                isBest: (v: any) => v.raw === bestPressure,
              },
              {
                label: 'Active Nozzles',
                values: selected.map((s) => ({
                  raw: s.activeDispensers,
                  disp: `${s.activeDispensers ?? 0}/${s.totalDispensers ?? 4}`,
                })),
                isBest: (v: any) => v.raw === best(selected.map((x) => x.activeDispensers), true),
              },
              {
                label: 'Status',
                values: selected.map((s) => ({
                  raw: s.verifiedOpen,
                  disp: s.verifiedOpen ? 'Open 24x7' : 'Closed',
                })),
                isBest: (v: any) => v.raw === true,
              },
            ].map((row, idx) => (
              <tr key={idx} className="border-b border-slate-800/80 hover:bg-[#162032]/40 transition">
                <td className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{row.label}</td>
                {row.values.map((v, i) => (
                  <Cell key={i} value={v.disp} isBest={row.isBest(v)} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Radar Chart */}
      <div className="bg-[#111827] rounded-3xl border border-slate-800 p-6 shadow-lg">
        <h3 className="font-extrabold text-sm text-white mb-4 uppercase tracking-wider">
          Multi-Metric Performance Radar
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            {selected.map((s, i) => (
              <Radar
                key={s.id}
                name={s.name.split(' ')[0]}
                dataKey={s.name.split(' ')[0]}
                stroke={COLORS[i]}
                fill={COLORS[i]}
                fillOpacity={0.25}
              />
            ))}
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
