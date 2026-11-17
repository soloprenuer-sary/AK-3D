'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { COMPARE_MAX, useCompare } from '@/lib/lists-store';

/** A bar at the bottom of the screen while products are chosen for comparison. */
export function CompareTray() {
  const { count, clear } = useCompare();
  const path = usePathname();
  if (count === 0 || path === '/compare') return null;
  return (
    <div className="cmp-tray" role="region" aria-label="Compare list">
      <span>
        <b>{count}</b> of {COMPARE_MAX} to compare
      </span>
      <span className="cmp-tray-actions">
        <button type="button" className="link-btn" onClick={clear}>
          Clear
        </button>
        <Link className="btn btn-sm btn-primary" href="/compare">
          Compare {count > 1 ? 'now' : ''}
        </Link>
      </span>
    </div>
  );
}
