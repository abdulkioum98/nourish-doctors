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
import { hasFeedImage } from '../../lib/feedImage';

export interface FeedItem {
  id: string;
  name: string;
  price?: number;
  tp_per_kg?: number;
  price_per_kg?: number;
  bag_size_kg?: number;
  dm?: number;
  cp?: number;
  me?: number;
  category?: 'dairy' | 'fattening' | string;
  bag_image_url?: string;
  sample_image_url?: string;
  sort_order?: number;
  // Extra nutrients from the database (stored WITHOUT "%", e.g. "12"
  // or "65-70"). Shown on the card when present; the product (PPTX)
  // value is the fallback.
  moisture_max_pct?: string;
  crude_fiber_pct?: string;
  crude_fat_pct?: string;
  calcium_pct?: string;
  phosphorus_pct?: string;
  tdn_pct?: string;
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

// Format a nutrient value with "%". Database values are stored without
// it ("12", "65-70"); product values already carry it ("12%").
const pct = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  if (s === '') return '';
  return s.endsWith('%') ? s : `${s}%`;
};

// Database value wins; the product (PPTX) value is the fallback.
const nutrient = (
  dbVal: string | number | null | undefined,
  pptxVal: string | number | null | undefined,
): string => {
  const fromDb = pct(dbVal);
  return fromDb !== '' ? fromDb : pct(pptxVal);
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
  figures.push({ label: 'TDN', value: nutrient(db?.tdn_pct, product.tdn) });
  figures.push({ label: 'Crude Fat', value: nutrient(db?.crude_fat_pct, product.fat) });
  figures.push({ label: 'Moisture', value: nutrient(db?.moisture_max_pct, product.moisture) });
  figures.push({ label: 'Crude Fiber', value: nutrient(db?.crude_fiber_pct, product.fiber) });
  return figures.slice(0, 3);
};

