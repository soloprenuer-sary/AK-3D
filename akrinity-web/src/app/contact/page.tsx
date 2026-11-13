import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Contact', description: 'Reach the Akrinity studio.' };

export default function Contact() {
  return (
    <InfoPage
      title="Contact"
      intro="Questions about an order, a custom print or a design? Reach the studio on WhatsApp or by email."
      note="Contact details below are placeholders until they are confirmed."
      sections={[
        { heading: 'WhatsApp', paragraphs: ['[WhatsApp number]', 'Usual reply time: within [X] hours, on working days.'] },
        { heading: 'Email', paragraphs: ['[support email]'] },
        { heading: 'Studio', paragraphs: ['Mumbai, India.'] },
        { heading: 'Custom work', paragraphs: ['For custom prints, use the quote form so we have your file and your details in one place.'] },
      ]}
    />
  );
}
