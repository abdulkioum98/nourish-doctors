import React, { useState } from 'react';
import { Scale, Info, RotateCcw, HelpCircle } from 'lucide-react';

interface WeightEstimatorPageProps {
  onBack?: () => void;
}

export default function WeightEstimatorPage({ onBack }: WeightEstimatorPageProps) {
  // --- STATES ---
  const [lengthInches, setLengthInches] = useState<string>('');
  const [girthInches, setGirthInches] = useState<string>('');
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // --- CALCULATION LOGIC (Direct KG Calculation) ---
  const lengthVal = parseFloat(lengthInches) || 0;
  const girthVal = parseFloat(girthInches) || 0;

  let calculatedWeightKg = 0;
  let calculatedWeightLbs = 0;

  const hasValidInput = lengthVal > 0 && girthVal > 0;

  if (hasValidInput) {
    // Directly calculate in KG using modified divisor (300 / 0.45359237 = 661.387)
    calculatedWeightKg = (lengthVal * Math.pow(girthVal, 2)) / 661.387;
    // KG to Lbs conversion
    calculatedWeightLbs = calculatedWeightKg * 2.20462;
  }

  const handleReset = () => {
    setLengthInches('');
    setGirthInches('');
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none">
          <Scale size={160} />
        </div>
        <div className="flex justify-between items-start">
          <div>
            
            <h2 className="text-xl sm:text-2xl font-bold mt-2 leading-tight">
              Cattle Weight Estimator
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
              Estimate live cattle weight accurately using Schaeffer's Formula.
            </p>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-emerald-100 shrink-0 ml-2"
            title="Measurement Guide"
          >
            <HelpCircle size={22} />
          </button>
        </div>
      </div>

      {/* Measurement Guide Accordion/Modal */}
      {showGuide && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-2 animate-fadeIn shadow-xs">
          <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800">
            <Info size={18} className="text-emerald-600 shrink-0" />
            <span>How to measure properly?</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1 leading-relaxed">
            <li>
              <strong>Body Length:</strong> Measure in inches from the Point of Shoulder to the Pin Bone.
            </li>
            <li>
              <strong>Heart Girth:</strong> Measure in inches around the chest, directly behind the front legs.
            </li>
            <li>
              <strong>Note:</strong> Ensure the animal is standing square on level ground during measurement.
            </li>
          </ul>
        </div>
      )}

      {/* Input Form Box */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center space-x-2">
            <Scale size={18} className="text-emerald-600" />
            <span>Enter Measurements (in inches)</span>
          </h3>
          {(lengthInches || girthInches) && (
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center space-x-1 transition"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Length Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Body Length <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="e.g. 48"
                value={lengthInches}
                onChange={(e) => setLengthInches(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 select-none">
                inch
              </span>
            </div>
          </div>

          {/* Heart Girth Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Heart Girth <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="e.g. 58"
                value={girthInches}
                onChange={(e) => setGirthInches(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 select-none">
                inch
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Card (Always Visible as UI Layout) */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl p-5 shadow-lg space-y-4 min-h-[180px] flex flex-col justify-between">
        <div className="text-xs uppercase tracking-wider font-extrabold text-emerald-100 flex items-center justify-between">
          <span>Estimated Live Weight</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">Schaeffer Formula</span>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
          {/* Weight in KG */}
          <div className="text-center border-r border-white/20 pr-2">
            <span className="text-[11px] font-medium text-emerald-100 block">Kilograms (KG)</span>
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {hasValidInput ? calculatedWeightKg.toFixed(1) : '--'}
            </span>
            <span className="text-xs font-bold ml-1">kg</span>
          </div>

          {/* Weight in Maund */}
          <div className="text-center pl-2">
            <span className="text-[11px] font-medium text-emerald-100 block">মণ</span>
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {hasValidInput ? (calculatedWeightKg / 40).toFixed(2) : '--'}
            </span>
            <span className="text-xs font-bold ml-1">মণ</span>
          </div>
        </div>

        {/* Additional Units Breakdown */}
        <div className="flex justify-between items-center text-xs text-emerald-100/90 pt-1 px-1">
          <span>
            Weight in Pounds:{' '}
            <strong>{hasValidInput ? `${calculatedWeightLbs.toFixed(1)} Lbs` : '--'}</strong>
          </span>
          <span>1 মণ = 40 KG</span>
        </div>
      </div>
    </div>
  );
}