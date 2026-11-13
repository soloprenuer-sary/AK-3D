'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MODE_LABEL,
  SHOP_CATEGORIES,
  SHOP_MATERIALS,
  productSlug,
  type ColourMode,
  type Material,
  type ShopProduct,
} from '@/lib/shop-data';
import { useCart } from '@/lib/cart-store';
import { ProductCard } from './ProductCard';
import { QuickView } from './QuickView';

type Availability = 'all' | 'stock' | 'mto';
type Sort = 'featured' | 'name' | 'stock';
type ModeFilter = 'all' | ColourMode;

const AVAILABILITY: { value: Availability; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'stock', label: 'In stock' },
  { value: 'mto', label: 'Made to order' },
];

const MODE_FILTERS: { value: ModeFilter; label: string }[] = [
  { value: 'all', label: 'Any' },
  { value: 'single', label: 'Single colour' },
  { value: 'multi', label: 'Multi-colour' },
  { value: 'painted', label: 'Painted (later)' },
];

interface ShopBrowserProps {
  /** Products to show (from WordPress when connected, otherwise the sample catalogue). */
  products: ShopProduct[];
  /** When set, the page is one category: the category filter is fixed and subcategory chips show. */
  categoryName?: string;
  subcategories?: string[];
}

export function ShopBrowser({ products, categoryName, subcategories = [] }: ShopBrowserProps) {
  const fixed = Boolean(categoryName);
  const [category, setCategory] = useState<string>(categoryName ?? 'All');
  const [sub, setSub] = useState<string>('All');
  const [availability, setAvailability] = useState<Availability>('all');
  const [mode, setMode] = useState<ModeFilter>('all');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sort, setSort] = useState<Sort>('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quick, setQuick] = useState<ShopProduct | null>(null);
  const cartApi = useCart();
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const addTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clearAll = () => {
    if (!fixed) setCategory('All');
    setSub('All');
    setAvailability('all');
    setMode('all');
    setMaterials([]);
    setSort('featured');
  };

  const toggleMaterial = (m: Material) =>
    setMaterials((list) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]));

  const matches = (p: ShopProduct, ignoreCategory = false) => {
    if (!ignoreCategory && category !== 'All' && p.category !== category) return false;
    if (sub !== 'All' && p.sub !== sub) return false;
    if (availability === 'stock' && !p.inStock) return false;
    if (availability === 'mto' && p.inStock) return false;
    if (mode !== 'all' && !p.modes.includes(mode)) return false;
    if (materials.length && !materials.includes(p.material)) return false;
    return true;
  };

  let list = products.filter((p) => matches(p));
  if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'stock') list = [...list].sort((a, b) => Number(b.inStock) - Number(a.inStock));

  const activeChips: { label: string; remove: () => void }[] = [];
  if (!fixed && category !== 'All') activeChips.push({ label: category, remove: () => setCategory('All') });
  if (sub !== 'All') activeChips.push({ label: sub, remove: () => setSub('All') });
  if (availability !== 'all')
    activeChips.push({
      label: availability === 'stock' ? 'In stock' : 'Made to order',
      remove: () => setAvailability('all'),
    });
  if (mode !== 'all') activeChips.push({ label: MODE_LABEL[mode], remove: () => setMode('all') });
  materials.forEach((m) => activeChips.push({ label: m, remove: () => toggleMaterial(m) }));

  return (
    <>
      {fixed && subcategories.length > 0 && (
        <div className="sub-chips" role="group" aria-label="Subcategories">
          {['All', ...subcategories].map((s) => (
            <button
              key={s}
              type="button"
              className="pill"
              aria-pressed={sub === s}
              onClick={() => setSub(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="wrap shop-layout">
        <aside className={filtersOpen ? 'side open' : 'side'} id="shop-filters" aria-label="Filters">
          <div className="side-top">
            <h2>Filters</h2>
            <button type="button" className="link-btn" onClick={clearAll}>
              Clear all
            </button>
          </div>

          {!fixed && (
            <div className="side-sec">
              <span className="label" id="cat-label">Category</span>
              <div role="group" aria-labelledby="cat-label">
                {['All', ...SHOP_CATEGORIES].map((c) => {
                  const count = products.filter((p) => (c === 'All' || p.category === c) && matches(p, true)).length;
                  return (
                    <button
                      key={c}
                      type="button"
                      className="cat-btn"
                      aria-pressed={category === c}
                      onClick={() => setCategory(c)}
                    >
                      <span>{c}</span>
                      <span className="n">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="side-sec">
            <span className="label" id="mode-label">Colour option</span>
            <div className="seg" role="group" aria-labelledby="mode-label">
              {MODE_FILTERS.map((m) => (
                <button key={m.value} type="button" className="pill" aria-pressed={mode === m.value} onClick={() => setMode(m.value)}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="side-sec">
            <span className="label" id="avail-label">Availability</span>
            <div className="seg" role="group" aria-labelledby="avail-label">
              {AVAILABILITY.map((a) => (
                <button key={a.value} type="button" className="pill" aria-pressed={availability === a.value} onClick={() => setAvailability(a.value)}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="side-sec">
            <span className="label" id="mat-label">Material</span>
            <div role="group" aria-labelledby="mat-label">
              {SHOP_MATERIALS.map((m) => (
                <label key={m} className="mat-row">
                  <input type="checkbox" checked={materials.includes(m)} onChange={() => toggleMaterial(m)} />
                  <span>{m}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="side-sec">
            <label className="label" htmlFor="sort">Sort by</label>
            <select id="sort" className="select" style={{ width: '100%' }} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="featured">Featured</option>
              <option value="name">Name A to Z</option>
              <option value="stock">In stock first</option>
            </select>
          </div>
        </aside>

        <section aria-label="Products">
          <div className="toolbar">
            <div className="result" role="status" aria-live="polite">
              {list.length} {list.length === 1 ? 'product' : 'products'}
            </div>
            <button
              type="button"
              className="btn btn-sm filters-toggle"
              aria-expanded={filtersOpen}
              aria-controls="shop-filters"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              Filters
            </button>
            <div className="active-chips">
              {activeChips.map((chip) => (
                <span key={chip.label} className="achip">
                  {chip.label}
                  <button type="button" aria-label={`Remove filter ${chip.label}`} onClick={chip.remove}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid-shop">
            {list.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                justAdded={justAdded === p.id}
                onQuickView={setQuick}
                onAdd={addToCart}
                onSave={(product, saved) => notify(saved ? `${product.name} saved` : `${product.name} removed from saved`)}
              />
            ))}
          </div>

          {list.length === 0 && (
            <div className="empty show" role="status">
              <p>
                <b>No products match these filters.</b>
              </p>
              <button type="button" className="btn" onClick={clearAll}>
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>

      <QuickView product={quick} onClose={() => setQuick(null)} onAdd={addToCart} />

      <div className="toast" role="status" aria-live="polite" style={{ opacity: toast ? 1 : 0 }}>
        {toast}
      </div>

    </>
  );
}
