'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SimpleForm } from './SimpleForm';
import { resendVerification, signIn, signUp } from '@/lib/auth-client';

/** Sign in and create-account forms. They talk to WordPress through the account API. */
export function AuthTabs() {
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [unverified, setUnverified] = useState('');
  const [resendNote, setResendNote] = useState('');
  const router = useRouter();

  const resend = async () => {
    const error = await resendVerification(unverified);
    setResendNote(error ?? 'If that account is waiting for verification, we sent a new link.');
  };

  return (
    <div className="info-card auth-card">
      <div className="job-pick" role="tablist" aria-label="Account">
        <button
          type="button"
          role="tab"
          className="pill"
          aria-selected={tab === 'in'}
          aria-pressed={tab === 'in'}
          onClick={() => setTab('in')}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          className="pill"
          aria-selected={tab === 'up'}
          aria-pressed={tab === 'up'}
          onClick={() => setTab('up')}
        >
          Create account
        </button>
      </div>

      {tab === 'in' ? (
        <>
          <SimpleForm
            key="in"
            id="signin"
            submitLabel="Sign in"
            successNote="Signed in. Taking you to your account."
            onSubmit={async (v) => {
              const r = await signIn(v.email, v.password);
              setUnverified(r.unverified ? v.email : '');
              setResendNote('');
              if (!r.error) router.push('/account');
              return r.error;
            }}
            fields={[
              {
                name: 'email',
                label: 'Email',
                required: true,
                rule: 'email',
                type: 'email',
                autoComplete: 'email',
              },
              {
                name: 'password',
                label: 'Password',
                required: true,
                type: 'password',
                autoComplete: 'current-password',
              },
            ]}
          />
          {unverified && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <button type="button" className="btn btn-wide" onClick={resend}>
                Resend verification email
              </button>
              {resendNote && (
                <p className="ok" role="status">
                  {resendNote}
                </p>
              )}
            </div>
          )}
          <p style={{ marginTop: 14 }}>
            <Link className="link" href="/forgot-password">
              Forgot your password?
            </Link>
          </p>
        </>
      ) : (
        <SimpleForm
          key="up"
          id="signup"
          submitLabel="Create account"
          successNote="Account created. If we asked you to verify your email, open the link we sent, then sign in."
          consent="I agree to the terms and the privacy policy."
          onSubmit={async (v) => {
            const r = await signUp(v);
            if (!r.error && r.signedIn) router.push('/account');
            return r.error;
          }}
          fields={[
            { name: 'name', label: 'Name', required: true, autoComplete: 'name' },
            {
              name: 'email',
              label: 'Email',
              required: true,
              rule: 'email',
              type: 'email',
              autoComplete: 'email',
            },
            {
              name: 'phone',
              label: 'WhatsApp or phone',
              rule: 'phone',
              type: 'tel',
              autoComplete: 'tel',
            },
            {
              name: 'password',
              label: 'Password',
              required: true,
              rule: 'password',
              type: 'password',
              autoComplete: 'new-password',
            },
          ]}
        />
      )}
    </div>
  );
}
