'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { BED, CX, N, printerState, type Mode, type PrinterState } from '@/lib/printer-geometry';

export interface PrinterHandle {
  /** Draw the printer with `progress` layers printed. Returns the computed state. */
  draw: (progress: number, clock: number, mode: Mode) => PrinterState;
}

const INK = '#0B0B0C';
const FRAME = '#E4E1D7';
const FRAME_2 = '#D6D2C6';
const DARK = '#17171A';
const VIOLET = '#5B2BE0';
const VIOLET_2 = '#7A52EC';
const ORANGE = '#FF6A1F';
const LIME = '#D8FF3A';

/**
 * Flat illustration of a desktop 3D printer printing a vase. Static markup is rendered by React;
 * the moving parts are updated directly through refs so animation never triggers a re-render.
 */
export function PrinterSvg({ handle }: { handle: RefObject<PrinterHandle | null> }) {
  const layerEls = useRef<(SVGRectElement | null)[]>([]);
  const headEl = useRef<SVGGElement | null>(null);
  const carriageEl = useRef<SVGRectElement | null>(null);
  const rodEl = useRef<SVGRectElement | null>(null);
  const filamentEl = useRef<SVGPathElement | null>(null);
  const barEl = useRef<SVGRectElement | null>(null);

  useEffect(() => {
    handle.current = {
      draw(progress, clock, mode) {
        const st = printerState(progress, clock, mode);
        st.layers.forEach((r, i) => {
          const el = layerEls.current[i];
          if (!el) return;
          el.setAttribute('x', r.x.toFixed(2));
          el.setAttribute('y', r.y.toFixed(2));
          el.setAttribute('width', Math.max(0, r.width).toFixed(2));
          el.setAttribute('height', r.height.toFixed(2));
        });
        const hx = st.headX.toFixed(2);
        headEl.current?.setAttribute('transform', `translate(${hx},${st.headY.toFixed(2)})`);
        carriageEl.current?.setAttribute('x', (st.headX - 34).toFixed(2));
        rodEl.current?.setAttribute('x', (st.headX - 3).toFixed(2));
        rodEl.current?.setAttribute('height', Math.max(0, st.headY - 62 - 156).toFixed(2));
        filamentEl.current?.setAttribute('d', `M96 90 C96 126 ${hx} 100 ${hx} 120`);
        barEl.current?.setAttribute('width', (38 * st.fraction).toFixed(2));
        return st;
      },
    };
    const ref = handle;
    return () => {
      ref.current = null;
    };
  }, [handle]);

  return (
    <svg
      viewBox="0 0 640 560"
      role="img"
      aria-label="Illustration of a 3D printer building a vase layer by layer"
    >
      <ellipse cx={320} cy={482} rx={236} ry={13} fill={INK} opacity={0.12} />
      <rect x={112} y={456} width={416} height={18} rx={8} fill={FRAME_2} stroke={INK} strokeWidth={2} />
      <rect x={150} y={442} width={340} height={14} rx={4} fill={DARK} />
      <rect x={170} y={430} width={300} height={12} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={1.5} />

      <g>
        {Array.from({ length: N }, (_, i) => (
          <rect
            key={i}
            ref={(el) => {
              layerEls.current[i] = el;
            }}
            x={CX}
            y={BED}
            width={0}
            height={0}
            rx={2}
            fill={i % 2 ? VIOLET_2 : VIOLET}
          />
        ))}
      </g>

      <rect x={118} y={96} width={24} height={356} rx={6} fill={FRAME} stroke={INK} strokeWidth={2.5} />
      <rect x={498} y={96} width={24} height={356} rx={6} fill={FRAME} stroke={INK} strokeWidth={2.5} />
      <rect x={118} y={86} width={404} height={16} rx={6} fill={FRAME} stroke={INK} strokeWidth={2.5} />
      <rect x={118} y={138} width={404} height={18} rx={6} fill={FRAME_2} stroke={INK} strokeWidth={2.5} />

      <rect x={94} y={86} width={26} height={8} rx={4} fill={DARK} />
      <circle cx={96} cy={60} r={30} fill={DARK} stroke={INK} strokeWidth={2} />
      <circle cx={96} cy={60} r={12} fill={LIME} stroke={INK} strokeWidth={1.5} />
      <path ref={filamentEl} fill="none" stroke={ORANGE} strokeWidth={3} strokeLinecap="round" />

      <path d="M552 336 C566 380 590 400 552 430" fill="none" stroke={INK} strokeWidth={3} />
      <rect x={524} y={300} width={58} height={40} rx={8} fill={DARK} stroke={INK} strokeWidth={2} />
      <rect x={534} y={316} width={38} height={6} rx={3} fill="#34343A" />
      <rect ref={barEl} x={534} y={316} width={0} height={6} rx={3} fill={LIME} />

      <rect ref={rodEl} x={300} y={156} width={6} height={0} fill={DARK} />
      <rect ref={carriageEl} x={286} y={120} width={68} height={36} rx={8} fill={DARK} />
      <g ref={headEl}>
        <polygon points="-8,-16 8,-16 0,0" fill={ORANGE} stroke={INK} strokeWidth={1.5} />
        <rect x={-15} y={-34} width={30} height={18} rx={4} fill={DARK} />
        <rect x={-24} y={-62} width={48} height={30} rx={6} fill={VIOLET} stroke={INK} strokeWidth={2} />
      </g>
    </svg>
  );
}
