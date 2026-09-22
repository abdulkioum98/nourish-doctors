import React from 'react';
import { Binary, Calculator, CheckCircle2, Info, AlertTriangle, Layers } from 'lucide-react';

export default function PoultryUniformityFormulaGuide() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 rounded-2xl shadow-md">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
            <Binary size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Uniformity Formula Guide</h1>
            <p className="text-amber-100 text-xs sm:text-sm">
              Understand the mathematical formulas used to evaluate layer flock body weight distribution.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Flock Uniformity Formula (Detailed ±10% Breakdown) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Calculator size={20} />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            1. Flock Uniformity (%) Formula (±10% Range Method)
          </h2>
        </div>

        <p className="text-sm text-slate-600">
          Flock uniformity measures the percentage of birds whose body weight falls within <span className="font-semibold text-slate-800">±10%</span> of the average (mean) weight of the flock. This is the gold standard for evaluating flock management and growth consistency.
        </p>

        {/* Main Formula Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Formula</p>
          <div className="text-sm sm:text-base font-bold text-amber-700 bg-amber-50/60 py-2.5 px-4 rounded-lg inline-block border border-amber-200/50">
            Uniformity (%) = (Number of Birds within ±10% Range / Total Birds Weighed) × 100
          </div>
        </div>

        {/* Step-by-Step Calculation Guide Cards */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step-by-Step Calculation Process</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-amber-50/40 border border-amber-200/70 p-4 rounded-xl space-y-2">
              <div className="w-7 h-7 bg-amber-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="font-bold text-sm text-amber-900">Find Mean Weight</h4>
              <p className="text-xs text-slate-600">
                Calculate the average body weight of all sampled birds in the flock.
              </p>
              <div className="bg-white p-2 rounded border border-amber-100 text-xs font-mono text-amber-800 text-center">
                Mean = Total Weight / Total Birds
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-amber-50/40 border border-amber-200/70 p-4 rounded-xl space-y-2">
              <div className="w-7 h-7 bg-amber-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="font-bold text-sm text-amber-900">Calculate ±10% Limits</h4>
              <p className="text-xs text-slate-600">
                Determine the acceptable lower and upper weight boundaries based on the mean.
              </p>
              <div className="bg-white p-2 rounded border border-amber-100 text-xs font-mono text-amber-800 space-y-1">
                <div>Lower = Mean × 0.90</div>
                <div>Upper = Mean × 1.10</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-amber-50/40 border border-amber-200/70 p-4 rounded-xl space-y-2">
              <div className="w-7 h-7 bg-amber-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="font-bold text-sm text-amber-900">Count & Percentage</h4>
              <p className="text-xs text-slate-600">
                Count birds inside the limits, divide by total birds, and multiply by 100.
              </p>
              <div className="bg-white p-2 rounded border border-amber-100 text-xs font-mono text-amber-800 text-center">
                Result = Uniformity %
              </div>
            </div>
          </div>
        </div>

        {/* Visual Example Sketch Box */}
        <div className="bg-slate-900 text-slate-100 p-5 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Layers size={16} />
            <span>Practical Example & Weight Distribution Sketch</span>
          </div>
          <p className="text-xs text-slate-300">
            Suppose Average Mean Weight = <strong className="text-white">1,500 g</strong>. 
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-xs">
              <span className="text-amber-300 font-semibold">Lower Limit (-10%):</span> <br/>
              1,500 × 0.90 = <strong className="text-white">1,350 g</strong>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-xs">
              <span className="text-amber-300 font-semibold">Upper Limit (+10%):</span> <br/>
              1,500 × 1.10 = <strong className="text-white">1,650 g</strong>
            </div>
          </div>
          <p className="text-xs text-slate-400 pt-1">
            * Birds weighing between <strong className="text-slate-200">1,350g</strong> and <strong className="text-slate-200">1,650g</strong> are counted towards the uniform flock percentage.
          </p>
        </div>
      </div>

      {/* 2. Industry Standards & Interpretation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            2. Uniformity Interpretation Standards
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-emerald-900">85% - 90% (or higher): Excellent Uniformity</span>
              <p className="text-emerald-700 mt-0.5">Flock is well-managed, leading to peak egg production and steady egg size.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
            <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-amber-900">75% - 84%: Acceptable Uniformity</span>
              <p className="text-amber-700 mt-0.5">Standard management. Minor adjustments in feed distribution or stocking density may help.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-rose-900">Below 75%: Poor Uniformity</span>
              <p className="text-rose-700 mt-0.5">Indicates issues with feeding space, disease challenge, lighting uniformity, or overcrowding.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}