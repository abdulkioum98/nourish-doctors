import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { loadCachedFirst, setCached, shouldUseRealtime } from '../../../lib/offline';
import { Loader2, ShieldCheck, Search, Download } from 'lucide-react';
import { downloadTablePdf } from '../../../lib/downloadPdf';

interface LayerVaccinationData {
  id: number;
  age: string;
  disease_name: string;
  vaccine_name: string;
  vaccine_type: string;
  route: string;
}

export default function LayerVaccination() {
  const [vaccinations, setVaccinations] = useState<LayerVaccinationData[]>([]);
  const [filteredData, setFilteredData] = useState<LayerVaccinationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const tableName = 'layer_vaccinations';

  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const handleDownloadPDF = async () => {
    if (filteredData.length === 0) {
      alert('No data to download.');
      return;
    }
    setDownloadingPdf(true);
    const ok = await downloadTablePdf(
      `layer-vaccination-${new Date().toISOString().slice(0, 10)}.pdf`,
      'Layer Vaccination Schedule',
      [],
      [
        {
          headers: ['Age', 'Disease Name', 'Vaccine Name', 'Vaccine Type', 'Route'],
          rows: filteredData.map((row) => [
            String(row.age ?? ''),
            String(row.disease_name ?? ''),
            String(row.vaccine_name ?? '-'),
            String(row.vaccine_type ?? '-'),
            String(row.route ?? '-'),
          ]),
        },
      ],
    );
    setDownloadingPdf(false);
    if (!ok) alert('Could not create or open the PDF. If this phone has no PDF viewer app, please install one and try again.');
  };

  useEffect(() => {
    fetchLayerVaccinations();

    // Realtime only when online — offline a channel just hangs / errors.
    if (!shouldUseRealtime()) return;

    // Supabase Realtime listener (auto-update when the database changes)
    const channel = supabase
      .channel(`${tableName}_realtime_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          console.log('Layer vaccinations updated in database, refreshing cache...', payload);
          void fetchLayerVaccinationsRows().then((rows) => {
            void setCached('layer_vaccinations:all', rows);
            setVaccinations(rows);
            setFilteredData(rows);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(vaccinations);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = vaccinations.filter(
        (item) =>
          item.age.toLowerCase().includes(term) ||
          item.disease_name.toLowerCase().includes(term) ||
          (item.vaccine_name && item.vaccine_name.toLowerCase().includes(term))
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, vaccinations]);

  // Exact Supabase query, used both as the cache-first fetcher and on realtime events.
  const fetchLayerVaccinationsRows = async (): Promise<LayerVaccinationData[]> => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching layer vaccinations:', error);
        return [];
      }
      return (data ?? []) as LayerVaccinationData[];
    } catch (err) {
      console.error('Unexpected error:', err);
      return [];
    }
  };

  const fetchLayerVaccinations = async () => {
    await loadCachedFirst<LayerVaccinationData[]>(
      'layer_vaccinations:all',
      fetchLayerVaccinationsRows,
      (rows) => {
        setVaccinations(rows);
        setFilteredData(rows);
      },
      () => setLoading(false),
    );
  };

  if (loading && vaccinations.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-amber-700">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className=" p-4 space-y-6 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-900 rounded-2xl p-2 text-white shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Layer Vaccination Schedule</h1>
        </div>
        <div className="bg-white/10 p-3 rounded-xl">
          <ShieldCheck size={28} className="text-white" />
        </div>
      </div>

      {/* Search Box */}
      <div className="flex items-center bg-white border border-amber-200 rounded-xl px-4 py-2.5 shadow-sm max-w-sm">
        <Search size={18} className="text-amber-600 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search by age, disease, or vaccine..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50 text-amber-900 border-b border-amber-100 text-xs sm:text-sm uppercase tracking-wider">
                <th className="p-3.5 text-center">Age</th>
                <th className="p-3.5 text-center">Disease Name</th>
                <th className="p-3.5 text-center">Vaccine Name</th>
                <th className="p-3.5 text-center">Vaccine Type</th>
                <th className="p-3.5 text-center">Route of Administration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
              {filteredData.length > 0 ? (
                loading ? null : filteredData.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'
                    } hover:bg-amber-100/60 transition-colors`}
                  >
                    <td className="p-3 text-center font-bold text-amber-800">{row.age}</td>
                    <td className="p-3 text-center font-semibold text-slate-800">{row.disease_name}</td>
                    <td className="p-3 text-center text-slate-700">{row.vaccine_name || '-'}</td>
                    <td className="p-3 text-center">
                      {row.vaccine_type && row.vaccine_type !== '-' ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          row.vaccine_type === 'Live' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {row.vaccine_type}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 text-center text-slate-600">{row.route || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-slate-400">
                    No Data Available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOWNLOAD PDF — at the end of the page */}
      <div className="pt-3">
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