export default function NourishFeedPage({ onBack }: NourishFeedPageProps) {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'dairy' | 'fattening'>('all');
  const [loading, setLoading] = useState(true);

  // Fetch cattle_feeds data from Supabase (cache-first: renders from
  // IndexedDB instantly, refreshes from network in the background).
  // READ-ONLY here — the calculator reads this same table, so nothing
  // below writes to it or changes its values.
  const fetchFeeds = async () => {
    setLoading(true);
    await loadCachedFirst<FeedItem[]>(
      'cattle_feeds:all',
      async () => {
        const { data, error } = await supabase
          .from('cattle_feeds')
          .select('*')
          .order('sort_order', { ascending: true });
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

  // Bag price: the per-kg price × the row's standard bag size.
  const bagPrice = (feed: FeedItem) =>
    (Number(feed.price ?? feed.tp_per_kg ?? feed.price_per_kg ?? 0) * (feed.bag_size_kg ?? 0)).toFixed(2);

  // The database row for a product card (by name), if the product is in
  // cattle_feeds. Its DM / ME / price are what the calculator uses.
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

  // One combined card list in the screenshot sequence (sort_order). A
  // product card uses its matched DB row's sort_order; a DB-only card
  // uses its own. Cards with no sort_order go last — products in the
  // static array order, then DB-only rows.
  const visibleCards = [
    ...visibleProducts.map((product) => ({
      kind: 'product' as const,
      product,
      order: dbFeedForProduct(product.name)?.sort_order ?? null,
    })),
    ...visibleDbOnly.map((feed) => ({
      kind: 'db' as const,
      feed,
      order: feed.sort_order ?? null,
    })),
  ].sort((a, b) => {
    if (a.order == null && b.order == null) return 0;
    if (a.order == null) return 1;
    if (b.order == null) return -1;
    return a.order - b.order;
  });

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
            {visibleCards.map((card) => {
              if (card.kind === 'product') {
                const product = card.product;
              const db = dbFeedForProduct(product.name);
              const figures = productKeyFigures(product, db);
              // Bag + sample photos: the admin-uploaded image wins when
              // present, else the static photo from the product file.
              const bagImage = hasFeedImage(db?.bag_image_url)
                ? db?.bag_image_url
                : product.image;
              const sampleImage = hasFeedImage(db?.sample_image_url)
                ? db?.sample_image_url
                : undefined;
              return (
                <article
                  key={product.name}
                  className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex flex-col"
                >
                  <div className="bg-emerald-50/70 flex h-44">
                    {bagImage ? (
                      <div className={`flex items-center justify-center p-3 ${sampleImage ? 'flex-1 border-r border-emerald-100' : 'w-full'}`}>
                        <img
                          src={bagImage}
                          alt={`${product.name} bag`}
                          className="max-h-full max-w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    {sampleImage ? (
                      <div className={`flex items-center justify-center p-3 ${bagImage ? 'flex-1' : 'w-full'}`}>
                        <img
                          src={sampleImage}
                          alt={`${product.name} feed`}
                          className="max-h-full max-w-full object-contain rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    {!bagImage && !sampleImage ? (
                      <div className="w-full flex flex-col items-center justify-center gap-2 text-emerald-300">
                        <Package size={48} />
                        <span className="text-xs font-semibold">No photo</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Name with the per-kg price beside it (like Broiler / Layer),
                        and the bag price for the row's standard bag size just below it */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-bold text-emerald-800 leading-tight">
                        {product.name}
                      </h4>
                      {db && (
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-base font-bold text-emerald-700 whitespace-nowrap">
                            ৳{getPrice(db)}
                            <span className="text-xs text-slate-400 font-semibold">/kg</span>
                          </span>
                          {Number(getPrice(db)) > 0 && db.bag_size_kg != null && (
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              Bag size: {db.bag_size_kg} kg : ৳{bagPrice(db)}
                            </span>
                          )}
                        </div>
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
                        ['Moisture (Max)', nutrient(db?.moisture_max_pct, product.moisture)],
                        ['Crude Fiber', nutrient(db?.crude_fiber_pct, product.fiber)],
                        ['Crude Fat', nutrient(db?.crude_fat_pct, product.fat)],
                        ['Calcium (Min)', nutrient(db?.calcium_pct, product.calcium)],
                        ['Phosphorus (Min)', nutrient(db?.phosphorus_pct, product.phosphorus)],
                        ['TDN', nutrient(db?.tdn_pct, product.tdn)],
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
            }
            // Database feeds with no product card — shown as their own
            // cards, so the old top table loses nothing.
            const feed = card.feed;
              // Bag + sample photos from the database row (no static
              // fallback for these feeds).
              const bagImage = hasFeedImage(feed.bag_image_url)
                ? feed.bag_image_url
                : undefined;
              const sampleImage = hasFeedImage(feed.sample_image_url)
                ? feed.sample_image_url
                : undefined;
              return (
              <article
                key={feed.id || feed.name}
                className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex flex-col"
              >
                <div className="bg-emerald-50/70 flex h-44">
                  {bagImage ? (
                    <div className={`flex items-center justify-center p-3 ${sampleImage ? 'flex-1 border-r border-emerald-100' : 'w-full'}`}>
                      <img
                        src={bagImage}
                        alt={`${feed.name} bag`}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  {sampleImage ? (
                    <div className={`flex items-center justify-center p-3 ${bagImage ? 'flex-1' : 'w-full'}`}>
                      <img
                        src={sampleImage}
                        alt={`${feed.name} feed`}
                        className="max-h-full max-w-full object-contain rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  {!bagImage && !sampleImage ? (
                    <div className="w-full flex flex-col items-center justify-center gap-2 text-emerald-300">
                      <Package size={48} />
                      <span className="text-xs font-semibold">No photo</span>
                    </div>
                  ) : null}
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Name with the per-kg price beside it (like Broiler / Layer),
                      and the bag price for the row's standard bag size just below it */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-emerald-800 leading-tight">
                      {feed.name}
                    </h4>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-base font-bold text-emerald-700 whitespace-nowrap">
                        ৳{getPrice(feed)}
                        <span className="text-xs text-slate-400 font-semibold">/kg</span>
                      </span>
                      {Number(getPrice(feed)) > 0 && feed.bag_size_kg != null && (
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          Bag size: {feed.bag_size_kg} kg : ৳{bagPrice(feed)}
                        </span>
                      )}
                    </div>
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
                  <div>
                    {[
                      ['Moisture (Max)', feed.moisture_max_pct ? pct(feed.moisture_max_pct) : '-'],
                      ['Crude Fiber', feed.crude_fiber_pct ? pct(feed.crude_fiber_pct) : '-'],
                      ['Crude Fat', feed.crude_fat_pct ? pct(feed.crude_fat_pct) : '-'],
                      ['Calcium (Min)', feed.calcium_pct ? pct(feed.calcium_pct) : '-'],
                      ['Phosphorus (Min)', feed.phosphorus_pct ? pct(feed.phosphorus_pct) : '-'],
                      ['TDN', feed.tdn_pct ? pct(feed.tdn_pct) : '-'],
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
                </div>
              </article>
              );
            })}
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
