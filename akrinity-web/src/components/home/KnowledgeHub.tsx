import Link from 'next/link';
import { GuideCard } from '@/components/guides/GuideCard';
import type { Guide } from '@/lib/guides-data';

export function KnowledgeHub({ guides }: { guides: Guide[] }) {
  return (
    <section className="sec" aria-labelledby="hub-h">
      <div className="wrap">
        <div className="sec-head">
          <h2 id="hub-h" className="d">
            From the <span className="hl">knowledge hub</span>
          </h2>
          <Link className="btn btn-sm" href="/guides">
            All articles
          </Link>
        </div>
        <div className="post-grid hub-scroll" style={{ padding: 0 }}>
          {guides.slice(0, 3).map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </div>
      </div>
    </section>
  );
}
