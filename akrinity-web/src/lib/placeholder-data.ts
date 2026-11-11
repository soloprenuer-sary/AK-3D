/**
 * Placeholder content for the home page, taken from the approved design. Replace with WordPress
 * data (WPGraphQL and ACF fields) when the backend is connected. Bracketed text is not real.
 */
export const stats = [
  { value: '4', label: 'Material families' },
  { value: 'Pan-India', label: 'Tracked shipping' },
  { value: 'GST', label: 'Invoices for business' },
  { value: '[X] hrs', label: 'Quote reply time' },
];

export const categories = [
  { name: 'Home decor', background: 'var(--accent)', color: 'var(--ink)' },
  { name: 'Desk and gadgets', background: 'var(--violet)', color: 'var(--white)' },
  { name: 'Figurines and miniatures', background: 'var(--orange)', color: 'var(--ink)' },
  { name: 'Gifts and personalized', background: 'var(--ink)', color: 'var(--paper)' },
];

export const bestSellers = [
  { name: '[Product name]', price: '₹[price]', inStock: true },
  { name: '[Product name]', price: '₹[price]', inStock: false },
  { name: '[Product name]', price: '₹[price]', inStock: true },
  { name: '[Product name]', price: '₹[price]', inStock: false },
];

export const processSteps = [
  { title: 'Upload', body: 'Send your 3D file or a sketch, and pick material and quantity.' },
  { title: 'Quote', body: 'We reply with a price and lead time.' },
  {
    title: 'Approve and pay',
    body: 'Larger jobs start with an advance. The balance is due before dispatch.',
  },
  { title: 'Print and check', body: 'We print your part and inspect it.' },
  { title: 'Ship', body: 'Tracked delivery, with a GST invoice if you need one.' },
];

export const materials = [
  {
    name: 'PLA / PLA+',
    background: 'var(--accent)',
    color: 'var(--ink)',
    body: 'Decor, display pieces, prototypes and everyday objects. Easy to print, clean surface detail, wide colour range.',
  },
  {
    name: 'PETG / ABS / ASA',
    background: 'var(--violet)',
    color: 'var(--white)',
    body: 'Tougher parts that face heat, impact or sunlight. ASA is the choice for outdoor use.',
  },
  {
    name: 'Resin',
    background: 'var(--orange)',
    color: 'var(--ink)',
    body: 'Fine detail and smooth finish: miniatures, jewellery models and small precise parts.',
  },
];

export const work = [1, 2, 3, 4].map((n) => ({
  id: n,
  name: '[Project name]',
  meta: '[Material] · [Qty]',
}));
