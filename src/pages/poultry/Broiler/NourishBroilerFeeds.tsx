import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { loadCachedFirst, setCached, shouldUseRealtime } from '../../../lib/offline';
import { Loader2, Package, Download } from 'lucide-react';
import { downloadTablePdf } from '../../../lib/downloadPdf';
import { broilerExtraFor } from '../../../lib/feedDetails';
import { hasFeedImage } from '../../../lib/feedImage';

interface BroilerFeedData {
  id: number;
  feed_name: string;
  moisture_max_pct?: number;
  protein_min_pct?: number;
  fiber_max_pct?: number;
  calcium_min_pct?: number;
  phosphorus_max_pct?: number;
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

export default function BroilerFeed() {
  const [feeds, setFeeds] = useState<BroilerFeedData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const tableName = 'broiler_feeds';

  useEffect(() => {
    fetchBroilerFeeds();

    // Realtime only when online — offline a channel just hangs / errors.
    if (!shouldUseRealtime()) return;

    // Supabase Realtime listener (auto-update when the database changes)
    const channel = supabase
      .channel(`${tableName}_realtime_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          console.log('Broiler feeds updated in database, refreshing cache...', payload);
          void fetchBroilerFeedsRows().then((rows) => {
            void setCached('broiler_feeds:all', rows);
            setFeeds(rows);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Exact Supabase query, used both as the cache-first fetcher and on realtime events.
  const fetchBroilerFeedsRows = async (): Promise<BroilerFeedData[]> => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching broiler feeds:', error);
        return [];
      }
      return (data ?? []) as BroilerFeedData[];
    } catch (err) {
      console.error('Unexpected error:', err);
      return [];
    }
  };

  const fetchBroilerFeeds = async () => {
    await loadCachedFirst<BroilerFeedData[]>(
      'broiler_feeds:all',
      fetchBroilerFeedsRows,
      (rows) => {
        setFeeds(rows);
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

  // The specification rows: Max / Min in brackets, and the rows alternate
  // a light background so they are easy to scan.
  // (A real 0 still shows as "0"; only a missing value shows "-".)
  const specRows = (row: BroilerFeedData): Array<[string, string]> => {
    const value = (v: string | number | undefined | null, suffix = '') =>
      v != null && v !== '' ? `${v}${suffix}` : '-';
    return [
      ['Moisture (Max)', value(row.moisture_max_pct, '%')],
      ['Fiber (Max)', value(row.fiber_max_pct, '%')],
      ['Calcium (Min)', value(row.calcium_min_pct, '%')],
      ['Phosphorus (Max)', value(row.phosphorus_max_pct, '%')],
      ['Methionine (Min)', value(row.methionine_min_pct, '%')],
      ['Lysine (Min)', value(row.lysine_min_pct, '%')],
      ['Bird Age / Stage', value(row.bird_age_or_stage)],
    ];
  };

  // Screenshot sequence: sort_order ascending, rows without one last,
  // so even a stale offline cache lists in the screenshot order.
  const sortedFeeds = [...feeds].sort((a, b) => {
    if (a.sort_order == null && b.sort_order == null) return 0;
    if (a.sort_order == null) return 1;
    if (b.sort_order == null) return -1;
    return a.sort_order - b.sort_order;
  });

  // PDF uses the same on-screen order as the cards (sortedFeeds).
  const handleDownloadPDF = async () => {
    if (sortedFeeds.length === 0) {
      alert('No data to download.');
      return;
    }
    setDownloadingPdf(true);
    const ok = await downloadTablePdf(
      `broiler-feeds-${new Date().toISOString().slice(0, 10)}.pdf`,
      'Nourish Broiler Feeds',
      [],
      [
        {
          headers: ['Feed', 'Protein (Min %)', 'Price (Tk/kg)', 'Bag Size (kg)', 'Bag Price (Tk)'],
          rows: sortedFeeds.map((row) => [
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
          <h1 className="text-lg sm:text-xl font-bold">Nourish Broiler Feeds</h1>
        </div>
        <div className="bg-white/10 p-2 rounded-xl">
          <Package size={22} className="text-white" />
        </div>
      </div>

      {/* Feed Cards */}
      {feeds.length > 0 ? (
        loading ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedFeeds.map((row) => {
              const extra = broilerExtraFor(row.feed_name);
              // Bag + sample photos: the admin-uploaded image wins when
              // present, else the static photo from the product file.
              const bagImage = hasFeedImage(row.bag_image_url)
                ? row.bag_image_url
                : extra?.bagImage;
              const sampleImage = hasFeedImage(row.sample_image_url)
                ? row.sample_image_url
                : extra?.feedImage;
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
                    {/* Name + bag colour + per-kg price, with the bag price
                        for the row's standard bag size just below it */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-base font-bold text-amber-800 leading-tight">
                          {row.feed_name}
                        </h2>
                        {extra && (
                          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                            <span
                              className="inline-block w-3 h-3 rounded-full border border-black/10"
                              style={{ backgroundColor: extra.bagColorHex }}
                            />
                            Bag Colour: {extra.bagColor}
                          </p>
                        )}
                      </div>
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
                        <div className="text-[10px] uppercase tracking-wide text-amber-700/70 font-bold">Protein (Min)</div>
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
                    <div className="rounded-lg overflow-hidden">
                      {specRows(row).map(([label, value], idx) => (
                        <div
                          key={label}
                          className={`flex items-baseline justify-between gap-2 px-2 py-1 ${
                            idx % 2 === 0 ? 'bg-amber-50/60' : 'bg-white'
                          }`}
                        >
                          <span className="text-[11px] text-slate-500">{label}</span>
                          <span className="text-xs font-semibold text-slate-700 text-right">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Extra details from the product file */}
                    {extra && (
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1.5">
                        {extra.duration && (
                          <p className="text-xs text-slate-600">
                            <span className="font-bold text-slate-700">Use: </span>
                            {extra.duration}
                          </p>
                        )}
                        {extra.consumption && (
                          <p className="text-xs text-slate-600">
                            <span className="font-bold text-slate-700">Consumption: </span>
                            {extra.consumption}
                          </p>
                        )}
                        {extra.bodyWeight && (
                          <p className="text-xs text-slate-600">
                            <span className="font-bold text-slate-700">Body Weight: </span>
                            {extra.bodyWeight}
                          </p>
                        )}
                        {extra.feedSize && (
                          <p className="text-xs text-slate-600">
                            <span className="font-bold text-slate-700">Feed Size: </span>
                            {extra.feedSize}
                          </p>
                        )}
                        {extra.note && (
                          <p className="text-xs text-slate-600">{extra.note}</p>
                        )}
                        {extra.transition && extra.transition.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-slate-700">Change-over:</p>
                            <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                              {extra.transition.map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
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
