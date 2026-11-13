import type { Metadata } from 'next';
import Link from 'next/link';
import { QuoteForm } from '@/components/quote/QuoteForm';

export const metadata: Metadata = { title: 'Custom quote', description: 'Upload a 3D file or a sketch and get a quote.' };

export default function QuotePage() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Custom quote</span>
      </nav>

      <div className="wrap page-title">
        <span className="tag accent">Custom printing</span>
        <h1 className="d" style={{ marginTop: 16 }}>
          Tell us what <span className="hl">to print.</span>
        </h1>
        <p>Upload your file, choose a material, and we reply with a price and lead time. You pay only after you approve the quote.</p>
      </div>

      <section className="wrap quote-wrap">
        <QuoteForm />
        <aside className="quote-side">
          <div className="panel-dark">
            <h2 className="d" style={{ fontSize: 36 }}>What happens next</h2>
            <ol className="steps-list">
              <li><b>We review your file.</b> We check it prints well and flag any fixes.</li>
              <li><b>You get a quote.</b> Price and lead time by email or WhatsApp.</li>
              <li><b>Approve and pay.</b> Larger jobs start with an advance.</li>
              <li><b>We print, check and ship.</b> Track it from your account later.</li>
            </ol>
          </div>
          <div className="panel-light">
            <b>Not sure what to pick?</b>
            <p className="muted">Read the materials guide, or ask us on the contact page.</p>
            <Link className="btn btn-sm" href="/guides">Open the knowledge hub</Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
