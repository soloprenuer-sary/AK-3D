/**
 * Common questions, shown as an accordion on the knowledge hub. Answers are drafts: bracketed values
 * are placeholders and the shipping, return and lead-time facts are VERIFY until the owner confirms them.
 */
export interface FaqItem {
  q: string;
  a: string;
  /** Page with the full detail, shown as a link under the answer. */
  more?: { href: string; label: string };
}

export const FAQ: FaqItem[] = [
  {
    q: 'Can I choose single or multi-colour?',
    a: 'Some products offer both. Multi-colour takes longer and may cost more, and we confirm the extra cost before payment.',
  },
  {
    q: 'Can I buy a single-colour product and paint it later?',
    a: 'On a few products yes. Painting is made to order and quoted separately.',
  },
  {
    q: 'Is the kitchen range safe for food?',
    a: 'The kitchen range is for non-food-contact use only, such as egg trays and spoon or knife holders. Do not store food in them.',
    more: { href: '/care', label: 'Care and safety' },
  },
  {
    q: 'Can I order a made-to-order item by cash on delivery?',
    a: 'No. Made-to-order and personalised items are paid online, with an advance where the order is larger.',
    more: { href: '/terms', label: 'Terms and conditions' },
  },
  {
    q: 'How long does printing take?',
    a: 'Each product shows its lead time. Made-to-order items are ready in [X] working days.',
    more: { href: '/shipping', label: 'Shipping' },
  },
  {
    q: 'Can I send my own 3D file?',
    a: 'Yes. Upload an STL, 3MF, OBJ, STEP or IGES file with a quote request, pick a material, and we reply with a price and lead time.',
    more: { href: '/quote', label: 'Request a quote' },
  },
  {
    q: 'Do you offer bulk or business pricing?',
    a: 'Yes. Where a product has bulk prices they are shown on its page. Send a bulk quote request and we confirm the price and give a GST invoice.',
    more: { href: '/business', label: 'Business and bulk' },
  },
  {
    q: 'What if my order arrives damaged or wrong?',
    a: 'Tell us within [X] days with a photo and we will repair, replace or refund it.',
    more: { href: '/returns', label: 'Returns and warranty' },
  },
];
