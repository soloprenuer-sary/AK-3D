'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pic } from '@/components/ui/Pic';
import { useLiveProducts } from '@/lib/live-catalogue';
import { useCart, type CartLine } from '@/lib/cart-store';
import { productSlug, type ShopProduct } from '@/lib/shop-data';

const SHOW = 4;

/** The first price in a product's price text, as a number, for sorting. */
const priceOf = (p: ShopProduct): number => {
  const n = Number((p.price ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : Number.MAX_SAFE_INTEGER;
};

/**
 * "Goes with your cart": products from the same categories as the cart, that are not in it yet.
 * Stocked items come first, then the cheapest, so the row is easy to add to.
 */
export function CartUpsell({ lines }: { lines: CartLine[] }) {
  const all = useLiveProducts([]);
  const cart = useCart();
  const [added, setAdded] = useState<string | null>(null);

  const inCart = new Set(lines.map((l) => l.id));
  const cartProducts = all.filter((p) => inCart.has(p.id));
  const categories = new Set(cartProducts.map((p) => p.category).filter(Boolean));

  const picks = all
    .filter((p) => !inCart.has(p.id) && p.images?.[0])
    .map((p) => ({ p, same: categories.has(p.category) ? 1 : 0 }))
    .filter((x) => x.same === 1 || categories.size === 0)
    .sort(
      (a, b) =>
        Number(b.p.inStock) - Number(a.p.inStock) ||
        a.p.name.localeCompare(b.p.name) ||
        priceOf(a.p) - priceOf(b.p),
    )
    .slice(0, SHOW)
    .map((x) => x.p);

  if (picks.length === 0) return null;

  const add = (p: ShopProduct) => {
    cart.add({
      id: p.id,
      slug: productSlug(p),
      name: p.name,
      mode: p.modes[0],
      price: p.price,
      image: p.images?.[0],
      madeToOrder: !p.inStock,
    });
    setAdded(p.id);
    setTimeout(() => setAdded(null), 1400);
  };

  return (
    <section className="cart-up" aria-labelledby="cart-up-h">
      <h2 id="cart-up-h" className="cart-up-h">
        Goes well with your order
      </h2>
      <ul className="cart-up-list">
        {picks.map((p) => (
          <li key={p.id} className="cart-up-item">
            <Link
              href={`/product/${productSlug(p)}`}
              className="cart-up-img"
              tabIndex={-1}
              aria-hidden="true"
            >
              <Pic src={p.images?.[0] ?? ''} alt="" sizes="160px" widths={[256, 384]} />
            </Link>
            <div className="cart-up-info">
              <Link href={`/product/${productSlug(p)}`} className="cart-up-name">
                {p.name}
              </Link>
              <span className="meta">{p.price ?? 'Ask us'}</span>
            </div>
            <button
              type="button"
              className={added === p.id ? 'btn btn-primary btn-sm' : 'btn btn-sm'}
              onClick={() => add(p)}
            >
              {added === p.id ? 'Added' : 'Add'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
