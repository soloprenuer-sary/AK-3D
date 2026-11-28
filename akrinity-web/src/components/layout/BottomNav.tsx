'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-store';

const ICON = {
  shop: <path d="M4 7h16l-1.5 12h-13L4 7Zm4 0V5a4 4 0 0 1 8 0v2" />,
  cart: <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />,
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </>
  ),
  custom: <path d="M4 20h4L19 9l-4-4L4 16v4Zm10-14 4 4" />,
};

const ITEMS = [
  { href: '/shop', label: 'Shop', icon: 'shop' as const },
  { href: '/cart', label: 'Cart', icon: 'cart' as const },
  { href: '/account', label: 'Account', icon: 'account' as const },
  { href: '/quote', label: 'Custom', icon: 'custom' as const },
];

/** A fixed bar at the bottom of phone screens: Shop, Cart, Account and Custom printing. */
export function BottomNav() {
  const path = usePathname();
  const { count } = useCart();
  if (path === '/checkout' || path === '/order-confirmation') return null;
  return (
    <nav className="bnav" aria-label="Quick links">
      {ITEMS.map((it) => {
        const active = path === it.href || (it.href !== '/' && path.startsWith(it.href + '/'));
        return (
          <Link
            key={it.href}
            href={it.href}
            className="bnav-item"
            aria-current={active ? 'page' : undefined}
          >
            <span className="bnav-ico">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {ICON[it.icon]}
              </svg>
              {it.icon === 'cart' && count > 0 && <span className="bnav-badge">{count}</span>}
            </span>
            <span className="bnav-label">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
