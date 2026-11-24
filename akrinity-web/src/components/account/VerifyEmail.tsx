'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { confirmEmail } from '@/lib/auth-client';

const BAD_LINK = 'This link is not valid. Sign in and request a new one from your account.';

/** Confirms the address from the link in the email. */
export function VerifyEmail({ id, token }: { id: string; token: string }) {
  const n = Number(id);
  const badLink = !Number.isInteger(n) || n <= 0 || !token;
  const [result, setResult] = useState<{ error: string | null } | null>(null);

  useEffect(() => {
    if (badLink) return;
    let live = true;
    confirmEmail(n, token).then((error) => {
      if (live) setResult({ error });
    });
    return () => {
      live = false;
    };
  }, [badLink, n, token]);

  const failed = badLink ? BAD_LINK : result?.error;
  if (!failed && !result) return <p className="muted">Checking your link…</p>;
  if (!failed) {
    return (
      <p>
        <b>Thank you. Your email is confirmed.</b> <Link href="/account">Go to your account</Link>
      </p>
    );
  }
  return (
    <p role="alert">
      {failed} <Link href="/account">Go to your account</Link>
    </p>
  );
}
