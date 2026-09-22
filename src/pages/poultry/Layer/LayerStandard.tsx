import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { Loader2, BarChart3, Search } from 'lucide-react';

interface LayerStandardData {
  id: number;
  breed: string;
  age_weeks: number;
  daily_feed_intake: number;
  cumulative_feed: number;
  body_weight_min: number;
  body_weight_max: number;
  egg_production_pct?: number;
  egg_weight?: number;
}

export default function LayerStandard() {
  const [standards, setStandards] = useState<LayerStandardData[]>([]);
  const [filteredData, setFilteredData] = useState<LayerStandardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBreed, setSelectedBreed] = useState<string>('Shaver Star Cross 579 Brown');
  const [searchWeek, setSearchWeek] = useState<string>('');

  useEffect(() => {
    fetchLayerStandards();
  }, []);

  useEffect(() => {
    let result = standards.filter((item) => item.breed === selectedBreed);

    if (searchWeek.trim() !== '') {
      result = result.filter((item) => item.age_weeks.toString() === searchWeek.trim());
    }

    setFilteredData(result);
  }, [selectedBreed, searchWeek, standards]);

  const fetchLayerStandards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('layer_standards')
        .select('*')
        .order('age_weeks', { ascending: true });

      if (error) {
        console.error('Error fetching layer standards:', error);
      } else if (data) {
        setStandards(data);
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
    <div className="max-w-6xl mx-auto p-4 space-y-6 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-900 rounded-2xl p-2 text-white shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Commercial Layer Performance Standards</h1>
        </div>
        <div className="bg-white/10 p-3 rounded-xl">
          <BarChart3 size={28} className="text-white" />
        </div>
      </div>

      {/* Breed Selector & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
        {/* Breed Toggle Buttons */}
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {['Shaver Star Cross 579 Brown', 'Bovans White'].map((breed) => (
            <button
              key={breed}
              onClick={() => setSelectedBreed(breed)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                selectedBreed === breed
                  ? 'bg-amber-700 text-white shadow'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              {breed}
            </button>
          ))}
        </div>

        {/* Search Week */}
        <div className="flex items-center bg-white border border-amber-200 rounded-xl px-4 py-2 shadow-sm w-full sm:w-64">
          <Search size={18} className="text-amber-600 mr-2 shrink-0" />
          <input
            type="number"
            placeholder="Search by week (e.g. 5)..."
            value={searchWeek}
            onChange={(e) => setSearchWeek(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50 text-amber-900 border-b border-amber-100 text-xs sm:text-sm uppercase tracking-wider">
                <th className="p-3.5 text-center">Age (Weeks)</th>
                <th className="p-3.5 text-center">Daily Feed Intake (g)</th>
                <th className="p-3.5 text-center">Cumulative Feed (g)</th>
                <th className="p-3.5 text-center">Body Weight (Min - Max g)</th>
                <th className="p-3.5 text-center">Egg Production (%)</th>
                <th className="p-3.5 text-center">Egg Weight (g)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'
                    } hover:bg-amber-100/60 transition-colors`}
                  >
                    <td className="p-3 text-center font-bold text-amber-800">{row.age_weeks} Weeks</td>
                    <td className="p-3 text-center">{row.daily_feed_intake ?? '-'}</td>
                    <td className="p-3 text-center">{row.cumulative_feed ?? '-'}</td>
                    <td className="p-3 text-center font-medium">
                      {row.body_weight_min} {row.body_weight_max && row.body_weight_min !== row.body_weight_max ? `- ${row.body_weight_max}` : ''}
                    </td>
                    <td className="p-3 text-center text-emerald-700 font-semibold">
                      {row.egg_production_pct ? `${row.egg_production_pct}%` : '-'}
                    </td>
                    <td className="p-3 text-center">{row.egg_weight ? `${row.egg_weight}g` : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-slate-400">
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