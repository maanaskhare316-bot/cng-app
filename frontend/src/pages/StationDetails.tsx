import React, { useState, useMemo } from 'react';
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
  Zap,
  Navigation,
  Users,
  Star,
  Sparkles,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationMap } from '../components/map/StationMap';
import PressureGauge from '../components/stations/PressureGauge';
import QueueVisualizer from '../components/stations/QueueVisualizer';
import ReportStatusModal from '../components/stations/ReportStatusModal';
import ReportIncorrectModal from '../components/stations/ReportIncorrectModal';
import { PostVisitModal } from '../components/stations/PostVisitModal';
import DataStatusBadge from '../components/stations/DataStatusBadge';
import ArrivalPredictionCard from '../components/stations/ArrivalPredictionCard';
import { computeArrivalPrediction, computeQueueIntelligence } from '../utils/predictionEngine';

export default function StationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    stations,
    selectedStations,
    toggleStationSelection,
    submitCommunityReport,
    submitIncorrectFlag,
    markStationVisited,
  } = useAppContext();

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFlagOpen, setIsFlagOpen] = useState(false);
  const [isPostVisitOpen, setIsPostVisitOpen] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);

  const station = stations.find((s) => String(s.id) === id);

  if (!station) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 bg-white rounded-[14px] border border-[#E3EAF0] text-center text-[#243447]">
        <span className="text-5xl">⛽</span>
        <h2 className="text-xl font-bold text-[#14283F]">Station Not Found</h2>
        <p className="text-[#718096] text-xs">This station ID is not available or has been moved.</p>
        <button
          onClick={() => navigate('/stations')}
          className="bg-[#14283F] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-[#1D3854] transition shadow-sm"
        >
          Back to Stations
        </button>
      </div>
    );
  }

  const isSelected = selectedStations.includes(Number(station.id));
  const isBest = station.recommendationCategory === 'BEST_OVERALL';
  const pressureVal = station.currentPressureBar ? Math.round(station.currentPressureBar) : 200;

  // Compute live arrival prediction for this station
  const stationPrediction = useMemo(() => {
    const dist = station.distanceFromStartKm ?? 15;
    const etaMins = Math.max(3, Math.round((dist / 65) * 60));
    return computeArrivalPrediction(station, dist, etaMins);
  }, [station]);

  // Compute Advanced Queue Intelligence
  const queueIntel = useMemo(() => {
    return (
      station.queueIntelligence ||
      computeQueueIntelligence(
        station,
        stationPrediction.predictionAvailable ? stationPrediction.predictedQueueAtArrival : null
      )
    );
  }, [station, stationPrediction]);

  const pData = [
    { time: '10:00', bar: Math.max(160, pressureVal - 8) },
    { time: '10:30', bar: Math.max(160, pressureVal - 4) },
    { time: '11:00', bar: Math.max(160, pressureVal - 12) },
    { time: '11:30', bar: Math.min(230, pressureVal + 3) },
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
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-[#243447]">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#718096] hover:text-[#14283F] bg-white px-3.5 py-2 rounded-xl border border-[#E3EAF0] transition shadow-xs"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-2">
          {/* Flag Incorrect Info */}
          <button
            type="button"
            onClick={() => setIsFlagOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-[#E3EAF0] text-[#718096] hover:text-[#B54747] hover:bg-[#FCEAEA] font-bold text-xs transition flex items-center gap-1.5"
          >
            <AlertTriangle size={13} />
            <span>Report Issue</span>
          </button>

          {/* Submit Community Report */}
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Sparkles size={14} className="text-[#16B8C9]" />
            <span>Update Live Telemetry</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Station Hero Card */}
          <div className="bg-white rounded-[14px] border border-[#E3EAF0] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                {isBest && (
                  <span className="inline-flex items-center gap-1 bg-[#14283F] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 shadow-xs">
                    <Star size={12} className="text-[#16B8C9] fill-[#16B8C9]" /> Best Overall Choice
                  </span>
                )}
                <h1 className="text-2xl font-black text-[#14283F] leading-tight">{station.name}</h1>
                <p className="text-xs font-semibold text-[#16B8C9] mt-0.5">{station.operator}</p>
                <p className="text-xs text-[#718096] mt-1 flex items-center gap-1">
                  <span>📍</span> {station.address}, {station.city}, {station.state}
                </p>
              </div>

              {/* Status Pill */}
              <div className="flex flex-col items-start sm:items-end gap-1.5">
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                    station.verifiedOpen && station.cngAvailability === 'AVAILABLE'
                      ? 'bg-[#E3F4EC] text-[#26734D] border-[#C0E4D0]'
                      : 'bg-[#FCEAEA] text-[#B54747] border-[#F4BBBB]'
                  }`}
                >
                  {station.verifiedOpen && station.cngAvailability === 'AVAILABLE'
                    ? '● Open & Available'
                    : station.cngAvailability === 'OUT_OF_STOCK'
                    ? '● Out of CNG Stock'
                    : '● Temporarily Closed'}
                </span>

                <DataStatusBadge
                  status={station.verificationStatus}
                  dataSourceLabel={station.dataSourceLabel}
                  lastUpdatedTimestamp={station.lastUpdatedTimestamp}
                  confidenceScore={station.dataConfidenceScore}
                  isDemoData={station.isDemoData}
                />
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="bg-[#F4F7FA] p-3 rounded-xl border border-[#E3EAF0] text-center">
                <span className="text-[10px] text-[#718096] font-bold uppercase">CNG Price</span>
                <p className="text-base font-extrabold text-[#14283F] mt-0.5">
                  ₹{station.verifiedPricePerKg ?? 82.5}/kg
                </p>
              </div>
              <div className="bg-[#F4F7FA] p-3 rounded-xl border border-[#E3EAF0] text-center">
                <span className="text-[10px] text-[#718096] font-bold uppercase">Active Nozzles</span>
                <p className="text-base font-extrabold text-[#14283F] mt-0.5">
                  {station.activeDispensers ?? 4}/{station.totalDispensers ?? 4} Disp.
                </p>
              </div>
              <div className="bg-[#F4F7FA] p-3 rounded-xl border border-[#E3EAF0] text-center">
                <span className="text-[10px] text-[#718096] font-bold uppercase">Operating Hours</span>
                <p className="text-base font-extrabold text-[#14283F] mt-0.5">
                  {station.operatingHours ?? '24x7 Open'}
                </p>
              </div>
              <div className="bg-[#F4F7FA] p-3 rounded-xl border border-[#E3EAF0] text-center">
                <span className="text-[10px] text-[#718096] font-bold uppercase">Pumping Rate</span>
                <p className="text-base font-extrabold text-[#14283F] mt-0.5">
                  {station.dispenserCapacityPerHour ?? 140} kg/hr
                </p>
              </div>
            </div>

            {/* Amenities */}
            {station.amenities && station.amenities.length > 0 && (
              <div className="pt-2 border-t border-[#E3EAF0]">
                <span className="text-xs font-bold text-[#718096] uppercase tracking-wider block mb-2">
                  Available Station Amenities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {station.amenities.map((am, i) => (
                    <span
                      key={i}
                      className="bg-[#E3F4EC] text-[#26734D] border border-[#C0E4D0] text-[11px] font-semibold px-2.5 py-1 rounded-xl"
                    >
                      ✓ {am}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Smart Arrival Prediction Section */}
          <ArrivalPredictionCard prediction={stationPrediction} />

          {/* Telemetry Live Row: Pressure Gauge + Queue Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Pressure Gauge */}
            <div className="bg-white rounded-[14px] border border-[#E3EAF0] p-6 shadow-sm flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between mb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#14283F] flex items-center gap-1.5">
                  <Zap size={14} className="text-[#16B8C9]" /> Measured Gas Pressure
                </h3>
                <span className="text-[10px] bg-[#F4F7FA] text-[#718096] border border-[#E3EAF0] font-bold px-2 py-0.5 rounded-full">
                  SCADA FEED
                </span>
              </div>

              <PressureGauge value={station.currentPressureBar} size="md" />

              <div className="w-full mt-4 pt-3 border-t border-[#E3EAF0] grid grid-cols-2 text-center text-xs">
                <div>
                  <span className="text-[#718096] block text-[10px] uppercase font-bold">Min Safe Limit</span>
                  <span className="font-bold text-[#14283F]">{station.minSafeLimitBar ?? 140} Bar</span>
                </div>
                <div>
                  <span className="text-[#718096] block text-[10px] uppercase font-bold">Max Safe Limit</span>
                  <span className="font-bold text-[#14283F]">{station.maxSafeLimitBar ?? 240} Bar</span>
                </div>
              </div>
            </div>

            {/* Queue Visualizer */}
            <div className="bg-white rounded-[14px] border border-[#E3EAF0] p-6 shadow-sm flex flex-col justify-between">
              <QueueVisualizer
                vehiclesWaiting={station.vehiclesWaiting}
                estimatedWaitMinutes={station.estimatedWaitMinutes}
                activeDispensers={station.activeDispensers}
                totalDispensers={station.totalDispensers}
              />
            </div>
          </div>

          {/* ADVANCED QUEUE INTELLIGENCE CARD */}
          <div className="bg-white rounded-[14px] border border-[#E3EAF0] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E3EAF0] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F4F7FA] text-[#14283F] rounded-xl border border-[#E3EAF0]">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#14283F]">Advanced Queue Intelligence</h3>
                  <p className="text-[11px] text-[#718096]">Throughput modeling &amp; service rate breakdown</p>
                </div>
              </div>

              {/* Queue Trend Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${
                    queueIntel.queueTrend === 'INCREASING'
                      ? 'bg-[#FCEAEA] text-[#B54747] border-[#F4BBBB]'
                      : queueIntel.queueTrend === 'DECREASING'
                      ? 'bg-[#E3F4EC] text-[#26734D] border-[#C0E4D0]'
                      : 'bg-[#F4F7FA] text-[#14283F] border-[#E3EAF0]'
                  }`}
                >
                  {queueIntel.queueTrend === 'INCREASING' ? (
                    <>
                      <TrendingUp size={13} className="text-[#B54747]" />
                      <span>Trend: Increasing (Peak Flow)</span>
                    </>
                  ) : queueIntel.queueTrend === 'DECREASING' ? (
                    <>
                      <TrendingDown size={13} className="text-[#26734D]" />
                      <span>Trend: Decreasing (Fast Clearing)</span>
                    </>
                  ) : (
                    <>
                      <Minus size={13} className="text-[#14283F]" />
                      <span>Trend: Stable (Balanced Inflow)</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#F4F7FA] p-3.5 rounded-xl border border-[#E3EAF0]">
                <span className="text-[10px] text-[#718096] font-bold uppercase block">Current Queue</span>
                <span className="text-lg font-black text-[#14283F] mt-0.5 block">
                  {queueIntel.currentQueue} Vehicles
                </span>
                <span className="text-[10px] text-[#718096] block">Measured at pump</span>
              </div>

              <div className="bg-[#F4F7FA] p-3.5 rounded-xl border border-[#E3EAF0]">
                <span className="text-[10px] text-[#718096] font-bold uppercase block">Est. Wait Time</span>
                <span className="text-lg font-black text-[#98651C] mt-0.5 block">
                  ~{queueIntel.estimatedWaitMinutes} mins
                </span>
                <span className="text-[10px] text-[#718096] block">Prior to dispensing</span>
              </div>

              <div className="bg-[#F4F7FA] p-3.5 rounded-xl border border-[#E3EAF0]">
                <span className="text-[10px] text-[#718096] font-bold uppercase block">Avg. Service Time</span>
                <span className="text-lg font-black text-[#26734D] mt-0.5 block">
                  ~{queueIntel.avgServiceTimeMinutes} mins
                </span>
                <span className="text-[10px] text-[#718096] block">Per vehicle fill</span>
              </div>

              <div className="bg-[#F4F7FA] p-3.5 rounded-xl border border-[#E3EAF0]">
                <span className="text-[10px] text-[#718096] font-bold uppercase block">Predicted at ETA</span>
                <span className="text-lg font-black text-[#14283F] mt-0.5 block">
                  {queueIntel.predictedQueueAtArrival !== null && queueIntel.predictedQueueAtArrival !== undefined
                    ? `${queueIntel.predictedQueueAtArrival} Cars`
                    : 'Insufficient data'}
                </span>
                <span className="text-[10px] text-[#718096] block">Forecast arrival queue</span>
              </div>
            </div>

            {/* Assumptions Behind Calculation */}
            <div className="bg-[#F4F7FA] rounded-xl border border-[#E3EAF0] p-3.5 space-y-2">
              <button
                type="button"
                onClick={() => setShowAssumptions(!showAssumptions)}
                className="w-full flex items-center justify-between text-xs font-bold text-[#14283F] hover:text-[#16B8C9] transition"
              >
                <div className="flex items-center gap-1.5">
                  <Info size={13} className="text-[#16B8C9]" />
                  <span>How are queue and wait times calculated? (Assumptions)</span>
                </div>
                {showAssumptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAssumptions && (
                <div className="text-[11px] text-[#243447] space-y-2 pt-2 border-t border-[#E3EAF0] leading-relaxed animate-in fade-in duration-150">
                  <p className="bg-white p-2.5 rounded-xl border border-[#E3EAF0] text-[#718096]">
                    {queueIntel.assumptionsText}
                  </p>
                  <ul className="text-[#718096] space-y-1 list-disc list-inside">
                    <li>
                      <strong className="text-[#14283F]">Parallel Serving Capacity:</strong>{' '}
                      {queueIntel.activeDispensers} active nozzles dispensing concurrently.
                    </li>
                    <li>
                      <strong className="text-[#14283F]">Vehicle Fill Standard:</strong> 4.2 minutes baseline for 10–12 kg cascade fill.
                    </li>
                    <li>
                      <strong className="text-[#14283F]">Queue Trend:</strong> {queueIntel.queueTrendLabel}.
                    </li>
                    <li className="italic text-[#A0AEC0]">
                      Actual wait may vary with nozzle coupling time and digital UPI payments.
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-4 px-6 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white font-black text-sm text-center shadow-sm transition flex items-center justify-center gap-2"
            >
              <Navigation size={18} />
              <span>Start Navigation in Google Maps</span>
            </a>

            {/* Mark as Visited Button */}
            <button
              type="button"
              onClick={() => setIsPostVisitOpen(true)}
              className="py-4 px-5 rounded-xl bg-[#E3F4EC] hover:bg-[#D0EDDF] text-[#26734D] border border-[#C0E4D0] font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 size={16} />
              <span>Mark Visited &amp; Verify</span>
            </button>

            <button
              onClick={() => toggleStationSelection(Number(station.id))}
              className={`py-4 px-5 rounded-xl font-bold text-xs border transition ${
                isSelected
                  ? 'bg-[#14283F] text-white border-[#14283F]'
                  : 'bg-white text-[#718096] border-[#E3EAF0] hover:bg-[#F4F7FA]'
              }`}
            >
              {isSelected ? '✓ In Compare' : '+ Compare'}
            </button>
          </div>
        </div>

        {/* Right Column: Map + Trend Charts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mini Station Map Preview */}
          <div className="bg-white rounded-[14px] border border-[#E3EAF0] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-sm text-[#14283F]">Station Location on Map</h3>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#16B8C9] font-bold hover:underline"
              >
                Open Full Maps ↗
              </a>
            </div>

            <StationMap
              stations={[station]}
              startPoint={{ lat: station.latitude, lng: station.longitude }}
              height="260px"
            />
          </div>

          {/* Pressure History Chart */}
          <div className="bg-white rounded-[14px] border border-[#E3EAF0] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#14283F]">
                Pressure Cycle History (Last 2 Hours)
              </h3>
              <span className="text-[10px] text-[#26734D] font-bold bg-[#E3F4EC] px-2 py-0.5 rounded-full border border-[#C0E4D0]">
                Telemetry Log
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={pData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3EAF0" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#718096' }} />
                <YAxis domain={[150, 240]} tick={{ fontSize: 10, fill: '#718096' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3EAF0', color: '#243447', borderRadius: '10px' }}
                  formatter={(v: any) => [`${v} Bar`, 'Gas Pressure']}
                />
                <Line type="monotone" dataKey="bar" stroke="#26734D" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Queue History Chart */}
          <div className="bg-white rounded-[14px] border border-[#E3EAF0] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#14283F]">
                Queue Trend History (Hourly)
              </h3>
              <span className="text-[10px] text-[#98651C] font-bold bg-[#FFF2DB] px-2 py-0.5 rounded-full border border-[#FFE2A4]">
                Car Count
              </span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={qData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3EAF0" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#718096' }} />
                <YAxis tick={{ fontSize: 10, fill: '#718096' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3EAF0', color: '#243447', borderRadius: '10px' }}
                  formatter={(v: any) => [`${v} Vehicles`, 'Cars Waiting']}
                />
                <Bar dataKey="vehicles" fill="#14283F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Community Report Modal */}
      <ReportStatusModal
        isOpen={isReportOpen}
        station={station}
        onClose={() => setIsReportOpen(false)}
        onSubmit={(payload) => submitCommunityReport(payload)}
      />

      {/* Flag Incorrect Info Modal */}
      <ReportIncorrectModal
        isOpen={isFlagOpen}
        station={station}
        onClose={() => setIsFlagOpen(false)}
        onSubmitFlag={(payload) => submitIncorrectFlag(payload)}
      />

      {/* Post-Visit Driver Verification Modal */}
      <PostVisitModal
        isOpen={isPostVisitOpen}
        station={station}
        onClose={() => setIsPostVisitOpen(false)}
        onSubmitVisit={(record) => markStationVisited(record)}
      />
    </div>
  );
}
