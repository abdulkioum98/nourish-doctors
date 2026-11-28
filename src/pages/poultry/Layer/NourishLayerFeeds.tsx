import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { loadCachedFirst, setCached, shouldUseRealtime } from '../../../lib/offline';
import { Loader2, Package, Search, Download } from 'lucide-react';
import { downloadTablePdf } from '../../../lib/downloadPdf';
import { layerImageFor } from '../../../lib/feedDetails';
import { hasFeedImage } from '../../../lib/feedImage';

interface LayerFeedData {
  id: number;
  feed_name: string;
  moisture_max_pct?: number;
  protein_min_pct?: number;
  fiber_max_pct?: number;
  calcium_min_pct?: number;
  avail_phosphorus_min_pct?: number;
  methionine_min_pct?: number;
  lysine_min_pct?: number;
  metabolisable_energy_kcal_kg?: number;
  feed_form?: string;
  bird_age_or_stage?: string;
  price?: number;
  bag_size_kg?: number;
  sort_order?: number;
  bag_image_url?: string;
  sample_image_url?: string;
}

export default function LayerFeed() {
  const [feeds, setFeeds] = useState<LayerFeedData[]>([]);
  const [filteredFeeds, setFilteredFeeds] = useState<LayerFeedData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>('');

  const tableName = 'layer_feeds';

  useEffect(() => {
    fetchLayerFeeds();

    // Realtime only when online — offline a channel just hangs / errors.
    if (!shouldUseRealtime()) return;

    // Supabase Realtime listener (auto-update when the database changes)
    const channel = supabase
      .channel(`${tableName}_realtime_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          console.log('Layer feeds updated in database, refreshing cache...', payload);
          void fetchLayerFeedsRows().then((rows) => {
            void setCached('layer_feeds:all', rows);
            setFeeds(rows);
            setFilteredFeeds(rows);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const result = feeds.filter((item) =>
      item.feed_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFeeds(result);
  }, [searchTerm, feeds]);

  // Exact Supabase query, used both as the cache-first fetcher and on realtime events.
  const fetchLayerFeedsRows = async (): Promise<LayerFeedData[]> => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching layer feeds:', error);
        return [];
      }
      return (data ?? []) as LayerFeedData[];
    } catch (err) {
      console.error('Unexpected error:', err);
      return [];
    }
  };

  const fetchLayerFeeds = async () => {
    await loadCachedFirst<LayerFeedData[]>(
      'layer_feeds:all',
      fetchLayerFeedsRows,
      (rows) => {
        setFeeds(rows);
        setFilteredFeeds(rows);
      },
      () => setLoading(false),
    );
  };

  if (loading && feeds.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-amber-700">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  // One spec row: label + value, used in the card's compact grid.
  // (value != null, so a real 0 still shows as "0" and only a missing
  // value shows "-".)
  const spec = (label: string, value: string | number | undefined | null, suffix = '') => (
    <div className="flex items-baseline justify-between gap-2 py-1 border-b border-amber-50 last:border-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-700 text-right">
        {value != null && value !== '' ? `${value}${suffix}` : '-'}
      </span>
    </div>
  );

  // Screenshot sequence: sort_order ascending, rows without one last,
  // so even a stale offline cache lists in the screenshot order.
  const sortedFilteredFeeds = [...filteredFeeds].sort((a, b) => {
    if (a.sort_order == null && b.sort_order == null) return 0;
    if (a.sort_order == null) return 1;
    if (b.sort_order == null) return -1;
    return a.sort_order - b.sort_order;
  });

  // PDF uses the same on-screen order as the cards (sortedFilteredFeeds).
  const handleDownloadPDF = async () => {
    if (sortedFilteredFeeds.length === 0) {
      alert('No data to download.');
      return;
    }
    setDownloadingPdf(true);
    const ok = await downloadTablePdf(
      `layer-feeds-${new Date().toISOString().slice(0, 10)}.pdf`,
      'Nourish Layer Feeds',
      [],
      [
        {
          headers: ['Feed', 'Protein (Min %)', 'Price (Tk/kg)', 'Bag Size (kg)', 'Bag Price (Tk)'],
          rows: sortedFilteredFeeds.map((row) => [
            String(row.feed_name ?? ''),
            row.protein_min_pct != null ? `${row.protein_min_pct}%` : '-',
            row.price != null ? `Tk ${row.price}` : '-',
            row.bag_size_kg != null ? `${row.bag_size_kg}` : '-',
            row.price != null && row.bag_size_kg != null
              ? `Tk ${(Number(row.price) * row.bag_size_kg).toFixed(2)}`
              : '-',
          ]),
        },
      ],
    );
    setDownloadingPdf(false);
    if (!ok) alert('Could not create or open the PDF. If this phone has no PDF viewer app, please install one and try again.');
  };

  return (
    <div className=" p-4 space-y-6 font-sans">
      {/* Header — kept small so it takes little space */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-900 rounded-2xl px-3 py-1.5 text-white shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold">Nourish Layer Feeds</h1>
        </div>
        <div className="bg-white/10 p-2 rounded-xl">
          <Package size={22} className="text-white" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
        <div className="flex items-center bg-white border border-amber-200 rounded-xl px-4 py-2 shadow-sm w-full sm:w-80">
          <Search size={18} className="text-amber-600 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search feed name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Feed Cards */}
      {filteredFeeds.length > 0 ? (
        loading ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedFilteredFeeds.map((row) => {
              // Bag + sample photos: the admin-uploaded image wins when
              // present, else the static photo from the product file.
              const bagImage = hasFeedImage(row.bag_image_url)
                ? row.bag_image_url
                : layerImageFor(row.feed_name);
              const sampleImage = hasFeedImage(row.sample_image_url)
                ? row.sample_image_url
                : undefined;
              return (
                <article
                  key={row.id}
                  className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden flex flex-col"
                >
                  {/* Bag photo beside the sample (loose feed) photo, so
                      both are seen together. When a photo is missing the
                      other one takes the full width; when both are
                      missing a placeholder shows. */}
                  <div className="bg-amber-50/70 flex h-52">
                    {bagImage ? (
                      <div className={`flex items-center justify-center p-3 ${sampleImage ? 'flex-1 border-r border-amber-100' : 'w-full'}`}>
                        <img
                          src={bagImage}
                          alt={`${row.feed_name} bag`}
                          className="max-h-full max-w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    {sampleImage ? (
                      <div className={`flex items-center justify-center p-3 ${bagImage ? 'flex-1' : 'w-full'}`}>
                        <img
                          src={sampleImage}
                          alt={`${row.feed_name} feed`}
                          className="max-h-full max-w-full object-contain rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    {!bagImage && !sampleImage ? (
                      <div className="w-full flex flex-col items-center justify-center gap-2 text-amber-300">
                        <Package size={56} />
                        <span className="text-xs font-semibold">No photo</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Name + per-kg price, with the bag price for the row's
                        standard bag size just below it */}
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-bold text-amber-800 leading-tight">
                        {row.feed_name}
                      </h2>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        {row.price ? (
                          <span className="text-sm font-bold text-emerald-700 whitespace-nowrap">
                            ৳{row.price}
                            <span className="text-xs text-slate-400 font-semibold">/kg</span>
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-emerald-700 whitespace-nowrap">
                            Not Set
                          </span>
                        )}
                        {row.price && row.bag_size_kg != null && (
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            Bag size: {row.bag_size_kg} kg : ৳{(Number(row.price) * row.bag_size_kg).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Key figures */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-amber-50 rounded-xl py-2 px-1">
                        <div className="text-[10px] uppercase tracking-wide text-amber-700/70 font-bold">Protein</div>
                        <div className="text-sm font-bold text-amber-900">{row.protein_min_pct ?? '-'}%</div>
                      </div>
                      <div className="bg-amber-50 rounded-xl py-2 px-1">
                        <div className="text-[10px] uppercase tracking-wide text-amber-700/70 font-bold">Energy</div>
                        <div className="text-sm font-bold text-amber-900">{row.metabolisable_energy_kcal_kg ?? '-'}</div>
                      </div>
                      <div className="bg-amber-50 rounded-xl py-2 px-1">
                        <div className="text-[10px] uppercase tracking-wide text-amber-700/70 font-bold">Form</div>
                        <div className="text-sm font-bold text-amber-900">{row.feed_form ?? '-'}</div>
                      </div>
                    </div>

                    {/* Full specification (from the database) */}
                    <div>
                      {spec('Moisture Max', row.moisture_max_pct, '%')}
                      {spec('Fiber Max', row.fiber_max_pct, '%')}
                      {spec('Calcium Min', row.calcium_min_pct, '%')}
                      {spec('Avail. Phos. Min', row.avail_phosphorus_min_pct, '%')}
                      {spec('Methionine Min', row.methionine_min_pct, '%')}
                      {spec('Lysine Min', row.lysine_min_pct, '%')}
                      {spec('Bird Stage / Age', row.bird_age_or_stage)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 text-center text-slate-400 text-sm">
          No Feed Data Found
        </div>
      )}

      {/* DOWNLOAD PDF — at the end of the page */}
      <div className="pt-2">
        <button
          onClick={handleDownloadPDF}
          disabled={downloadingPdf}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-2 px-3 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
        >
          <Download size={16} />
          <span>{downloadingPdf ? 'Preparing PDF...' : 'Download PDF'}</span>
        </button>
      </div>
    </div>
  );
}
