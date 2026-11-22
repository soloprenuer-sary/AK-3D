'use client';

import { useState, type FormEvent } from 'react';
import { subscribeNewsletter } from '@/lib/auth-client';

/** Footer sign-up. The address is kept in WordPress under Quote requests (type Newsletter). */
export function NewsletterForm() {
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    const problem = await subscribeNewsletter(
      String(f.get('email') ?? '').trim(),
      String(f.get('website') ?? ''),
    );
    setBusy(false);
    setFailed(Boolean(problem));
    setMessage(problem ?? 'Thank you. You are on the list. Check your email for a note from us.');
    if (!problem) form.reset();
  }

  return (
    <>
      <form className="news" onSubmit={onSubmit}>
        <label className="sr" htmlFor="newsletter-email">
          Email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          required
        />
        <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button type="submit" aria-label="Subscribe" disabled={busy} aria-busy={busy}>
          →
        </button>
      </form>
      <p
        style={{ fontSize: 13, color: failed ? '#ff9b9b' : 'var(--accent)', marginTop: 8 }}
        aria-live="polite"
      >
        {message}
      </p>
    </>
  );
}
