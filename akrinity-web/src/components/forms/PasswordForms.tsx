'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SimpleForm } from './SimpleForm';
import { requestPasswordReset, resetPassword } from '@/lib/auth-client';

/** Asks for an email and sends a reset link. The answer is the same whether or not an account exists. */
export function ForgotPasswordForm() {
  return (
    <div className="info-card auth-card">
      <SimpleForm
        id="forgot"
        submitLabel="Send reset link"
        successNote="If that email has an account, we sent a reset link. Check your inbox."
        onSubmit={(v) => requestPasswordReset(v.email)}
        fields={[
          {
            name: 'email',
            label: 'Email',
            required: true,
            rule: 'email',
            type: 'email',
            autoComplete: 'email',
          },
        ]}
      />
    </div>
  );
}

function ResetInner() {
  const params = useSearchParams();
  const key = params.get('key') ?? '';
  const login = params.get('login') ?? '';
  const [done, setDone] = useState(false);

  if (!key || !login) {
    return (
      <div className="info-card auth-card">
        <p className="err">This reset link is incomplete. Ask for a new one.</p>
        <Link className="btn btn-wide" href="/forgot-password">
          Send a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="info-card auth-card">
      <SimpleForm
        id="reset"
        submitLabel="Set new password"
        successNote="Password changed. You can sign in now."
        onSubmit={async (v) => {
          if (v.password !== v.confirm) return 'The two passwords do not match.';
          const error = await resetPassword(key, login, v.password);
          if (!error) setDone(true);
          return error;
        }}
        fields={[
          {
            name: 'password',
            label: 'New password',
            required: true,
            rule: 'password',
            type: 'password',
            autoComplete: 'new-password',
          },
          {
            name: 'confirm',
            label: 'Repeat new password',
            required: true,
            type: 'password',
            autoComplete: 'new-password',
          },
        ]}
      />
      {done && (
        <Link className="btn btn-primary btn-wide" href="/login" style={{ marginTop: 12 }}>
          Go to sign in
        </Link>
      )}
    </div>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div className="info-card auth-card">Loading…</div>}>
      <ResetInner />
    </Suspense>
  );
}
