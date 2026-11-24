'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchQuote, type QuoteLink, type QuoteView } from '@/lib/auth-client';
import { money, safePayUrl, stageOf } from './quote-shared';

const TRIES = 12;
const WAIT_MS = 5000;

/**
 * Where Cashfree sends the customer back. Cashfree tells WordPress about the payment itself (webhook),
 * so this page only reads the quote status: it checks for up to a minute for the payment to be recorded.
 */
export function QuotePaid({ link }: { link: QuoteLink }) {
  const badLink = !link.ref || !link.exp || !link.token;
  const [state, setState] = useState<{ quote?: QuoteView; error?: string; tries: number }>({
    tries: 0,
  });

  useEffect(() => {
    if (badLink) return;
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async (n: number) => {
      const r = await fetchQuote(link);
      if (!live) return;
      const paid = 'quote' in r && stageOf(r.quote) === 'paid';
      setState({
        quote: 'quote' in r ? r.quote : undefined,
        error: 'error' in r ? r.error : undefined,
        tries: n,
      });
      if (!paid && 'quote' in r && n < TRIES) timer = setTimeout(() => check(n + 1), WAIT_MS);
    };
    check(1);
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [badLink, link]);

  if (badLink)
    return <p role="alert">This link is not valid. Check the payment email we sent you.</p>;
  if (state.tries === 0) return <p className="muted">Checking your payment…</p>;
  if (!state.quote)
    return (
      <p role="alert">{state.error} If you already paid, a receipt is on its way to your email.</p>
    );

  const q = state.quote;
  const stage = stageOf(q);

  if (stage === 'paid')
    return (
      <div className="info-card auth-card" role="status">
        <h2 className="d" style={{ marginTop: 0 }}>
          Payment received
        </h2>
        <p>
          Thank you. We have your payment{money(q.price) ? ` of ${money(q.price)}` : ''} for quote{' '}
          <b>{q.ref ?? link.ref}</b>. A receipt is on its way to your email. We start printing now.
        </p>
        <Link className="btn btn-primary" href="/track-order">
          Track your order
        </Link>
      </div>
    );

  if (stage === 'closed')
    return (
      <p role="alert">This quote was cancelled. Reply to the quote email if you want it again.</p>
    );

  const pay = safePayUrl(q.pay_url);
  const waiting = state.tries < TRIES;
  return (
    <div className="info-card auth-card">
      <h2 className="d" style={{ marginTop: 0 }}>
        {waiting ? 'Waiting for your payment' : 'We have not received your payment yet'}
      </h2>
      <p>
        {waiting
          ? 'This can take a minute. Keep this page open.'
          : 'If you already paid, it can take a few minutes to show. We will email you a receipt. If the payment failed or you closed the page, you can pay again.'}
      </p>
      {pay && (
        <a className="btn btn-primary" href={pay}>
          Pay {money(q.price)} on Cashfree
        </a>
      )}
    </div>
  );
}
