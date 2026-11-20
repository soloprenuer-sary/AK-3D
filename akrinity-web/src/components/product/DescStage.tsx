'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DescBlock } from '@/lib/product-content';

export interface StagePicture {
  src: string;
  alt: string;
  caption: string;
}

export interface GlanceCard {
  title: string;
  items: string[];
}

function Prose({ blocks }: { blocks: DescBlock[] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        if (b.t === 'h') return <h3 key={i}>{b.text}</h3>;
        if (b.t === 'p') return <p key={i}>{b.text}</p>;
        if (b.t === 'ul')
          return (
            <ul key={i} className="ticks">
              {b.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          );
        return null;
      })}
    </div>
  );
}

/** The text split into sections, one per heading. With too few headings every block is its own section. */
function toSections(blocks: DescBlock[]): DescBlock[][] {
  const byHeading: DescBlock[][] = [];
  for (const b of blocks) {
    if (b.t === 'h' || byHeading.length === 0) byHeading.push([b]);
    else byHeading[byHeading.length - 1].push(b);
  }
  return byHeading.length >= 3 ? byHeading : blocks.map((b) => [b]);
}

/**
 * The description: text on the left, and on the right a column that stays in view while the text
 * scrolls. It holds one big picture (it changes as you read from one section to the next, or when a
 * thumbnail is pressed), the thumbnails and short "at a glance" cards. Wide banners and pictures that
 * fail to load are dropped. On phones the column sits above the text.
 */
export function DescStage({
  blocks,
  pictures,
  glance,
}: {
  blocks: DescBlock[];
  pictures: StagePicture[];
  glance: GlanceCard[];
}) {
  const sections = toSections(blocks);
  const [bad, setBad] = useState<Set<string>>(new Set());
  const shown = pictures.filter((p) => !bad.has(p.src));
  const [active, setActive] = useState(0);
  const lastClick = useRef(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const count = shown.length;

  const drop = useCallback((src: string) => {
    setBad((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  }, []);

  // Change the picture as each section of text comes into view.
  useEffect(() => {
    if (count < 2 || sections.length < 2) return;
    const els = refs.current.filter((e): e is HTMLDivElement => Boolean(e));
    const io = new IntersectionObserver(
      (entries) => {
        if (Date.now() - lastClick.current < 4000) return;
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!hit) return;
        const i = Number((hit.target as HTMLElement).dataset.i ?? 0);
        setActive(Math.min(count - 1, Math.floor((i / sections.length) * count)));
      },
      { rootMargin: '-25% 0px -60% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [count, sections.length]);

  const current = shown[Math.min(active, Math.max(0, count - 1))];
  const hasSide = count > 0 || glance.length > 0;

  if (!hasSide) {
    return (
      <div className="dg dg-solo">
        <div className="dg-text">
          <Prose blocks={blocks} />
        </div>
      </div>
    );
  }

  return (
    <div className={count > 0 || glance.length > 0 ? 'dg' : 'dg dg-solo'}>
      <div className="dg-text">
        {sections.map((s, i) => (
          <div
            key={i}
            data-i={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="dg-sec"
          >
            <Prose blocks={s} />
          </div>
        ))}
      </div>

      <aside className="dg-side" aria-label="Pictures and summary">
        {current && (
          <div className="dg-pic" key={current.src}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.src}
              alt={current.alt || current.caption}
              referrerPolicy="no-referrer"
              onLoad={(e) => {
                const im = e.currentTarget;
                if (im.naturalHeight > 0 && im.naturalWidth / im.naturalHeight > 2.4)
                  drop(current.src);
              }}
              onError={() => drop(current.src)}
            />
            {current.caption ? <span className="dg-cap">{current.caption}</span> : null}
          </div>
        )}
        {count > 1 && (
          <div className="dg-thumbs" role="group" aria-label="Choose a picture">
            {shown.map((p, i) => (
              <button
                key={p.src}
                type="button"
                className={i === active ? 'dg-th on' : 'dg-th'}
                aria-label={`Show picture ${i + 1}`}
                aria-pressed={i === active}
                onClick={() => {
                  lastClick.current = Date.now();
                  setActive(i);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onLoad={(e) => {
                    const im = e.currentTarget;
                    if (im.naturalHeight > 0 && im.naturalWidth / im.naturalHeight > 2.4)
                      drop(p.src);
                  }}
                  onError={() => drop(p.src)}
                />
              </button>
            ))}
          </div>
        )}
        {glance.map((g) => (
          <div className="dg-card" key={g.title}>
            <h3>{g.title}</h3>
            <ul className="ticks">
              {g.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
    </div>
  );
}
