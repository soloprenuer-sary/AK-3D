import Link from 'next/link';
import { NewsletterForm } from './NewsletterForm';

export function SiteFooter() {
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
            <Link href="/shop">Home decor</Link>
            <Link href="/shop">Gifts and personalized</Link>
            <Link href="/shop">Spare parts</Link>
          </div>
          <div>
            <h3>Custom</h3>
            <Link href="/quote">Request a quote</Link>
            <Link href="/quote">Design and print</Link>
            <Link href="/#business">Business orders</Link>
            <Link href="/#work">Portfolio</Link>
          </div>
          <div>
            <h3>Support</h3>
            <Link href="/">Track your order</Link>
            <Link href="/">Shipping</Link>
            <Link href="/">Returns and warranty</Link>
            <Link href="/">Privacy and file terms</Link>
          </div>
        </div>
        <div className="fbar">
          <span>© Akrinity · GSTIN [YOUR GSTIN]</span>
          <span>UPI · Cards · Netbanking · Cash on Delivery</span>
        </div>
      </div>
    </footer>
  );
}
