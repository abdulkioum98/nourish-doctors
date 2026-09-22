import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { Loader2, Package, Search } from 'lucide-react';

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
}

export default function BroilerFeed() {
  const [feeds, setFeeds] = useState<BroilerFeedData[]>([]);
  const [filteredFeeds, setFilteredFeeds] = useState<BroilerFeedData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchBroilerFeeds();
  }, []);

  useEffect(() => {
    const result = feeds.filter((item) =>
      item.feed_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFeeds(result);
  }, [searchTerm, feeds]);

  const fetchBroilerFeeds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('broiler_feeds')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching broiler feeds:', error);
      } else if (data) {
        setFeeds(data);
        setFilteredFeeds(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-amber-700">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-900 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Broiler Feed Specifications</h1>
          <p className="text-amber-100 text-xs sm:text-sm mt-1">Nutrient standards, feed forms, and pricing for broiler feeds</p>
        </div>
        <div className="bg-white/10 p-3 rounded-xl">
          <Package size={28} className="text-white" />
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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50 text-amber-900 border-b border-amber-100 text-xs uppercase tracking-wider">
                <th className="p-3 text-center">Feed Name</th>
                <th className="p-3 text-center">Moisture Max (%)</th>
                <th className="p-3 text-center">Protein Min (%)</th>
                <th className="p-3 text-center">Fiber Max (%)</th>
                <th className="p-3 text-center">Calcium Min (%)</th>
                <th className="p-3 text-center">Phosphorus Max (%)</th>
                <th className="p-3 text-center">Methionine Min (%)</th>
                <th className="p-3 text-center">Lysine Min (%)</th>
                <th className="p-3 text-center">Energy (kcal/kg)</th>
                <th className="p-3 text-center">Feed Form</th>
                <th className="p-3 text-center">Bird Age / Stage</th>
                <th className="p-3 text-center">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
              {filteredFeeds.length > 0 ? (
                filteredFeeds.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'
                    } hover:bg-amber-100/60 transition-colors`}
                  >
                    <td className="p-3 text-center font-bold text-amber-800">{row.feed_name}</td>
                    <td className="p-3 text-center">{row.moisture_max_pct ?? '-'}</td>
                    <td className="p-3 text-center">{row.protein_min_pct ?? '-'}</td>
                    <td className="p-3 text-center">{row.fiber_max_pct ?? '-'}</td>
                    <td className="p-3 text-center">{row.calcium_min_pct ?? '-'}</td>
                    <td className="p-3 text-center">{row.phosphorus_max_pct ?? '-'}</td>
                    <td className="p-3 text-center">{row.methionine_min_pct ?? '-'}</td>
                    <td className="p-3 text-center">{row.lysine_min_pct ?? '-'}</td>
                    <td className="p-3 text-center">{row.metabolisable_energy_kcal_kg ?? '-'}</td>
                    <td className="p-3 text-center font-medium">{row.feed_form ?? '-'}</td>
                    <td className="p-3 text-center">{row.bird_age_or_stage ?? '-'}</td>
                    <td className="p-3 text-center text-slate-400 font-medium">
                      {row.price ? `${row.price} BDT` : 'Not Set'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="text-center p-6 text-slate-400">
                    No Feed Data Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}