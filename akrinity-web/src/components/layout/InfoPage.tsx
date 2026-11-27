import type { ReactNode } from 'react';
import Link from 'next/link';

export interface InfoSection {
  heading: string;
  paragraphs: string[];
}

/** Content page used for About, Contact, FAQ, Shipping, Returns, Privacy and Terms. */
export function InfoPage({
  title,
  intro,
  sections,
  note,
  children,
}: {
  title: string;
  intro: string;
  sections: InfoSection[];
  note?: string;
  /** Extra content shown after the sections, for example a form. */
  children?: ReactNode;
}) {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>

      <section className="wrap" style={{ paddingTop: 16 }}>
        <div className="info-hero">
          <div>
            <span className="tag accent">Akrinity</span>
            <h1 className="d" style={{ marginTop: 16, fontSize: 'clamp(52px,7vw,88px)', lineHeight: 0.95 }}>
              {title}
            </h1>
            <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.6, color: 'var(--muted)', maxWidth: 520 }}>{intro}</p>
            {note && (
              <p className="meta" style={{ marginTop: 14 }}>
                {note}
              </p>
            )}
          </div>
          <div className="img-ph" role="img" aria-label="Page image placeholder" style={{ aspectRatio: '4 / 3' }}>
            <span>Image · 4 : 3</span>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20, padding: '24px var(--gutter) var(--sec)' }}>
        {sections.map((s) => (
          <article key={s.heading} className="info-card">
            <h2>{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </article>
        ))}
      </section>

      {children && (
        <section className="wrap" style={{ paddingBottom: 'var(--sec)' }}>
          {children}
        </section>
      )}

      <section className="wrap" style={{ paddingBottom: 'var(--sec)' }}>
        <div className="info-hero" style={{ gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
          <div>
            <h2 className="d" style={{ fontSize: 40 }}>
              Still <span className="hl">unsure?</span>
            </h2>
            <p className="muted" style={{ marginTop: 8 }}>Ask the studio, or read the knowledge hub.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" href="/contact">
              Contact us
            </Link>
            <Link className="btn" href="/guides">
              Knowledge hub
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
