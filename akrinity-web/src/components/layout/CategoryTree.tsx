'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { CATEGORIES, type ShopCategory } from '@/lib/shop-data';

const TreeContext = createContext<ShopCategory[]>(CATEGORIES);

/** Gives client components the category tree that the server read from WordPress. */
export function CategoryTreeProvider({ tree, children }: { tree: ShopCategory[]; children: ReactNode }) {
  return <TreeContext.Provider value={tree}>{children}</TreeContext.Provider>;
}

export function useCategoryTree(): ShopCategory[] {
  return useContext(TreeContext);
}
