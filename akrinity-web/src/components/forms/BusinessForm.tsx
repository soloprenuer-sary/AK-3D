'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SimpleForm } from './SimpleForm';
import { sendBusinessRequest } from '@/lib/auth-client';
import { useLiveProducts } from '@/lib/live-catalogue';
import { productSlug, type ShopProduct } from '@/lib/shop-data';

/**
 * The bulk quote form. When it is opened from a product page (?product=slug) that product is shown
 * at the top as a link with a small red X, so the customer can remove it if the request is general.
 */
function BusinessFormInner({ products }: { products: ShopProduct[] }) {
  const params = useSearchParams();
  const wanted = params.get('product') ?? '';
  const live = useLiveProducts(products);
  const found = wanted ? live.find((p) => productSlug(p) === wanted) : undefined;
  const [removed, setRemoved] = useState(false);
  const [reference, setReference] = useState('');
  const product = removed ? undefined : found;

  const lead = product ? (
    <div className="product-chip">
      <span className="muted">For</span>
      <Link href={`/product/${productSlug(product)}`}>{product.name}</Link>
      <button
        type="button"
        className="chip-x"
        aria-label={`Remove ${product.name} from this request`}
        title="Remove this product"
        onClick={() => setRemoved(true)}
      >
        ×
      </button>
    </div>
  ) : null;

  return (
    <SimpleForm
      id="business"
      lead={lead}
      submitLabel="Request a bulk quote"
      busyLabel="Sending your request…"
      successNote={
        'Thank you. We received your request' +
        (reference ? ' (' + reference + ')' : '') +
        ' and emailed you a copy. We will reply with a quote.'
      }
      note="We will email you the quote. Have a 3D file? Use the quote page and mention the quantity."
      onSubmit={async (v) => {
        const r = await sendBusinessRequest({ ...v, product: product ? productSlug(product) : '' });
        if (!r.error) setReference(r.reference);
        return r.error;
      }}
      fields={[
        {
          name: 'company',
          label: 'Company name',
          required: true,
          half: true,
          autoComplete: 'organization',
        },
        { name: 'gstin', label: 'GSTIN', rule: 'gstin', half: true },
        { name: 'name', label: 'Contact name', required: true, half: true, autoComplete: 'name' },
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
          required: true,
          rule: 'email',
          half: true,
          type: 'email',
          autoComplete: 'email',
        },
        {
          name: 'need',
          label: 'What do you need?',
          type: 'select',
          half: true,
          required: true,
          options: [
            'Bulk of ready-made items',
            'Custom batch from my file',
            'Branded or promotional pieces',
            'Something else',
          ],
        },
        { name: 'quantity', label: 'Approximate quantity', type: 'number', half: true },
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          placeholder: 'Products, sizes, colours, deadline',
        },
      ]}
    />
  );
}

export function BusinessForm({ products }: { products: ShopProduct[] }) {
  return (
    <Suspense fallback={<div className="info-card">Loading the form…</div>}>
      <BusinessFormInner products={products} />
    </Suspense>
  );
}
