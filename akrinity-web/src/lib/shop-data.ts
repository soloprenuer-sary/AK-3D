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

/** One sub-category (a page of its own). In WordPress it is a child of a main product category. */
export interface SubInfo {
  name: string;
  /** Page address part, for example "vases-and-planters". */
  slug: string;
  /** WooCommerce category id when the tree comes from WordPress. */
  id?: number;
  /** Picture: the WooCommerce category thumbnail, or an illustration shipped with the site. */
  image?: string;
  /** Heading it sits under in the menu's full list, for example "Flowers and plants". */
  group?: string;
  /** Shown as one of the picture tiles in the menu. */
  popular: boolean;
}

export interface ShopCategory {
  name: string;
  /** Page address part, for example "home-decor". */
  slug: string;
  /** WooCommerce category id when the tree comes from WordPress. */
  id?: number;
  description: string;
  subs: string[];
  subInfo: SubInfo[];
  /** Short name for the top menu, when the full name is too long. */
  menuLabel?: string;
  /** Tile colour on the home page and category header. */
  tone: string;
}

type BuiltIn = Pick<ShopCategory, 'name' | 'description' | 'subs' | 'tone'>;

/** Main categories and their subcategories. "Kitchen" is non-food-contact only. */
const BUILT_IN: BuiltIn[] = [
  {
    name: 'Home decor',
    description: 'Vases, planters, lamps, wall art and small storage for every room.',
    subs: ['Showpieces', 'Vases and planters', 'Lamps', 'Wall art'],
    tone: 'var(--accent)',
  },
  {
    name: 'Desk & gadgets',
    description: 'Organisers, stands and desk pieces that keep a workspace tidy.',
    subs: ['Desk organisers', 'Phone stands', 'Cable management', 'Desk toys'],
    tone: 'var(--violet)',
  },
  {
    name: 'Kitchen',
    description:
      'Non-food-contact kitchen pieces: egg trays, spoon and knife holders. Not for storing food.',
    subs: ['Egg trays', 'Spoon and knife holders', 'Drawer dividers', 'Utility tools'],
    tone: 'var(--orange)',
  },
  {
    name: 'Figurines & miniatures',
    description: 'Idols, characters, custom miniatures and hobby display pieces.',
    subs: ['Busts', 'Miniatures', 'Display models'],
    tone: 'var(--ink)',
  },
  {
    name: 'Original characters',
    description: 'Our own anime-inspired characters, chibi figures and display stands.',
    subs: ['Chibi figures', 'Busts', 'Display stands'],
    tone: 'var(--accent)',
  },
  {
    name: 'Experimental & art',
    description: 'Geometric, organic, parametric and print-in-place designs for collectors.',
    subs: ['Parametric', 'Print-in-place', 'Geometric'],
    tone: 'var(--violet)',
  },
  {
    name: 'Gifts & personalised',
    description: 'Name plates, keychains and gift sets, personalised with text on request.',
    subs: ['Name plates', 'Keychains', 'Corporate gifts'],
    tone: 'var(--orange)',
  },
  {
    name: 'Hobby & cosplay',
    description: 'Dice towers, board game accessories, cosplay badges and terrain.',
    subs: ['Dice towers', 'Terrain', 'Cosplay badges'],
    tone: 'var(--ink)',
  },
  {
    name: 'Spare parts',
    description: 'Knobs, brackets, clips and feet for things around the house.',
    subs: ['Knobs and clips', 'Brackets', 'Custom parts'],
    tone: 'var(--accent)',
  },
];

/**
 * Illustrations shipped in public/category-images, named "<category slug>_<sub-category slug>.png".
 * Used when a sub-category has no picture in WordPress.
 */
const LOCAL_IMAGES = new Set([
  'desk-gadgets_cable-management',
  'desk-gadgets_desk-organisers',
  'desk-gadgets_desk-toys',
  'desk-gadgets_phone-stands',
  'experimental-art_geometric',
  'experimental-art_parametric',
  'experimental-art_print-in-place',
  'figurines-miniatures_busts',
  'figurines-miniatures_display-models',
  'figurines-miniatures_miniatures',
  'gifts-personalised_corporate-gifts',
  'gifts-personalised_keychains',
  'gifts-personalised_name-plates',
  'hobby-cosplay_cosplay-badges',
  'hobby-cosplay_dice-towers',
  'hobby-cosplay_terrain',
  'home-decor_lamps',
  'home-decor_showpieces',
  'home-decor_vases-and-planters',
  'home-decor_wall-art',
  'kitchen_drawer-dividers',
  'kitchen_egg-trays',
  'kitchen_spoon-and-knife-holders',
  'kitchen_utility-tools',
  'original-characters_busts',
  'original-characters_chibi-figures',
  'original-characters_display-stands',
  'spare-parts_brackets',
  'spare-parts_custom-parts',
  'spare-parts_knobs-and-clips',
]);

export function localSubImage(categorySlugValue: string, subSlugValue: string): string | undefined {
  const key = `${categorySlugValue}_${subSlugValue}`;
  return LOCAL_IMAGES.has(key) ? `/category-images/${key}.png` : undefined;
}

/** The built-in category list. Used until WordPress has main categories with sub-categories, and when it cannot be reached. */
export const CATEGORIES: ShopCategory[] = BUILT_IN.map((c) => {
  const slug = slugify(c.name);
  return {
    ...c,
    slug,
    subInfo: c.subs.map((s, i) => ({
      name: s,
      slug: slugify(s),
      image: localSubImage(slug, slugify(s)),
      popular: i < 4,
    })),
  };
});

