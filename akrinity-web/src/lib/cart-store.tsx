'use client';

import { useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { MODE_LABEL, type ColourMode } from './shop-data';

/**
 * Sample cart kept in the browser (localStorage) so it survives a reload. WooCommerce Store API
 * replaces this when the store is connected; totals will then come from the server.
 */
export interface CartLine {
  key: string;
  id: string;
  slug: string;
  name: string;
  mode: ColourMode;
  qty: number;
  /** Chosen options for display, for example "PLA+ · white · Medium · Name: Ann". */
  detail?: string;
  /** Price per item as shown on the product, for example "₹499". */
  price?: string;
  image?: string;
  madeToOrder: boolean;
}

export interface AddToCart {
  id: string;
  slug: string;
  name: string;
  mode: ColourMode;
  qty?: number;
  detail?: string;
  price?: string;
  image?: string;
  madeToOrder?: boolean;
}

const STORAGE_KEY = 'akrinity-cart-v1';
const EMPTY: CartLine[] = [];

let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function isLine(x: unknown): x is CartLine {
  const l = x as CartLine;
  return Boolean(l) && typeof l.key === 'string' && typeof l.id === 'string' && typeof l.name === 'string' && typeof l.qty === 'number' && l.qty > 0;
}

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) lines = parsed.filter(isLine).map((l) => ({ ...l, slug: l.slug ?? '', madeToOrder: Boolean(l.madeToOrder) }));
  } catch {
    // Private mode or bad data: start with an empty cart.
  }
}

function commit(next: CartLine[]) {
  lines = next.length ? next : EMPTY;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage blocked: the cart still works for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    loaded = false;
    lines = EMPTY;
    load();
    listeners.forEach((l) => l());
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot() {
  load();
  return lines;
}

function getServerSnapshot() {
  return EMPTY;
}

const add = (p: AddToCart) => {
  const qty = p.qty ?? 1;
  const key = `${p.id}:${p.mode}:${p.detail ?? ''}`;
  const found = lines.find((l) => l.key === key);
  if (found) {
    commit(lines.map((l) => (l.key === key ? { ...l, qty: Math.min(100, l.qty + qty) } : l)));
    return;
  }
  commit([
    ...lines,
    {
      key,
      id: p.id,
      slug: p.slug,
      name: p.name,
      mode: p.mode,
      qty: Math.min(100, qty),
      detail: p.detail,
      price: p.price,
      image: p.image,
      madeToOrder: Boolean(p.madeToOrder),
    },
  ]);
};
const remove = (key: string) => commit(lines.filter((l) => l.key !== key));
const setQty = (key: string, qty: number) => {
  if (qty < 1) return remove(key);
  commit(lines.map((l) => (l.key === key ? { ...l, qty: Math.min(100, qty) } : l)));
};
const clear = () => commit([]);

/** "₹1,499" -> 1499. Returns null when the price is missing or still a placeholder. */
export function parsePrice(price?: string): number | null {
  if (!price) return null;
  const n = Number(price.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatRupees(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/** The cart store needs no provider. Kept so the app layout does not change. */
export function CartProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useCart() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    const prices = current.map((l) => {
      const p = parsePrice(l.price);
      return p === null ? null : p * l.qty;
    });
    const subtotal = current.length > 0 && prices.every((p) => p !== null) ? (prices as number[]).reduce((a, b) => a + b, 0) : null;
    return {
      lines: current,
      count: current.reduce((n, l) => n + l.qty, 0),
      /** Sum of line prices, or null when any item still has a placeholder price. */
      subtotal,
      hasMadeToOrder: current.some((l) => l.madeToOrder),
      add,
      remove,
      setQty,
      clear,
      modeLabel: (m: ColourMode) => MODE_LABEL[m],
    };
  }, [current]);
}
