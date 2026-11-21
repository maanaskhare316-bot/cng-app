import React, { useState } from 'react';
import {
  X,
  Send,
  CheckCircle,
  Gauge,
  Users,
  Sparkles,
  Clock,
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-[14px] shadow-modal border border-[#E3EAF0] max-w-lg w-full overflow-hidden text-[#243447] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#14283F] px-6 py-4 text-white flex items-center justify-between border-b border-[#1D3854] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles size={18} className="text-[#16B8C9]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Driver Community Report</h3>
              <p className="text-xs text-[#E3EAF0] truncate max-w-[280px]">{station.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="bg-[#FFF2DB] border border-[#FFE2A4] rounded-xl p-3 text-xs text-[#98651C] leading-relaxed">
            🤝 <strong>Real-World Driver Updates:</strong> Your report updates this station status to{' '}
            <span className="font-bold">COMMUNITY REPORTED</span> immediately and assists fellow highway drivers!
          </div>

          {/* 1. Station Operating Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#718096] uppercase tracking-wider block">
              Station Operating Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOperationalStatus('OPERATIONAL')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                  operationalStatus === 'OPERATIONAL'
                    ? 'bg-[#E3F4EC] text-[#26734D] border-[#C0E4D0] shadow-sm'
                    : 'bg-[#F4F7FA] text-[#718096] border-[#E3EAF0] hover:text-[#14283F]'
                }`}
              >
                ● Open &amp; Operating
              </button>
              <button
                type="button"
                onClick={() => setOperationalStatus('TEMPORARILY_CLOSED')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                  operationalStatus === 'TEMPORARILY_CLOSED'
                    ? 'bg-[#FCEAEA] text-[#B54747] border-[#F4BBBB] shadow-sm'
                    : 'bg-[#F4F7FA] text-[#718096] border-[#E3EAF0] hover:text-[#14283F]'
                }`}
              >
                ● Temporarily Closed
              </button>
            </div>
          </div>

          {/* 2. CNG Gas Availability */}
          {operationalStatus === 'OPERATIONAL' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#718096] uppercase tracking-wider block">
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
                        ? 'bg-[#14283F] text-white border-[#14283F] shadow-sm'
                        : 'bg-[#F4F7FA] text-[#718096] border-[#E3EAF0] hover:text-[#14283F]'
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
                  <label className="text-xs font-bold text-[#718096] uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-[#16B8C9]" /> Current Vehicles Waiting
                  </label>
                  <span className="text-sm font-extrabold text-[#14283F] bg-[#F4F7FA] px-2.5 py-0.5 rounded-lg border border-[#E3EAF0]">
                    {vehicles} Cars
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={vehicles}
                  onChange={(e) => setVehicles(Number(e.target.value))}
                  className="w-full accent-[#16B8C9] bg-[#E3EAF0] cursor-pointer h-2 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#718096] mt-1">
                  <span>0 (No Queue)</span>
                  <span>10 Cars</span>
                  <span>20+ (Congested)</span>
                </div>
              </div>

              {/* Calculated Wait Estimate Display */}
              <div className="bg-[#F4F7FA] p-2.5 rounded-xl border border-[#E3EAF0] flex items-center justify-between text-xs">
                <span className="text-[#718096] flex items-center gap-1.5">
                  <Clock size={13} className="text-[#98651C]" /> Estimated Wait Time:
                </span>
                <span className="font-extrabold text-[#98651C]">
                  ~{estimatedWait} Minutes ({activeNozzles} Active Nozzles)
                </span>
              </div>

              {/* 4. Pressure Telemetry */}
              <div className="space-y-2 pt-2 border-t border-[#E3EAF0]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#718096] uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge size={14} className="text-[#26734D]" /> Gas Pressure Reading
                  </label>
                  <label className="text-[11px] text-[#718096] flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPressure}
                      onChange={(e) => setHasPressure(e.target.checked)}
                      className="accent-[#16B8C9] rounded"
                    />
                    <span>I know the pressure</span>
                  </label>
                </div>

                {hasPressure && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#718096]">Reported Dispenser Reading:</span>
                      <span className="text-sm font-extrabold text-[#26734D] bg-[#E3F4EC] px-2.5 py-0.5 rounded-lg border border-[#C0E4D0]">
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
                      className="w-full accent-[#16B8C9] bg-[#E3EAF0] cursor-pointer h-2 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-[#718096] mt-1">
                      <span>140 Bar (Low)</span>
                      <span>190 Bar (Normal)</span>
                      <span className="text-[#26734D] font-bold">215+ Bar (Full Tank)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Driver Notes */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-bold text-[#718096] uppercase tracking-wider block">
              Driver Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., FASTag working, 6 nozzles online, quick flow..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E3EAF0] text-xs text-[#243447] placeholder-[#A0AEC0] focus:outline-none focus:border-[#16B8C9]"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E3EAF0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E3EAF0] text-xs font-bold text-[#718096] hover:text-[#14283F] hover:bg-[#F4F7FA] transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitted}
              className="px-6 py-2.5 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
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
