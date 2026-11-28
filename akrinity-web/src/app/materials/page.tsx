import type { Metadata } from 'next';
import Link from 'next/link';
import { InfoPage } from '@/components/layout/InfoPage';
import { MATERIAL_GUIDES } from '@/lib/materials-data';

export const metadata: Metadata = {
  title: 'Materials',
  description: 'PLA, PETG, ABS and ASA, and resin: what each one is good for, and when to pick it.',
};

export default function MaterialsIndex() {
  return (
    <InfoPage
      title="Materials"
      intro="Each material behaves differently. Pick by where the part will live: indoors, in the sun, under load, or where fine detail matters."
      image={{ src: '/images/about/materials.png', alt: 'Akrinity print materials: PLA, PETG, ABS/ASA and resin' }}
      sections={[
        {
          heading: 'Not sure? Start here',
          paragraphs: [
            'For decor and everyday objects, PLA+ is the usual choice. For parts that face heat, impact or sunlight, use PETG or ASA. For small, detailed pieces, use resin.',
          ],
        },
      ]}
    >
      <div className="cat-grid">
        {MATERIAL_GUIDES.map((m) => (
          <Link key={m.slug} href={`/materials/${m.slug}`} className="info-card" style={{ textDecoration: 'none' }}>
            <h2>{m.name}</h2>
            <p className="muted">{m.short}</p>
            <span style={{ fontWeight: 700, marginTop: 'auto' }}>Read the guide →</span>
          </Link>
        ))}
      </div>
    </InfoPage>
  );
}
