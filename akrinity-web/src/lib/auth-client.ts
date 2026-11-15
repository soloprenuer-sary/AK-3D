/** Browser side of the account API (`functions/api/auth/[action].ts`). No tokens are handled here:
 * the session lives in an httpOnly cookie that page scripts cannot read. */

export interface AuthUser {
  name: string;
  email: string;
}

interface AuthReply {
  user?: AuthUser | null;
  error?: string;
  code?: string;
}

async function call(
  action: string,
  payload?: Record<string, unknown>,
): Promise<{ ok: boolean; data: AuthReply }> {
  try {
    const res = await fetch(`/api/auth/${action}`, {
      method: payload || action !== 'me' ? 'POST' : 'GET',
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : action === 'logout' ? '{}' : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as AuthReply;
    return { ok: res.ok, data };
  } catch {
    return {
      ok: false,
      data: {
        error: 'We could not reach the account service. Check your connection and try again.',
      },
    };
  }
}

/** error is a message to show, or null on success. unverified means the email is not verified yet. */
export async function signIn(
  email: string,
  password: string,
): Promise<{ error: string | null; unverified: boolean }> {
  const r = await call('login', { email, password });
  if (r.ok) return { error: null, unverified: false };
  return {
    error: r.data.error ?? 'Sign in failed. Please try again.',
    unverified: r.data.code === 'unverified',
  };
}

export async function signUp(values: Record<string, string>): Promise<string | null> {
  const r = await call('register', {
    name: values.name,
    email: values.email,
    phone: values.phone,
    password: values.password,
    consent: values.consent === 'true',
  });
  return r.ok ? null : (r.data.error ?? 'We could not create your account. Please try again.');
}

export async function currentUser(): Promise<AuthUser | null> {
  const r = await call('me');
  return r.ok ? (r.data.user ?? null) : null;
}

export async function signOut(): Promise<void> {
  await call('logout', {});
}

const generic = (r: { ok: boolean; data: AuthReply }, fallback: string): string | null =>
  r.ok ? null : (r.data.error ?? fallback);

/** Asks WordPress to email a reset link. Always looks successful, so it cannot reveal who has an account. */
export async function requestPasswordReset(email: string): Promise<string | null> {
  return generic(await call('forgot', { email }), 'We could not send that. Please try again.');
}

export async function resetPassword(
  key: string,
  login: string,
  password: string,
): Promise<string | null> {
  return generic(
    await call('reset', { key, login, password }),
    'This reset link is invalid or has expired.',
  );
}

export async function verifyEmail(key: string, login: string): Promise<string | null> {
  return generic(
    await call('verify', { key, login }),
    'This verification link is invalid or has expired.',
  );
}

export async function resendVerification(email: string): Promise<string | null> {
  return generic(await call('resend', { email }), 'We could not send that. Please try again.');
}
