import React from 'react';
import { ShieldPlus } from 'lucide-react';

interface VaccinationItem {
  age: string;
  disease: string;
  vaccineName: string;
  route: string;
}

export default function VaccinationSchedulePage() {
  // Pore ekhane apnar data gulo update kore nite parben
  const scheduleData: VaccinationItem[] = [
    { age: 'Day 1 - 3', disease: 'Newcastle Disease + Infectious Bronchitis', vaccineName: 'IB + ND (Live)', route: 'Eye drop / Nasal' },
    { age: 'Day 7', disease: 'Infectious Bursal Disease', vaccineName: 'Gumboro (Strain D78/Intermediate)', route: 'Drinking Water / Eye drop' },
    { age: 'Day 14', disease: 'Newcastle Disease', vaccineName: 'ND Vaccine (BCRDV)', route: 'Drinking Water' },
    { age: 'Day 21', disease: 'Infectious Bursal Disease (Booster)', vaccineName: 'Gumboro (2nd Dose)', route: 'Drinking Water' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Sonali Vaccination Schedule</h1>
        </div>
        <div className="bg-white/20 p-3 rounded-xl">
          <ShieldPlus size={28} className="text-white" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50 text-amber-900 border-b border-amber-100 text-xs sm:text-sm uppercase tracking-wider">
                <th className="p-3.5 text-center">Age / Day</th>
                <th className="p-3.5 text-center">Disease Name</th>
                <th className="p-3.5 text-center">Vaccine Name</th>
                <th className="p-3.5 text-center">Route of Administration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
              {scheduleData.length > 0 ? (
                scheduleData.map((row, index) => (
                  <tr
                    key={index}
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'
                    } hover:bg-amber-100/60 transition-colors`}
                  >
                    <td className="p-3 text-center font-bold text-amber-800">{row.age}</td>
                    <td className="p-3 text-center font-semibold">{row.disease}</td>
                    <td className="p-3 text-center">{row.vaccineName}</td>
                    <td className="p-3 text-center font-medium text-slate-600">{row.route}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center p-6 text-slate-400">
                    No Vaccination Schedule Available
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