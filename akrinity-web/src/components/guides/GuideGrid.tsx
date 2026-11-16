'use client';

import { GuideCard } from './GuideCard';
import { useLiveGuides } from '@/lib/live-catalogue';
import type { Guide } from '@/lib/guides-data';

/** The article list on the knowledge hub page, refreshed from WordPress after the page opens. */
export function GuideGrid({ guides: builtGuides }: { guides: Guide[] }) {
  const guides = useLiveGuides(builtGuides);
  return (
    <div className="post-grid" style={{ paddingBottom: 16 }}>
      {guides.map((g) => (
        <GuideCard key={g.slug} guide={g} />
      ))}
    </div>
  );
}
