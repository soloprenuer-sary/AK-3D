import Link from 'next/link';
import { Pic } from '@/components/ui/Pic';
import type { Guide } from '@/lib/guides-data';

export function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link className="post-card" href={`/guides/${guide.slug}`}>
      {guide.cover ? (
        // The title beside it already names the article, so the picture adds nothing to read aloud.
        <Pic
          className="post-cover"
          src={guide.cover.src}
          alt=""
          sizes="(max-width: 620px) 90vw, (max-width: 980px) 45vw, 380px"
        />
      ) : (
        <div className="img-ph" aria-hidden="true" />
      )}
      <span className="post-meta">
        {guide.type} · {guide.minutes} min read
      </span>
      <h3>{guide.title}</h3>
      <p>{guide.summary}</p>
      <span style={{ fontWeight: 700, marginTop: 'auto' }}>Read the article →</span>
    </Link>
  );
}
