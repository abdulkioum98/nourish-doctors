/**
 * Aqua Guide — reference tables for fish farming, from the Nourish
 * Floating Fish Feed booklet. ALL in English. Static data (no database
 * table) — like the Cattle Health data in cattleHealth.ts.
 * Used by AquaGuidePage.tsx (Aqua Tools section).
 */

export interface FeedingRateRow {
  feed: string;
  size: string;
  weight: string;
  rate: string;
  times: string;
}

export interface FeedingRateSpecies {
  id: string;
  name: string;
  rows: FeedingRateRow[];
}

/** Feeding rate (% of body weight) by species — booklet, "Feed Management". */
export const FEEDING_RATES: FeedingRateSpecies[] = [
  {
    id: 'tilapia',
    name: 'Tilapia',
    rows: [
      { feed: 'Nursery', size: 'Powder', weight: '0.2-1.0 g', rate: '25-20%', times: '3-4 times' },
      { feed: 'Nursery-1', size: 'Pellet (0.50 mm)', weight: '1.0-3 g', rate: '20-18%', times: '3-4 times' },
      { feed: 'Nursery-2', size: 'Pellet (1.0 mm)', weight: '3-6 g', rate: '18-15%', times: '3-4 times' },
      { feed: 'Pre-Starter', size: 'Pellet (1.50 mm)', weight: '6-20 g', rate: '15-10%', times: '3-4 times' },
      { feed: 'Starter', size: 'Pellet (2.0 mm)', weight: '20-80 g', rate: '10-8%', times: '2-3 times' },
      { feed: 'Grower', size: 'Pellet (3.0 mm)', weight: '80-250 g', rate: '8-5%', times: '2-3 times' },
      { feed: 'Finisher', size: 'Pellet (4.0 mm)', weight: '250 g+', rate: '3-2%', times: '2-3 times' },
    ],
  },
  {
    id: 'pangas',
    name: 'Pangas',
    rows: [
      { feed: 'Nursery', size: 'Powder', weight: '0.2-1.0 g', rate: '25-20%', times: '3-4 times' },
      { feed: 'Nursery-1', size: 'Pellet (0.50 mm)', weight: '1.0-3 g', rate: '20-18%', times: '3-4 times' },
      { feed: 'Nursery-2', size: 'Pellet (1.0 mm)', weight: '3-6 g', rate: '18-15%', times: '3-4 times' },
      { feed: 'Pre-Starter', size: 'Pellet (1.50 mm)', weight: '6-20 g', rate: '15-10%', times: '3-4 times' },
      { feed: 'Starter', size: 'Pellet (2.0 mm)', weight: '20-100 g', rate: '10-5%', times: '2-3 times' },
      { feed: 'Grower', size: 'Pellet (3.0 mm)', weight: '100-500 g', rate: '5-3%', times: '2-3 times' },
      { feed: 'Grower + Finisher', size: 'Pellet (3.0+4.0 mm)', weight: '500 g-1 kg', rate: '3-2%', times: '2-3 times' },
      { feed: 'Finisher', size: 'Pellet (5.0 mm)', weight: '1 kg+', rate: '2%', times: '2 times' },
    ],
  },
  {
    id: 'koi',
    name: 'Koi',
    rows: [
      { feed: 'Nursery', size: 'Powder', weight: '0.2-1.0 g', rate: '40-20%', times: '3-4 times' },
      { feed: 'Nursery-1', size: 'Pellet (0.50 mm)', weight: '1.0-4 g', rate: '20-18%', times: '3-4 times' },
      { feed: 'Nursery-2', size: 'Pellet (1.0 mm)', weight: '4-7 g', rate: '18-15%', times: '3-4 times' },
      { feed: 'Pre-Starter', size: 'Pellet (1.50 mm)', weight: '7-20 g', rate: '15-10%', times: '3-4 times' },
      { feed: 'Starter', size: 'Pellet (2.0 mm)', weight: '20-50 g', rate: '10-8%', times: '2-3 times' },
      { feed: 'Grower', size: 'Pellet (3.0 mm)', weight: '50 g+', rate: '8-2.5%', times: '2-3 times' },
    ],
  },
  {
    id: 'carp',
    name: 'Carp',
    rows: [
      { feed: 'Nursery', size: 'Powder', weight: '0.2-1.0 g', rate: '25-20%', times: '3-4 times' },
      { feed: 'Nursery-1 & 2', size: 'Pellet (0.50 mm)', weight: '2-20 g', rate: '20-10%', times: '3-4 times' },
      { feed: 'Pre-Starter', size: 'Pellet (2.0 mm)', weight: '20-50 g', rate: '10-8%', times: '2-3 times' },
      { feed: 'Starter (Big)', size: 'Pellet (2.0 mm)', weight: '50-200 g', rate: '8-6%', times: '2-3 times' },
      { feed: 'Grower', size: 'Pellet (3.0 mm)', weight: '200-700 g', rate: '5-4%', times: '2-3 times' },
      { feed: 'Mixed Grower', size: 'Pellet (3.0 mm)', weight: '200-700 g', rate: '5-4%', times: '2-3 times' },
      { feed: 'Finisher', size: 'Pellet (5.0 mm)', weight: '700 g+', rate: '3-2%', times: '1-2 times' },
    ],
  },
];

export interface StockingRow {
  species: string;
  weight: string;
  single: string;
  mixed: string;
}

