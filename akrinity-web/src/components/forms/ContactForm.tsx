'use client';

import { useState } from 'react';
import { SimpleForm } from './SimpleForm';
import { sendContact } from '@/lib/auth-client';

/** The contact page form. Messages are saved in WordPress under Quote requests and emailed to the studio. */
export function ContactForm() {
  const [reference, setReference] = useState('');
  return (
    <SimpleForm
      id="contact"
      submitLabel="Send message"
      busyLabel="Sending…"
      successNote={
        'Thank you. We have your message' +
        (reference ? ' (' + reference + ')' : '') +
        ' and will reply soon.'
      }
      note="For a custom print, use the quote form instead so we get your file."
      onSubmit={async (v) => {
        const r = await sendContact(v);
        if (!r.error) setReference(r.reference);
        return r.error;
      }}
      fields={[
        { name: 'name', label: 'Name', required: true, half: true, autoComplete: 'name' },
        {
          name: 'phone',
          label: 'WhatsApp or phone',
          required: true,
          rule: 'phone',
          half: true,
          type: 'tel',
          autoComplete: 'tel',
        },
        {
          name: 'email',
          label: 'Email',
          rule: 'email',
          half: true,
          type: 'email',
          autoComplete: 'email',
        },
        {
          name: 'topic',
          label: 'Topic',
          type: 'select',
          half: true,
          options: ['Order question', 'Custom print', 'Design help', 'Something else'],
          required: true,
        },
        { name: 'order', label: 'Order number', half: true, placeholder: 'For example #1234' },
        {
          name: 'message',
          label: 'Message',
          type: 'textarea',
          required: true,
          placeholder: 'How can we help?',
        },
      ]}
    />
  );
}
