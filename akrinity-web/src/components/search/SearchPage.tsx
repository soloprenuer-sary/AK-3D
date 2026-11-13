'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { GuideCard } from '@/components/guides/GuideCard';
import { GUIDES } from '@/lib/guides-data';
import { CATEGORIES, SHOP_PRODUCTS, categorySlug, productSlug } from '@/lib/shop-data';

function subscribeUrl(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}
function readQuery() {
  return new URLSearchParams(window.location.search).get('q') ?? '';
}
function noQuery() {
  return '';
}

/** Search across products, categories and articles. Runs in the browser on the sample data. */
export function SearchPage() {
  // The search term lives in the URL (?q=) so a search can be shared and the back button works.
  const q = useSyncExternalStore(subscribeUrl, readQuery, noQuery);
  const setQ = (value: string) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('q', value);
    else url.searchParams.delete('q');
    window.history.replaceState(null, '', url.toString());
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const term = q.trim().toLowerCase();

  const products = useMemo(() => {
    if (!term) return [];
    return SHOP_PRODUCTS.filter((p) =>
      [p.name, p.sub, p.category, p.material, p.process].join(' ').toLowerCase().includes(term),
    );
  }, [term]);

  const categories = useMemo(() => {
    if (!term) return [];
    return CATEGORIES.filter((c) => [c.name, c.description, ...c.subs].join(' ').toLowerCase().includes(term));
  }, [term]);

  const guides = useMemo(() => {
    if (!term) return [];
    return GUIDES.filter((g) => [g.title, g.summary, g.type].join(' ').toLowerCase().includes(term));
  }, [term]);

  const total = products.length + categories.length + guides.length;

  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Search</span>
      </nav>

      <div className="wrap page-title">
        <h1 className="d">
          Search <span className="hl">Akrinity</span>
        </h1>
        <form className="search-form" role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="site-search" className="sr">
            Search products, categories and articles
          </label>
          <input
            id="site-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try: vase, PETG, egg tray, lamp"
            autoComplete="off"
          />
        </form>
        <p className="result" role="status" aria-live="polite" style={{ marginTop: 14 }}>
          {term ? (total === 1 ? '1 result' : `${total} results for “${q.trim()}”`) : 'Type to search products, categories and articles.'}
        </p>
      </div>

      {term && total === 0 && (
        <section className="wrap" style={{ paddingBottom: 80 }}>
          <div className="empty show">
            <p>
              <b>Nothing matched “{q.trim()}”.</b>
            </p>
            <p className="muted">Try a material (PLA+, PETG, Resin) or a category name.</p>
            <Link className="btn" href="/shop">
              Browse the shop
            </Link>
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="wrap" aria-labelledby="sr-products" style={{ paddingBottom: 24 }}>
          <h2 id="sr-products" className="label" style={{ marginBottom: 14 }}>
            Products ({products.length})
          </h2>
          <div className="grid-shop" style={{ padding: 0 }}>
            {products.map((p) => (
              <Link key={p.id} className="card-p" href={`/product/${productSlug(p)}`}>
                <div className="img stripes">
                  <span className={p.inStock ? 'tag accent' : 'tag'}>{p.inStock ? 'In stock' : 'Made to order'}</span>
                </div>
                <div className="row">
                  <div>
                    <div className="name">{p.name}</div>
                    <div className="price">{p.material} · {p.sub}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="wrap" aria-labelledby="sr-cats" style={{ paddingBottom: 24 }}>
          <h2 id="sr-cats" className="label" style={{ marginBottom: 14 }}>
            Categories ({categories.length})
          </h2>
          <div className="cat-grid">
            {categories.map((c) => (
              <Link key={c.name} className="cat-card" href={`/shop/${categorySlug(c)}`}>
                <span className="cat-card-name">{c.name}</span>
                <span className="cat-card-sub">{c.description}</span>
                <span className="arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section className="wrap" aria-labelledby="sr-guides" style={{ paddingBottom: 80 }}>
          <h2 id="sr-guides" className="label" style={{ marginBottom: 14 }}>
            Articles ({guides.length})
          </h2>
          <div className="post-grid" style={{ padding: 0 }}>
            {guides.map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
