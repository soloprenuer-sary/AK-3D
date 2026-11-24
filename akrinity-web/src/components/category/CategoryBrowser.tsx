'use client';

import Link from 'next/link';
import { Pic } from '@/components/ui/Pic';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLiveProducts } from '@/lib/live-catalogue';
import {
  COLOURS,
  SHOP_MATERIALS,
  SIZE_OPTIONS,
  productSlug,
  subHref,
  type ColourKey,
  type Material,
  type ShopCategory,
  type ShopProduct,
} from '@/lib/shop-data';
import { useCart } from '@/lib/cart-store';
import { ProductCard } from '@/components/shop/ProductCard';
import { QuickView } from '@/components/shop/QuickView';

type Availability = 'all' | 'stock' | 'mto';
type Price = 'any' | 'u500' | 'mid' | 'o1000';
type Sort = 'featured' | 'low' | 'high' | 'name';

const MORE = '__more';

const PRICES: { value: Price; label: string }[] = [
  { value: 'any', label: 'Any price' },
  { value: 'u500', label: 'Under ₹500' },
  { value: 'mid', label: '₹500 to ₹1,000' },
  { value: 'o1000', label: 'Over ₹1,000' },
];
const AVAIL: { value: Availability; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'stock', label: 'In stock' },
  { value: 'mto', label: 'Made to order' },
];

