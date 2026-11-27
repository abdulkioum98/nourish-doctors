// Automatic ration suggestion for the Dairy / Fattening calculators.
//
// Given the animal's targets (DM / CP / Energy required + the target
// concentrate:fodder DM ratio for its stage) and the ingredients the user
// has available, this works out which ingredient how much to give so the
// ration lands as close as possible to all three targets at once.
//
// Guarantees (the user asked for these explicitly):
//   1. THE RATIO STAYS AT THE TARGET. The concentrate:fodder DM ratio
//      is a hard rule — where 50:50 is needed, the suggestion is 50:50,
//      never 60:40. Repair and trim both add/remove feed in the target
//      ratio's proportion, so the ratio cannot drift.
//   2. EVERY selected ingredient is used — each one gets at least 0.5 kg
//      as-fed, so nothing the user picked is left out of the ration.
//   3. Quantities are 1 decimal place (0.1 kg steps: 1.3, 4.5 — never
//      1.23). The user weighs feed to 100 g, not to 10 g.
//   4. NEVER below the requirement. DM, CP and Energy are all >= their
//      requirement. The result is the SMALLEST feasible ration — very
//      near the requirement, slightly above it, never under it.
//
// Two modes:
//   - suggestRation (ingredient selection): the user picks which
//     ingredients they have; the solver finds the best quantities
//     for exactly those ingredients.
//   - suggestRationAuto (auto suggestion): the solver builds the
//     ration from the MUST-USE feeds — the Nourish feed for this
//     animal's milk yield (dairy) or weight gain (fattening), plus
//     Bhushi Mix, plus Green Grass and Straw or Silage — then 1-3
//     other ingredients, cheapest first. The yield feed is the main
//     concentrate (at least half its DM). A Change button steps
//     through the combinations cheapest first: the must-use feeds
//     stay fixed, only the other ingredients change.
//
// How it works (deterministic, no guessing):
//   1. The DM requirement is split by the target ratio into a concentrate
//      DM target and a fodder DM target (if one group has no feed, the
//      other group takes the full DM). The split never moves.
//   2. Inside each group several candidate blends are built — equal
//      shares, each feed dominant, CP-weighted and Energy-weighted —
//      and every blend uses ALL the group's feeds (a minimum share),
//      so no selected ingredient is ever dropped. The equal blend is
//      then hill-climbed to the blend whose CP and Energy densities
//      sit closest to the group's fair share of the targets.
//   3. Every combination of a concentrate blend and a fodder blend is
//      turned into as-fed quantities (1 decimal, >= 0.5 kg each), then
//      REPAIRED and TRIMMED, both ratio-preserving:
//        - Repair: if DM, CP or Energy is under its requirement, feed
//          is added to BOTH groups in the target ratio's proportion
//          (best feed of each group for the shortfall), in one
//          computed step, until all three are met.
//        - Trim: then every feed is shaved down as far as it can go
//          without breaking any requirement or pushing the ratio more
//          than 2 points off target — so the ration ends up the
//          smallest one that still meets everything (very near,
//          slightly above).
//   4. The combination with the smallest excess above the requirements
//      wins (manual mode), or the lowest total cost wins (auto mode).
//      All totals are recomputed from the final rounded quantities —
//      so what the modal shows is exactly what Apply puts into the table.
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

/** 1 decimal place — quantities move in 0.1 kg steps. */
const STEP_KG = 0.1;
/** Every selected ingredient gets at least this much as-fed. */
const MIN_QTY_KG = 0.5;
/** The ratio may not drift more than this many points off target. */
const RATIO_TOL_PTS = 2;

const round1 = (n: number): number => Math.round(n * 10) / 10;
/** Round a quantity UP to the next 0.1 kg step. */
const ceilStep = (n: number): number =>
  Math.ceil(n / STEP_KG - 1e-9) * STEP_KG;

interface FeedQty {
  item: SuggestFeedItem;
  qtyKg: number;
}

interface Totals {
  dm: number;
  cp: number;
  energy: number;
}

function totalsFor(qtys: FeedQty[]): Totals {
  let dm = 0;
  let cp = 0;
  let energy = 0;
  for (const { item, qtyKg } of qtys) {
    dm += (qtyKg * item.dmPercent) / 100;
    cp += (qtyKg * item.cpPercent) / 100;
    energy += qtyKg * item.meEnergy;
  }
  return { dm, cp, energy };
}

/** Concentrate DM (kg) in a ration. */
function concDmOf(qtys: FeedQty[]): number {
  return qtys
    .filter((q) => q.item.feedType === 'concentrate')
    .reduce((acc, q) => acc + (q.qtyKg * q.item.dmPercent) / 100, 0);
}

