'use client';

import { useEffect, useRef } from 'react';
import { N } from '@/lib/printer-geometry';
import { PrinterSvg, type PrinterHandle } from './PrinterSvg';

const REST = 0.55; // fraction printed at rest and in the static fallback

/**
 * Hero printer. Scroll position sets how many layers are printed (down prints more, up prints
 * fewer); the head idles slightly while visible. Static when reduced motion or Save-Data is on.
 */
export function PrinterHero() {
  const handle = useRef<PrinterHandle | null>(null);
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    const live =
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !connection?.saveData;

    let target = REST;
    let cur = REST;
    let clock = 0;
    let last = 0;
    let raf = 0;
    let visible = false;

    handle.current?.draw(REST * N, 0, 'hero');
    if (!live) return;

    const frame = (now: number) => {
      if (!last) last = now;
      clock += Math.min(0.05, (now - last) / 1000);
      last = now;
      cur += (target - cur) * 0.08;
      handle.current?.draw(cur * N, clock, 'hero');
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const section = el.closest('section');
    const onScroll = () => {
      if (!section) return;
      const r = section.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, -r.top / (r.height * 0.8)));
      target = 0.4 + 0.6 * f;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) {
          last = 0;
          raf = requestAnimationFrame(frame);
        } else if (!visible) {
          stop();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);

    return () => {
      stop();
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={host} className="hero-printer">
      <PrinterSvg handle={handle} />
    </div>
  );
}
