import type { Metadata } from 'next';
import Link from 'next/link';
import { QuoteAccept } from '@/components/quote/QuoteAccept';
import { readLink } from '@/components/quote/quote-shared';

export const metadata: Metadata = { title: 'Approve your quote', robots: { index: false } };

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
        <span aria-current="page">Approve your quote</span>
      </nav>
      <div className="wrap page-title">
        <h1 className="d">
          Approve your <span className="hl">quote.</span>
        </h1>
      </div>
      <section className="wrap" style={{ paddingBottom: 'var(--sec)', maxWidth: 1040 }}>
        <QuoteAccept link={link} />
      </section>
    </main>
  );
}
