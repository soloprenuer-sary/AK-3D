import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleMotion } from '@/components/guides/ArticleMotion';
import { GuideCard } from '@/components/guides/GuideCard';
import { getGuides } from '@/lib/catalogue';
import type { Block, Guide } from '@/lib/guides-data';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const guides = await getGuides();
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const guide = (await getGuides()).find((g) => g.slug === slug);
  return { title: guide?.title ?? 'Article', description: guide?.summary };
}

function renderBlock(b: Block, i: number) {
  switch (b.t) {
    case 'p':
      return <p key={i}>{b.text}</p>;
    case 'h2':
      return <h2 key={i}>{b.text}</h2>;
    case 'tip':
      return (
        <div key={i} className="callout">
          <b>Tip.</b> {b.text}
        </div>
      );
    case 'img':
      return (
        <figure key={i} className="article-figure">
          <div className="img-ph" role="img" aria-label={b.caption}>
            <span>Image · 16 : 9</span>
          </div>
          <figcaption>{b.caption}</figcaption>
        </figure>
      );
    case 'table':
      return (
        <table key={i}>
          <thead>
            <tr>
              {b.head.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r) => (
              <tr key={r.join('|')}>
                {r.map((c, j) => (
                  <td key={`${j}-${c}`}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const guides = await getGuides();
  const guide = guides.find((g) => g.slug === slug) as Guide | undefined;
  if (!guide) notFound();
  const others = guides.filter((g) => g.slug !== guide.slug).slice(0, 2);

  return (
    <main id="main">
      <ArticleMotion bodyId="article-body" />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/guides">Knowledge hub</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{guide.type}</span>
      </nav>

      <article className="article">
        <span className="post-meta">
          {guide.type} · {guide.minutes} min read · {guide.date}
        </span>
        <h1 style={{ marginTop: 14 }}>{guide.title}</h1>
        <p className="lead">{guide.summary}</p>
        <div className="img-ph article-hero" role="img" aria-label="Article hero image placeholder">
          <span>Hero image · 16 : 9 · 1600 × 900</span>
        </div>
        <div id="article-body" className="body">
          {guide.body.map(renderBlock)}
        </div>
        <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" href="/shop">
            Shop ready-made
          </Link>
          <Link className="btn" href="/quote">
            Upload a file
          </Link>
        </div>
      </article>

      <section className="related-posts" aria-label="More articles">
        <h2 className="d" style={{ fontSize: 48, marginBottom: 20 }}>
          More <span className="hl">articles</span>
        </h2>
        <div className="post-grid" style={{ padding: 0 }}>
          {others.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </div>
      </section>
    </main>
  );
}
