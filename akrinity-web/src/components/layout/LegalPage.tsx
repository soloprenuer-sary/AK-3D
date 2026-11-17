import type { ReactNode } from 'react';
import Link from 'next/link';

export interface LegalSection {
  id: string;
  heading: string;
  /** A string is a paragraph; an array is a bulleted list. */
  body: (string | string[])[];
}

/**
 * Text markup used in the legal pages:
 *   [[SOMETHING]]        a value still to be filled in (shown highlighted)
 *   {{/path|link text}}  a link to another page on the site
 */
function rich(text: string): ReactNode[] {
  return text.split(/(\[\[.*?\]\]|\{\{.*?\}\})/g).map((part, i) => {
    if (part.startsWith('[[')) {
      return (
        <mark key={i} className="legal-ph">
          {part.slice(2, -2)}
        </mark>
      );
    }
    if (part.startsWith('{{')) {
      const [href, label] = part.slice(2, -2).split('|');
      return (
        <Link key={i} href={href}>
          {label}
        </Link>
      );
    }
    return part;
  });
}

/** A long legal document: sample banner, "information needed" box, contents list and numbered sections. */
export function LegalPage({
  title,
  intro,
  needed,
  sections,
}: {
  title: string;
  intro: string;
  /** Facts the owner must supply before the page can be finalised. */
  needed: string[];
  sections: LegalSection[];
}) {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>

      <section className="wrap legal-head">
        <span className="tag accent">Sample · not final</span>
        <h1 className="d">{title}</h1>
        <p>{intro}</p>
        <p className="meta">
          Last updated: <mark className="legal-ph">DATE</mark>
        </p>
      </section>

      <section className="wrap legal-need" aria-labelledby="need-h">
        <h2 id="need-h">Information needed before this goes live</h2>
        <p>
          Everything below is sample wording. The highlighted values must be replaced with real
          ones, and the whole page must be reviewed by a lawyer (LAWYER) before launch. We need:
        </p>
        <ul>
          {needed.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <section className="wrap legal">
        <nav className="legal-toc" aria-label="On this page">
          <b>On this page</b>
          <ol>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#s-${s.id}`}>{s.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="legal-body">
          {sections.map((s, n) => (
            <section key={s.id} id={`s-${s.id}`} aria-labelledby={`h-${s.id}`}>
              <h2 id={`h-${s.id}`}>
                <span aria-hidden="true">{n + 1}.</span> {s.heading}
              </h2>
              {s.body.map((b, i) =>
                Array.isArray(b) ? (
                  <ul key={i}>
                    {b.map((li) => (
                      <li key={li}>{rich(li)}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i}>{rich(b)}</p>
                ),
              )}
            </section>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 'var(--sec)' }}>
        <div
          className="info-hero"
          style={{ gridTemplateColumns: '1fr auto', alignItems: 'center' }}
        >
          <div>
            <h2 className="d" style={{ fontSize: 40 }}>
              Questions <span className="hl">about this?</span>
            </h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Write to the studio and we will answer.
            </p>
          </div>
          <Link className="btn btn-primary" href="/contact">
            Contact us
          </Link>
        </div>
      </section>
    </main>
  );
}
