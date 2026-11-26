import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleBody } from '@/components/guides/ArticleBody';
import { ArticleMotion } from '@/components/guides/ArticleMotion';
import { GuideCard } from '@/components/guides/GuideCard';
import { Pic } from '@/components/ui/Pic';
import { getGuides } from '@/lib/catalogue';
import type { Guide } from '@/lib/guides-data';
import { site } from '@/lib/site-config';

/** Pages are rebuilt in the background at most once a minute, so WordPress edits appear without a deploy. */
export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const guides = await getGuides();
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const guide = (await getGuides()).find((g) => g.slug === slug);
  if (!guide) return { title: 'Article' };
  const image = guide.cover;
  return {
    title: guide.title,
    description: guide.summary,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: 'article',
      title: guide.title,
      description: guide.summary,
      url: `/guides/${guide.slug}`,
      publishedTime: guide.date,
      modifiedTime: guide.updated ?? guide.date,
      ...(image ? { images: [{ url: image.src, alt: image.alt || guide.title }] } : {}),
    },
    twitter: { card: 'summary_large_image', ...(image ? { images: [image.src] } : {}) },
  };
}

/** "13 November 2026" from "2026-11-13". */
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

/** Three more articles: the same kind first, then the rest, starting after this one. */
function moreArticles(guides: Guide[], current: Guide): Guide[] {
  const at = guides.findIndex((g) => g.slug === current.slug);
  const rest = [...guides.slice(at + 1), ...guides.slice(0, at)];
  return [
    ...rest.filter((g) => g.type === current.type),
    ...rest.filter((g) => g.type !== current.type),
  ].slice(0, 3);
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const guides = await getGuides();
  const guide = guides.find((g) => g.slug === slug);
  if (!guide) notFound();
  const others = moreArticles(guides, guide).map((g) => ({ ...g, body: [] }));
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: guide.title,
    description: guide.summary,
    datePublished: guide.date,
    dateModified: guide.updated ?? guide.date,
    ...(guide.cover ? { image: guide.cover.src } : {}),
    author: { '@type': 'Organization', name: 'Akrinity' },
    publisher: { '@type': 'Organization', name: 'Akrinity' },
    mainEntityOfPage: `${site.url}/guides/${guide.slug}`,
  };

  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <ArticleMotion key={guide.slug} bodyId="article-body" />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/guides">Knowledge hub</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{guide.type}</span>
      </nav>

      <article className="article">
        <span className="post-meta">
          {guide.type} · {guide.minutes} min read ·{' '}
          {guide.updated ? `Updated ${longDate(guide.updated)}` : longDate(guide.date)}
        </span>
        <h1 style={{ marginTop: 14 }}>{guide.title}</h1>
        <p className="lead">{guide.summary}</p>
        {guide.cover && (
          <Pic
            className="article-hero"
            src={guide.cover.src}
            alt={guide.cover.alt}
            width={guide.cover.width}
            height={guide.cover.height}
            sizes="(max-width: 760px) 100vw, 720px"
            widths={[384, 640, 828, 1080, 1920]}
            priority
          />
        )}
        <ArticleBody blocks={guide.body} />
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
