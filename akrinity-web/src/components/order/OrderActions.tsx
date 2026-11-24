'use client';

import { useState } from 'react';
import { SimpleForm } from '@/components/forms/SimpleForm';
import { downloadInvoice, requestOrder } from '@/lib/shop-client';
import { ORDER_REASONS, type OrderLookup } from '@/lib/shop-types';

export interface OrderAccess {
  /** The order's private key (after paying) or the email/phone used (tracking page). */
  key?: string;
  contact?: string;
}

/** What an order can still do: download the GST invoice, cancel it, or send it back. */
export function orderActions(o: OrderLookup) {
  const canInvoice =
    ['in-transit', 'completed'].includes(o.status) ||
    (o.status === 'processing' && o.is_paid && o.payment_method !== 'cod');
  const canCancel = ['pending', 'on-hold', 'processing'].includes(o.status);
  const canReturn = ['in-transit', 'completed'].includes(o.status);
  return { canInvoice, canCancel, canReturn };
}

const CANCEL_REASONS = ['ordered_by_mistake', 'changed_mind', 'other'];
const RETURN_REASONS = ['faulty', 'wrong_item', 'not_as_described', 'changed_mind', 'other'];

/** Buttons under the order: download the GST invoice, cancel the order, or ask for a return. */
export function OrderActions({ order, access }: { order: OrderLookup; access: OrderAccess }) {
  const { canInvoice, canCancel, canReturn } = orderActions(order);
  const [open, setOpen] = useState(false);
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [sentRef, setSentRef] = useState<string | null>(null);

  if (!canInvoice && !canCancel && !canReturn) return null;

  const type: 'cancel' | 'return' = canCancel ? 'cancel' : 'return';
  const codes = type === 'cancel' ? CANCEL_REASONS : RETURN_REASONS;
  const reasons = ORDER_REASONS.filter((r) => codes.includes(r.code));
  const who = { order: String(order.number), key: access.key, contact: access.contact };

  const onInvoice = async () => {
    setInvoiceBusy(true);
    setInvoiceError('');
    const error = await downloadInvoice(who);
    setInvoiceBusy(false);
    if (error) setInvoiceError(error);
  };

  return (
    <div className="order-actions">
      <div className="btn-row">
        {canInvoice && (
          <button
            type="button"
            className="btn"
            onClick={onInvoice}
            disabled={invoiceBusy}
            aria-busy={invoiceBusy}
          >
            {invoiceBusy ? 'Preparing…' : 'Download GST invoice (PDF)'}
          </button>
        )}
        {(canCancel || canReturn) && sentRef === null && (
          <button
            type="button"
            className="btn"
            aria-expanded={open}
            aria-controls={`order-request-${order.id}`}
            onClick={() => setOpen((v) => !v)}
          >
            {type === 'cancel' ? 'Cancel this order' : 'Request a return'}
          </button>
        )}
      </div>
      {invoiceError && (
        <p className="err" role="alert">
          {invoiceError}
        </p>
      )}

      {sentRef !== null && (
        <p className="ok" role="status">
          Request sent{sentRef ? ` (${sentRef})` : ''}. We have emailed you a copy and will reply
          soon. Nothing is cancelled or refunded until we confirm.
        </p>
      )}

      {open && sentRef === null && (
        <div id={`order-request-${order.id}`} className="info-card">
          <h3>
            {type === 'cancel' ? 'Cancel order' : 'Return'} #{order.number}
          </h3>
          <p className="meta">
            {type === 'cancel'
              ? 'We can cancel it while it has not shipped. We confirm by email.'
              : 'You can ask for a return within 7 days of delivery. Made-to-order and personalised items are returned only when faulty.'}{' '}
            {order.payment_method === 'cod'
              ? type === 'cancel'
                ? 'You chose cash on delivery, so there is nothing to refund.'
                : 'You paid cash on delivery, so we will email you to arrange the refund. Never send us card or bank details here.'
              : 'If you have paid, we refund to the same payment method. Never send us card or bank details here.'}
          </p>
          <SimpleForm
            id={`order-request-${order.id}`}
            submitLabel={type === 'cancel' ? 'Send cancel request' : 'Send return request'}
            busyLabel="Sending…"
            successNote=""
            onSubmit={async (v) => {
              const reason = reasons.find((r) => r.label === v.reason)?.code ?? 'other';
              const r = await requestOrder({
                ...who,
                type,
                reason,
                note: v.note,
                website: v.website,
              });
              if (!r.ok) return r.error;
              setSentRef(r.data.reference ?? '');
              return null;
            }}
            fields={[
              {
                name: 'reason',
                label: 'Reason',
                type: 'select',
                options: reasons.map((r) => r.label),
                required: true,
              },
              {
                name: 'note',
                label: 'Anything we should know',
                type: 'textarea',
                placeholder: 'For example which part is damaged',
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
