import type { Metadata } from 'next';
import Link from 'next/link';
import { QuotePaid } from '@/components/quote/QuotePaid';
import { readLink } from '@/components/quote/quote-shared';

export const metadata: Metadata = { title: 'Quote payment', robots: { index: false } };

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
        <span aria-current="page">Quote payment</span>
      </nav>
      <div className="wrap page-title">
        <h1 className="d">
          Your quote <span className="hl">payment.</span>
        </h1>
      </div>
      <section className="wrap" style={{ paddingBottom: 'var(--sec)', maxWidth: 680 }}>
        <QuotePaid link={link} />
      </section>
    </main>
  );
}
