'use client';

import { useState, type ReactNode } from 'react';
import { Pic } from '@/components/ui/Pic';
import Link from 'next/link';
import { useLiveProducts } from '@/lib/live-catalogue';
import { COMPARE_MAX, useCompare } from '@/lib/lists-store';
import { useCart } from '@/lib/cart-store';
import {
  COLOURS,
  MODE_LABEL,
  SHOP_MATERIALS,
  SIZE_OPTIONS,
  productSlug,
  type ShopProduct,
} from '@/lib/shop-data';

/** Side-by-side table of the products chosen with the Compare buttons. */
export function CompareView({ products: built }: { products: ShopProduct[] }) {
  const all = useLiveProducts(built);
  const { ids, remove, clear } = useCompare();
  const cart = useCart();
  const [added, setAdded] = useState<string | null>(null);

  const list = ids
    .map((id) => all.find((p) => p.id === id))
    .filter((p): p is ShopProduct => Boolean(p));

  if (list.length === 0) {
    return (
      <div className="empty show" role="status">
        <p>
          <b>Nothing to compare yet.</b>
        </p>
        <p className="muted">Press Compare on two or more products, then come back here.</p>
        <Link className="btn btn-primary" href="/shop">
          Shop ready-made
        </Link>
      </div>
    );
  }

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

  const rows: { label: string; cell: (p: ShopProduct) => ReactNode }[] = [
    { label: 'Price', cell: (p) => <b className="cmp-price">{p.price ?? '₹[price]'}</b> },
    {
      label: 'Category',
      cell: (p) => (p.sub && p.sub !== p.category ? `${p.category} · ${p.sub}` : p.category),
    },
    { label: 'Availability', cell: (p) => (p.inStock ? 'In stock' : 'Made to order') },
    {
      label: 'Material',
      cell: (p) => (p.materials?.length ? p.materials : SHOP_MATERIALS).join(', '),
    },
    {
      label: 'Colours',
      cell: (p) => (
        <span className="cmp-sw">
          {p.colours.map((c) => (
            <i key={c} title={c} style={{ background: COLOURS[c] }} />
          ))}
        </span>
      ),
    },
    { label: 'Colour option', cell: (p) => p.modes.map((m) => MODE_LABEL[m]).join(', ') },
    { label: 'Sizes', cell: (p) => (p.sizes?.length ? p.sizes : SIZE_OPTIONS).join(', ') },
    { label: 'Process', cell: (p) => p.process },
    {
      label: 'Rating',
      cell: (p) =>
        p.rating && p.reviewCount
          ? `★ ${p.rating.toFixed(1)} (${p.reviewCount})`
          : 'No reviews yet',
    },
    {
      label: 'Bulk prices',
      cell: (p) =>
        p.bulkTiers?.length
          ? p.bulkTiers.map((t) => `${t.from}${t.to ? `–${t.to}` : '+'}: ${t.price}`).join(' · ')
          : 'On request',
    },
  ];

  return (
    <>
      <div className="toolbar">
        <div className="result" role="status" aria-live="polite">
          Comparing {list.length} of {COMPARE_MAX}
        </div>
        <button type="button" className="link-btn" onClick={clear}>
          Clear all
        </button>
      </div>
      <div className="cmp-wrap">
        <table className="cmp">
          <caption className="sr-only">Product comparison</caption>
          <thead>
            <tr>
              <th scope="col" className="cmp-lab">
                <span className="sr-only">Feature</span>
              </th>
              {list.map((p) => (
                <th scope="col" key={p.id}>
                  <div className="cmp-head">
                    <button
                      type="button"
                      className="cmp-x"
                      aria-label={`Remove ${p.name} from compare`}
                      onClick={() => remove(p.id)}
                    >
                      ×
                    </button>
                    <Link className="cmp-img" href={`/product/${productSlug(p)}`}>
                      {p.images?.[0] ? (
                        <Pic src={p.images[0]} alt="" sizes="220px" widths={[256, 384]} />
                      ) : (
                        <span className="stripes" />
                      )}
                    </Link>
                    <Link className="cmp-name" href={`/product/${productSlug(p)}`}>
                      {p.name}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="cmp-lab">
                  {r.label}
                </th>
                {list.map((p) => (
                  <td key={p.id}>{r.cell(p)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className="cmp-lab">
                <span className="sr-only">Add to cart</span>
              </th>
              {list.map((p) => (
                <td key={p.id}>
                  <button
                    type="button"
                    className={added === p.id ? 'btn btn-primary btn-sm' : 'btn btn-sm'}
                    onClick={() => add(p)}
                  >
                    {added === p.id ? 'Added ✓' : 'Add to cart'}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
