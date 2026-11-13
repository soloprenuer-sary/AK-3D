'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Article motion: a thin reading-progress bar that follows scroll, and a gentle reveal of each
 * heading. Body text never moves. Reduced motion turns both off (bar still shows progress).
 */
export function ArticleMotion({ bodyId }: { bodyId: string }) {
  const bar = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const body = document.getElementById(bodyId);
    const ctx = gsap.context(() => {
      if (bar.current && body) {
        gsap.to(bar.current, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: body, start: 'top top', end: 'bottom bottom', scrub: true },
        });
      }
      if (!reduce && body) {
        gsap.utils.toArray<HTMLElement>('h2', body).forEach((h) => {
          gsap.from(h, {
            y: 16,
            opacity: 0.4,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: h, start: 'top 88%', once: true },
          });
        });
      }
    });
    return () => ctx.revert();
  }, [bodyId]);

  return <div ref={bar} className="read-bar" aria-hidden="true" />;
}
