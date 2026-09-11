import React, { useState } from 'react';
import { Calculator, Copy, Check, Printer, RefreshCw } from 'lucide-react';
import { LayerLightingTab } from '../../components/sidebars/Poultry/LayerLightingSidebar';

// Props Interface to solve ts(2322) error
interface LayerLightCalculatorProps {
  activeTab?: LayerLightingTab;
  setActiveTab?: React.Dispatch<React.SetStateAction<LayerLightingTab>>;
}

export default function LayerLightCalculator({ activeTab, setActiveTab }: LayerLightCalculatorProps) {
  // Input States
  const [lengthFt, setLengthFt] = useState<number | ''>("");
  const [widthFt, setWidthFt] = useState<number | ''>("");
  const [targetLux, setTargetLux] = useState<number | ''>("");
  const [lumenPerBulb, setLumenPerBulb] = useState<number | ''>("");

  // Copy State
  const [copied, setCopied] = useState<boolean>(false);

  // Numeric Values
  const l = typeof lengthFt === 'number' ? lengthFt : 0;
  const w = typeof widthFt === 'number' ? widthFt : 0;
  const lux = typeof targetLux === 'number' ? targetLux : 0;
  const lumenBulb = typeof lumenPerBulb === 'number' && lumenPerBulb > 0 ? lumenPerBulb : 1;

  // Calculations
  const areaSqFt = l * w;
  const areaSqM = areaSqFt / 10.764;
  const totalLumenReq = lux * areaSqM;
  const rawBulbs = totalLumenReq / lumenBulb;
  const reqBulbs = Math.ceil(rawBulbs);

  // Reset Function
  const handleReset = () => {
    setLengthFt("");
    setWidthFt("");
    setTargetLux("");
    setLumenPerBulb("");
  };

  // Printable / Copyable Format
  const generateReportText = () => {
    let text = `=======================================\n`;
    text += `   POULTRY LIGHTING REQUIREMENT REPORT\n`;
    text += `=======================================\n\n`;
    text += `--- SHED DIMENSIONS ---\n`;
    text += `• Length: ${l} ft\n`;
    text += `• Width: ${w} ft\n`;
    text += `• Total Area (sq ft): ${areaSqFt.toFixed(2)} sq ft\n`;
    text += `• Total Area (sq m): ${areaSqM.toFixed(2)} m² (formula: ft² / 10.764)\n\n`;

    text += `--- LIGHTING REQUIREMENTS ---\n`;
    text += `• Target Lux: ${lux} Lux\n`;
    text += `• Total Required Lumens: ${totalLumenReq.toFixed(1)} Lumens (formula: Lux × m²)\n`;
    text += `• Selected Bulb Capacity: ${lumenBulb} Lumens / Bulb\n\n`;

    text += `--- FINAL RESULT ---\n`;
    text += `• Required Bulbs (Exact): ${rawBulbs.toFixed(2)} Bulbs\n`;
    text += `• Required Bulbs (Recommended): ${reqBulbs} Bulbs\n`;
    text += `=======================================\n`;
    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 sm:p-6 bg-slate-50 min-h-screen">
      {/* CSS PRINT STYLES */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area {
            position: absolute; left: 0; top: 0; width: 100%;
            background: white; padding: 20px; color: black;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* MAIN CALCULATOR GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 no-print">
        
        {/* LEFT COLUMN: INPUT FORM */}
        <div className="md:col-span-7 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calculator size={18} className="text-amber-600" />
              <span>Shed & Lighting Inputs</span>
            </h2>

            <button
              onClick={handleReset}
              className="bg-amber-700/80 hover:bg-amber-700 text-white border border-amber-400/40 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Reset</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Length (ft)</label>
              <input
                type="number"
                min="0"
                value={lengthFt}
                onChange={(e) => setLengthFt(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Width (ft)</label>
              <input
                type="number"
                min="0"
                value={widthFt}
                onChange={(e) => setWidthFt(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="24"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Lux</label>
              <input
                type="number"
                min="0"
                value={targetLux}
                onChange={(e) => setTargetLux(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="30-40"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Laying: 30-40 Lux recommended</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bulb Output (Lumen)</label>
              <input
                type="number"
                min="1"
                value={lumenPerBulb}
                onChange={(e) => setLumenPerBulb(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Common: 400 / 500 / 600 Lumen</span>
            </div>
          </div>

          {/* QUICK LUX GUIDE */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
            <span className="font-bold block">💡 Recommended Lux Guide:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
              <li>Brooding Period: 20 – 40 Lux</li>
              <li>Rearing / Growing: 5 – 10 Lux</li>
              <li>Laying Period: 30 – 40 Lux</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: CALCULATION RESULTS */}
        <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Calculation Output
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600 font-medium">Shed Area (sq ft):</span>
                <span className="font-bold text-slate-800">{areaSqFt.toFixed(2)} sq ft</span>
              </div>

              <div className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600 font-medium">Shed Area (m²):</span>
                <span className="font-bold text-slate-800">{areaSqM.toFixed(2)} m²</span>
              </div>

              <div className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600 font-medium">Total Required Lumens:</span>
                <span className="font-bold text-amber-700">{totalLumenReq.toFixed(1)} lm</span>
              </div>

              <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-xl text-center space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wide text-amber-900 block">Required Light Bulbs</span>
                <div className="text-3xl font-black text-amber-700">
                  {reqBulbs} <span className="text-base font-bold text-amber-900">Bulbs</span>
                </div>
                <span className="text-[11px] font-medium text-slate-600 block">
                  ({rawBulbs.toFixed(2)} rounded to {reqBulbs})
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={handleCopy}
              className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

      </div>

      {/* FORMULA REFERENCE BOARD */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-3 no-print">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          Formula Reference & Steps
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-amber-800 block">1. Area Conversion</span>
            <p className="font-mono text-[11px]">m² = Total Sq Ft / 10.764</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-amber-800 block">2. Total Lumens</span>
            <p className="font-mono text-[11px]">Lumen = Target Lux × m²</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-amber-800 block">3. Total Light Count</span>
            <p className="font-mono text-[11px]">Bulbs = Total Lumens / Bulb Output</p>
          </div>
        </div>
      </div>

      {/* PRINTABLE AREA FOR PDF / PRINT */}
      <div id="printable-area" className="hidden print:block font-sans">
        <div className="border-b-2 border-amber-600 pb-3 mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Layer Lighting Requirement Report</h1>
            <p className="text-xs text-slate-500">Poultry Light Calculation Summary</p>
          </div>
          <p className="text-xs text-slate-400">Date: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-4 text-xs text-slate-800">
          <div className="border border-slate-200 rounded p-3 bg-slate-50">
            <h2 className="font-bold text-sm text-slate-900 mb-2 border-b border-slate-300 pb-1">Input Parameters</h2>
            <p><b>Shed Dimensions:</b> {l} ft × {w} ft</p>
            <p><b>Target Intensity:</b> {lux} Lux</p>
            <p><b>Bulb Capacity:</b> {lumenBulb} Lumens / Bulb</p>
          </div>

          <div className="border border-slate-200 rounded p-3">
            <h2 className="font-bold text-sm text-slate-900 mb-2 border-b border-slate-300 pb-1">Calculation Steps</h2>
            <p className="mb-1">1. Area: {areaSqFt.toFixed(2)} sq ft ÷ 10.764 = <b>{areaSqM.toFixed(2)} m²</b></p>
            <p className="mb-1">2. Required Lumens: {lux} Lux × {areaSqM.toFixed(2)} m² = <b>{totalLumenReq.toFixed(1)} Lumens</b></p>
            <p>3. Required Bulbs: {totalLumenReq.toFixed(1)} lm ÷ {lumenBulb} lm = <b>{rawBulbs.toFixed(2)} Bulbs</b></p>
          </div>

          <div className="border-2 border-amber-600 bg-amber-50 rounded p-4 text-center">
            <p className="text-xs uppercase font-bold text-amber-900">Recommended Total Light Bulbs</p>
            <p className="text-3xl font-black text-amber-700 my-1">{reqBulbs} Bulbs</p>
          </div>
        </div>
      </div>

    </div>
  );
}