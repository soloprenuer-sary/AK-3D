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

export const GUIDES: Guide[] = [
  {
    slug: 'pla-petg-or-asa',
    title: 'PLA, PETG or ABS/ASA: which filament for your part',
    summary: 'A plain comparison of the three filaments we print with, and when each one makes sense.',
    type: 'Materials',
    date: '2026-11-01',
    minutes: 5,
    body: [
      { t: 'p', text: 'Sample article. The studio will replace this text with its own explanations and test notes.' },
      { t: 'h2', text: 'The short answer' },
      { t: 'p', text: 'PLA is easy to print and gives clean detail, so it suits decor and display pieces. PETG is tougher and handles everyday knocks better, which suits desk and functional parts. ABS and ASA cope better with heat, and ASA is the choice for outdoor use because it resists sunlight.' },
      { t: 'table', head: ['Filament', 'Good for', 'Watch out for'], rows: [['PLA / PLA+', 'Decor, display, prototypes', 'Softens in strong heat'], ['PETG', 'Desk and functional parts', 'Can string slightly, needs care in finishing'], ['ABS / ASA', 'Heat, impact, outdoor (ASA)', 'Needs a warmer print environment']] },
      { t: 'img', caption: 'Side-by-side test prints in PLA, PETG and ASA (placeholder)' },
      { t: 'tip', text: 'Not sure? Tell us where the part will live (sun, heat, weight) and we will suggest a filament with the quote.' },
    ],
  },
  {
    slug: 'single-or-multi-colour',
    title: 'Single colour or multi-colour: what actually changes',
    summary: 'What you get, what it costs in time, and how painting later fits in.',
    type: 'Guides',
    date: '2026-11-05',
    minutes: 4,
    body: [
      { t: 'p', text: 'Sample article. Replace with the studio text once the multi-colour process is confirmed.' },
      { t: 'h2', text: 'Single colour' },
      { t: 'p', text: 'One filament colour per part. It is the quickest option and the one most products are offered in.' },
      { t: 'h2', text: 'Multi-colour' },
      { t: 'img', caption: 'Single-colour and multi-colour version of the same part (placeholder)' },
      { t: 'p', text: 'Several colours in one print, made on a multi-filament setup. It takes longer to print and can cost more, so the product page shows the extra cost and lead time before you add it to the cart.' },
      { t: 'h2', text: 'Painted later' },
      { t: 'p', text: 'Some single-colour parts can be painted after printing. Painted items are made to order and are quoted separately.' },
    ],
  },
  {
    slug: 'designing-for-print',
    title: 'Designing for print: wall thickness and overhangs',
    summary: 'Three simple rules that stop most failed prints before the file leaves your computer.',
    type: 'Design',
    date: '2026-10-22',
    minutes: 6,
    body: [
      { t: 'p', text: 'Sample article. The studio will replace this with its own design rules.' },
      { t: 'h2', text: 'Wall thickness' },
      { t: 'p', text: 'Thin walls break easily. Keep walls at least a few millimetres thick for functional parts, and thicker for anything that takes load.' },
      { t: 'h2', text: 'Overhangs' },
      { t: 'p', text: 'Steep overhangs need support or a different angle. Rounding the underside or splitting the part helps.' },
      { t: 'tip', text: 'Export STL or 3MF with the right size in millimetres. If the file is in the wrong unit, the print will be the wrong size.' },
    ],
  },
];
