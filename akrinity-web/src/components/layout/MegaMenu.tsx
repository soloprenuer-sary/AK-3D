'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { MenuCategory, MenuItem } from '@/lib/category-content';

/** The top bar has room for five main categories. All of them are in the phone menu and on the Shop page. */
const TOP_BAR = 5;

function Tile({ href, item, tone, onGo }: { href: string; item: MenuItem; tone: string; onGo: () => void }) {
  return (
    <Link className="mm-tile" href={href} onClick={onGo}>
      <span className="mm-tile-img" style={{ background: tone }}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" loading="lazy" />
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
      <nav className="main" aria-label="Main" data-mega onMouseLeave={hide} onMouseEnter={cancel}>
        {menu.slice(0, TOP_BAR).map((c) => (
          <span key={c.slug} className={open === c.slug ? 'mm-item open' : 'mm-item'} onMouseEnter={() => show(c.slug)}>
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
                <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}
      </nav>

      {active && (
        <div id={`mega-${active.slug}`} className="mega" data-mega onMouseEnter={cancel} onMouseLeave={hide}>
          <div className="wrap mega-a">
            {active.popular.length > 0 && (
              <div className="mega-pop">
                <h3 className="mm-title">Popular</h3>
                <div className="mm-tiles2">
                  {active.popular.map((s) => (
                    <Tile key={s.slug} href={`/shop/${active.slug}/${s.slug}`} item={s} tone={active.tone} onGo={go} />
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

/** Phone menu: each category opens its popular pictures and its groups. */
export function MobileMenu({ menu, onClose }: { menu: MenuCategory[]; onClose: () => void }) {
  const go = () => onClose();
  return (
    <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile">
      {menu.map((c) => (
        <details className="mm-acc" key={c.slug}>
          <summary>{c.name}</summary>
          <Link className="mm-all" href={`/shop/${c.slug}`} onClick={go}>
            View all {c.name}
          </Link>
          {c.popular.length > 0 && (
            <div className="mm-pop-m">
              {c.popular.map((s) => (
                <Link key={s.slug} className="mm-pop-i" href={`/shop/${c.slug}/${s.slug}`} onClick={go}>
                  <span className="mm-pop-img" style={{ background: c.tone }}>
                    {s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image} alt="" loading="lazy" />
                    ) : (
                      <b aria-hidden="true">{s.name.charAt(0)}</b>
                    )}
                  </span>
                  <span>{s.name}</span>
                </Link>
              ))}
            </div>
          )}
          {c.groups.map((g) =>
            g.title ? (
              <details className="mm-acc mm-acc--sub" key={g.title}>
                <summary>{g.title}</summary>
                {g.items.map((it) => (
                  <Link key={it.slug} href={`/shop/${c.slug}/${it.slug}`} onClick={go}>
                    {it.name}
                  </Link>
                ))}
              </details>
            ) : (
              g.items.map((it) => (
                <Link key={it.slug} href={`/shop/${c.slug}/${it.slug}`} onClick={go}>
                  {it.name}
                </Link>
              ))
            ),
          )}
        </details>
      ))}
      <Link href="/shop" onClick={go}>
        Shop all
      </Link>
      <Link href="/guides" onClick={go}>
        Knowledge hub
      </Link>
      <Link href="/quote" onClick={go}>
        Custom printing
      </Link>
      <Link href="/about" onClick={go}>
        About
      </Link>
      <Link href="/contact" onClick={go}>
        Contact
      </Link>
      <Link href="/search" onClick={go}>
        Search
      </Link>
      <Link href="/cart" onClick={go}>
        Cart
      </Link>
      <Link href="/account" onClick={go}>
        Account
      </Link>
    </nav>
  );
}
