'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { fetchQuote, startQuotePayment, type QuoteLink, type QuoteView } from '@/lib/auth-client';
import { acceptHref, money, stageOf } from './quote-shared';

interface CashfreeCheckout {
  checkout: (o: { paymentSessionId: string; redirectTarget?: string }) => Promise<unknown>;
}
declare global {
  interface Window {
    Cashfree?: (o: { mode: string }) => CashfreeCheckout;
  }
}

const SDK = 'https://sdk.cashfree.com/js/v3/cashfree.js';

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) return resolve();
    const s = document.createElement('script');
    s.src = SDK;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('sdk'));
    document.head.appendChild(s);
  });
}

type View =
  | { kind: 'loading' }
  | { kind: 'opening'; quote: QuoteView }
  | { kind: 'paid'; quote?: QuoteView }
  | { kind: 'accept' }
  | { kind: 'closed' }
  | { kind: 'error'; message: string; quote?: QuoteView };

/** Opens the Cashfree checkout for an approved quote, on this website. */
export function QuotePay({ link }: { link: QuoteLink }) {
  const badLink = !link.ref || !link.exp || !link.token;
  const [view, setView] = useState<View>({ kind: 'loading' });
  const started = useRef(false);

  const run = useCallback(async () => {
    const got = await fetchQuote(link);
    if ('error' in got) return setView({ kind: 'error', message: got.error });
    const quote = got.quote;
    const stage = stageOf(quote);
    if (stage === 'paid') return setView({ kind: 'paid', quote });
    if (stage === 'closed') return setView({ kind: 'closed' });
    if (stage === 'open') return setView({ kind: 'accept' });
    setView({ kind: 'opening', quote });
    const pay = await startQuotePayment(link);
    if ('paid' in pay) return setView({ kind: 'paid', quote });
    if ('error' in pay) return setView({ kind: 'error', message: pay.error, quote });
    try {
      await loadSdk();
      if (!window.Cashfree) throw new Error('sdk');
      const cf = window.Cashfree({ mode: pay.mode });
      await cf.checkout({ paymentSessionId: pay.sessionId, redirectTarget: '_self' });
    } catch {
      setView({
        kind: 'error',
        message: 'The payment window could not open. Check your connection and try again.',
        quote,
      });
    }
  }, [link]);

  useEffect(() => {
    if (badLink || started.current) return;
    started.current = true;
    run();
  }, [badLink, run]);

  if (badLink)
    return <p role="alert">This link is not valid. Check the payment email we sent you.</p>;

  if (view.kind === 'loading') return <p className="muted">Loading your quote…</p>;

  if (view.kind === 'accept')
    return (
      <div className="qa-card" style={{ maxWidth: 560 }}>
        <h2 className="qa-h">Approve your quote first</h2>
        <p>Payment opens once you approve the quote and give your delivery address.</p>
        <Link className="btn btn-primary" href={acceptHref(link)}>
          Go to the quote
        </Link>
      </div>
    );

  if (view.kind === 'closed')
    return (
      <p role="alert">This quote was cancelled. Reply to the quote email if you want it again.</p>
    );

  if (view.kind === 'paid')
    return (
      <div className="qa-card" style={{ maxWidth: 560 }} role="status">
        <h2 className="qa-h">Already paid</h2>
        <p>We have your payment for quote {view.quote?.ref ?? link.ref}. Thank you.</p>
        <Link className="btn btn-primary" href="/track-order">
          Track your order
        </Link>
      </div>
    );

  if (view.kind === 'error')
    return (
      <div className="qa-card" style={{ maxWidth: 560 }}>
        <h2 className="qa-h">We could not open the payment</h2>
        <p role="alert">{view.message}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setView({ kind: 'loading' });
            run();
          }}
        >
          Try again
        </button>
      </div>
    );

  return (
    <div className="qa-card" style={{ maxWidth: 560 }} role="status">
      <h2 className="qa-h">Opening secure payment</h2>
      <p>
        {money(view.quote.price)
          ? `You pay ${money(view.quote.price)} for quote ${view.quote.ref ?? link.ref}. `
          : ''}
        Cashfree opens in a moment. UPI, cards and net banking work.
      </p>
      <p className="meta">If nothing happens, wait a few seconds or reload this page.</p>
    </div>
  );
}
