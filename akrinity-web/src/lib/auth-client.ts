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

interface CallResult {
  ok: boolean;
  status: number;
  data: AuthReply;
  /** network: the request never arrived. no-service: something answered, but not the account service. */
  failure?: 'network' | 'no-service';
}

async function call(action: string, payload?: Record<string, unknown>): Promise<CallResult> {
  let res: Response;
  try {
    res = await fetch(`/api/auth/${action}`, {
      method: payload || action !== 'me' ? 'POST' : 'GET',
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : action === 'logout' ? '{}' : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    return { ok: false, status: 0, data: {}, failure: 'network' };
  }
  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  const data = isJson ? ((await res.json().catch(() => ({}))) as AuthReply) : {};
  // A reply that is not JSON did not come from the account service (missing, crashed or behind an error page).
  return { ok: res.ok, status: res.status, data, failure: isJson ? undefined : 'no-service' };
}

/** Plain-language reason for a failed call. The service's own message wins when it sent one. */
function explain(r: CallResult, fallback: string): string {
  if (r.failure === 'network') {
    return 'We could not reach the website. Check your internet connection and try again.';
  }
  if (r.failure === 'no-service') {
    return process.env.NODE_ENV === 'development'
      ? 'The account service is not running on this server. Start it with "npm run auth:dev" and open http://localhost:8788, or run it alongside "npm run dev".'
      : 'Accounts are temporarily unavailable on our side. Please try again in a few minutes.';
  }
  if (r.data.error) return r.data.error;
  if (r.status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
  if (r.status >= 500)
    return 'Something went wrong on our side. Please try again in a few minutes.';
  return fallback;
}

/** error is a message to show, or null on success. unverified means the email is not verified yet. */
export async function signIn(
  email: string,
  password: string,
): Promise<{ error: string | null; unverified: boolean }> {
  const r = await call('login', { email, password });
  if (r.ok) return { error: null, unverified: false };
  return {
    error: explain(r, 'We could not sign you in. Check your email and password, then try again.'),
    unverified: r.data.code === 'unverified',
  };
}

/** error is a message to show, or null on success. signedIn is true when the account can be used straight away. */
export async function signUp(
  values: Record<string, string>,
): Promise<{ error: string | null; signedIn: boolean }> {
  const r = await call('register', {
    name: values.name,
    email: values.email,
    phone: values.phone,
    password: values.password,
    consent: values.consent === 'true',
  });
  if (!r.ok)
    return {
      error: explain(r, 'We could not create your account. Check your details and try again.'),
      signedIn: false,
    };
  return { error: null, signedIn: Boolean(r.data.user) };
}

export async function currentUser(): Promise<AuthUser | null> {
  const r = await call('me');
  return r.ok ? (r.data.user ?? null) : null;
}

export async function signOut(): Promise<void> {
  await call('logout', {});
}

const generic = (r: CallResult, fallback: string): string | null =>
  r.ok ? null : explain(r, fallback);

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
    'This reset link is invalid or has expired. Ask for a new one.',
  );
}

export async function verifyEmail(key: string, login: string): Promise<string | null> {
  return generic(
    await call('verify', { key, login }),
    'This verification link is invalid or has expired. Sign in to get a new one.',
  );
}

export async function resendVerification(email: string): Promise<string | null> {
  return generic(await call('resend', { email }), 'We could not send that. Please try again.');
}
