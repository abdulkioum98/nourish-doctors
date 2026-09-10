import React, { useState } from 'react';
import { Percent, Calculator, Copy, Check, Printer, RefreshCw, AlertCircle, Award } from 'lucide-react';

export default function PoultryUniformityCalculator() {
  // Input States
  const [weightsInput, setWeightsInput] = useState<string>('1.20, 1.25, 1.30, 1.15, 1.28, 1.22, 1.35, 1.10, 1.24, 1.26');
  const [copied, setCopied] = useState<boolean>(false);

  // Parse Weights
  const weightsList = weightsInput
    .split(/[\n, ]+/)
    .map((w) => parseFloat(w.trim()))
    .filter((w) => !isNaN(w) && w > 0);

  const totalBirds = weightsList.length;
  const totalWeight = weightsList.reduce((sum, w) => sum + w, 0);
  const avgWeight = totalBirds > 0 ? totalWeight / totalBirds : 0;

  // +- 10% Range
  const minWeight = avgWeight * 0.90;
  const maxWeight = avgWeight * 1.10;

  // Count Birds in Range
  const birdsInRange = weightsList.filter((w) => w >= minWeight && w <= maxWeight).length;
  const uniformityPct = totalBirds > 0 ? (birdsInRange / totalBirds) * 100 : 0;

  // Uniformity Status Rating
  const getUniformityStatus = (pct: number) => {
    if (pct >= 85) return { label: 'Excellent', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
    if (pct >= 80) return { label: 'Good', color: 'text-blue-700 bg-blue-100 border-blue-300' };
    if (pct >= 70) return { label: 'Fair / Average', color: 'text-amber-700 bg-amber-100 border-amber-300' };
    return { label: 'Poor (Needs Management Attention)', color: 'text-rose-700 bg-rose-100 border-rose-300' };
  };

  const status = getUniformityStatus(uniformityPct);

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
    text += `• Total Weight: ${totalWeight.toFixed(3)} kg\n`;
    text += `• Average Body Weight: ${avgWeight.toFixed(3)} kg\n\n`;

    text += `--- ±10% RANGE CALCULATION ---\n`;
    text += `• Lower Limit (-10%): ${minWeight.toFixed(3)} kg\n`;
    text += `• Upper Limit (+10%): ${maxWeight.toFixed(3)} kg\n`;
    text += `• Birds within Range: ${birdsInRange} / ${totalBirds}\n\n`;

    text += `--- RESULT ---\n`;
    text += `• Uniformity: ${uniformityPct.toFixed(1)}%\n`;
    text += `• Rating: ${status.label}\n`;
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
        
        {/* LEFT COLUMN: INPUT WEIGHTS */}
        <div className="md:col-span-7 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Calculator size={18} className="text-emerald-600" />
            <span>Individual Bird Weights (kg)</span>
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Enter Bird Weights (separated by comma, space, or newline)
            </label>
            <textarea
              rows={6}
              value={weightsInput}
              onChange={(e) => setWeightsInput(e.target.value)}
              placeholder="e.g. 1.25, 1.30, 1.18, 1.22, 1.27..."
              className="w-full border border-slate-300 rounded-lg p-3 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
              <span>Total Birds Inputted: <b className="text-slate-800">{totalBirds}</b></span>
              <span>Total Weight: <b className="text-slate-800">{totalWeight.toFixed(3)} kg</b></span>
            </div>
          </div>

          {/* RESET BUTTON */}
        <button
          onClick={handleReset}
          className="bg-emerald-800/60 hover:bg-emerald-800 text-white border border-emerald-400/40 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-end sm:self-auto"
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

            {totalBirds > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600 font-medium">Average Weight:</span>
                  <span className="font-bold text-slate-900 text-sm">{avgWeight.toFixed(3)} kg</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">±10% Weight Range:</span>
                    <span className="font-bold text-emerald-800">{minWeight.toFixed(3)} – {maxWeight.toFixed(3)} kg</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>-10% Limit: {minWeight.toFixed(3)} kg</span>
                    <span>+10% Limit: {maxWeight.toFixed(3)} kg</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600 font-medium">Birds in Range:</span>
                  <span className="font-bold text-slate-800">{birdsInRange} / {totalBirds} birds</span>
                </div>

                {/* MAIN RESULT DISPLAY */}
                <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-xl text-center space-y-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-900 block">Flock Uniformity</span>
                  <div className="text-4xl font-black text-emerald-700">
                    {uniformityPct.toFixed(1)}%
                  </div>
                  <div className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.color}`}>
                    {status.label}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <AlertCircle size={32} className="mx-auto text-slate-300" />
                <p className="text-xs">Please enter bird weights to see calculation results.</p>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={handleCopy}
              disabled={totalBirds === 0}
              className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={totalBirds === 0}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

      </div>

       {/* RATING REFERENCE TABLE */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
            <span className="font-bold text-slate-800 block flex items-center gap-1">
              <Award size={14} className="text-amber-600" /> Standard Uniformity Target:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>• <b>85% or above:</b> Excellent</div>
              <div>• <b>80% – 84%:</b> Good</div>
              <div>• <b>70% – 79%:</b> Fair / Average</div>
              <div>• <b>Below 70%:</b> Poor</div>
            </div>
          </div>

      {/* FORMULA REFERENCE BOARD */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-3 no-print">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          ±10% Method Step-by-Step Calculation Formula
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-emerald-800 block">Step 1: Avg Weight</span>
            <p className="font-mono text-[11px]">Total Weight ÷ Birds Weighed</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-emerald-800 block">Step 2: Min Limit</span>
            <p className="font-mono text-[11px]">Avg Weight × 0.90 (-10%)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-emerald-800 block">Step 3: Max Limit</span>
            <p className="font-mono text-[11px]">Avg Weight × 1.10 (+10%)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-emerald-800 block">Step 4: Uniformity %</span>
            <p className="font-mono text-[11px]">(Birds in Range ÷ Total) × 100</p>
          </div>
        </div>
      </div>

      {/* PRINTABLE AREA FOR PDF / PRINT */}
      <div id="printable-area" className="hidden print:block font-sans">
        <div className="border-b-2 border-emerald-800 pb-3 mb-4 flex justify-between items-center">
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
            <p><b>Total Sample Weight:</b> {totalWeight.toFixed(3)} kg</p>
            <p><b>Average Body Weight:</b> {avgWeight.toFixed(3)} kg</p>
          </div>

          <div className="border border-slate-200 rounded p-3">
            <h2 className="font-bold text-sm text-slate-900 mb-2 border-b border-slate-300 pb-1">Uniformity Range</h2>
            <p><b>Lower Limit (-10%):</b> {minWeight.toFixed(3)} kg</p>
            <p><b>Upper Limit (+10%):</b> {maxWeight.toFixed(3)} kg</p>
            <p><b>Birds falling within range:</b> {birdsInRange} out of {totalBirds}</p>
          </div>

          <div className="border-2 border-emerald-700 bg-emerald-50 rounded p-4 text-center">
            <p className="text-xs uppercase font-bold text-emerald-900">Flock Uniformity Result</p>
            <p className="text-3xl font-black text-emerald-800 my-1">{uniformityPct.toFixed(1)}%</p>
            <p className="text-xs font-bold text-slate-700">Flock Status: {status.label}</p>
          </div>
        </div>
      </div>

    </div>
  );
}