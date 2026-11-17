import Link from 'next/link';
import { NewsletterForm } from './NewsletterForm';
import type { ShopCategory } from '@/lib/shop-data';

export function SiteFooter({ tree }: { tree: ShopCategory[] }) {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="fcols">
          <div>
            <div className="wm">Akrinity</div>
            <p style={{ color: 'var(--muted-dark)', fontSize: 14, marginTop: 10 }}>
              Get new drops and offers by email.
            </p>
            <NewsletterForm />
          </div>
          <div>
            <h3>Shop</h3>
            <Link href="/shop">All products</Link>
            {tree.slice(0, 6).map((c) => (
              <Link key={c.slug} href={`/shop/${c.slug}`}>
                {c.name}
              </Link>
            ))}
          </div>
          <div>
            <h3>Custom</h3>
            <Link href="/quote">Request a quote</Link>
            <Link href="/design-service">Design service</Link>
            <Link href="/materials">Materials</Link>
            <Link href="/business">Business and bulk</Link>
            <Link href="/how-we-print">How we print</Link>
            <Link href="/guides">Knowledge hub</Link>
          </div>
          <div>
            <h3>Help</h3>
            <Link href="/track-order">Track an order</Link>
            <Link href="/account">Account</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/shipping">Shipping</Link>
            <Link href="/refunds">Refunds and cancellation</Link>
            <Link href="/care">Care and safety</Link>
            <Link href="/returns">Returns and warranty</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/about">About</Link>
          </div>
        </div>
        <div className="fbar">
          <span>© Akrinity · GSTIN [YOUR GSTIN] · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></span>
          <span>UPI · Cards · Netbanking · Cash on Delivery</span>
        </div>
      </div>
    </footer>
  );
}
