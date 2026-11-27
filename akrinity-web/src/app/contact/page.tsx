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
    {
      heading: 'What to send with your message',
      paragraphs: ['A short message is fastest. These details help us answer in one reply:'],
      items: [
        'Your order number, if the message is about an order',
        'The product name or a link to the product page',
        'Photos of the part, if something arrived damaged',
        'The size, colour or material you want, for a custom request',
      ],
    },
    {
      heading: 'Common questions',
      paragraphs: [
        'Many answers are already on the site. Check these first, they open in a few seconds:',
      ],
      items: [
        'Order status: Track an order, with your order number and email or phone',
        'Cancel or return: from the order page, within the time shown on it',
        'Shipping and delivery: the Shipping page explains dispatch and tracking',
        'Materials: the knowledge hub explains PLA, PETG, ABS, ASA and resin',
      ],
    },
  ];
  return (
    <InfoPage
      title="Contact"
      heroImage={{
        src: '/images/about/process.png',
        alt: 'Four steps from check to print to finish to ship',
        caption: 'Every message goes to the studio, which replies by email or WhatsApp.',
      }}
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