/** Concentrate share of DM, in percent. */
function concPctOf(qtys: FeedQty[]): number {
  const t = totalsFor(qtys);
  return t.dm > 0 ? (concDmOf(qtys) / t.dm) * 100 : 0;
}

/** True when every requirement is met (a tiny epsilon covers float dust). */
function isFeasible(t: Totals, targets: RationTargets): boolean {
  const eps = 1e-9;
  return (
    t.dm >= targets.dmReq - eps &&
    t.cp >= targets.cpReq - eps &&
    t.energy >= targets.energyReq - eps
  );
}

/** True when the ratio is within tolerance of the target. */
function ratioOk(qtys: FeedQty[], targets: RationTargets): boolean {
  return (
    Math.abs(concPctOf(qtys) - targets.targetConcentratePct) <= RATIO_TOL_PTS + 1e-9
  );
}

// ------------------------------------------------------------------
// Ratio-preserving repair
// ------------------------------------------------------------------

/**
 * Add feed to cover a shortfall, keeping the DM ratio exact: the added
 * dry matter is split between the groups in the target ratio's
 * proportion, using each group's best feed for the shortfall. If one
 * group has no feed, the other group takes it all.
 * `density` gives the nutrient per kg DM for a feed (CP per kg DM,
 * MJ per kg DM, or 1 for a plain DM shortfall).
 */
function addForDeficit(
  q: FeedQty[],
  deficit: number,
  density: (item: SuggestFeedItem) => number,
  targets: RationTargets,
): boolean {
  const concFeeds = q.filter((x) => x.item.feedType === 'concentrate');
  const fodderFeeds = q.filter((x) => x.item.feedType === 'fodder');
  const bestConc =
    concFeeds.length > 0
      ? concFeeds.reduce((a, b) => (density(b.item) > density(a.item) ? b : a))
      : null;
  const bestFodder =
    fodderFeeds.length > 0
      ? fodderFeeds.reduce((a, b) => (density(b.item) > density(a.item) ? b : a))
      : null;
  if (!bestConc && !bestFodder) return false;

  const concShare = targets.targetConcentratePct / 100;
  const fodderShare = 1 - concShare;
  // Nutrient gained per kg of added DM, with the DM split by the ratio.
  let perDm = 0;
  if (bestConc) perDm += concShare * density(bestConc.item);
  if (bestFodder) perDm += fodderShare * density(bestFodder.item);
  // If a group is absent, its share of the added DM goes to the other
  // group instead (the ratio cannot be kept without that group anyway).
  if (!bestConc) perDm = density(bestFodder!.item);
  if (!bestFodder) perDm = density(bestConc!.item);
  if (perDm <= 0) return false;

  const totalDmToAdd = deficit / perDm;
  const addTo = (entry: FeedQty | null, dmToAdd: number): void => {
    if (!entry || dmToAdd <= 0) return;
    const perKg = entry.item.dmPercent / 100;
    if (perKg <= 0) return;
    entry.qtyKg = round1(entry.qtyKg + ceilStep(dmToAdd / perKg));
  };
  if (bestConc && bestFodder) {
    addTo(bestConc, totalDmToAdd * concShare);
    addTo(bestFodder, totalDmToAdd * fodderShare);
  } else if (bestConc) {
    addTo(bestConc, totalDmToAdd);
  } else {
    addTo(bestFodder, totalDmToAdd);
  }
  return true;
}

/**
 * Add feed until every requirement is met, always in the target ratio's
 * proportion. If a requirement cannot be met at all with these feeds
 * (e.g. every feed has 0% CP but CP is required), it stops and leaves
 * the ration infeasible — the caller then discards that combination.
 */
function repair(qtys: FeedQty[], targets: RationTargets): FeedQty[] {
  const q = qtys.map((x) => ({ ...x }));
  let guard = 0;
  while (guard++ < 200) {
    const t = totalsFor(q);
    if (isFeasible(t, targets)) break;
    const cpDef = targets.cpReq - t.cp;
    const enDef = targets.energyReq - t.energy;
    const dmDef = targets.dmReq - t.dm;
    let fixed = false;
    if (cpDef > 1e-9) {
      fixed = addForDeficit(q, cpDef, (item) => {
        const dm = item.dmPercent || 1;
        return (item.cpPercent || 0) / dm;
      }, targets);
    } else if (enDef > 1e-9) {
      fixed = addForDeficit(q, enDef, (item) => {
        const dm = item.dmPercent || 1;
        return ((item.meEnergy || 0) * 100) / dm;
      }, targets);
    } else if (dmDef > 1e-9) {
      fixed = addForDeficit(q, dmDef, () => 1, targets);
    }
    if (!fixed) break;
  }
  return q;
}

