'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CartThumb } from '@/components/cart/CartThumb';
import { formatRupees, useCart } from '@/lib/cart-store';
import type { MenuCategory } from '@/lib/category-content';
import { MegaNav, MobileMenu } from './MegaMenu';
import { SearchOverlay } from './SearchOverlay';
import { useWishlist } from '@/lib/lists-store';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/guides', label: 'Knowledge hub' },
  { href: '/quote', label: 'Custom printing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader({ menu }: { menu: MenuCategory[] }) {
  const { lines, count, subtotal, remove, setQty, clear, modeLabel } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const wish = useWishlist();
  const cartDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = cartDialog.current;
    if (!d) return;
    if (cartOpen && !d.open) d.showModal();
    if (!cartOpen && d.open) d.close();
  }, [cartOpen]);

  return (
    <header className="site">
      <div className="wrap bar">
        <Link className="logo" href="/" aria-label="Akrinity home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/akrinity-logo.svg" alt="" width={551} height={450} />
        </Link>

        <nav className="main" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hdr-actions">
          <button
            className="circle"
            type="button"
            aria-label="Search the site"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen(true)}
          >
            <svg
              width="20"
              height="20"
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
          </button>
          <Link
            className="circle wish-link"
            href="/wishlist"
            aria-label={`Wishlist, ${wish.count} ${wish.count === 1 ? 'item' : 'items'}`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B0B0C"
              strokeWidth="2"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
            {wish.count > 0 && <span className="wish-n">{wish.count}</span>}
          </Link>
          <Link className="circle acct" href="/account" aria-label="Account">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B0B0C"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
            </svg>
          </Link>
          <button
            className="circle"
            type="button"
            aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
            onClick={() => setCartOpen(true)}
          >
            {count}
          </button>
          <Link className="btn btn-dark btn-sm" href="/quote">
            Get a quote
          </Link>
          <button
            className="circle menu-btn"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? '×' : '☰'}
          </button>
        </div>
      </div>

      <MegaNav menu={menu} />

      {menuOpen && <MobileMenu menu={menu} onClose={() => setMenuOpen(false)} />}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <dialog
        ref={cartDialog}
        className="cart-dialog"
        aria-labelledby="cart-title"
        onClose={() => setCartOpen(false)}
        onClick={(e) => {
          if (e.target === cartDialog.current) cartDialog.current?.close();
        }}
      >
        <div className="cart-body">
          <div className="cdlg-head">
            <div>
              <h2 id="cart-title" className="d cdlg-title">
                Your <span className="hl">cart</span>
              </h2>
              {count > 0 && (
                <p className="cdlg-count">
                  {count} {count === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
            <button
              className="cdlg-close"
              type="button"
              aria-label="Close cart"
              onClick={() => cartDialog.current?.close()}
            >
              ×
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="cdlg-empty">
              <p>Your cart is empty.</p>
              <Link className="btn" href="/shop" onClick={() => cartDialog.current?.close()}>
                Browse the shop
              </Link>
            </div>
          ) : (
            <>
              <ul className="cdlg-items">
                {lines.map((l) => (
                  <li key={l.key} className="cdlg-item">
                    <CartThumb line={l} />
                    <div className="cdlg-info">
                      <div className="cdlg-name">
                        <b>{l.name}</b>
                        <button
                          type="button"
                          className="cdlg-remove"
                          onClick={() => remove(l.key)}
                          aria-label={`Remove ${l.name}`}
                        >
                          ×
                        </button>
                      </div>
                      <div className="cdlg-chips">
                        <span>{modeLabel(l.mode)}</span>
                        {l.detail && <span>{l.detail}</span>}
                      </div>
                      <div className="cdlg-row">
                        <div className="cdlg-qty" role="group" aria-label={`Quantity of ${l.name}`}>
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => setQty(l.key, Math.max(1, l.qty - 1))}
                          >
                            −
                          </button>
                          <span aria-live="polite">{l.qty}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => setQty(l.key, Math.min(100, l.qty + 1))}
                          >
                            +
                          </button>
                        </div>
                        {l.price && <span className="cdlg-price">{l.price}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="cdlg-foot">
                <div className="cdlg-sum">
                  <div>
                    <span>Subtotal</span>
                    <b>{subtotal === null ? '₹[price]' : formatRupees(subtotal)}</b>
                  </div>
                  <p>Shipping and tax are shown at checkout.</p>
                </div>

                <Link
                  className="btn btn-primary btn-wide cdlg-checkout"
                  href="/checkout"
                  onClick={() => cartDialog.current?.close()}
                >
                  Checkout
                </Link>
                <div className="cdlg-secondary">
                  <Link className="btn" href="/cart" onClick={() => cartDialog.current?.close()}>
                    View cart
                  </Link>
                  <button className="cdlg-clear" type="button" onClick={clear}>
                    Clear cart
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </dialog>
    </header>
  );
}
