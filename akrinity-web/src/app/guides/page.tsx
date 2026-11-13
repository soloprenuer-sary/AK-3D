import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideCard } from '@/components/guides/GuideCard';
import { GUIDES } from '@/lib/guides-data';

export const metadata: Metadata = {
  title: 'Knowledge hub',
  description: 'Materials, guides and design notes from the studio.',
};

export default function KnowledgeHubPage() {
  const [featured, ...rest] = GUIDES;
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Knowledge hub</span>
      </nav>

      <div className="wrap hub-head">
        <div>
          <span className="tag accent">Knowledge hub</span>
          <h1 className="d" style={{ marginTop: 16, fontSize: 'clamp(56px,8vw,96px)', lineHeight: 0.95 }}>
            Learn before <span className="hl">you print.</span>
          </h1>
        </div>
        <p className="muted" style={{ fontSize: 17, maxWidth: 480 }}>
          Plain explanations of materials, colour options and design rules, plus test notes from the
          studio. New articles appear here when they are published.
        </p>
      </div>

      <section className="wrap" aria-label="Featured article">
        <GuideCard guide={featured} />
      </section>

      <section className="wrap" style={{ marginTop: 24 }} aria-label="All articles">
        <div className="post-grid">
          {rest.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </div>
        <p className="hub-note">Sample articles. Text is a template until the studio writes the final content.</p>
      </section>
    </main>
  );
}
