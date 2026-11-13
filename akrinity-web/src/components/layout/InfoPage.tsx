import Link from 'next/link';

export interface InfoSection {
  heading: string;
  paragraphs: string[];
}

/** Simple content page used for About, Contact, FAQ, Shipping, Returns, Privacy and Terms. */
export function InfoPage({
  title,
  intro,
  sections,
  note,
}: {
  title: string;
  intro: string;
  sections: InfoSection[];
  note?: string;
}) {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>
      <div className="wrap page-title">
        <h1 className="d">
          {title}
        </h1>
        <p>{intro}</p>
        {note && <p className="sample-note">{note}</p>}
      </div>
      <section className="wrap info-body" style={{ paddingBottom: 'var(--sec)' }}>
        {sections.map((s) => (
          <div key={s.heading} className="info-block">
            <h2 className="label">{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}
