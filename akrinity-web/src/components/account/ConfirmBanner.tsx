'use client';

import { useState } from 'react';
import { resendConfirmation } from '@/lib/auth-client';

/** Shown to a signed-in customer who has not confirmed their email yet. Nothing is blocked. */
export function ConfirmBanner({ email }: { email: string }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const resend = async () => {
    setBusy(true);
    const err = await resendConfirmation(email);
    setBusy(false);
    setNote(err ?? 'If this email has an account, a new link is on its way. Check spam too.');
  };

  return (
    <div className="notice" role="status" style={{ marginBottom: 20 }}>
      <span className="label">Confirm your email</span>
      <span className="muted" style={{ fontSize: 14 }}>
        We sent a link to {email}. Click it to confirm the address. You can shop in the meantime.
      </span>
      <div
        style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}
      >
        <button type="button" className="btn btn-sm" onClick={resend} disabled={busy}>
          {busy ? 'Sending…' : 'Send the link again'}
        </button>
        {note && (
          <span className="muted" style={{ fontSize: 14 }}>
            {note}
          </span>
        )}
      </div>
    </div>
  );
}
