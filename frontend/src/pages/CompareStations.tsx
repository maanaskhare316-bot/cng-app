import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
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
      className={`px-4 py-3 text-center text-sm border-b border-[#E3EAF0] ${
        isBest ? 'font-black text-[#26734D] bg-[#E3F4EC]' : 'text-[#243447]'
      }`}
    >
      {value}
      {label && <span className="text-xs text-[#718096] ml-0.5">{label}</span>}
      {isBest && <span className="ml-1 text-[#26734D]">✓</span>}
    </td>
  );
}

const COLORS = ['#14283F', '#16B8C9', '#98651C'];

export default function CompareStations() {
  const { stations, selectedStations, toggleStationSelection, clearSelection } = useAppContext();

  const selected = stations.filter((s) => selectedStations.includes(Number(s.id)));

  if (selected.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center bg-white rounded-[14px] border border-[#E3EAF0] text-[#243447] max-w-xl mx-auto my-12 shadow-sm">
        <p className="text-5xl">⚖️</p>
        <h2 className="text-xl font-bold text-[#14283F]">Select 2–3 Stations to Compare</h2>
        <p className="text-[#718096] text-sm">
          Currently selected: <strong className="text-[#14283F]">{selected.length}</strong> station
          {selected.length !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-[#718096] max-w-md">
          Go to the Stations list and click <strong>+ Compare</strong> on each station you want to evaluate side-by-side.
        </p>
        <Link
          to="/stations"
          className="bg-[#14283F] hover:bg-[#1D3854] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition mt-2 shadow-sm"
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-[#243447]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#14283F]">Station Comparison</h1>
          <p className="text-xs text-[#718096] mt-0.5">Comparing {selected.length} stations</p>
        </div>
        <button
          onClick={clearSelection}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E3EAF0] bg-white hover:bg-[#F4F7FA] text-[#718096] hover:text-[#14283F] text-xs font-bold transition shadow-xs"
        >
          <X size={14} /> Clear All
        </button>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-[14px] border border-[#E3EAF0] shadow-sm overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-[#F4F7FA] border-b border-[#E3EAF0]">
              <th className="px-4 py-4 text-left text-xs font-bold text-[#718096] uppercase tracking-wide">
                Parameter
              </th>
              {selected.map((s, i) => (
                <th key={s.id} className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                    <div>
                      <p className="font-bold text-[#14283F] text-sm">{s.name}</p>
                      <p className="text-xs text-[#718096]">{s.city}</p>
                    </div>
                    <button
                      onClick={() => toggleStationSelection(Number(s.id))}
                      className="text-[#718096] hover:text-[#B54747] transition ml-1"
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
              <tr key={idx} className="border-b border-[#E3EAF0] hover:bg-[#F4F7FA] transition">
                <td className="px-4 py-3 text-xs font-bold text-[#718096] uppercase tracking-wider">{row.label}</td>
                {row.values.map((v, i) => (
                  <Cell key={i} value={v.disp} isBest={row.isBest(v)} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Radar Chart */}
      <div className="bg-white rounded-[14px] border border-[#E3EAF0] p-6 shadow-sm">
        <h3 className="font-extrabold text-sm text-[#14283F] mb-4 uppercase tracking-wider">
          Multi-Metric Performance Radar
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#E3EAF0" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#718096', fontSize: 11 }} />
            {selected.map((s, i) => (
              <Radar
                key={s.id}
                name={s.name.split(' ')[0]}
                dataKey={s.name.split(' ')[0]}
                stroke={COLORS[i]}
                fill={COLORS[i]}
                fillOpacity={0.2}
              />
            ))}
            <Legend wrapperStyle={{ color: '#718096', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3EAF0', borderRadius: '12px', color: '#243447' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
