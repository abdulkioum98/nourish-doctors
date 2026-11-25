// Cattle Health reference data — BCS Score, Cow Dung Score and Diseases.
//
// BCS + Cow Dung Score + Metabolic diseases come from the Nourish PDF
// (Metabolic_Diseases_of_Cow_Presentation_Nourish.pdf).
// Infectious diseases are standard veterinary references (cause + signs).
// All photos live in public/cattle-health/ (bundled with the app, so they
// work offline).

export interface BcsScore {
  score: number;
  label: string;
  image: string;
  desc: string;
  /** danger = act now, low/high = watch, ideal = target. */
  status: 'danger' | 'low' | 'ideal' | 'high';
}

export const BCS_SCALE_IMAGE = '/cattle-health/bcs-scale.jpg';

export const BCS_SCORES: BcsScore[] = [
  {
    score: 1,
    label: 'Emaciated',
    image: '/cattle-health/bcs-1.jpg',
    desc: 'Exposed spine, deep hollows, no fat pads.',
    status: 'danger',
  },
  {
    score: 2,
    label: 'Thin',
    image: '/cattle-health/bcs-2.jpg',
    desc: 'Ribs and spine visible, very little fat cover.',
    status: 'low',
  },
  {
    score: 3,
    label: 'Ideal',
    image: '/cattle-health/bcs-3.jpg',
    desc: 'Good cover — ribs slightly visible, smooth back and tailhead.',
    status: 'ideal',
  },
  {
    score: 4,
    label: 'Fat',
    image: '/cattle-health/bcs-4.jpg',
    desc: 'Ribs hard to feel, fat building over the back and tailhead.',
    status: 'high',
  },
  {
    score: 5,
    label: 'Obese',
    image: '/cattle-health/bcs-5.jpg',
    desc: 'Heavy fat deposits around the tailhead; fatty liver, dystocia and ketosis risk.',
    status: 'danger',
  },
];

export const BCS_TARGETS: Array<{ stage: string; range: string }> = [
  { stage: 'Calving', range: '3.25 – 3.50' },
  { stage: 'Peak (60–90 DIM)', range: '2.75 – 3.00' },
  { stage: 'Late Lactation', range: '3.00 – 3.25' },
  { stage: 'Dry Off', range: '3.25 – 3.50' },
];

export const BCS_WARNING =
  'Losing more than 0.75–1.0 BCS in the first 60 days after calving means severe negative energy balance — poor conception and anovulation follow.';

export interface DungScore {
  score: number;
  label: string;
  image: string;
  desc: string;
  status: 'danger' | 'low' | 'ideal' | 'high';
}

export const DUNG_SCALE_IMAGE = '/cattle-health/dung-scale.jpg';

export const DUNG_SCORES: DungScore[] = [
  {
    score: 1,
    label: 'Watery',
    image: '/cattle-health/dung-1.jpg',
    desc: 'Very watery, no shape, spread out. May contain bubbles or mucus.',
    status: 'danger',
  },
  {
    score: 2,
    label: 'Loose',
    image: '/cattle-health/dung-2.jpg',
    desc: 'Wet and soft, flat shape, spreads easily. Under 2.5 cm high — excess fermentable starch.',
    status: 'low',
  },
  {
    score: 3,
    label: 'Ideal',
    image: '/cattle-health/dung-3.jpg',
    desc: 'Well formed, soft, holds shape. 4–5 cm high, central depression, concentric ring.',
    status: 'ideal',
  },
  {
    score: 4,
    label: 'Firm',
    image: '/cattle-health/dung-4.jpg',
    desc: 'Firm, dry surface, cracked. Over 5 cm thick — excess dry fibrous straw, lack of protein.',
    status: 'high',
  },
  {
    score: 5,
    label: 'Very Dry',
    image: '/cattle-health/dung-5.jpg',
    desc: 'Very dry, hard pellets, separate lumps — horse-like balls. Dehydrated cow.',
    status: 'danger',
  },
];

export const DUNG_KEY_POINTS: string[] = [
  'Ideal score: 2.5 – 3.5 (well formed, soft manure).',
  'Score below 2: may indicate poor fibre or digestive upset.',
  'Score above 4: may indicate inadequate water or fibre.',
];

