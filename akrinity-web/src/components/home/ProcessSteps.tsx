'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { processSteps } from '@/lib/placeholder-data';

const ink = '#0B0B0C';
const lime = '#D8FF3A';
const violet = '#7A52EC';
const orange = '#FF6A1F';
const paper = '#F3F1EA';
const line = {
  stroke: paper,
  strokeWidth: 3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

/** One illustration per step. Each is drawn with CSS-animated parts (see .ftd-* in globals.css). */
function Art({ step }: { step: number }): ReactNode {
  switch (step) {
    case 0:
      return (
        <svg viewBox="0 0 320 220" aria-hidden="true">
          <rect
            x="30"
            y="150"
            width="260"
            height="46"
            rx="14"
            fill="#17171A"
            stroke="#34343A"
            strokeWidth="2"
          />
          <text
            x="160"
            y="179"
            textAnchor="middle"
            fill={paper}
            fontFamily="Inter,sans-serif"
            fontWeight="700"
            fontSize="14"
          >
            Drop your file here
          </text>
          <g className="ftd-fly">
            <path
              d="M124 20 h52 l22 22 v62 h-74 z"
              fill={lime}
              stroke={ink}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M176 20 v22 h22"
              fill="none"
              stroke={ink}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <text
              x="161"
              y="82"
              textAnchor="middle"
              fill={ink}
              fontFamily="Inter,sans-serif"
              fontWeight="800"
              fontSize="15"
            >
              STL
            </text>
          </g>
          <g className="ftd-arrow">
            <path d="M160 116 v22 M150 128 l10 10 l10 -10" {...line} stroke={lime} />
          </g>
        </svg>
      );
    case 1:
      return (
        <svg viewBox="0 0 320 220" aria-hidden="true">
          <rect
            x="70"
            y="24"
            width="180"
            height="172"
            rx="18"
            fill="#17171A"
            stroke="#34343A"
            strokeWidth="2"
          />
          <text
            x="94"
            y="58"
            fill={paper}
            fontFamily="Inter,sans-serif"
            fontWeight="700"
            fontSize="14"
          >
            Your quote
          </text>
          <rect x="94" y="72" width="132" height="8" rx="4" fill="#34343A" />
          <rect x="94" y="92" width="96" height="8" rx="4" fill="#34343A" />
          <rect x="94" y="112" width="112" height="8" rx="4" fill="#34343A" />
          <g className="ftd-pop">
            <rect
              x="130"
              y="138"
              width="130"
              height="48"
              rx="24"
              fill={lime}
              stroke={ink}
              strokeWidth="3"
            />
            <text
              x="195"
              y="170"
              textAnchor="middle"
              fill={ink}
              fontFamily="Anton,Impact,sans-serif"
              fontSize="24"
            >
              ₹ + days
            </text>
          </g>
        </svg>
      );
    case 2:
      return (
        <svg viewBox="0 0 320 220" aria-hidden="true">
          <rect
            x="60"
            y="40"
            width="200"
            height="140"
            rx="20"
            fill="#17171A"
            stroke="#34343A"
            strokeWidth="2"
          />
          <circle cx="160" cy="100" r="44" fill="none" stroke="#34343A" strokeWidth="8" />
          <circle
            className="ftd-ring"
            cx="160"
            cy="100"
            r="44"
            fill="none"
            stroke={lime}
            strokeWidth="8"
            strokeLinecap="round"
            transform="rotate(-90 160 100)"
          />
          <path
            className="ftd-tick"
            d="M138 100 l16 16 l30 -34"
            {...line}
            stroke={lime}
            strokeWidth={7}
          />
          <rect x="100" y="158" width="120" height="12" rx="6" fill="#34343A" />
        </svg>
      );
    case 3:
      return (
        <svg viewBox="0 0 320 220" aria-hidden="true">
          <rect
            x="52"
            y="30"
            width="216"
            height="156"
            rx="14"
            fill="none"
            stroke="#34343A"
            strokeWidth="3"
          />
          <rect x="70" y="170" width="180" height="10" rx="5" fill="#34343A" />
          <g className="ftd-head">
            <rect
              x="130"
              y="40"
              width="40"
              height="20"
              rx="6"
              fill={violet}
              stroke={ink}
              strokeWidth="2"
            />
            <path d="M150 60 l-6 14 h12 z" fill={orange} />
          </g>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              className="ftd-layer"
              style={{ animationDelay: `${i * 0.35}s` }}
              x={118 - (i % 3) * 4}
              y={158 - i * 11}
              width={84 + (i % 3) * 8}
              height="9"
              rx="3"
              fill={lime}
              stroke={ink}
              strokeWidth="2"
            />
          ))}
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 320 220" aria-hidden="true">
          <path
            d="M20 170 H300"
            stroke="#34343A"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="10 12"
            className="ftd-road"
          />
          <g className="ftd-truck">
            <rect
              x="40"
              y="96"
              width="110"
              height="64"
              rx="8"
              fill={lime}
              stroke={ink}
              strokeWidth="3"
            />
            <path
              d="M150 112 h34 l24 26 v22 h-58 z"
              fill={violet}
              stroke={ink}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle cx="80" cy="166" r="14" fill={ink} stroke={paper} strokeWidth="3" />
            <circle cx="180" cy="166" r="14" fill={ink} stroke={paper} strokeWidth="3" />
            <text
              x="95"
              y="136"
              textAnchor="middle"
              fill={ink}
              fontFamily="Anton,Impact,sans-serif"
              fontSize="20"
            >
              AKRINITY
            </text>
          </g>
        </svg>
      );
  }
}

const SECONDS = 3.2;

/**
 * "From file to front door": a timeline whose progress bar fills step by step, with an illustration
 * and the step text below. It plays while on screen, stops when out of view, and shows step one when
 * motion is reduced. Tapping a step jumps to it.
 */
export function ProcessSteps() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const host = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const still = useRef(false);

  useEffect(() => {
    still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !playing || still.current) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % processSteps.length), SECONDS * 1000);
    return () => clearTimeout(t);
  }, [visible, playing, active]);

  const pct = (active / (processSteps.length - 1)) * 100;

  return (
    <section ref={host} className="sec band-ink process ftd" id="process" aria-labelledby="ftd-h">
      <div className="wrap">
        <h2 className="d" id="ftd-h">
          From file to <em>front door</em>
        </h2>

        <div className="ftd-track" role="list">
          <div className="ftd-rail" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </div>
          {processSteps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              role="listitem"
              className={i < active ? 'ftd-node done' : i === active ? 'ftd-node on' : 'ftd-node'}
              aria-current={i === active ? 'step' : undefined}
              onClick={() => {
                setActive(i);
                setPlaying(false);
              }}
            >
              <span className="ftd-dot">{i < active ? '✓' : i + 1}</span>
              <span className="ftd-label">{s.title}</span>
            </button>
          ))}
          <span className="ftd-pack" style={{ left: `${10 + pct * 0.8}%` }} aria-hidden="true" />
        </div>

        <div className="ftd-stage" aria-live="polite">
          <div className="ftd-art" key={active}>
            <Art step={active} />
          </div>
          <div className="ftd-copy" key={`c${active}`}>
            <span className="ftd-count">
              Step {active + 1} of {processSteps.length}
            </span>
            <h3>{processSteps[active].title}</h3>
            <p>{processSteps[active].body}</p>
            <button
              type="button"
              className="ftd-play"
              onClick={() => setPlaying((p) => !p)}
              aria-pressed={!playing}
            >
              {playing ? 'Pause animation' : 'Play animation'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
