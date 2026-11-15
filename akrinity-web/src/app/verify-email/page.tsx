import type { Metadata } from 'next';
import Link from 'next/link';
import { VerifyEmailPanel } from '@/components/forms/PasswordForms';

export const metadata: Metadata = { title: 'Verify email', robots: { index: false } };

export default function Page() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Verify email</span>
      </nav>

      <div className="wrap page-title">
        <h1 className="d">
          Verify your <span className="hl">email</span>
        </h1>
        <p>One moment while we confirm your address.</p>
      </div>

      <section className="wrap" style={{ paddingBottom: 'var(--sec)', maxWidth: 560 }}>
        <VerifyEmailPanel />
      </section>
    </main>
  );
}
