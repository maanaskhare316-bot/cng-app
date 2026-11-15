import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, Navigation, BarChart2, Star, Zap, Users, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ReportStatusModal } from '../components/stations/ReportStatusModal';
import { formatPressure, formatPrice } from '../utils/formatters';
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

    // Search query
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

    // Filter key
    if (filter === 'highPressure') {
      result = result.filter((s) => (s.currentPressureBar ?? 0) >= 195);
    } else if (filter === 'lowQueue') {
      result = result.filter((s) => (s.vehiclesWaiting ?? 0) <= 3);
    } else if (filter === 'recommended') {
      result = result.filter((s) => s.recommendationCategory !== null);
    } else if (filter === 'openNow') {
      result = result.filter((s) => s.verifiedOpen === true);
    }

    // Sort key
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
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            सभी CNG स्टेशन (All CNG Stations)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            लाइव कतार (Queue) और प्रेशर (Pressure) डेटा के साथ भारत के प्रमुख स्टेशन
          </p>
        </div>

        <button
          onClick={() => navigate('/plan')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
        >
          <Navigation size={14} />
          <span>रास्ते का स्टेशन खोजें (Plan Trip)</span>
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="स्टेशन नाम, शहर (उदा. Delhi, Agra, Mathura, Mumbai, Pune, Bhopal) खोजें..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase flex-shrink-0">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="recommendation">⭐ AI स्मार्ट स्कोर (कम गाड़ी + ज्यादा प्रेशर)</option>
              <option value="queue">🚗 कम गाड़ी पहले (Shortest Queue)</option>
              <option value="pressure">⚡ ज्यादा प्रेशर पहले (Highest Bar)</option>
              <option value="price">💰 कम कीमत पहले (Lowest Price)</option>
              <option value="name">नाम (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'all', label: 'सभी स्टेशन (All)' },
            { id: 'highPressure', label: '⚡ ज्यादा प्रेशर (200+ Bar)' },
            { id: 'lowQueue', label: '🚗 कम गाड़ी (≤3 Cars)' },
            { id: 'recommended', label: '⭐ सर्वोत्तम अनुशंसित' },
            { id: 'openNow', label: '● 24x7 Open' },
          ].map((pill) => {
            const active = filter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilter(pill.id as FilterKey)}
                className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Stations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((st) => {
          const isBest = st.recommendationCategory === 'BEST_OVERALL';
          const isSelected = selectedStations.includes(Number(st.id));
          const pressure = st.currentPressureBar ? Math.round(st.currentPressureBar) : null;
          const isHighPressure = pressure && pressure >= 195;

          return (
            <div
              key={st.id}
              className={`bg-white rounded-3xl p-5 border transition flex flex-col justify-between shadow-sm hover:shadow-md relative ${
                isBest ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
              }`}
            >
              {isBest && (
                <span className="absolute -top-2.5 right-4 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Star size={10} className="fill-slate-950" /> बेस्ट विकल्प (Top Pick)
                </span>
              )}

              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight truncate">
                      {st.name}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">{st.operator}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      📍 {st.city}, {st.state}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      st.verifiedOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {st.verifiedOpen ? 'Open 24x7' : 'Closed'}
                  </span>
                </div>

                {/* Telemetry Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-3 border border-slate-200/80 my-3 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">कतार (Queue)</span>
                    <p className="text-sm font-black text-slate-800 mt-0.5">{st.vehiclesWaiting ?? 0} गाड़ियाँ</p>
                    <span className="text-[10px] text-slate-500">~{st.estimatedWaitMinutes ?? 2} min</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">प्रेशर (Pressure)</span>
                    <p
                      className={`text-sm font-black mt-0.5 ${
                        isHighPressure ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {pressure ? `${pressure} Bar` : 'N/A'}
                    </p>
                    <span className="text-[10px] text-slate-500">{isHighPressure ? 'सुपर फास्ट' : 'मध्यम'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">मूल्य (Price)</span>
                    <p className="text-sm font-black text-slate-800 mt-0.5">
                      ₹{st.verifiedPricePerKg ?? 82.5}
                    </p>
                    <span className="text-[10px] text-slate-500">प्रति किलो</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 mb-4">
                  <span>⛽ {st.activeDispensers ?? 4} नोज़ल चालू</span>
                  <span>🕐 {st.operatingHours ?? '24x7'}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate(`/stations/${st.id}`)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition text-center"
                >
                  विवरण (Details)
                </button>
                <button
                  type="button"
                  onClick={() => toggleStationSelection(Number(st.id))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {isSelected ? '✓ तुलना' : '+ Compare'}
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalStation(st)}
                  title="Report Live Status"
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  <Sparkles size={14} className="text-amber-500" />
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
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
