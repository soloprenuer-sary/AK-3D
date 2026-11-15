import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/forms/PasswordForms';

export const metadata: Metadata = { title: 'Forgot password', robots: { index: false } };

export default function Page() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Forgot password</span>
      </nav>

      <div className="wrap page-title">
        <h1 className="d">
          Forgot your <span className="hl">password?</span>
        </h1>
        <p>Enter your email and we will send you a link to choose a new one.</p>
      </div>

      <section className="wrap" style={{ paddingBottom: 'var(--sec)', maxWidth: 560 }}>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