const priceNum = (p: ShopProduct): number | null => {
  const n = Number((p.price ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d="M1 3l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Drop({
  id,
  label,
  count,
  open,
  setOpen,
  children,
}: {
  id: string;
  label: string;
  count: number;
  open: string | null;
  setOpen: (v: string | null) => void;
  children: ReactNode;
}) {
  return (
    <div className="cb-drop" data-drop>
      <button
        type="button"
        className={count ? 'cb-btn on' : 'cb-btn'}
        aria-expanded={open === id}
        onClick={() => setOpen(open === id ? null : id)}
      >
        {label}
        {count > 0 && <span className="cb-n">{count}</span>}
        <Chevron />
      </button>
      {open === id && (
        <div className="cb-pop" role="group" aria-label={label}>
          {children}
        </div>
      )}
    </div>
  );
}

interface Props {
  products: ShopProduct[];
  category: ShopCategory;
  /** Tile background when a sub-category has no picture yet. */
  tone: string;
}

/**
 * The product area of a category page: sub-category tiles, a sticky filter bar, and either one row
 * of four per sub-category (nothing chosen) or one full grid (a sub-category or filter chosen).
 */
export function CategoryBrowser({ products: built, category, tone }: Props) {
  const live = useLiveProducts(built);
  const all = useMemo(
    () => live.filter((p) => p.category === category.name),
    [live, category.name],
  );

  const [sub, setSub] = useState<string>('All');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [colours, setColours] = useState<ColourKey[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [price, setPrice] = useState<Price>('any');
  const [avail, setAvail] = useState<Availability>('all');
  const [sort, setSort] = useState<Sort>('featured');
  const [open, setOpen] = useState<string | null>(null);
  const [quick, setQuick] = useState<ShopProduct | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const top = useRef<HTMLDivElement>(null);
  const addTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartApi = useCart();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('[data-drop]')) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (addTimer.current) clearTimeout(addTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1800);
  };

  const addToCart = (p: ShopProduct) => {
    cartApi.add({
      id: p.id,
      slug: productSlug(p),
      name: p.name,
      mode: p.modes[0],
      price: p.price,
      image: p.images?.[0],
      madeToOrder: !p.inStock,
    });
    setJustAdded(p.id);
    if (addTimer.current) clearTimeout(addTimer.current);
    addTimer.current = setTimeout(() => setJustAdded(null), 1400);
    notify(`${p.name} added to cart`);
  };

  const choose = useCallback((next: string) => {
    setSub(next);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const toggle = <T,>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const passes = (p: ShopProduct) => {
    if (materials.length && !materials.some((m) => (p.materials ?? [p.material]).includes(m)))
      return false;
    if (colours.length && !colours.some((c) => p.colours.includes(c))) return false;
    if (sizes.length && !sizes.some((s) => (p.sizes ?? SIZE_OPTIONS).includes(s))) return false;
    if (avail === 'stock' && !p.inStock) return false;
    if (avail === 'mto' && p.inStock) return false;
    if (price !== 'any') {
      const n = priceNum(p);
      if (n === null) return false;
      if (price === 'u500' && n >= 500) return false;
      if (price === 'mid' && (n < 500 || n > 1000)) return false;
      if (price === 'o1000' && n <= 1000) return false;
    }
    return true;
  };

  const filtersOn =
    materials.length > 0 ||
    colours.length > 0 ||
    sizes.length > 0 ||
    price !== 'any' ||
    avail !== 'all' ||
    sort !== 'featured';

  const clearFilters = () => {
    setMaterials([]);
    setColours([]);
    setSizes([]);
    setPrice('any');
    setAvail('all');
    setSort('featured');
  };

  const sorted = (list: ShopProduct[]) => {
    const l = [...list];
    if (sort === 'name') l.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'low') l.sort((a, b) => (priceNum(a) ?? 1e9) - (priceNum(b) ?? 1e9));
    if (sort === 'high') l.sort((a, b) => (priceNum(b) ?? -1) - (priceNum(a) ?? -1));
    return l;
  };

  const inSub = (p: ShopProduct, s: string) =>
    s === 'All' ? true : s === MORE ? !category.subs.includes(p.sub) : p.sub === s;

  const countOf = (s: string) => all.filter((p) => p.sub === s).length;
  const grouped = sub === 'All' && !filtersOn;
  const flat = sorted(all.filter((p) => inSub(p, sub) && passes(p)));
  const more = all.filter((p) => !category.subs.includes(p.sub));

  const chips: { label: string; remove: () => void }[] = [
    ...materials.map((m) => ({ label: m, remove: () => setMaterials((l) => toggle(l, m)) })),
    ...colours.map((c) => ({
      label: c[0].toUpperCase() + c.slice(1),
      remove: () => setColours((l) => toggle(l, c)),
    })),
    ...sizes.map((s) => ({ label: s, remove: () => setSizes((l) => toggle(l, s)) })),
  ];
  if (price !== 'any')
    chips.push({
      label: PRICES.find((x) => x.value === price)!.label,
      remove: () => setPrice('any'),
    });
  if (avail !== 'all')
    chips.push({
      label: AVAIL.find((x) => x.value === avail)!.label,
      remove: () => setAvail('all'),
    });

  const card = (p: ShopProduct) => (
    <ProductCard
      key={p.id}
      product={p}
      justAdded={justAdded === p.id}
      onQuickView={setQuick}
      onAdd={addToCart}
      onSave={(product, saved) =>
        notify(saved ? `${product.name} saved` : `${product.name} removed from saved`)
      }
    />
  );

  const row = (title: string, key: string, list: ShopProduct[], target: string) => (
    <section className="cb-group" key={target} aria-label={title}>
      <div className="cb-group-h">
        <h2 className="d">
          {title} <span className="cb-count">{list.length}</span>
        </h2>
        {target === MORE ? (
          <button type="button" className="link-btn" onClick={() => choose(target)}>
            View all →
          </button>
        ) : (
          <Link
            className="link-btn"
            href={subHref(
              category,
              category.subInfo.find((x) => x.name === target)!,
            )}
          >
            View all →
          </Link>
        )}
      </div>
      <div className="cb-row">{list.slice(0, 4).map(card)}</div>
    </section>
  );

  const heading =
    sub === 'All' ? category.name : sub === MORE ? `More ${category.name.toLowerCase()}` : sub;

  return (
    <div className="cb" id="products">
      <div ref={top} className="cb-anchor" aria-hidden="true" />

      <section className="wrap cb-tiles-wrap" aria-label="Sub-categories">
        <div className="cb-tiles">
          {category.subInfo.map((si, ti) => {
            const s = si.name;
            const img = si.image;
            const n = countOf(s);
            return (
              <Link key={si.slug} className="cb-tile" href={subHref(category, si)}>
                <span className="cb-tile-img" style={{ background: tone }}>
                  {img ? (
                    <Pic
                      src={img}
                      alt=""
                      sizes="(max-width: 640px) 50vw, 25vw"
                      priority={ti < 4}
                      widths={[256, 384, 640]}
                    />
                  ) : (
                    <b aria-hidden="true">{s.charAt(0)}</b>
                  )}
                </span>
                <span className="cb-tile-name">{s}</span>
                <span className="cb-tile-n">
                  {n} {n === 1 ? 'product' : 'products'}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="cb-bar" role="toolbar" aria-label="Filter and sort">
        <div className="wrap cb-bar-in">
          <button
            type="button"
            className={sub === 'All' ? 'cb-btn on' : 'cb-btn'}
            aria-pressed={sub === 'All'}
            onClick={() => choose('All')}
          >
            All
          </button>
          <Drop
            id="material"
            label="Material"
            count={materials.length}
            open={open}
            setOpen={setOpen}
          >
            {SHOP_MATERIALS.map((m) => (
              <label key={m} className="cb-opt">
                <input
                  type="checkbox"
                  checked={materials.includes(m)}
                  onChange={() => setMaterials((l) => toggle(l, m))}
                />
                <span>{m}</span>
              </label>
            ))}
          </Drop>
          <Drop id="colour" label="Colour" count={colours.length} open={open} setOpen={setOpen}>
            {(Object.keys(COLOURS) as ColourKey[]).map((c) => (
              <label key={c} className="cb-opt">
                <input
                  type="checkbox"
                  checked={colours.includes(c)}
                  onChange={() => setColours((l) => toggle(l, c))}
                />
                <span className="cb-sw" style={{ background: COLOURS[c] }} aria-hidden="true" />
                <span>{c[0].toUpperCase() + c.slice(1)}</span>
              </label>
            ))}
          </Drop>
          <Drop id="size" label="Size" count={sizes.length} open={open} setOpen={setOpen}>
            {SIZE_OPTIONS.map((s) => (
              <label key={s} className="cb-opt">
                <input
                  type="checkbox"
                  checked={sizes.includes(s)}
                  onChange={() => setSizes((l) => toggle(l, s))}
                />
                <span>{s}</span>
              </label>
            ))}
          </Drop>
          <Drop
            id="price"
            label="Price"
            count={price === 'any' ? 0 : 1}
            open={open}
            setOpen={setOpen}
          >
            {PRICES.map((x) => (
              <label key={x.value} className="cb-opt">
                <input
                  type="radio"
                  name="cb-price"
                  checked={price === x.value}
                  onChange={() => setPrice(x.value)}
                />
                <span>{x.label}</span>
              </label>
            ))}
          </Drop>
          <Drop
            id="avail"
            label="Availability"
            count={avail === 'all' ? 0 : 1}
            open={open}
            setOpen={setOpen}
          >
            {AVAIL.map((x) => (
              <label key={x.value} className="cb-opt">
                <input
                  type="radio"
                  name="cb-avail"
                  checked={avail === x.value}
                  onChange={() => setAvail(x.value)}
                />
                <span>{x.label}</span>
              </label>
            ))}
          </Drop>
          <span className="cb-grow" />
          <label className="cb-sort">
            <span className="sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort by"
            >
              <option value="featured">Sort: Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="name">Name A to Z</option>
            </select>
          </label>
        </div>
      </div>

      <div className="wrap cb-body">
        {chips.length > 0 && (
          <div className="active-chips cb-chips">
            {chips.map((c) => (
              <span key={c.label} className="achip">
                {c.label}
                <button type="button" aria-label={`Remove filter ${c.label}`} onClick={c.remove}>
                  ×
                </button>
              </span>
            ))}
            <button type="button" className="link-btn" onClick={clearFilters}>
              Clear all
            </button>
          </div>
        )}

        {grouped ? (
          <>
            {category.subs.map((s) => {
              const list = all.filter((p) => p.sub === s);
              return list.length ? row(s, s, list, s) : null;
            })}
            {more.length > 0 && row(`More ${category.name.toLowerCase()}`, '', more, MORE)}
            {all.length === 0 && (
              <div className="empty show" role="status">
                <p>
                  <b>New pieces coming soon.</b>
                </p>
                <Link className="btn" href="/shop">
                  Browse the whole shop
                </Link>
              </div>
            )}
          </>
        ) : (
          <section aria-label={heading}>
            <div className="cb-group-h">
              <h2 className="d">
                {heading} <span className="cb-count">{flat.length}</span>
              </h2>
              {sub !== 'All' && (
                <button type="button" className="link-btn" onClick={() => choose('All')}>
                  ← All {category.name.toLowerCase()}
                </button>
              )}
            </div>
            {flat.length > 0 ? (
              <div
                className="cb-row cb-grid"
                role="status"
                aria-live="polite"
                aria-label={`${flat.length} products`}
              >
                {flat.map(card)}
              </div>
            ) : (
              <div className="empty show" role="status">
                <p>
                  <b>
                    {filtersOn ? 'No products match these filters.' : 'New pieces coming soon.'}
                  </b>
                </p>
                {filtersOn ? (
                  <button type="button" className="btn" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : (
                  <button type="button" className="btn" onClick={() => choose('All')}>
                    Show all {category.name.toLowerCase()}
                  </button>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <QuickView product={quick} onClose={() => setQuick(null)} onAdd={addToCart} />

      <div className="toast" role="status" aria-live="polite" style={{ opacity: toast ? 1 : 0 }}>
        {toast}
      </div>
    </div>
  );
}
