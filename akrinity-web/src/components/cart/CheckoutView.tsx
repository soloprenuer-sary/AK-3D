'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { EmptyCart } from './CartView';
import { OrderSummary } from './OrderSummary';
import { formatRupees, useCart } from '@/lib/cart-store';

type Pay = 'online' | 'advance' | 'cod';

/**
 * Checkout form from the page design board. It checks the details in the browser only. No payment
 * is taken and no order is created: Razorpay and the WooCommerce Store API are not connected yet.
 * Card details are never typed on this site; Razorpay would open its own window.
 */
export function CheckoutView() {
  const { lines, subtotal, hasMadeToOrder } = useCart();
  const [biz, setBiz] = useState(false);
  const [pay, setPay] = useState<Pay>('online');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  if (lines.length === 0) return <EmptyCart />;

  // Cash on delivery is not offered when the cart has made-to-order or personalised items.
  const payChoice: Pay = hasMadeToOrder && pay === 'cod' ? 'online' : pay;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    const val = (k: string) => String(f.get(k) ?? '').trim();
    if (!val('name')) next.name = 'Enter your name so the courier knows who to deliver to.';
    if (!/^\+?\d{10,13}$/.test(val('phone').replace(/\s+/g, ''))) next.phone = 'Enter a 10-digit mobile number, with or without +91.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) next.email = 'Enter an email like name@example.com.';
    if (!val('address')) next.address = 'Enter the delivery address.';
    if (!val('city')) next.city = 'Enter your city.';
    if (!/^\d{6}$/.test(val('pincode'))) next.pincode = 'Enter a 6-digit pincode.';
    if (biz && val('gstin') && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(val('gstin').toUpperCase()))
      next.gstin = 'GSTIN should be 15 characters, for example 27ABCDE1234F1Z5.';
    if (!f.get('terms')) next.terms = 'Tick the box to agree to the terms, returns and file-use policy.';
    setErrors(next);
    setDone(Object.keys(next).length === 0);
  };

  const field = (name: string, label: string, props: { type?: string; autoComplete?: string; half?: boolean; textarea?: boolean } = {}) => (
    <div className={props.half ? 'field' : 'field full'}>
      <label htmlFor={`co-${name}`}>{label}</label>
      {props.textarea ? (
        <textarea id={`co-${name}`} name={name} rows={3} autoComplete={props.autoComplete} aria-invalid={Boolean(errors[name])} />
      ) : (
        <input id={`co-${name}`} name={name} type={props.type ?? 'text'} autoComplete={props.autoComplete} aria-invalid={Boolean(errors[name])} />
      )}
      {errors[name] && (
        <p className="err" role="alert">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="cart-page">
      <form className="quote-form simple-form" onSubmit={onSubmit} noValidate aria-label="Checkout">
        <p className="meta">Guest checkout is allowed. You do not need an account.</p>

        <h2 className="co-step">
          <span className="step-badge">1</span> Details
        </h2>
        <div className="form-grid">
          {field('name', 'Name', { autoComplete: 'name', half: true })}
          {field('phone', 'WhatsApp or phone', { type: 'tel', autoComplete: 'tel', half: true })}
          {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
        </div>

        <h2 className="co-step">
          <span className="step-badge">2</span> Delivery
        </h2>
        <div className="form-grid">
          {field('address', 'Address', { textarea: true, autoComplete: 'street-address' })}
          {field('city', 'City', { autoComplete: 'address-level2', half: true })}
          {field('pincode', 'Pincode', { autoComplete: 'postal-code', half: true })}
        </div>

        <label className="check">
          <input type="checkbox" checked={biz} onChange={(e) => setBiz(e.target.checked)} />
          Business order, add GST invoice details (optional)
        </label>
        {biz && (
          <div className="form-grid">
            {field('company', 'Company name', { half: true })}
            {field('gstin', 'GSTIN', { half: true })}
          </div>
        )}

        <h2 className="co-step">
          <span className="step-badge">3</span> Payment
        </h2>
        <div className="pay-options" role="radiogroup" aria-label="Payment method">
          <label className={payChoice === 'online' ? 'pay-opt on' : 'pay-opt'}>
            <input type="radio" name="pay" checked={payChoice === 'online'} onChange={() => setPay('online')} />
            <span>
              <b>UPI, cards and netbanking</b>
              <span className="meta">Razorpay opens in a secure window. Card details never touch this site.</span>
            </span>
          </label>
          {hasMadeToOrder && (
            <label className={payChoice === 'advance' ? 'pay-opt on' : 'pay-opt'}>
              <input type="radio" name="pay" checked={payChoice === 'advance'} onChange={() => setPay('advance')} />
              <span>
                <b>Advance now, balance before dispatch</b>
                <span className="meta">For made-to-order and custom items. The advance is shown before you pay.</span>
              </span>
            </label>
          )}
          <label className={hasMadeToOrder ? 'pay-opt off' : payChoice === 'cod' ? 'pay-opt on' : 'pay-opt'}>
            <input
              type="radio"
              name="pay"
              disabled={hasMadeToOrder}
              checked={payChoice === 'cod'}
              onChange={() => setPay('cod')}
            />
            <span>
              <b>Cash on delivery</b>
              <span className="meta">
                {hasMadeToOrder
                  ? 'Not available for this cart. Made-to-order and personalised items are prepaid.'
                  : 'Stocked items under the order limit of ₹[AMOUNT].'}
              </span>
            </span>
          </label>
        </div>

        <label className="check">
          <input name="terms" type="checkbox" aria-invalid={Boolean(errors.terms)} />
          <span>
            I agree to the <Link href="/terms">terms</Link>, <Link href="/returns">returns</Link> and file-use policy.
          </span>
        </label>
        {errors.terms && (
          <p className="err" role="alert">
            {errors.terms}
          </p>
        )}

        <button className="btn btn-primary btn-wide" type="submit">
          {payChoice === 'cod' ? 'Place order' : `Pay ${subtotal === null ? '₹[price]' : formatRupees(subtotal)}`}
        </button>
        {done && (
          <p className="ok" role="status">
            Details look good. Payments are not connected yet, so nothing was charged and no order was placed.
          </p>
        )}
      </form>

      <div className="cart-side">
        <OrderSummary showItems />
        <Link className="btn btn-wide" href="/cart">
          Edit cart
        </Link>
      </div>
    </div>
  );
}
