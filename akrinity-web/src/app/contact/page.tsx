import { Suspense } from 'react';
import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { ContactForm } from '@/components/forms/ContactForm';
import { MumbaiMap } from '@/components/layout/MumbaiMap';
import { site } from '@/lib/site-config';

export const metadata: Metadata = { title: 'Contact', description: 'Reach the Akrinity studio.' };

export default function Contact() {
  const sections = [
    ...(site.whatsappText
      ? [
          {
            heading: 'WhatsApp',
            paragraphs: [
              site.whatsappText,
              ...(site.replyHours > 0
                ? [`Usual reply time: within ${site.replyHours} hours, on working days.`]
                : []),
            ],
          },
        ]
      : []),
    ...(site.supportEmail ? [{ heading: 'Email', paragraphs: [site.supportEmail] }] : []),
    { heading: 'Studio', paragraphs: ['Mumbai, India.'] },
    {
      heading: 'Custom work',
      paragraphs: [
        'For custom prints, use the quote form so we have your file and your details in one place.',
      ],
    },
  ];
  return (
    <InfoPage
      title="Contact"
      intro={`Questions about an order, a custom print or a design? Send us a message below${site.whatsappText ? ', or reach the studio on WhatsApp' : ''}${site.supportEmail ? ' or by email' : ''}.`}
      sections={sections}
    >
      <div className="info-card">
        <h2>Send us a message</h2>
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </div>
      <MumbaiMap />
    </InfoPage>
  );
}
