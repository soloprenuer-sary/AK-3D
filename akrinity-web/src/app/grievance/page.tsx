import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = {
  title: 'Grievance officer',
  description: 'Who to contact about a complaint, and how quickly we respond.',
};

export default function GrievancePage() {
  return (
    <InfoPage
      title="Grievance officer"
      intro="If something has gone wrong and we have not put it right, contact our grievance officer. We take every complaint seriously."
      note="DRAFT. The officer's details are placeholders until the owner confirms them. [LAWYER/CA]"
      sections={[
        {
          heading: 'Grievance officer',
          paragraphs: ['Name: [Grievance officer name]', 'Email: [grievance email]', 'Address: [studio address]'],
        },
        {
          heading: 'What happens next',
          paragraphs: [
            'We acknowledge your complaint within 48 hours of receiving it. We aim to resolve it within one month and tell you the outcome in writing.',
          ],
        },
        {
          heading: 'What to include',
          paragraphs: ['Your name, order number if you have one, what happened, and what you would like us to do.'],
        },
      ]}
    />
  );
}
