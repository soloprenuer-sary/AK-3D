'use client';

import { useState, type ImgHTMLAttributes } from 'react';

/** Pictures are resized and served as WebP by Vercel's image service (see `images` in next.config.mjs). */
const WIDTHS = [256, 384, 640, 828, 1080];
const REMOTE = /^https:\/\/(admin\.akrinity\.in|m\.media-amazon\.com)\//;

function canOptimize(src: string): boolean {
  if (/\.svg(\?|$)/i.test(src)) return false;
  return (src.startsWith('/') && !src.startsWith('//')) || REMOTE.test(src);
}

const through = (src: string, w: number) =>
  `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'loading'> & {
  src: string;
  /** What the browser should assume the picture's width is, e.g. "(max-width: 640px) 50vw, 25vw". */
  sizes?: string;
  /** The first big picture on a page: loads at once and first. */
  priority?: boolean;
  widths?: number[];
};

/**
 * An img that asks for a resized copy that fits its box, instead of the full-size original. Falls
 * back to the original address if the resized copy cannot be made.
 */
export function Pic({ src, sizes = '100vw', priority, widths = WIDTHS, alt, ...rest }: Props) {
  const [raw, setRaw] = useState(false);
  const optimize = !raw && canOptimize(src);
  const set = widths.map((w) => `${through(src, w)} ${w}w`).join(', ');
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      alt={alt}
      src={optimize ? through(src, widths[Math.min(2, widths.length - 1)]) : src}
      srcSet={optimize ? set : undefined}
      sizes={optimize ? sizes : undefined}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={(e) => {
        if (optimize) {
          setRaw(true);
          return;
        }
        rest.onError?.(e);
      }}
    />
  );
}
