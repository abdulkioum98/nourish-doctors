import React, { useState } from 'react';
import { Calculator, Home, Sun, Snowflake, Layers, ShieldAlert } from 'lucide-react';

export default function PoultrySpaceCalculator() {
  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');

  const totalArea = typeof length === 'number' && typeof width === 'number' ? length * width : 0;

  // Space requirements per bird
  // Broiler 0-2 weeks: Winter 0.5 sq ft, Summer 0.6 sq ft[cite: 6]
  // Broiler 3-5 weeks: Winter 1.0 sq ft, Summer 1.2 sq ft[cite: 6]
  // Sonali: Winter 0.85 sq ft, Summer 0.95 sq ft
  // Layer (Floor): Winter 3.0 sq ft, Summer 3.5 sq ft
  // Layer (Cage): Winter 0.5 sq ft, Summer 0.6 sq ft

  // Winter Capacities
  const broiler02Winter = totalArea > 0 ? Math.floor(totalArea / 0.5) : 0; //[cite: 6]
  const broiler35Winter = totalArea > 0 ? Math.floor(totalArea / 1.0) : 0; //[cite: 6]
  const sonaliWinter = totalArea > 0 ? Math.floor(totalArea / 0.85) : 0;
  const layerFloorWinter = totalArea > 0 ? Math.floor(totalArea / 3.0) : 0;
  const layerCageWinter = totalArea > 0 ? Math.floor(totalArea / 0.5) : 0;

  // Summer Capacities
  const broiler02Summer = totalArea > 0 ? Math.floor(totalArea / 0.6) : 0; //[cite: 6]
  const broiler35Summer = totalArea > 0 ? Math.floor(totalArea / 1.2) : 0; //[cite: 6]
  const sonaliSummer = totalArea > 0 ? Math.floor(totalArea / 0.95) : 0;
  const layerFloorSummer = totalArea > 0 ? Math.floor(totalArea / 3.5) : 0;
  const layerCageSummer = totalArea > 0 ? Math.floor(totalArea / 0.6) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 rounded-3xl p-2 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2"> Poultry Space Calculator</h1>
          
        </div>
        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 hidden sm:block">
          <Calculator size={36} className="text-amber-200" />
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
            Shed Length (Feet)
          </label>
          <input
            type="number"
            placeholder="e.g. 50"
            value={length}
            onChange={(e) => setLength(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm font-medium focus:outline-none focus:border-amber-600 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
            Shed Width (Feet)
          </label>
          <input
            type="number"
            placeholder="e.g. 20"
            value={width}
            onChange={(e) => setWidth(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm font-medium focus:outline-none focus:border-amber-600 transition-all"
          />
        </div>
      </div>

      {/* Total Area Overview */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl p-5 flex items-center justify-between text-amber-900 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="bg-amber-200/70 p-3 rounded-2xl">
            <Home size={26} className="text-amber-800" />
          </div>
          <div>
            <p className="text-xs text-amber-700 uppercase tracking-wider font-bold">Total Floor Area</p>
            <p className="text-xl sm:text-2xl font-black">{totalArea} <span className="text-sm font-semibold">Sq. Feet</span></p>
          </div>
        </div>
      </div>

      {/* Results Grid - Showing Winter & Summer Together */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Broiler 0-2 Weeks */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-amber-300 transition-all space-y-4">
          <div>
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-xl mb-1">
              Broiler (0-2 Weeks)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-sky-50 p-3 rounded-2xl text-center border border-sky-100">
              <div className="flex items-center justify-center space-x-1 text-sky-700 text-xs font-bold mb-1">
                <Snowflake size={13} />
                <span>Winter</span>
              </div>
              <p className="text-xl font-black text-sky-900">{broiler02Winter}</p>
              <span className="text-[10px] text-sky-600">0.5 sq.ft.[cite: 6]</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl text-center border border-amber-100">
              <div className="flex items-center justify-center space-x-1 text-amber-700 text-xs font-bold mb-1">
                <Sun size={13} />
                <span>Summer</span>
              </div>
              <p className="text-xl font-black text-amber-900">{broiler02Summer}</p>
              <span className="text-[10px] text-amber-600">0.6 sq.ft.[cite: 6]</span>
            </div>
          </div>
        </div>

        {/* Broiler 3-5 Weeks */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-amber-300 transition-all space-y-4">
          <div>
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-xl mb-1">
              Broiler (3-5 Weeks)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-sky-50 p-3 rounded-2xl text-center border border-sky-100">
              <div className="flex items-center justify-center space-x-1 text-sky-700 text-xs font-bold mb-1">
                <Snowflake size={13} />
                <span>Winter</span>
              </div>
              <p className="text-xl font-black text-sky-900">{broiler35Winter}</p>
              <span className="text-[10px] text-sky-600">1.0 sq.ft.[cite: 6]</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl text-center border border-amber-100">
              <div className="flex items-center justify-center space-x-1 text-amber-700 text-xs font-bold mb-1">
                <Sun size={13} />
                <span>Summer</span>
              </div>
              <p className="text-xl font-black text-amber-900">{broiler35Summer}</p>
              <span className="text-[10px] text-amber-600">1.2 sq.ft.[cite: 6]</span>
            </div>
          </div>
        </div>

        {/* Sonali Chicken */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-teal-300 transition-all space-y-4">
          <div>
            <span className="inline-block px-3 py-1 bg-teal-100 text-teal-900 text-xs font-bold rounded-xl mb-1">
              Sonali Chicken
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-sky-50 p-3 rounded-2xl text-center border border-sky-100">
              <div className="flex items-center justify-center space-x-1 text-sky-700 text-xs font-bold mb-1">
                <Snowflake size={13} />
                <span>Winter</span>
              </div>
              <p className="text-xl font-black text-sky-900">{sonaliWinter}</p>
              <span className="text-[10px] text-sky-600">0.85 sq.ft.</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl text-center border border-amber-100">
              <div className="flex items-center justify-center space-x-1 text-amber-700 text-xs font-bold mb-1">
                <Sun size={13} />
                <span>Summer</span>
              </div>
              <p className="text-xl font-black text-amber-900">{sonaliSummer}</p>
              <span className="text-[10px] text-amber-600">0.95 sq.ft.</span>
            </div>
          </div>
        </div>

        {/* Layer (Floor System) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-indigo-300 transition-all space-y-4">
          <div>
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-900 text-xs font-bold rounded-xl mb-1">
              Layer (Floor System)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-sky-50 p-3 rounded-2xl text-center border border-sky-100">
              <div className="flex items-center justify-center space-x-1 text-sky-700 text-xs font-bold mb-1">
                <Snowflake size={13} />
                <span>Winter</span>
              </div>
              <p className="text-xl font-black text-sky-900">{layerFloorWinter}</p>
              <span className="text-[10px] text-sky-600">3.0 sq.ft.</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl text-center border border-amber-100">
              <div className="flex items-center justify-center space-x-1 text-amber-700 text-xs font-bold mb-1">
                <Sun size={13} />
                <span>Summer</span>
              </div>
              <p className="text-xl font-black text-amber-900">{layerFloorSummer}</p>
              <span className="text-[10px] text-amber-600">3.5 sq.ft.</span>
            </div>
          </div>
        </div>

        {/* Layer (Cage System) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-purple-300 transition-all space-y-4">
          <div>
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-900 text-xs font-bold rounded-xl mb-1">
              Layer (Cage System)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-sky-50 p-3 rounded-2xl text-center border border-sky-100">
              <div className="flex items-center justify-center space-x-1 text-sky-700 text-xs font-bold mb-1">
                <Snowflake size={13} />
                <span>Winter</span>
              </div>
              <p className="text-xl font-black text-sky-900">{layerCageWinter}</p>
              <span className="text-[10px] text-sky-600">0.5 sq.ft.</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl text-center border border-amber-100">
              <div className="flex items-center justify-center space-x-1 text-amber-700 text-xs font-bold mb-1">
                <Sun size={13} />
                <span>Summer</span>
              </div>
              <p className="text-xl font-black text-amber-900">{layerCageSummer}</p>
              <span className="text-[10px] text-amber-600">0.6 sq.ft.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Summary Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-amber-100 overflow-hidden mt-6">
        <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center space-x-2 text-amber-900 font-bold text-sm">
          <Layers size={18} />
          <span>Space Requirement Reference Guide</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-100 uppercase text-xs tracking-wider">
                <th className="p-3.5 text-center">Category</th>
                <th className="p-3.5 text-center">Age / System</th>
                <th className="p-3.5 text-center">Winter Space</th>
                <th className="p-3.5 text-center">Summer Space</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              <tr>
                <td className="p-3 text-center font-bold text-amber-800">Broiler</td>
                <td className="p-3 text-center">0 - 2 Weeks</td>
                <td className="p-3 text-center text-sky-700 font-bold">0.5 sq. ft.[cite: 6]</td>
                <td className="p-3 text-center text-amber-700 font-bold">0.6 sq. ft.[cite: 6]</td>
              </tr>
              <tr className="bg-amber-50/30">
                <td className="p-3 text-center font-bold text-amber-800">Broiler</td>
                <td className="p-3 text-center">3 - 5 Weeks</td>
                <td className="p-3 text-center text-sky-700 font-bold">1.0 sq. ft.[cite: 6]</td>
                <td className="p-3 text-center text-amber-700 font-bold">1.2 sq. ft.[cite: 6]</td>
              </tr>
              <tr>
                <td className="p-3 text-center font-bold text-teal-800">Sonali</td>
                <td className="p-3 text-center">Grower / Adult</td>
                <td className="p-3 text-center text-sky-700 font-bold">0.85 sq. ft.</td>
                <td className="p-3 text-center text-amber-700 font-bold">0.95 sq. ft.</td>
              </tr>
              <tr className="bg-amber-50/30">
                <td className="p-3 text-center font-bold text-indigo-800">Layer</td>
                <td className="p-3 text-center">Floor System</td>
                <td className="p-3 text-center text-sky-700 font-bold">3.0 sq. ft.</td>
                <td className="p-3 text-center text-amber-700 font-bold">3.5 sq. ft.</td>
              </tr>
              <tr>
                <td className="p-3 text-center font-bold text-purple-800">Layer</td>
                <td className="p-3 text-center">Cage System</td>
                <td className="p-3 text-center text-sky-700 font-bold">0.5 sq. ft.</td>
                <td className="p-3 text-center text-amber-700 font-bold">0.6 sq. ft.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Note */}
      <div className="text-xs text-slate-400 flex items-center space-x-1.5 px-2">
        <ShieldAlert size={15} className="shrink-0 text-amber-600" />
        <span>Note: Actual capacity may slightly adjust depending on ventilation, feed trough length, and drinker availability.</span>
      </div>
    </div>
  );
}