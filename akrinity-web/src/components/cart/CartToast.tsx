'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onCartAdd, type CartAdded } from '@/lib/cart-store';

/** How long the notification stays. */
const SHOW_MS = 3500;

/**
 * A short notification when something is added to the cart, on every page. It hides itself, waits
 * while the pointer or keyboard is on it, and can be closed.
 */
export function CartToast() {
  const [note, setNote] = useState<(CartAdded & { stamp: number }) | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => onCartAdd((added) => setNote({ ...added, stamp: Date.now() })), []);

  useEffect(() => {
    if (!note || paused) return;
    const timer = window.setTimeout(() => setNote(null), SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [note, paused]);

  const close = () => {
    setNote(null);
    setPaused(false);
  };

  return (
    <div className="cart-toast-area" role="status" aria-live="polite">
      {note && (
        <div
          className="cart-toast"
          onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={(e) => setPaused(e.target.matches(':focus-visible'))}
          onBlur={() => setPaused(false)}
        >
          {note.image ? (
            <img src={note.image} alt="" width={52} height={52} />
          ) : (
            <span className="cart-toast-tick" aria-hidden="true">
              ✓
            </span>
          )}
          <div className="cart-toast-text">
            <b>Added to cart</b>
            <span>{note.name}</span>
            <Link href="/cart" onClick={close}>
              View cart
            </Link>
          </div>
          <button type="button" aria-label="Close notification" onClick={close}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
