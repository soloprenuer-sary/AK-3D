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
            <Link href="/shop/home-decor">Home decor</Link>
            <Link href="/shop/kitchen">Kitchen</Link>
            <Link href="/shop/gifts-personalised">Gifts and personalised</Link>
            <Link href="/shop/spare-parts">Spare parts</Link>
          </div>
          <div>
            <h3>Custom</h3>
            <Link href="/quote">Request a quote</Link>
            <Link href="/quote">Design and print</Link>
            <Link href="/guides">Knowledge hub</Link>
            <Link href="/search">Search</Link>
          </div>
          <div>
            <h3>Help</h3>
            <Link href="/faq">FAQ</Link>
            <Link href="/shipping">Shipping</Link>
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
