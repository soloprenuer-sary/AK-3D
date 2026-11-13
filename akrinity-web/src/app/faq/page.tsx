import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'FAQ', description: 'Common questions about orders, colours and printing.' };

export default function Faq() {
  return (
    <InfoPage
      title="Questions, answered"
      intro="The questions we get most often. If yours is not here, message the studio."
      note="Answers are drafts. Figures in brackets are placeholders."
      sections={[
        { heading: 'Can I choose single or multi-colour?', paragraphs: ['Some products offer both. Multi-colour takes longer and may cost more, and we confirm the extra cost before payment.'] },
        { heading: 'Can I buy a single-colour product and paint it later?', paragraphs: ['On a few products yes. Painting is made to order and quoted separately.'] },
        { heading: 'Is the kitchen range safe for food?', paragraphs: ['The kitchen range is for non-food-contact use only, such as egg trays and spoon or knife holders. Do not store food in them.'] },
        { heading: 'Can I order something made to order by cash on delivery?', paragraphs: ['No. Made-to-order and personalised items are paid online, with an advance where the order is larger.'] },
        { heading: 'How long does printing take?', paragraphs: ['Each product shows its lead time. Made-to-order items are ready in [X] working days.'] },
      ]}
    />
  );
}
