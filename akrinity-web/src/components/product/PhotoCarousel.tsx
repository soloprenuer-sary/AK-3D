'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { Pic } from '@/components/ui/Pic';

/** Every product photo in a swipeable slider, with arrows, dots and a counter. */
export function PhotoCarousel({ photos, name }: { photos: string[]; name: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = photos.length - 1;

  const onScroll = () => {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(last, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    setIndex(next);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') goTo(index + 1);
    if (e.key === 'ArrowLeft') goTo(index - 1);
  };

  return (
    <div className="pc-carousel">
      <div
        ref={track}
        className="pc-track"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${name} photos`}
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={onKey}
      >
        {photos.map((src, i) => (
          <figure className="pc-slide" key={src + i} aria-roledescription="slide">
            <Pic
              src={src}
              alt={`${name}, photo ${i + 1} of ${photos.length}`}
              sizes="(max-width: 960px) 100vw, 640px"
              widths={[384, 640, 828, 1080]}
              priority={i === 0}
            />
          </figure>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="pc-controls">
          <button
            type="button"
            className="pc-arrow"
            aria-label="Previous photo"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
          >
            ←
          </button>
          <div className="pc-dots">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                className="pc-dot"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <span className="pc-count" aria-live="polite">
            {index + 1} / {photos.length}
          </span>
          <button
            type="button"
            className="pc-arrow"
            aria-label="Next photo"
            onClick={() => goTo(index + 1)}
            disabled={index === last}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
