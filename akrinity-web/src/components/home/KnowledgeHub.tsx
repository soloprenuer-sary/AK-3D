'use client';

import { Carousel } from '@/components/ui/Carousel';
import { GuideCard } from '@/components/guides/GuideCard';
import { useLiveGuides } from '@/lib/live-catalogue';
import type { Guide } from '@/lib/guides-data';

/** Articles in a slider with arrows beside "All articles". */
export function KnowledgeHub({ guides: builtGuides }: { guides: Guide[] }) {
  const guides = useLiveGuides(builtGuides);
  return (
    <Carousel
      id="hub"
      title={
        <>
          From the <span className="hl">knowledge hub</span>
        </>
      }
      ctaLabel="All articles"
      ctaHref="/guides"
      label="articles"
    >
      {guides.slice(0, 12).map((g) => (
        <div className="car-item car-post" key={g.slug}>
          <GuideCard guide={g} />
        </div>
      ))}
    </Carousel>
  );
}
