import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = {
  title: 'Care and safety',
  description: 'How to clean and care for your prints, and what they are and are not safe for.',
};

export default function CarePage() {
  return (
    <InfoPage
      title="Care and safety"
      intro="A few simple steps keep your print looking good. Read the safety notes before you use a piece."
      note="DRAFT. Final wording needs review before the site goes live."
      image={{ src: '/images/about/materials.png', alt: 'Akrinity print materials: PLA, PETG, ABS/ASA and resin' }}
      sections={[
        {
          heading: 'Cleaning',
          paragraphs: [
            'Dust with a soft dry cloth. Wash with warm water and mild soap, then dry fully. Do not soak PLA or resin prints for long periods.',
          ],
        },
        {
          heading: 'Heat and sun',
          paragraphs: [
            'Keep PLA and resin prints out of hot cars and direct sun. For outdoor parts, choose ASA, and check the material guide first.',
          ],
        },
        {
          heading: 'Load and handling',
          paragraphs: [
            'Printed parts are strong for their purpose, not for everything. Do not hang heavy loads on decor pieces, and handle resin parts gently because they are more brittle.',
          ],
        },
        {
          heading: 'Kitchen items are not for food',
          paragraphs: [
            'Egg trays, spoon holders and knife holders are for holding objects, not food. Do not store food or drink in a printed part, and do not use it to serve food.',
          ],
        },
        {
          heading: 'Electrical and lamp parts',
          paragraphs: [
            'Lamp shades and light covers are decorative. Use only the bulb or LED size recommended in the product description, and keep any printed part away from the heat of the bulb.',
          ],
        },
      ]}
    />
  );
}
