'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { EmptyCart } from './CartView';
import { formatRupees, useCart } from '@/lib/cart-store';
import { currentUser } from '@/lib/auth-client';
import { placeOrder, quoteCart, toLines } from '@/lib/shop-client';
import { METHOD_LABEL, STATES, type CartView } from '@/lib/shop-types';

const BLANK = {
  name: '',
  phone: '',
  email: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  pincode: '',
  company: '',
  gstin: '',
};

const METHOD_NOTE: Record<string, string> = {
  cashfree: "You pay on Cashfree's secure page. Card and UPI details never touch this site.",
  cod: 'Pay the delivery person in cash or UPI when your order arrives.',
};

/**
 * Checkout. The totals, GST (CGST and SGST inside Maharashtra, IGST for other states), shipping
 * options and payment choices all come from the store through /api/shop, so what you see is what
 * you pay. Cash on delivery is placed here; Cashfree sends you to its secure page.
 */
export function CheckoutView() {
  const cart = useCart();
  const { lines } = cart;
  const [v, setV] = useState(BLANK);
  const [biz, setBiz] = useState(false);
  const [method, setMethod] = useState('');
  const [rate, setRate] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [note, setNote] = useState('');
  const [terms, setTerms] = useState(false);
  const [view, setView] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const seq = useRef(0);

  const set = (name: keyof typeof BLANK) => (e: { target: { value: string } }) =>
    setV((p) => ({ ...p, [name]: e.target.value }));

  // Fill in the details of a signed-in customer.
  useEffect(() => {
    let live = true;
    currentUser().then((u) => {
      if (!live || !u) return;
      const b = u.billing ?? {};
      setV((p) => ({
        ...p,
        name: p.name || u.name || '',
        email: p.email || u.email || '',
        phone: p.phone || u.phone || b.phone || '',
        address1: p.address1 || b.address_1 || '',
        address2: p.address2 || b.address_2 || '',
        city: p.city || b.city || '',
        state: p.state || b.state || '',
        pincode: p.pincode || b.postcode || '',
      }));
    });
    return () => {
      live = false;
    };
  }, []);

  const linesKey = JSON.stringify(toLines(lines));
  const pinOk = /^\d{6}$/.test(v.pincode);

  const run = useCallback(
    async (extra: { coupon?: string; removeCoupon?: string } = {}) => {
      const mine = ++seq.current;
      const payload = {
        lines: JSON.parse(linesKey),
        address: v.state && pinOk ? { ...v, name: v.name || 'Customer' } : undefined,
        rate: rate || undefined,
        method: method || undefined,
        ...extra,
      };
      if (payload.lines.length === 0) return;
      setLoading(true);
      const r = await quoteCart(payload);
      if (mine !== seq.current) return;
      setLoading(false);
      if (!r.ok) {
        setProblem(r.error);
        return;
      }
      setProblem(r.data.problems[0]?.message ?? '');
      if (extra.coupon || extra.removeCoupon) setCouponMessage(r.data.couponMessage ?? '');
      setView(r.data.cart);
      const pm = r.data.cart.paymentMethods;
      setMethod((cur) => (cur && pm.includes(cur) ? cur : (pm[0] ?? '')));
      const picked = r.data.cart.rates.find((x) => x.selected) ?? r.data.cart.rates[0];
      setRate((cur) =>
        cur && r.data.cart.rates.some((x) => x.id === cur) ? cur : (picked?.id ?? ''),
      );
    },
    // The address only matters once there is a state and a pincode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linesKey, v.state, v.pincode, rate, method],
  );

  useEffect(() => {
    const t = window.setTimeout(() => void run(), 350);
    return () => window.clearTimeout(t);
  }, [run]);

  if (lines.length === 0) return <EmptyCart />;

  const money = (n: number) => formatRupees(Math.round(n * 100) / 100);
  const mtoCart = lines.some((l) => l.madeToOrder);
  const methods = view?.paymentMethods ?? [];

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!v.name.trim()) next.name = 'Enter your name so the courier knows who to deliver to.';
    if (!/^\+?\d{10,13}$/.test(v.phone.replace(/\s+/g, '')))
      next.phone = 'Enter a 10-digit mobile number, with or without +91.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
      next.email = 'Enter an email like name@example.com.';
    if (!v.address1.trim()) next.address1 = 'Enter the delivery address.';
    if (!v.city.trim()) next.city = 'Enter your city.';
    if (!v.state) next.state = 'Choose your state.';
    if (!pinOk) next.pincode = 'Enter a 6-digit pincode.';
    if (biz && v.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.gstin.toUpperCase()))
      next.gstin = 'GSTIN should be 15 characters, for example 27ABCDE1234F1Z5.';
    if (!method) next.method = 'Choose how you want to pay.';
    if (!terms) next.terms = 'Tick the box to agree to the terms, returns and file-use policy.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPlacing(true);
    setProblem('');
    const r = await placeOrder({
      lines: toLines(lines),
      address: { ...v, company: biz ? v.company : '', gstin: biz ? v.gstin : '' },
      rate: rate || undefined,
      method,
      note,
      terms,
    });
    if (!r.ok) {
      setPlacing(false);
      setProblem(r.error);
      const field = r.data.field;
      if (typeof field === 'string') setErrors({ [field]: r.error });
      const c = (r.data as { cart?: CartView }).cart;
      if (c) setView(c);
      return;
    }
    const { orderId, key, redirect } = r.data;
    if (redirect) {
      // Cashfree: keep the cart until the payment is confirmed on the order page.
      window.location.assign(redirect);
      return;
    }
    cart.clear();
    window.location.assign(`/order-confirmation?order=${orderId}&key=${encodeURIComponent(key)}`);
  };

  const err = (name: string) =>
    errors[name] ? (
      <p className="err" role="alert">
        {errors[name]}
      </p>
    ) : null;

  const text = (
    name: keyof typeof BLANK,
    label: string,
    props: { type?: string; autoComplete?: string; half?: boolean; optional?: boolean } = {},
  ) => (
    <div className={props.half ? 'field' : 'field full'}>
      <label htmlFor={`co-${name}`}>
        {label}
        {props.optional ? ' (optional)' : ''}
      </label>
      <input
        id={`co-${name}`}
        name={name}
        type={props.type ?? 'text'}
        autoComplete={props.autoComplete}
        value={v[name]}
        onChange={set(name)}
        aria-invalid={Boolean(errors[name])}
      />
      {err(name)}
    </div>
  );

  const payChoices = ['cashfree', 'cod'];

  return (
    <div className="cart-page">
      <form className="quote-form simple-form" onSubmit={onSubmit} noValidate aria-label="Checkout">
        <p className="meta">Guest checkout is allowed. You do not need an account.</p>

        <h2 className="co-step">
          <span className="step-badge">1</span> Details
        </h2>
        <div className="form-grid">
          {text('name', 'Name', { autoComplete: 'name', half: true })}
          {text('phone', 'WhatsApp or phone', { type: 'tel', autoComplete: 'tel', half: true })}
          {text('email', 'Email', { type: 'email', autoComplete: 'email' })}
        </div>

        <h2 className="co-step">
          <span className="step-badge">2</span> Delivery
        </h2>
        <div className="form-grid">
          {text('address1', 'Address', { autoComplete: 'address-line1' })}
          {text('address2', 'Flat, building or landmark', {
            autoComplete: 'address-line2',
            optional: true,
          })}
          {text('city', 'City', { autoComplete: 'address-level2', half: true })}
          <div className="field">
            <label htmlFor="co-state">State</label>
            <select
              id="co-state"
              name="state"
              value={v.state}
              onChange={set('state')}
              autoComplete="address-level1"
              aria-invalid={Boolean(errors.state)}
            >
              <option value="">Choose your state</option>
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            {err('state')}
          </div>
          {text('pincode', 'Pincode', { autoComplete: 'postal-code', half: true })}
        </div>

        <label className="check">
          <input type="checkbox" checked={biz} onChange={(e) => setBiz(e.target.checked)} />
          Business order, add GST invoice details (optional)
        </label>
        {biz && (
          <div className="form-grid">
            {text('company', 'Company name', { half: true, autoComplete: 'organization' })}
            {text('gstin', 'GSTIN', { half: true })}
          </div>
        )}

        {view && view.needsShipping && (
          <div className="ship-options" role="radiogroup" aria-label="Delivery options">
            <span className="label">Delivery option</span>
            {view.rates.length === 0 ? (
              <p className="meta">
                {v.state && pinOk
                  ? 'We could not find a delivery option for this address. Check the state and pincode, or contact us.'
                  : 'Choose your state and enter your pincode to see delivery options.'}
              </p>
            ) : (
              view.rates.map((r) => (
                <label key={r.id} className={r.id === rate ? 'pay-opt on' : 'pay-opt'}>
                  <input
                    type="radio"
                    name="rate"
                    checked={r.id === rate}
                    onChange={() => setRate(r.id)}
                  />
                  <span>
                    <b>
                      {r.name} · {r.cost > 0 ? money(r.cost) : 'Free'}
                    </b>
                    {r.delivery && <span className="meta">{r.delivery}</span>}
                  </span>
                </label>
              ))
            )}
          </div>
        )}

        <h2 className="co-step">
          <span className="step-badge">3</span> Payment
        </h2>
        <div className="pay-options" role="radiogroup" aria-label="Payment method">
          {payChoices.map((m) => {
            const available = methods.includes(m);
            if (!available && m !== 'cod') return null;
            return (
              <label
                key={m}
                className={!available ? 'pay-opt off' : method === m ? 'pay-opt on' : 'pay-opt'}
              >
                <input
                  type="radio"
                  name="pay"
                  disabled={!available}
                  checked={method === m}
                  onChange={() => setMethod(m)}
                />
                <span>
                  <b>{METHOD_LABEL[m]}</b>
                  <span className="meta">
                    {available
                      ? METHOD_NOTE[m]
                      : mtoCart
                        ? 'Not available for this cart. Made-to-order and personalised items are paid online.'
                        : 'Not available for this order (the order is above the cash on delivery limit, or it is not set up yet).'}
                  </span>
                </span>
              </label>
            );
          })}
          {methods.length === 0 && !loading && (
            <p className="meta">No payment method is available right now. Please contact us.</p>
          )}
        </div>
        {err('method')}
        {method === 'cod' &&
          view?.fees.map((f) => (
            <p key={f.name} className="meta">
              {f.name}: {money(f.amount)} (GST included) is added for cash on delivery.
            </p>
          ))}

        <div className="field full">
          <label htmlFor="co-note">Note for us (optional)</label>
          <textarea
            id="co-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
        </div>

        <label className="check">
          <input
            name="terms"
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            aria-invalid={Boolean(errors.terms)}
          />
          <span>
            I agree to the <Link href="/terms">terms</Link>, <Link href="/returns">returns</Link>{' '}
            and file-use policy.
          </span>
        </label>
        {err('terms')}

        <button
          className="btn btn-primary btn-wide"
          type="submit"
          disabled={placing || loading || !view}
          aria-busy={placing}
        >
          {placing
            ? 'Placing your order…'
            : method === 'cod'
              ? `Place order${view ? ` · ${money(view.total)}` : ''}`
              : `Pay${view ? ` ${money(view.total)}` : ''}`}
        </button>
        {problem && (
          <p className="err" role="alert">
            {problem}
          </p>
        )}
      </form>

      <div className="cart-side">
        <aside className="order-summary" aria-label="Order summary" aria-busy={loading}>
          <h2 className="d">Order summary</h2>
          <ul className="sum-lines">
            {(view?.items ?? []).map((i) => (
              <li key={i.key}>
                <span>
                  {i.name} ×{i.qty}
                </span>
                <b>{money(i.line)}</b>
              </li>
            ))}
            {!view &&
              lines.map((l) => (
                <li key={l.key}>
                  <span>
                    {l.name} ×{l.qty}
                  </span>
                  <b>…</b>
                </li>
              ))}
          </ul>

          <div className="coupon-row">
            <label className="sr" htmlFor="co-coupon">
              Coupon code
            </label>
            <input
              id="co-coupon"
              type="text"
              placeholder="Coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              autoComplete="off"
            />
            <button
              type="button"
              className="btn"
              disabled={!couponInput.trim() || loading}
              onClick={() => {
                void run({ coupon: couponInput.trim() });
              }}
            >
              Apply
            </button>
          </div>
          {couponMessage && <p className="meta">{couponMessage}</p>}
          {(view?.coupons ?? []).map((c) => (
            <p key={c.code} className="meta">
              Coupon {c.code} applied.{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setCouponInput('');
                  void run({ removeCoupon: c.code });
                }}
              >
                Remove
              </button>
            </p>
          ))}

          <dl className="sum-rows">
            <div>
              <dt>Subtotal</dt>
              <dd>{view ? money(view.subtotal) : '…'}</dd>
            </div>
            {view && view.discount > 0 && (
              <div>
                <dt>Discount</dt>
                <dd>−{money(view.discount)}</dd>
              </div>
            )}
            <div>
              <dt>Shipping</dt>
              <dd>
                {!view
                  ? '…'
                  : !view.needsShipping
                    ? 'Not needed'
                    : view.rates.length === 0
                      ? 'Enter state and pincode'
                      : view.shipping > 0
                        ? money(view.shipping)
                        : 'Free'}
              </dd>
            </div>
            {(view?.fees ?? []).map((f) => (
              <div key={f.name}>
                <dt>{f.name}</dt>
                <dd>{money(f.amount)}</dd>
              </div>
            ))}
            <div className="sum-total">
              <dt>Total</dt>
              <dd>{view ? money(view.total) : '…'}</dd>
            </div>
          </dl>
          <p className="meta">
            {view && view.taxes.length > 0
              ? `Includes GST ${money(view.tax)}: ${view.taxes.map((t) => `${t.name} ${money(t.amount)}`).join(', ')}.`
              : 'Prices include GST. The split (CGST and SGST, or IGST) shows once you choose your state.'}
          </p>
        </aside>
        <Link className="btn btn-wide" href="/cart">
          Edit cart
        </Link>
      </div>
    </div>
  );
}
