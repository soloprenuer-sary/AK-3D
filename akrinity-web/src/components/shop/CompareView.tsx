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

const priceOf = (p: ShopProduct): number | null => {
  const n = Number((p.price ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const spec = (p: ShopProduct, re: RegExp): string =>
  p.specs?.find((s) => re.test(s.name))?.value ?? '';

interface Row {
  label: string;
  /** What the cell says, as plain text. Used to find the rows where the products differ. */
  value: (p: ShopProduct) => string;
  /** A richer cell, when the plain text is not enough. */
  cell?: (p: ShopProduct, best: boolean) => ReactNode;
}

/** Side-by-side comparison of the products chosen with the Compare buttons. */
export function CompareView({ products: built }: { products: ShopProduct[] }) {
  const all = useLiveProducts(built);
  const { ids, remove, clear } = useCompare();
  const cart = useCart();
  const [added, setAdded] = useState<string | null>(null);
  const [diffOnly, setDiffOnly] = useState(false);

  const list = ids
    .map((id) => all.find((p) => p.id === id))
    .filter((p): p is ShopProduct => Boolean(p));

  if (list.length === 0) {
    return (
      <div className="empty show" role="status">
        <p>
          <b>Nothing to compare yet.</b>
        </p>
        <p className="muted">
          Press Compare on two or more products, then come back here to see them side by side.
        </p>
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

  const prices = list.map(priceOf).filter((n): n is number => n !== null);
  const lowest = prices.length > 1 ? Math.min(...prices) : null;
  const ratings = list.map((p) => (p.rating && p.reviewCount ? p.rating : 0));
  const topRating = Math.max(...ratings);

  const rows: Row[] = [
    {
      label: 'Price',
      value: (p) => p.price ?? '',
      cell: (p, best) => (
        <>
          <b className="cmp-price">{p.price ?? 'Ask us'}</b>
          <span className="cmp-gst">incl. GST</span>
          {best && <span className="cmp-best">Lowest price</span>}
        </>
      ),
    },
    {
      label: 'Availability',
      value: (p) => (p.inStock ? 'In stock' : 'Made to order'),
      cell: (p) => (
        <span className={p.inStock ? 'cmp-chip ok' : 'cmp-chip'}>
          {p.inStock ? 'In stock' : 'Made to order'}
        </span>
      ),
    },
    {
      label: 'Category',
      value: (p) => (p.sub && p.sub !== p.category ? `${p.category} · ${p.sub}` : p.category),
    },
    {
      label: 'Material',
      value: (p) => (p.materials?.length ? p.materials : SHOP_MATERIALS).join(', '),
    },
    {
      label: 'Colours',
      value: (p) => p.colours.join(','),
      cell: (p) => (
        <span className="cmp-sw">
          {p.colours.map((c) => (
            <i key={c} title={c} style={{ background: COLOURS[c] }} />
          ))}
        </span>
      ),
    },
    { label: 'Colour option', value: (p) => p.modes.map((m) => MODE_LABEL[m]).join(', ') },
    { label: 'Sizes', value: (p) => (p.sizes?.length ? p.sizes : SIZE_OPTIONS).join(', ') },
    { label: 'Size of the product', value: (p) => spec(p, /^dimensions/i) || '—' },
    { label: 'Weight', value: (p) => spec(p, /^weight/i) || '—' },
    { label: 'Process', value: (p) => p.process },
    {
      label: 'Rating',
      value: (p) =>
        p.rating && p.reviewCount ? `${p.rating.toFixed(1)} (${p.reviewCount})` : 'No reviews yet',
      cell: (p) =>
        p.rating && p.reviewCount ? (
          <span className={p.rating === topRating && list.length > 1 ? 'cmp-best' : ''}>
            ★ {p.rating.toFixed(1)} <span className="muted">({p.reviewCount})</span>
          </span>
        ) : (
          <span className="muted">No reviews yet</span>
        ),
    },
    {
      label: 'Bulk prices',
      value: (p) =>
        p.bulkTiers?.length
          ? p.bulkTiers.map((t) => `${t.from}${t.to ? `–${t.to}` : '+'}: ${t.price}`).join(' · ')
          : 'On request',
      cell: (p) =>
        p.bulkTiers?.length ? (
          <ul className="cmp-tiers">
            {p.bulkTiers.map((t) => (
              <li key={t.from}>
                <span>
                  {t.from}
                  {t.to ? `–${t.to}` : '+'} pcs
                </span>
                <b>{t.price}</b>
              </li>
            ))}
          </ul>
        ) : (
          <span className="muted">On request</span>
        ),
    },
  ];

  const differs = (r: Row) => new Set(list.map((p) => r.value(p))).size > 1;
  const shown = diffOnly && list.length > 1 ? rows.filter(differs) : rows;
  const same = rows.length - rows.filter(differs).length;

  return (
    <>
      <div className="toolbar cmp-bar">
        <div className="result" role="status" aria-live="polite">
          Comparing {list.length} of {COMPARE_MAX}
        </div>
        <div className="cmp-bar-actions">
          {list.length > 1 && (
            <label className="cmp-diff">
              <input
                type="checkbox"
                checked={diffOnly}
                onChange={(e) => setDiffOnly(e.target.checked)}
              />
              <span>
                Show only differences
                {same > 0 && <span className="muted"> ({same} rows are the same)</span>}
              </span>
            </label>
          )}
          <button type="button" className="link-btn" onClick={clear}>
            Clear all
          </button>
        </div>
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
                    <button
                      type="button"
                      className={added === p.id ? 'btn btn-primary btn-sm' : 'btn btn-sm'}
                      onClick={() => add(p)}
                    >
                      {added === p.id ? 'Added ✓' : 'Add to cart'}
                    </button>
                  </div>
                </th>
              ))}
              {list.length < COMPARE_MAX && (
                <th scope="col" className="cmp-more">
                  <Link href="/shop" className="cmp-add">
                    <span aria-hidden="true">+</span>
                    Add another product
                  </Link>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="cmp-lab">
                  {r.label}
                </th>
                {list.map((p) => (
                  <td key={p.id}>
                    {r.cell
                      ? r.cell(p, r.label === 'Price' && lowest !== null && priceOf(p) === lowest)
                      : r.value(p)}
                  </td>
                ))}
                {list.length < COMPARE_MAX && <td className="cmp-more" aria-hidden="true" />}
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={list.length + 2} className="cmp-none">
                  These products are the same on every row. Turn off the filter to see the rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
