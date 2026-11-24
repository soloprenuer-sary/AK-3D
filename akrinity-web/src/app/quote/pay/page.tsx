import type { Metadata } from 'next';
import Link from 'next/link';
import { QuotePay } from '@/components/quote/QuotePay';
import { readLink } from '@/components/quote/quote-shared';

export const metadata: Metadata = { title: 'Pay for your quote', robots: { index: false } };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; exp?: string; token?: string }>;
}) {
  const link = readLink(await searchParams);
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Pay for your quote</span>
      </nav>
      <div className="wrap page-title">
        <h1 className="d">
          Pay for your <span className="hl">quote.</span>
        </h1>
      </div>
      <section className="wrap" style={{ paddingBottom: 'var(--sec)', maxWidth: 680 }}>
        <QuotePay link={link} />
      </section>
    </main>
  );
}
