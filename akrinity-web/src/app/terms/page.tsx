import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/layout/LegalPage';

export const metadata: Metadata = {
  title: 'Terms and conditions',
  description: 'Terms for orders, payment, custom work and the files you send to Akrinity.',
};

const NEEDED = [
  'Legal name of the business, registered address and GSTIN',
  "Which city's courts have jurisdiction for disputes",
  'Order confirmation rules: when an order is accepted and who can cancel it',
  'Payment options offered and the cash-on-delivery limits (the sample says: not for made-to-order or personalised items)',
  'Delivery areas, delivery times and who pays shipping',
  'Cancellation, return and refund windows and charges (the sample points to the returns and refunds pages)',
  'Warranty terms, if any',
  'The limit on our liability for a faulty or late order',
  'Rules for files customers upload (the sample bans licensed characters, weapons and unsafe items)',
  'Rules for corporate and bulk orders (advance payment, GST invoice, lead time)',
  'How customers can contact us and how long we take to reply',
];

const SECTIONS: LegalSection[] = [
  {
    id: 'about',
    heading: 'About these terms',
    body: [
      'These terms apply to everything you buy from [[LEGAL ENTITY NAME]] ("Akrinity", "we", "us") through akrinity.in. By placing an order or creating an account you agree to them. If you do not agree, please do not order.',
      'Our registered address is [[REGISTERED ADDRESS]], Mumbai, India. GSTIN: [[GSTIN]].',
    ],
  },
  {
    id: 'orders',
    heading: 'Orders',
    body: [
      'When you place an order we email you a confirmation. That email only confirms we received your order. An order is accepted when we confirm it for printing or dispatch.',
      'We may refuse or cancel an order, for example if a price or description is wrong, an item cannot be made as described, or we suspect fraud. If that happens we refund anything you have paid.',
      'You can order as a guest or with an account. Please give correct contact and delivery details. We are not responsible for a late or failed delivery caused by wrong details.',
    ],
  },
  {
    id: 'prices',
    heading: 'Prices and payment',
    body: [
      'Prices are in Indian rupees and include GST unless the page says otherwise. [[CONFIRM]] Shipping, if any, is shown before you pay.',
      'You can pay by [[PAYMENT OPTIONS]]. Cash on delivery is available only for ready-made items in stock. It is not available for made-to-order, personalised or painted items.',
      'Bulk prices on a product page are for information. To buy at a bulk price, send a {{/business|bulk quote request}} and we confirm the price in writing.',
    ],
  },
  {
    id: 'made-to-order',
    heading: 'Made-to-order, personalised and painted items',
    body: [
      'Items marked "Made to order" are printed after you order, so they take longer. The product page shows the expected time. [[LEAD TIME]]',
      'Personalised items (for example name plates) are made from the text you type, exactly as typed. Please check the spelling before you pay. They cannot be returned unless faulty. Painted items are made to order and priced separately.',
    ],
  },
  {
    id: 'custom',
    heading: 'Custom printing and quotes',
    body: [
      'For custom work we send a quote. A quote is valid for [[NUMBER]] days. Work starts after you approve it and pay [[ADVANCE, IF ANY]].',
      'Printed parts can differ a little from the preview in colour, surface and size. We tell you before printing if we expect a problem with your file. See {{/how-we-print|how we print}} and the {{/materials|materials}} page.',
    ],
  },
  {
    id: 'files',
    heading: 'Files you send us',
    body: [
      "You confirm that you own the file or have the right to have it printed, and that printing it does not break anyone's rights.",
      [
        'We do not print licensed or copyrighted characters or logos without proof of permission.',
        'We do not print weapons or weapon parts, or items we consider unsafe or illegal.',
        'We may refuse or stop a job for these reasons and refund what you paid for the part not yet made.',
      ],
      'See the {{/terms/files|file terms}} for how we store and delete your files.',
    ],
  },
  {
    id: 'shipping',
    heading: 'Shipping and delivery',
    body: [
      'We ship across India through courier partners. Delivery times shown are estimates, not promises. [[DELIVERY AREAS AND TIMES]] See {{/shipping|shipping}} for details.',
      'Risk in the goods passes to you on delivery. Please check the parcel when it arrives and tell us within [[NUMBER]] days if something is damaged.',
    ],
  },
  {
    id: 'returns',
    heading: 'Cancellations, returns and refunds',
    body: [
      'You can cancel an order before we start printing it. Once printing has started, cancellation charges may apply. See {{/refunds|refunds and cancellation}}.',
      'If an item arrives faulty or not as described, tell us within [[NUMBER]] days and we will repair, replace or refund it. See {{/returns|returns and warranty}}.',
    ],
  },
  {
    id: 'use',
    heading: 'Using the products safely',
    body: [
      'Read the {{/care|care and safety}} page. Printed items have limits on heat, load and use. For example, kitchen pieces are for holding utensils and are not for food contact, lamps are decorative and must be used with the bulb size shown, and items are not toys unless we say so.',
    ],
  },
  {
    id: 'ip',
    heading: 'Our designs and this website',
    body: [
      'The Akrinity designs, photos, text and drawings on this site belong to us or are used with permission. Please do not copy, resell or republish them without asking. Buying a printed item does not give you the right to copy the design.',
    ],
  },
  {
    id: 'accounts',
    heading: 'Your account',
    body: [
      'Keep your password private. You are responsible for what happens under your account. Tell us at once if you think someone else has used it. We may close an account that is used to abuse the shop or break these terms.',
      'How we handle your information is explained in the {{/privacy|privacy policy}}.',
    ],
  },
  {
    id: 'liability',
    heading: 'Our responsibility',
    body: [
      '[[LAWYER TO WRITE]] Sample wording: we are responsible for goods that are faulty or not as described, as set out in these terms and the law. Beyond that, we are not liable for indirect or consequential loss, or for loss caused by events we cannot control. Nothing in these terms limits rights you have under Indian consumer law that cannot be limited.',
    ],
  },
  {
    id: 'law',
    heading: 'Governing law and disputes',
    body: [
      'These terms are governed by the laws of India. Courts in [[CITY]] have jurisdiction, subject to your rights under consumer law. Please contact us first at {{/contact|contact}} and we will try to resolve the issue. You can also use our {{/grievance|grievance process}}.',
    ],
  },
  {
    id: 'changes',
    heading: 'Changes and contact',
    body: [
      'We may update these terms. The version that applies to your order is the one on the site when you placed it. The "last updated" date at the top shows the latest version.',
      'Questions: [[CONTACT EMAIL]] or [[PHONE]].',
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms and conditions"
      intro="The rules for buying from Akrinity: orders, payment, custom work and the files you send us."
      needed={NEEDED}
      sections={SECTIONS}
    />
  );
}
