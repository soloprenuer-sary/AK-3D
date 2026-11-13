'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { MODE_LABEL, type ColourMode } from './shop-data';

/** Sample cart kept in memory for the sample site. WooCommerce Store API replaces this later. */
export interface CartLine {
  key: string;
  id: string;
  name: string;
  mode: ColourMode;
  qty: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  add: (p: { id: string; name: string; mode: ColourMode; qty?: number }) => void;
  remove: (key: string) => void;
  clear: () => void;
  modeLabel: (m: ColourMode) => string;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const add = useCallback<CartContextValue['add']>((p) => {
    const qty = p.qty ?? 1;
    setLines((list) => {
      const key = `${p.id}:${p.mode}`;
      const found = list.find((l) => l.key === key);
      if (found) return list.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l));
      return [...list, { key, id: p.id, name: p.name, mode: p.mode, qty }];
    });
  }, []);

  const remove = useCallback((key: string) => setLines((list) => list.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      add,
      remove,
      clear,
      modeLabel: (m) => MODE_LABEL[m],
    }),
    [lines, add, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
