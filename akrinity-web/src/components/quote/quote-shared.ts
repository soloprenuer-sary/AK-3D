import { formatRupees } from '@/lib/cart-store';
import type { QuoteView } from '@/lib/auth-client';

/** Money from the backend, which may be a number or text such as "4,041,929.52". */
export function money(v: number | string | undefined): string {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? formatRupees(n) : '';
}

/** Where a quote stands, from the status text the backend sends (VERIFY the exact words live). */
export type QuoteStage = 'open' | 'awaiting' | 'paid' | 'closed';

export function stageOf(q: QuoteView): QuoteStage {
  const s = String(q.status ?? '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
  if (s === 'awaiting-payment') return 'awaiting';
  if (['cancelled', 'refunded', 'returned'].includes(s)) return 'closed';
  if (
    [
      'paid',
      'in-production',
      'ready',
      'ready-to-ship',
      'shipped',
      'in-transit',
      'completed',
    ].includes(s)
  )
    return 'paid';
  return 'open';
}

/** Only an https link goes to the payment page. */
export const safePayUrl = (u: string | undefined): string => (u && /^https:\/\//i.test(u) ? u : '');

/** The signed link from the email, read from the page address. */
export function readLink(sp: { ref?: string; exp?: string; token?: string }) {
  return { ref: sp.ref ?? '', exp: sp.exp ?? '', token: sp.token ?? '' };
}
