'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { currentUser, signOut, type AuthUser } from '@/lib/auth-client';

/** Title block of the account page: signed-out prompt, or the signed-in greeting with a sign-out button. */
export function AccountHeader() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    currentUser().then((u) => {
      if (!live) return;
      setUser(u);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  if (!ready) {
    return (
      <div className="wrap page-title" aria-busy="true">
        <h1 className="d">
          Your <span className="hl">account</span>
        </h1>
        <p>Checking your session…</p>
      </div>
    );
  }

  return (
    <div className="wrap page-title">
      <h1 className="d">
        Your <span className="hl">account</span>
      </h1>
      {user ? (
        <>
          <p>
            Signed in as <b>{user.name || user.email}</b> ({user.email}).
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <Link className="btn btn-primary" href="/shop">
              Keep shopping
            </Link>
            <Link className="btn" href="/track-order">
              Track an order
            </Link>
            <button type="button" className="btn" onClick={logout}>
              Sign out
            </button>
          </div>
        </>
      ) : (
        <>
          <p>You are not signed in. Guest checkout and order tracking by number work without an account.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <Link className="btn btn-primary" href="/login">
              Sign in or create account
            </Link>
            <Link className="btn" href="/track-order">
              Track an order
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