/** Stocking density per decimal (semi-intensive) — booklet. */
export const STOCKING_DENSITY: StockingRow[] = [
  { species: 'Pangas', weight: '50-100+ g', single: '100-150', mixed: '50-60' },
  { species: 'Tilapia', weight: '20-30+ g', single: '120-220', mixed: '70-100' },
  { species: 'Koi', weight: '1-3+ g', single: '600-1000', mixed: '150' },
  { species: 'Shing', weight: '1-3+ g', single: '400-500', mixed: '100-150' },
  { species: 'Magur', weight: '3-10+ g', single: '300-400', mixed: '50-70' },
  { species: 'Pabda', weight: '1-3+ g', single: '600-1000', mixed: 'Pabda 300, Gulsha 400, Carp 5-7' },
  { species: 'Gulsha', weight: '1-3+ g', single: '400-600', mixed: 'Pabda 300, Gulsha 400, Carp 5-7' },
  { species: 'Carp (mixed)', weight: '50-100+ g', single: '30-40', mixed: '15-20' },
  { species: 'Carp (Catfish)', weight: '500-1000+ g', single: '10-12', mixed: '-' },
];

export interface WaterRow {
  parameter: string;
  ideal: string;
}

/** Ideal pond water characteristics — booklet (Haque et al. 2020). */
export const WATER_QUALITY: WaterRow[] = [
  { parameter: 'Soil pH', ideal: '6.5-7.5' },
  { parameter: 'Water pH', ideal: '7.5-8.5' },
  { parameter: 'Water temperature', ideal: '25-32 °C' },
  { parameter: 'Dissolved oxygen', ideal: '5-8 mg/L or more' },
  { parameter: 'Dissolved CO2', ideal: '5-8 mg/L or less' },
  { parameter: 'Alkalinity', ideal: '25-100 mg/L' },
  { parameter: 'Hydrogen sulphide', ideal: 'Less than 0.002 mg/L' },
  { parameter: 'Ammonia', ideal: 'Less than 0.025 mg/L' },
  { parameter: 'Nitrite', ideal: '0.1-4.5 mg/L' },
  { parameter: 'Turbidity', ideal: '30-80 cm' },
  { parameter: 'Phosphorus', ideal: '0.01-3.0 mg/L' },
  { parameter: 'Hardness', ideal: '75-150 mg/L' },
  { parameter: 'Water colour', ideal: 'Light green, light brown' },
];

export interface PondFeedingRow {
  age: string;
  weight: string;
  rate: string;
  feed: string;
  times: string;
}

/** Catfish nursery pond feeding — booklet. */
export const NURSERY_FEEDING: PondFeedingRow[] = [
  { age: '1 day', weight: '0.33 g', rate: '35-25%', feed: 'Catfish Hatchery Powder', times: '4' },
  { age: '7 days', weight: '0.65 g', rate: '25-20%', feed: 'Pre-Nursery', times: '3' },
  { age: '15 days', weight: '1.25 g', rate: '20-15%', feed: 'Pre-Nursery', times: '3' },
  { age: '30 days', weight: '3.00 g', rate: '15-12%', feed: 'Nursery', times: '3' },
  { age: '45 days', weight: '5.00 g', rate: '12-10%', feed: 'Nursery', times: '2' },
];

/** Catfish stocking pond feeding (from transfer to 6-7 months) — booklet. */
export const STOCKING_FEEDING: PondFeedingRow[] = [
  { age: '1 day', weight: '5.00 g', rate: '12-10%', feed: 'Nursery', times: '3' },
  { age: '15 days', weight: '7.00 g', rate: '10-8%', feed: 'Starter', times: '3-2' },
  { age: '30 days', weight: '9.5 g', rate: '8-7%', feed: 'Starter', times: '3-2' },
  { age: '45 days', weight: '12.5 g', rate: '7-6%', feed: 'Starter', times: '2' },
  { age: '60 days', weight: '17.00 g', rate: '6-5%', feed: 'Starter', times: '2' },
  { age: '75 days', weight: '22.00 g', rate: '5-4%', feed: 'Starter', times: '2' },
  { age: '90 days', weight: '27.00 g', rate: '4-3.5%', feed: 'Grower', times: '2' },
  { age: '105 days', weight: '33.00 g', rate: '3.5-3%', feed: 'Grower', times: '2' },
  { age: '120 days', weight: '39.00 g', rate: '3-2.5%', feed: 'Grower', times: '2' },
  { age: '135 days', weight: '45.00 g', rate: '2.5-2%', feed: 'Grower', times: '2-1' },
];

export interface LimeRow {
  ph: string;
  area: string;
  limestone: string;
  burntLime: string;
}

/** Lime dose during pond preparation — booklet (DoF, Bangladesh). */
export const LIME_DOSE: LimeRow[] = [
  { ph: '5-6', area: '1 decimal', limestone: '8 kg', burntLime: '4 kg' },
  { ph: '6-7', area: '1 decimal', limestone: '2 kg', burntLime: '1 kg' },
];

export interface FertilizerRow {
  name: string;
  preparation: string;
  culture: string;
}

/** Fertilizer dose — booklet. */
export const FERTILIZER_DOSE: FertilizerRow[] = [
  { name: 'Mustard oil cake', preparation: '100-200 g', culture: '50-100 g' },
  { name: 'Urea', preparation: '100-150 g', culture: 'Not needed' },
  { name: 'TSP / DAP', preparation: '75-100 g', culture: '50-75 g' },
  { name: 'Molasses', preparation: '50-100 g', culture: '40-50 g' },
];
