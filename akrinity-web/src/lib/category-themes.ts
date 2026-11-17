/**
 * One look per shop category. Every colour comes from the brand tokens (ink, paper, lime, violet,
 * orange); what changes is the colour pairing, the background pattern, the illustration and the
 * layout of the header, plus the tips and the call to action under the products.
 * Keys are the category slugs (see categorySlug in shop-data.ts).
 */

export type CategoryArtKey =
  | 'decor'
  | 'desk'
  | 'kitchen'
  | 'figurine'
  | 'character'
  | 'experimental'
  | 'gift'
  | 'hobby'
  | 'parts'
  | 'sports';

export type CategoryLayout = 'split-right' | 'split-left' | 'center' | 'spotlight' | 'poster';

export type CategoryPattern =
  'layers' | 'dots' | 'eggs' | 'rings' | 'rays' | 'waves' | 'confetti' | 'hex' | 'blueprint';

export interface CategoryTheme {
  art: CategoryArtKey;
  layout: CategoryLayout;
  pattern: CategoryPattern;
  /** Header background and text colour, and the colour of the highlighted word and the main button. */
  bg: string;
  fg: string;
  accent: string;
  /** Text colour on the accent (white on the violet accent, ink on the others). */
  accentInk?: string;
  /** Short line under the name. */
  tagline: string;
  /** Up to three short facts shown as chips. */
  facts: string[];
  /** Three things worth knowing, shown under the products. */
  tips: { title: string; text: string }[];
  /** Call to action under the tips. */
  cta: { title: string; text: string; label: string; href: string };
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  'home-decor': {
    art: 'decor',
    layout: 'split-right',
    pattern: 'layers',
    bg: '#D8FF3A',
    fg: '#0B0B0C',
    accent: '#FFFFFF',
    tagline: 'Make a room feel finished.',
    facts: ['Vases, lamps, wall art', 'Single or multi-colour', 'Printed layer by layer'],
    tips: [
      {
        title: 'Pick a colour for the room',
        text: 'Most pieces print in one filament colour. Multi-colour takes longer and may cost more; the extra cost is confirmed before you pay.',
      },
      {
        title: 'PLA+ is the usual choice indoors',
        text: 'It prints clean and crisp. Keep it out of hot, sunny spots such as a parked car or a sunny window.',
      },
      {
        title: 'Lamps are decorative',
        text: 'Use only the bulb or LED size in the product description, and keep printed parts away from the heat of a bulb.',
      },
    ],
    cta: {
      title: 'Want a lamp or vase in your own shape?',
      text: 'Send a sketch or an idea. We model it, check it prints well, and quote it.',
      label: 'See the design service',
      href: '/design-service',
    },
  },
  'desk-gadgets': {
    art: 'desk',
    layout: 'split-left',
    pattern: 'dots',
    bg: '#5B2BE0',
    fg: '#FFFFFF',
    accent: '#D8FF3A',
    tagline: 'A tidier desk, one print at a time.',
    facts: ['Organisers and stands', 'Cable management', 'PETG for everyday knocks'],
    tips: [
      {
        title: 'Measure your gear first',
        text: 'Check the width of your phone, tablet or cables, including any case, before you pick a size.',
      },
      {
        title: 'PETG takes everyday knocks',
        text: 'Pieces that get picked up and moved all day do best in PETG. PLA+ suits things that stay put.',
      },
      {
        title: 'Fitting out an office?',
        text: 'Larger counts have their own prices. Send a bulk quote request and we confirm the price.',
      },
    ],
    cta: {
      title: 'Setting up a whole office?',
      text: 'Bulk prices, one GST invoice, matching colours across the batch.',
      label: 'Request a bulk quote',
      href: '/business',
    },
  },
  kitchen: {
    art: 'kitchen',
    layout: 'split-left',
    pattern: 'eggs',
    bg: '#FF6A1F',
    fg: '#0B0B0C',
    accent: '#FFFFFF',
    tagline: 'Holders and trays for your tools, not your food.',
    facts: ['Egg trays, spoon and knife holders', 'Not for food contact', 'Easy to wash'],
    tips: [
      {
        title: 'Not for food contact',
        text: 'These pieces hold utensils and eggs in their shells. Do not store or serve food or drink in a printed part.',
      },
      {
        title: 'Washing',
        text: 'Wash with warm water and mild soap and dry fully. Do not soak for long periods.',
      },
      { title: 'Heat', text: 'Keep printed pieces away from hot pans, ovens and the dishwasher.' },
    ],
    cta: {
      title: 'Need a divider cut to fit your drawer?',
      text: 'Send us the inside measurements in millimetres and we quote a custom size.',
      label: 'Request a quote',
      href: '/quote',
    },
  },
  'figurines-miniatures': {
    art: 'figurine',
    layout: 'spotlight',
    pattern: 'rings',
    bg: '#0B0B0C',
    fg: '#F3F1EA',
    accent: '#D8FF3A',
    tagline: 'Small pieces, fine detail.',
    facts: ['Busts, miniatures, models', 'Resin for the finest detail', 'Original designs only'],
    tips: [
      {
        title: 'Original designs only',
        text: 'Every figurine here is our own design. We do not sell licensed characters.',
      },
      {
        title: 'Resin for fine detail',
        text: 'Resin shows the smallest features. PLA+ suits larger pieces and costs less.',
      },
      {
        title: 'Handle with care',
        text: 'Resin pieces are more brittle than PLA+ or PETG. Do not leave them in strong sun or heat.',
      },
    ],
    cta: {
      title: 'A figurine from your photo or sketch',
      text: 'We model it as an original design, show you previews, then print it.',
      label: 'See the design service',
      href: '/design-service',
    },
  },
  'original-characters': {
    art: 'character',
    layout: 'split-right',
    pattern: 'rays',
    bg: '#F3F1EA',
    fg: '#0B0B0C',
    accent: '#D8FF3A',
    tagline: 'Our own characters, nobody else’s.',
    facts: ['Our own characters', 'Chibi figures and busts', 'Display stands'],
    tips: [
      {
        title: 'Made up by us',
        text: 'These characters are anime-inspired but original. None is copied from a show, game or comic.',
      },
      {
        title: 'Chibi figures and busts',
        text: 'Small and chunky, or head and shoulders. Pick the style that suits your shelf.',
      },
      {
        title: 'Painted on request',
        text: 'A few pieces can be painted. Painted items are made to order and quoted separately.',
      },
    ],
    cta: {
      title: 'Have a character idea of your own?',
      text: 'Original ideas only. We cannot model existing characters from other creators.',
      label: 'See the design service',
      href: '/design-service',
    },
  },
  'experimental-art': {
    art: 'experimental',
    layout: 'split-right',
    pattern: 'waves',
    bg: '#17171A',
    fg: '#F3F1EA',
    accent: '#7A52EC',
    accentInk: '#FFFFFF',
    tagline: 'Shapes that only a printer can make.',
    facts: ['Parametric and geometric', 'Print-in-place', 'Made for collectors'],
    tips: [
      {
        title: 'Parametric means a formula',
        text: 'The shape follows rules, so sizes and twists can be tuned to your space.',
      },
      {
        title: 'Print-in-place',
        text: 'Moving parts are printed already assembled, in one go. Handle them gently the first time.',
      },
      {
        title: 'PLA+ for crisp layers',
        text: 'PLA+ shows the layer lines best indoors. Choose ASA if a piece will sit outdoors in the sun.',
      },
    ],
    cta: {
      title: 'Curious how these are designed?',
      text: 'Read how we design for print: wall thickness, overhangs and what a printer can and cannot do.',
      label: 'Read the guides',
      href: '/guides',
    },
  },
  'gifts-personalised': {
    art: 'gift',
    layout: 'split-left',
    pattern: 'confetti',
    bg: '#F3F1EA',
    fg: '#0B0B0C',
    accent: '#FF6A1F',
    tagline: 'Put a name on it.',
    facts: ['Name plates and keychains', 'Personalised on request', 'Made to order'],
    tips: [
      {
        title: 'Your text, up to 40 characters',
        text: 'Letters, numbers and spaces. Check the spelling: personalised items are printed exactly as typed.',
      },
      {
        title: 'Made to order',
        text: 'Personalised items are not returnable unless faulty, and cash on delivery is not offered for them.',
      },
      {
        title: 'Allow time for printing',
        text: 'Each piece is printed for you after you order. The product page shows the lead time.',
      },
    ],
    cta: {
      title: 'Ordering gifts for a team or a wedding?',
      text: 'Larger counts have their own prices and one GST invoice.',
      label: 'Request a bulk quote',
      href: '/business',
    },
  },
  'hobby-cosplay': {
    art: 'hobby',
    layout: 'spotlight',
    pattern: 'hex',
    bg: '#7A52EC',
    fg: '#FFFFFF',
    accent: '#D8FF3A',
    tagline: 'For game nights and conventions.',
    facts: ['Dice towers and terrain', 'Cosplay badges', 'Board game accessories'],
    tips: [
      {
        title: 'Check your game’s sizes',
        text: 'Board game pieces are sized in millimetres. Match them to your cards, tokens and dice.',
      },
      {
        title: 'Badges and props',
        text: 'Cosplay badges and props are non-weapon only. We do not make weapons or weapon parts.',
      },
      {
        title: 'Terrain takes paint',
        text: 'Terrain prints in PLA+ and can be painted. Painted items are made to order.',
      },
    ],
    cta: {
      title: 'A custom prop or a terrain set?',
      text: 'Send measurements and a reference. We quote the print.',
      label: 'Request a quote',
      href: '/quote',
    },
  },
  'sports-equipment-holders': {
    art: 'sports',
    layout: 'spotlight',
    pattern: 'rays',
    bg: '#FF6A1F',
    fg: '#0B0B0C',
    accent: '#FFFFFF',
    tagline: 'A proper place for every racket and ball.',
    facts: ['Racket and bat holders', 'Wall mounts', 'Printed to fit your gear'],
    tips: [
      {
        title: 'Measure your gear first',
        text: 'Check the width of the handle, the ball or the bottle before you pick a size.',
      },
      {
        title: 'PETG for everyday knocks',
        text: 'Holders that carry weight or get bumped do best in PETG. PLA+ suits light items.',
      },
      {
        title: 'Fix wall mounts properly',
        text: 'Use screws that suit your wall type. A printed holder is for sports gear, not for climbing or safety use.',
      },
    ],
    cta: {
      title: 'Odd-shaped gear?',
      text: 'Send measurements in millimetres and we quote a holder made to fit.',
      label: 'Request a quote',
      href: '/quote',
    },
  },
  'spare-parts': {
    art: 'parts',
    layout: 'split-right',
    pattern: 'blueprint',
    bg: '#E4E1D7',
    fg: '#0B0B0C',
    accent: '#D8FF3A',
    tagline: 'Replace the small part, keep the thing.',
    facts: ['Knobs, clips, brackets', 'Send us measurements', 'Matched to the material'],
    tips: [
      {
        title: 'Send a photo with a ruler',
        text: 'A clear photo with a ruler beside the part, or measurements in millimetres, is enough to start.',
      },
      {
        title: 'Tell us where it lives',
        text: 'Heat, sun and load decide the material: PETG for tougher parts, ASA outdoors, PLA+ for light duty.',
      },
      {
        title: 'No part to copy?',
        text: 'We can model it from the broken piece or from the space it has to fit.',
      },
    ],
    cta: {
      title: 'Can’t find your part?',
      text: 'Most spare parts are made to order. Tell us what it is and we quote it.',
      label: 'Request a quote',
      href: '/quote',
    },
  },
};

/** Order the colour looks are handed out to categories that have no theme of their own. */
const LOOKS = [
  'home-decor',
  'desk-gadgets',
  'figurines-miniatures',
  'spare-parts',
  'sports-equipment-holders',
  'hobby-cosplay',
  'gifts-personalised',
  'original-characters',
  'experimental-art',
];

/**
 * The look for a category. The nine built-in slugs and "sports-equipment-holders" have their own
 * written theme. Any other category added in WordPress borrows a look by its position and uses plain
 * defaults, with text from the ACF fields.
 */
export function themeFor(slug: string, index = 0): CategoryTheme {
  const own = CATEGORY_THEMES[slug];
  if (own) return own;
  const base = CATEGORY_THEMES[LOOKS[index % LOOKS.length]];
  return {
    ...base,
    tagline: '',
    facts: [],
    tips: [],
    cta: {
      title: 'Need something made for you?',
      text: 'Send a sketch or an idea. We model it, check it prints well, and quote it.',
      label: 'See the design service',
      href: '/design-service',
    },
  };
}
