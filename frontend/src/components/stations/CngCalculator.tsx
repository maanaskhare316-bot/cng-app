import React, { useState } from 'react';
import { Calculator, Zap } from 'lucide-react';

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
  const [cngPrice] = useState<number>(initialPricePerKg);
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
    <div className="bg-[#F8FAFC] rounded-[14px] border border-[#DCE5EE] p-5 sm:p-6 shadow-sm space-y-5 text-[#243447]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#E8EEF5] border border-[#DCE5EE] text-[#14283F] rounded-xl">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-[#14283F] text-sm sm:text-base">
              CNG Pressure & Highway Range Calculator
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Calculate cylinder filling capacity and range gains at 200+ Bar pressure
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Type Selector */}
      <div>
        <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
          Select Vehicle Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VEHICLES.map((v) => (
            <button
              key={v.name}
              type="button"
              onClick={() => setSelectedVehicle(v)}
              className={`p-3 rounded-xl border text-left transition ${
                selectedVehicle.name === v.name
                  ? 'bg-[#14283F] border-[#14283F] text-white'
                  : 'bg-[#E8EEF5] border-[#DCE5EE] text-[#243447] hover:bg-[#DCE5EE]'
              }`}
            >
              <div className="text-xl mb-1">{v.emoji}</div>
              <p className={`text-xs font-bold leading-tight truncate ${selectedVehicle.name === v.name ? 'text-white' : 'text-[#14283F]'}`}>
                {v.name.split(' (')[0]}
              </p>
              <p className={`text-[10px] mt-0.5 ${selectedVehicle.name === v.name ? 'text-slate-300' : 'text-[#64748B]'}`}>
                {v.avgMileageKmPerKg} km/kg avg
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Pressure Slider */}
      <div className="bg-[#E8EEF5] p-4 rounded-xl border border-[#DCE5EE] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#14283F]">
            <Zap size={14} className="text-[#16B8C9]" />
            <span>Station Pump Pressure</span>
          </div>
          <span
            className={`text-sm font-black px-2.5 py-0.5 rounded-full border ${
              pressureBar >= 195
                ? 'bg-[#E3F4EC] text-[#26734D] border-[#C0E4D0]'
                : pressureBar >= 175
                ? 'bg-[#FFF2DB] text-[#98651C] border-[#FFE2A4]'
                : 'bg-[#FCEAEA] text-[#B54747] border-[#F4BBBB]'
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
          className="w-full accent-[#16B8C9] h-2 bg-[#CBD5E1] rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-bold text-[#64748B]">
          <span>140 Bar (Low Pressure)</span>
          <span>185 Bar (Standard)</span>
          <span className="text-[#26734D] font-extrabold">220 Bar (Peak Fast Fill)</span>
        </div>
      </div>

      {/* Calculation Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#E3F4EC] p-4 rounded-xl border border-[#C0E4D0]">
          <span className="text-[10px] font-bold text-[#26734D] uppercase tracking-wider">Gas Capacity Filled</span>
          <p className="text-2xl font-black text-[#26734D] mt-1">{filledKg} kg</p>
          <p className="text-[10px] text-[#26734D] font-semibold mt-0.5">
            {pressureBar >= 195 ? '⚡ 100% Full Tank Capacity' : '⚠️ Partial Fill (~70-80%)'}
          </p>
        </div>

        <div className="bg-[#EBF8FF] p-4 rounded-xl border border-[#BEE3F8]">
          <span className="text-[10px] font-bold text-[#16B8C9] uppercase tracking-wider">Estimated Driving Range</span>
          <p className="text-2xl font-black text-[#14283F] mt-1">~{fullTankRangeKm} km</p>
          <p className="text-[10px] text-[#16B8C9] font-semibold mt-0.5">
            +{extraRangeGained} km extra vs low pressure!
          </p>
        </div>

        <div className="bg-[#FFF2DB] p-4 rounded-xl border border-[#FFE2A4]">
          <span className="text-[10px] font-bold text-[#98651C] uppercase tracking-wider">Trip Savings vs Petrol</span>
          <p className="text-2xl font-black text-[#98651C] mt-1">₹{moneySaved}</p>
          <p className="text-[10px] text-[#98651C] font-semibold mt-0.5">
            Cost ₹{totalCngCost} vs ₹{equivalentPetrolCost} Petrol
          </p>
        </div>
      </div>
    </div>
  );
};

export default CngCalculator;
