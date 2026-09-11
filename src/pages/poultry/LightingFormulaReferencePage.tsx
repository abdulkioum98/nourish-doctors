import React from 'react';
import { BookOpen, Calculator, CheckCircle2 } from 'lucide-react';

export default function FormulaReferencePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 text-white p-6 sm:p-8 rounded-3xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-800/40 rounded-2xl border border-amber-400/30">
            <BookOpen className="text-amber-200" size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Layer Lighting Calculation Guide
            </h1>
            
          </div>
        </div>
      </div>

      {/* Formula Highlight Box */}
      <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl space-y-4 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest bg-amber-950/80 border border-amber-800/60 px-3 py-1 rounded-full">
            Core Mathematical Principle
          </span>
          <span className="text-xs text-slate-400">1 Lux = 1 Lumen / m²</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <div className="text-xs text-amber-300 font-semibold mb-1">Step A: Area Conversion</div>
            <div className="text-sm font-mono font-bold text-slate-100">
              Area (m²) = Area (sq. ft) ÷ 10.764
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <div className="text-xs text-amber-300 font-semibold mb-1">Step B: Total Lumens Needed</div>
            <div className="text-sm font-mono font-bold text-slate-100">
              Total Lumens = Required Lux × Area (m²)
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-center">
          <div className="text-xs text-amber-200 font-semibold uppercase mb-1">Final Bulb Count Formula</div>
          <div className="text-base sm:text-xl font-black text-amber-300 font-mono">
            Total Bulbs = Total Required Lumens ÷ Lumens Per Bulb
          </div>
        </div>
      </div>

      {/* Step by Step Breakdown */}
      <div className="space-y-4">
        {/* Step 1 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-3 font-bold text-slate-800 text-base">
            <span className="w-7 h-7 rounded-xl bg-amber-600 text-white text-xs flex items-center justify-center font-bold shadow-xs">
              1
            </span>
            Calculate Floor Area & Convert to Square Meters (m²)
          </div>
          <div className="pl-10 space-y-2 text-xs sm:text-sm text-slate-600">
            <p>
              Multiply Length and Width of the shed to get total square feet (sq. ft). Then divide by <strong>10.764</strong> to convert into square meters (m²).
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-slate-700">
              • Area (sq. ft) = Length (ft) × Width (ft)<br />
              • Area (m²) = Area (sq. ft) ÷ 10.764
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-3 font-bold text-slate-800 text-base">
            <span className="w-7 h-7 rounded-xl bg-amber-600 text-white text-xs flex items-center justify-center font-bold shadow-xs">
              2
            </span>
            Determine Required Light Intensity (Lux)
          </div>
          <div className="pl-10 text-xs sm:text-sm text-slate-600 space-y-2">
            <p>Select required light intensity depending on the age and flock stage:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl">
                <div className="font-bold text-amber-900 text-xs">Brooding Phase</div>
                <div className="text-slate-500 text-[11px]">0 - 1 Week</div>
                <div className="text-amber-700 font-bold mt-1 text-xs">20 - 30 Lux</div>
              </div>
              <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl">
                <div className="font-bold text-amber-900 text-xs">Growing Phase</div>
                <div className="text-slate-500 text-[11px]">2 - 17 Weeks</div>
                <div className="text-amber-700 font-bold mt-1 text-xs">5 - 10 Lux</div>
              </div>
              <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl">
                <div className="font-bold text-amber-900 text-xs">Laying Phase</div>
                <div className="text-slate-500 text-[11px]">18+ Weeks</div>
                <div className="text-amber-700 font-bold mt-1 text-xs">30 - 40 Lux</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-3 font-bold text-slate-800 text-base">
            <span className="w-7 h-7 rounded-xl bg-amber-600 text-white text-xs flex items-center justify-center font-bold shadow-xs">
              3
            </span>
            Calculate Total Required Lumens
          </div>
          <div className="pl-10 space-y-2 text-xs sm:text-sm text-slate-600">
            <p>
              Multiply target Lux by total floor area in square meters (m²) to get total required lumens for the shed.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-slate-700">
              Total Lumens = Required Lux × Area (m²)
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-3 font-bold text-slate-800 text-base">
            <span className="w-7 h-7 rounded-xl bg-amber-600 text-white text-xs flex items-center justify-center font-bold shadow-xs">
              4
            </span>
            Select Bulb Rating & Calculate Total Bulbs
          </div>
          <div className="pl-10 space-y-2 text-xs sm:text-sm text-slate-600">
            <p>
              Check manufacturer rating for bulb lumen output (typically 400, 500, or 600 lumens per bulb). Divide total lumens by lumen output per bulb.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-slate-700">
              Total Bulbs = Total Lumens ÷ Lumens per Bulb
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-3 font-bold text-slate-800 text-base">
            <span className="w-7 h-7 rounded-xl bg-amber-600 text-white text-xs flex items-center justify-center font-bold shadow-xs">
              5
            </span>
            Bulb Spacing & Placement Rules
          </div>
          <div className="pl-10 space-y-1 text-xs sm:text-sm text-slate-600">
            <p>• <strong>Distance between two bulbs:</strong> Should be <strong>1.5 times</strong> the height from bird level.</p>
            <p>• <strong>Distance from sidewall to first row:</strong> Should be <strong>half (0.5x)</strong> the distance between two bulbs.</p>
          </div>
        </div>
      </div>

      {/* Worked Example Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-amber-900 text-base border-b border-amber-200/80 pb-3">
          <Calculator className="text-amber-700" size={20} />
          Practical Worked Example
        </div>

        <div className="text-xs sm:text-sm text-slate-700 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-amber-200/60">
            <div><strong>Shed Size:</strong> 50 ft. × 24 ft.</div>
            <div><strong>Target Light Intensity:</strong> 40 Lux (Laying)</div>
            <div><strong>Total Area:</strong> 1,200 sq. ft.</div>
            <div><strong>Supplied Bulb Output:</strong> 500 Lumens / bulb</div>
          </div>

          <div className="space-y-1.5 pt-1">
            <p className="font-semibold text-slate-800">Step-by-Step Calculation:</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 font-mono text-xs text-slate-800">
              <li>
                Area in m² = 1,200 ÷ 10.764 = <strong className="text-amber-900">111.48 m²</strong>
              </li>
              <li>
                Total Lumens = 40 Lux × 111.48 m² = <strong className="text-amber-900">4,459.2 Lumens</strong>
              </li>
              <li>
                Total Bulbs Needed = 4,459.2 ÷ 500 = <strong className="text-amber-900">8.91 ≈ 9 Bulbs</strong>
              </li>
            </ol>
          </div>

          <div className="flex items-center gap-2 bg-amber-100/80 text-amber-900 p-3 rounded-xl text-xs font-semibold">
            <CheckCircle2 size={16} className="text-amber-700 shrink-0" />
            <span>Conclusion: For a 50 × 24 ft shed, you require exactly 9 bulbs of 500 Lumens each to maintain 40 Lux.</span>
          </div>
        </div>
      </div>
    </div>
  );
}