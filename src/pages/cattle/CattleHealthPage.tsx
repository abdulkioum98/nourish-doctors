import React, { useState } from 'react';
import {
  ArrowLeft,
  HeartPulse,
  Gauge,
  CircleDot,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  BCS_SCALE_IMAGE,
  BCS_SCORES,
  BCS_TARGETS,
  BCS_WARNING,
  DUNG_SCALE_IMAGE,
  DUNG_SCORES,
  DUNG_KEY_POINTS,
  METABOLIC_DISEASES,
  INFECTIOUS_DISEASES,
  type Disease,
} from '../../lib/cattleHealth';

type HealthTab = 'bcs' | 'dung' | 'disease';

interface CattleHealthPageProps {
  onBack: () => void;
}

// Score status colours (shared by BCS and Dung cards).
const STATUS_STYLE: Record<string, string> = {
  danger: 'bg-red-100 text-red-700',
  low: 'bg-amber-100 text-amber-700',
  ideal: 'bg-emerald-100 text-emerald-700',
  high: 'bg-orange-100 text-orange-700',
};

const TABS: Array<{
  id: HealthTab;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}> = [
  { id: 'bcs', label: 'BCS Score', icon: Gauge },
  { id: 'dung', label: 'Dung Score', icon: CircleDot },
  { id: 'disease', label: 'Diseases', icon: HeartPulse },
];

