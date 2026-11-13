'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CartThumb } from '@/components/cart/CartThumb';
import { formatRupees, useCart } from '@/lib/cart-store';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/guides', label: 'Knowledge hub' },
  { href: '/quote', label: 'Custom printing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  const { lines, count, subtotal, remove, clear, modeLabel } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
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
          Akrinity<i aria-hidden="true" />
        </Link>

        <nav className="main" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hdr-actions">
          <Link className="circle" href="/search" aria-label="Search the site">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B0B0C" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
          </Link>
          <Link className="circle acct" href="/account" aria-label="Account">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B0B0C" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
            </svg>
          </Link>
          <button className="circle" type="button" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`} onClick={() => setCartOpen(true)}>
            {count}
          </button>
          <Link className="btn btn-dark btn-sm" href="/quote">
            Get a quote
          </Link>
          <button className="circle menu-btn" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? '×' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/search" onClick={() => setMenuOpen(false)}>
            Search
          </Link>
          <Link href="/cart" onClick={() => setMenuOpen(false)}>
            Cart
          </Link>
          <Link href="/account" onClick={() => setMenuOpen(false)}>
            Account
          </Link>
        </nav>
      )}

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
          <div className="side-top">
            <h2 id="cart-title" className="d" style={{ fontSize: 40 }}>
              Your <span className="hl">cart</span>
            </h2>
            <button className="qv-close" type="button" aria-label="Close cart" onClick={() => cartDialog.current?.close()}>
              ×
            </button>
          </div>
          {lines.length === 0 ? (
            <p className="muted" style={{ marginTop: 16 }}>
              Your cart is empty. Add a product from the shop to see it here.
            </p>
          ) : (
            <ul className="cart-lines">
              {lines.map((l) => (
                <li key={l.key} className="cart-line">
                  <CartThumb line={l} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b>{l.name}</b>
                    <div className="meta">
                      {modeLabel(l.mode)} · qty {l.qty}
                      {l.price ? ` · ${l.price}` : ''}
                    </div>
                  </div>
                  <button type="button" className="link-btn" onClick={() => remove(l.key)} aria-label={`Remove ${l.name}`}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {lines.length > 0 && (
            <p className="meta" style={{ marginTop: 16 }}>
              Subtotal: <b>{subtotal === null ? '₹[price]' : formatRupees(subtotal)}</b> · shipping is shown at checkout.
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn" type="button" disabled={lines.length === 0} onClick={clear}>
              Clear cart
            </button>
            <Link className="btn" href="/cart" onClick={() => cartDialog.current?.close()}>
              View cart
            </Link>
            {lines.length > 0 && (
              <Link className="btn btn-primary" href="/checkout" onClick={() => cartDialog.current?.close()}>
                Checkout
              </Link>
            )}
          </div>
        </div>
      </dialog>
    </header>
  );
}
