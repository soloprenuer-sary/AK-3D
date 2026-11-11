'use client';

import { useEffect, useRef } from 'react';
import { N, loopProgress } from '@/lib/printer-geometry';
import { PrinterSvg, type PrinterHandle } from './PrinterSvg';

/**
 * Looping demo: prints a full part, holds, then restarts. Runs only while on screen and stays
 * still (finished part) when reduced motion or Save-Data is on.
 * Note: this is an autoplay loop, which is an owner decision (see docs, decision D1).
 */
export function PrintingLoop() {
  const handle = useRef<PrinterHandle | null>(null);
  const host = useRef<HTMLDivElement | null>(null);
  const label = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    const live =
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !connection?.saveData;

    let clock = 0;
    let last = 0;
    let raf = 0;
    let lastText = '';

    const draw = (progress: number) => {
      const st = handle.current?.draw(progress, clock, 'loop');
      if (!st || !label.current) return;
      const text = st.complete ? 'Complete' : `Layer ${st.layer} of ${N}`;
      if (text !== lastText) {
        label.current.textContent = text;
        lastText = text;
      }
    };

    if (!live) {
      draw(N);
      return;
    }

    const frame = (now: number) => {
      if (!last) last = now;
      clock += Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(loopProgress(clock));
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    draw(loopProgress(0));
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !raf) {
          last = 0;
          raf = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting) {
          stop();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);

    return () => {
      stop();
      io.disconnect();
    };
  }, []);

  return (
    <div className="loop-card">
      <div className="readout">
        <span className="big" ref={label}>
          Layer 1 of {N}
        </span>
        <span>PLA+ · Sample vase</span>
      </div>
      <div ref={host} className="loop-host">
        <PrinterSvg handle={handle} />
      </div>
    </div>
  );
}
