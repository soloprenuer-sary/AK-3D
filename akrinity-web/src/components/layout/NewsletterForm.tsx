'use client';

import { useState } from 'react';

/** Sign-up is not connected to a mail provider yet; it only confirms on screen. */
export function NewsletterForm() {
  const [message, setMessage] = useState('');

  return (
    <>
      <form
        className="news"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage('Thanks. Email sign-up is not connected yet, so nothing was sent.');
        }}
      >
        <label className="sr" htmlFor="newsletter-email">
          Email
        </label>
        <input id="newsletter-email" type="email" placeholder="name@company.com" required />
        <button type="submit" aria-label="Subscribe">
          →
        </button>
      </form>
      <p style={{ fontSize: 13, color: 'var(--accent)', marginTop: 8 }} aria-live="polite">
        {message}
      </p>
    </>
  );
}
