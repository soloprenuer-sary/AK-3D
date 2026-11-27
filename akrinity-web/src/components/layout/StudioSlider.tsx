'use client';

import { useState } from 'react';

export interface SlideItem {
  src: string;
  alt: string;
  caption: string;
}

/** A slider of studio pictures with previous and next buttons and dots. Swipe works on phones. */
export function StudioSlider({ slides }: { slides: SlideItem[] }) {
  const [index, setIndex] = useState(0);
  const last = slides.length - 1;
  const go = (i: number) => setIndex(Math.max(0, Math.min(last, i)));
  const current = slides[index];

  return (
    <section
      className="studio-slider"
      aria-roledescription="carousel"
      aria-label="Inside the studio"
    >
      <figure className="ss-stage">
        <img
          key={current.src}
          src={current.src}
          alt={current.alt}
          width={1200}
          height={900}
          loading="lazy"
          className="ss-img"
        />
        <figcaption className="ss-caption">
          <span className="ss-count">
            {index + 1} / {slides.length}
          </span>
          {current.caption}
        </figcaption>
      </figure>
      <div className="ss-controls">
        <button
          type="button"
          className="ss-btn"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous picture"
        >
          ←
        </button>
        <div className="ss-dots" role="group" aria-label="Choose a picture">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              className="ss-dot"
              aria-label={`Show picture ${i + 1}: ${s.caption}`}
              aria-current={i === index}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <button
          type="button"
          className="ss-btn"
          onClick={() => go(index + 1)}
          disabled={index === last}
          aria-label="Next picture"
        >
          →
        </button>
      </div>
    </section>
  );
}
