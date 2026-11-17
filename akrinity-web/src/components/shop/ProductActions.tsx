'use client';

import { useState } from 'react';
import { COMPARE_MAX, useCompare, useWishlist } from '@/lib/lists-store';

const heart = <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />;

/** Heart button: saves the product to the wishlist. */
export function WishButton({
  id,
  name,
  className = 'pc-round pc-heart',
  onChange,
}: {
  id: string;
  name: string;
  className?: string;
  onChange?: (saved: boolean) => void;
}) {
  const { has, toggle } = useWishlist();
  const saved = has(id);
  return (
    <button
      type="button"
      className={className}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={() => {
        toggle(id);
        onChange?.(!saved);
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={saved ? '#0B0B0C' : 'none'}
        stroke="#0B0B0C"
        strokeWidth="2"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {heart}
      </svg>
    </button>
  );
}

/** "Compare" toggle. At most four products can be compared at once. */
export function CompareButton({
  id,
  name,
  className = 'cmp-btn',
  onMessage,
}: {
  id: string;
  name: string;
  className?: string;
  onMessage?: (text: string) => void;
}) {
  const { has, toggle } = useCompare();
  const [full, setFull] = useState(false);
  const on = has(id);
  return (
    <button
      type="button"
      className={className}
      aria-pressed={on}
      onClick={() => {
        const ok = toggle(id);
        setFull(!ok);
        if (!ok) onMessage?.(`You can compare up to ${COMPARE_MAX} products. Remove one first.`);
        else onMessage?.(on ? `${name} removed from compare` : `${name} added to compare`);
      }}
      title={full ? `Up to ${COMPARE_MAX} products` : undefined}
    >
      <span className="cmp-box" aria-hidden="true">
        {on ? '✓' : ''}
      </span>
      Compare
    </button>
  );
}