export interface Disease {
  name: string;
  /** Viral / Bacterial / Metabolic */
  type: string;
  /** What causes it. */
  cause: string;
  /** 1–2 signs. */
  signs: string;
  /** Photo when one is available. */
  image?: string;
}

export const METABOLIC_DISEASES: Disease[] = [
  {
    name: 'Milk Fever (Hypocalcemia)',
    type: 'Metabolic',
    cause: 'Blood calcium falls after calving',
    signs: 'Weakness, trembling, unsteady gait, recumbency',
    image: '/cattle-health/disease-milk-fever.jpg',
  },
  {
    name: 'Ketosis',
    type: 'Metabolic',
    cause: 'Negative energy balance in early lactation',
    signs: 'Low appetite, milk drop, acetone-like breath',
    image: '/cattle-health/disease-ketosis.jpg',
  },
  {
    name: 'Fatty Liver Syndrome',
    type: 'Metabolic',
    cause: 'Excess fat mobilization overwhelms the liver',
    signs: 'Poor appetite, ketosis, low production',
    image: '/cattle-health/disease-fatty-liver.jpg',
  },
  {
    name: 'Grass Tetany (Hypomagnesemia)',
    type: 'Metabolic',
    cause: 'Low magnesium on lush pasture',
    signs: 'Twitching, staggering, convulsions',
    image: '/cattle-health/disease-grass-tetany.jpg',
  },
  {
    name: 'Displaced Abomasum',
    type: 'Metabolic',
    cause: 'Low rumen fill around calving',
    signs: 'Low appetite, low milk, less manure',
    image: '/cattle-health/disease-displaced-abomasum.jpg',
  },
  {
    name: 'Ruminal Acidosis (SARA)',
    type: 'Metabolic',
    cause: 'Excess fermentable carbohydrate, low fibre',
    signs: 'Loose manure, low milk fat, poor cud-chewing',
    image: '/cattle-health/disease-acidosis.jpg',
  },
];

export const INFECTIOUS_DISEASES: Disease[] = [
  {
    name: 'Foot-and-Mouth Disease (FMD)',
    type: 'Viral',
    cause: 'Aphthovirus',
    signs: 'Mouth and foot blisters, drooling, lameness',
    image: '/cattle-health/disease-fmd.jpg',
  },
  {
    name: 'Lumpy Skin Disease (LSD)',
    type: 'Viral',
    cause: 'Capripoxvirus, spread by biting insects',
    signs: 'Firm skin nodules, fever, milk drop',
    image: '/cattle-health/disease-lsd.jpg',
  },
  {
    name: 'Mastitis',
    type: 'Bacterial',
    cause: 'Bacteria entering through the teat',
    signs: 'Swollen hot udder, clots in milk, milk drop',
    image: '/cattle-health/disease-mastitis.jpg',
  },
  {
    name: 'Haemorrhagic Septicaemia (HS)',
    type: 'Bacterial',
    cause: 'Pasteurella multocida',
    signs: 'High fever, throat and neck swelling, breathing difficulty',
    image: '/cattle-health/disease-hs.jpg',
  },
  {
    name: 'Black Quarter (Blackleg)',
    type: 'Bacterial',
    cause: 'Clostridium chauvoei in soil',
    signs: 'Painful crackling muscle swelling, lameness',
    image: '/cattle-health/disease-black-quarter.jpg',
  },
  {
    name: 'Anthrax',
    type: 'Bacterial',
    cause: 'Bacillus anthracis spores in soil',
    signs: 'Sudden death, dark unclotted blood from body openings',
    image: '/cattle-health/disease-anthrax.jpg',
  },
  {
    name: 'Brucellosis',
    type: 'Bacterial',
    cause: 'Brucella abortus',
    signs: 'Abortion in late pregnancy, retained placenta',
    image: '/cattle-health/disease-brucellosis.jpg',
  },
  {
    name: 'Bovine Tuberculosis',
    type: 'Bacterial',
    cause: 'Mycobacterium bovis',
    signs: 'Chronic cough, progressive weight loss',
    image: '/cattle-health/disease-tb.jpg',
  },
];
