import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Terms of sale', description: 'Terms for orders, payment and custom work.' };

export default function Terms() {
  return (
    <InfoPage
      title="Terms of sale"
      intro="The rules for buying from Akrinity: orders, payment, custom work and the files you send us."
      note="DRAFT. Final wording needs legal review before the site goes live."
      sections={[
        { heading: 'Orders and payment', paragraphs: ['An order is confirmed when payment is received. Made-to-order items may need an advance first.'] },
        { heading: 'Custom work and files', paragraphs: ['You confirm you own the file or have the right to print it. We do not print licensed characters or items we consider unsafe.'] },
        { heading: 'Prices', paragraphs: ['Prices include GST. Multi-colour and painting costs are shown before you pay.'] },
        { heading: 'Cancellations', paragraphs: ['Cancellation charges are shown before payment and depend on how far the print has progressed.'] },
      ]}
    />
  );
}
