/**
 * Sample catalogue for the shop page. Replace with WooCommerce data (Store API / WPGraphQL) when
 * the backend is connected. Names and prices are placeholders, not real products.
 */

export type ColourKey = 'black' | 'white' | 'orange' | 'violet' | 'lime';
export type Material = 'PLA+' | 'PETG' | 'ABS / ASA' | 'Resin';

export const COLOURS: Record<ColourKey, string> = {
  black: '#17171A',
  white: '#F3F1EA',
  orange: '#FF6A1F',
  violet: '#5B2BE0',
  lime: '#D8FF3A',
};

export interface ShopProduct {
  id: string;
  name: string;
  category: string;
  inStock: boolean;
  material: Material;
  colours: ColourKey[];
}

export const SHOP_CATEGORIES = [
  'Home decor',
  'Desk and gadgets',
  'Figurines and miniatures',
  'Gifts and personalized',
  'Spare parts',
  'Hobby and cosplay',
] as const;

export const SHOP_MATERIALS: Material[] = ['PLA+', 'PETG', 'ABS / ASA', 'Resin'];

export const SHOP_PRODUCTS: ShopProduct[] = [
  { id: 'p01', name: 'Layered vase', category: 'Home decor', inStock: true, material: 'PLA+', colours: ['violet', 'lime', 'black'] },
  { id: 'p02', name: 'Desk cable organiser', category: 'Desk and gadgets', inStock: true, material: 'PETG', colours: ['black', 'white', 'orange'] },
  { id: 'p03', name: 'Phone stand', category: 'Desk and gadgets', inStock: true, material: 'PLA+', colours: ['lime', 'violet', 'black'] },
  { id: 'p04', name: 'Miniature knight', category: 'Figurines and miniatures', inStock: false, material: 'Resin', colours: ['white', 'black'] },
  { id: 'p05', name: 'Name plate', category: 'Gifts and personalized', inStock: false, material: 'PLA+', colours: ['orange', 'violet', 'lime', 'black'] },
  { id: 'p06', name: 'Planter with drainage', category: 'Home decor', inStock: true, material: 'PLA+', colours: ['orange', 'white', 'violet'] },
  { id: 'p07', name: 'Replacement knob', category: 'Spare parts', inStock: true, material: 'ABS / ASA', colours: ['black', 'white'] },
  { id: 'p08', name: 'Dice tower', category: 'Hobby and cosplay', inStock: false, material: 'PETG', colours: ['violet', 'black', 'orange'] },
  { id: 'p09', name: 'Keychain set', category: 'Gifts and personalized', inStock: true, material: 'PLA+', colours: ['lime', 'orange', 'violet'] },
  { id: 'p10', name: 'Wall hook trio', category: 'Home decor', inStock: true, material: 'PETG', colours: ['black', 'lime'] },
  { id: 'p11', name: 'Cosplay badge', category: 'Hobby and cosplay', inStock: false, material: 'Resin', colours: ['orange', 'black'] },
  { id: 'p12', name: 'Shelf bracket', category: 'Spare parts', inStock: true, material: 'PETG', colours: ['white', 'black'] },
];
