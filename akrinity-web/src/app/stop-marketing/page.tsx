import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Stop marketing emails',
  robots: { index: false, follow: false },
};

/** Always read fresh: the result depends on the link in the email. */
export const dynamic = 'force-dynamic';

/**
 * Where "Stop marketing emails" in a customer email leads. It checks the signed link on WordPress
 * (WP_URL is set in Vercel) and records the choice there. Order and account emails still come.
 */
export default async function StopMarketing({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email = '', token = '' } = await searchParams;
  const base = (process.env.WP_URL ?? '').replace(/\/$/, '');
  let ok = false;
  if (base && email && token) {
    try {
      const url = `${base}/wp-json/akrinity/v1/optout?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
      const res = await fetch(url, { cache: 'no-store' });
      ok = res.ok;
    } catch {
      ok = false;
    }
  }
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Stop marketing emails</span>
      </nav>
      <section className="wrap" style={{ padding: '40px 0 var(--sec)', maxWidth: 680 }}>
        <h1 className="d" style={{ fontSize: 'clamp(40px,6vw,64px)', lineHeight: 1 }}>
          {ok ? (
            <>
              You are <span className="hl">unsubscribed</span>
            </>
          ) : (
            <>
              Link <span className="hl">not valid</span>
            </>
          )}
        </h1>
        <p className="muted" style={{ marginTop: 16, fontSize: 17 }}>
          {ok
            ? 'You will not receive marketing emails from Akrinity. Emails about your orders, payments and account still come to you.'
            : 'This link has expired or was copied incorrectly. Message us and we will update your preferences.'}
        </p>
        <p style={{ marginTop: 20 }}>
          <Link className="btn btn-sm" href="/contact">
            Contact us
          </Link>
        </p>
      </section>
    </main>
  );
}
