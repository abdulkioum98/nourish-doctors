// Automatic ration suggestion for the Dairy / Fattening calculators.
//
// Given the animal's targets (DM / CP / Energy required + the target
// concentrate:fodder DM ratio for its stage) and the ingredients the user
// has available, this works out which ingredient how much to give so the
// ration lands as close as possible to all three targets at once.
//
// How it works (one pass, deterministic, easy to explain to the user):
//   1. The DM requirement is split by the target ratio into a concentrate
//      DM target and a fodder DM target.
//   2. Inside each group the DM target is shared between the selected
//      ingredients, weighted by CP% — protein-rich feeds carry more of the
//      group's DM, which pulls the ration's CP towards its requirement.
//   3. Each share is converted to as-fed kg with the ingredient's own DM%,
//      rounded to 2 decimals, and all totals are recomputed from those
//      rounded quantities — so what the modal shows is exactly what Apply
//      puts into the table.
// The same formulas as the calculator pages are used throughout:
//   DM kg = qty x dm% / 100, CP kg = qty x cp% / 100, Energy MJ = qty x ME.

export interface SuggestFeedItem {
  id: string;
  name: string;
  feedType: 'concentrate' | 'fodder';
  dmPercent: number;
  cpPercent: number;
  meEnergy: number;
  pricePerKg: number;
}

export interface RationTargets {
  dmReq: number;
  cpReq: number;
  energyReq: number;
  targetConcentratePct: number;
  targetFodderPct: number;
}

export interface SuggestedRow {
  id: string;
  name: string;
  feedType: 'concentrate' | 'fodder';
  qtyKg: number;
  dmKg: number;
  cpKg: number;
  energyMj: number;
  cost: number;
}

export interface SuggestionResult {
  rows: SuggestedRow[];
  totalDm: number;
  totalCp: number;
  totalEnergy: number;
  totalCost: number;
  concDmPct: number;
  fodderDmPct: number;
  dmAchievedPct: number;
  cpAchievedPct: number;
  energyAchievedPct: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function suggestRation(
  items: SuggestFeedItem[],
  selectedIds: string[],
  targets: RationTargets,
): SuggestionResult | null {
  if (!targets || targets.dmReq <= 0) return null;

  // Only ingredients that can actually contribute dry matter.
  const selected = items.filter(
    (item) => selectedIds.includes(item.id) && (item.dmPercent || 0) > 0,
  );
  if (selected.length === 0) return null;

  const concTargetDm = (targets.dmReq * targets.targetConcentratePct) / 100;
  const fodderTargetDm = (targets.dmReq * targets.targetFodderPct) / 100;

  const rows: SuggestedRow[] = [];

  const allocate = (group: SuggestFeedItem[], dmTarget: number): void => {
    if (group.length === 0 || dmTarget <= 0) return;
    const weights = group.map((item) => Math.max(item.cpPercent || 0, 0.5));
    const weightSum = weights.reduce((acc, w) => acc + w, 0);
    group.forEach((item, idx) => {
      const dmKg = (dmTarget * weights[idx]) / weightSum;
      const qtyKg = round2(dmKg / (item.dmPercent / 100));
      if (qtyKg <= 0) return;
      rows.push({
        id: item.id,
        name: item.name,
        feedType: item.feedType,
        qtyKg,
        dmKg: round2((qtyKg * item.dmPercent) / 100),
        cpKg: Math.round(((qtyKg * item.cpPercent) / 100) * 1000) / 1000,
        energyMj: Math.round(qtyKg * item.meEnergy * 10) / 10,
        cost: Math.round(qtyKg * item.pricePerKg),
      });
    });
  };

  allocate(
    selected.filter((item) => item.feedType === 'concentrate'),
    concTargetDm,
  );
  allocate(
    selected.filter((item) => item.feedType === 'fodder'),
    fodderTargetDm,
  );

  if (rows.length === 0) return null;

  const totalDm = round2(rows.reduce((acc, r) => acc + r.dmKg, 0));
  const totalCp = Math.round(rows.reduce((acc, r) => acc + r.cpKg, 0) * 1000) / 1000;
  const totalEnergy = Math.round(rows.reduce((acc, r) => acc + r.energyMj, 0) * 10) / 10;
  const totalCost = rows.reduce((acc, r) => acc + r.cost, 0);
  const concDm = rows
    .filter((r) => r.feedType === 'concentrate')
    .reduce((acc, r) => acc + r.dmKg, 0);
  const concDmPct = totalDm > 0 ? Math.round((concDm / totalDm) * 100) : 0;

  return {
    rows,
    totalDm,
    totalCp,
    totalEnergy,
    totalCost,
    concDmPct,
    fodderDmPct: totalDm > 0 ? 100 - concDmPct : 0,
    dmAchievedPct: targets.dmReq > 0 ? Math.round((totalDm / targets.dmReq) * 100) : 0,
    cpAchievedPct: targets.cpReq > 0 ? Math.round((totalCp / targets.cpReq) * 100) : 0,
    energyAchievedPct:
      targets.energyReq > 0 ? Math.round((totalEnergy / targets.energyReq) * 100) : 0,
  };
}
