/**
 * Knowledge hub articles. SAMPLE content: short, general explanations written as a template.
 * Replace with WordPress posts (WPGraphQL + ACF) when the backend is connected.
 */

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h2'; text: string }
  | { t: 'tip'; text: string }
  | { t: 'img'; caption: string }
  | { t: 'table'; head: string[]; rows: string[][] };

export interface Guide {
  slug: string;
  title: string;
  summary: string;
  type: 'Materials' | 'Guides' | 'Design';
  date: string;
  minutes: number;
  body: Block[];
}
