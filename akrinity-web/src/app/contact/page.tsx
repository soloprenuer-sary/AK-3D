import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/forms/ContactForm';
import { BhiwandiMap } from '@/components/layout/BhiwandiMap';
import { site } from '@/lib/site-config';

export const metadata: Metadata = { title: 'Contact', description: 'Reach the Akrinity studio.' };

const ANSWERS = [
  { href: '/track-order', label: 'Track an order' },
  { href: '/track-order', label: 'Cancel or return' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/returns', label: 'Returns' },
  { href: '/faq', label: 'FAQ' },
  { href: '/materials', label: 'Materials' },
];

const TIPS = [
  'Order number, if it is about an order',
  'Product name or page link',
  'Photos, if something arrived damaged',
  'Size, colour or material for custom work',
];

export default function Contact() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Contact</span>
      </nav>

      <div className="wrap ct-head">
        <h1 className="d">
          Talk to the <span className="hl">studio</span>
        </h1>
        <p>Questions about an order, a custom print or a design? Send us a message.</p>
      </div>

      <div className="wrap ct-grid">
        <section className="ct-card" aria-labelledby="ct-form-h">
          <h2 id="ct-form-h">Send a message</h2>
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
        </section>

        <aside className="ct-side">
          <section className="ct-card ct-dark" aria-labelledby="ct-reach-h">
            <h2 id="ct-reach-h">Reach us</h2>
            <dl className="ct-reach">
              {site.whatsappText && (
                <div>
                  <dt>WhatsApp</dt>
                  <dd>
                    <a
                      href={`https://wa.me/${site.whatsappDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {site.whatsappText}
                    </a>
                  </dd>
                </div>
              )}
              {site.supportEmail && (
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
                  </dd>
                </div>
              )}
              <div>
                <dt>Studio</dt>
                <dd>{site.studioAddress || 'Bhiwandi, India'}</dd>
              </div>
              {site.replyHours > 0 && (
                <div>
                  <dt>Reply time</dt>
                  <dd>Within {site.replyHours} hours, on working days</dd>
                </div>
              )}
            </dl>
            <div className="ct-tips">
              <b>Helps us answer in one reply:</b>
              <ul>
                {TIPS.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <Link className="btn btn-primary btn-sm" href="/quote">
              Have a 3D file? Get a quote
            </Link>
          </section>

          <section className="ct-card" aria-labelledby="ct-ans-h">
            <h2 id="ct-ans-h">Quick answers</h2>
            <ul className="ct-links">
              {ANSWERS.map((a) => (
                <li key={a.label}>
                  <Link href={a.href}>
                    {a.label} <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <div className="wrap ct-map">
        <BhiwandiMap />
      </div>
    </main>
  );
}
