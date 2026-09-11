import React, { useState } from 'react';
import { Calculator, Copy, Check, Printer, RefreshCw, Award, Scale } from 'lucide-react';

export default function PoultryUniformityCalculator() {
  // Input States
  const [weightsInput, setWeightsInput] = useState<string>('');
  const [unit, setUnit] = useState<'g' | 'kg'>('g'); // Default unit set to Gram
  const [copied, setCopied] = useState<boolean>(false);

  // Function to handle Unit Toggle and convert existing input text
  const handleUnitChange = (newUnit: 'g' | 'kg') => {
    if (newUnit === unit) return;

    if (weightsInput.trim().length > 0) {
      // Split text by lines/commas/spaces, convert each number, and reconstruct
      const convertedText = weightsInput
        .split(/([\n, ]+)/) // Preserve original separators (spaces, commas, newlines)
        .map((segment) => {
          const num = parseFloat(segment.trim());
          if (!isNaN(num) && num > 0) {
            if (newUnit === 'kg' && unit === 'g') {
              // Gram to Kg (Divide by 1000)
              return (num / 1000).toString();
            } else if (newUnit === 'g' && unit === 'kg') {
              // Kg to Gram (Multiply by 1000)
              return Math.round(num * 1000).toString();
            }
          }
          return segment; // Return separators unchanged
        })
        .join('');

      setWeightsInput(convertedText);
    }

    setUnit(newUnit);
  };

  // Parse Weights
  const weightsList = weightsInput
    .split(/[\n, ]+/)
    .map((w) => parseFloat(w.trim()))
    .filter((w) => !isNaN(w) && w > 0);

  const totalBirds = weightsList.length;
  const totalWeight = weightsList.reduce((sum, w) => sum + w, 0);
  const avgWeight = totalBirds > 0 ? totalWeight / totalBirds : 0;

  // Conversion for display (if input is in grams, also derive kg values)
  const avgWeightKg = unit === 'g' ? avgWeight / 1000 : avgWeight;
  const totalWeightKg = unit === 'g' ? totalWeight / 1000 : totalWeight;

  // +- 10% Range
  const minWeight = avgWeight * 0.90;
  const maxWeight = avgWeight * 1.10;

  const minWeightKg = avgWeightKg * 0.90;
  const maxWeightKg = avgWeightKg * 1.10;

  // Count Birds in Range
  const birdsInRange = weightsList.filter((w) => w >= minWeight && w <= maxWeight).length;
  const uniformityPct = totalBirds > 0 ? (birdsInRange / totalBirds) * 100 : 0;

  // Uniformity Status Rating
  const getUniformityStatus = (pct: number, hasData: boolean) => {
    if (!hasData) return { label: 'Waiting for Input', color: 'text-slate-500 bg-slate-100 border-slate-200' };
    if (pct >= 85) return { label: 'Excellent', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
    if (pct >= 80) return { label: 'Good', color: 'text-blue-700 bg-blue-100 border-blue-300' };
    if (pct >= 70) return { label: 'Fair / Average', color: 'text-amber-800 bg-amber-100 border-amber-300' };
    return { label: 'Poor (Needs Management Attention)', color: 'text-rose-700 bg-rose-100 border-rose-300' };
  };

  const status = getUniformityStatus(uniformityPct, totalBirds > 0);

  // Reset Function
  const handleReset = () => {
    setWeightsInput('');
  };

  // Generate Report Text
  const generateReportText = () => {
    let text = `=======================================\n`;
    text += `    POULTRY FLOCK UNIFORMITY REPORT\n`;
    text += `=======================================\n\n`;

    text += `--- SAMPLE DATA ---\n`;
    text += `• Total Birds Weighed: ${totalBirds}\n`;
    text += `• Total Weight: ${totalWeight.toFixed(unit === 'g' ? 1 : 3)} ${unit} (${totalWeightKg.toFixed(3)} kg)\n`;
    text += `• Average Body Weight: ${avgWeight.toFixed(unit === 'g' ? 1 : 3)} ${unit} (${avgWeightKg.toFixed(3)} kg)\n\n`;

    text += `--- ±10% RANGE CALCULATION ---\n`;
    text += `• Lower Limit (-10%): ${minWeight.toFixed(unit === 'g' ? 1 : 3)} ${unit}\n`;
    text += `• Upper Limit (+10%): ${maxWeight.toFixed(unit === 'g' ? 1 : 3)} ${unit}\n`;
    text += `• Birds within Range: ${birdsInRange} / ${totalBirds}\n\n`;

    text += `--- RESULT ---\n`;
    text += `• Uniformity: ${uniformityPct.toFixed(1)}%\n`;
    text += `• Rating: ${status.label}\n`;
    text += `=======================================\n`;
    return text;
  };

  const handleCopy = () => {
    if (totalBirds === 0) return;
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (totalBirds === 0) return;
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
        
        {/* LEFT COLUMN: INPUT WEIGHTS */}
        <div className="md:col-span-7 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calculator size={18} className="text-amber-600" />
              <span>Individual Bird Weights</span>
            </h2>

            {/* UNIT TOGGLE BUTTON */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
              <button
                onClick={() => handleUnitChange('g')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${unit === 'g' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Gram (g)
              </button>
              <button
                onClick={() => handleUnitChange('kg')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${unit === 'kg' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Kg
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Enter Bird Weights in <span className="text-amber-700 font-extrabold uppercase">{unit === 'g' ? 'Grams (g)' : 'Kilograms (kg)'}</span> (separated by comma, space, or newline)
            </label>
            <textarea
              rows={6}
              value={weightsInput}
              onChange={(e) => setWeightsInput(e.target.value)}
              placeholder={unit === 'g' ? "e.g. 1250, 1300, 1180, 1220, 1270..." : "e.g. 1.25, 1.30, 1.18, 1.22, 1.27..."}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
              <span>Total Birds Inputted: <b className="text-slate-800">{totalBirds}</b></span>
              <span>Total Weight: <b className="text-slate-800">{totalBirds > 0 ? `${totalWeight.toFixed(unit === 'g' ? 1 : 3)} ${unit}` : `0 ${unit}`}</b></span>
            </div>
          </div>

          {/* RESET BUTTON */}
          <button
            onClick={handleReset}
            className="bg-amber-700/60 hover:bg-amber-700 text-white border border-amber-400/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Reset Input</span>
          </button>
        </div>

        {/* RIGHT COLUMN: RESULT BOARD */}
        <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Calculation Output
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600 font-medium">Average Weight:</span>
                <div className="text-right">
                  <span className="font-bold text-slate-900 text-sm block">
                    {totalBirds > 0 ? `${avgWeight.toFixed(unit === 'g' ? 1 : 3)} ${unit}` : `0 ${unit}`}
                  </span>
                  {unit === 'g' && totalBirds > 0 && (
                    <span className="text-[10px] text-slate-500 block">({avgWeightKg.toFixed(3)} kg)</span>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">±10% Weight Range:</span>
                  <span className="font-bold text-amber-800">
                    {totalBirds > 0 ? `${minWeight.toFixed(unit === 'g' ? 0 : 3)} – ${maxWeight.toFixed(unit === 'g' ? 0 : 3)} ${unit}` : `0 – 0 ${unit}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>-10%: {totalBirds > 0 ? `${minWeight.toFixed(unit === 'g' ? 1 : 3)} ${unit}` : `0 ${unit}`}</span>
                  <span>+10%: {totalBirds > 0 ? `${maxWeight.toFixed(unit === 'g' ? 1 : 3)} ${unit}` : `0 ${unit}`}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600 font-medium">Birds in Range:</span>
                <span className="font-bold text-slate-800">
                  {totalBirds > 0 ? `${birdsInRange} / ${totalBirds} birds` : '0 / 0 birds'}
                </span>
              </div>

              {/* MAIN RESULT DISPLAY */}
              <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-xl text-center space-y-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wide text-amber-900 block">Flock Uniformity</span>
                <div className="text-4xl font-black text-amber-700">
                  {totalBirds > 0 ? `${uniformityPct.toFixed(1)}%` : '0.0%'}
                </div>
                <div className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.color}`}>
                  {status.label}
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={handleCopy}
              disabled={totalBirds === 0}
              className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={totalBirds === 0}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

      </div>

      {/* RATING REFERENCE TABLE */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 no-print">
        <span className="font-bold text-slate-800 flex items-center gap-1">
          <Award size={14} className="text-amber-600" /> Standard Uniformity Target:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
          <div>• <b>85% or above:</b> Excellent</div>
          <div>• <b>80% – 84%:</b> Good</div>
          <div>• <b>70% – 79%:</b> Fair / Average</div>
          <div>• <b>Below 70%:</b> Poor</div>
        </div>
      </div>

      {/* FORMULA REFERENCE BOARD */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-3 no-print">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <Scale size={16} className="text-amber-700" />
          <span>±10% Method Step-by-Step Calculation Formula</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-amber-800 block">Step 1: Avg Weight</span>
            <p className="font-mono text-[11px]">Total Weight ÷ Birds Weighed</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-amber-800 block">Step 2: Min Limit</span>
            <p className="font-mono text-[11px]">Avg Weight × 0.90 (-10%)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-amber-800 block">Step 3: Max Limit</span>
            <p className="font-mono text-[11px]">Avg Weight × 1.10 (+10%)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-amber-800 block">Step 4: Uniformity %</span>
            <p className="font-mono text-[11px]">(Birds in Range ÷ Total) × 100</p>
          </div>
        </div>
      </div>

      {/* PRINTABLE AREA FOR PDF / PRINT */}
      <div id="printable-area" className="hidden print:block font-sans">
        <div className="border-b-2 border-amber-600 pb-3 mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Flock Uniformity Calculation Report</h1>
            <p className="text-xs text-slate-500">Standard ±10% Method</p>
          </div>
          <p className="text-xs text-slate-400">Date: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-4 text-xs text-slate-800">
          <div className="border border-slate-200 rounded p-3 bg-slate-50">
            <h2 className="font-bold text-sm text-slate-900 mb-2 border-b border-slate-300 pb-1">Sample Summary</h2>
            <p><b>Total Birds Weighed:</b> {totalBirds}</p>
            <p><b>Total Sample Weight:</b> {totalWeight.toFixed(unit === 'g' ? 1 : 3)} {unit} ({totalWeightKg.toFixed(3)} kg)</p>
            <p><b>Average Body Weight:</b> {avgWeight.toFixed(unit === 'g' ? 1 : 3)} {unit} ({avgWeightKg.toFixed(3)} kg)</p>
          </div>

          <div className="border border-slate-200 rounded p-3">
            <h2 className="font-bold text-sm text-slate-900 mb-2 border-b border-slate-300 pb-1">Uniformity Range</h2>
            <p><b>Lower Limit (-10%):</b> {minWeight.toFixed(unit === 'g' ? 1 : 3)} {unit} ({minWeightKg.toFixed(3)} kg)</p>
            <p><b>Upper Limit (+10%):</b> {maxWeight.toFixed(unit === 'g' ? 1 : 3)} {unit} ({maxWeightKg.toFixed(3)} kg)</p>
            <p><b>Birds falling within range:</b> {birdsInRange} out of {totalBirds}</p>
          </div>

          <div className="border-2 border-amber-600 bg-amber-50 rounded p-4 text-center">
            <p className="text-xs uppercase font-bold text-amber-900">Flock Uniformity Result</p>
            <p className="text-3xl font-black text-amber-700 my-1">{uniformityPct.toFixed(1)}%</p>
            <p className="text-xs font-bold text-slate-700">Flock Status: {status.label}</p>
          </div>
        </div>
      </div>

    </div>
  );
}