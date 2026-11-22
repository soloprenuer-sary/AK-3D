import type { CartLine } from './cart-store';
import { MODE_LABEL } from './shop-data';
import type { LineIn, OrderLookup, PlaceReply, QuoteIn, QuoteReply } from './shop-types';

/** Browser side of /api/shop: the cart and checkout talk to WooCommerce through it. */

export type ShopResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number; data: Record<string, unknown> };

async function post<T>(action: string, payload: unknown): Promise<ShopResult<T>> {
  let res: Response;
  try {
    res = await fetch(`/api/shop/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    return {
      ok: false,
      status: 0,
      data: {},
      error: 'We could not reach the website. Check your internet connection and try again.',
    };
  }
  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  const data = isJson ? ((await res.json().catch(() => ({}))) as Record<string, unknown>) : {};
  if (res.ok) return { ok: true, data: data as T };
  const error =
    typeof data.error === 'string'
      ? data.error
      : res.status === 429
        ? 'Too many attempts. Please wait a few minutes and try again.'
        : 'Something went wrong on our side. Please try again in a few minutes.';
  return { ok: false, status: res.status, data, error };
}

/** The cart lines in the form the server needs. */
export function toLines(lines: CartLine[]): LineIn[] {
  return lines.map((l) => ({
    id: l.id,
    qty: l.qty,
    note: [MODE_LABEL[l.mode], l.detail].filter(Boolean).join(' · '),
    mto: l.madeToOrder,
  }));
}

export const quoteCart = (q: QuoteIn) => post<QuoteReply>('quote', q);

export const placeOrder = (q: QuoteIn & { note?: string; terms: boolean }) =>
  post<PlaceReply>('place', q);

export const lookupOrder = (q: { order: string; key?: string; contact?: string }) =>
  post<OrderLookup>('lookup', q);