// ------------------------------------------------------------------
// Ratio-aware trim
// ------------------------------------------------------------------

/**
 * The most a feed can lose (kg as-fed) without pushing the ratio more
 * than RATIO_TOL_PTS off target. Reducing a concentrate lowers the
 * concentrate share; reducing a fodder raises it.
 */
function maxReductionByRatio(
  entry: FeedQty,
  q: FeedQty[],
  targets: RationTargets,
): number {
  const tol = RATIO_TOL_PTS;
  const target = targets.targetConcentratePct;
  let concDm = 0;
  let totalDm = 0;
  for (const x of q) {
    const dm = (x.qtyKg * x.item.dmPercent) / 100;
    totalDm += dm;
    if (x.item.feedType === 'concentrate') concDm += dm;
  }
  const d = entry.item.dmPercent / 100;
  if (d <= 0 || totalDm <= 0) return 0;
  if (entry.item.feedType === 'concentrate') {
    const k = (target - tol) / 100;
    const denom = d * (1 - k);
    if (denom <= 0) return 0;
    return Math.max(0, (concDm - k * totalDm) / denom);
  }
  const k = (target + tol) / 100;
  const denom = k * d;
  if (denom <= 0) return 0;
  return Math.max(0, (k * totalDm - concDm) / denom);
}

/**
 * The most a feed can lose (kg as-fed) without dropping below its
 * minimum share of its group's DM (e.g. the yield feed in Auto mode
 * must stay at least half the concentrate). Reducing a feed lowers
 * its share of the group.
 */
function maxReductionByMinShare(
  entry: FeedQty,
  q: FeedQty[],
  minShareById: Map<string, number>,
): number {
  const min = minShareById.get(entry.item.id);
  if (min === undefined) return Infinity;
  let groupDm = 0;
  let feedDm = 0;
  for (const x of q) {
    if (x.item.feedType !== entry.item.feedType) continue;
    const dm = (x.qtyKg * x.item.dmPercent) / 100;
    groupDm += dm;
    if (x.item.id === entry.item.id) feedDm = dm;
  }
  const d = entry.item.dmPercent / 100;
  if (d <= 0 || groupDm <= 0) return 0;
  const denom = d * (1 - min);
  if (denom <= 0) return 0;
  return Math.max(0, (feedDm - min * groupDm) / denom);
}

/**
 * Shave the ration down to the smallest one that still meets every
 * requirement AND keeps the ratio within tolerance. For each feed, work
 * out the most it can lose without breaking DM, CP, Energy, the ratio
 * or the 0.5 kg minimum, and take that off in one step. Repeat until
 * no feed can lose even 0.1 kg. This is what makes the result "very
 * near, slightly above" instead of far above the requirement.
 */
function trim(
  qtys: FeedQty[],
  targets: RationTargets,
  minShareById?: Map<string, number>,
): FeedQty[] {
  const q = qtys.map((x) => ({ ...x }));
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 50) {
    improved = false;
    for (const entry of q) {
      const t = totalsFor(q);
      const dmSlack = t.dm - targets.dmReq;
      const cpSlack = t.cp - targets.cpReq;
      const enSlack = t.energy - targets.energyReq;
      let maxRed = entry.qtyKg - MIN_QTY_KG;
      if (entry.item.dmPercent > 0)
        maxRed = Math.min(maxRed, dmSlack / (entry.item.dmPercent / 100));
      if (entry.item.cpPercent > 0)
        maxRed = Math.min(maxRed, cpSlack / (entry.item.cpPercent / 100));
      if (entry.item.meEnergy > 0)
        maxRed = Math.min(maxRed, enSlack / entry.item.meEnergy);
      maxRed = Math.min(maxRed, maxReductionByRatio(entry, q, targets));
      if (minShareById && minShareById.size > 0) {
        maxRed = Math.min(
          maxRed,
          maxReductionByMinShare(entry, q, minShareById),
        );
      }
      const red = Math.floor(maxRed / STEP_KG + 1e-9) * STEP_KG;
      if (red >= STEP_KG - 1e-9) {
        entry.qtyKg = round1(entry.qtyKg - red);
        improved = true;
      }
    }
  }
  return q;
}

// ------------------------------------------------------------------
// Blends
// ------------------------------------------------------------------

/** A blend: feed id -> share of its group's DM (sums to 1). */
type Blend = Map<string, number>;

const blendKey = (blend: Blend): string =>
  [...blend.entries()]
    // String() guard: a caller passing a numeric DB id (instead of the
    // prefixed string id) used to crash here with "localeCompare is not
    // a function". The id is only a dedupe key, so coercing is safe.
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([id, share]) => `${id}:${share.toFixed(2)}`)
    .join(',');

