/** Knowledge hub articles. They come from WordPress posts (see `wp.ts` and `article-content.ts`). */
import type { Block } from './article-content';

export interface GuideImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Guide {
  slug: string;
  title: string;
  summary: string;
  type: 'Materials' | 'Guides' | 'Design';
  /** Publish date, YYYY-MM-DD. */
  date: string;
  /** Date of the last edit, YYYY-MM-DD, when it is later than the publish date. */
  updated?: string;
  minutes: number;
  /** The post's featured image. */
  cover?: GuideImage;
  body: Block[];
}
