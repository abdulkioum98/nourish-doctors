// Automatic ration suggestion for the Dairy / Fattening calculators.
//
// Given the animal's targets (DM / CP / Energy required + the target
// concentrate:fodder DM ratio for its stage) and the ingredients the user
// has available, this works out which ingredient how much to give so the
// ration lands as close as possible to all three targets at once.
//
// How it works (deterministic, no guessing):
//   1. The DM requirement is split by the target ratio into a concentrate
//      DM target and a fodder DM target, so the suggested ratio is exact.
//   2. Inside each group several candidate blends are built: every single
//      feed, every pair's exact optimum (the blend whose CP and Energy
//      densities — CP per kg DM, MJ per kg DM — sit closest to the
//      group's fair share of the targets), a few sampled blends along
//      each pair, and a greedily refined blend. A high-CP / low-energy
//      feed can no longer dominate the mix and leave Energy far under
//      target, which the old CP-only weighting did.
//   3. The two groups are then chosen TOGETHER: every combination of a
//      concentrate blend and a fodder blend is scored by the TOTAL
//      ration's error (how far total CP and total Energy sit from their
//      requirements), and the best combination wins. So if one group
//      cannot reach its fair share of CP, the other group is allowed to
//      carry more of it — instead of each group being judged alone.
//   4. Each share is converted to as-fed kg with the ingredient's own DM%,
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

/** A blend: feed id -> share of its group's DM (sums to 1). */
type Blend = Map<string, number>;

const blendKey = (blend: Blend): string =>
  [...blend.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, share]) => `${id}:${share.toFixed(2)}`)
    .join(',');

/**
 * Candidate blends for one group. `dmTarget` / `cpTarget` / `energyTarget`
 * are the group's fair share (by its DM share) — used only to find the
 * group's own best pair / refined blend; the final choice is made on the
 * TOTAL ration, so sampled blends along every pair are included too.
 */
function groupCandidates(
  group: SuggestFeedItem[],
  dmTarget: number,
  cpTarget: number,
  energyTarget: number,
): Blend[] {
  const candidates: Blend[] = [];
  const seen = new Set<string>();
  const add = (props: number[]): void => {
    const blend: Blend = new Map();
    group.forEach((item, i) => {
      if (props[i] > 0.001) blend.set(item.id, props[i]);
    });
    if (blend.size === 0) return;
    const key = blendKey(blend);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(blend);
  };
  if (group.length === 0 || dmTarget <= 0) return candidates;

  // Nutrient density per kg DM, normalised so the group's target is 1.
  // CP kg per kg DM = cp% / dm% ; MJ per kg DM = ME x 100 / dm%.
  const targetCpDensity = cpTarget / dmTarget;
  const targetEnergyDensity = energyTarget / dmTarget;
  const useCp = targetCpDensity > 0;
  const useEnergy = targetEnergyDensity > 0;

  const density = group.map((item) => {
    const dm = item.dmPercent || 0;
    return {
      cp: useCp && dm > 0 ? (item.cpPercent || 0) / dm / targetCpDensity : 0,
      energy:
        useEnergy && dm > 0
          ? ((item.meEnergy || 0) * 100) / dm / targetEnergyDensity
          : 0,
    };
  });

  // Squared error of a blend vs the group's own targets.
  const blendError = (props: number[]): number => {
    let cp = 0;
    let energy = 0;
    props.forEach((p, i) => {
      cp += p * density[i].cp;
      energy += p * density[i].energy;
    });
    let err = 0;
    if (useCp) err += (cp - 1) * (cp - 1);
    if (useEnergy) err += (energy - 1) * (energy - 1);
    return err;
  };

  // Every single feed.
  group.forEach((_, i) => add(group.map((_, j) => (j === i ? 1 : 0))));

  if (useCp || useEnergy) {
    // Every pair: the exact optimum (closest point on the segment between
    // the two feeds to the target) plus sampled blends along the segment.
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        let num = 0;
        let den = 0;
        const axes: Array<[number, number]> = [];
        if (useCp) axes.push([density[i].cp, density[j].cp]);
        if (useEnergy) axes.push([density[i].energy, density[j].energy]);
        for (const [di, dj] of axes) {
          const delta = di - dj;
          num += (dj - 1) * delta;
          den += delta * delta;
        }
        if (den > 0) {
          const t = Math.min(1, Math.max(0, -num / den));
          add(group.map((_, k) => (k === i ? t : k === j ? 1 - t : 0)));
        }
        for (const t of [0.25, 0.5, 0.75]) {
          add(group.map((_, k) => (k === i ? t : k === j ? 1 - t : 0)));
        }
      }
    }

    // Greedy refinement of the group's own best blend: try adding one
    // more feed (up to two extra feeds) if it pulls the blend closer.
    let bestProps: number[] = group.map(() => 0);
    let bestError = Infinity;
    const all: number[][] = [];
    group.forEach((_, i) => all.push(group.map((_, j) => (j === i ? 1 : 0))));
    for (const props of all) {
      const err = blendError(props);
      if (err < bestError) {
        bestError = err;
        bestProps = props;
      }
    }
    for (let round = 0; round < 2; round++) {
      let improvedProps: number[] | null = null;
      let improvedError = bestError;
      for (let k = 0; k < group.length; k++) {
        for (let s = 0.1; s < 1; s += 0.1) {
          const props = bestProps.map((p) => p * (1 - s));
          props[k] += s;
          const err = blendError(props);
          if (err < improvedError - 1e-9) {
            improvedError = err;
            improvedProps = props;
          }
        }
      }
      if (!improvedProps) break;
      bestProps = improvedProps;
      bestError = improvedError;
    }
    add(bestProps);
  }

  return candidates;
}

