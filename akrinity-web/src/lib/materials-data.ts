/** Plain-language material guides. Used by the materials hub and the material pages. */
export interface MaterialGuide {
  slug: string;
  name: string;
  short: string;
  intro: string;
  goodFor: string[];
  lessSuited: string[];
  finish: string[];
}

export const MATERIAL_GUIDES: MaterialGuide[] = [
  {
    slug: 'pla',
    name: 'PLA / PLA+',
    short: 'Easy to print, clean surface detail, wide colour range. Best for indoor decor.',
    intro: 'Our most common material. Clean, crisp and easy to live with indoors.',
    goodFor: ['Decor, vases, planters and display pieces.', 'Prototypes and everyday objects.', 'Pieces where colour and surface detail matter.'],
    lessSuited: [
      'Hot places such as a parked car or a sunny window. PLA softens at lower temperatures than PETG or ASA.',
      'Parts that take hard knocks or repeated load.',
    ],
    finish: ['Smooth surface with visible layer lines, which is part of the look.'],
  },
  {
    slug: 'petg',
    name: 'PETG',
    short: 'Tougher than PLA, with better heat and moisture resistance. Good for parts that get used.',
    intro: 'A tougher, more forgiving material for parts that are handled, stressed or kept in a warmer room.',
    goodFor: ['Brackets, clips and spare parts.', 'Storage pieces and holders that take regular use.', 'Parts that bend a little without snapping.'],
    lessSuited: ['Very fine detail, where resin does better.', 'Outdoor parts in strong sun over long periods. Use ASA for that.'],
    finish: ['Slightly glossy. Layer lines are visible but softer than PLA.'],
  },
  {
    slug: 'abs-asa',
    name: 'ABS / ASA',
    short: 'Heat and impact resistant. ASA is the choice for outdoor use.',
    intro: 'For parts that face heat, impact or sunlight. ASA is the outdoor version of ABS.',
    goodFor: [
      'Outdoor parts, where sun exposure matters. ASA resists UV better than PLA or PETG.',
      'Parts that face heat or impact.',
      'Functional pieces that need to hold their shape.',
    ],
    lessSuited: ['Very small, delicate detail, where resin is better.', 'Indoor decor where the stronger material is not needed.'],
    finish: ['Matt to satin surface. Parts can be sanded and painted after printing (painted items are made to order).'],
  },
  {
    slug: 'resin',
    name: 'Resin',
    short: 'Fine detail and smooth finish. Best for miniatures and small precise parts.',
    intro: 'Resin prints the finest detail and the smoothest surfaces. It is a different process from the other materials.',
    goodFor: ['Miniatures and figurines with fine features.', 'Small precise parts and jewellery models.', 'Pieces where a smooth finish matters more than strength.'],
    lessSuited: [
      'Parts that take knocks or bend, because resin is more brittle.',
      'Long exposure to strong sun or heat, which can yellow or soften some resins.',
    ],
    finish: ['Very smooth surface with fine detail. Parts are washed and cured after printing.'],
  },
];

export function findMaterial(slug: string): MaterialGuide | undefined {
  return MATERIAL_GUIDES.find((m) => m.slug === slug);
}
