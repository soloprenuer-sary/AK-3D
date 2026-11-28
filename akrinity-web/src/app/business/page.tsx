import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { BusinessForm } from '@/components/forms/BusinessForm';
import { getListProducts } from '@/lib/catalogue';

/** Refreshed in the background, so new products can be named in the form without a deploy. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Business and bulk orders',
  description: 'Bulk prints, branded pieces and GST invoices for businesses.',
};

export default async function Business() {
  const products = await getListProducts();
  return (
    <InfoPage
      title="Business and bulk orders"
      intro="Repeat batches, branded pieces, gifts and spare parts for your business, with a GST invoice for every order."
      note="Bulk prices are confirmed in your quote."
      image={{ src: '/images/about/slide-printer.png', alt: 'An Akrinity printer building a part one thin layer at a time' }}
      sections={[
        {
          heading: 'Bulk of ready-made items',
          paragraphs: [
            'Price tiers for larger counts are shown on each product page. Stocked items ship fast; larger counts are made to order.',
          ],
        },
        {
          heading: 'Custom batches',
          paragraphs: [
            'Send your file with a quantity. We quote the batch, print a sample first if you want one, then run the rest.',
          ],
        },
        {
          heading: 'GST invoices',
          paragraphs: [
            'Add your company name and GSTIN and we issue a GST invoice with every order. Tax rates are confirmed by the studio CA.',
          ],
        },
        {
          heading: 'Payment',
          paragraphs: ['Larger jobs start with an advance and the balance is due before dispatch.'],
        },
      ]}
    >
      <div className="info-card">
        <h2>Tell us what you need</h2>
        <BusinessForm products={products} />
      </div>
    </InfoPage>
  );
}
