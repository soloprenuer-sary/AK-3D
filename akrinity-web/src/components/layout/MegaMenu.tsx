'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { MenuCategory } from '@/lib/category-content';
import { themeFor } from '@/lib/category-themes';

/** Categories that get their own menu with picture tiles. All nine are in the Shop menu. */
const TOP = ['home-decor', 'desk-gadgets', 'kitchen', 'gifts-personalised'];
const SHORT: Record<string, string> = { 'gifts-personalised': 'Gifts' };

/**
 * Tells an already-open category page which sub-category was chosen. Next.js does not fire
 * "hashchange" for same-page links, and a page opened from another page reads the address itself.
 */
function announceSub(slug?: string, key?: string) {
  if (slug && key) window.dispatchEvent(new CustomEvent('akr:sub', { detail: { slug, key } }));
}

function Tile({
  href,
  name,
  image,
  tone,
  onGo,
}: {
  href: string;
  name: string;
  image?: string;
  tone: string;
  onGo: () => void;
}) {
  return (
    <Link className="mm-tile" href={href} onClick={onGo}>
      <span className="mm-tile-img" style={{ background: tone }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" loading="lazy" />
        ) : (
          <b aria-hidden="true">{name.charAt(0)}</b>
        )}
      </span>
      <span className="mm-tile-name">{name}</span>
      <span className="mm-tile-btn">Shop now ›</span>
    </Link>
  );
}

/** Desktop navigation with the mega menus. Hover opens a panel; the small arrow does the same for keyboard and touch. */
export function MegaNav({ menu }: { menu: MenuCategory[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const show = (id: string, delay = 90) => {
    cancel();
    timer.current = setTimeout(() => setOpen(id), delay);
  };
  const hide = () => {
    cancel();
    timer.current = setTimeout(() => setOpen(null), 160);
  };
  const go = useCallback((slug?: string, key?: string) => {
    cancel();
    setOpen(null);
    announceSub(slug, key);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    const onDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('[data-mega]')) setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  useEffect(() => cancel, []);

  const items = [
    { id: 'shop', label: 'Shop', href: '/shop' },
    ...TOP.map((slug) => {
      const c = menu.find((m) => m.slug === slug);
      return { id: slug, label: SHORT[slug] ?? c?.name ?? slug, href: `/shop/${slug}` };
    }),
  ];
  const active = open && open !== 'shop' ? menu.find((m) => m.slug === open) : undefined;
  const activeTheme = active ? themeFor(active.slug) : undefined;

  return (
    <>
      <nav className="main" aria-label="Main" data-mega onMouseLeave={hide} onMouseEnter={cancel}>
        {items.map((it) => (
          <span
            key={it.id}
            className={open === it.id ? 'mm-item open' : 'mm-item'}
            onMouseEnter={() => show(it.id)}
          >
            <Link href={it.href} onClick={() => go()}>
              {it.label}
            </Link>
            <button
              type="button"
              className="mm-chev"
              aria-expanded={open === it.id}
              aria-controls={`mega-${it.id}`}
              aria-label={`${open === it.id ? 'Close' : 'Open'} the ${it.label} menu`}
              onClick={() => (open === it.id ? setOpen(null) : show(it.id, 0))}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}
        <Link href="/guides" onClick={() => go()}>
          Knowledge hub
        </Link>
      </nav>

      {open === 'shop' && (
        <div id="mega-shop" className="mega" data-mega onMouseEnter={cancel} onMouseLeave={hide}>
          <div className="wrap mega-in">
            <div className="mega-cols">
              {menu.map((c) => (
                <div className="mm-col" key={c.slug}>
                  <Link className="mm-h" href={`/shop/${c.slug}`} onClick={() => go()}>
                    <i aria-hidden="true" />
                    {c.name}
                  </Link>
                  <ul>
                    {c.subs.map((s) => (
                      <li key={s.key}>
                        <Link href={`/shop/${c.slug}#sub-${s.key}`} onClick={() => go(c.slug, s.key)}>
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <aside className="mm-card">
              <h3 className="d">Need a custom print?</h3>
              <p>Send a sketch or an idea. We model it, check it prints well, and quote it.</p>
              <Link className="btn btn-sm" href="/design-service" onClick={() => go()}>
                See the design service
              </Link>
            </aside>
          </div>
          <div className="mega-foot">
            <div className="wrap">
              <Link href="/shop" onClick={() => go()}>
                View all products →
              </Link>
              <span>
                <Link href="/quote" onClick={() => go()}>
                  Custom printing
                </Link>
                <Link href="/business" onClick={() => go()}>
                  Business and bulk
                </Link>
              </span>
            </div>
          </div>
        </div>
      )}

      {active && activeTheme && (
        <div
          id={`mega-${active.slug}`}
          className="mega"
          data-mega
          onMouseEnter={cancel}
          onMouseLeave={hide}
        >
          <div className="wrap mega-in">
            <div className="mm-tiles">
              {active.subs.map((s) => (
                <Tile
                  key={s.key}
                  href={`/shop/${active.slug}#sub-${s.key}`}
                  name={s.name}
                  image={s.image}
                  tone={activeTheme.bg}
                  onGo={() => go(active.slug, s.key)}
                />
              ))}
            </div>
            <aside
              className="mm-card mm-card--theme"
              style={{ background: activeTheme.bg, color: activeTheme.fg }}
            >
              <h3 className="d">{active.name}</h3>
              <p>{activeTheme.tagline}</p>
              <Link
                className="btn btn-sm"
                style={{
                  background: activeTheme.accent,
                  color: activeTheme.accentInk ?? '#0B0B0C',
                  borderColor: '#0B0B0C',
                }}
                href={`/shop/${active.slug}`}
                onClick={() => go()}
              >
                View all {active.name.toLowerCase()}
              </Link>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}

/** Phone menu: Shop opens the categories, and each category opens its sub-categories. */
export function MobileMenu({ menu, onClose }: { menu: MenuCategory[]; onClose: () => void }) {
  const go = (slug?: string, key?: string) => {
    onClose();
    announceSub(slug, key);
  };
  return (
    <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile">
      <details className="mm-acc">
        <summary>Shop</summary>
        <Link className="mm-all" href="/shop" onClick={() => go()}>
          All products
        </Link>
        {menu.map((c) => (
          <details className="mm-acc mm-acc--sub" key={c.slug}>
            <summary>{c.name}</summary>
            <Link className="mm-all" href={`/shop/${c.slug}`} onClick={() => go()}>
              All {c.name.toLowerCase()}
            </Link>
            {c.subs.map((s) => (
              <Link key={s.key} href={`/shop/${c.slug}#sub-${s.key}`} onClick={() => go(c.slug, s.key)}>
                {s.name}
              </Link>
            ))}
          </details>
        ))}
      </details>
      <Link href="/guides" onClick={() => go()}>
        Knowledge hub
      </Link>
      <Link href="/quote" onClick={() => go()}>
        Custom printing
      </Link>
      <Link href="/about" onClick={() => go()}>
        About
      </Link>
      <Link href="/contact" onClick={() => go()}>
        Contact
      </Link>
      <Link href="/search" onClick={() => go()}>
        Search
      </Link>
      <Link href="/cart" onClick={() => go()}>
        Cart
      </Link>
      <Link href="/account" onClick={() => go()}>
        Account
      </Link>
    </nav>
  );
}
