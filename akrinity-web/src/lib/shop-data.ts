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
    subs: ['Vases & planters', 'Lamps & lighting', 'Wall art & hooks', 'Trays & storage', 'Clocks & frames'],
    tone: 'var(--accent)',
  },
  {
    name: 'Desk & gadgets',
    description: 'Organisers, stands and desk pieces that keep a workspace tidy.',
    subs: ['Desk organisers', 'Phone & tablet stands', 'Monitor stands', 'Cable management', 'Desk toys'],
    tone: 'var(--violet)',
  },
  {
    name: 'Kitchen',
    description: 'Non-food-contact kitchen pieces: egg trays, spoon and knife holders. Not for storing food.',
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
    subs: ['Geometric & organic art', 'Parametric designs', 'Print-in-place & mechanical', 'Abstract sculptures'],
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
export const SHOP_MATERIALS: Material[] = ['PLA+', 'PETG', 'ABS / ASA', 'Resin'];

export interface ShopProduct {
  id: string;
  name: string;
  category: string;
  sub: string;
  inStock: boolean;
  material: Material;
  process: ProcessType;
  colours: ColourKey[];
  /** Colour options offered on this product. The first one is the default. */
  modes: ColourMode[];
  /** Product photos from /public (first image is the main one). Optional. */
  images?: string[];
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
  return slugify(p.name);
}

export function categorySlug(c: ShopCategory): string {
  return slugify(c.name);
}

export function findCategory(slug: string): ShopCategory | undefined {
  return CATEGORIES.find((c) => categorySlug(c) === slug);
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  { id: 'p01', name: 'Layered vase', category: 'Home decor', sub: 'Vases & planters', inStock: true, material: 'PLA+', process: 'FDM', colours: ['violet', 'lime', 'black'], modes: ['single', 'multi'] },
  { id: 'p02', name: 'Desk cable organiser', category: 'Desk & gadgets', sub: 'Cable management', inStock: true, material: 'PETG', process: 'FDM', colours: ['black', 'white', 'orange'], modes: ['single'] },
  { id: 'p03', name: 'Phone stand', category: 'Desk & gadgets', sub: 'Phone & tablet stands', inStock: true, material: 'PLA+', process: 'FDM', colours: ['lime', 'violet', 'black'], modes: ['single', 'painted'] },
  { id: 'p04', name: 'Miniature knight', category: 'Figurines & miniatures', sub: 'Tabletop miniatures', inStock: false, material: 'Resin', process: 'Resin', colours: ['white', 'black'], modes: ['single', 'painted'] },
  { id: 'p05', name: 'Name plate', category: 'Gifts & personalised', sub: 'Name plates', inStock: false, material: 'PLA+', process: 'Multi-filament FDM', colours: ['orange', 'violet', 'lime', 'black'], modes: ['single', 'multi'] },
  { id: 'p06', name: 'Planter with drainage', category: 'Home decor', sub: 'Vases & planters', inStock: true, material: 'PLA+', process: 'FDM', colours: ['orange', 'white', 'violet'], modes: ['single', 'multi'] },
  { id: 'p07', name: 'Replacement knob', category: 'Spare parts', sub: 'Knobs & handles', inStock: true, material: 'ABS / ASA', process: 'FDM', colours: ['black', 'white'], modes: ['single'] },
  { id: 'p08', name: 'Dice tower', category: 'Hobby & cosplay', sub: 'Board game accessories', inStock: false, material: 'PETG', process: 'FDM', colours: ['violet', 'black', 'orange'], modes: ['single', 'multi'] },
  { id: 'p09', name: 'Keychain set', category: 'Gifts & personalised', sub: 'Keychains & tags', inStock: true, material: 'PLA+', process: 'Multi-filament FDM', colours: ['lime', 'orange', 'violet'], modes: ['single', 'multi'] },
  { id: 'p10', name: 'Wall hook trio', category: 'Home decor', sub: 'Wall art & hooks', inStock: true, material: 'PETG', process: 'FDM', colours: ['black', 'lime'], modes: ['single'] },
  { id: 'p11', name: 'Cosplay badge', category: 'Hobby & cosplay', sub: 'Cosplay badges', inStock: false, material: 'Resin', process: 'Resin', colours: ['orange', 'black'], modes: ['single', 'painted'] },
  { id: 'p12', name: 'Shelf bracket', category: 'Spare parts', sub: 'Brackets & clips', inStock: true, material: 'PETG', process: 'FDM', colours: ['white', 'black'], modes: ['single'] },
  { id: 'p13', name: 'Rectangular twisted lamp', category: 'Home decor', sub: 'Lamps & lighting', inStock: false, material: 'PLA+', process: 'FDM', colours: ['white'], modes: ['single'], images: ['/products/rectangular-twisted-lamp/1.png', '/products/rectangular-twisted-lamp/2.png', '/products/rectangular-twisted-lamp/3.png', '/products/rectangular-twisted-lamp/4.png', '/products/rectangular-twisted-lamp/5.png'] },
  { id: 'p14', name: 'Egg tray (6 eggs)', category: 'Kitchen', sub: 'Egg trays', inStock: true, material: 'PLA+', process: 'FDM', colours: ['white', 'lime'], modes: ['single', 'multi'] },
  { id: 'p15', name: 'Spoon holder', category: 'Kitchen', sub: 'Spoon holders', inStock: true, material: 'PETG', process: 'FDM', colours: ['black', 'white'], modes: ['single'] },
  { id: 'p16', name: 'Knife holder', category: 'Kitchen', sub: 'Knife holders', inStock: false, material: 'PETG', process: 'FDM', colours: ['black'], modes: ['single'] },
  { id: 'p17', name: 'Chibi figure', category: 'Original characters', sub: 'Chibi figures', inStock: false, material: 'Resin', process: 'Resin', colours: ['white', 'violet'], modes: ['single', 'painted'] },
  { id: 'p18', name: 'Geometric vase art', category: 'Experimental & art', sub: 'Geometric & organic art', inStock: true, material: 'PLA+', process: 'FDM', colours: ['violet', 'white', 'black'], modes: ['single', 'multi'] },
  { id: 'p19', name: 'Portrait bust', category: 'Figurines & miniatures', sub: 'Busts & portraits', inStock: false, material: 'Resin', process: 'Resin', colours: ['white'], modes: ['single', 'painted'] },
];
