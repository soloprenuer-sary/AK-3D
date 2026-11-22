'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DescBlock } from '@/lib/product-content';
import { Pic } from '@/components/ui/Pic';

export interface StagePicture {
  src: string;
  alt: string;
  caption: string;
}

function Prose({ blocks }: { blocks: DescBlock[] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        if (b.t === 'h') return <h3 key={i}>{b.text}</h3>;
        if (b.t === 'p') return <p key={i}>{b.text}</p>;
        if (b.t === 'lead')
          return (
            <p key={i} className="lead">
              {b.text}
            </p>
          );
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

/** Seconds each picture stays before the next one fades in. */
const SLIDE_SECONDS = 5;

/**
 * The description: text on the left, and on the right a column that stays in view while the text
 * scrolls. It holds one square picture that changes by itself every ${SLIDE_SECONDS} seconds with a soft
 * cross-fade (it waits after a thumbnail is pressed and while the pointer is over it), and the
 * thumbnails. Wide banners and pictures that fail to load are dropped. On phones the column sits
 * above the text.
 */
export function DescStage({ blocks, pictures }: { blocks: DescBlock[]; pictures: StagePicture[] }) {
  const sections = toSections(blocks);
  const [bad, setBad] = useState<Set<string>>(new Set());
  const shown = pictures.filter((p) => !bad.has(p.src));
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = shown.length;

  const drop = useCallback((src: string) => {
    setBad((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  }, []);

  // Move to the next picture every few seconds. Pressing a thumbnail restarts the wait.
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % count), SLIDE_SECONDS * 1000);
    return () => window.clearTimeout(id);
  }, [active, count, paused]);

  const index = Math.min(active, Math.max(0, count - 1));
  const hasSide = count > 0;

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
    <div className="dg">
      <div className="dg-text">
        {sections.map((s, i) => (
          <div key={i} className="dg-sec">
            <Prose blocks={s} />
          </div>
        ))}
      </div>

      <aside className="dg-side" aria-label="Pictures and summary">
        <div
          className="dg-pic"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {shown.map((p, i) => (
            <Pic
              key={p.src}
              className={i === index ? 'dg-slide on' : 'dg-slide'}
              src={p.src}
              alt={i === index ? p.alt || p.caption : ''}
              aria-hidden={i === index ? undefined : true}
              sizes="(max-width: 959px) 100vw, 560px"
              widths={[384, 640, 828, 1080]}
              onLoad={(e) => {
                const im = e.currentTarget;
                if (im.naturalHeight > 0 && im.naturalWidth / im.naturalHeight > 2.4) drop(p.src);
              }}
              onError={() => drop(p.src)}
            />
          ))}
          {shown[index]?.caption ? <span className="dg-cap">{shown[index].caption}</span> : null}
        </div>
        {count > 1 && (
          <div className="dg-thumbs" role="group" aria-label="Choose a picture">
            {shown.map((p, i) => (
              <button
                key={p.src}
                type="button"
                className={i === index ? 'dg-th on' : 'dg-th'}
                aria-label={`Show picture ${i + 1}`}
                aria-pressed={i === index}
                onClick={() => {
                  setActive(i);
                }}
              >
                <Pic
                  src={p.src}
                  alt=""
                  sizes="58px"
                  widths={[256]}
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
      </aside>
    </div>
  );
}
