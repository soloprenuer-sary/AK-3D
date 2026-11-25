'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Shows the first `first` products, then `step` more each time the sentinel element (placed after
 * the last card) scrolls into view. Starts again from `first` whenever `resetKey` changes, for
 * example when a filter or sort changes the list.
 */
export function useLoadMore(total: number, resetKey: string, first = 15, step = 10) {
  const [count, setCount] = useState(first);
  const [lastKey, setLastKey] = useState(resetKey);
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = count < total;

  // A new list starts again from the first batch (adjusting state while rendering, as React advises).
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setCount(first);
  }

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setCount((c) => c + step);
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, step, count]);

  return { count: Math.min(count, total), sentinel, hasMore };
}
