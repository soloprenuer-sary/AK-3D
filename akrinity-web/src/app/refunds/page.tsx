import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = {
  title: 'Refund and cancellation',
  description: 'When you can cancel an order, and how refunds work for ready-made and made-to-order prints.',
};

export default function RefundsPage() {
  return (
    <InfoPage
      title="Refund and cancellation"
      intro="Cancelling is simple before we start printing. After printing starts, the rules depend on what was made."
      note="DRAFT. Refund amounts and timings need confirming. [LAWYER/CA]"
      sections={[
        {
          heading: 'Before printing starts',
          paragraphs: [
            'You can cancel a made-to-order order for a full refund, as long as printing has not started. Write to us with your order number. [Refund processing fee, if any: VERIFY]',
          ],
        },
        {
          heading: 'After printing starts',
          paragraphs: [
            'Made-to-order and personalised parts cannot be cancelled once printing has started, because they are made for you. If the part is faulty, damaged or does not match the approved quote, we reprint or refund.',
          ],
        },
        {
          heading: 'Ready-made items',
          paragraphs: ['Unused items in original packing can be returned within [X] days. See the returns page for the steps.'],
        },
        {
          heading: 'How refunds are paid',
          paragraphs: [
            'Online payments are refunded to the original payment method. Cash on delivery refunds are paid by bank transfer to an account you give us.',
          ],
        },
        {
          heading: 'When you will see it',
          paragraphs: ['Refunds are processed within [X] working days of approval. Your bank may take additional time to show it.'],
        },
      ]}
    />
  );
}
