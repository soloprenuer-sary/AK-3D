'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Pic } from '@/components/ui/Pic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveProducts } from '@/lib/live-catalogue';
import { useCategoryTree } from '@/components/layout/CategoryTree';
import { productSlug, type ShopProduct } from '@/lib/shop-data';

const NONE: ShopProduct[] = [];
const MAX_RESULTS = 8;

/** Every word typed must appear somewhere in the product's name, category, material or process. */
function matches(p: ShopProduct, words: string[]): boolean {
  const hay = [p.name, p.sub, p.category, p.material, p.process, p.description ?? '']
    .join(' ')
    .toLowerCase();
  return words.every((w) => hay.includes(w));
}

/** The search box and live results. Only mounted while the overlay is open, so the catalogue loads on first use. */
function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const tree = useCategoryTree();
  const products = useLiveProducts(NONE);
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const found = useMemo(
    () => (words.length ? products.filter((p) => matches(p, words)) : []),
    // words is rebuilt from q each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, q],
  );
  const categories = useMemo(
    () =>
      words.length
        ? tree
            .filter((c) =>
              words.every((w) => [c.name, ...c.subs].join(' ').toLowerCase().includes(w)),
            )
            .slice(0, 4)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tree, q],
  );
  const loading = products.length === 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="so">
      <form className="so-form" role="search" onSubmit={submit}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0B0B0C"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products, for example vase, lamp or phone stand"
          aria-label="Search products"
          autoComplete="off"
          enterKeyHint="search"
        />
        <button type="button" className="so-close" onClick={onClose} aria-label="Close search">
          ×
        </button>
      </form>

      <div className="so-body" aria-live="polite">
        {!words.length && (
          <div className="so-hint">
            <p>Start typing to see products. Or browse a category:</p>
            <div className="so-chips">
              {tree.map((c) => (
                <Link key={c.slug} className="cat-pill" href={`/shop/${c.slug}`} onClick={onClose}>
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {words.length > 0 && loading && <p className="so-hint">Loading products…</p>}

        {words.length > 0 && !loading && found.length === 0 && categories.length === 0 && (
          <div className="so-hint">
            <p>
              <b>Nothing matched “{q.trim()}”.</b>
            </p>
            <p>Try another word, a material (PLA+, PETG, Resin) or a category name.</p>
          </div>
        )}

        {categories.length > 0 && (
          <div className="so-chips so-cats">
            {categories.map((c) => (
              <Link key={c.slug} className="cat-pill" href={`/shop/${c.slug}`} onClick={onClose}>
                {c.name} →
              </Link>
            ))}
          </div>
        )}

        {found.length > 0 && (
          <ul className="so-list">
            {found.slice(0, MAX_RESULTS).map((p) => (
              <li key={p.id}>
                <Link href={`/product/${productSlug(p)}`} onClick={onClose}>
                  <span className="so-img">
                    {p.images?.[0] ? (
                      <Pic src={p.images[0]} alt="" sizes="96px" widths={[256]} />
                    ) : (
                      <b aria-hidden="true">{p.name.charAt(0)}</b>
                    )}
                  </span>
                  <span className="so-text">
                    <span className="so-name">{p.name}</span>
                    <span className="so-meta">
                      {p.sub} · {p.material}
                    </span>
                  </span>
                  <span className="so-price">{p.price ?? ''}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {found.length > MAX_RESULTS && (
          <p className="so-more">
            <Link href={`/search?q=${encodeURIComponent(q.trim())}`} onClick={onClose}>
              See all {found.length} results →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

/** Search as a window over the page. Opens from the search icon in the header. */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="search-dialog"
      aria-label="Search"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      {open && <SearchPanel onClose={onClose} />}
    </dialog>
  );
}
