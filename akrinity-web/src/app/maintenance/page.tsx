import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Back soon',
  description: 'The Akrinity store is being updated.',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main id="main">
      <section className="wrap page-title" style={{ paddingBlock: 'var(--sec)' }}>
        <span className="tag accent">Back soon</span>
        <h1 className="d" style={{ marginTop: 16 }}>
          We are <span className="hl">updating</span> the store.
        </h1>
        <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.6, color: 'var(--muted)', maxWidth: 520 }}>
          Orders and quotes are paused for a short while. Contact us on WhatsApp or email in the meantime, and we will sort it out.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
          <Link className="btn btn-primary" href="/contact">
            Contact us
          </Link>
        </div>
      </section>
    </main>
  );
}
