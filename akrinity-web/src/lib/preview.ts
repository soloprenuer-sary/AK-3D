/**
 * Draft preview of a product. WordPress gives the editor a signed, 24-hour link to
 * /api/preview?id=&exp=&token=. The route checks the link with WordPress (server to server, with the
 * shared key, which never reaches the browser), keeps the three values in a short-lived cookie, and
 * the preview page fetches the draft again on every view. Nothing from a preview is cached.
 */
import type { StoreProduct } from './wp';

export const PREVIEW_COOKIE = 'akr_preview';

export interface PreviewTicket {
  id: number;
  exp: number;
  token: string;
}

/** Reads "id.exp.token" back into its parts, or null if it is not well formed. */
export function parseTicket(raw: string | undefined | null): PreviewTicket | null {
  if (!raw) return null;
  const [id, exp, token] = raw.split('.');
  const t = { id: Number(id), exp: Number(exp), token: token ?? '' };
  if (!Number.isInteger(t.id) || t.id < 1 || !Number.isInteger(t.exp) || t.exp < 1) return null;
  if (!/^[A-Za-z0-9_-]{16,200}$/.test(t.token)) return null;
  return t;
}

export interface PreviewResult {
  status: number;
  product?: StoreProduct;
}

/** Asks WordPress for the draft. 200 carries the product in the same shape as a Store API product. */
export async function fetchPreview(t: PreviewTicket): Promise<PreviewResult> {
  const base = (process.env.WP_URL ?? '').replace(/\/$/, '');
  const key = process.env.AKRINITY_SHARED_SECRET ?? '';
  if (!base || key.length < 32) return { status: 503 };
  try {
    const url =
      `${base}/wp-json/akrinity/v1/preview/product` +
      `?id=${t.id}&exp=${t.exp}&token=${encodeURIComponent(t.token)}`;
    const res = await fetch(url, {
      headers: { 'X-Akrinity-Key': key },
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
    if (res.status !== 200) return { status: res.status };
    return { status: 200, product: (await res.json()) as StoreProduct };
  } catch {
    return { status: 502 };
  }
}

/** A short explanation for each way a preview can fail. */
export function previewProblem(status: number): string {
  if (status === 403) return 'This preview link is not valid. Press Preview again in WordPress.';
  if (status === 410)
    return 'This preview link has expired (links last 24 hours). Press Preview again in WordPress.';
  if (status === 404) return 'That product was not found.';
  if (status === 401 || status === 503) return 'Previews are not set up on this site yet.';
  return 'The preview is not available right now. Please try again in a minute.';
}

/** True when the link's expiry time has passed. */
export function isExpired(t: PreviewTicket): boolean {
  return t.exp * 1000 < Date.now();
}
