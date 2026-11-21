import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Navigation,
  Sparkles,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ReportStatusModal } from '../components/stations/ReportStatusModal';
import { ReportIncorrectModal } from '../components/stations/ReportIncorrectModal';
import { DataStatusBadge } from '../components/stations/DataStatusBadge';
import type {
  StationSummaryDto,
  DataVerificationStatus,
} from '../types';

type SortKey = 'recommendation' | 'queue' | 'pressure' | 'price' | 'name' | 'reliability';
type VerificationFilterKey = 'ALL' | DataVerificationStatus;

export default function StationsList() {
  const navigate = useNavigate();
  const {
    stations,
    selectedStations,
    toggleStationSelection,
    submitCommunityReport,
    submitIncorrectFlag,
  } = useAppContext();

  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilterKey>('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [sort, setSort] = useState<SortKey>('recommendation');
  const [reportModalStation, setReportModalStation] = useState<StationSummaryDto | null>(null);
  const [flagModalStation, setFlagModalStation] = useState<StationSummaryDto | null>(null);

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

    if (verificationFilter !== 'ALL') {
      result = result.filter((s) => s.verificationStatus === verificationFilter);
    }

    if (onlyAvailable) {
      result = result.filter((s) => s.cngAvailability === 'AVAILABLE' && s.verifiedOpen === true);
    }

    result.sort((a, b) => {
      if (sort === 'recommendation') {
        return (b.score ?? 0) - (a.score ?? 0);
      }
      if (sort === 'reliability') {
        return (b.dataConfidenceScore ?? 0) - (a.dataConfidenceScore ?? 0);
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
  }, [stations, search, verificationFilter, onlyAvailable, sort]);

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 pb-16 px-1 sm:px-0 text-[#243447]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#14283F] leading-tight">
            Indian Highway CNG Stations Directory
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Verified station telemetry, SCADA pressure, and live driver community updates
          </p>
        </div>

        <button
          onClick={() => navigate('/plan')}
          className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
        >
          <Navigation size={13} />
          <span>Plan Trip on Corridor</span>
        </button>
      </div>

      {/* Search & Verification Status Filters Bar */}
      <div className="bg-white rounded-[14px] p-3.5 sm:p-4 shadow-sm border border-[#E3EAF0] space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718096]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by station name, city, highway, or gas operator..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E3EAF0] text-xs sm:text-sm text-[#243447] placeholder-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#16B8C9]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort stations"
              className="px-3 py-2.5 rounded-xl bg-white border border-[#E3EAF0] text-xs font-bold text-[#14283F] focus:outline-none focus:ring-2 focus:ring-[#16B8C9] cursor-pointer"
            >
              <option value="recommendation">Sort: Best Recommended</option>
              <option value="reliability">Sort: Highest Reliability</option>
              <option value="queue">Sort: Lowest Queue</option>
              <option value="pressure">Sort: Highest Pressure</option>
              <option value="price">Sort: Lowest Price</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Verification Status Pill Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
            <Filter size={12} /> Status:
          </span>

          {[
            { id: 'ALL', label: 'All Stations' },
            { id: 'LIVE_VERIFIED', label: '🟢 Live Verified' },
            { id: 'RECENTLY_UPDATED', label: '🔵 Recently Updated' },
            { id: 'COMMUNITY_REPORTED', label: '🟡 Community Reported' },
            { id: 'STALE_DATA', label: '⚪ Stale Data' },
            { id: 'UNAVAILABLE', label: '🔴 Unavailable' },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setVerificationFilter(chip.id as VerificationFilterKey)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex-shrink-0 transition border ${
                verificationFilter === chip.id
                  ? 'bg-[#14283F] text-white border-[#14283F] shadow-xs'
                  : 'bg-[#F4F7FA] text-[#718096] border-[#E3EAF0] hover:bg-[#E3EAF0]'
              }`}
            >
              {chip.label}
            </button>
          ))}

          <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#14283F] ml-auto flex-shrink-0 cursor-pointer bg-[#F4F7FA] px-3 py-1.5 rounded-xl border border-[#E3EAF0]">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="accent-[#16B8C9] rounded"
            />
            <span>Open &amp; In-Stock Only</span>
          </label>
        </div>
      </div>

      {/* Stations List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((station) => {
          const isSelected = selectedStations.includes(Number(station.id));
          const pressure = station.currentPressureBar ? Math.round(station.currentPressureBar) : null;
          const isHighPressure = pressure && pressure >= 195;
          const isAvailable = station.cngAvailability === 'AVAILABLE' && station.verifiedOpen;

          return (
            <div
              key={station.id}
              className={`rounded-[14px] p-5 border shadow-sm transition flex flex-col justify-between relative bg-white ${
                station.recommendationCategory === 'BEST_OVERALL'
                  ? 'border-[#14283F] border-l-4 border-l-[#16B8C9]'
                  : 'border-[#E3EAF0] hover:border-[#C8D6E5]'
              }`}
            >
              <div>
                {/* Verification Badge */}
                <div className="mb-2.5">
                  <DataStatusBadge
                    status={station.verificationStatus}
                    dataSourceLabel={station.dataSourceLabel}
                    lastUpdatedTimestamp={station.lastUpdatedTimestamp}
                    confidenceScore={station.dataConfidenceScore}
                    size="sm"
                  />
                </div>

                {/* Station Name & City */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#14283F] leading-tight">
                      {station.name}
                    </h3>
                    <p className="text-xs text-[#16B8C9] font-semibold mt-0.5">
                      {station.operator} • {station.city}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex-shrink-0 ${
                      isAvailable
                        ? 'bg-[#E3F4EC] text-[#26734D] border-[#C0E4D0]'
                        : 'bg-[#FCEAEA] text-[#B54747] border-[#F4BBBB]'
                    }`}
                  >
                    {isAvailable ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>

                <p className="text-[11px] text-[#718096] line-clamp-1 mb-3">
                  📍 {station.address}
                </p>

                {/* Measured Telemetry: Pressure & Queue */}
                <div className="grid grid-cols-2 gap-2 bg-[#F4F7FA] rounded-xl p-2.5 border border-[#E3EAF0] mb-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#718096] block">
                      Measured Pressure
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span
                        className={`text-sm font-black ${
                          isHighPressure ? 'text-[#26734D]' : 'text-[#98651C]'
                        }`}
                      >
                        {pressure ? `${pressure} Bar` : 'N/A'}
                      </span>
                      <span className="text-[10px] text-[#718096]">
                        {isHighPressure ? '(Fast Fill)' : '(Standard)'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#718096] block">
                      Measured Queue
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-black text-[#14283F]">
                        {station.vehiclesWaiting ?? 0} Cars
                      </span>
                      <span className="text-[10px] text-[#718096]">
                        ~{station.estimatedWaitMinutes ?? 2}m wait
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-[#E3EAF0] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#14283F]">
                    ₹{station.verifiedPricePerKg ?? 82.5}/kg
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Flag Issue */}
                    <button
                      type="button"
                      onClick={() => setFlagModalStation(station)}
                      className="p-1.5 rounded-lg border border-[#E3EAF0] text-[#718096] hover:text-[#B54747] hover:bg-[#FCEAEA] transition"
                      title="Report incorrect info"
                    >
                      <AlertTriangle size={13} />
                    </button>

                    {/* Community Report */}
                    <button
                      type="button"
                      onClick={() => setReportModalStation(station)}
                      className="py-1 px-2.5 rounded-lg bg-[#FFF2DB] text-[#98651C] hover:bg-[#FFE9C0] border border-[#FFE2A4] text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <Sparkles size={12} />
                      <span>Report</span>
                    </button>

                    {/* Compare */}
                    <button
                      type="button"
                      onClick={() => toggleStationSelection(Number(station.id))}
                      className={`py-1 px-2 rounded-lg text-[11px] font-bold border transition ${
                        isSelected
                          ? 'bg-[#14283F] text-white border-[#14283F]'
                          : 'bg-[#F4F7FA] text-[#718096] border-[#E3EAF0] hover:bg-[#E3EAF0]'
                      }`}
                    >
                      {isSelected ? '✓ In Compare' : '+ Compare'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/stations/${station.id}`}
                    className="py-2 text-center rounded-xl bg-[#F4F7FA] hover:bg-[#E3EAF0] border border-[#E3EAF0] text-xs font-bold text-[#14283F] transition"
                  >
                    View Details
                  </Link>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 text-center rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <span>Maps Nav</span>
                    <Navigation size={12} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Community Report Modal */}
      <ReportStatusModal
        isOpen={!!reportModalStation}
        station={reportModalStation}
        onClose={() => setReportModalStation(null)}
        onSubmit={(payload) => submitCommunityReport(payload)}
      />

      {/* Flag Incorrect Info Modal */}
      <ReportIncorrectModal
        isOpen={!!flagModalStation}
        station={flagModalStation}
        onClose={() => setFlagModalStation(null)}
        onSubmitFlag={(payload) => submitIncorrectFlag(payload)}
      />
    </div>
  );
}
