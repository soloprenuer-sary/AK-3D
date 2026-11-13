'use client';

import { useState } from 'react';
import { SimpleForm } from './SimpleForm';

/** Sign in and create-account forms. Accounts are not connected yet, so nothing is sent or stored. */
export function AuthTabs() {
  const [tab, setTab] = useState<'in' | 'up'>('in');

  return (
    <div className="info-card auth-card">
      <div className="job-pick" role="tablist" aria-label="Account">
        <button type="button" role="tab" className="pill" aria-selected={tab === 'in'} aria-pressed={tab === 'in'} onClick={() => setTab('in')}>
          Sign in
        </button>
        <button type="button" role="tab" className="pill" aria-selected={tab === 'up'} aria-pressed={tab === 'up'} onClick={() => setTab('up')}>
          Create account
        </button>
      </div>

      {tab === 'in' ? (
        <SimpleForm
          key="in"
          id="signin"
          submitLabel="Sign in"
          successNote="Looks good. Accounts are not connected yet, so you were not signed in."
          fields={[
            { name: 'email', label: 'Email', required: true, rule: 'email', type: 'email', autoComplete: 'email' },
            { name: 'password', label: 'Password', required: true, type: 'password', autoComplete: 'current-password' },
          ]}
        />
      ) : (
        <SimpleForm
          key="up"
          id="signup"
          submitLabel="Create account"
          successNote="Looks good. Accounts are not connected yet, so no account was created."
          consent="I agree to the terms and the privacy policy."
          fields={[
            { name: 'name', label: 'Name', required: true, autoComplete: 'name' },
            { name: 'email', label: 'Email', required: true, rule: 'email', type: 'email', autoComplete: 'email' },
            { name: 'phone', label: 'WhatsApp or phone', rule: 'phone', type: 'tel', autoComplete: 'tel' },
            { name: 'password', label: 'Password', required: true, rule: 'password', type: 'password', autoComplete: 'new-password' },
          ]}
        />
      )}
    </div>
  );
}
