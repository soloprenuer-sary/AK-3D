'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCategoryTree } from '@/components/layout/CategoryTree';
import { mapPosts, mapStoreProduct, type GqlPost, type StoreProduct } from './wp';
import type { Guide } from './guides-data';
import type { ShopProduct } from './shop-data';

/**
 * Fresh catalogue from WordPress, loaded in the browser through /api/catalog/*. Pages are built
 * with the catalogue as it was at build time and shown straight away; when this answers, the
 * newer data replaces it, so edits in WordPress appear without a rebuild. If it fails, the built
 * data stays on screen.
 */

const cache = new Map<string, Promise<unknown>>();

function load<T>(kind: 'products' | 'posts', map: (raw: never) => T): Promise<T> {
  let p = cache.get(kind) as Promise<T> | undefined;
  if (!p) {
    p = fetch(`/api/catalog/${kind}`, { cache: 'no-store' }).then(async (res) => {
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !type.includes('application/json')) throw new Error(`catalogue ${res.status}`);
      return map((await res.json()) as never);
    });
    p.catch(() => cache.delete(kind)); // try again on the next visit
    cache.set(kind, p);
  }
  return p;
}

function useLive<T>(initial: T, kind: 'products' | 'posts', map: (raw: never) => T): T {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    let live = true;
    load(kind, map)
      .then((fresh) => {
        if (live) setValue(fresh);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
    // map is a module-level function, so it never changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);
  return value;
}

const mapArticles = (raw: GqlPost[]): Guide[] => mapPosts(raw);

/** The product list, refreshed from WooCommerce after the page opens. */
export function useLiveProducts(initial: ShopProduct[]): ShopProduct[] {
  const tree = useCategoryTree();
  const raw = useLive<StoreProduct[] | null>(null, 'products', ((r: StoreProduct[]) => r) as (raw: never) => StoreProduct[] | null);
  return useMemo(() => (raw ? raw.map((p) => mapStoreProduct(p, tree)) : initial), [raw, tree, initial]);
}

/** The article list, refreshed from WordPress after the page opens. */
export function useLiveGuides(initial: Guide[]): Guide[] {
  return useLive(initial, 'posts', mapArticles as (raw: never) => Guide[]);
}
