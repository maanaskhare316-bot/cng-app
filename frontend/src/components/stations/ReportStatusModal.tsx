import React, { useState } from 'react';
import { X, Send, CheckCircle, Gauge, Users, Sparkles } from 'lucide-react';
import type { StationSummaryDto } from '../../types';

interface ReportStatusModalProps {
  isOpen: boolean;
  station: StationSummaryDto | null;
  onClose: () => void;
  onSubmit: (stationId: number, vehicles: number, pressure: number) => void;
}

export const ReportStatusModal: React.FC<ReportStatusModalProps> = ({
  isOpen,
  station,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !station) return null;

  const [vehicles, setVehicles] = useState<number>(station.vehiclesWaiting ?? 3);
  const [pressure, setPressure] = useState<number>(
    station.currentPressureBar ? Math.round(station.currentPressureBar) : 200
  );
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(station.id, vehicles, pressure);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 max-w-md w-full overflow-hidden text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between border-b border-emerald-600/30">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles size={18} className="text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Report Live Station Status</h3>
              <p className="text-xs text-emerald-200 truncate max-w-[240px]">{station.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300">
            📍 <strong>{station.city}</strong>: Your live report will help fellow drivers pick the best station!
          </div>

          {/* Vehicles Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-blue-400" /> Vehicles Waiting in Line
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
              className="w-full accent-blue-500 bg-slate-800 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>0 (Empty)</span>
              <span>10 Cars</span>
              <span>20+ (Busy)</span>
            </div>
          </div>

          {/* Pressure Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge size={14} className="text-emerald-400" /> Gas Pressure
              </label>
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
              className="w-full accent-emerald-500 bg-slate-800 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>140 Bar (Low)</span>
              <span>185 Bar (Standard)</span>
              <span className="text-emerald-400 font-bold">220+ Bar (Super Fast Fill)</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitted}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitted ? (
                <>
                  <CheckCircle size={14} /> Submitted!
                </>
              ) : (
                <>
                  <Send size={14} /> Submit Report
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
