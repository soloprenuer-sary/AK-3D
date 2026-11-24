'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  acceptQuote,
  fetchQuote,
  type QuoteAddress,
  type QuoteLink,
  type QuoteView,
} from '@/lib/auth-client';
import { STATES } from '@/lib/shop-types';
import { money, safePayUrl, stageOf } from './quote-shared';

const BAD_LINK =
  'This quote link is not valid. Reply to the quote email and we will send a new one.';

const EMPTY: QuoteAddress = { line1: '', line2: '', city: '', state: '', pincode: '' };

/** The page behind the Approve button in the quote email: the price and reasons, the address, then pay. */
export function QuoteAccept({ link }: { link: QuoteLink }) {
  const badLink = !link.ref || !link.exp || !link.token;
  const [loaded, setLoaded] = useState<{ quote?: QuoteView; error?: string } | null>(null);
  const [address, setAddress] = useState<QuoteAddress>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [payUrl, setPayUrl] = useState('');

  useEffect(() => {
    if (badLink) return;
    let live = true;
    fetchQuote(link).then((r) => {
      if (live) setLoaded('quote' in r ? { quote: r.quote } : { error: r.error });
    });
    return () => {
      live = false;
    };
  }, [badLink, link]);

  if (badLink) return <p role="alert">{BAD_LINK}</p>;
  if (!loaded) return <p className="muted">Loading your quote…</p>;
  if (!loaded.quote) return <p role="alert">{loaded.error ?? BAD_LINK}</p>;

  const q = loaded.quote;
  const stage = stageOf(q);
  const pay = safePayUrl(payUrl || q.pay_url);

  const set = (k: keyof QuoteAddress) => (e: { target: { value: string } }) =>
    setAddress((a) => ({ ...a, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const r = await acceptQuote(link, address);
    setBusy(false);
    if ('error' in r) return setError(r.error);
    if (r.payUrl) window.location.assign(r.payUrl);
    else setPayUrl('done');
  };

  return (
    <div className="info-card auth-card" style={{ maxWidth: 640 }}>
      <h2 className="d" style={{ marginTop: 0 }}>
        Your quote {q.ref ?? link.ref}
      </h2>

      {q.lines && q.lines.length > 0 && (
        <ul className="cart-rows" aria-label="Why this price">
          {q.lines.map((l, i) => (
            <li key={i} className="cart-row">
              <div className="cart-row-info">
                <b className="cart-row-name">{l.label}</b>
                {l.reason && <span className="meta">{l.reason}</span>}
              </div>
              <b className="cart-row-price">{money(l.amount)}</b>
            </li>
          ))}
        </ul>
      )}

      <dl className="meta" style={{ margin: '12px 0' }}>
        {money(q.subtotal) && (
          <div>
            Subtotal <b>{money(q.subtotal)}</b>
          </div>
        )}
        {money(q.gst) && (
          <div>
            GST <b>{money(q.gst)}</b>
          </div>
        )}
        {money(q.price) && (
          <div>
            Total, including GST <b>{money(q.price)}</b>
          </div>
        )}
        {q.lead && (
          <div>
            Ready in <b>{q.lead}</b>
          </div>
        )}
      </dl>
      {q.message && (
        <p>
          <b>Note from the studio:</b> {q.message}
        </p>
      )}

      {stage === 'paid' && (
        <p role="status">
          <b>This quote is paid.</b> Thank you. We are on it.{' '}
          <Link href="/track-order">Track an order</Link>
        </p>
      )}
      {stage === 'closed' && (
        <p role="alert">This quote was cancelled. Reply to the quote email if you want it again.</p>
      )}

      {stage === 'awaiting' && (
        <>
          <p>You approved this quote. The last step is payment.</p>
          {pay ? (
            <a className="btn btn-primary btn-wide" href={pay}>
              Pay {money(q.price)} on Cashfree
            </a>
          ) : (
            <p className="meta">We emailed you the payment link. Check your inbox and spam.</p>
          )}
        </>
      )}

      {stage === 'open' && payUrl === 'done' && (
        <p role="status">
          <b>Thank you. Quote approved.</b> We emailed you the payment link. Check your inbox and
          spam.
        </p>
      )}

      {stage === 'open' && payUrl !== 'done' && (
        <form onSubmit={submit} noValidate>
          <h3 className="d">Delivery address</h3>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="qa-line1">Address line 1</label>
              <input
                id="qa-line1"
                autoComplete="address-line1"
                value={address.line1}
                onChange={set('line1')}
                required
              />
            </div>
            <div className="field full">
              <label htmlFor="qa-line2">Address line 2 (optional)</label>
              <input
                id="qa-line2"
                autoComplete="address-line2"
                value={address.line2}
                onChange={set('line2')}
              />
            </div>
            <div className="field">
              <label htmlFor="qa-city">City</label>
              <input
                id="qa-city"
                autoComplete="address-level2"
                value={address.city}
                onChange={set('city')}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="qa-state">State</label>
              <select
                id="qa-state"
                autoComplete="address-level1"
                value={address.state}
                onChange={set('state')}
                required
              >
                <option value="">Choose your state</option>
                {STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="qa-pin">Pincode</label>
              <input
                id="qa-pin"
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                value={address.pincode}
                onChange={set('pincode')}
                required
              />
            </div>
          </div>
          {error && (
            <p className="err" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn btn-primary btn-wide"
            type="submit"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? 'Approving…' : 'Approve quote and go to payment'}
          </button>
          <p className="meta">Nothing is charged until you pay on the next page.</p>
        </form>
      )}
    </div>
  );
}
