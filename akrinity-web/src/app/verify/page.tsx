import type { Metadata } from 'next';
import Link from 'next/link';
import { VerifyEmail } from '@/components/account/VerifyEmail';

export const metadata: Metadata = { title: 'Confirm your email', robots: { index: false } };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; token?: string }>;
}) {
  const { id = '', token = '' } = await searchParams;
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Confirm your email</span>
      </nav>
      <div className="wrap page-title">
        <h1 className="d">
          Confirm your <span className="hl">email</span>
        </h1>
      </div>
      <section className="wrap" style={{ paddingBottom: 'var(--sec)', maxWidth: 560 }}>
        <VerifyEmail id={id} token={token} />
      </section>
    </main>
  );
}
