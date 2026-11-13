import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Returns and warranty', description: 'Returns, refunds and warranty for Akrinity prints.' };

export default function Returns() {
  return (
    <InfoPage
      title="Returns and warranty"
      intro="If something arrives damaged, wrong or faulty, we make it right. Here is how it works."
      note="DRAFT. Final wording needs legal review before the site goes live."
      sections={[
        { heading: 'Ready-made items', paragraphs: ['Return window: [X] days from delivery, for items unused and in original packing.'] },
        { heading: 'Made-to-order and personalised items', paragraphs: ['Not returnable for change of mind. If the part is faulty, damaged in transit, or differs from the approved quote, we reprint or refund.'] },
        { heading: 'Damage and faults', paragraphs: ['Send photos within [X] days of delivery. We respond within [X] working days.'] },
        { heading: 'Warranty', paragraphs: ['Printing faults are covered for [X] days. Normal wear and misuse are not covered.'] },
      ]}
    />
  );
}
