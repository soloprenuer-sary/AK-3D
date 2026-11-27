import type { ReactNode } from 'react';
import Link from 'next/link';

export interface InfoImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface InfoSection {
  heading: string;
  paragraphs: string[];
  /** Optional picture shown at the top of the section. */
  image?: InfoImage;
  /** Optional bullet list after the paragraphs. */
  items?: string[];
}

/** Content page used for About, Contact, FAQ, Shipping, Returns, Privacy and Terms. */
export function InfoPage({
  title,
  intro,
  sections,
  note,
  heroImage,
  afterSections,
  children,
}: {
  title: string;
  intro: string;
  sections: InfoSection[];
  note?: string;
  heroImage?: InfoImage;
  /** Shown after the cards, before the closing block (for example a picture slider). */
  afterSections?: ReactNode;
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
            <h1
              className="d"
              style={{ marginTop: 16, fontSize: 'clamp(52px,7vw,88px)', lineHeight: 0.95 }}
            >
              {title}
            </h1>
            <p
              style={{
                marginTop: 16,
                fontSize: 18,
                lineHeight: 1.6,
                color: 'var(--muted)',
                maxWidth: 520,
              }}
            >
              {intro}
            </p>
            {note && (
              <p className="meta" style={{ marginTop: 14 }}>
                {note}
              </p>
            )}
          </div>
          {heroImage ? (
            <figure style={{ margin: 0 }}>
              <img
                src={heroImage.src}
                alt={heroImage.alt}
                width={1200}
                height={900}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 28,
                  border: '1.5px solid var(--ink)',
                  display: 'block',
                }}
              />
              {heroImage.caption && (
                <figcaption className="meta" style={{ marginTop: 8 }}>
                  {heroImage.caption}
                </figcaption>
              )}
            </figure>
          ) : (
            <div
              className="img-ph"
              role="img"
              aria-label="Page image placeholder"
              style={{ aspectRatio: '4 / 3' }}
            >
              <span>Image · 4 : 3</span>
            </div>
          )}
        </div>
      </section>

      <section
        className="wrap"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))',
          gap: 20,
          padding: '24px var(--gutter) var(--sec)',
        }}
      >
        {sections.map((s) => (
          <article key={s.heading} className="info-card">
            {s.image && (
              <figure style={{ margin: '0 0 6px' }}>
                <img
                  src={s.image.src}
                  alt={s.image.alt}
                  width={1200}
                  height={900}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 18,
                    border: '1.5px solid var(--ink)',
                    display: 'block',
                  }}
                />
                {s.image.caption && (
                  <figcaption className="meta" style={{ marginTop: 6 }}>
                    {s.image.caption}
                  </figcaption>
                )}
              </figure>
            )}
            <h2>{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {s.items && s.items.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      {afterSections && (
        <section className="wrap" style={{ paddingBottom: 'var(--sec)' }}>
          {afterSections}
        </section>
      )}

      {children && (
        <section className="wrap" style={{ paddingBottom: 'var(--sec)' }}>
          {children}
        </section>
      )}

      <section className="wrap" style={{ paddingBottom: 'var(--sec)' }}>
        <div
          className="info-hero"
          style={{ gridTemplateColumns: '1fr auto', alignItems: 'center' }}
        >
          <div>
            <h2 className="d" style={{ fontSize: 40 }}>
              Still <span className="hl">unsure?</span>
            </h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Ask the studio, or read the knowledge hub.
            </p>
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
