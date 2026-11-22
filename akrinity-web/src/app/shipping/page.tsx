import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { site } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Shipping',
  description: 'Shipping times, rates and tracking.',
};

export default function Shipping() {
  return (
    <InfoPage
      title="Shipping"
      intro="We ship across India with tracked delivery. Rates are shown at checkout after you enter your pincode."
      sections={[
        {
          heading: 'Delivery',
          paragraphs: [
            'Tracked delivery across India. Your tracking link is sent when the parcel leaves the studio.',
          ],
        },
        ...(site.freeShippingFrom > 0
          ? [
              {
                heading: 'Free shipping',
                paragraphs: [
                  `Free shipping above ₹${site.freeShippingFrom.toLocaleString('en-IN')} in the cart.`,
                ],
              },
            ]
          : []),
        {
          heading: 'Made-to-order items',
          paragraphs: [
            'Lead time is shown on the product page. The shipping clock starts after the advance clears and the print is checked.',
          ],
        },
        {
          heading: 'Parcel checks',
          paragraphs: [
            'We weigh and photograph each parcel, so courier weight disputes can be answered quickly.',
          ],
        },
      ]}
    />
  );
}
