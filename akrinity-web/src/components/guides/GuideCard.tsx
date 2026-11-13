import Link from 'next/link';
import type { Guide } from '@/lib/guides-data';

export function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link className="post-card" href={`/guides/${guide.slug}`}>
      <div className="img-ph" role="img" aria-label="Article image placeholder">
        <span>Image · 16 : 9</span>
      </div>
      <span className="post-meta">
        {guide.type} · {guide.minutes} min read
      </span>
      <h3>{guide.title}</h3>
      <p>{guide.summary}</p>
      <span style={{ fontWeight: 700, marginTop: 'auto' }}>Read the article →</span>
    </Link>
  );
}
