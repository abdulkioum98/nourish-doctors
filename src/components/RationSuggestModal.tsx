// Ration suggestion popup, shared by the Dairy and Fattening calculators.
//
// The user picks which ingredients they actually have (multi-select with
// checkboxes, grouped Concentrate / Fodder). The suggestion is recalculated
// live from the animal's targets, and Apply puts the suggested quantities
// straight into the calculator table — the calculation then shows exactly
// as before, only with the suggested numbers in it.
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Lightbulb, X } from 'lucide-react';
import {
  suggestRation,
  type RationTargets,
  type SuggestFeedItem,
} from '../lib/rationSuggest';

interface RationSuggestModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  targets: RationTargets;
  items: SuggestFeedItem[];
  initialSelectedIds: string[];
  onApply: (quantities: { [id: string]: number }) => void;
}

function achievedColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-700';
  if (pct >= 70) return 'text-amber-700';
  return 'text-rose-600';
}

export default function RationSuggestModal({
  open,
  onClose,
  title,
  subtitle,
  targets,
  items,
  initialSelectedIds,
  onApply,
}: RationSuggestModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fresh selection every time the popup opens (preselects whatever the
  // table already has quantities for).
  useEffect(() => {
    if (open) {
      setSelectedIds(initialSelectedIds);
      setDropdownOpen(false);
    }
    // Only the open/close transition matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  const concentrates = useMemo(
    () => items.filter((item) => item.feedType === 'concentrate'),
    [items],
  );
  const fodders = useMemo(
    () => items.filter((item) => item.feedType === 'fodder'),
    [items],
  );

  const suggestion = useMemo(
    () => suggestRation(items, selectedIds, targets),
    [items, selectedIds, targets],
  );

  if (!open) return null;

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  const handleApply = () => {
    if (!suggestion) return;
    const quantities: { [id: string]: number } = {};
    items.forEach((item) => {
      const row = suggestion.rows.find((r) => r.id === item.id);
      quantities[item.id] = row ? row.qtyKg : 0;
    });
    onApply(quantities);
  };

  const renderGroup = (groupTitle: string, group: SuggestFeedItem[]) => (
    <div>
      <div className="px-3 py-1.5 bg-slate-100 font-bold text-slate-700 text-[11px] sm:text-xs">
        {groupTitle}
      </div>
      {group.length === 0 ? (
        <div className="px-3 py-2 text-xs text-slate-400 italic">None available</div>
      ) : (
        group.map((item) => {
          const checked = selectedIds.includes(item.id);
          return (
            <label
              key={item.id}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-xs sm:text-sm ${
                checked ? 'bg-emerald-50 font-semibold text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleItem(item.id)}
                className="w-4 h-4 accent-emerald-700 shrink-0 cursor-pointer"
              />
              <span className="flex-1 min-w-0 break-words leading-tight">{item.name}</span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 whitespace-nowrap">
                DM {item.dmPercent}% • CP {item.cpPercent}%
              </span>
            </label>
          );
        })
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="bg-emerald-800 text-white p-3 sm:p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 min-w-0">
            <Lightbulb size={18} className="shrink-0 text-amber-300" />
            <span className="truncate">{title}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-4 bg-slate-50">
          <p className="text-xs sm:text-sm text-slate-600 leading-snug">{subtitle}</p>

          {/* Targets */}
          <div className="bg-white rounded-lg border border-slate-200 p-2.5 sm:p-3 text-[11px] sm:text-xs space-y-1">
            <div className="font-bold text-slate-800">Target for this animal</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700 font-medium">
              <span>DM Required: <b>{targets.dmReq.toFixed(2)} kg</b></span>
              <span>CP Required: <b>{targets.cpReq.toFixed(2)} kg</b></span>
              <span>Energy Required: <b>{targets.energyReq.toFixed(1)} MJ</b></span>
            </div>
            <div className="text-slate-700 font-medium">
              Target Ratio (Conc : Fodder):{' '}
              <b>{targets.targetConcentratePct} : {targets.targetFodderPct}</b>
            </div>
          </div>

          {/* Available ingredients — multi dropdown */}
          <div>
            <div className="font-bold text-slate-800 text-xs sm:text-sm mb-1.5">
              Which ingredients do you have available?
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-left text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between gap-2 cursor-pointer hover:border-emerald-500 transition"
              >
                <span className="truncate">
                  {selectedIds.length === 0
                    ? 'Select available ingredients'
                    : `${selectedIds.length} ingredient${selectedIds.length > 1 ? 's' : ''} selected`}
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-slate-500 transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-white border border-slate-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {renderGroup('Concentrate', concentrates)}
                  {renderGroup('Fodder', fodders)}
                </div>
              )}
            </div>

            {/* Selected chips */}
            {selectedItems.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="inline-flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] sm:text-xs font-semibold px-2 py-1 rounded-full cursor-pointer transition"
                  >
                    {item.name}
                    <X size={12} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Suggestion */}
          {targets.dmReq <= 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs sm:text-sm text-amber-800 font-medium">
              Enter the animal&apos;s weight first — without it the requirement cannot be calculated.
            </div>
          ) : selectedIds.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-500">
              Select the ingredients you have available above to see the suggestion.
            </div>
          ) : !suggestion ? (
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-500">
              The selected ingredients have no dry matter data, so no suggestion can be made.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Achieved vs required */}
              <div className="bg-white rounded-lg border border-slate-200 p-2.5 sm:p-3 text-[11px] sm:text-xs space-y-1">
                <div className="font-bold text-slate-800">This suggestion gives you</div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700 font-medium">
                  <span>
                    DM: <b className={achievedColor(suggestion.dmAchievedPct)}>
                      {suggestion.totalDm.toFixed(2)} kg ({suggestion.dmAchievedPct}%)
                    </b>
                  </span>
                  <span>
                    CP: <b className={achievedColor(suggestion.cpAchievedPct)}>
                      {suggestion.totalCp.toFixed(2)} kg ({suggestion.cpAchievedPct}%)
                    </b>
                  </span>
                  <span>
                    Energy: <b className={achievedColor(suggestion.energyAchievedPct)}>
                      {suggestion.totalEnergy.toFixed(1)} MJ ({suggestion.energyAchievedPct}%)
                    </b>
                  </span>
                </div>
                <div className="text-slate-700 font-medium">
                  Ratio (Conc : Fodder):{' '}
                  <b>{suggestion.concDmPct} : {suggestion.fodderDmPct}</b>
                  {' '} (target {targets.targetConcentratePct} : {targets.targetFodderPct})
                </div>
                <div className="text-slate-700 font-medium">
                  Total Cost: <b>৳{suggestion.totalCost.toFixed(0)}</b> / day
                </div>
              </div>

              {/* Suggested quantities */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-[11px] sm:text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold">
                      <th className="p-2 border">Ingredient</th>
                      <th className="p-2 border text-center">Qty (kg)</th>
                      <th className="p-2 border text-center">DM (kg)</th>
                      <th className="p-2 border text-center">CP (kg)</th>
                      <th className="p-2 border text-center">Energy (MJ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestion.rows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="p-2 border font-medium text-slate-800 break-words leading-tight">
                          {row.name}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {row.feedType === 'concentrate' ? 'Concentrate' : 'Fodder'}
                          </span>
                        </td>
                        <td className="p-2 border text-center font-bold text-emerald-800">{row.qtyKg}</td>
                        <td className="p-2 border text-center">{row.dmKg.toFixed(2)}</td>
                        <td className="p-2 border text-center">{row.cpKg.toFixed(2)}</td>
                        <td className="p-2 border text-center">{row.energyMj.toFixed(1)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-slate-100 border-t-2 border-slate-300">
                      <td className="p-2 border text-right">Total:</td>
                      <td className="p-2 border text-center text-emerald-800">
                        {suggestion.rows.reduce((acc, r) => acc + r.qtyKg, 0).toFixed(2)}
                      </td>
                      <td className="p-2 border text-center">{suggestion.totalDm.toFixed(2)}</td>
                      <td className="p-2 border text-center">{suggestion.totalCp.toFixed(2)}</td>
                      <td className="p-2 border text-center">{suggestion.totalEnergy.toFixed(1)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
                This is a starting point — after Apply you can still change any quantity in the table.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex justify-end items-center gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!suggestion}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-300 text-white flex items-center gap-2 shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
          >
            <Lightbulb size={16} />
            <span>Apply Suggestion</span>
          </button>
        </div>

      </div>
    </div>
  );
}
