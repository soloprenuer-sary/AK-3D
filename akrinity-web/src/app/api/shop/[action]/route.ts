import {
  clientIp,
  json,
  limitIp,
  readServerEnv,
  sameOrigin,
  type ServerEnv,
} from '@/lib/server-kit';
import type {
  AddressIn,
  CartView,
  LineIn,
  PlaceReply,
  QuoteIn,
  QuoteReply,
  ViewItem,
  ViewRate,
} from '@/lib/shop-types';

/**
 * Cart and checkout between the browser and WooCommerce (Store API), so prices, GST, shipping and
 * stock are always the server's numbers and the browser never holds a WordPress token.
 *
 *   POST /api/shop/quote   make the WooCommerce cart match the lines, address, shipping choice and
 *                          payment choice sent, and return the totals
 *   POST /api/shop/place   the same, then place the order (cash on delivery, or Cashfree: the reply
 *                          carries the address to send the customer to for payment)
 *   POST /api/shop/lookup  one order by order key, or by order number plus the email or phone used
 *   POST /api/shop/request ask to cancel an order, or to return it (the studio approves; nothing is refunded here)
 *   POST /api/shop/invoice the GST invoice (PDF) of an order that has shipped
 *
 * The cart token lives in an httpOnly cookie. Environment (server only): WP_URL,
 * AKRINITY_SHARED_SECRET (for lookup), optional ALLOWED_ORIGINS, UPSTASH_REDIS_REST_URL and _TOKEN.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const COOKIE = 'akr_cart';
const MAX_BODY = 20000;

/**
 * Payment ways the storefront offers, from the ENABLED_PAYMENT_METHODS setting in Vercel (comma
 * separated, for example "cod,cashfree"). Both are on by default; remove one there to hide it.
 */
