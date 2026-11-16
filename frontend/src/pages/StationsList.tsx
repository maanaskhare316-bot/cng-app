import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Navigation, Star, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ReportStatusModal } from '../components/stations/ReportStatusModal';
import type { StationSummaryDto } from '../types';

type SortKey = 'recommendation' | 'queue' | 'pressure' | 'price' | 'name';
type FilterKey = 'all' | 'highPressure' | 'lowQueue' | 'recommended' | 'openNow';

export default function StationsList() {
  const navigate = useNavigate();
  const { stations, selectedStations, toggleStationSelection, updateStationTelemetry } = useAppContext();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('recommendation');
  const [reportModalStation, setReportModalStation] = useState<StationSummaryDto | null>(null);

  const filtered = useMemo(() => {
    let result = [...stations];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          (s.operator && s.operator.toLowerCase().includes(q))
      );
    }

    if (filter === 'highPressure') {
      result = result.filter((s) => (s.currentPressureBar ?? 0) >= 195);
    } else if (filter === 'lowQueue') {
      result = result.filter((s) => (s.vehiclesWaiting ?? 0) <= 3);
    } else if (filter === 'recommended') {
      result = result.filter((s) => s.recommendationCategory !== null);
    } else if (filter === 'openNow') {
      result = result.filter((s) => s.verifiedOpen === true);
    }

    result.sort((a, b) => {
      if (sort === 'recommendation') {
        return (b.score ?? 0) - (a.score ?? 0);
      }
      if (sort === 'queue') {
        return (a.vehiclesWaiting ?? 0) - (b.vehiclesWaiting ?? 0);
      }
      if (sort === 'pressure') {
        return (b.currentPressureBar ?? 0) - (a.currentPressureBar ?? 0);
      }
      if (sort === 'price') {
        return (a.verifiedPricePerKg ?? 999) - (b.verifiedPricePerKg ?? 999);
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [stations, search, filter, sort]);

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 pb-16 px-1 sm:px-0 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
            All CNG Stations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified Indian highway stations with live queue and compressor pressure telemetry
          </p>
        </div>

        <button
          onClick={() => navigate('/plan')}
          className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
        >
          <Navigation size={13} />
          <span>Plan Trip</span>
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-[#111827] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-lg border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by station name, city (e.g. Delhi, Agra, Mathura, Mumbai, Pune, Bhopal)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 bg-[#162032] text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase flex-shrink-0">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="px-3 py-2.5 rounded-xl border border-slate-700 text-xs font-bold bg-[#162032] text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="recommendation">⭐ AI Smart Score</option>
              <option value="queue">🚗 Short Queue First</option>
              <option value="pressure">⚡ High Pressure First</option>
              <option value="price">💰 Lowest Price</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: 'all', label: 'All Stations' },
            { id: 'highPressure', label: '⚡ High Pressure (200+ Bar)' },
            { id: 'lowQueue', label: '🚗 Short Queue (≤3 Cars)' },
            { id: 'recommended', label: '⭐ Recommended' },
            { id: 'openNow', label: '● 24x7 Open' },
          ].map((pill) => {
            const active = filter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilter(pill.id as FilterKey)}
                className={`px-3 py-1.5 rounded-xl font-bold transition border text-[11px] sm:text-xs ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-[#162032] text-slate-300 border-slate-800 hover:bg-[#1d2b44] hover:text-white'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Stations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filtered.map((st) => {
          const isBest = st.recommendationCategory === 'BEST_OVERALL';
          const isSelected = selectedStations.includes(Number(st.id));
          const pressure = st.currentPressureBar ? Math.round(st.currentPressureBar) : null;
          const isHighPressure = pressure && pressure >= 195;

          return (
            <div
              key={st.id}
              className={`bg-[#111827] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition flex flex-col justify-between shadow-lg hover:border-slate-700 relative ${
                isBest ? 'border-emerald-500/80 ring-2 ring-emerald-500/20' : 'border-slate-800'
              }`}
            >
              {isBest && (
                <span className="absolute -top-2.5 right-4 bg-amber-400 text-slate-950 text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Star size={10} className="fill-slate-950" /> Top Pick
                </span>
              )}

              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-xs sm:text-sm text-white leading-tight truncate">
                      {st.name}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-400 mt-0.5 truncate">{st.operator}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      📍 {st.city}, {st.state}
                    </p>
                  </div>
                  <span
                    className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 border ${
                      st.verifiedOpen
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {st.verifiedOpen ? '24x7 Open' : 'Closed'}
                  </span>
                </div>

                {/* Telemetry Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 bg-[#0c1220] rounded-xl p-2.5 border border-slate-800 my-3 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Queue</span>
                    <p className="text-xs sm:text-sm font-black text-white mt-0.5">{st.vehiclesWaiting ?? 0} Cars</p>
                    <span className="text-[9.5px] text-slate-400">~{st.estimatedWaitMinutes ?? 2} min</span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Pressure</span>
                    <p
                      className={`text-xs sm:text-sm font-black mt-0.5 ${
                        isHighPressure ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {pressure ? `${pressure} Bar` : 'N/A'}
                    </p>
                    <span className="text-[9.5px] text-slate-400">{isHighPressure ? 'Fast Fill' : 'Moderate'}</span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Price</span>
                    <p className="text-xs sm:text-sm font-black text-white mt-0.5">
                      ₹{st.verifiedPricePerKg ?? 82.5}
                    </p>
                    <span className="text-[9.5px] text-slate-400">per kg</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mb-3">
                  <span>⛽ {st.activeDispensers ?? 4} Nozzles Active</span>
                  <span>🕐 {st.operatingHours ?? '24x7'}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => navigate(`/stations/${st.id}`)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition text-center shadow-md"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => toggleStationSelection(Number(st.id))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    isSelected
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                      : 'border-slate-800 text-slate-300 hover:bg-[#162032] hover:text-white'
                  }`}
                >
                  {isSelected ? '✓ Added' : '+ Compare'}
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalStation(st)}
                  title="Report Live Status"
                  className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-amber-400 hover:bg-[#162032] transition"
                >
                  <Sparkles size={14} className="text-amber-400" />
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-[#162032] transition"
                  title="Navigate with Google Maps"
                >
                  <Navigation size={14} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <ReportStatusModal
        isOpen={!!reportModalStation}
        station={reportModalStation}
        onClose={() => setReportModalStation(null)}
        onSubmit={(id, v, p) => updateStationTelemetry(id, v, p)}
      />
    </div>
  );
}
