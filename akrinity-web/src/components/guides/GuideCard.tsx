import Link from 'next/link';
import type { Guide } from '@/lib/guides-data';

export function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link className="post-card" href={`/guides/${guide.slug}`}>
      <span className="post-meta">
        {guide.type} · {guide.minutes} min read
      </span>
      <h3>{guide.title}</h3>
      <p>{guide.summary}</p>
      <span style={{ fontWeight: 700, marginTop: 'auto' }}>Read the article →</span>
    </Link>
  );
}
