import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Account', robots: { index: false } };

const AREAS = [
  { title: 'Orders', text: 'Every order with its status and a tracking link.' },
  { title: 'Quotes', text: 'Custom quotes waiting for your approval, and the advance to pay.' },
  { title: 'Addresses', text: 'Saved delivery addresses for faster checkout.' },
  { title: 'GST details', text: 'Your company name and GSTIN for invoices.' },
  { title: 'Your files', text: 'Files you uploaded, for download by you only.' },
  { title: 'Business account', text: 'Apply for bulk pricing and repeat-order tools.' },
];

export default function AccountPage() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Account</span>
      </nav>

      <div className="wrap page-title">
        <h1 className="d">
          Your <span className="hl">account</span>
        </h1>
        <p>You are not signed in. Accounts arrive in the next phase; until then, guest checkout and order tracking by number work without one.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <Link className="btn btn-primary" href="/login">
            Sign in or create account
          </Link>
          <Link className="btn" href="/track-order">
            Track an order
          </Link>
        </div>
      </div>

      <section className="wrap" style={{ paddingBottom: 'var(--sec)' }} aria-label="What the account will hold">
        <h2 className="label" style={{ marginBottom: 14 }}>
          What your account will hold
        </h2>
        <div className="cat-grid">
          {AREAS.map((a) => (
            <div key={a.title} className="info-card">
              <h2>{a.title}</h2>
              <p className="muted">{a.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
