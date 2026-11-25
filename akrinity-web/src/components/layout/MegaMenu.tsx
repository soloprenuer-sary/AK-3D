'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pic } from '@/components/ui/Pic';
import Link from 'next/link';
import type { MenuCategory, MenuItem } from '@/lib/category-content';

/** The top bar has room for five main categories. All of them are in the phone menu and on the Shop page. */
const TOP_BAR = 5;

function Tile({
  href,
  item,
  tone,
  onGo,
}: {
  href: string;
  item: MenuItem;
  tone: string;
  onGo: () => void;
}) {
  return (
    <Link className="mm-tile" href={href} onClick={onGo}>
      <span className="mm-tile-img" style={{ background: tone }}>
        {item.image ? (
          <Pic src={item.image} alt="" sizes="160px" widths={[256]} />
        ) : (
          <b aria-hidden="true">{item.name.charAt(0)}</b>
        )}
      </span>
      <span className="mm-tile-name">{item.name}</span>
      <span className="mm-tile-btn">Shop now ›</span>
    </Link>
  );
}

/**
 * Desktop navigation. Each main category opens a panel: four picture tiles for the popular
 * sub-categories, then the full list in groups. Hover opens a panel; the small arrow does the same
 * for keyboard and touch. Everything comes from the WordPress category tree.
 */
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
  const go = useCallback(() => {
    cancel();
    setOpen(null);
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

  const active = open ? menu.find((m) => m.slug === open) : undefined;

  return (
    <>
      <div className="catbar" data-mega onMouseLeave={hide} onMouseEnter={cancel}>
        <nav className="wrap cats" aria-label="Product categories">
          {menu.slice(0, TOP_BAR).map((c) => (
            <span
              key={c.slug}
              className={open === c.slug ? 'mm-item open' : 'mm-item'}
              onMouseEnter={() => show(c.slug)}
            >
              <Link href={`/shop/${c.slug}`} onClick={go}>
                {c.label}
              </Link>
              <button
                type="button"
                className="mm-chev"
                aria-expanded={open === c.slug}
                aria-controls={`mega-${c.slug}`}
                aria-label={`${open === c.slug ? 'Close' : 'Open'} the ${c.name} menu`}
                onClick={() => (open === c.slug ? setOpen(null) : show(c.slug, 0))}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path
                    d="M1 3l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </span>
          ))}
        </nav>
      </div>

      {active && (
        <div
          id={`mega-${active.slug}`}
          className="mega"
          data-mega
          onMouseEnter={cancel}
          onMouseLeave={hide}
        >
          <div className="wrap mega-a">
            {active.popular.length > 0 && (
              <div className="mega-pop">
                <h3 className="mm-title">Popular</h3>
                <div className="mm-tiles2">
                  {active.popular.map((s) => (
                    <Tile
                      key={s.slug}
                      href={`/shop/${active.slug}/${s.slug}`}
                      item={s}
                      tone={active.tone}
                      onGo={go}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="mega-list">
              <h3 className="mm-title">Everything in {active.name}</h3>
              <div className="mm-groups">
                {active.groups.map((g) => (
                  <div className="mm-grp" key={g.title || 'all'}>
                    {g.title && (
                      <span className="mm-h">
                        <i aria-hidden="true" />
                        {g.title}
                      </span>
                    )}
                    <ul>
                      {g.items.map((it) => (
                        <li key={it.slug}>
                          <Link href={`/shop/${active.slug}/${it.slug}`} onClick={go}>
                            {it.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mega-foot">
            <div className="wrap">
              <Link href={`/shop/${active.slug}`} onClick={go}>
                View all {active.name} →
              </Link>
              <span>
                <Link href="/shop" onClick={go}>
                  Shop all products
                </Link>
                <Link href="/design-service" onClick={go}>
                  Need something custom? Design service
                </Link>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Phone menu links, the most used first. */
const QUICK_LINKS = [
  { href: '/shop', label: 'Shop all' },
  { href: '/quote', label: 'Custom printing' },
  { href: '/cart', label: 'Cart' },
  { href: '/account', label: 'Account' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/compare', label: 'Compare' },
  { href: '/guides', label: 'Knowledge hub' },
  { href: '/search', label: 'Search' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/** Category block colours in order, from the brand palette. */
const BLOCK_TONES = ['accent', 'violet', 'orange', 'ink', 'white', 'accent'];

/**
 * Phone menu: the links on top, the categories as colour blocks under them, and "Get a quote" fixed at
 * the bottom. It fills the screen below the header and the page behind it does not scroll.
 */
export function MobileMenu({ menu, onClose }: { menu: MenuCategory[]; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const go = () => onClose();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const wide = window.matchMedia('(min-width: 1001px)');
    const fit = () => {
      el.style.height = `calc(100dvh - ${Math.max(0, el.getBoundingClientRect().top)}px)`;
    };
    const onWide = (e: MediaQueryListEvent) => {
      if (e.matches) onClose();
    };
    const before = document.body.style.overflow;
    if (!wide.matches) document.body.style.overflow = 'hidden';
    fit();
    window.addEventListener('resize', fit);
    wide.addEventListener('change', onWide);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener('resize', fit);
      wide.removeEventListener('change', onWide);
    };
  }, [onClose]);

  return (
    <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile" ref={ref}>
      <div className="mm2-scroll">
        <p className="mm2-label">Quick links</p>
        <ul className="mm2-links">
          {QUICK_LINKS.map((l, i) => (
            <li key={l.href}>
              <Link className={i === 0 ? 'mm2-pill main' : 'mm2-pill'} href={l.href} onClick={go}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mm2-label">Shop by category</p>
        <ul className="mm2-blocks">
          {menu.map((c, i) => (
            <li key={c.slug}>
              <Link
                className={`mm2-block tone-${BLOCK_TONES[i % BLOCK_TONES.length]}`}
                href={`/shop/${c.slug}`}
                onClick={go}
              >
                <span>{c.name}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="mm2-dock">
        <Link className="btn btn-primary btn-wide" href="/quote" onClick={go}>
          Get a quote
        </Link>
      </div>
    </nav>
  );
}
