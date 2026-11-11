import Link from 'next/link';
import { PrinterHero } from '@/components/printer/PrinterHero';

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <span className="tag accent rise">3D printing studio, Mumbai</span>
          <h1 className="d rise" style={{ marginTop: 20, animationDelay: '0.05s' }}>
            We print <span className="hl">anything.</span>
          </h1>
          <p className="lead rise" style={{ animationDelay: '0.12s' }}>
            Ready-made prints shipped across India, and custom jobs from your own file. Pay for
            custom work only after you approve the quote.
          </p>
          <div className="cta rise" style={{ animationDelay: '0.2s' }}>
            <Link className="btn btn-primary" href="/shop">
              Shop ready-made
            </Link>
            <Link className="btn" href="/quote">
              Upload a file
            </Link>
          </div>
        </div>
        <div className="hero-visual rise" style={{ animationDelay: '0.1s' }}>
          <div className="disc" aria-hidden="true" />
          <PrinterHero />
          <div className="badge" aria-hidden="true">
            Made layer
            <br />
            by layer
          </div>
        </div>
      </div>
    </section>
  );
}
