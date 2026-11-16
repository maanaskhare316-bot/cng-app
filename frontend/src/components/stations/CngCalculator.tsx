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

  // Gas filled calculation: Gas Density approx 0.72 kg/m3 at standard temp; at pressure P:
  // Empirical formula: Filled Kg ≈ (TankLitres / 1000) * (PressureBar * 0.76)
  const filledKg = Number(((selectedVehicle.tankLitres / 1000) * (pressureBar * 0.75)).toFixed(1));
  const fullTankRangeKm = Math.round(filledKg * selectedVehicle.avgMileageKmPerKg);

  // Compare with a low-pressure pump (160 Bar)
  const lowPressureKg = Number(((selectedVehicle.tankLitres / 1000) * (160 * 0.75)).toFixed(1));
  const lowPressureRangeKm = Math.round(lowPressureKg * selectedVehicle.avgMileageKmPerKg);
  const extraRangeGained = Math.max(0, fullTankRangeKm - lowPressureRangeKm);

  // Cost comparison
  const totalCngCost = Math.round(filledKg * cngPrice);
  const equivalentPetrolLitres = (fullTankRangeKm / 16).toFixed(1);
  const equivalentPetrolCost = Math.round(Number(equivalentPetrolLitres) * petrolPrice);
  const moneySaved = Math.max(0, equivalentPetrolCost - totalCngCost);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              CNG Pressure & Highway Range Calculator
            </h3>
            <p className="text-[11px] text-slate-500">
              See why 200+ Bar pressure gives you maximum cylinder filling & extra km!
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Type Selector */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
          Select Vehicle Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VEHICLES.map((v) => (
            <button
              key={v.name}
              type="button"
              onClick={() => setSelectedVehicle(v)}
              className={`p-2.5 rounded-2xl border text-left transition ${
                selectedVehicle.name === v.name
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="text-xl mb-1">{v.emoji}</div>
              <p className="text-xs font-bold leading-tight truncate">{v.name.split(' (')[0]}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{v.avgMileageKmPerKg} km/kg avg</p>
            </button>
          ))}
        </div>
      </div>

      {/* Pressure Slider */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Zap size={14} className="text-emerald-600" />
            <span>Station Pump Pressure</span>
          </div>
          <span
            className={`text-sm font-black px-2.5 py-0.5 rounded-full ${
              pressureBar >= 195
                ? 'bg-emerald-100 text-emerald-800'
                : pressureBar >= 175
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
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
          className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-bold text-slate-400">
          <span>140 Bar (Low Pressure)</span>
          <span>185 Bar (Standard)</span>
          <span className="text-emerald-700 font-extrabold">220 Bar (Full Tank Peak)</span>
        </div>
      </div>

      {/* Calculation Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 rounded-2xl border border-emerald-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gas Capacity Filled</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{filledKg} kg</p>
          <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">
            {pressureBar >= 195 ? '⚡ 100% Full Tank Capacity' : '⚠️ Partial Fill (~70-80%)'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-4 rounded-2xl border border-blue-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estimated Driving Range</span>
          <p className="text-2xl font-black text-blue-700 mt-1">~{fullTankRangeKm} km</p>
          <p className="text-[10px] text-blue-800 font-semibold mt-0.5">
            +{extraRangeGained} km extra vs low pressure!
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-4 rounded-2xl border border-purple-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Savings vs Petrol</span>
          <p className="text-2xl font-black text-purple-700 mt-1">₹{moneySaved}</p>
          <p className="text-[10px] text-purple-800 font-semibold mt-0.5">
            Cost ₹{totalCngCost} vs ₹{equivalentPetrolCost} Petrol
          </p>
        </div>
      </div>
    </div>
  );
};

export default CngCalculator;
