'use client';

import { useState } from 'react';
import { SimpleForm } from '@/components/forms/SimpleForm';
import { OrderCard } from './OrderCard';
import { lookupOrder } from '@/lib/shop-client';
import type { OrderLookup } from '@/lib/shop-types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?\d{10,13}$/;

/** Find an order with its number and the email or phone it was placed with. */
export function TrackOrder() {
  const [order, setOrder] = useState<OrderLookup | null>(null);
  return (
    <>
      <div className="info-card">
        <h2>Find my order</h2>
        <SimpleForm
          id="track"
          submitLabel="Track order"
          busyLabel="Looking…"
          successNote=""
          onSubmit={async (v) => {
            setOrder(null);
            const contact = v.contact.trim();
            if (!EMAIL.test(contact) && !PHONE.test(contact.replace(/\s+/g, ''))) {
              return 'Enter the email, or the 10-digit phone number, used on the order.';
            }
            const r = await lookupOrder({ order: v.order, contact });
            if (!r.ok) return r.error;
            setOrder(r.data);
            return null;
          }}
          fields={[
            {
              name: 'order',
              label: 'Order number',
              required: true,
              placeholder: 'For example 1234',
            },
            {
              name: 'contact',
              label: 'Email or phone used on the order',
              required: true,
              autoComplete: 'email',
            },
          ]}
        />
      </div>
      {order && <OrderCard order={order} />}
    </>
  );
}