function DiseaseCard({ disease }: { disease: Disease }) {
  // One accent colour per type. No icons in the cards — the photo
  // (when there is one) or a gradient cover with the first letter
  // carries the visual, the type pill carries the label.
  const accent =
    disease.type === 'Viral'
      ? {
          gradient: 'from-violet-500 to-violet-700',
          pill: 'bg-violet-100 text-violet-700',
        }
      : disease.type === 'Bacterial'
        ? {
            gradient: 'from-rose-500 to-rose-700',
            pill: 'bg-rose-100 text-rose-700',
          }
        : {
            gradient: 'from-amber-500 to-amber-600',
            pill: 'bg-amber-100 text-amber-700',
          };
  return (
    <article className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col">
      {disease.image ? (
        <img
          src={disease.image}
          alt={disease.name}
          className="w-full h-40 object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className={`h-24 bg-gradient-to-br ${accent.gradient} flex items-center justify-center`}
        >
          <span className="text-white/25 text-6xl font-black leading-none select-none">
            {disease.name.charAt(0)}
          </span>
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-base font-bold text-emerald-900 leading-tight">
            {disease.name}
          </h4>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${accent.pill}`}
          >
            {disease.type}
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-800">{disease.cause}</span>
          <span className="text-slate-400 mx-1">•</span>
          {disease.signs}
        </p>
      </div>
    </article>
  );
}

export default function CattleHealthPage({ onBack }: CattleHealthPageProps) {
  const [tab, setTab] = useState<HealthTab>('bcs');
  const [diseaseTab, setDiseaseTab] = useState<'metabolic' | 'infectious'>(
    'metabolic',
  );

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-3">
        <div className="flex items-center space-x-2">
          <HeartPulse className="text-emerald-700" size={22} />
          <h2 className="text-lg font-bold text-emerald-800">Cattle Health</h2>
        </div>
        <button
          onClick={onBack}
          className="text-xs text-emerald-700 font-semibold flex items-center space-x-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      {/* Modern 3-way selector — tap a tile to see that section */}
      <div className="grid grid-cols-3 gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-2xl px-2 py-3 flex flex-col items-center gap-1 transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/30 scale-[1.03]'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100'
              }`}
            >
              <span
                className={`p-2 rounded-full ${
                  active ? 'bg-white/20' : 'bg-white'
                }`}
              >
                <Icon size={22} />
              </span>
              <span className="text-xs font-bold leading-tight text-center">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------------- BCS Score ---------------- */}
      {tab === 'bcs' && (
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-emerald-100">
            <img
              src={BCS_SCALE_IMAGE}
              alt="Body Condition Score scale 1 to 5"
              className="w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-emerald-800">
              Target BCS by stage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {BCS_TARGETS.map((t) => (
                <div
                  key={t.stage}
                  className="flex items-baseline justify-between gap-2 text-xs"
                >
                  <span className="text-slate-600">{t.stage}</span>
                  <span className="font-bold text-emerald-900">{t.range}</span>
                </div>
              ))}
            </div>
            <p className="flex gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{BCS_WARNING}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BCS_SCORES.map((s) => (
              <article
                key={s.score}
                className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex flex-col"
              >
                <div className="relative">
                  <img
                    src={s.image}
                    alt={`BCS ${s.score} — ${s.label}`}
                    className="w-full h-44 object-cover"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    Score {s.score}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-emerald-800">
                      {s.label}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status]}`}
                    >
                      {s.status === 'ideal'
                        ? 'Target'
                        : s.status === 'danger'
                          ? 'Act now'
                          : 'Watch'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Cow Dung Score ---------------- */}
      {tab === 'dung' && (
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-emerald-100">
            <img
              src={DUNG_SCALE_IMAGE}
              alt="Cow Dung Score scale 1 to 5"
              className="w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-700" />
              Key points
            </h3>
            <ul className="space-y-1">
              {DUNG_KEY_POINTS.map((point) => (
                <li key={point} className="text-xs text-slate-600 leading-relaxed">
                  • {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DUNG_SCORES.map((s) => (
              <article
                key={s.score}
                className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex flex-col"
              >
                <div className="relative">
                  <img
                    src={s.image}
                    alt={`Dung Score ${s.score} — ${s.label}`}
                    className="w-full h-44 object-cover"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    Score {s.score}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-emerald-800">
                      {s.label}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status]}`}
                    >
                      {s.status === 'ideal'
                        ? 'Ideal'
                        : s.status === 'danger'
                          ? 'Act now'
                          : 'Watch'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Diseases ---------------- */}
      {tab === 'disease' && (
        <div className="space-y-3">
          {/* Sub-switcher: Metabolic / Infectious */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-emerald-50 border border-emerald-100">
            <button
              onClick={() => setDiseaseTab('metabolic')}
              className={`rounded-xl px-2 py-2.5 flex items-center justify-center gap-1.5 transition-all ${
                diseaseTab === 'metabolic'
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25'
                  : 'text-amber-800 hover:bg-amber-100/70'
              }`}
            >
              <span className="text-xs font-bold">Metabolic</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  diseaseTab === 'metabolic'
                    ? 'bg-white/25 text-white'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {METABOLIC_DISEASES.length}
              </span>
            </button>
            <button
              onClick={() => setDiseaseTab('infectious')}
              className={`rounded-xl px-2 py-2.5 flex items-center justify-center gap-1.5 transition-all ${
                diseaseTab === 'infectious'
                  ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/25'
                  : 'text-rose-800 hover:bg-rose-100/70'
              }`}
            >
              <span className="text-xs font-bold">Infectious</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  diseaseTab === 'infectious'
                    ? 'bg-white/25 text-white'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {INFECTIOUS_DISEASES.length}
              </span>
            </button>
          </div>
          <p className="text-xs text-slate-500 px-1">
            {diseaseTab === 'metabolic'
              ? 'Caused by nutrient imbalance, mostly around calving — from the Nourish metabolic diseases guide.'
              : 'Spread by germs — virus or bacteria. Confirm with a veterinarian before treatment.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(diseaseTab === 'metabolic'
              ? METABOLIC_DISEASES
              : INFECTIOUS_DISEASES
            ).map((d) => (
              <DiseaseCard key={d.name} disease={d} />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="w-full bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-xs hover:bg-emerald-800 transition flex items-center justify-center space-x-1.5 mt-2 shadow-sm"
      >
        <ArrowLeft size={14} />
        <span>Back to Main Menu</span>
      </button>
    </div>
  );
}
