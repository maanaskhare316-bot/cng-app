import React, { useState } from 'react';
import {
  X,
  Send,
  CheckCircle,
  Gauge,
  Users,
  Sparkles,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type {
  StationSummaryDto,
  CommunityReportPayload,
  OperationalStatus,
  CngAvailability,
} from '../../types';

interface ReportStatusModalProps {
  isOpen: boolean;
  station: StationSummaryDto | null;
  onClose: () => void;
  onSubmit: (payload: CommunityReportPayload) => void;
}

export const ReportStatusModal: React.FC<ReportStatusModalProps> = ({
  isOpen,
  station,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !station) return null;

  const [vehicles, setVehicles] = useState<number>(station.vehiclesWaiting ?? 3);
  const [operationalStatus, setOperationalStatus] = useState<OperationalStatus>(
    station.operationalStatus ?? 'OPERATIONAL'
  );
  const [cngAvailability, setCngAvailability] = useState<CngAvailability>(
    station.cngAvailability ?? 'AVAILABLE'
  );

  const [hasPressure, setHasPressure] = useState<boolean>(true);
  const [pressure, setPressure] = useState<number>(
    station.currentPressureBar ? Math.round(station.currentPressureBar) : 205
  );
  const [notes, setNotes] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  // Wait time auto-calculated from vehicles & nozzles
  const activeNozzles = station.activeDispensers || 4;
  const estimatedWait = Math.round(vehicles * (4.5 / activeNozzles));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CommunityReportPayload = {
      stationId: station.id,
      vehiclesWaiting: operationalStatus === 'TEMPORARILY_CLOSED' ? 0 : vehicles,
      estimatedWaitMinutes: operationalStatus === 'TEMPORARILY_CLOSED' ? 0 : estimatedWait,
      operationalStatus,
      cngAvailability:
        operationalStatus === 'TEMPORARILY_CLOSED' ? 'OUT_OF_STOCK' : cngAvailability,
      pressureBar: hasPressure && operationalStatus === 'OPERATIONAL' ? pressure : null,
      hasReliablePressureReading: hasPressure && operationalStatus === 'OPERATIONAL',
      notes: notes.trim() || undefined,
    };

    onSubmit(payload);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 max-w-lg w-full overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-emerald-600/30 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles size={18} className="text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Driver Community Report</h3>
              <p className="text-xs text-emerald-200 truncate max-w-[280px]">{station.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 leading-relaxed">
            🤝 <strong>Real-World Driver Updates:</strong> Your report updates this station status to{' '}
            <span className="font-bold text-amber-300">COMMUNITY REPORTED</span> immediately and assists fellow highway drivers!
          </div>

          {/* 1. Station Operating Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Station Operating Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOperationalStatus('OPERATIONAL')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                  operationalStatus === 'OPERATIONAL'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-[#162032] text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                ● Open &amp; Operating
              </button>
              <button
                type="button"
                onClick={() => setOperationalStatus('TEMPORARILY_CLOSED')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                  operationalStatus === 'TEMPORARILY_CLOSED'
                    ? 'bg-red-600 text-white border-red-500 shadow-md'
                    : 'bg-[#162032] text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                ● Temporarily Closed
              </button>
            </div>
          </div>

          {/* 2. CNG Gas Availability */}
          {operationalStatus === 'OPERATIONAL' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                CNG Gas Availability
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'AVAILABLE', label: 'Gas Available' },
                  { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
                  { id: 'COMPRESSOR_DOWN', label: 'Compressor Down' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCngAvailability(item.id as CngAvailability)}
                    className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition text-center ${
                      cngAvailability === item.id
                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                        : 'bg-[#162032] text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Vehicle Queue & Wait Time */}
          {operationalStatus === 'OPERATIONAL' && cngAvailability === 'AVAILABLE' && (
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-blue-400" /> Current Vehicles Waiting
                  </label>
                  <span className="text-sm font-extrabold text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-500/30">
                    {vehicles} Cars
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={vehicles}
                  onChange={(e) => setVehicles(Number(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 cursor-pointer h-2 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 (No Queue)</span>
                  <span>10 Cars</span>
                  <span>20+ (Congested)</span>
                </div>
              </div>

              {/* Calculated Wait Estimate Display */}
              <div className="bg-[#162032] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-400" /> Estimated Wait Time:
                </span>
                <span className="font-extrabold text-amber-400">
                  ~{estimatedWait} Minutes ({activeNozzles} Active Nozzles)
                </span>
              </div>

              {/* 4. Pressure Telemetry (Optional) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge size={14} className="text-emerald-400" /> Gas Pressure Reading
                  </label>
                  <label className="text-[11px] text-slate-400 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPressure}
                      onChange={(e) => setHasPressure(e.target.checked)}
                      className="accent-emerald-500 rounded"
                    />
                    <span>I know the pressure</span>
                  </label>
                </div>

                {hasPressure && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Reported Dispenser Reading:</span>
                      <span className="text-sm font-extrabold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                        {pressure} Bar
                      </span>
                    </div>
                    <input
                      type="range"
                      min="140"
                      max="230"
                      step="5"
                      value={pressure}
                      onChange={(e) => setPressure(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 cursor-pointer h-2 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>140 Bar (Low)</span>
                      <span>190 Bar (Normal)</span>
                      <span className="text-emerald-400 font-bold">215+ Bar (Full Tank)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Optional Driver Notes */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Driver Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., FASTag working, 6 nozzles online, quick flow..."
              className="w-full px-3 py-2 rounded-xl bg-[#162032] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitted}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitted ? (
                <>
                  <CheckCircle size={15} /> Submitted!
                </>
              ) : (
                <>
                  <Send size={15} /> Submit Live Update
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportStatusModal;