export const SIZE_OPTIONS = ['Small', 'Medium', 'Large'];
export const SHOP_MATERIALS: Material[] = ['PLA+', 'PETG', 'ABS / ASA', 'Resin'];

import type { DescBlock, ProductContent, ProductSpec } from './product-content';

/** One bulk price range set on the product in WordPress. to is null for "and up". */
export interface BulkTier {
  from: number;
  to: number | null;
  /** Price per piece, for example "₹449". */
  price: string;
}

/**
 * The options a customer chooses on a variable product (WooCommerce variations). Set only when the
 * product is variable; a simple product has no variation and shows no option fields.
 */
export interface ShopVariation {
  modes: ColourMode[];
  colours: ColourKey[];
  materials: Material[];
  sizes: string[];
  /** A personalised-text attribute is used for the variations. */
  personalise: boolean;
}

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
  /** Bulk price ranges from WordPress (ACF fields on the product). Empty or missing means none. */
  bulkTiers?: BulkTier[];
  /** Normal price shown struck through when the product is on sale. */
  regularPrice?: string;
  /** Short description from WordPress, as plain text. */
  description?: string;
  /** Options for a variable product. Undefined for a simple product. */
  variation?: ShopVariation;
  /** Average star rating from WooCommerce's own reviews (0 to 5) and how many reviews. */
  rating?: number;
  reviewCount?: number;
  /** The long description as headings, paragraphs, lists and pictures. */
  longDescription?: DescBlock[];
  /** The product page content fields from WordPress (features, A+ pictures, specs table). */
  content?: ProductContent;
  /** The 3D file uploaded on the product in WordPress, shown in the 3D view. */
  model?: { url: string; type: string };
  /** Specifications: size, weight and every attribute with a value. */
  specs?: ProductSpec[];
  /** Products set as cross-sells and upsells on this product in WordPress ("wc-<id>"). */
  crossSellIds?: string[];
  upsellIds?: string[];
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

/**
 * Comparison key for a sub-category name, so "Vases & planters" in WordPress matches
 * "Vases and planters" on the site. Also the part after "#sub-" in the page address.
 */
export function subKey(s: string): string {
  return slugify(s)
    .replace(/(^|-)and(-|$)/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findSub(cat: ShopCategory, slug: string): string | undefined {
  return cat.subInfo.find((s) => s.slug === slug)?.name;
}

export function subHref(cat: ShopCategory, sub: SubInfo): string {
  return `/shop/${cat.slug}/${sub.slug}`;
}

/**
 * Words in a product name that place it in a sub-category when the product has no sub-category
 * ticked in WooCommerce yet. A sub-category ticked in WordPress always wins. The first match in the
 * category's own list is used.
 */
const SUB_WORDS: Record<string, RegExp> = {
  Showpieces: /showpiece|sculpture|statue|ornament|figure ?head/i,
  'Vases and planters': /vase|planter|flower ?pot|\bpot\b/i,
  Lamps: /lamp|lantern|night ?light|shade/i,
  'Wall art': /wall|frame|hanging|poster|plaque/i,
  'Desk organisers': /organi[sz]er|pen (holder|stand|cup)|desk tray|stationery/i,
  'Phone stands':
    /(phone|tablet|mobile).*(stand|holder|dock)|(stand|holder|dock).*(phone|tablet|mobile)/i,
  'Cable management': /cable|cord|wire/i,
  'Desk toys': /fidget|desk toy|spinner|puzzle|toy/i,
  'Egg trays': /egg/i,
  'Spoon and knife holders': /spoon|knife|cutlery|utensil/i,
  'Drawer dividers': /divider|drawer/i,
  'Utility tools': /tool|scoop|opener|hook|peeler|tongs/i,
  Busts: /bust|portrait/i,
  Miniatures: /miniature|\bmini\b|tabletop/i,
  'Display models': /model|replica|scale/i,
  'Chibi figures': /chibi/i,
  'Display stands': /stand|plinth|\bbase\b/i,
  Parametric: /parametric|twist|spiral|vase mode/i,
  'Print-in-place': /print[- ]in[- ]place|articulated|flexi|hinge/i,
  Geometric: /geometric|polyhedron|hex|cube/i,
  'Name plates': /name ?plate|nameplate|door ?sign/i,
  Keychains: /key ?(chain|ring)|\btag\b/i,
  'Corporate gifts': /corporate|branded|logo/i,
  'Dice towers': /dice/i,
  Terrain: /terrain|ruin|scenery|\btree\b/i,
  'Cosplay badges': /badge|\bpin\b|cosplay/i,
  'Knobs and clips': /knob|clip|handle/i,
  Brackets: /bracket|mount|support/i,
  'Custom parts': /custom|replacement|\bpart\b/i,
};

export function inferSub(cat: ShopCategory, productName: string): string | undefined {
  return cat.subs.find((s) => SUB_WORDS[s]?.test(productName));
}

export function categorySlug(c: ShopCategory): string {
  return c.slug || slugify(c.name);
}

export function findCategory(
  slug: string,
  tree: ShopCategory[] = CATEGORIES,
): ShopCategory | undefined {
  return tree.find((c) => categorySlug(c) === slug);
}
