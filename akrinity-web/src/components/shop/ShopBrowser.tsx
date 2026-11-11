'use client';

import { useEffect, useRef, useState } from 'react';
import {
  SHOP_CATEGORIES,
  SHOP_MATERIALS,
  SHOP_PRODUCTS,
  type Material,
  type ShopProduct,
} from '@/lib/shop-data';
import { ProductCard } from './ProductCard';
import { QuickView } from './QuickView';

type Availability = 'all' | 'stock' | 'mto';
type Sort = 'featured' | 'name' | 'stock';

const AVAILABILITY: { value: Availability; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'stock', label: 'In stock' },
  { value: 'mto', label: 'Made to order' },
];

export function ShopBrowser() {
  const [category, setCategory] = useState<string>('All');
  const [availability, setAvailability] = useState<Availability>('all');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sort, setSort] = useState<Sort>('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quick, setQuick] = useState<ShopProduct | null>(null);
  const [cart, setCart] = useState(0);
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
    setCart((c) => c + 1);
    setJustAdded(p.id);
    if (addTimer.current) clearTimeout(addTimer.current);
    addTimer.current = setTimeout(() => setJustAdded(null), 1400);
    notify(`${p.name} added to cart`);
  };

  const clearAll = () => {
    setCategory('All');
    setAvailability('all');
    setMaterials([]);
    setSort('featured');
  };

  const toggleMaterial = (m: Material) =>
    setMaterials((list) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]));

  const matches = (p: ShopProduct, ignoreCategory = false) => {
    if (!ignoreCategory && category !== 'All' && p.category !== category) return false;
    if (availability === 'stock' && !p.inStock) return false;
    if (availability === 'mto' && p.inStock) return false;
    if (materials.length && !materials.includes(p.material)) return false;
    return true;
  };

  let list = SHOP_PRODUCTS.filter((p) => matches(p));
  if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'stock') list = [...list].sort((a, b) => Number(b.inStock) - Number(a.inStock));

  const activeChips: { label: string; remove: () => void }[] = [];
  if (category !== 'All') activeChips.push({ label: category, remove: () => setCategory('All') });
  if (availability !== 'all')
    activeChips.push({
      label: availability === 'stock' ? 'In stock' : 'Made to order',
      remove: () => setAvailability('all'),
    });
  materials.forEach((m) => activeChips.push({ label: m, remove: () => toggleMaterial(m) }));

  return (
    <>
      <div className="wrap shop-layout">
        <aside className={filtersOpen ? 'side open' : 'side'} id="shop-filters" aria-label="Filters">
          <div className="side-top">
            <h2>Filters</h2>
            <button type="button" className="link-btn" onClick={clearAll}>
              Clear all
            </button>
          </div>

          <div className="side-sec">
            <span className="label" id="cat-label">Category</span>
            <div role="group" aria-labelledby="cat-label">
              {['All', ...SHOP_CATEGORIES].map((c) => {
                const count = SHOP_PRODUCTS.filter((p) => (c === 'All' || p.category === c) && matches(p, true)).length;
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

          <div className="side-sec">
            <span className="label" id="avail-label">Availability</span>
            <div className="seg" role="group" aria-labelledby="avail-label">
              {AVAILABILITY.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  className="pill"
                  aria-pressed={availability === a.value}
                  onClick={() => setAvailability(a.value)}
                >
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

      <span hidden aria-live="polite">Cart: {cart}</span>
    </>
  );
}
