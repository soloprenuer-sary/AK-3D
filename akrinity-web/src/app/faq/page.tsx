import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqAccordion } from '@/components/ui/FaqAccordion';
import { FAQ } from '@/lib/faq-data';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Common questions about orders, colours and printing.',
};

export default function Faq() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">FAQ</span>
      </nav>
      <section className="wrap faq-sec" aria-labelledby="faq-h">
        <div className="faq-head">
          <span className="tag accent">FAQ</span>
          <h1 className="d" id="faq-h">
            Questions, <span className="hl">answered</span>
          </h1>
          <p className="muted">
            The questions we get most often. If yours is not here,{' '}
            <Link href="/contact">message the studio</Link>. Answers are drafts and bracketed values
            are placeholders.
          </p>
        </div>
        <FaqAccordion items={FAQ} />
      </section>
    </main>
  );
}
