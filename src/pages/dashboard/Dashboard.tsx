import React from 'react';
import {
  Calculator,
  Wheat,
  Scale,
  HeartPulse,
  Sparkles,
  Ruler,
  BarChart3,
  Fish,
  ChevronRight,
  ChevronDown,
  Award,
  BookOpen,
  BookOpenText,
  ShieldPlus,
} from 'lucide-react';

interface DashboardProps {
  onSelectPage: (pageId: string, dropdowns: any) => void;
  activeDropdowns: {
    standards: boolean;
    vaccination: boolean;
    feeds: boolean;
    fish: boolean;
    'aqua-guide': boolean;
  };
  setActiveDropdowns: React.Dispatch<React.SetStateAction<any>>;
}

// Clean 3D tile tints — same light colours, much calmer:
// plain light background (no gradient), thin border, one soft coloured
// shadow + a light bottom edge for the lift. No glow, no extra badges.
type TintKey = 'emerald' | 'amber' | 'cyan' | 'violet';

const TINTS: Record<
  TintKey,
  {
    tile: string;
    iconBox: string;
    iconHover: string;
    title: string;
    chevron: string;
    subHover: string;
    subIcon: string;
  }
> = {
  emerald: {
    tile:
      'bg-emerald-50 border border-emerald-200/70 border-b-[3px] border-b-emerald-200 shadow-[0_4px_10px_-8px_rgba(16,185,129,0.35)]',
    iconBox: 'bg-white border border-emerald-100',
    iconHover: 'group-hover:bg-emerald-100',
    title: 'text-emerald-950',
    chevron: 'text-emerald-500',
    subHover: 'hover:bg-emerald-100 hover:text-emerald-900',
    subIcon: 'text-emerald-600',
  },
  amber: {
    tile:
      'bg-amber-50 border border-amber-200/70 border-b-[3px] border-b-amber-200 shadow-[0_4px_10px_-8px_rgba(245,158,11,0.35)]',
    iconBox: 'bg-white border border-amber-100',
    iconHover: 'group-hover:bg-amber-100',
    title: 'text-amber-950',
    chevron: 'text-amber-500',
    subHover: 'hover:bg-amber-100 hover:text-amber-900',
    subIcon: 'text-amber-600',
  },
  cyan: {
    tile:
      'bg-cyan-50 border border-cyan-200/70 border-b-[3px] border-b-cyan-200 shadow-[0_4px_10px_-8px_rgba(6,182,212,0.35)]',
    iconBox: 'bg-white border border-cyan-100',
    iconHover: 'group-hover:bg-cyan-100',
    title: 'text-cyan-950',
    chevron: 'text-cyan-500',
    subHover: 'hover:bg-cyan-100 hover:text-cyan-900',
    subIcon: 'text-cyan-600',
  },
  violet: {
    tile:
      'bg-violet-50 border border-violet-200/70 border-b-[3px] border-b-violet-200 shadow-[0_4px_10px_-8px_rgba(139,92,246,0.35)]',
    iconBox: 'bg-white border border-violet-100',
    iconHover: 'group-hover:bg-violet-100',
    title: 'text-violet-950',
    chevron: 'text-violet-500',
    subHover: 'hover:bg-violet-100 hover:text-violet-900',
    subIcon: 'text-violet-600',
  },
};

interface CardItem {
  id: string;
  title: string;
  icon: React.ReactNode;
}

