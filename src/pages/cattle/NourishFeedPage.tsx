import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { loadCachedFirst } from '../../lib/offline';
import { ArrowLeft, Wheat, Loader2, Package } from 'lucide-react';
import {
  CATTLE_PRODUCTS,
  CALF_FEED_REQUIREMENT,
  CALF_FEED_NOTE,
  type CattleProduct,
} from '../../lib/feedDetails';

export interface FeedItem {
  id: string;
  name: string;
  price?: number;
  tp_per_kg?: number;
  price_per_kg?: number;
  dm?: number;
  cp?: number;
  me?: number;
  category?: 'dairy' | 'fattening' | string;
}

interface NourishFeedPageProps {
  onBack: () => void;
}

// Normalised name matching: lowercase, strip non-alphanumerics; two names
// match when one contains the other, so "Nourish Prime Dairy" in the
// database still finds the "Prime Dairy" product card.
const normName = (s: string): string =>
  (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const namesMatch = (a: string, b: string): boolean => {
  const na = normName(a);
  const nb = normName(b);
  return !!na && !!nb && (na.includes(nb) || nb.includes(na));
};

// The 3 focused boxes on a product card: DM, CP, Energy (ME). When one of
// them is missing (no database row for this product), the box takes the
// next available value (TDN, crude fat, moisture, ...), so the card
// always shows 3 figures.
const productKeyFigures = (
  product: CattleProduct,
  db: FeedItem | undefined,
): Array<{ label: string; value: string }> => {
  const figures: Array<{ label: string; value: string }> = [];
  if (db?.dm != null) figures.push({ label: 'DM', value: `${db.dm}%` });
  figures.push({ label: 'CP', value: product.cp });
  if (db?.me != null) figures.push({ label: 'Energy (MJ)', value: `${db.me}` });
  figures.push({ label: 'TDN', value: product.tdn });
  figures.push({ label: 'Crude Fat', value: product.fat });
  figures.push({ label: 'Moisture', value: product.moisture });
  figures.push({ label: 'Crude Fiber', value: product.fiber });
  return figures.slice(0, 3);
};

export default function NourishFeedPage({ onBack }: NourishFeedPageProps) {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'dairy' | 'fattening'>('all');
  const [loading, setLoading] = useState(true);

  // Fetch nourish_feeds data from Supabase (cache-first: renders from
  // IndexedDB instantly, refreshes from network in the background).
  // READ-ONLY here — the calculator reads this same table, so nothing
  // below writes to it or changes its values.
  const fetchFeeds = async () => {
    setLoading(true);
    await loadCachedFirst<FeedItem[]>(
      'nourish_feeds:all',
      async () => {
        const { data, error } = await supabase
          .from('nourish_feeds')
          .select('*')
          .order('id', { ascending: true });
        if (error) {
          console.error('Error fetching nourish feeds:', error);
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

  // Helper function to safely get price value
  const getPrice = (feed: FeedItem) => {
    const val = feed.price ?? feed.tp_per_kg ?? feed.price_per_kg ?? 0;
    return Number(val).toFixed(2);
  };

  // The database row for a product card (by name), if the product is in
  // nourish_feeds. Its DM / ME / price are what the calculator uses.
  const dbFeedForProduct = (productName: string) =>
    feeds.find((f) => namesMatch(f.name, productName));

  // Database feeds with no product card of their own. They still belong
  // on this page, below the products, so no data from the old top table
  // is lost now that the table is gone.
  const dbOnlyFeeds = feeds.filter(
    (f) => !CATTLE_PRODUCTS.some((p) => namesMatch(f.name, p.name)),
  );

  // Tab filter: a product uses its database row's category when it has
  // one; a feed with no category shows in every tab (as before).
  const tabMatches = (category: string | undefined) => {
    if (activeTab === 'all') return true;
    if (!category) return true;
    return category.toLowerCase() === activeTab;
  };

  const visibleProducts = CATTLE_PRODUCTS.filter((p) =>
    tabMatches(dbFeedForProduct(p.name)?.category),
  );
  const visibleDbOnly = dbOnlyFeeds.filter((f) => tabMatches(f.category));

  // Total items on the page: every product card plus every database feed
  // that has no product card.
  const totalCount = CATTLE_PRODUCTS.length + dbOnlyFeeds.length;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-3">
        <div className="flex items-center space-x-2">
          <Wheat className="text-emerald-700" size={22} />
          <h2 className="text-lg font-bold text-emerald-800">Nourish Feeds Reference</h2>
        </div>
        <button
          onClick={onBack}
          className="text-xs text-emerald-700 font-semibold flex items-center space-x-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      {/* Segment Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-bold">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1.5 rounded-md transition ${
            activeTab === 'all' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Feeds ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab('dairy')}
          className={`flex-1 py-1.5 rounded-md transition ${
            activeTab === 'dairy' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Dairy
        </button>
        <button
          onClick={() => setActiveTab('fattening')}
          className={`flex-1 py-1.5 rounded-md transition ${
            activeTab === 'fattening' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Fattening
        </button>
      </div>

      {/* One combined section: the product cards, enriched with the
          database values the calculator uses (DM / ME / price), plus any
          database feed that has no product card of its own. The old top
          table is gone; nothing from it is lost — every one of its rows
          is here, either on its product card or as its own card. */}
      <div className="pt-2">
        <h3 className="text-base font-bold text-emerald-800 mb-3">
          Nourish Cattle Feeds
        </h3>
        {visibleProducts.length === 0 && visibleDbOnly.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">
            No feeds available in this section.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleProducts.map((product) => {
              const db = dbFeedForProduct(product.name);
              const figures = productKeyFigures(product, db);
              return (
                <article
                  key={product.name}
                  className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex flex-col"
                >
                  <div className="bg-emerald-50/70 flex items-center justify-center h-44 p-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Name with the price beside it (like Broiler / Layer) */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-bold text-emerald-800 leading-tight">
                        {product.name}
                      </h4>
                      {db && (
                        <span className="text-base font-bold text-emerald-700 whitespace-nowrap shrink-0">
                          ৳{getPrice(db)}
                        </span>
                      )}
                    </div>
                    {/* Focused boxes: DM / CP / Energy, falling back to
                        whatever the card has when one is missing. */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {figures.map((fig) => (
                        <div key={fig.label} className="bg-emerald-50 rounded-xl py-2 px-1">
                          <div className="text-[10px] uppercase tracking-wide text-emerald-700/70 font-bold">{fig.label}</div>
                          <div className="text-sm font-bold text-emerald-900">{fig.value}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      {[
                        ['Moisture (Max)', product.moisture],
                        ['Crude Fiber', product.fiber],
                        ['Calcium (Min)', product.calcium],
                        ['Phosphorus (Min)', product.phosphorus],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-baseline justify-between gap-2 py-1 border-b border-emerald-50 last:border-0"
                        >
                          <span className="text-[11px] text-slate-500">{label}</span>
                          <span className="text-xs font-semibold text-slate-700">{value}</span>
                        </div>
                      ))}
                    </div>
                    {/* Calf Feed daily amount by age — inside the Calf Feed
                        card itself (from the product file). */}
                    {product.name === 'Calf Feed' && (
                      <div className="border-t border-emerald-100 pt-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Package size={14} className="text-emerald-700" />
                          <h5 className="text-xs font-bold text-emerald-800">
                            Calf Feed Requirement
                          </h5>
                        </div>
                        <table className="w-full text-left text-xs">
                          <thead className="bg-emerald-50 text-emerald-900 uppercase font-bold">
                            <tr>
                              <th className="py-1.5 px-2">Age</th>
                              <th className="py-1.5 px-2 text-right">Amount / day</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {CALF_FEED_REQUIREMENT.map((row) => (
                              <tr key={row.age} className="hover:bg-emerald-50/40 transition">
                                <td className="py-1.5 px-2 font-semibold text-gray-800">{row.age}</td>
                                <td className="py-1.5 px-2 text-right font-semibold text-gray-700">{row.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-[11px] text-slate-500 mt-2">
                          N.B. — {CALF_FEED_NOTE}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
            {/* Database feeds with no product card — shown as their own
                cards, so the old top table loses nothing. */}
            {visibleDbOnly.map((feed) => (
              <article
                key={feed.id || feed.name}
                className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex flex-col"
              >
                <div className="bg-emerald-50/70 flex items-center justify-center h-44 p-3">
                  <div className="flex flex-col items-center gap-2 text-emerald-300">
                    <Package size={48} />
                    <span className="text-xs font-semibold">No photo</span>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Name with the price beside it (like Broiler / Layer) */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-emerald-800 leading-tight">
                      {feed.name}
                    </h4>
                    <span className="text-base font-bold text-emerald-700 whitespace-nowrap shrink-0">
                      ৳{getPrice(feed)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-emerald-50 rounded-xl py-2 px-1">
                      <div className="text-[10px] uppercase tracking-wide text-emerald-700/70 font-bold">DM</div>
                      <div className="text-sm font-bold text-emerald-900">{feed.dm != null ? `${feed.dm}%` : '-'}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl py-2 px-1">
                      <div className="text-[10px] uppercase tracking-wide text-emerald-700/70 font-bold">CP</div>
                      <div className="text-sm font-bold text-emerald-900">{feed.cp != null ? `${feed.cp}%` : '-'}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl py-2 px-1">
                      <div className="text-[10px] uppercase tracking-wide text-emerald-700/70 font-bold">Energy (MJ)</div>
                      <div className="text-sm font-bold text-emerald-900">{feed.me != null ? feed.me : '-'}</div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {loading && feeds.length === 0 && (
          <div className="p-6 flex justify-center items-center text-emerald-700 space-x-2">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-xs font-semibold">Loading feeds from Supabase...</span>
          </div>
        )}
      </div>

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