/**
 * Candidate blends for one group. EVERY blend uses ALL the group's
 * feeds — a minimum share keeps each one genuinely in the mix, so no
 * selected ingredient is ever dropped from the suggestion.
 */
function groupCandidates(group: SuggestFeedItem[]): Blend[] {
  const candidates: Blend[] = [];
  const seen = new Set<string>();
  const add = (weights: number[]): void => {
    const w = weights.map((x) => Math.max(x, 0.02));
    const sum = w.reduce((a, b) => a + b, 0);
    if (sum <= 0) return;
    const blend: Blend = new Map();
    group.forEach((item, i) => {
      const share = w[i] / sum;
      if (share > 0.001) blend.set(item.id, share);
    });
    if (blend.size === 0) return;
    const key = blendKey(blend);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(blend);
  };
  if (group.length === 0) return candidates;
  const n = group.length;

  add(group.map(() => 1));

  // Each feed dominant (80% / 70% / 50% / 30%), the rest sharing what
  // is left. The high shares matter when one feed is much leaner than
  // the others: e.g. concentrates-only with a low-CP feed needs that
  // feed near 90% of the group to keep CP near its requirement.
  if (n > 1) {
    for (let i = 0; i < n; i++) {
      for (const s of [0.8, 0.7, 0.5, 0.3]) {
        add(group.map((_, j) => (j === i ? s : (1 - s) / (n - 1))));
      }
    }
  }

  add(
    group.map((item) => {
      const dm = item.dmPercent || 1;
      return (item.cpPercent || 0) / dm;
    }),
  );
  add(
    group.map((item) => {
      const dm = item.dmPercent || 1;
      return ((item.meEnergy || 0) * 100) / dm;
    }),
  );

  return candidates;
}

/**
 * Hill-climb a blend so its CP and Energy densities sit as close as
 * possible to the group's fair share of the targets. Starting from the
 * equal blend, repeatedly shift 0.05 of DM share between two feeds
 * when it pulls the blend closer. All feeds stay in the blend.
 */
function refineBlend(
  group: SuggestFeedItem[],
  dmTarget: number,
  cpTarget: number,
  energyTarget: number,
): Blend | null {
  if (group.length <= 1 || dmTarget <= 0) return null;
  const targetCpDensity = cpTarget / dmTarget;
  const targetEnergyDensity = energyTarget / dmTarget;
  const useCp = targetCpDensity > 0;
  const useEnergy = targetEnergyDensity > 0;
  if (!useCp && !useEnergy) return null;

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
  const errorOf = (shares: number[]): number => {
    let cp = 0;
    let energy = 0;
    shares.forEach((s, i) => {
      cp += s * density[i].cp;
      energy += s * density[i].energy;
    });
    let err = 0;
    if (useCp) err += (cp - 1) * (cp - 1);
    if (useEnergy) err += (energy - 1) * (energy - 1);
    return err;
  };

  let shares = group.map(() => 1 / group.length);
  let bestErr = errorOf(shares);
  const step = 0.05;
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 200) {
    improved = false;
    for (let i = 0; i < group.length; i++) {
      for (let j = 0; j < group.length; j++) {
        if (i === j || shares[j] - step < 0.02) continue;
        const next = [...shares];
        next[i] += step;
        next[j] -= step;
        const err = errorOf(next);
        if (err < bestErr - 1e-9) {
          bestErr = err;
          shares = next;
          improved = true;
        }
      }
    }
  }
  const blend: Blend = new Map();
  group.forEach((item, i) => {
    if (shares[i] > 0.001) blend.set(item.id, shares[i]);
  });
  return blend.size > 0 ? blend : null;
}

/** Turn a blend into as-fed quantities (1 decimal, >= 0.5 kg each). */
function allocateFromBlend(
  group: SuggestFeedItem[],
  blend: Blend,
  dmTarget: number,
): FeedQty[] {
  const out: FeedQty[] = [];
  group.forEach((item) => {
    const share = blend.get(item.id) || 0;
    if (share <= 0 || dmTarget <= 0) return;
    const dmKg = dmTarget * share;
    let qtyKg = round1(dmKg / (item.dmPercent / 100));
    if (qtyKg < MIN_QTY_KG) qtyKg = MIN_QTY_KG;
    out.push({ item, qtyKg });
  });
  return out;
}

/** How far a feasible ration sits above the requirements (lower = nearer). */
function scoreSolution(t: Totals, targets: RationTargets): number {
  const cpExcess = (t.cp - targets.cpReq) / targets.cpReq;
  const enExcess = (t.energy - targets.energyReq) / targets.energyReq;
  const dmExcess = (t.dm - targets.dmReq) / targets.dmReq;
  return cpExcess + enExcess + dmExcess;
}

