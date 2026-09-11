import React, { useState } from 'react';
import { ArrowLeft, Calculator } from 'lucide-react';

interface Props {
  onBack?: () => void;
}

export default function SchaefferFormulaPage({ onBack }: Props) {
  const [girth, setGirth] = useState<number | ''>(65);
  const [length, setLength] = useState<number | ''>(55);

  const calculatedLbs = girth && length ? Math.round((Number(girth) ** 2 * Number(length)) / 300) : 0;
  const calculatedKg = Math.round(calculatedLbs * 0.453592);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      

      {/* Main Formula Display */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg text-center space-y-4">
        <span className="bg-emerald-700/60 text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
          Standard Cattle Weight Formula
        </span>
        
        <div className="text-xl sm:text-3xl font-extrabold tracking-wide text-amber-300 py-2">
          Live Weight (Lbs) = <span className="underline decoration-emerald-400">(Girth² × Length)</span> ÷ 300
        </div>

        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
          Developed in 1914 by Dr. Schaeffer, this formula is globally recognized as one of the most reliable and accurate methods for estimating live body weight in cattle.
        </p>
      </div>

      {/* Breakdown of Variables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-emerald-700 font-bold text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Girth (Chest Circumference)
          </div>
          <p className="text-xs text-slate-600">
            Chest girth measured in inches. In the formula, this value is squared (Girth × Girth).
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-emerald-700 font-bold text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Length (Body Length)
          </div>
          <p className="text-xs text-slate-600">
            Total body length in inches measured from the Point of Shoulder to the Pin Bone.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-emerald-700 font-bold text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Constant (300)
          </div>
          <p className="text-xs text-slate-600">
            A fixed empirical divisor constant used to calibrate the volumetric ratio directly into pounds (lbs).
          </p>
        </div>
      </div>

      {/* Interactive Quick Step Simulator */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Calculator className="text-emerald-600" size={20} /> Live Calculation Practice
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Heart Girth (Inches)</label>
            <input
              type="number"
              value={girth}
              onChange={(e) => setGirth(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. 65"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Body Length (Inches)</label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. 55"
            />
          </div>
        </div>

        {/* Dynamic Step Result */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-2 font-mono">
          <p className="text-slate-600">
            Step 1: ({girth || 0} × {girth || 0} × {length || 0}) = <span className="font-bold text-slate-800">{girth && length ? Number(girth)**2 * Number(length) : 0}</span>
          </p>
          <p className="text-slate-600">
            Step 2: {girth && length ? Number(girth)**2 * Number(length) : 0} ÷ 300 = <span className="font-bold text-emerald-700">{calculatedLbs} Lbs</span>
          </p>
          <p className="text-slate-600">
            Step 3 (Metric Conversion): {calculatedLbs} Lbs × 0.4536 = <span className="font-bold text-emerald-800 text-base">{calculatedKg} Kg</span>
          </p>
        </div>
      </div>
    </div>
  );
}