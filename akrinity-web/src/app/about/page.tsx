import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'About', description: 'Who makes Akrinity prints, and how we work.' };

export default function About() {
  return (
    <InfoPage
      title="About Akrinity"
      intro="Akrinity is a 3D printing studio in Mumbai. We print ready-made products, custom parts from your own file, and designs we make from a sketch or an idea."
      note="Studio story and photos to be written by the studio."
      sections={[
        { heading: 'What we make', paragraphs: ['Home decor, desk organisers, kitchen pieces that are not for food contact, figurines, gifts, and spare parts.', 'Custom prints from your own 3D file, and design-and-print from a sketch or photo.'] },
        { heading: 'How we work', paragraphs: ['Every part is checked before it leaves the studio. Made-to-order parts are printed after you order, so we tell you the lead time first.'] },
        { heading: 'Materials', paragraphs: ['PLA and PLA+, PETG, ABS and ASA, and resin. The knowledge hub explains when to pick each one.'] },
      ]}
    />
  );
}
