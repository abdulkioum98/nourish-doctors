import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { Loader2, Award, Search } from 'lucide-react';

interface BroilerData {
  id: number;
  day: number;
  body_weight: number;
  feed_intake: number;
  fcr: number;
}

export default function BroilerStandard() {
  const [standards, setStandards] = useState<BroilerData[]>([]);
  const [filteredStandards, setFilteredStandards] = useState<BroilerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchDay, setSearchDay] = useState<string>('');

  useEffect(() => {
    fetchBroilerStandards();
  }, []);

  useEffect(() => {
    if (searchDay.trim() === '') {
      setFilteredStandards(standards);
    } else {
      const filtered = standards.filter((item) =>
        item.day.toString().includes(searchDay.trim())
      );
      setFilteredStandards(filtered);
    }
  }, [searchDay, standards]);

  const fetchBroilerStandards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('broiler_standards')
        .select('*')
        .order('day', { ascending: true });

      if (error) {
        console.error('Error fetching broiler standards:', error);
      } else if (data) {
        setStandards(data);
        setFilteredStandards(data);
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
    <div className="max-w-4xl mx-auto p-4 space-y-6 font-sans">
      {/* Header with softer/deeper amber gradient */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-900 rounded-2xl p-2 text-white shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Arbor Acres Broiler Standard</h1>
        </div>
        <div className="bg-white/10 p-3 rounded-xl">
          <Award size={28} className="text-white" />
        </div>
      </div>

      {/* Search Box */}
      <div className="flex items-center bg-white border border-amber-200 rounded-xl px-4 py-2.5 shadow-sm max-w-xs">
        <Search size={18} className="text-amber-600 mr-2" />
        <input
          type="number"
          placeholder="Search by day (e.g. 7)..."
          value={searchDay}
          onChange={(e) => setSearchDay(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
        />
      </div>

      {/* Table with alternating row colors */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50 text-amber-900 border-b border-amber-100 text-xs sm:text-sm uppercase tracking-wider">
                <th className="p-3.5 text-center">Day</th>
                <th className="p-3.5 text-center">Body Weight (gm)</th>
                <th className="p-3.5 text-center">Feed Intake (gm)</th>
                <th className="p-3.5 text-center">FCR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
              {filteredStandards.length > 0 ? (
                filteredStandards.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'
                    } hover:bg-amber-100/60 transition-colors`}
                  >
                    <td className="p-3 text-center font-bold text-amber-800">{row.day}</td>
                    <td className="p-3 text-center font-semibold">{row.body_weight}</td>
                    <td className="p-3 text-center">{row.feed_intake}</td>
                    <td className="p-3 text-center font-medium text-slate-600">
                      {Number(row.fcr).toFixed(3)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center p-6 text-slate-400">
                    No Data Available
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