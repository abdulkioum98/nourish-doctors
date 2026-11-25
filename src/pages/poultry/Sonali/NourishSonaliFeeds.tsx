import React from 'react';
import { Package } from 'lucide-react';
import { SONALI_FEEDS } from '../../../lib/feedDetails';

// Sonali feeds — specification and photos from the Nourish product file
// (no own Supabase table; Sonali Standard / vaccination read the broiler
// tables, but the feeds are a fixed product list).
export default function NourishSonaliFeeds() {
  const spec = (label: string, value: string, suffix = '') => (
    <div className="flex items-baseline justify-between gap-2 py-1 border-b border-amber-50 last:border-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-700 text-right">
        {value}
        {suffix}
      </span>
    </div>
  );

  return (
    <div className="p-4 space-y-6 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-900 rounded-2xl p-2 text-white shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Nourish Sonali Feeds</h1>
        </div>
        <div className="bg-white/10 p-3 rounded-xl">
          <Package size={28} className="text-white" />
        </div>
      </div>

      {/* Feed Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SONALI_FEEDS.map((feed) => (
          <article
            key={feed.name}
            className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden flex flex-col"
          >
            {/* Feed photo */}
            <div className="bg-amber-50/70 flex items-center justify-center h-52 p-3">
              <img
                src={feed.image}
                alt={feed.name}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            </div>

            <div className="p-4 flex flex-col gap-3 flex-1">
              <h2 className="text-base font-bold text-amber-800 leading-tight">
                {feed.name}
              </h2>

              {/* Key figures */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-amber-50 rounded-xl py-2 px-1">
                  <div className="text-[10px] uppercase tracking-wide text-amber-700/70 font-bold">Protein</div>
                  <div className="text-sm font-bold text-amber-900">{feed.cp}%</div>
                </div>
                <div className="bg-amber-50 rounded-xl py-2 px-1">
                  <div className="text-[10px] uppercase tracking-wide text-amber-700/70 font-bold">Energy</div>
                  <div className="text-sm font-bold text-amber-900">{feed.energy}</div>
                </div>
                <div className="bg-amber-50 rounded-xl py-2 px-1">
                  <div className="text-[10px] uppercase tracking-wide text-amber-700/70 font-bold">Form</div>
                  <div className="text-sm font-bold text-amber-900">{feed.form}</div>
                </div>
              </div>

              {/* Full specification */}
              <div>
                {spec('Moisture', feed.moisture, '%')}
                {spec('Fiber', feed.fiber, '%')}
                {spec('Calcium', feed.calcium, '%')}
                {spec('Phosphorus', feed.phosphorus, '%')}
                {spec('Methionine', feed.methionine, '%')}
                {spec('Lysine', feed.lysine, '%')}
                {spec('Feeding Duration', feed.duration)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
