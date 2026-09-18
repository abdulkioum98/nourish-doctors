import React from 'react';
import { BookOpen, Calculator, CheckCircle2, Lightbulb, Layers, Ruler, ArrowRight } from 'lucide-react';

export default function FormulaReferencePage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 font-sans text-slate-800">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <BookOpen className="text-amber-400" size={28} />
          </div>
          <div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              Layer Lighting Calculation Formula
            </h1>
          </div>
        </div>
      </div>

      {/* 2. Core Mathematical Principles */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers size={18} className="text-amber-600" />
            Core Calculation Formulas
          </h2>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-md border border-slate-200 font-semibold">
            1 Lux = 1 Lumen / m²
          </span>
        </div>

        {/* 3 Step Formula Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step A */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Step 1</span>
              <h3 className="text-xs font-bold text-slate-800 mt-1">Area Conversion</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Convert Floor Area to Sq. Meters</p>
            </div>
            <div className="mt-4 p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs font-bold text-slate-900 text-center shadow-xs">
              Area (m²) = Sq. Ft ÷ 10.764
            </div>
          </div>

          {/* Step B */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Step 2</span>
              <h3 className="text-xs font-bold text-slate-800 mt-1">Total Lumens Needed</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Required Light Capacity for Shed</p>
            </div>
            <div className="mt-4 p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs font-bold text-slate-900 text-center shadow-xs">
              Lumens = Lux × Area (m²)
            </div>
          </div>

          {/* Step C */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Step 3</span>
              <h3 className="text-xs font-bold text-slate-800 mt-1">Total Bulb Quantity</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Bulbs Required Based on Specs</p>
            </div>
            <div className="mt-4 p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs font-bold text-slate-900 text-center shadow-xs">
              Bulbs = Lumens ÷ Bulb Output
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recommended Light Intensity Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Recommended Light Intensity by Stage
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/30 space-y-1">
            <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">Brooding Phase</span>
            <div className="text-xs text-slate-500 font-medium">0 - 1 Week</div>
            <div className="text-lg font-bold text-slate-900 mt-1">20 - 30 <span className="text-xs text-slate-500 font-normal">Lux</span></div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Growing Phase</span>
            <div className="text-xs text-slate-500 font-medium">2 - 17 Weeks</div>
            <div className="text-lg font-bold text-slate-900 mt-1">5 - 10 <span className="text-xs text-slate-500 font-normal">Lux</span></div>
          </div>

          <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/30 space-y-1">
            <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">Laying Phase</span>
            <div className="text-xs text-slate-500 font-medium">18+ Weeks (Production)</div>
            <div className="text-lg font-bold text-slate-900 mt-1">30 - 40 <span className="text-xs text-slate-500 font-normal">Lux</span></div>
          </div>
        </div>
      </div>

      {/* 4. Technical Architectural Placement Rules & Diagram */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <Ruler size={20} className="text-amber-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Bulb Placement & Spacing Guidelines
          </h2>
        </div>

        {/* Clean Architectural SVG Diagram */}
        <div className="bg-slate-950 p-6 rounded-xl text-white border border-slate-800 space-y-4">
          <div className="text-center text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
            Shed Cross-Section Elevation View
          </div>

          <div className="relative border-b-2 border-slate-700 pb-12 pt-8 flex items-center justify-around px-8">
            {/* Ceiling Line */}
            <div className="absolute top-2 left-4 right-4 border-t border-dashed border-slate-700 text-[10px] font-mono text-slate-500 text-center pt-1">
              Ceiling Line
            </div>

            {/* Light 1 */}
            <div className="flex flex-col items-center relative z-10">
              <div className="p-2 rounded-full bg-amber-500/20 border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                <Lightbulb size={20} className="text-amber-400 fill-amber-400" />
              </div>
              <div className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[70px] border-b-amber-500/10 mt-1" />
            </div>

            {/* Light 2 */}
            <div className="flex flex-col items-center relative z-10">
              <div className="p-2 rounded-full bg-amber-500/20 border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                <Lightbulb size={20} className="text-amber-400 fill-amber-400" />
              </div>
              <div className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[70px] border-b-amber-500/10 mt-1" />
            </div>

            {/* Bird Line Floor */}
            <div className="absolute bottom-0 left-4 right-4 border-b-2 border-amber-500/80 text-[10px] font-mono text-amber-400/90 text-center pb-1">
              Bird Level Height
            </div>
          </div>

          {/* Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <strong className="text-amber-400 block mb-1">Distance Between Bulbs:</strong>
              <p className="text-slate-300">
                Spacing between two adjacent light fixtures should be <span className="text-white font-semibold">1.5 times</span> the height from bird level (<span className="font-mono text-amber-300">1.5 × H</span>).
              </p>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <strong className="text-amber-400 block mb-1">Distance from Sidewall:</strong>
              <p className="text-slate-300">
                Distance from sidewalls to the first row of bulbs should be <span className="text-white font-semibold">half</span> the distance between bulbs (<span className="font-mono text-amber-300">0.5 × Spacing</span>).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Practical Worked Example */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <div className="p-2 bg-slate-900 text-amber-400 rounded-lg">
            <Calculator size={18} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Practical Calculation Example
          </h2>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Shed Dimensions</span>
            <strong className="text-slate-800 font-mono text-sm mt-0.5 block">50 ft × 24 ft</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Total Area</span>
            <strong className="text-slate-800 font-mono text-sm mt-0.5 block">1,200 sq. ft.</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Target Light Level</span>
            <strong className="text-slate-800 font-mono text-sm mt-0.5 block">40 Lux (Laying)</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Bulb Specification</span>
            <strong className="text-slate-800 font-mono text-sm mt-0.5 block">500 Lumens / bulb</strong>
          </div>
        </div>

        {/* Step-by-Step Resolution */}
        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center p-3 rounded-lg border border-slate-100 text-xs font-mono">
            <span className="text-slate-600">1. Area in Sq. Meters: 1,200 ÷ 10.764</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">111.48 m²</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-lg border border-slate-100 text-xs font-mono">
            <span className="text-slate-600">2. Required Lumens: 40 Lux × 111.48 m²</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">4,459.2 Lumens</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-xs font-mono">
            <span className="text-amber-900 font-semibold">3. Bulb Quantity Needed: 4,459.2 ÷ 500</span>
            <span className="font-bold text-amber-900 bg-amber-200/80 px-3 py-1 rounded text-sm">8.91 ≈ 9 Bulbs</span>
          </div>
        </div>

        {/* Summary Output */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center gap-3 text-xs sm:text-sm">
          <CheckCircle2 size={20} className="text-amber-400 shrink-0" />
          <span>
            <strong>Result:</strong> A 50 ft × 24 ft laying shed requires exactly <strong className="text-amber-400">9 LED Bulbs (500 Lumens each)</strong> spaced evenly to maintain 40 Lux intensity.
          </span>
        </div>
      </div>

    </div>
  );
}