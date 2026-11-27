// Ration suggestion popup, shared by the Dairy and Fattening calculators.
//
// Two ways to suggest:
//   - Auto Suggestion: the solver builds the ration from the MUST-USE
//     feeds — the Nourish feed for this animal's milk yield (dairy) or
//     daily weight gain (fattening), plus Bhushi Mix, plus Green Grass
//     and Straw or Silage — then 1-3 other ingredients, cheapest first.
//     The yield feed is the main concentrate. A Change button steps
//     through the combinations: the must-use feeds stay fixed, only
//     the other ingredients change, so each tap gives a different ration.
//   - Select Ingredients: the user picks which ingredients they actually
//     have (multi-select with checkboxes, grouped Concentrate / Fodder),
//     and every selected ingredient is used.
// The suggestion is recalculated live from the animal's targets, and
// Apply puts the suggested quantities straight into the calculator
// table — the calculation then shows exactly as before, only with the
// suggested numbers in it.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Lightbulb, RefreshCw, X } from 'lucide-react';
import {
  suggestRation,
  suggestRationAuto,
  type AutoContext,
  type RationTargets,
  type SuggestFeedItem,
} from '../lib/rationSuggest';

type SuggestMode = 'auto' | 'select';

interface RationSuggestModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  targets: RationTargets;
  items: SuggestFeedItem[];
  initialSelectedIds: string[];
  onApply: (quantities: { [id: string]: number }) => void;
  /** Auto Suggestion needs the animal's milk yield (dairy) or daily
      weight gain (fattening) to pick the must-use Nourish feed. */
  autoContext?: AutoContext;
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
  autoContext,
}: RationSuggestModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [mode, setMode] = useState<SuggestMode>('auto');
  // Change variant in Auto mode: 0 = cheapest combination, each tap
  // steps to the next one (the must-use feeds stay fixed).
  const [variant, setVariant] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Fresh selection every time the popup opens (preselects whatever the
  // table already has quantities for). Auto Suggestion is the default —
  // it is the lowest-cost accurate suggestion, starting from the
  // cheapest combination.
  useEffect(() => {
    if (open) {
      setSelectedIds(initialSelectedIds);
      setMode('auto');
      setVariant(0);
      setDropdownOpen(false);
    }
    // Only the open/close transition matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  // When the ingredients list opens, bring it into view — the list is
  // tall now, so on a phone it would otherwise sit half below the
  // visible area and the user would not see what they are picking.
  useEffect(() => {
    if (dropdownOpen) {
      dropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [dropdownOpen]);

  const concentrates = useMemo(
    () => items.filter((item) => item.feedType === 'concentrate'),
    [items],
  );
  const fodders = useMemo(
    () => items.filter((item) => item.feedType === 'fodder'),
    [items],
  );

  const suggestion = useMemo(
    () =>
      mode === 'auto'
        ? suggestRationAuto(
            items,
            targets,
            autoContext || { kind: 'dairy' },
            variant,
          )
        : suggestRation(items, selectedIds, targets),
    [items, selectedIds, targets, mode, autoContext, variant],
  );

  // The must-use feeds in the current Auto suggestion (shown with a
  // "Must" badge in the table). Select mode has none.
  const mandatoryIds =
    mode === 'auto' && suggestion && 'mandatoryIds' in suggestion
      ? suggestion.mandatoryIds
      : [];
  const variantCount =
    mode === 'auto' && suggestion && 'variantCount' in suggestion
      ? suggestion.variantCount
      : 0;
  const variantIndex =
    mode === 'auto' && suggestion && 'variantIndex' in suggestion
      ? suggestion.variantIndex
      : 0;

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

          {/* Mode: Auto Suggestion or Select Ingredients */}
          <div>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setMode('auto')}
                className={`rounded-lg px-2 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                  mode === 'auto'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                Auto Suggestion
              </button>
              <button
                type="button"
                onClick={() => setMode('select')}
                className={`rounded-lg px-2 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                  mode === 'select'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                Select Ingredients
              </button>
            </div>
            {mode === 'auto' && (
              <p className="text-[11px] sm:text-xs text-slate-500 leading-snug mt-2">
                The suggestion is built on the must-use feeds — the Nourish
                feed for this animal&apos;s milk yield or weight gain, Bhushi
                Mix, Green Grass and Straw or Silage — plus 1-3 other
                ingredients, cheapest first, at the correct ratio.
              </p>
            )}
          </div>

          {/* Available ingredients — multi dropdown (Select Ingredients only) */}
          {mode === 'select' && (
          <div>
            <div className="font-bold text-slate-800 text-xs sm:text-sm mb-1.5">
              Which ingredients do you have available?
            </div>
            <div className="relative" ref={dropdownRef}>
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
                <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-white border border-slate-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
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
          )}

          {/* Suggestion */}
          {targets.dmReq <= 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs sm:text-sm text-amber-800 font-medium">
              Enter the animal&apos;s weight first — without it the requirement cannot be calculated.
            </div>
          ) : mode === 'select' && selectedIds.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-500">
              Select the ingredients you have available above to see the suggestion.
            </div>
          ) : !suggestion ? (
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-500">
              {mode === 'auto'
                ? 'No combination of ingredients can meet the requirement — try Select Ingredients with different items.'
                : 'The selected ingredients have no dry matter data, so no suggestion can be made.'}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Change — next combination (Auto only). The must-use feeds
                  stay fixed; only the other ingredients change. */}
              {mode === 'auto' && variantCount > 1 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                    Option {variantIndex + 1} of {variantCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setVariant((v) => (v + 1) % variantCount)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    Change
                  </button>
                </div>
              )}

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
                          <span className="inline-flex items-center gap-1.5 flex-wrap">
                            {row.name}
                            {mandatoryIds.includes(row.id) && (
                              <span className="inline-block bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                Must
                              </span>
                            )}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {row.feedType === 'concentrate' ? 'Concentrate' : 'Fodder'}
                          </span>
                        </td>
                        <td className="p-2 border text-center font-bold text-emerald-800">{row.qtyKg.toFixed(1)}</td>
                        <td className="p-2 border text-center">{row.dmKg.toFixed(2)}</td>
                        <td className="p-2 border text-center">{row.cpKg.toFixed(2)}</td>
                        <td className="p-2 border text-center">{row.energyMj.toFixed(1)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-slate-100 border-t-2 border-slate-300">
                      <td className="p-2 border text-right">Total:</td>
                      <td className="p-2 border text-center text-emerald-800">
                        {suggestion.rows.reduce((acc, r) => acc + r.qtyKg, 0).toFixed(1)}
                      </td>
                      <td className="p-2 border text-center">{suggestion.totalDm.toFixed(2)}</td>
                      <td className="p-2 border text-center">{suggestion.totalCp.toFixed(2)}</td>
                      <td className="p-2 border text-center">{suggestion.totalEnergy.toFixed(1)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
                {mode === 'auto'
                  ? 'Built on the must-use feeds (marked "Must") plus 1-3 other ingredients, cheapest first. The ration never goes below the requirement (DM, CP and Energy) — it sits just above it. Tap Change to see the next combination with different other ingredients. After Apply you can still change any quantity in the table.'
                  : 'Every ingredient you selected is used, and the ration never goes below the requirement (DM, CP and Energy) — it sits just above it. After Apply you can still change any quantity in the table.'}
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
