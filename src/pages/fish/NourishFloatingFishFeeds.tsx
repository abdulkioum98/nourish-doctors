import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { loadCachedFirst } from '../../lib/offline';
import { ArrowLeft, Fish, Loader2, Package } from 'lucide-react';
import { hasFeedImage } from '../../lib/feedImage';

export interface FloatingFishFeedItem {
  id: string;
  feed_name: string;
  species?: string;
  category?: string;
  coating?: 'oil' | 'semi' | 'non' | 'catfish' | string;
  moisture_max_pct?: number;
  protein_min_pct?: number;
  fat_min_pct?: number;
  fiber_max_pct?: number;
  feed_size?: string;
  bag_size_kg?: number;
  price?: number;
  sort_order?: number;
  bag_image_url?: string;
  sample_image_url?: string;
}

interface NourishFloatingFishFeedsProps {
  onBack: () => void;
}

// Coating labels for the card spec row.
const coatingLabel = (coating: string | undefined): string => {
  if (coating === 'oil') return 'Oil Coated';
  if (coating === 'non') return 'Non Coated';
  if (coating === 'semi') return 'Semi Coated';
  if (coating === 'catfish') return 'Catfish';
  return coating || '-';
};

export default function NourishFloatingFishFeeds({ onBack }: NourishFloatingFishFeedsProps) {
  const [feeds, setFeeds] = useState<FloatingFishFeedItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'common' | 'pangas' | 'tilapia' | 'koi' | 'carp' | 'catfish'>('all');
  const [coatingFilter, setCoatingFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch floating_fish_feeds data from Supabase (cache-first: renders
  // from IndexedDB instantly, refreshes from network in the background).
  // READ-ONLY here — the Admin page manages this table.
  const fetchFeeds = async () => {
    setLoading(true);
    await loadCachedFirst<FloatingFishFeedItem[]>(
      'floating_fish_feeds:all',
      async () => {
        const { data, error } = await supabase
          .from('floating_fish_feeds')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) {
          console.error('Error fetching floating fish feeds:', error);
          return [];
        }
        return data || [];
      },
      (rows) => setFeeds(rows),
      () => setLoading(false),
    );
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  // Tab filter: by the row's category; a feed with no category shows
  // in every tab (same rule as the cattle page). The coating select
  // then filters the category-filtered list.
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setCoatingFilter('');
  };

  const visibleFeeds = feeds.filter((f) => {
    if (activeTab !== 'all') {
      const cat = (f.category || '').toLowerCase();
      if (cat && cat !== activeTab) return false;
    }
    if (coatingFilter && (f.coating || '').toLowerCase() !== coatingFilter) return false;
    return true;
  });

  // The booklet has no prices — show the price only when Admin set one.
  const hasPrice = (feed: FloatingFishFeedItem) =>
    feed.price != null && Number(feed.price) > 0;

  // Screenshot sequence: sort_order ascending, rows without one last,
  // so even a stale offline cache lists in the screenshot order.
  const sortedVisibleFeeds = [...visibleFeeds].sort((a, b) => {
    if (a.sort_order == null && b.sort_order == null) return 0;
    if (a.sort_order == null) return 1;
    if (b.sort_order == null) return -1;
    return a.sort_order - b.sort_order;
  });

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-3">
        <div className="flex items-center space-x-2">
          <Fish className="text-cyan-700" size={22} />
          <h2 className="text-lg font-bold text-cyan-800">Nourish Floating Fish Feeds</h2>
        </div>
        <button
          onClick={onBack}
          className="text-xs text-cyan-700 font-semibold flex items-center space-x-1 bg-cyan-50 px-2.5 py-1.5 rounded-lg hover:bg-cyan-100 transition"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      {/* Category filter — individual cards (label + item count) */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
        {(
          [
            { key: 'all', label: 'All Feeds' },
            { key: 'common', label: 'Common' },
            { key: 'pangas', label: 'Pangas' },
            { key: 'tilapia', label: 'Tilapia' },
            { key: 'koi', label: 'Koi' },
            { key: 'carp', label: 'Carp' },
            { key: 'catfish', label: 'Catfish' },
          ] as const
        ).map((c) => {
          const count =
            c.key === 'all'
              ? feeds.length
              : feeds.filter((f) => {
                  const cat = (f.category || '').toLowerCase();
                  return !cat || cat === c.key;
                }).length;
          const isActive = activeTab === c.key;
          return (
            <button
              key={c.key}
              onClick={() => handleTabChange(c.key)}
              className={`rounded-xl px-1 py-1.5 sm:py-2 text-center transition border ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 border-cyan-700 text-white shadow-md scale-[1.03]'
                  : 'bg-cyan-50 border-cyan-200 text-cyan-800 hover:bg-cyan-100'
              }`}
            >
              <span className="block text-[11px] sm:text-xs font-bold leading-tight">{c.label}</span>
              <span className={`block text-[9px] sm:text-[10px] leading-tight ${isActive ? 'text-cyan-100' : 'text-cyan-600/70'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Extra filter: coating */}
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-semibold text-slate-500">Coating</label>
        <select
          value={coatingFilter}
          onChange={(e) => setCoatingFilter(e.target.value)}
          className="border p-1.5 rounded-lg bg-white text-xs font-semibold text-slate-700 w-full sm:w-48"
        >
          <option value="">All Coatings</option>
          <option value="oil">Oil Coated</option>
          <option value="non">Non Coated</option>
          <option value="semi">Semi Coated</option>
        </select>
      </div>

      {/* Feed cards */}
      <div className="pt-2">
        <h3 className="text-base font-bold text-cyan-800 mb-3">
          Nourish Floating Fish Feeds
        </h3>
        {visibleFeeds.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">
            No feeds available in this section.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedVisibleFeeds.map((feed) => {
              // Bag + sample photos from the database row (admin-uploaded;
              // no static fallback for fish feeds).
              const bagImage = hasFeedImage(feed.bag_image_url)
                ? feed.bag_image_url
                : undefined;
              const sampleImage = hasFeedImage(feed.sample_image_url)
                ? feed.sample_image_url
                : undefined;
              return (
                <article
                  key={feed.id}
                  className="bg-white rounded-2xl shadow-sm border border-cyan-100 overflow-hidden flex flex-col"
                >
                  <div className="bg-cyan-50/70 flex h-44">
                    {bagImage ? (
                      <div className={`flex items-center justify-center p-3 ${sampleImage ? 'flex-1 border-r border-cyan-100' : 'w-full'}`}>
                        <img
                          src={bagImage}
                          alt={`${feed.feed_name} bag`}
                          className="max-h-full max-w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    {sampleImage ? (
                      <div className={`flex items-center justify-center p-3 ${bagImage ? 'flex-1' : 'w-full'}`}>
                        <img
                          src={sampleImage}
                          alt={`${feed.feed_name} feed`}
                          className="max-h-full max-w-full object-contain rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    {!bagImage && !sampleImage ? (
                      <div className="w-full flex flex-col items-center justify-center gap-2 text-cyan-300">
                        <Package size={48} />
                        <span className="text-xs font-semibold">No photo</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Name with the per-kg price beside it (like Cattle / Poultry),
                        and the bag price for the row's standard bag size just below it */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-bold text-cyan-800 leading-tight">
                        {feed.feed_name}
                      </h4>
                      {hasPrice(feed) && (
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-base font-bold text-cyan-700 whitespace-nowrap">
                            ৳{Number(feed.price).toFixed(2)}
                            <span className="text-xs text-slate-400 font-semibold">/kg</span>
                          </span>
                          {feed.bag_size_kg != null && (
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              Bag size: {feed.bag_size_kg} kg : ৳{(Number(feed.price) * feed.bag_size_kg).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Focused boxes: Protein / Fat / Fiber */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-cyan-50 rounded-xl py-2 px-1">
                        <div className="text-[10px] uppercase tracking-wide text-cyan-700/70 font-bold">Protein (Min)</div>
                        <div className="text-sm font-bold text-cyan-900">{feed.protein_min_pct != null ? `${feed.protein_min_pct}%` : '-'}</div>
                      </div>
                      <div className="bg-cyan-50 rounded-xl py-2 px-1">
                        <div className="text-[10px] uppercase tracking-wide text-cyan-700/70 font-bold">Fat (Min)</div>
                        <div className="text-sm font-bold text-cyan-900">{feed.fat_min_pct != null ? `${feed.fat_min_pct}%` : '-'}</div>
                      </div>
                      <div className="bg-cyan-50 rounded-xl py-2 px-1">
                        <div className="text-[10px] uppercase tracking-wide text-cyan-700/70 font-bold">Fiber (Max)</div>
                        <div className="text-sm font-bold text-cyan-900">{feed.fiber_max_pct != null ? `${feed.fiber_max_pct}%` : '-'}</div>
                      </div>
                    </div>
                    <div>
                      {[
                        ['Moisture (Max)', feed.moisture_max_pct != null ? `${feed.moisture_max_pct}%` : '-'],
                        ['Protein (Min)', feed.protein_min_pct != null ? `${feed.protein_min_pct}%` : '-'],
                        ['Fat (Min)', feed.fat_min_pct != null ? `${feed.fat_min_pct}%` : '-'],
                        ['Fiber (Max)', feed.fiber_max_pct != null ? `${feed.fiber_max_pct}%` : '-'],
                        ['Feed Size', feed.feed_size || '-'],
                        ['Bag Size (kg)', feed.bag_size_kg != null ? `${feed.bag_size_kg} kg` : '-'],
                        ['Species', feed.species || '-'],
                        ['Coating', coatingLabel(feed.coating)],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-baseline justify-between gap-2 py-1 border-b border-cyan-50 last:border-0"
                        >
                          <span className="text-[11px] text-slate-500">{label}</span>
                          <span className="text-xs font-semibold text-slate-700 text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {loading && feeds.length === 0 && (
          <div className="p-6 flex justify-center items-center text-cyan-700 space-x-2">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-xs font-semibold">Loading feeds from Supabase...</span>
          </div>
        )}
      </div>

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
