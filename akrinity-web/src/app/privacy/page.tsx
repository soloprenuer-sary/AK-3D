import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Privacy', description: 'How Akrinity handles your personal data and files.' };

export default function Privacy() {
  return (
    <InfoPage
      title="Privacy"
      intro="What we collect, why, and what you can ask us to do with it."
      note="DRAFT. Final wording needs legal review (DPDP Act) before the site goes live."
      sections={[
        { heading: 'What we collect', paragraphs: ['Contact details you give us, order details, and files you upload for a quote or order.'] },
        { heading: 'Your files', paragraphs: ['Uploaded 3D files are private. Only you and the studio can open them, and they are deleted on the schedule in the file terms.'] },
        { heading: 'Consent', paragraphs: ['We ask before we send marketing messages, and you can stop at any time.'] },
        { heading: 'Your rights', paragraphs: ['You can ask to see, correct or delete your data. Write to the grievance contact on the contact page.'] },
      ]}
    />
  );
}