function totalCostOf(qtys: FeedQty[]): number {
  return qtys.reduce((acc, q) => acc + q.qtyKg * q.item.pricePerKg, 0);
}

// ------------------------------------------------------------------
// Core solver: best quantities for one fixed set of feeds.
// The DM split is the target ratio and never moves; repair and trim
// both keep it there. Returns null when these feeds cannot meet the
// requirements at all.
// ------------------------------------------------------------------

function solveFeedSet(
  feeds: SuggestFeedItem[],
  targets: RationTargets,
  minShareById?: Map<string, number>,
): FeedQty[] | null {
  if (feeds.length === 0 || targets.dmReq <= 0) return null;
  const concGroup = feeds.filter((item) => item.feedType === 'concentrate');
  const fodderGroup = feeds.filter((item) => item.feedType === 'fodder');
  const bothGroups = concGroup.length > 0 && fodderGroup.length > 0;
  const concTargetDm = bothGroups
    ? (targets.dmReq * targets.targetConcentratePct) / 100
    : concGroup.length > 0
      ? targets.dmReq
      : 0;
  const fodderTargetDm = bothGroups
    ? (targets.dmReq * targets.targetFodderPct) / 100
    : fodderGroup.length > 0
      ? targets.dmReq
      : 0;
  // Each group's fair share of the CP / Energy requirement, by DM share.
  const concShare = targets.dmReq > 0 ? concTargetDm / targets.dmReq : 0;
  const fodderShare = targets.dmReq > 0 ? fodderTargetDm / targets.dmReq : 0;

  let concCandidates = groupCandidates(concGroup);
  let fodderCandidates = groupCandidates(fodderGroup);
  // The hill-climbed blend for each group (closest to its fair share).
  const concRefined = refineBlend(
    concGroup,
    concTargetDm,
    targets.cpReq * concShare,
    targets.energyReq * concShare,
  );
  const fodderRefined = refineBlend(
    fodderGroup,
    fodderTargetDm,
    targets.cpReq * fodderShare,
    targets.energyReq * fodderShare,
  );
  const addIfNew = (list: Blend[], blend: Blend | null): void => {
    if (!blend) return;
    const key = blendKey(blend);
    if (!list.some((b) => blendKey(b) === key)) list.push(blend);
  };
  addIfNew(concCandidates, concRefined);
  addIfNew(fodderCandidates, fodderRefined);
  // A feed with a minimum share (e.g. the yield feed in Auto mode must
  // be at least half the concentrate) only allows blends that give it
  // that share. If that empties a group, fall back to all its blends.
  if (minShareById && minShareById.size > 0) {
    const satisfies = (blend: Blend, group: SuggestFeedItem[]): boolean => {
      for (const [id, min] of minShareById) {
        if (!group.some((item) => item.id === id)) continue;
        if ((blend.get(id) || 0) < min - 1e-9) return false;
      }
      return true;
    };
    const concFiltered = concCandidates.filter((b) => satisfies(b, concGroup));
    const fodderFiltered = fodderCandidates.filter((b) => satisfies(b, fodderGroup));
    if (concFiltered.length > 0) concCandidates = concFiltered;
    if (fodderFiltered.length > 0) fodderCandidates = fodderFiltered;
  }
  if (concCandidates.length === 0 && fodderCandidates.length === 0) return null;

  const concOptions =
    concCandidates.length > 0 ? concCandidates : [new Map<string, number>()];
  const fodderOptions =
    fodderCandidates.length > 0 ? fodderCandidates : [new Map<string, number>()];

  let best: FeedQty[] | null = null;
  let bestScore = Infinity;
  for (const concBlend of concOptions) {
    for (const fodderBlend of fodderOptions) {
      const qtys: FeedQty[] = [
        ...allocateFromBlend(concGroup, concBlend, concTargetDm),
        ...allocateFromBlend(fodderGroup, fodderBlend, fodderTargetDm),
      ];
      if (qtys.length === 0) continue;
      const repaired = repair(qtys, targets);
      const trimmed = trim(repaired, targets, minShareById);
      const t = totalsFor(trimmed);
      if (!isFeasible(t, targets) || !ratioOk(trimmed, targets)) continue;
      const score = scoreSolution(t, targets);
      if (score < bestScore) {
        bestScore = score;
        best = trimmed;
      }
    }
  }
  return best;
}

