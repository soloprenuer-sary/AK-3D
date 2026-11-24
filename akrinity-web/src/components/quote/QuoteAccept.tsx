'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  acceptQuote,
  fetchQuote,
  type QuoteAddress,
  type QuoteLink,
  type QuoteView,
} from '@/lib/auth-client';
import { STATES } from '@/lib/shop-types';
import { money, payHref, stageOf } from './quote-shared';

const BAD_LINK =
  'This quote link is not valid. Reply to the quote email and we will send a new one.';

const EMPTY: QuoteAddress = { line1: '', line2: '', city: '', state: '', pincode: '' };

type Errors = Partial<Record<keyof QuoteAddress, string>>;

function check(a: QuoteAddress): Errors {
  const e: Errors = {};
  if (a.line1.trim().length < 5) e.line1 = 'Enter the house or flat number and the street.';
  if (!a.city.trim()) e.city = 'Enter your city.';
  if (!a.state) e.state = 'Choose your state.';
  if (!/^\d{6}$/.test(a.pincode)) e.pincode = 'Enter the 6-digit pincode.';
  return e;
}

/** The page behind the Approve button in the quote email: the quote, the delivery address, then payment. */
export function QuoteAccept({ link }: { link: QuoteLink }) {
  const router = useRouter();
  const badLink = !link.ref || !link.exp || !link.token;
  const [loaded, setLoaded] = useState<{ quote?: QuoteView; error?: string } | null>(null);
  const [address, setAddress] = useState<QuoteAddress>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
  const total = money(q.price);
  const payLink = payHref(link);

  const set = (k: keyof QuoteAddress) => (e: { target: { value: string } }) => {
    const v = k === 'pincode' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value;
    setAddress((a) => ({ ...a, [k]: v }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const found = check(address);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setError('Please fix the fields marked below.');
      return;
    }
    setBusy(true);
    setError('');
    const r = await acceptQuote(link, address);
    if ('error' in r) {
      setBusy(false);
      setError(r.error);
      return;
    }
    router.push(payLink);
  };

  const fieldError = (k: keyof QuoteAddress) =>
    errors[k] && (
      <p className="err" id={`qa-${k}-err`} role="alert">
        {errors[k]}
      </p>
    );

  return (
    <div className="qa">
      <section className="qa-card" aria-labelledby="qa-quote-h">
        <p className="label">Quote {q.ref ?? link.ref}</p>
        <h2 id="qa-quote-h" className="qa-h">
          What you pay for
        </h2>

        {q.lines && q.lines.length > 0 && (
          <ul className="qa-lines">
            {q.lines.map((l, i) => (
              <li key={i}>
                <div>
                  <b>{l.label}</b>
                  {l.reason && <span className="meta">{l.reason}</span>}
                </div>
                <b className="qa-amt">{money(l.amount)}</b>
              </li>
            ))}
          </ul>
        )}

        <dl className="qa-sums">
          {money(q.subtotal) && (
            <div>
              <dt>Subtotal</dt>
              <dd>{money(q.subtotal)}</dd>
            </div>
          )}
          {money(q.gst) && (
            <div>
              <dt>GST</dt>
              <dd>{money(q.gst)}</dd>
            </div>
          )}
        </dl>
        {total && (
          <div className="qa-total">
            <span>Total, including GST</span>
            <b>{total}</b>
          </div>
        )}
        {q.lead && (
          <p className="meta">
            Ready in <b>{q.lead}</b> after payment.
          </p>
        )}
        {q.message && (
          <p className="qa-note">
            <b>Note from the studio:</b> {q.message}
          </p>
        )}
      </section>

      <section className="qa-card qa-side" aria-labelledby="qa-side-h">
        {stage === 'paid' && (
          <>
            <h2 id="qa-side-h" className="qa-h">
              Paid
            </h2>
            <p role="status">
              This quote is paid. Thank you, we are on it.{' '}
              <Link href="/track-order">Track an order</Link>
            </p>
          </>
        )}

        {stage === 'closed' && (
          <>
            <h2 id="qa-side-h" className="qa-h">
              Cancelled
            </h2>
            <p role="alert">
              This quote was cancelled. Reply to the quote email if you want it again.
            </p>
          </>
        )}

        {stage === 'awaiting' && (
          <>
            <h2 id="qa-side-h" className="qa-h">
              Approved
            </h2>
            <p>You approved this quote. The last step is payment.</p>
            <Link className="btn btn-primary btn-wide" href={payLink}>
              Pay {total} securely
            </Link>
            <p className="meta">UPI, cards and net banking, on Cashfree.</p>
          </>
        )}

        {stage === 'open' && (
          <form onSubmit={submit} noValidate className="quote-form qa-form">
            <h2 id="qa-side-h" className="qa-h">
              Where should we deliver?
            </h2>
            <p className="meta">
              This address is used for delivery and printed on your GST invoice.
            </p>
            <div className="field">
              <label htmlFor="qa-line1">Address line 1</label>
              <input
                id="qa-line1"
                autoComplete="address-line1"
                placeholder="House or flat number, building, street"
                value={address.line1}
                onChange={set('line1')}
                aria-invalid={Boolean(errors.line1)}
                aria-describedby={errors.line1 ? 'qa-line1-err' : undefined}
              />
              {fieldError('line1')}
            </div>
            <div className="field">
              <label htmlFor="qa-line2">Address line 2 (optional)</label>
              <input
                id="qa-line2"
                autoComplete="address-line2"
                placeholder="Area, landmark"
                value={address.line2}
                onChange={set('line2')}
              />
            </div>
            <div className="grid2">
              <div className="field">
                <label htmlFor="qa-city">City</label>
                <input
                  id="qa-city"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={set('city')}
                  aria-invalid={Boolean(errors.city)}
                  aria-describedby={errors.city ? 'qa-city-err' : undefined}
                />
                {fieldError('city')}
              </div>
              <div className="field">
                <label htmlFor="qa-pincode">Pincode</label>
                <input
                  id="qa-pincode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="6 digits"
                  maxLength={6}
                  value={address.pincode}
                  onChange={set('pincode')}
                  aria-invalid={Boolean(errors.pincode)}
                  aria-describedby={errors.pincode ? 'qa-pincode-err' : undefined}
                />
                {fieldError('pincode')}
              </div>
            </div>
            <div className="field">
              <label htmlFor="qa-state">State</label>
              <select
                id="qa-state"
                autoComplete="address-level1"
                value={address.state}
                onChange={set('state')}
                aria-invalid={Boolean(errors.state)}
                aria-describedby={errors.state ? 'qa-state-err' : undefined}
              >
                <option value="">Choose your state</option>
                {STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name}
                  </option>
                ))}
              </select>
              {fieldError('state')}
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
              {busy ? 'Approving…' : total ? `Approve and pay ${total}` : 'Approve and pay'}
            </button>
            <p className="meta qa-safe">
              Nothing is charged yet. You pay on the next page with UPI, card or net banking.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
