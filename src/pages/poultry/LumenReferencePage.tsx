import React, { useState } from 'react';
import { Search, Zap, CheckCircle2, Info } from 'lucide-react';

interface BrandLumenData {
  brand: string;
  w5: number | null;
  w7: number | null;
  w9: number | null;
  w12: number | null;
  w15: number | null;
  w18: number | null;
  avgEfficacy: string;
}

const BULB_MATRIX_DATABASE: BrandLumenData[] = [
  { brand: 'Super Star', w5: 490, w7: 690, w9: 900, w12: 1200, w15: 1500, w18: 1800, avgEfficacy: '98 - 100 lm/W' },
  { brand: 'Walton', w5: 480, w7: 680, w9: 900, w12: 1200, w15: 1500, w18: 1800, avgEfficacy: '96 - 100 lm/W' },
  { brand: 'Transtec', w5: 470, w7: 660, w9: 880, w12: 1180, w15: 1470, w18: 1760, avgEfficacy: '94 - 98 lm/W' },
  { brand: 'Click', w5: 450, w7: 640, w9: 850, w12: 1140, w15: 1420, w18: 1710, avgEfficacy: '91 - 95 lm/W' },
  { brand: 'MEP', w5: 450, w7: 650, w9: 850, w12: 1150, w15: 1425, w18: 1700, avgEfficacy: '90 - 95 lm/W' },
  { brand: 'Energypac', w5: 475, w7: 675, w9: 890, w12: 1190, w15: 1485, w18: 1780, avgEfficacy: '95 - 99 lm/W' },
  { brand: 'Philips BD', w5: 520, w7: 720, w9: 950, w12: 1280, w15: 1600, w18: 1920, avgEfficacy: '100 - 106 lm/W' },
  { brand: 'Singer', w5: 460, w7: 650, w9: 860, w12: 1150, w15: 1430, w18: 1720, avgEfficacy: '92 - 96 lm/W' },
  { brand: 'SQ Lights', w5: 470, w7: 665, w9: 875, w12: 1170, w15: 1450, w18: 1740, avgEfficacy: '94 - 97 lm/W' },
  { brand: 'Rimso', w5: 440, w7: 630, w9: 830, w12: 1100, w15: 1380, w18: 1650, avgEfficacy: '88 - 92 lm/W' },
  { brand: 'GFC / General', w5: 450, w7: 640, w9: 840, w12: 1120, w15: 1400, w18: 1680, avgEfficacy: '90 - 93 lm/W' },
  { brand: 'Osaka', w5: 460, w7: 650, w9: 850, w12: 1140, w15: 1420, w18: 1700, avgEfficacy: '92 - 95 lm/W' },
  { brand: 'Panasonic BD', w5: 500, w7: 710, w9: 940, w12: 1260, w15: 1580, w18: 1900, avgEfficacy: '100 - 105 lm/W' },
  { brand: 'Toshiba', w5: 510, w7: 715, w9: 945, w12: 1270, w15: 1590, w18: 1910, avgEfficacy: '101 - 106 lm/W' },
  { brand: 'Opple Lighting', w5: 485, w7: 685, w9: 895, w12: 1195, w15: 1490, w18: 1790, avgEfficacy: '97 - 100 lm/W' },
  { brand: 'Non-Brand / Local', w5: 350, w7: 490, w9: 630, w12: 840, w15: 1050, w18: 1260, avgEfficacy: '70 - 80 lm/W' },
];

export default function LumenReferencePage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBrands = BULB_MATRIX_DATABASE.filter((item) =>
    item.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white p-5 sm:p-6 rounded-3xl shadow-md">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Zap className="text-amber-200 fill-amber-200" size={24} /> 
          Bangladesh LED Bulb Lumen Reference
        </h1>
      </div>

      {/* Search Bar & Quick Info */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search brand (e.g. Super Star, Walton)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-600 text-white text-xs sm:text-sm uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4 sticky left-0 bg-amber-600 z-20 border-b border-amber-500 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">
                  Brand / Company
                </th>
                <th className="py-3.5 px-3 text-center border-b border-amber-500 bg-amber-700/30">5W</th>
                <th className="py-3.5 px-3 text-center border-b border-amber-500">7W</th>
                <th className="py-3.5 px-3 text-center border-b border-amber-500 bg-amber-700/30">9W</th>
                <th className="py-3.5 px-3 text-center border-b border-amber-500">12W</th>
                <th className="py-3.5 px-3 text-center border-b border-amber-500 bg-amber-700/30">15W</th>
                <th className="py-3.5 px-3 text-center border-b border-amber-500">18W</th>
                <th className="py-3.5 px-4 text-right border-b border-amber-500">Efficacy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium">
              {filteredBrands.length > 0 ? (
                filteredBrands.map((row, index) => {
                  const isNonBrand = row.brand.includes('Non-Brand');
                  const cellBgClass = isNonBrand 
                    ? 'bg-rose-50' 
                    : index % 2 === 0 
                      ? 'bg-white' 
                      : 'bg-slate-50';

                  return (
                    <tr
                      key={index}
                      className={`hover:bg-amber-50/50 transition-colors ${cellBgClass}`}
                    >
                      {/* Sticky Brand Name Cell with Solid Background & Right Shadow */}
                      <td className={`py-3 px-4 font-bold text-slate-800 sticky left-0 z-10 whitespace-nowrap ${cellBgClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
                        {isNonBrand ? (
                          <span className="text-rose-600 font-bold">{row.brand}</span>
                        ) : (
                          <span>{row.brand}</span>
                        )}
                      </td>

                      {/* Watts Columns */}
                      <td className="py-3 px-3 text-center text-amber-700 font-bold bg-amber-50/30">
                        {row.w5 ? `${row.w5} lm` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center text-amber-700 font-bold">
                        {row.w7 ? `${row.w7} lm` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center text-amber-700 font-bold bg-amber-50/30">
                        {row.w9 ? `${row.w9} lm` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center text-amber-700 font-bold">
                        {row.w12 ? `${row.w12} lm` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center text-amber-700 font-bold bg-amber-50/30">
                        {row.w15 ? `${row.w15} lm` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center text-amber-700 font-bold">
                        {row.w18 ? `${row.w18} lm` : '-'}
                      </td>

                      {/* Efficacy */}
                      <td className="py-3 px-4 text-right text-slate-500 font-semibold whitespace-nowrap">
                        <span className="bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-md text-[11px]">
                          {row.avgEfficacy}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No brands found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
          <div className="flex items-center gap-1 text-amber-700 font-semibold">
            <CheckCircle2 size={13} /> Commercial LED Bulb Standard
          </div>
          <div>* lm = Lumen (Light Output)</div>
        </div>
      </div>
    </div>
  );
}