const enabledMethods = (): string[] =>
  (process.env.ENABLED_PAYMENT_METHODS ?? 'cod,cashfree')
    .split(',')
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean);
const MAX_LINES = 20;
const PHONE_RE = /^\+?\d{10,13}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const plain = (s: unknown): string =>
  String(s ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ---------- WooCommerce Store API ----------

interface WcReply {
  status: number;
  data: Record<string, unknown>;
  token: string;
  nonce: string;
}

interface Session {
  token: string;
  nonce: string;
}

async function wc(
  env: ServerEnv,
  s: Session,
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<WcReply> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (s.token) headers['Cart-Token'] = s.token;
  if (s.nonce) headers['Nonce'] = s.nonce;
  try {
    const res = await fetch(`${env.WP_URL}/wp-json/wc/store/v1${path}`, {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(25000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      status: res.status,
      data,
      token: res.headers.get('cart-token') ?? '',
      nonce: res.headers.get('nonce') ?? '',
    };
  } catch (e) {
    console.error('shop: WooCommerce did not answer', String(e));
    return { status: 0, data: {}, token: '', nonce: '' };
  }
}

const wcMessage = (r: WcReply, fallback: string): string => plain(r.data.message) || fallback;

function cookieToken(request: Request): string {
  const raw = request.headers.get('cookie') ?? '';
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`).exec(raw);
  return m ? decodeURIComponent(m[1]) : '';
}

const cartCookie = (token: string): string =>
  `${COOKIE}=${encodeURIComponent(token)}; Path=/api/shop; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 3600}`;

// ---------- reading the cart ----------

type Row = Record<string, unknown>;
const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);

function normalise(c: Row): CartView {
  const t = (c.totals ?? {}) as Row;
  const minor = Number(t.currency_minor_unit ?? 2);
  const m = (v: unknown): number => Math.round(Number(v ?? 0)) / 10 ** minor;

  const items: ViewItem[] = rows(c.items).map((i) => {
    const totals = (i.totals ?? {}) as Row;
    const qty = Number(i.quantity ?? 1);
    const line = m(totals.line_total) + m(totals.line_total_tax);
    const data = rows(i.item_data);
    const note = plain(data.find((d) => String(d.name ?? d.key) === 'Options')?.value);
    const imgs = rows(i.images);
    return {
      key: String(i.key ?? ''),
      id: Number(i.id ?? 0),
      name: plain(i.name),
      qty,
      unit: qty > 0 ? Math.round((line / qty) * 100) / 100 : line,
      line,
      note,
      image: String(imgs[0]?.thumbnail ?? imgs[0]?.src ?? ''),
    };
  });

  const packages = rows(c.shipping_rates);
  const rates: ViewRate[] = rows(packages[0]?.shipping_rates).map((r) => ({
    id: String(r.rate_id ?? ''),
    name: plain(r.name),
    cost: m(r.price) + m(r.taxes),
    selected: r.selected === true,
    delivery: plain(r.delivery_time),
  }));

  const subtotal = m(t.total_items) + m(t.total_items_tax);
  const discount = m(t.total_discount) + m(t.total_discount_tax);
  const taxes = rows(t.tax_lines).map((x) => ({ name: plain(x.name), amount: m(x.price) }));
  const ship = (c.shipping_address ?? {}) as Row;

  return {
    items,
    subtotal,
    discount,
    shipping: m(t.total_shipping) + m(t.total_shipping_tax),
    fees: rows(c.fees).map((f) => {
      const ft = (f.totals ?? {}) as Row;
      return { name: plain(f.name), amount: m(ft.total) + m(ft.total_tax) };
    }),
    taxes,
    tax: m(t.total_tax),
    total: m(t.total_price),
    rates,
    paymentMethods: (Array.isArray(c.payment_methods)
      ? (c.payment_methods as string[])
      : []
    ).filter((m) => enabledMethods().includes(m)),
    coupons: rows(c.coupons).map((x) => ({
      code: String(x.code ?? ''),
      amount: m(((x.totals ?? {}) as Row).total_discount),
    })),
    needsShipping: c.needs_shipping === true,
    addressKnown: Boolean(ship.state && ship.postcode),
  };
}

// ---------- input ----------

function cleanLines(v: unknown): LineIn[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > MAX_LINES) return null;
  const out: LineIn[] = [];
  for (const x of v) {
    if (!x || typeof x !== 'object') return null;
    const r = x as Record<string, unknown>;
    const id = String(r.id ?? '').replace(/\D/g, '');
    const qty = Number(r.qty);
    if (!id || !Number.isInteger(qty) || qty < 1 || qty > 100) return null;
    out.push({ id, qty, note: str(r.note, 300), mto: r.mto === true });
  }
  return out;
}

function cleanAddress(v: unknown): Partial<AddressIn> {
  if (!v || typeof v !== 'object') return {};
  const r = v as Record<string, unknown>;
  return {
    name: str(r.name, 80),
    phone: str(r.phone, 20).replace(/\s+/g, ''),
    email: str(r.email, 254).toLowerCase(),
    address1: str(r.address1, 120),
    address2: str(r.address2, 120),
    city: str(r.city, 60),
    state: str(r.state, 3).toUpperCase(),
    pincode: str(r.pincode, 6),
    company: str(r.company, 120),
    gstin: str(r.gstin, 15).toUpperCase(),
  };
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!(request.headers.get('Content-Type') ?? '').includes('application/json')) return null;
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  try {
    const d = JSON.parse(text);
    return d && typeof d === 'object' ? (d as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function wcAddress(a: Partial<AddressIn>, withEmail: boolean): Record<string, string> {
  const [first, ...rest] = (a.name ?? '').split(/\s+/).filter(Boolean);
  const out: Record<string, string> = {
    first_name: first ?? '',
    last_name: rest.join(' '),
    company: a.company ?? '',
    address_1: a.address1 ?? '',
    address_2: a.address2 ?? '',
    city: a.city ?? '',
    state: a.state ?? '',
    postcode: a.pincode ?? '',
    country: 'IN',
    phone: a.phone ?? '',
  };
  if (withEmail) out.email = a.email ?? '';
  return out;
}

// ---------- making the WooCommerce cart match ----------

interface Prepared {
  session: Session;
  cart: Row;
  problems: { id: string; message: string }[];
  couponMessage?: string;
}

/** Items already in the WooCommerce cart as "id|qty|note|mto", to see whether anything must change. */
const signature = (items: Row[]): string =>
  items
    .map((i) => {
      const opts = rows(i.item_data);
      const note = plain(opts.find((d) => String(d.name ?? d.key) === 'Options')?.value);
      const mto = opts.some((d) => String(d.name ?? d.key) === 'Made to order') ? 1 : 0;
      return `${i.id}|${i.quantity}|${note}|${mto}`;
    })
    .sort()
    .join(';');

async function prepare(
  env: ServerEnv,
  request: Request,
  q: QuoteIn,
): Promise<Prepared | { fail: Response }> {
  const first = await wc(env, { token: cookieToken(request), nonce: '' }, 'GET', '/cart');
  if (first.status !== 200 || !first.nonce) {
    return {
      fail: json({ error: 'The shop is not answering. Please try again in a minute.' }, 503),
    };
  }
  const s: Session = { token: first.token || cookieToken(request), nonce: first.nonce };
  let cart = first.data;
  const problems: { id: string; message: string }[] = [];
  /** Every change answers with the whole cart, so the newest answer is the final cart (no extra read needed). */
  const take = (r: WcReply) => {
    if (r.status > 0 && r.status < 400 && Array.isArray(r.data.items)) cart = r.data;
    if (r.token) s.token = r.token;
    if (r.nonce) s.nonce = r.nonce;
  };

  // 1. The items.
  const wanted = q.lines
    .map((l) => `${l.id}|${l.qty}|${l.note ?? ''}|${l.mto ? 1 : 0}`)
    .sort()
    .join(';');
  if (signature(rows(cart.items)) !== wanted) {
    for (const item of rows(cart.items)) {
      take(await wc(env, s, 'POST', '/cart/remove-item', { key: item.key }));
    }
    for (const l of q.lines) {
      const r = await wc(env, s, 'POST', '/cart/add-item', {
        id: Number(l.id),
        quantity: l.qty,
        akr_note: l.note ?? '',
        akr_mto: l.mto ? '1' : '0',
      });
      if (r.status === 0) return { fail: json({ error: 'The shop is not answering.' }, 503) };
      take(r);
      if (r.status >= 400) {
        problems.push({
          id: l.id,
          message: wcMessage(r, 'This item cannot be ordered online right now.'),
        });
      }
    }
  }

  // 2. Address (gives shipping options and the right GST for the state).
  const a = q.address ?? {};
  if (a.state && a.pincode && /^\d{6}$/.test(a.pincode)) {
    const r = await wc(env, s, 'POST', '/cart/update-customer', {
      billing_address: wcAddress({ ...a, name: a.name || 'Customer' }, true),
      shipping_address: wcAddress({ ...a, name: a.name || 'Customer' }, false),
    });
    take(r);
    if (r.status >= 400) problems.push({ id: '', message: wcMessage(r, 'Check the address.') });
  }

  // 3. Coupon.
  let couponMessage: string | undefined;
  if (q.removeCoupon)
    take(await wc(env, s, 'POST', '/cart/remove-coupon', { code: q.removeCoupon }));
  if (q.coupon) {
    const r = await wc(env, s, 'POST', '/cart/apply-coupon', { code: q.coupon });
    take(r);
    couponMessage =
      r.status >= 400 ? wcMessage(r, 'This coupon cannot be used.') : 'Coupon applied.';
  }

  // 4. Shipping option, payment choice.
  if (q.rate) {
    take(
      await wc(env, s, 'POST', '/cart/select-shipping-rate', { package_id: 0, rate_id: q.rate }),
    );
  }
  if (q.method && enabledMethods().includes(q.method)) {
    take(
      await wc(env, s, 'POST', '/cart/extensions', {
        namespace: 'akrinity',
        data: { method: q.method },
      }),
    );
  }

  return {
    session: { token: s.token, nonce: s.nonce },
    cart,
    problems,
    couponMessage,
  };
}

function readQuote(body: Record<string, unknown>): QuoteIn | null {
  const lines = cleanLines(body.lines);
  if (!lines) return null;
  return {
    lines,
    address: cleanAddress(body.address),
    rate: str(body.rate, 80),
    method: str(body.method, 30).replace(/[^a-z_]/g, ''),
    coupon: str(body.coupon, 40),
    removeCoupon: str(body.removeCoupon, 40),
  };
}

// ---------- actions ----------

async function handleQuote(request: Request, env: ServerEnv): Promise<Response> {
  const body = await readJson(request);
  const q = body ? readQuote(body) : null;
  if (!q) return json({ error: 'Your cart is empty or could not be read.', code: 'bad_cart' }, 400);
  const limited = await limitIp(env, request, 'shopq', { max: 120, window: 600 });
  if (limited) return limited;
  if (q.coupon) {
    const cl = await limitIp(env, request, 'coupon', { max: 10, window: 3600 });
    if (cl) return cl;
  }
  const p = await prepare(env, request, q);
  if ('fail' in p) return p.fail;
  const reply: QuoteReply = {
    cart: normalise(p.cart),
    problems: p.problems,
    couponMessage: p.couponMessage,
  };
  return json(reply, 200, { 'Set-Cookie': cartCookie(p.session.token) });
}

async function handlePlace(request: Request, env: ServerEnv): Promise<Response> {
  const body = await readJson(request);
  const q = body ? readQuote(body) : null;
  if (!body || !q)
    return json({ error: 'Your cart is empty or could not be read.', code: 'bad_cart' }, 400);
  const a = q.address ?? {};
  const field = (error: string, name: string) => json({ error, field: name }, 400);
  if (!a.name) return field('Enter your name so the courier knows who to deliver to.', 'name');
  if (!PHONE_RE.test(a.phone ?? '')) {
    return field('Enter a 10-digit mobile number, with or without +91.', 'phone');
  }
  if (!EMAIL_RE.test(a.email ?? '')) return field('Enter an email like name@example.com.', 'email');
  if (!a.address1) return field('Enter the delivery address.', 'address1');
  if (!a.city) return field('Enter your city.', 'city');
  if (!a.state) return field('Choose your state.', 'state');
  if (!/^\d{6}$/.test(a.pincode ?? '')) return field('Enter a 6-digit pincode.', 'pincode');
  if (a.gstin && !GSTIN_RE.test(a.gstin)) {
    return field('GSTIN should be 15 characters, for example 27ABCDE1234F1Z5.', 'gstin');
  }
  if (!q.method) return field('Choose how you want to pay.', 'method');
  if (body.terms !== true) {
    return field('Tick the box to agree to the terms, returns and file-use policy.', 'terms');
  }

  const limited = await limitIp(env, request, 'place', { max: 10, window: 900 });
  if (limited) return limited;

  const p = await prepare(env, request, q);
  if ('fail' in p) return p.fail;
  const cart = normalise(p.cart);
  if (p.problems.length > 0 || cart.items.length === 0) {
    return json(
      {
        error:
          p.problems[0]?.message ??
          'Some items in your cart cannot be ordered. Please review the cart.',
        code: 'cart_problem',
        cart,
        problems: p.problems,
      },
      409,
    );
  }
  if (!cart.paymentMethods.includes(q.method)) {
    return json(
      {
        error: 'This payment method is not available for your order. Please choose another.',
        code: 'method',
        cart,
      },
      409,
    );
  }
  if (cart.needsShipping && !cart.rates.some((r) => r.selected)) {
    return json(
      {
        error:
          cart.rates.length === 0
            ? 'We could not find a shipping option for this address yet. Please check the pincode and state, or contact us.'
            : 'Choose a delivery option.',
        code: 'shipping',
        cart,
      },
      409,
    );
  }

  const note = str(body.note, 500);
  const r = await wc(env, p.session, 'POST', '/checkout', {
    billing_address: wcAddress(a, true),
    shipping_address: wcAddress(a, false),
    customer_note: note,
    payment_method: q.method,
    payment_data: [],
    extensions: a.gstin ? { akrinity: { gstin: a.gstin } } : {},
  });
  if (r.status === 0) {
    return json(
      {
        error:
          'The order is taking longer than usual. Please do not pay again yet: check your email in a minute, or contact us with your phone number.',
        code: 'slow',
      },
      503,
    );
  }
  if (r.status >= 400) {
    console.error('shop: checkout failed', r.status, String(r.data.code ?? ''), clientIp(request));
    return json(
      { error: wcMessage(r, 'We could not place the order. Please try again.'), code: 'checkout' },
      r.status >= 500 ? 503 : 400,
      {},
    );
  }
  const pay = (r.data.payment_result ?? {}) as Row;
  const paymentStatus = String(pay.payment_status ?? '');
  if (paymentStatus === 'failure') {
    return json(
      {
        error: 'The payment could not be started. Please try again or choose another way to pay.',
        code: 'payment',
      },
      502,
    );
  }
  const reply: PlaceReply = {
    orderId: Number(r.data.order_id ?? 0),
    key: String(r.data.order_key ?? ''),
    number: String(r.data.order_number ?? r.data.order_id ?? ''),
    status: String(r.data.status ?? ''),
    redirect: String(pay.redirect_url ?? ''),
  };
  return json(reply, 201, { 'Set-Cookie': cartCookie(p.session.token) });
}

async function handleLookup(request: Request, env: ServerEnv): Promise<Response> {
  const body = await readJson(request);
  if (!body) return json({ error: 'Something went wrong. Reload the page and try again.' }, 400);
  const order = str(body.order, 20).replace(/\D/g, '');
  const key = str(body.key, 60);
  const contact = str(body.contact, 254);
  if (!order || (!key && !contact)) {
    return json({ error: 'Enter your order number and the email or phone used.' }, 400);
  }
  const limited = await limitIp(env, request, 'lookup', { max: 15, window: 900 });
  if (limited) return limited;
  if (!env.AKRINITY_SHARED_SECRET) return json({ error: 'Order lookup is not set up.' }, 503);
  try {
    const res = await fetch(`${env.WP_URL}/wp-json/akrinity/v1/order-lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Akrinity-Key': env.AKRINITY_SHARED_SECRET },
      body: JSON.stringify({ order, key, contact }),
      cache: 'no-store',
      signal: AbortSignal.timeout(25000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 404) {
      return json(
        {
          error:
            'We could not find an order with those details. Check the number and the email or phone.',
          code: 'not_found',
        },
        404,
      );
    }
    if (!res.ok) return json({ error: 'Order lookup is not available right now.' }, 503);
    return json(data);
  } catch {
    return json({ error: 'Order lookup is not available right now.' }, 503);
  }
}

const REQUEST_REASONS = [
  'faulty',
  'wrong_item',
  'not_as_described',
  'changed_mind',
  'ordered_by_mistake',
  'other',
];

const REQUEST_ERRORS: Record<string, string> = {
  not_found: 'We could not find that order. Reload the page and try again.',
  not_cancellable:
    'This order has already been shipped, so it cannot be cancelled. You can ask for a return once it arrives.',
  not_delivered_yet: 'A return can be requested once the order has shipped.',
  return_window_closed: 'The 7-day return window for this order has passed. Please contact us.',
  made_to_order:
    'Made-to-order and personalised items can be returned only when they arrive faulty. Choose "It arrived faulty or damaged" or contact us.',
  invalid: 'Please choose a reason and try again.',
  busy: 'Too many requests right now. Please try again in an hour or contact us.',
};

/** Ask the studio to cancel or return an order. Nothing is cancelled or refunded here: the studio approves it. */
async function handleRequest(request: Request, env: ServerEnv): Promise<Response> {
  const body = await readJson(request);
  if (!body) return json({ error: 'Something went wrong. Reload the page and try again.' }, 400);
  if (str(body.website, 100)) return json({ ok: true }); // the hidden trap field: a bot filled it in
  const order = str(body.order, 20).replace(/\D/g, '');
  const key = str(body.key, 60);
  const contact = str(body.contact, 254);
  const type = str(body.type, 10);
  const reason = str(body.reason, 40);
  const note = str(body.note, 1000);
  if (!order || (!key && !contact) || !['cancel', 'return'].includes(type)) {
    return json({ error: 'Something went wrong. Reload the page and try again.' }, 400);
  }
  if (!REQUEST_REASONS.includes(reason)) return json({ error: REQUEST_ERRORS.invalid }, 400);
  const limited = await limitIp(env, request, 'order-request', { max: 5, window: 3600 });
  if (limited) return limited;
  if (!env.AKRINITY_SHARED_SECRET) return json({ error: 'Requests are not set up.' }, 503);
  try {
    const res = await fetch(`${env.WP_URL}/wp-json/akrinity/v1/order-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Akrinity-Key': env.AKRINITY_SHARED_SECRET },
      body: JSON.stringify({ order, key, contact, type, reason, note }),
      cache: 'no-store',
      signal: AbortSignal.timeout(25000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) return json({ ok: true, reference: String(data.reference ?? '') });
    const code = String(data.code ?? '');
    if (code === 'already_requested') {
      return json(
        {
          error: `We already have a request for this order (${String(data.reference ?? 'reference sent by email')}). We will reply by email.`,
          code,
        },
        409,
      );
    }
    return json(
      { error: REQUEST_ERRORS[code] ?? 'The request could not be sent. Please try again.', code },
      res.status === 404 ? 404 : res.status === 409 ? 409 : 503,
    );
  } catch {
    return json({ error: 'The request could not be sent. Please try again.' }, 503);
  }
}

/** The GST invoice for an order, as a PDF download. */
/** Forwards a cart with its email to WordPress, which keeps it for the abandoned-cart reminder. */
async function handleCartSync(request: Request, env: ServerEnv): Promise<Response> {
  const body = await readJson(request);
  const email = str(body?.email, 254).toLowerCase();
  if (!body || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false }, 400);
  const raw = Array.isArray(body.lines) ? body.lines.slice(0, 30) : [];
  const lines = raw
    .filter((l): l is Record<string, unknown> => !!l && typeof l === 'object')
    .map((l) => ({
      id: str(l.id, 40),
      slug: str(l.slug, 200),
      name: str(l.name, 200),
      qty: Math.max(1, Math.min(100, Number(l.qty) || 1)),
      price: str(l.price, 40),
      image: str(l.image, 500),
      mode: str(l.mode, 20),
      madeToOrder: l.madeToOrder === true,
    }));
  const limited = await limitIp(env, request, 'cart-sync', { max: 60, window: 900 });
  if (limited) return limited;
  if (!env.AKRINITY_SHARED_SECRET || !env.WP_URL) return json({ ok: false }, 503);
  try {
    await fetch(`${env.WP_URL}/wp-json/akrinity/v1/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Akrinity-Key': env.AKRINITY_SHARED_SECRET },
      body: JSON.stringify({ email, name: str(body.name, 120), lines }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    // The shopper's checkout must never wait on this; a missed save only means no reminder.
  }
  return json({ ok: true });
}

/** Reads a saved cart for the "get my cart back" link. */
async function handleCartRestore(request: Request, env: ServerEnv): Promise<Response> {
  const body = await readJson(request);
  const token = str(body?.token, 200);
  if (!token || token.length < 20) return json({ error: 'This link is not valid.' }, 400);
  const limited = await limitIp(env, request, 'cart-restore', { max: 20, window: 900 });
  if (limited) return limited;
  if (!env.AKRINITY_SHARED_SECRET || !env.WP_URL) return json({ error: 'Not available.' }, 503);
  try {
    const res = await fetch(`${env.WP_URL}/wp-json/akrinity/v1/cart/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Akrinity-Key': env.AKRINITY_SHARED_SECRET },
      body: JSON.stringify({ token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
      return json({ error: 'This cart link has expired or the order was already placed.' }, 404);
    const data = (await res.json()) as { lines?: Record<string, unknown>[] };
    return json({ lines: Array.isArray(data.lines) ? data.lines : [] });
  } catch {
    return json({ error: 'Not available right now. Please try again.' }, 503);
  }
}

async function handleInvoice(request: Request, env: ServerEnv): Promise<Response> {
  const body = await readJson(request);
  if (!body) return json({ error: 'Something went wrong. Reload the page and try again.' }, 400);
  const order = str(body.order, 20).replace(/\D/g, '');
  const key = str(body.key, 60);
  const contact = str(body.contact, 254);
  if (!order || (!key && !contact)) {
    return json({ error: 'Something went wrong. Reload the page and try again.' }, 400);
  }
  const limited = await limitIp(env, request, 'order-invoice', { max: 20, window: 900 });
  if (limited) return limited;
  if (!env.AKRINITY_SHARED_SECRET) return json({ error: 'Invoices are not set up.' }, 503);
  try {
    const qs = new URLSearchParams({ order });
    if (key) qs.set('key', key);
    else qs.set('contact', contact);
    const res = await fetch(`${env.WP_URL}/wp-json/akrinity/v1/order-invoice?${qs}`, {
      headers: { 'X-Akrinity-Key': env.AKRINITY_SHARED_SECRET },
      cache: 'no-store',
      signal: AbortSignal.timeout(40000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 409 || data.code === 'not_yet') {
      return json(
        { error: 'Your invoice is ready once your order has shipped.', code: 'not_yet' },
        409,
      );
    }
    if (res.status === 404) {
      return json({ error: 'We could not find that order.', code: 'not_found' }, 404);
    }
    if (!res.ok || typeof data.pdf !== 'string') {
      return json(
        { error: 'The invoice is not available right now. Please try again later.' },
        503,
      );
    }
    const bytes = Buffer.from(data.pdf, 'base64');
    const name = String(data.filename ?? 'Akrinity-invoice.pdf').replace(/[^A-Za-z0-9._-]/g, '-');
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch {
    return json({ error: 'The invoice is not available right now. Please try again later.' }, 503);
  }
}

type RouteContext = { params: Promise<{ action: string }> };

export async function POST(request: Request, ctx: RouteContext): Promise<Response> {
  const env = readServerEnv();
  const { action } = await ctx.params;
  if (!env.WP_URL) return json({ error: 'The shop is not configured.' }, 503);
  if (!sameOrigin(request, env)) {
    return json(
      {
        error: 'This request was blocked for your safety. Reload the page and try again.',
        code: 'blocked',
      },
      403,
    );
  }
  if (action === 'quote') return handleQuote(request, env);
  if (action === 'place') return handlePlace(request, env);
  if (action === 'lookup') return handleLookup(request, env);
  if (action === 'request') return handleRequest(request, env);
  if (action === 'invoice') return handleInvoice(request, env);
  if (action === 'cart') return handleCartSync(request, env);
  if (action === 'cart-restore') return handleCartRestore(request, env);
  return json({ error: 'Not found.' }, 404);
}

export function GET(): Response {
  return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
}
