'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SimpleForm } from './SimpleForm';
import { checkEmail, signIn, signUp } from '@/lib/auth-client';

type Mode = 'in' | 'up';

/**
 * Sign in and create account.
 * Sign in asks for the email first. A known email asks for the password. An unknown email, or one
 * that only ordered as a guest, is sent to Create account with the email already filled in.
 */
export function AuthTabs() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('in');
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');

  const go = (next: Mode) => {
    setMode(next);
    setStep('email');
    setNotice('');
  };

  return (
    <div className="info-card auth-card">
      <div className="job-pick" role="tablist" aria-label="Account">
        <button
          type="button"
          role="tab"
          className="pill"
          aria-selected={mode === 'in'}
          aria-pressed={mode === 'in'}
          onClick={() => go('in')}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          className="pill"
          aria-selected={mode === 'up'}
          aria-pressed={mode === 'up'}
          onClick={() => go('up')}
        >
          Create account
        </button>
      </div>

      {notice && (
        <p className="notice-line" role="status">
          {notice}
        </p>
      )}

      {mode === 'in' && step === 'email' && (
        <SimpleForm
          key="in-email"
          id="signin-email-step"
          submitLabel="Continue"
          successNote=""
          onSubmit={async (v) => {
            const r = await checkEmail(v.email);
            if (r.error || !r.state) return r.error;
            setEmail(v.email);
            if (r.state === 'account') {
              setStep('password');
              return null;
            }
            setMode('up');
            setNotice(
              r.state === 'guest'
                ? 'You have ordered with us before as a guest. Create a password to see your orders and sign in next time.'
                : 'We could not find an account for this email. Fill in the details below to create one.',
            );
            return null;
          }}
          fields={[
            {
              name: 'email',
              label: 'Email',
              required: true,
              rule: 'email',
              type: 'email',
              autoComplete: 'email',
              defaultValue: email,
            },
          ]}
        />
      )}

      {mode === 'in' && step === 'password' && (
        <>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Signing in as <b>{email}</b>{' '}
            <button type="button" className="link-btn" onClick={() => setStep('email')}>
              Change
            </button>
          </p>
          <SimpleForm
            key="in-password"
            id="signin"
            submitLabel="Sign in"
            busyLabel="Signing in…"
            successNote="Signed in. Taking you to your account."
            onSubmit={async (v) => {
              const r = await signIn(email, v.password);
              if (!r.error) router.push('/account');
              return r.error;
            }}
            fields={[
              {
                name: 'password',
                label: 'Password',
                required: true,
                type: 'password',
                autoComplete: 'current-password',
              },
            ]}
          />
          <p style={{ marginTop: 14 }}>
            <Link className="link" href="/forgot-password">
              Forgot your password?
            </Link>
          </p>
        </>
      )}

      {mode === 'up' && (
        <>
          <SimpleForm
            key={`up-${email}`}
            id="signup"
            submitLabel="Create account"
            busyLabel="Creating your account…"
            successNote="Account created. Taking you to your account."
            consent={
              <>
                I agree to the <Link href="/terms">terms and conditions</Link> and the{' '}
                <Link href="/privacy">privacy policy</Link>.
              </>
            }
            onSubmit={async (v) => {
              const r = await signUp(v);
              if (!r.error) {
                if (r.signedIn) router.push('/account');
                else go('in');
              }
              return r.error;
            }}
            fields={[
              { name: 'name', label: 'Full name', required: true, autoComplete: 'name' },
              {
                name: 'email',
                label: 'Email',
                required: true,
                rule: 'email',
                type: 'email',
                autoComplete: 'email',
                defaultValue: email,
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
                label: 'Create password',
                required: true,
                rule: 'password',
                type: 'password',
                autoComplete: 'new-password',
              },
              {
                name: 'confirm',
                label: 'Re-enter password',
                required: true,
                type: 'password',
                autoComplete: 'new-password',
                match: 'password',
              },
            ]}
          />
          <p style={{ marginTop: 14 }}>
            Already have an account?{' '}
            <button type="button" className="link-btn" onClick={() => go('in')}>
              Sign in
            </button>
          </p>
        </>
      )}
    </div>
  );
}