export default function Dashboard({ onSelectPage, activeDropdowns, setActiveDropdowns }: DashboardProps) {
  // ড্রপডাউন টগল করার সময় স্টেট আপডেট করা যাতে ব্যাক করলে বন্ধ না হয়ে যায়
  const toggleDropdown = (key: string) => {
    setActiveDropdowns((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Cattle Tools
  const cattleServices: CardItem[] = [
    { id: 'cattle-info', title: 'Cattle Ration Calculator', icon: <Calculator className="text-emerald-700" size={18} /> },
    { id: 'weight-measure', title: 'Live Weight Estimator', icon: <Scale className="text-emerald-700" size={18} /> },
    { id: 'cattle-health', title: 'Cattle Health', icon: <HeartPulse className="text-emerald-700" size={18} /> },
    { id: 'nourish-feeds-reference', title: 'Nourish Cattle Feeds', icon: <Wheat className="text-emerald-700" size={18} /> },
  ];

  // Poultry Main Tools
  const poultryMainServices: CardItem[] = [
    { id: 'layer-light', title: 'Layer Lighting Calculator', icon: <Sparkles className="text-amber-700" size={18} /> },
    { id: 'poultry-uniformity', title: 'Uniformity Calculator', icon: <BarChart3 className="text-amber-700" size={18} /> },
    { id: 'poultry-space', title: 'Poultry Space Calculator', icon: <Ruler className="text-amber-700" size={18} /> },
  ];

  const standardSubItems = [
    { id: 'broiler-standard', title: 'Broiler Standard' },
    { id: 'layer-standard', title: 'Layer Standard' },
    { id: 'sonali-standard', title: 'Sonali Standard' },
  ];

  const vaccinationSubItems = [
    { id: 'broiler-vaccination', title: 'Broiler Vaccination' },
    { id: 'layer-vaccination', title: 'Layer Vaccination' },
    { id: 'sonali-vaccination', title: 'Sonali Vaccination' },
  ];

  const feedSubItems = [
    { id: 'broiler-feeds', title: 'Broiler Feeds' },
    { id: 'layer-feeds', title: 'Layer Feeds' },
    { id: 'sonali-feeds', title: 'Sonali Feeds' },
  ];

  const fishSubItems = [
    { id: 'nourish-floating-fish', title: 'Floating Fish Feeds' },
    { id: 'nourish-sinking-fish', title: 'Sinking Fish Feeds' },
  ];

  // Fish Farming Guide — in farming sequence: prepare the pond first,
  // then water, then stocking, then nursery feeding, then feeding rate.
  const aquaGuideSubItems = [
    { id: 'aqua-pond-prep', title: 'Pond Preparation' },
    { id: 'aqua-water-quality', title: 'Water Quality' },
    { id: 'aqua-stocking-density', title: 'Stocking Density' },
    { id: 'aqua-nursery-feeding', title: 'Nursery Feeding' },
    { id: 'aqua-feeding-rate', title: 'Feeding Rate' },
  ];

  // Materials (Training Materials — PDF / PPTX library)
  const materialsServices: CardItem[] = [
    { id: 'materials', title: 'Training Materials', icon: <BookOpenText className="text-violet-700" size={18} /> },
  ];

  // One clean 3D card — short again (like the earlier cards) and bleeding
  // PC: a card is a bit wider than half the screen, so its title fits on
  // one line — left cards run from the left edge to past the middle,
  // right cards from the right edge to past the middle. (The sections
  // stack vertically, so the two sides never overlap on the same row.
  // On a phone they stay full-width, bleeding in from their side.)
  const pcCardWidth = (align: 'left' | 'right') =>
    align === 'left'
      ? 'sm:w-[calc(60%+36px)]'
      : 'sm:w-[calc(60%+36px)] sm:ml-0 sm:self-end sm:-mr-10';

  // off one side of the screen: left cards start outside the screen on
  // the left and stop just before the right edge; right cards mirror it.
  // The bleed is a negative margin + a wider card, so it reads as coming
  // in from outside the screen on mobile and PC alike.
  const renderCard = (item: CardItem, tintKey: TintKey, align: 'left' | 'right') => {
    const tint = TINTS[tintKey];
    return (
      <button
        key={item.id}
        onClick={() => onSelectPage(item.id, activeDropdowns)}
        className={`group rounded-3xl p-3 min-h-[88px] w-[calc(100%+36px)] ${pcCardWidth(align)} ${
          align === 'left' ? '-ml-10' : 'ml-1'
        } flex flex-col ${align === 'left' ? 'items-end' : 'items-start'} justify-between gap-2 text-left cursor-pointer transition-all duration-200 hover:-translate-y-1 active:translate-y-0.5 active:border-b-2 ${tint.tile}`}
      >
        <div className={`p-2 rounded-2xl shadow-sm transition-colors ${tint.iconBox} ${tint.iconHover}`}>
          {item.icon}
        </div>
        {/* Left cards bleed in from the left, so their text sits at the card's
            far right end; right cards keep their text on the left. The title
            never wraps — it stays on one line (truncates if ever too long). */}
        <span className={`font-bold text-sm sm:text-[15px] leading-snug whitespace-nowrap max-w-full overflow-hidden text-ellipsis ${tint.title} ${
          align === 'left' ? 'self-end text-right' : ''
        }`}>
          {item.title}
        </span>
      </button>
    );
  };

  // One accordion — closed it is a normal card like the others;
  // open it grows in place and shows its sub-items as plain rows.
  // Same bleed as its section's cards.
  const renderAccordion = (
    key: 'standards' | 'vaccination' | 'feeds' | 'fish' | 'aqua-guide',
    title: string,
    icon: React.ReactNode,
    tintKey: TintKey,
    subItems: { id: string; title: string }[],
    align: 'left' | 'right',
  ) => {
    const tint = TINTS[tintKey];
    const open = activeDropdowns[key];
    return (
      <div
        key={key}
        className={`relative rounded-3xl transition-all duration-300 overflow-hidden w-[calc(100%+36px)] ${pcCardWidth(align)} ${
          align === 'left' ? '-ml-10' : 'ml-1'
        } ${tint.tile} hover:-translate-y-1 active:translate-y-0.5 active:border-b-2`}
      >
        <button
          onClick={() => toggleDropdown(key)}
          className={`group w-full p-3 min-h-[88px] flex flex-col ${align === 'left' ? 'items-end' : 'items-start'} justify-between gap-2 text-left cursor-pointer`}
        >
          <div className={`p-2 rounded-2xl shadow-sm transition-colors shrink-0 ${tint.iconBox} ${tint.iconHover}`}>
            {icon}
          </div>
          {/* Left accordions bleed in from the left, so their text sits at the
              card's far right end, like the other left cards. */}
          <span className={`font-bold text-sm sm:text-[15px] leading-snug whitespace-nowrap max-w-full overflow-hidden text-ellipsis ${tint.title} ${
            align === 'left' ? 'self-end text-right' : ''
          }`}>
            {title}
          </span>
          <ChevronDown
            size={18}
            className={`absolute ${align === 'left' ? 'top-3 left-3' : 'top-3 right-3'} transition-transform duration-300 ${tint.chevron} ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <div className="px-3 pb-3 pt-0 space-y-1.5 animate-fadeIn">
            {subItems.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onSelectPage(sub.id, activeDropdowns)}
                className={`w-full py-2 px-2.5 rounded-xl text-[11px] font-semibold text-slate-700 bg-white border border-slate-200/70 flex items-center justify-between gap-1.5 text-left leading-tight transition-all cursor-pointer shadow-sm ${tint.subHover}`}
              >
                <span className="truncate min-w-0">{sub.title}</span>
                <ChevronRight size={13} className={`shrink-0 ${tint.subIcon}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const sectionHeading = (dot: string, label: string, text: string) => (
    <div className="flex items-center justify-center space-x-2">
      <span className={`h-2 w-2 rounded-full ${dot}`}></span>
      <h2 className={`text-xs font-bold uppercase tracking-widest ${text}`}>{label}</h2>
      <span className={`h-2 w-2 rounded-full ${dot}`}></span>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-5 flex flex-col items-center font-sans">
      <div className="w-full space-y-10">
        {/* ১. CATTLE SECTION — cards come in from outside the screen on the left */}
        <section className="space-y-4">
          {sectionHeading('bg-emerald-600', 'Cattle Tools', 'text-emerald-900')}
          <div className="flex flex-col gap-4">
            {cattleServices.map((item) => renderCard(item, 'emerald', 'left'))}
          </div>
        </section>

        {/* ২. POULTRY SECTION — cards come in from outside the screen on the right */}
        <section className="space-y-4">
          {sectionHeading('bg-amber-500', 'Poultry Tools', 'text-amber-900')}
          <div className="flex flex-col gap-4">
            {poultryMainServices.map((item) => renderCard(item, 'amber', 'right'))}
            {renderAccordion('standards', 'Poultry Standards', <Award className="text-amber-700" size={18} />, 'amber', standardSubItems, 'right')}
            {renderAccordion('vaccination', 'Vaccination Schedule', <ShieldPlus className="text-amber-700" size={18} />, 'amber', vaccinationSubItems, 'right')}
            {renderAccordion('feeds', 'Nourish Poultry Feeds', <BookOpen className="text-amber-700" size={18} />, 'amber', feedSubItems, 'right')}
          </div>
        </section>

        {/* ৩. FISH / AQUA SECTION — card comes in from outside the screen on the left */}
        <section className="space-y-4">
          {sectionHeading('bg-cyan-600', 'Aqua Tools', 'text-cyan-900')}
          <div className="flex flex-col gap-4">
            {renderAccordion('fish', 'Nourish Fish Feeds', <Fish className="text-cyan-700" size={18} />, 'cyan', fishSubItems, 'left')}
            {renderAccordion('aqua-guide', 'Fish Farming Guide', <Fish className="text-cyan-700" size={18} />, 'cyan', aquaGuideSubItems, 'left')}
          </div>
        </section>

        {/* ৪. MATERIALS SECTION — card comes in from outside the screen on the right */}
        <section className="space-y-4">
          {sectionHeading('bg-violet-600', 'Materials', 'text-violet-900')}
          <div className="flex flex-col gap-4">
            {materialsServices.map((item) => renderCard(item, 'violet', 'right'))}
          </div>
        </section>
      </div>
    </div>
  );
}
