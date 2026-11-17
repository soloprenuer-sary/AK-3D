'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLiveProducts } from '@/lib/live-catalogue';
import { useWishlist } from '@/lib/lists-store';
import { useCart } from '@/lib/cart-store';
import { productSlug, type ShopProduct } from '@/lib/shop-data';
import { ProductCard } from './ProductCard';
import { QuickView } from './QuickView';

/** The saved products. Reads the browser's wishlist and shows those products from the catalogue. */
export function WishlistView({ products: built }: { products: ShopProduct[] }) {
  const all = useLiveProducts(built);
  const { ids, clear } = useWishlist();
  const cart = useCart();
  const [quick, setQuick] = useState<ShopProduct | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const saved = ids
    .map((id) => all.find((p) => p.id === id))
    .filter((p): p is ShopProduct => Boolean(p));

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

  if (saved.length === 0) {
    return (
      <div className="empty show" role="status">
        <p>
          <b>Nothing saved yet.</b>
        </p>
        <p className="muted">Tap the heart on any product to keep it here.</p>
        <Link className="btn btn-primary" href="/shop">
          Shop ready-made
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="toolbar">
        <div className="result" role="status" aria-live="polite">
          {saved.length} saved {saved.length === 1 ? 'product' : 'products'}
        </div>
        <button type="button" className="link-btn" onClick={clear}>
          Clear wishlist
        </button>
      </div>
      <div className="grid-shop">
        {saved.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            justAdded={added === p.id}
            onQuickView={setQuick}
            onAdd={add}
            onSave={() => undefined}
          />
        ))}
      </div>
      <QuickView product={quick} onClose={() => setQuick(null)} onAdd={add} />
    </>
  );
}
