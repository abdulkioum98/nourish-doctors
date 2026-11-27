// Extra feed details from the Nourish product file
// (poultry___cattle_products.pptx) — bag photos, bag colours, consumption,
// body weight, feeding duration and the transition plan. These are
// DISPLAY-ONLY details: the calculator parameters (DM / CP / ME / price)
// still come from the Supabase tables, exactly as before.
// Images live in public/feed-images/ (bundled with the app, so they work
// offline). Lookup is by feed name, normalised, so a slightly different
// spelling in the database still finds its picture.

const norm = (name: string): string =>
  (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// ---------------------------------------------------------------------------
// Broiler feeds
// ---------------------------------------------------------------------------

export interface BroilerExtra {
  /** Bag photo (the product pack). */
  bagImage: string;
  /** Loose-feed photo (the actual crumble / pellets). */
  feedImage?: string;
  bagColor: string;
  bagColorHex: string;
  consumption?: string;
  bodyWeight?: string;
  feedSize?: string;
  duration?: string;
  /** Day-by-day change-over to the next feed. */
  transition?: string[];
  note?: string;
}

const BROILER_EXTRA: Record<string, BroilerExtra> = {
  prestarter: {
    bagImage: '/feed-images/broiler-pre-starter.png',
    feedImage: '/feed-images/broiler-pre-starter-feed.jpg',
    bagColor: 'Red',
    bagColorHex: '#dc2626',
    consumption: '350 gm/bird',
    bodyWeight: '360 gm/bird',
    feedSize: 'Small Crumble (Pellet: 2.5 mm)',
    duration: '0-11 days',
    transition: ['10 days: 80% Pre Starter + 20% Starter', '11 days: 50% Pre Starter + 50% Starter', '12 days: 20% Pre Starter + 80% Starter'],
  },
  starter: {
    bagImage: '/feed-images/broiler-starter.jpg',
    feedImage: '/feed-images/broiler-starter-feed.jpg',
    bagColor: 'Blue',
    bagColorHex: '#2563eb',
    consumption: '850 gm/bird (Cumulative: 1200 gm)',
    bodyWeight: '978 gm/bird',
    feedSize: 'Big Crumble (Pellet: 3.5 mm)',
    duration: '12-21 days',
    transition: ['20 days: 80% Starter + 20% Grower', '21 days: 50% Starter + 50% Grower', '22 days: 20% Starter + 80% Grower'],
  },
  grower: {
    bagImage: '/feed-images/broiler-grower.jpg',
    feedImage: '/feed-images/broiler-grower-feed.jpg',
    bagColor: 'Green',
    bagColorHex: '#16a34a',
    consumption: '950 gm/bird (Cumulative: 2150 gm)',
    bodyWeight: '1567 gm/bird',
    feedSize: 'Pellet: 3 mm',
    duration: '22-28 days',
    transition: ['27 days: 80% Grower + 20% Finisher', '28 days: 50% Grower + 50% Finisher', '29 days: 20% Grower + 80% Finisher'],
  },
  finisher: {
    bagImage: '/feed-images/broiler-finisher.jpg',
    feedImage: '/feed-images/broiler-finisher-feed.jpg',
    bagColor: 'Navy Blue',
    bagColorHex: '#1e3a5f',
    feedSize: 'Pellet: 3 mm',
    duration: '29 days - Culling',
    note: 'Flashing Feed. Specially made for the later stage — more weight lifting with stability.',
  },
};

export function broilerExtraFor(feedName: string): BroilerExtra | null {
  const n = norm(feedName);
  if (!n) return null;
  if (n.includes('prestarter') || n.includes('pre-starter')) return BROILER_EXTRA.prestarter;
  if (n.includes('finisher')) return BROILER_EXTRA.finisher;
  if (n.includes('grower')) return BROILER_EXTRA.grower;
  if (n.includes('starter')) return BROILER_EXTRA.starter;
  return null; // e.g. Sales Centre Feed — no picture in the file
}

// ---------------------------------------------------------------------------
// Layer feeds — the picture for each feed (the spec values already come
// from the layer_feeds table, so only the image is needed here).
// ---------------------------------------------------------------------------

const LAYER_IMAGES: Array<{ match: (n: string) => boolean; image: string }> = [
  { match: (n) => n.includes('concentrat'), image: '/feed-images/layer-concentrated.png' },
  { match: (n) => n.includes('corporate'), image: '/feed-images/layer-corporate-mash.png' },
  { match: (n) => n.includes('lite'), image: '/feed-images/layer-lite.png' },
  { match: (n) => n.includes('layer2'), image: '/feed-images/layer-2.png' },
  { match: (n) => n.includes('layer1'), image: '/feed-images/layer-1.png' },
  { match: (n) => n.includes('prelayer'), image: '/feed-images/pre-layer.png' },
  { match: (n) => n.includes('grower'), image: '/feed-images/layer-grower.png' },
  { match: (n) => n.includes('starter'), image: '/feed-images/layer-starter.png' },
];

export function layerImageFor(feedName: string): string | null {
  const n = norm(feedName);
  if (!n) return null;
  // "Layer Grower Concentrate" has no picture in the product file, so it
  // stays blank — it must NOT fall through to the Concentrated bag photo
  // (that photo belongs to "Layer (Layer) Concentrate" only).
  if (n.includes('grower') && n.includes('concentrat')) return null;
  const hit = LAYER_IMAGES.find((entry) => entry.match(n));
  return hit ? hit.image : null;
}

// ---------------------------------------------------------------------------
// Sonali feeds (spec + picture, from the product file — no own table).
// ---------------------------------------------------------------------------

export interface SonaliFeed {
  name: string;
  image: string;
  moisture: string;
  cp: string;
  fiber: string;
  calcium: string;
  phosphorus: string;
  methionine: string;
  lysine: string;
  energy: string;
  form: string;
  duration: string;
}

export const SONALI_FEEDS: SonaliFeed[] = [
  {
    name: 'Sonali Starter',
    image: '/feed-images/sonali-starter-feed.jpg',
    moisture: '12',
    cp: '19',
    fiber: '5',
    calcium: '1',
    phosphorus: '0.42',
    methionine: '0.42',
    lysine: '1',
    energy: '2850',
    form: 'Crumble',
    duration: '1-25 days',
  },
  {
    name: 'Sonali Grower',
    image: '/feed-images/sonali-grower-feed.jpg',
    moisture: '12',
    cp: '17',
    fiber: '5',
    calcium: '1',
    phosphorus: '0.42',
    methionine: '0.42',
    lysine: '0.95',
    energy: '2900',
    form: 'Pellet',
    duration: '26 days - Culling',
  },
];

// ---------------------------------------------------------------------------
// Cattle products (finished feeds — separate from the cattle_feeds
// ingredients the calculator uses). Nutritional facts + bag photo, from
// the product file.
// ---------------------------------------------------------------------------

export interface CattleProduct {
  name: string;
  image: string;
  moisture: string;
  cp: string;
  fiber: string;
  fat: string;
  calcium: string;
  phosphorus: string;
  tdn: string;
}

export const CATTLE_PRODUCTS: CattleProduct[] = [
  { name: 'Prime Dairy', image: '/feed-images/prime-dairy.jpg', moisture: '12%', cp: '21%', fiber: '10%', fat: '4%', calcium: '1.25%', phosphorus: '0.45%', tdn: '62%' },
  { name: 'Advanced Dairy', image: '/feed-images/advanced-dairy.jpg', moisture: '12%', cp: '18%', fiber: '12%', fat: '4%', calcium: '1.25%', phosphorus: '0.5%', tdn: '64%' },
  { name: 'Gowala Dairy', image: '/feed-images/gowala-dairy.jpg', moisture: '12%', cp: '17%', fiber: '12%', fat: '3.5%', calcium: '1.25%', phosphorus: '0.45%', tdn: '60%' },
  { name: 'Prime Fattening', image: '/feed-images/prime-fattening.jpg', moisture: '12%', cp: '18%', fiber: '9%', fat: '4%', calcium: '1%', phosphorus: '0.45%', tdn: '67%' },
  { name: 'Sumo Fattening', image: '/feed-images/sumo-fattening.jpg', moisture: '12%', cp: '17%', fiber: '12%', fat: '3.5%', calcium: '1%', phosphorus: '0.45%', tdn: '60%' },
  { name: 'Calf Feed', image: '/feed-images/calf-feed.jpg', moisture: '12%', cp: '22%', fiber: '8%', fat: '2.5-3%', calcium: '1%', phosphorus: '0.5%', tdn: '65%' },
  { name: 'Bhushimix', image: '/feed-images/bhushimix.jpg', moisture: '12%', cp: '15%', fiber: '18%', fat: '3%', calcium: '1.5%', phosphorus: '0.5%', tdn: '65%' },
  { name: 'Silage', image: '/feed-images/silage.jpg', moisture: '65-70%', cp: '5-10%', fiber: '15-20%', fat: '2-3%', calcium: '1-1.5%', phosphorus: '1-1.5%', tdn: '65%' },
];

/** Calf Feed daily amount by age (weeks), from the product file. */
export const CALF_FEED_REQUIREMENT: Array<{ age: string; amount: string }> = [
  { age: '3 weeks', amount: '50-100 gm' },
  { age: '4 weeks', amount: '280-300 gm' },
  { age: '5 weeks', amount: '390-410 gm' },
  { age: '6 weeks', amount: '600-630 gm' },
  { age: '7 weeks', amount: '680-720 gm' },
  { age: '8 weeks', amount: '790-820 gm' },
  { age: '9 weeks', amount: '1000-1020 gm' },
  { age: '10 weeks', amount: '1200-1250 gm' },
  { age: '11 weeks', amount: '1400-1430 gm' },
  { age: '12 weeks', amount: '1400-1430 gm' },
];

export const CALF_FEED_NOTE = '3 Months - 6 months: 2 kg / Day / Calf';