function buildResult(qtys: FeedQty[], targets: RationTargets): SuggestionResult {
  const rows: SuggestedRow[] = qtys.map(({ item, qtyKg }) => ({
    id: item.id,
    name: item.name,
    feedType: item.feedType,
    qtyKg,
    dmKg: Math.round(((qtyKg * item.dmPercent) / 100) * 100) / 100,
    cpKg: Math.round(((qtyKg * item.cpPercent) / 100) * 1000) / 1000,
    energyMj: Math.round(qtyKg * item.meEnergy * 10) / 10,
    cost: Math.round(qtyKg * item.pricePerKg),
  }));
  const totalDm = Math.round(rows.reduce((acc, r) => acc + r.dmKg, 0) * 100) / 100;
  const totalCp =
    Math.round(rows.reduce((acc, r) => acc + r.cpKg, 0) * 1000) / 1000;
  const totalEnergy =
    Math.round(rows.reduce((acc, r) => acc + r.energyMj, 0) * 10) / 10;
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

// ------------------------------------------------------------------
// Manual mode: the user picks the ingredients; every one is used.
// ------------------------------------------------------------------

export function suggestRation(
  items: SuggestFeedItem[],
  selectedIds: string[],
  targets: RationTargets,
): SuggestionResult | null {
  if (!targets || targets.dmReq <= 0) return null;
  const selected = items.filter(
    (item) => selectedIds.includes(item.id) && (item.dmPercent || 0) > 0,
  );
  if (selected.length === 0) return null;
  const best = solveFeedSet(selected, targets);
  if (!best) return null;
  return buildResult(best, targets);
}

function shortlist(group: SuggestFeedItem[], maxCount: number): SuggestFeedItem[] {
  if (group.length === 0) return [];
  // Cheapest dry matter first.
  const byDmCost = [...group].sort((a, b) => {
    const aDm = a.dmPercent > 0 ? a.pricePerKg / (a.dmPercent / 100) : Infinity;
    const bDm = b.dmPercent > 0 ? b.pricePerKg / (b.dmPercent / 100) : Infinity;
    return aDm - bDm;
  });
  const picked: SuggestFeedItem[] = [];
  const addIfNew = (item: SuggestFeedItem | undefined): void => {
    if (item && !picked.some((x) => x.id === item.id)) picked.push(item);
  };
  byDmCost.slice(0, maxCount).forEach(addIfNew);
  // Best CP density and best Energy density of the group.
  addIfNew(
    group.reduce((a, b) => {
      const aD = (a.cpPercent || 0) / (a.dmPercent || 1);
      const bD = (b.cpPercent || 0) / (b.dmPercent || 1);
      return bD > aD ? b : a;
    }),
  );
  addIfNew(
    group.reduce((a, b) => {
      const aD = ((a.meEnergy || 0) * 100) / (a.dmPercent || 1);
      const bD = ((b.meEnergy || 0) * 100) / (b.dmPercent || 1);
      return bD > aD ? b : a;
    }),
  );
  return picked.slice(0, Math.max(maxCount, 2));
}

/** All subsets of size 1..maxSize from a list. */
function subsets<T>(list: T[], maxSize: number): T[][] {
  const out: T[][] = [];
  const n = list.length;
  const take = (start: number, current: T[]): void => {
    if (current.length > 0) out.push([...current]);
    if (current.length >= maxSize) return;
    for (let i = start; i < n; i++) {
      current.push(list[i]);
      take(i + 1, current);
      current.pop();
    }
  };
  take(0, []);
  return out;
}

// ------------------------------------------------------------------
// Auto mode: mandatory feeds + Change variants.
//
// The user picks nothing — the solver builds the ration from the
// MUST-USE feeds, plus 1-3 other ingredients, at the lowest cost.
//
// MUST-USE (concentrate):
//   Dairy — by milk yield: 0-7 L Nourish Gowala Dairy, 7-14 L Nourish
//   Advanced Dairy, 14+ L Nourish Prime Dairy. Fattening — by daily
//   weight gain: over 450 g Nourish Prime Fattening, 450 g or less
//   Nourish Sumo Fattening. And Nourish Bhushi Mix, always.
// MUST-USE (fodder): Green Grass (Napier), plus Straw or Silage.
// Then 1-3 other ingredients from the rest, cheapest first.
// Names are matched loosely (lowercase, no spaces, "Nourish" prefix
// optional) so "Nourish Prime Dairy", "Prime Dairy", "Bhushimix" and
// "Bhushi Mix" all match.
//
// Change: the solver builds EVERY valid combination, cheapest first,
// and the Change button steps to the next one — the must-use feeds
// stay fixed, only the other ingredients change, so each tap gives a
// different ration. `variant` is the index into that cost order
// (0 = cheapest). If a must-use feed is not in the database at all,
// it is simply left out and the rest still works.
// ------------------------------------------------------------------

export interface AutoContext {
  kind: 'dairy' | 'fattening';
  /** Dairy: milk yield in litres/day. */
  milkYieldL?: number;
  /** Fattening: target daily weight gain in g/day. */
  weightGainG?: number;
}

export interface AutoSuggestionResult extends SuggestionResult {
  /** Which combination this is (0 = cheapest). */
  variantIndex: number;
  /** How many combinations there are (for the Change cycle). */
  variantCount: number;
  /** The must-use feeds in this ration. */
  mandatoryIds: string[];
}

/** Normalised name: lowercase, letters/digits only. */
const normName = (name: string): string =>
  (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function findFeed(
  items: SuggestFeedItem[],
  feedType: 'concentrate' | 'fodder',
  ...needles: string[]
): SuggestFeedItem | undefined {
  return items.find((item) => {
    if (item.feedType !== feedType) return false;
    if ((item.dmPercent || 0) <= 0) return false;
    const n = normName(item.name);
    return needles.every((needle) => n.includes(needle));
  });
}

/**
 * The must-use feeds for this animal. Returns the concentrate musts
 * (yield feed + Bhushi Mix), the fodder must (Green Grass) and the
 * Straw-or-Silage alternatives (either one satisfies the rule), plus
 * the yield feed itself — it is the main concentrate, so in Auto it
 * must be at least half the concentrate DM.
 */
function mandatoryFeeds(
  items: SuggestFeedItem[],
  context: AutoContext,
): {
  concMandatory: SuggestFeedItem[];
  fodderMandatory: SuggestFeedItem[];
  strawOrSilage: SuggestFeedItem[];
  yieldFeed: SuggestFeedItem | undefined;
} {
  const concMandatory: SuggestFeedItem[] = [];
  const fodderMandatory: SuggestFeedItem[] = [];
  const addIfFound = (
    list: SuggestFeedItem[],
    item: SuggestFeedItem | undefined,
  ): void => {
    if (item && !list.some((x) => x.id === item.id)) list.push(item);
  };

  // The Nourish feed for this animal.
  let yieldFeed: SuggestFeedItem | undefined;
  if (context.kind === 'dairy') {
    const milk = context.milkYieldL || 0;
    if (milk < 7) yieldFeed = findFeed(items, 'concentrate', 'gowala');
    else if (milk < 14) yieldFeed = findFeed(items, 'concentrate', 'advanced');
    else yieldFeed = findFeed(items, 'concentrate', 'prime', 'dairy');
  } else {
    const gain = context.weightGainG || 0;
    if (gain > 450) yieldFeed = findFeed(items, 'concentrate', 'prime', 'fattening');
    else yieldFeed = findFeed(items, 'concentrate', 'sumo');
  }
  addIfFound(concMandatory, yieldFeed);
  addIfFound(concMandatory, findFeed(items, 'concentrate', 'bhushi'));

  // Green Grass — Napier is the green grass in this app.
  addIfFound(
    fodderMandatory,
    findFeed(items, 'fodder', 'greengrass') ||
      findFeed(items, 'fodder', 'napier'),
  );

  const strawOrSilage: SuggestFeedItem[] = [];
  addIfFound(strawOrSilage, findFeed(items, 'fodder', 'straw'));
  addIfFound(strawOrSilage, findFeed(items, 'fodder', 'silage'));
  // A feed with no price in the database arrives as price 0 — it is
  // NOT free, its cost is just unknown. If a priced alternative
  // exists, the unpriced one is dropped here, or it would win the
  // cheapest search by looking free (Silage has no price in the DB).
  // If none of them has a price, keep them all so a ration is still
  // possible.
  const pricedStrawOrSilage = strawOrSilage.filter(
    (item) => (item.pricePerKg || 0) > 0,
  );
  const finalStrawOrSilage =
    pricedStrawOrSilage.length > 0 ? pricedStrawOrSilage : strawOrSilage;

  return { concMandatory, fodderMandatory, strawOrSilage: finalStrawOrSilage, yieldFeed };
}

export function suggestRationAuto(
  items: SuggestFeedItem[],
  targets: RationTargets,
  context: AutoContext,
  variant = 0,
): AutoSuggestionResult | null {
  if (!targets || targets.dmReq <= 0) return null;
  const usable = items.filter((item) => (item.dmPercent || 0) > 0);
  if (usable.length === 0) return null;

  const { concMandatory, fodderMandatory, strawOrSilage, yieldFeed } = mandatoryFeeds(
    usable,
    context,
  );
  const hasMandatory =
    concMandatory.length > 0 ||
    fodderMandatory.length > 0 ||
    strawOrSilage.length > 0;

  // "Lowest cost" only means something when the cost is known. A feed
  // with no price in the database arrives here as price 0 — it is NOT
  // free, its cost is just unknown, so it must not win the cheapest
  // search by looking free (e.g. Silage has no price in the DB). Only
  // feeds with a real price are candidates for the OPTIONAL pool. If a
  // whole group has no priced feed at all, fall back to all its feeds
  // so a ration is still possible.
  const priced = (group: SuggestFeedItem[]): SuggestFeedItem[] => {
    const withPrice = group.filter((item) => (item.pricePerKg || 0) > 0);
    return withPrice.length > 0 ? withPrice : group;
  };

  // If none of the must-use feeds could be found at all (e.g. an
  // empty or differently-named feed list), fall back to the plain
  // lowest-cost search over the shortlisted feeds.
  if (!hasMandatory) {
    const concGroup = usable.filter((item) => item.feedType === 'concentrate');
    const fodderGroup = usable.filter((item) => item.feedType === 'fodder');
    const concShort = shortlist(priced(concGroup), 4);
    const fodderShort = shortlist(priced(fodderGroup), 4);
    const concSets =
      concShort.length > 0 ? subsets(concShort, 2) : [[] as SuggestFeedItem[]];
    const fodderSets =
      fodderShort.length > 0 ? subsets(fodderShort, 2) : [[] as SuggestFeedItem[]];
    let best: FeedQty[] | null = null;
    let bestCost = Infinity;
    for (const concSet of concSets) {
      for (const fodderSet of fodderSets) {
        const feeds = [...concSet, ...fodderSet];
        if (feeds.length === 0) continue;
        const solved = solveFeedSet(feeds, targets);
        if (!solved) continue;
        const cost = totalCostOf(solved);
        if (cost < bestCost - 1e-9) {
          bestCost = cost;
          best = solved;
        }
      }
    }
    if (!best) return null;
    return {
      ...buildResult(best, targets),
      variantIndex: 0,
      variantCount: 1,
      mandatoryIds: [],
    };
  }

  const mandatoryIds = new Set<string>([
    ...concMandatory.map((i) => i.id),
    ...fodderMandatory.map((i) => i.id),
    ...strawOrSilage.map((i) => i.id),
  ]);
  const concGroup = usable.filter((item) => item.feedType === 'concentrate');
  const fodderGroup = usable.filter((item) => item.feedType === 'fodder');
  const optionalPool = [
    ...shortlist(
      priced(concGroup.filter((item) => !mandatoryIds.has(item.id))),
      3,
    ),
    ...shortlist(
      priced(fodderGroup.filter((item) => !mandatoryIds.has(item.id))),
      3,
    ),
  ];
  // 1-3 other ingredients, from either group.
  const optionalSets = subsets(optionalPool, 3).filter((s) => s.length >= 1);
  // Straw or Silage: either one satisfies the fodder rule (if neither
  // exists, the fodder musts are just the Green Grass).
  const strawChoices: SuggestFeedItem[][] =
    strawOrSilage.length > 0
      ? strawOrSilage.map((item) => [item])
      : [[]];

  // Every valid combination, cheapest first. The must-use feeds are in
  // every one; only the other ingredients vary. The yield feed is the
  // main concentrate — it must be at least half the concentrate DM, so
  // it is never just a token 0.5 kg while a cheaper feed dominates.
  const minShareById =
    yieldFeed && concMandatory.some((i) => i.id === yieldFeed.id)
      ? new Map<string, number>([[yieldFeed.id, 0.5]])
      : undefined;
  const candidates: { qtys: FeedQty[]; cost: number }[] = [];
  for (const strawChoice of strawChoices) {
    for (const optionalSet of optionalSets) {
      const feeds = [
        ...concMandatory,
        ...fodderMandatory,
        ...strawChoice,
        ...optionalSet,
      ];
      if (feeds.length === 0) continue;
      const solved = solveFeedSet(feeds, targets, minShareById);
      if (!solved) continue;
      candidates.push({ qtys: solved, cost: totalCostOf(solved) });
    }
  }
  // If the optional pool was empty (no other ingredients at all), the
  // must-use feeds alone are still a valid ration.
  if (candidates.length === 0) {
    for (const strawChoice of strawChoices) {
      const feeds = [...concMandatory, ...fodderMandatory, ...strawChoice];
      if (feeds.length === 0) continue;
      const solved = solveFeedSet(feeds, targets, minShareById);
      if (!solved) continue;
      candidates.push({ qtys: solved, cost: totalCostOf(solved) });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.cost - b.cost);
  const index =
    candidates.length > 0
      ? ((variant % candidates.length) + candidates.length) % candidates.length
      : 0;
  const chosen = candidates[index];
  return {
    ...buildResult(chosen.qtys, targets),
    variantIndex: index,
    variantCount: candidates.length,
    mandatoryIds: [...mandatoryIds].filter((id) =>
      chosen.qtys.some((q) => q.item.id === id),
    ),
  };
}
