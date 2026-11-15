import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/forms/PasswordForms';

export const metadata: Metadata = { title: 'Reset password', robots: { index: false } };

export default function Page() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Reset password</span>
      </nav>

      <div className="wrap page-title">
        <h1 className="d">
          Choose a <span className="hl">new password</span>
        </h1>
        <p>Use at least 8 characters. The link in your email works once.</p>
      </div>

      <section className="wrap" style={{ paddingBottom: 'var(--sec)', maxWidth: 560 }}>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