/** A group's CP (kg) and Energy (MJ) for a blend at its DM target. */
function groupNutrients(
  group: SuggestFeedItem[],
  blend: Blend,
  dmTarget: number,
): { cp: number; energy: number } {
  let cp = 0;
  let energy = 0;
  group.forEach((item) => {
    const share = blend.get(item.id) || 0;
    if (share <= 0) return;
    const dmKg = dmTarget * share;
    const qtyKg = dmKg / (item.dmPercent / 100);
    cp += (qtyKg * item.cpPercent) / 100;
    energy += qtyKg * item.meEnergy;
  });
  return { cp, energy };
}

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
  // Each group's fair share of the CP / Energy requirement, by DM share.
  const concShare = targets.dmReq > 0 ? concTargetDm / targets.dmReq : 0;
  const fodderShare = targets.dmReq > 0 ? fodderTargetDm / targets.dmReq : 0;

  const concGroup = selected.filter((item) => item.feedType === 'concentrate');
  const fodderGroup = selected.filter((item) => item.feedType === 'fodder');

  const concCandidates = groupCandidates(
    concGroup,
    concTargetDm,
    targets.cpReq * concShare,
    targets.energyReq * concShare,
  );
  const fodderCandidates = groupCandidates(
    fodderGroup,
    fodderTargetDm,
    targets.cpReq * fodderShare,
    targets.energyReq * fodderShare,
  );
  if (concCandidates.length === 0 && fodderCandidates.length === 0) return null;

  // A group with no selected feed contributes nothing; a group with no
  // DM target is skipped the same way.
  const concOptions =
    concCandidates.length > 0 ? concCandidates : [new Map<string, number>()];
  const fodderOptions =
    fodderCandidates.length > 0 ? fodderCandidates : [new Map<string, number>()];

  // Choose the two groups TOGETHER: the combination whose TOTAL CP and
  // Energy sit closest to the requirements wins (normalised squared error).
  let bestConc: Blend = concOptions[0];
  let bestFodder: Blend = fodderOptions[0];
  let bestTotalError = Infinity;
  for (const concBlend of concOptions) {
    const conc = groupNutrients(concGroup, concBlend, concTargetDm);
    for (const fodderBlend of fodderOptions) {
      const fodder = groupNutrients(fodderGroup, fodderBlend, fodderTargetDm);
      const totalCp = conc.cp + fodder.cp;
      const totalEnergy = conc.energy + fodder.energy;
      let err = 0;
      if (targets.cpReq > 0) err += ((totalCp - targets.cpReq) / targets.cpReq) ** 2;
      if (targets.energyReq > 0)
        err += ((totalEnergy - targets.energyReq) / targets.energyReq) ** 2;
      if (err < bestTotalError) {
        bestTotalError = err;
        bestConc = concBlend;
        bestFodder = fodderBlend;
      }
    }
  }

  const rows: SuggestedRow[] = [];
  const allocate = (group: SuggestFeedItem[], blend: Blend, dmTarget: number): void => {
    group.forEach((item) => {
      const share = blend.get(item.id) || 0;
      if (share <= 0 || dmTarget <= 0) return;
      const dmKg = dmTarget * share;
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
  allocate(concGroup, bestConc, concTargetDm);
  allocate(fodderGroup, bestFodder, fodderTargetDm);

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
