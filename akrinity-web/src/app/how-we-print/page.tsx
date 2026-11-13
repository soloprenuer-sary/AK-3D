import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = {
  title: 'How we print',
  description: 'The print processes, materials and checks behind every Akrinity part.',
};

export default function HowWePrint() {
  return (
    <InfoPage
      title="How we print"
      intro="Every part is printed in the studio in Mumbai, checked by hand and packed to arrive in one piece."
      note="Process details are a draft until the studio confirms them."
      sections={[
        { heading: 'FDM, single colour', paragraphs: ['Filament is melted and laid down one thin layer at a time. The quickest and most economical option, in PLA+, PETG or ABS and ASA.'] },
        { heading: 'FDM, multi-colour', paragraphs: ['Several filaments in one print, for names, logos and colour blocks. It takes longer and may cost more; we confirm both before you pay.'] },
        { heading: 'Resin', paragraphs: ['Liquid resin cured by light, for fine detail: miniatures, busts and small precise parts. Made to order.'] },
        { heading: 'Finishing and painting', paragraphs: ['Supports are removed and surfaces cleaned. Painting is quoted separately and made to order. [DECIDE: is painting offered at launch]'] },
        { heading: 'Quality check', paragraphs: ['Each part is checked for layer adhesion, dimensions and surface finish before packing. Failed prints are reprinted, not sent.'] },
        { heading: 'Original designs only', paragraphs: ['We print our own designs and files you own. Parts from other designers need proof of licence, and we do not print licensed characters without written permission.'] },
      ]}
    />
  );
}
