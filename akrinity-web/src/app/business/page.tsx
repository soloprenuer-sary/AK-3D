import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { SimpleForm } from '@/components/forms/SimpleForm';

export const metadata: Metadata = {
  title: 'Business and bulk orders',
  description: 'Bulk prints, branded pieces and GST invoices for businesses.',
};

export default function Business() {
  return (
    <InfoPage
      title="Business and bulk orders"
      intro="Repeat batches, branded pieces, gifts and spare parts for your business, with a GST invoice for every order."
      note="Bulk pricing tiers and lead times are placeholders until they are confirmed."
      sections={[
        { heading: 'Bulk of ready-made items', paragraphs: ['Price tiers for 10, 50 and 100+ pieces. Stocked items ship fast; larger counts are made to order.'] },
        { heading: 'Custom batches', paragraphs: ['Send your file with a quantity. We quote the batch, print a sample first if you want one, then run the rest.'] },
        { heading: 'GST invoices', paragraphs: ['Add your company name and GSTIN and we issue a GST invoice with every order. Tax rates are confirmed by the studio CA.'] },
        { heading: 'Payment', paragraphs: ['Larger jobs start with an advance and the balance is due before dispatch.'] },
      ]}
    >
      <div className="info-card">
        <h2>Tell us what you need</h2>
        <SimpleForm
          id="business"
          submitLabel="Request a bulk quote"
          successNote="Looks good. Bulk requests are not connected yet, so nothing was sent. For now, use the quote page or WhatsApp."
          note="We reply within [X] working days. Have a 3D file? Use the quote page and mention the quantity."
          fields={[
            { name: 'company', label: 'Company name', required: true, half: true },
            { name: 'gstin', label: 'GSTIN', rule: 'gstin', half: true },
            { name: 'name', label: 'Contact name', required: true, half: true, autoComplete: 'name' },
            { name: 'phone', label: 'WhatsApp or phone', required: true, rule: 'phone', half: true, type: 'tel', autoComplete: 'tel' },
            { name: 'email', label: 'Email', rule: 'email', half: true, type: 'email', autoComplete: 'email' },
            { name: 'kind', label: 'What do you need?', type: 'select', half: true, options: ['Bulk of ready-made items', 'Custom batch from my file', 'Branded or promotional pieces', 'Something else'], required: true },
            { name: 'qty', label: 'Approximate quantity', type: 'number', half: true },
            { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Products, sizes, colours, deadline' },
          ]}
        />
      </div>
    </InfoPage>
  );
}
