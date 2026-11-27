import React, { useState } from 'react';
import {
  ArrowLeft,
  Fish,
  Layers,
  Droplets,
  Sprout,
  FlaskConical,
} from 'lucide-react';
import {
  FEEDING_RATES,
  STOCKING_DENSITY,
  WATER_QUALITY,
  NURSERY_FEEDING,
  STOCKING_FEEDING,
  LIME_DOSE,
  FERTILIZER_DOSE,
} from '../../lib/aquaGuide';

export type GuideTopic =
  | 'feeding-rate'
  | 'stocking-density'
  | 'water-quality'
  | 'nursery-feeding'
  | 'pond-prep';

interface AquaGuidePageProps {
  onBack: () => void;
  topic?: GuideTopic;
}

const TILES: Array<{
  id: GuideTopic;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}> = [
  { id: 'feeding-rate', label: 'Feeding Rate', icon: Fish },
  { id: 'stocking-density', label: 'Stocking Density', icon: Layers },
  { id: 'water-quality', label: 'Water Quality', icon: Droplets },
  { id: 'nursery-feeding', label: 'Nursery Feeding', icon: Sprout },
  { id: 'pond-prep', label: 'Pond Preparation', icon: FlaskConical },
];

// Small reference table — cyan header row, alternating row shading,
// horizontal scroll on a phone so wide tables never break the layout.
function GuideTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="rounded-2xl overflow-x-auto border border-cyan-100">
      <table className="w-full text-left text-xs">
        <thead className="bg-cyan-50 text-cyan-900 uppercase font-bold">
          <tr>
            {headers.map((h) => (
              <th key={h} className="py-1.5 px-2 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 0 ? 'bg-cyan-50/40' : 'bg-white'}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`py-1.5 px-2 whitespace-nowrap ${
                    j === 0 ? 'font-semibold text-gray-800' : 'text-gray-700'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-cyan-800 px-1">{children}</h3>
  );
}

export default function AquaGuidePage({
  onBack,
  topic = 'feeding-rate',
}: AquaGuidePageProps) {
  const [tab, setTab] = useState<GuideTopic>(topic);
  const [species, setSpecies] = useState<string>('tilapia');
  const activeSpecies =
    FEEDING_RATES.find((s) => s.id === species) || FEEDING_RATES[0];

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-3">
        <div className="flex items-center space-x-2">
          <Fish className="text-cyan-700" size={22} />
          <h2 className="text-lg font-bold text-cyan-800">Aqua Guide</h2>
        </div>
        <button
          onClick={onBack}
          className="text-xs text-cyan-700 font-semibold flex items-center space-x-1 bg-cyan-50 px-2.5 py-1.5 rounded-lg hover:bg-cyan-100 transition"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      {/* 5-way tile selector — tap a tile to see that section */}
      <div className="grid grid-cols-5 gap-1.5">
        {TILES.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-2xl px-1 py-3 flex flex-col items-center gap-1 transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/30 scale-[1.03]'
                  : 'bg-cyan-50 text-cyan-800 border border-cyan-100 hover:bg-cyan-100'
              }`}
            >
              <span
                className={`p-2 rounded-full ${
                  active ? 'bg-white/20' : 'bg-white'
                }`}
              >
                <Icon size={20} />
              </span>
              <span className="text-[10px] sm:text-xs font-bold leading-tight text-center">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------------- Feeding Rate ---------------- */}
      {tab === 'feeding-rate' && (
        <div className="space-y-3">
          {/* Species sub-switcher */}
          <div className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl bg-cyan-50 border border-cyan-100">
            {FEEDING_RATES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSpecies(s.id)}
                className={`rounded-xl px-1 py-2 flex items-center justify-center gap-1 transition-all ${
                  species === s.id
                    ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-md shadow-cyan-600/25'
                    : 'text-cyan-800 hover:bg-cyan-100/70'
                }`}
              >
                <span className="text-xs font-bold truncate">{s.name}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    species === s.id
                      ? 'bg-white/25 text-white'
                      : 'bg-cyan-100 text-cyan-700'
                  }`}
                >
                  {s.rows.length}
                </span>
              </button>
            ))}
          </div>
          <GuideTable
            headers={[
              'Feed',
              'Feed Size',
              'Fish Weight',
              'Feeding Rate',
              'Daily',
            ]}
            rows={activeSpecies.rows.map((r) => [
              r.feed,
              r.size,
              r.weight,
              r.rate,
              r.times,
            ])}
          />
          <p className="text-xs text-slate-500 px-1">
            Feeding rate is a % of body weight. Reduce the rate on cloudy
            days, in the rain, or in very hot weather.
          </p>
        </div>
      )}

      {/* ---------------- Stocking Density ---------------- */}
      {tab === 'stocking-density' && (
        <div className="space-y-3">
          <GuideTable
            headers={[
              'Species',
              'Weight',
              'Single Culture',
              'Mixed Culture',
            ]}
            rows={STOCKING_DENSITY.map((r) => [
              r.species,
              r.weight,
              r.single,
              r.mixed,
            ])}
          />
          <p className="text-xs text-slate-500 px-1">
            Number of fish per decimal (semi-intensive culture).
          </p>
        </div>
      )}

      {/* ---------------- Water Quality ---------------- */}
      {tab === 'water-quality' && (
        <div className="space-y-3">
          <GuideTable
            headers={['Parameter', 'Ideal Level']}
            rows={WATER_QUALITY.map((r) => [r.parameter, r.ideal])}
          />
          <p className="text-xs text-slate-500 px-1">
            Source: Haque et al. 2020, Aquaculture Science.
          </p>
        </div>
      )}

      {/* ---------------- Nursery Feeding ---------------- */}
      {tab === 'nursery-feeding' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <SectionTitle>Nursery Pond Feeding (Catfish)</SectionTitle>
            <GuideTable
              headers={[
                'Age',
                'Avg Weight',
                'Feeding Rate',
                'Feed',
                'Daily',
              ]}
              rows={NURSERY_FEEDING.map((r) => [
                r.age,
                r.weight,
                r.rate,
                r.feed,
                r.times,
              ])}
            />
          </div>
          <div className="space-y-2">
            <SectionTitle>Stocking Pond Feeding (Catfish)</SectionTitle>
            <GuideTable
              headers={[
                'Age',
                'Avg Weight',
                'Feeding Rate',
                'Feed',
                'Daily',
              ]}
              rows={STOCKING_FEEDING.map((r) => [
                r.age,
                r.weight,
                r.rate,
                r.feed,
                r.times,
              ])}
            />
          </div>
          <p className="text-xs text-slate-500 px-1">
            Stocking pond: from transfer to 6-7 months (until sale).
          </p>
        </div>
      )}

      {/* ---------------- Pond Preparation ---------------- */}
      {tab === 'pond-prep' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <SectionTitle>Lime Dose (during pond preparation)</SectionTitle>
            <GuideTable
              headers={[
                'pH',
                'Pond Area',
                'Limestone (CaCO3)',
                'Burnt Lime (CaO)',
              ]}
              rows={LIME_DOSE.map((r) => [
                r.ph,
                r.area,
                r.limestone,
                r.burntLime,
              ])}
            />
            <p className="text-xs text-slate-500 px-1">
              Lime source: DoF, Bangladesh.
            </p>
          </div>
          <div className="space-y-2">
            <SectionTitle>Fertilizer Dose</SectionTitle>
            <GuideTable
              headers={[
                'Fertilizer',
                'During Preparation (per decimal)',
                'During Culture (per decimal)',
              ]}
              rows={FERTILIZER_DOSE.map((r) => [
                r.name,
                r.preparation,
                r.culture,
              ])}
            />
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="w-full bg-cyan-700 text-white font-medium py-2.5 rounded-lg text-xs hover:bg-cyan-800 transition flex items-center justify-center space-x-1.5 mt-2 shadow-sm"
      >
        <ArrowLeft size={14} />
        <span>Back to Main Menu</span>
      </button>
    </div>
  );
}
