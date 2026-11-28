import React, { useState } from 'react';
import { Package, Download } from 'lucide-react';
import { downloadTablePdf } from '../../../lib/downloadPdf';
import { SONALI_FEEDS } from '../../../lib/feedDetails';

// Sonali feeds — specification and photos from the Nourish product file
// (no own Supabase table; Sonali Standard / vaccination read the broiler
// tables, but the feeds are a fixed product list).
export default function NourishSonaliFeeds() {
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    const ok = await downloadTablePdf(
      `sonali-feeds-${new Date().toISOString().slice(0, 10)}.pdf`,
      'Nourish Sonali Feeds',
      [],
      [
        {
          headers: ['Feed', 'Protein (%)', 'Energy (kcal/kg)', 'Form', 'Feeding Duration'],
          rows: SONALI_FEEDS.map((feed) => [
            String(feed.name ?? ''),
            feed.cp != null ? `${feed.cp}%` : '-',
            String(feed.energy ?? '-'),
            String(feed.form ?? '-'),
            String(feed.duration ?? '-'),
          ]),
        },
      ],
    );
    setDownloadingPdf(false);
    if (!ok) alert('Could not create or open the PDF. If this phone has no PDF viewer app, please install one and try again.');
  };

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
