import React, { useState } from 'react';
import { Fuel, Zap, Calculator, DollarSign, Gauge, ArrowRight } from 'lucide-react';

interface VehicleProfile {
  name: string;
  emoji: string;
  tankLitres: number;
  avgMileageKmPerKg: number;
}

const VEHICLES: VehicleProfile[] = [
  { name: 'Car / Sedan (WagonR, Dzire, Aura)', emoji: '🚗', tankLitres: 60, avgMileageKmPerKg: 27 },
  { name: '7-Seater / MPV (Ertiga, Carens)', emoji: '🚙', tankLitres: 65, avgMileageKmPerKg: 24 },
  { name: 'Auto Rickshaw (3-Wheeler)', emoji: '🛺', tankLitres: 30, avgMileageKmPerKg: 35 },
  { name: 'Taxi / Van (Eeco, Super Carry)', emoji: '🚐', tankLitres: 65, avgMileageKmPerKg: 21 },
];

interface CngCalculatorProps {
  initialPressure?: number;
  initialPricePerKg?: number;
}

export const CngCalculator: React.FC<CngCalculatorProps> = ({
  initialPressure = 210,
  initialPricePerKg = 82.5,
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleProfile>(VEHICLES[0]);
  const [pressureBar, setPressureBar] = useState<number>(initialPressure);
  const [cngPrice, setCngPrice] = useState<number>(initialPricePerKg);
  const [petrolPrice] = useState<number>(98.5);

  const filledKg = Number(((selectedVehicle.tankLitres / 1000) * (pressureBar * 0.75)).toFixed(1));
  const fullTankRangeKm = Math.round(filledKg * selectedVehicle.avgMileageKmPerKg);

  const lowPressureKg = Number(((selectedVehicle.tankLitres / 1000) * (160 * 0.75)).toFixed(1));
  const lowPressureRangeKm = Math.round(lowPressureKg * selectedVehicle.avgMileageKmPerKg);
  const extraRangeGained = Math.max(0, fullTankRangeKm - lowPressureRangeKm);

  const totalCngCost = Math.round(filledKg * cngPrice);
  const equivalentPetrolLitres = (fullTankRangeKm / 16).toFixed(1);
  const equivalentPetrolCost = Math.round(Number(equivalentPetrolLitres) * petrolPrice);
  const moneySaved = Math.max(0, equivalentPetrolCost - totalCngCost);

  return (
    <div className="bg-[#111827] rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-lg space-y-5 text-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-2xl">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm sm:text-base">
              CNG Pressure & Highway Range Calculator
            </h3>
            <p className="text-[11px] text-slate-400">
              Calculate cylinder filling capacity and range gains at 200+ Bar pressure
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Type Selector */}
      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Select Vehicle Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VEHICLES.map((v) => (
            <button
              key={v.name}
              type="button"
              onClick={() => setSelectedVehicle(v)}
              className={`p-3 rounded-2xl border text-left transition ${
                selectedVehicle.name === v.name
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                  : 'bg-[#162032] border-slate-800 text-slate-300 hover:bg-[#1a263c] hover:border-slate-700'
              }`}
            >
              <div className="text-xl mb-1">{v.emoji}</div>
              <p className="text-xs font-bold leading-tight truncate text-white">{v.name.split(' (')[0]}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{v.avgMileageKmPerKg} km/kg avg</p>
            </button>
          ))}
        </div>
      </div>

      {/* Pressure Slider */}
      <div className="bg-[#090d16] p-4 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Zap size={14} className="text-emerald-400" />
            <span>Station Pump Pressure</span>
          </div>
          <span
            className={`text-sm font-black px-2.5 py-0.5 rounded-full border ${
              pressureBar >= 195
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                : pressureBar >= 175
                ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                : 'bg-rose-950/70 text-rose-300 border-rose-500/40'
            }`}
          >
            {pressureBar} Bar ({Math.round(pressureBar * 14.5038)} PSI)
          </span>
        </div>

        <input
          type="range"
          min={140}
          max={230}
          step={5}
          value={pressureBar}
          onChange={(e) => setPressureBar(Number(e.target.value))}
          className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-bold text-slate-500">
          <span>140 Bar (Low Pressure)</span>
          <span>185 Bar (Standard)</span>
          <span className="text-emerald-400 font-extrabold">220 Bar (Peak Fast Fill)</span>
        </div>
      </div>

      {/* Calculation Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-500/30">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Gas Capacity Filled</span>
          <p className="text-2xl font-black text-emerald-300 mt-1">{filledKg} kg</p>
          <p className="text-[10px] text-emerald-400/90 font-semibold mt-0.5">
            {pressureBar >= 195 ? '⚡ 100% Full Tank Capacity' : '⚠️ Partial Fill (~70-80%)'}
          </p>
        </div>

        <div className="bg-cyan-950/30 p-4 rounded-2xl border border-cyan-500/30">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Estimated Driving Range</span>
          <p className="text-2xl font-black text-cyan-300 mt-1">~{fullTankRangeKm} km</p>
          <p className="text-[10px] text-cyan-400/90 font-semibold mt-0.5">
            +{extraRangeGained} km extra vs low pressure!
          </p>
        </div>

        <div className="bg-purple-950/30 p-4 rounded-2xl border border-purple-500/30">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Trip Savings vs Petrol</span>
          <p className="text-2xl font-black text-purple-300 mt-1">₹{moneySaved}</p>
          <p className="text-[10px] text-purple-400/90 font-semibold mt-0.5">
            Cost ₹{totalCngCost} vs ₹{equivalentPetrolCost} Petrol
          </p>
        </div>
      </div>
    </div>
  );
};

export default CngCalculator;
