import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = {
  title: 'File and IP terms',
  description: 'The rules for files you send us: what you must own, what we will not print, and how to report a problem.',
};

export default function FileTermsPage() {
  return (
    <InfoPage
      title="File and IP terms"
      intro="You send us your files and we print them. These terms say who owns what, and what we will not print."
      note="DRAFT. Needs legal review before the site goes live. [LAWYER/CA]"
      sections={[
        {
          heading: 'Your rights',
          paragraphs: [
            'By uploading a file you confirm that you own the design, or have written permission from the owner to have it printed. You must not upload anyone else\'s work without that permission.',
          ],
        },
        {
          heading: 'What we will not print',
          paragraphs: [
            'Licensed or trademarked characters, logos or designs without written permission. Weapons or weapon parts. Anything that is designed to bypass a lock or security device. Medical devices. Parts that are presented as food-contact.',
          ],
        },
        {
          heading: 'Our right to refuse',
          paragraphs: [
            'We may refuse or stop any order that breaks these terms, or that we think is unsafe to print. If an order is refused after payment, we refund it under our refund terms.',
          ],
        },
        {
          heading: 'Design ownership',
          paragraphs: [
            'For custom designs we model for you, the terms of ownership or licence are set out in the quote before you approve it. [LAWYER/CA] Wording to be confirmed: perpetual and worldwide ownership, or a licence limited to your order.',
          ],
        },
        {
          heading: 'How we store files',
          paragraphs: [
            'Customer files are stored privately. Only the studio team can open them, to prepare and print your order. We do not publish your files.',
          ],
        },
        {
          heading: 'Report a problem',
          paragraphs: [
            'If you believe a design on this site or a file we printed breaks someone\'s rights, contact us through the contact page. See also the grievance officer page.',
          ],
        },
      ]}
    />
  );
}
