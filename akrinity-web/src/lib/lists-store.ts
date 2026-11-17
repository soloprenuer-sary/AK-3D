'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Two small lists kept in the browser (localStorage): the wishlist and the compare list. Each holds
 * product ids ("wc-12"). They survive a reload and stay in step across tabs.
 */
function makeList(key: string, max: number) {
  const listeners = new Set<() => void>();
  let cache: string[] | null = null;

  const read = (): string[] => {
    if (cache) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cache = Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === 'string').slice(0, max)
        : [];
    } catch {
      cache = [];
    }
    return cache;
  };
  const write = (next: string[]) => {
    cache = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* private mode: the list lasts until the page closes */
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = null;
        l();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener('storage', onStorage);
    };
  };
  const EMPTY: string[] = [];

  return function useList() {
    const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
    const has = useCallback((id: string) => ids.includes(id), [ids]);
    /** Adds or removes. Returns false when the list is full and the id was not added. */
    const toggle = useCallback((id: string): boolean => {
      const cur = read();
      if (cur.includes(id)) {
        write(cur.filter((x) => x !== id));
        return true;
      }
      if (cur.length >= max) return false;
      write([...cur, id]);
      return true;
    }, []);
    const remove = useCallback((id: string) => write(read().filter((x) => x !== id)), []);
    const clear = useCallback(() => write([]), []);
    return { ids, has, toggle, remove, clear, count: ids.length, max };
  };
}

export const useWishlist = makeList('akrinity-wishlist-v1', 100);
export const COMPARE_MAX = 4;
export const useCompare = makeList('akrinity-compare-v1', COMPARE_MAX);
