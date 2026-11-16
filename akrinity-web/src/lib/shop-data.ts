/**
 * Sample catalogue for the shop. Replace with WooCommerce data (Store API / WPGraphQL) when the
 * backend is connected. Names and prices are placeholders, not real products.
 */

export type ColourKey = 'black' | 'white' | 'orange' | 'violet' | 'lime';
export type Material = 'PLA+' | 'PETG' | 'ABS / ASA' | 'Resin';
/** Colour options. WooCommerce variations later: "single", "multi", "painted" (painting later). */
export type ColourMode = 'single' | 'multi' | 'painted';
export type ProcessType = 'FDM' | 'Multi-filament FDM' | 'Resin';

export const COLOURS: Record<ColourKey, string> = {
  black: '#17171A',
  white: '#F3F1EA',
  orange: '#FF6A1F',
  violet: '#5B2BE0',
  lime: '#D8FF3A',
};

export const MODE_LABEL: Record<ColourMode, string> = {
  single: 'Single colour',
  multi: 'Multi-colour',
  painted: 'Painted (later)',
};

export interface ShopCategory {
  name: string;
  description: string;
  subs: string[];
  /** Tile colour on the home page and category header. */
  tone: string;
}

/** Main categories and their subcategories. "Kitchen" is non-food-contact only. */
export const CATEGORIES: ShopCategory[] = [
  {
    name: 'Home decor',
    description: 'Vases, planters, lamps, wall art and small storage for every room.',
    subs: [
      'Vases & planters',
      'Lamps & lighting',
      'Wall art & hooks',
      'Trays & storage',
      'Clocks & frames',
    ],
    tone: 'var(--accent)',
  },
  {
    name: 'Desk & gadgets',
    description: 'Organisers, stands and desk pieces that keep a workspace tidy.',
    subs: [
      'Desk organisers',
      'Phone & tablet stands',
      'Monitor stands',
      'Cable management',
      'Desk toys',
    ],
    tone: 'var(--violet)',
  },
  {
    name: 'Kitchen',
    description:
      'Non-food-contact kitchen pieces: egg trays, spoon and knife holders. Not for storing food.',
    subs: ['Egg trays', 'Spoon holders', 'Knife holders', 'Drawer dividers'],
    tone: 'var(--orange)',
  },
  {
    name: 'Figurines & miniatures',
    description: 'Human figurines, busts, tabletop miniatures and scale models.',
    subs: ['Busts & portraits', 'Tabletop miniatures', 'Scale models', 'Creatures & animals'],
    tone: 'var(--ink)',
  },
  {
    name: 'Original characters',
    description: 'Our own anime-inspired characters, chibi figures and display stands.',
    subs: ['Chibi figures', 'Characters & busts', 'Display stands'],
    tone: 'var(--accent)',
  },
  {
    name: 'Experimental & art',
    description: 'Geometric, organic, parametric and print-in-place designs for collectors.',
    subs: [
      'Geometric & organic art',
      'Parametric designs',
      'Print-in-place & mechanical',
      'Abstract sculptures',
    ],
    tone: 'var(--violet)',
  },
  {
    name: 'Gifts & personalised',
    description: 'Name plates, keychains and gift sets, personalised with text on request.',
    subs: ['Name plates', 'Keychains & tags', 'Gift sets'],
    tone: 'var(--orange)',
  },
  {
    name: 'Hobby & cosplay',
    description: 'Dice towers, board game accessories, cosplay badges and terrain.',
    subs: ['Board game accessories', 'Cosplay badges', 'Miniature terrain'],
    tone: 'var(--ink)',
  },
  {
    name: 'Spare parts',
    description: 'Knobs, brackets, clips and feet for things around the house.',
    subs: ['Knobs & handles', 'Brackets & clips', 'Feet & spacers'],
    tone: 'var(--accent)',
  },
];

export const SHOP_CATEGORIES = CATEGORIES.map((c) => c.name);
export const SIZE_OPTIONS = ['Small', 'Medium', 'Large'];
export const SHOP_MATERIALS: Material[] = ['PLA+', 'PETG', 'ABS / ASA', 'Resin'];

export interface ShopProduct {
  id: string;
  /** WooCommerce slug (the page address). Falls back to a slug made from the name. */
  slug?: string;
  name: string;
  category: string;
  sub: string;
  inStock: boolean;
  material: Material;
  process: ProcessType;
  colours: ColourKey[];
  /** Materials offered on this product (WooCommerce attribute Material). Empty means all four. */
  materials?: Material[];
  /** Sizes offered on this product (WooCommerce attribute Size). Empty means Small, Medium and Large. */
  sizes?: string[];
  /** Colour options offered on this product. The first one is the default. */
  modes: ColourMode[];
  /** Product photos from /public or WordPress (first image is the main one). Optional. */
  images?: string[];
  /** Price as shown to customers, e.g. "₹499". Sample products use a placeholder when unset. */
  price?: string;
  /** Normal price shown struck through when the product is on sale. */
  regularPrice?: string;
  /** Short description from WordPress. Sample products use a placeholder when unset. */
  description?: string;
}

/** URL slug from a name, e.g. "Home decor" -> "home-decor", "Desk & gadgets" -> "desk-gadgets". */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function productSlug(p: ShopProduct): string {
  return p.slug || slugify(p.name);
}

export function categorySlug(c: ShopCategory): string {
  return slugify(c.name);
}

export function findCategory(slug: string): ShopCategory | undefined {
  return CATEGORIES.find((c) => categorySlug(c) === slug);
}
