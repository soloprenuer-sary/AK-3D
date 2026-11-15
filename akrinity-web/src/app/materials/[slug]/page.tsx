import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InfoPage } from '@/components/layout/InfoPage';
import { MATERIAL_GUIDES, findMaterial } from '@/lib/materials-data';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return MATERIAL_GUIDES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const m = findMaterial(slug);
  return { title: m ? m.name : 'Material', description: m?.short };
}

export default async function MaterialPage({ params }: Params) {
  const { slug } = await params;
  const m = findMaterial(slug);
  if (!m) notFound();
  return (
    <InfoPage
      title={m.name}
      intro={m.intro}
      sections={[
        { heading: 'Good for', paragraphs: m.goodFor },
        { heading: 'Less suited to', paragraphs: m.lessSuited },
        { heading: 'Finish and detail', paragraphs: m.finish },
        {
          heading: 'Food contact',
          paragraphs: ['Our prints are not for food contact, whatever the material. Do not use printed parts to store or serve food.'],
        },
      ]}
    />
  );
}
