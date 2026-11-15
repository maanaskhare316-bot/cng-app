import React, { useState } from 'react';
import { X, Send, CheckCircle, Gauge, Users, Sparkles, MapPin } from 'lucide-react';
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
  const [pressure, setPressure] = useState<number>(station.currentPressureBar ? Math.round(station.currentPressureBar) : 200);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(station.id, vehicles, pressure);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles size={18} className="text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">लाइव स्थिति रिपोर्ट करें (Report Status)</h3>
              <p className="text-xs text-emerald-100 truncate max-w-[240px]">{station.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
            📍 <strong>{station.city}</strong>: आपके द्वारा दिया गया लाइव डेटा अन्य सभी चालकों को सही स्टेशन चुनने में मदद करेगा!
          </div>

          {/* Vehicles Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-blue-600" /> वाहनों की संख्या (Vehicles in Queue)
              </label>
              <span className="text-base font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {vehicles} गाड़ियाँ
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={vehicles}
              onChange={(e) => setVehicles(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0 (खाली / No wait)</span>
              <span>10 (मध्यम)</span>
              <span>20+ (भीड़)</span>
            </div>
          </div>

          {/* Pressure Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge size={14} className="text-emerald-600" /> गैस प्रेशर (Pressure Bar)
              </label>
              <span className="text-base font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                {pressure} Bar
              </span>
            </div>
            <input
              type="range"
              min="140"
              max="230"
              step="1"
              value={pressure}
              onChange={(e) => setPressure(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>140 Bar (कम)</span>
              <span>185 Bar (मध्यम)</span>
              <span>215+ Bar (उच्च / Super)</span>
            </div>
          </div>

          {submitted && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100 p-2.5 rounded-xl border border-emerald-300 animate-in fade-in">
              <CheckCircle size={16} /> धन्यवाद! आपका लाइव अपडेट तुरंत ऐप में अपडेट हो गया है।
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition rounded-xl"
            >
              रद्द करें (Cancel)
            </button>
            <button
              type="submit"
              disabled={submitted}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send size={14} /> सबमिट करें (Update Live)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportStatusModal;
