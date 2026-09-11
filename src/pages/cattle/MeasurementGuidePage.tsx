import React from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

interface Props {
  onBack?: () => void;
}

export default function MeasurementGuidePage({ onBack }: Props) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      

      {/* Visual Anatomical Diagram */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-center">
        <h2 className="text-lg font-bold text-slate-800">Anatomical Measurement Points</h2>
        
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative overflow-hidden flex flex-col items-center justify-center min-h-[280px]">
          {/* Anatomical Cattle SVG Diagram */}
          <svg viewBox="0 0 520 280" className="w-full max-w-lg h-auto">
            <defs>
              <linearGradient id="cowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
            </defs>

            {/* Accurate Bovine Silhouette (Head Facing Left) */}
            <g id="cattle-body">
              {/* Main Body Path */}
              <path
                d="M 120,60 
                   C 100,50 85,60 70,85 
                   C 60,100 50,110 52,125 
                   C 55,135 70,140 85,135 
                   C 95,150 110,165 125,170 
                   C 135,172 145,170 148,185 
                   L 145,240 L 165,240 L 170,185 
                   C 185,185 195,185 200,240 
                   L 220,240 L 222,180 
                   C 260,182 320,180 360,175 
                   L 362,240 L 382,240 L 385,170 
                   C 395,170 405,170 410,240 
                   L 430,240 L 435,150 
                   C 440,120 435,90 415,80 
                   C 385,75 330,80 270,82 
                   C 220,80 180,72 150,75 
                   C 135,68 125,62 120,60 Z"
                fill="url(#cowGradient)"
                stroke="#334155"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Ears & Horn Details */}
              <path d="M 105,72 C 90,68 85,75 92,82 Z" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
              <path d="M 115,62 C 110,48 100,45 95,50" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

              {/* Eye & Muzzle */}
              <circle cx="82" cy="90" r="3" fill="#1e293b" />
              <path d="M 52,125 C 55,130 65,132 72,128" fill="none" stroke="#64748b" strokeWidth="1.5" />

              {/* Tail */}
              <path d="M 430,95 Q 445,130 442,180" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 440,175 Q 442,192 438,200 Q 445,192 444,175" fill="#334155" />
            </g>

            {/* POINT 1: Point of Shoulder */}
            <circle cx="130" cy="135" r="5" fill="#d97706" />
            <circle cx="130" cy="135" r="9" fill="none" stroke="#d97706" strokeWidth="1.5" />
            <text x="125" y="152" fill="#92400e" fontSize="9" fontWeight="800" textAnchor="end">Point of Shoulder</text>

            {/* POINT 2: Pin Bone (Tuber Ischii) */}
            <circle cx="420" cy="98" r="5" fill="#d97706" />
            <circle cx="420" cy="98" r="9" fill="none" stroke="#d97706" strokeWidth="1.5" />
            <text x="425" y="115" fill="#92400e" fontSize="9" fontWeight="800" textAnchor="start">Pin Bone</text>

            {/* MEASUREMENT 1: Heart Girth (G) */}
            {/* Positioned strictly behind front legs around chest barrel */}
            <ellipse cx="180" cy="130" rx="12" ry="50" fill="none" stroke="#059669" strokeWidth="3.5" strokeDasharray="6,4" />
            <line x1="180" y1="80" x2="180" y2="180" stroke="#059669" strokeWidth="1" strokeDasharray="2,2" />
            <text x="180" y="134" fill="#047857" fontWeight="800" fontSize="12" textAnchor="middle">
              Heart Girth (G)
            </text>

            {/* MEASUREMENT 2: Body Length (L) */}
            {/* Direct line from shoulder point to pin bone */}
            <line x1="130" y1="135" x2="420" y2="98" stroke="#d97706" strokeWidth="3.5" strokeDasharray="6,4" />
            <polygon points="130,135 140,132 139,140" fill="#d97706" />
            <polygon points="420,98 410,93 411,101" fill="#d97706" />
            <text x="270" y="108" fill="#b45309" fontWeight="800" fontSize="12" textAnchor="middle" transform="rotate(-7, 270, 108)">
              Body Length (L)
            </text>
          </svg>

          {/* Color Key Legend */}
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold mt-4">
            <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-3 py-1 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              Heart Girth (G): Chest circumference directly behind front elbows
            </span>
            <span className="flex items-center gap-1.5 text-amber-800 bg-amber-100/80 border border-amber-200 px-3 py-1 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              Body Length (L): Straight line from Shoulder Joint to Pin Bone
            </span>
          </div>
        </div>
      </div>

      {/* Step by Step Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-3 text-emerald-700 font-bold text-lg">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">1</div>
            <h3>Heart Girth (G)</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Pass the measuring tape around the body immediately behind the front legs and fore-elbows, wrapping around the chest cavity.
          </p>
          <ul className="text-xs text-slate-500 space-y-1.5 pl-2">
            <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> Ensure tape lies flat and perpendicular to the spine.</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> Pull snug without depressing soft skin tissue.</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> Note total measurement in inches.</li>
          </ul>
        </div>

        {/* Step 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-3 text-emerald-700 font-bold text-lg">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">2</div>
            <h3>Body Length (L)</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Measure in a straight line along the side of the animal from the Point of Shoulder to the prominent Point of Pin Bone.
          </p>
          <ul className="text-xs text-slate-500 space-y-1.5 pl-2">
            <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> Stand directly to the side for line-of-sight accuracy.</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> Keep measuring tape stretched taut along the body.</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> Note total measurement in inches.</li>
          </ul>
        </div>
      </div>

      {/* Precautions */}
      <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
        <h3 className="font-bold text-amber-900 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" /> Best Practices & Precision Factors
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>Animal must stand square on level ground with weight distributed across all four legs.</span>
          </div>
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>Head must be held in a natural forward position; turning or lowering the head skews length readings.</span>
          </div>
        </div>
      </div>
    </div>
  );
}