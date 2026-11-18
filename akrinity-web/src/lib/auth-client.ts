/** Browser side of the account API (`src/app/api/auth/[action]/route.ts`). No tokens are handled
 * here: the session lives in an httpOnly cookie that page scripts cannot read. */

export type Address = Record<string, string>;

export interface AuthUser {
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  billing?: Address;
  shipping?: Address;
}

export interface OrderSummary {
  id: number;
  number: string;
  status: string;
  status_label: string;
  date: string;
  total: string;
  currency: string;
  item_count: number;
  payment_method: string;
}

export interface OrderDetail extends OrderSummary {
  items: {
    name: string;
    quantity: number;
    total: string;
    meta: { label: string; value: string }[];
  }[];
  subtotal: string;
  shipping_total: string;
  tax_total: string;
  discount_total: string;
  date_paid: string;
  note: string;
  billing: Address;
  shipping: Address;
}

interface AuthReply {
  user?: AuthUser | null;
  error?: string;
  code?: string;
  field?: string;
  state?: string;
  orders?: OrderSummary[];
  order?: OrderDetail;
}

interface CallResult {
  ok: boolean;
  status: number;
  data: AuthReply;
  /** network: the request never arrived. no-service: something answered, but not the account service. */
  failure?: 'network' | 'no-service';
}

async function call(
  action: string,
  payload?: Record<string, unknown>,
  query = '',
): Promise<CallResult> {
  let res: Response;
  try {
    res = await fetch(`/api/auth/${action}${query}`, {
      method: payload ? 'POST' : 'GET',
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
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
      ? 'The account service is not running on this server. Run "npm run dev" (it serves the account service too) and reload.'
      : 'Accounts are temporarily unavailable on our side. Please try again in a few minutes.';
  }
  if (r.data.error) return r.data.error;
  if (r.status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
  if (r.status >= 500)
    return 'Something went wrong on our side. Please try again in a few minutes.';
  return fallback;
}

const generic = (r: CallResult, fallback: string): string | null =>
  r.ok ? null : explain(r, fallback);

// ---------- sign in and sign up ----------

export type EmailState = 'account' | 'guest' | 'new';

/** Is this email a customer with a login, someone who only ordered as a guest, or new? */
export async function checkEmail(
  email: string,
): Promise<{ state: EmailState | null; error: string | null }> {
  const r = await call('check', { email });
  if (!r.ok)
    return { state: null, error: explain(r, 'We could not check that email. Please try again.') };
  const s = r.data.state;
  return { state: s === 'account' || s === 'guest' ? s : 'new', error: null };
}

/** error is a message to show, or null on success. */
export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  const r = await call('login', { email, password });
  if (r.ok) return { error: null };
  return {
    error: explain(r, 'We could not sign you in. Check your email and password, then try again.'),
  };
}

export async function signUp(
  values: Record<string, string>,
): Promise<{ error: string | null; signedIn: boolean }> {
  const r = await call('register', {
    name: values.name,
    email: values.email,
    phone: values.phone,
    password: values.password,
    confirm: values.confirm,
    consent: values.consent === 'true',
  });
  if (!r.ok) {
    return {
      error: explain(r, 'We could not create your account. Check your details and try again.'),
      signedIn: false,
    };
  }
  return { error: null, signedIn: Boolean(r.data.user) };
}

export async function currentUser(): Promise<AuthUser | null> {
  const r = await call('me');
  return r.ok ? (r.data.user ?? null) : null;
}

export async function signOut(): Promise<void> {
  await call('logout', {});
}

// ---------- the account area ----------

export async function saveProfile(profile: {
  first_name: string;
  last_name: string;
  phone: string;
  billing?: Address;
  shipping?: Address;
}): Promise<string | null> {
  return generic(await call('profile', profile), 'We could not save that. Please try again.');
}

export async function changePassword(
  current: string,
  password: string,
  confirm: string,
): Promise<string | null> {
  return generic(
    await call('password', { current, password, confirm }),
    'We could not change your password. Please try again.',
  );
}

export async function fetchOrders(): Promise<{ orders: OrderSummary[]; error: string | null }> {
  const r = await call('orders');
  if (!r.ok) return { orders: [], error: explain(r, 'We could not load your orders.') };
  return { orders: r.data.orders ?? [], error: null };
}

export async function fetchOrder(
  id: number,
): Promise<{ order: OrderDetail | null; error: string | null }> {
  const r = await call('order', undefined, `?id=${id}`);
  if (!r.ok || !r.data.order)
    return { order: null, error: explain(r, 'We could not load that order.') };
  return { order: r.data.order, error: null };
}

// ---------- business quote requests ----------

/** Sends a bulk quote request. error is a message to show, or null on success. */
export async function sendBusinessRequest(
  values: Record<string, string>,
): Promise<{ error: string | null; reference: string }> {
  const r = await call('business', {
    company: values.company,
    gstin: values.gstin,
    name: values.name,
    phone: values.phone,
    email: values.email,
    need: values.need,
    quantity: values.quantity,
    notes: values.notes,
    product: values.product,
  });
  if (!r.ok) {
    return {
      error: explain(r, 'We could not send your request. Please try again.'),
      reference: '',
    };
  }
  return { error: null, reference: String((r.data as { reference?: string }).reference ?? '') };
}

/** Sends a custom quote request (the quote page). error is a message to show, or null on success. */
export async function sendQuoteRequest(values: Record<string, string>): Promise<{
  error: string | null;
  reference: string;
  /** Present when the request had a file: lets the browser upload it. */
  ticket: { id: number; token: string; exp: number } | null;
}> {
  const r = await call('quote', values);
  if (!r.ok) {
    return {
      error: explain(r, 'We could not send your request. Please try again.'),
      reference: '',
      ticket: null,
    };
  }
  const d = r.data as {
    reference?: string;
    requestId?: number;
    uploadToken?: string;
    uploadExp?: number;
  };
  return {
    error: null,
    reference: String(d.reference ?? ''),
    ticket:
      d.uploadToken && d.requestId && d.uploadExp
        ? { id: d.requestId, token: d.uploadToken, exp: d.uploadExp }
        : null,
  };
}

// ---------- password reset ----------

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
