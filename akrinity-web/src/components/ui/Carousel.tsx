'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';

/**
 * A heading row with previous and next arrows beside the "see all" button, and a track of cards that
 * scrolls sideways (swipe on touch screens, arrows on desktop). Each child is one card.
 */
export function Carousel({
  id,
  title,
  ctaLabel,
  ctaHref,
  label,
  children,
}: {
  id: string;
  title: ReactNode;
  ctaLabel: string;
  ctaHref: string;
  /** Describes the track for screen readers, for example "Best sellers". */
  label: string;
  children: ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener('scroll', measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', measure);
    };
  }, [measure]);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.car-item');
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    const per = Math.max(1, Math.floor(el.clientWidth / step));
    el.scrollBy({ left: dir * step * per, behavior: 'smooth' });
  };

  return (
    <section className="sec" aria-labelledby={`${id}-h`} style={{ paddingTop: 24 }}>
      <div className="wrap">
        <div className="sec-head">
          <h2 className="d" id={`${id}-h`}>
            {title}
          </h2>
          <div className="car-ctrl">
            <button
              type="button"
              className="car-arrow"
              aria-label={`Previous ${label}`}
              onClick={() => go(-1)}
              disabled={atStart}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              className="car-arrow"
              aria-label={`Next ${label}`}
              onClick={() => go(1)}
              disabled={atEnd}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <Link className="btn btn-sm" href={ctaHref}>
              {ctaLabel}
            </Link>
          </div>
        </div>
        <div className="car-track" ref={track} role="group" aria-label={label} tabIndex={0}>
          {children}
        </div>
      </div>
    </section>
  );
}
