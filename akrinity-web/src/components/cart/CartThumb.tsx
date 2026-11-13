import type { CSSProperties } from 'react';
import type { CartLine } from '@/lib/cart-store';

/** Product photo for a cart line, or a striped placeholder shape when the product has no photo yet. */
export function CartThumb({ line }: { line: Pick<CartLine, 'name' | 'image'> }) {
  if (line.image) {
    return (
      <span className="cart-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={line.image} alt={line.name} />
      </span>
    );
  }
  return (
    <span
      className="cart-thumb"
      role="img"
      aria-label={`${line.name} (photo coming)`}
      style={{ background: 'repeating-linear-gradient(0deg,var(--stripe) 0 6px,var(--stripe2) 6px 12px)' }}
    >
      <i style={{ ['--c' as string]: '#5B2BE0' } as CSSProperties} />
    </span>
  );
}
