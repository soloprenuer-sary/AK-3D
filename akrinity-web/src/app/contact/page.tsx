import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { SimpleForm } from '@/components/forms/SimpleForm';

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
    >
      <div className="info-card">
        <h2>Send us a message</h2>
        <SimpleForm
          id="contact"
          submitLabel="Send message"
          successNote="Looks good. Messages are not connected yet, so nothing was sent. For now, use WhatsApp or email."
          note="We reply within [X] hours. For a custom print, use the quote form instead."
          fields={[
            { name: 'name', label: 'Name', required: true, half: true, autoComplete: 'name' },
            { name: 'phone', label: 'WhatsApp or phone', required: true, rule: 'phone', half: true, type: 'tel', autoComplete: 'tel' },
            { name: 'email', label: 'Email', rule: 'email', half: true, type: 'email', autoComplete: 'email' },
            { name: 'topic', label: 'Topic', type: 'select', half: true, options: ['Order question', 'Custom print', 'Design help', 'Something else'], required: true },
            { name: 'order', label: 'Order number', half: true, placeholder: 'For example #1234' },
            { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'How can we help?' },
          ]}
        />
      </div>
    </InfoPage>
  );
}
