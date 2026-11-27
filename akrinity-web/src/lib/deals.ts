/**
 * Cart offers and upsells set in WooCommerce (Marketing > Offers and upsell). WooCommerce works out
 * the discount and delivery price itself; this only reads the settings so the site can tell the
 * customer about them. Public data, no login.
 */

/** The code WooCommerce uses for the automatic discount on a cart. */
export const DEAL_CODE = 'akr-offer';

export interface Deals {
  percent: number;
  percentMin: number;
  freeshipMin: number;
  /** Buy `buy`, get `free` of the cheapest free, on these products. Empty list: offer off. */
  bogo: { buy: number; free: number; productIds: string[] };
  upsellIds: string[];
}

export interface RawDeals {
  percent?: number;
  percent_min?: number;
  freeship_min?: number;
  bogo?: { buy?: number; free?: number; product_ids?: number[] };
  upsell_ids?: number[];
}

export const NO_DEALS: Deals = {
  percent: 0,
  percentMin: 0,
  freeshipMin: 0,
  bogo: { buy: 0, free: 0, productIds: [] },
  upsellIds: [],
};

const num = (v: unknown): number => (Number(v) > 0 ? Number(v) : 0);
const ids = (v: unknown): string[] => (Array.isArray(v) ? v.map((n) => `wc-${n}`) : []);

export function mapDeals(raw: RawDeals): Deals {
  return {
    percent: num(raw?.percent),
    percentMin: num(raw?.percent_min),
    freeshipMin: num(raw?.freeship_min),
    bogo: {
      buy: num(raw?.bogo?.buy),
      free: num(raw?.bogo?.free),
      productIds: ids(raw?.bogo?.product_ids),
    },
    upsellIds: ids(raw?.upsell_ids),
  };
}

/** The offers, read on the server. A page still builds if WordPress does not answer. */
export async function getDeals(): Promise<Deals> {
  const base = (process.env.NEXT_PUBLIC_WC_STORE_API_URL ?? '').replace(/\/wc\/store\/v1\/?$/, '');
  if (!base) return NO_DEALS;
  try {
    const res = await fetch(`${base}/akrinity/v1/deals`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    });
    return res.ok ? mapDeals((await res.json()) as RawDeals) : NO_DEALS;
  } catch {
    return NO_DEALS;
  }
}

const rupees = (n: number): string => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const bogoLabel = (d: Deals): string => `Buy ${d.bogo.buy} get ${d.bogo.free} free`;

export const inBogo = (d: Deals, productId: string): boolean =>
  d.bogo.productIds.includes(productId);

/** One line for the top bar, or an empty string when no offer is on. */
export function offerHeadline(d: Deals): string {
  const parts: string[] = [];
  if (d.bogo.productIds.length) parts.push(`${bogoLabel(d)} on selected items`);
  if (d.percent) {
    parts.push(
      d.percentMin ? `${d.percent}% off from ${rupees(d.percentMin)}` : `${d.percent}% off`,
    );
  }
  if (d.freeshipMin) parts.push(`Free delivery from ${rupees(d.freeshipMin)}`);
  return parts.join(' · ');
}

export interface CartOffer {
  /** What the cart already earns, and what to add for the next offer. */
  message: string;
  /** Progress to the highest offer value; max is 0 when there is no value to reach. */
  value: number;
  max: number;
}

/** What the cart earns, from the product prices (GST included). Checkout has the final figures. */
export function cartOffer(
  d: Deals,
  lines: { id: string; qty: number; unit: number }[],
): CartOffer | null {
  const subtotal = lines.reduce((sum, l) => sum + l.unit * l.qty, 0);
  const eligible = lines
    .filter((l) => inBogo(d, l.id))
    .flatMap((l) => Array<number>(l.qty).fill(l.unit))
    .sort((a, b) => a - b);
  const group = d.bogo.buy + d.bogo.free;
  const freeCount = group > 0 ? Math.floor(eligible.length / group) * d.bogo.free : 0;
  const freeValue = eligible.slice(0, freeCount).reduce((a, b) => a + b, 0);
  const left = Math.round((subtotal - freeValue) * 100) / 100;

  const goals = [
    ...(d.percent ? [{ at: d.percentMin, name: `${d.percent}% off` }] : []),
    ...(d.freeshipMin ? [{ at: d.freeshipMin, name: 'free delivery' }] : []),
  ];
  const earned = goals.filter((g) => left >= g.at).map((g) => g.name);
  if (freeCount) earned.unshift(`${freeCount} ${freeCount === 1 ? 'item' : 'items'} free`);
  const next = goals.filter((g) => left < g.at).sort((a, b) => a.at - b.at)[0];

  const text: string[] = [];
  if (earned.length) text.push(`You get ${earned.join(' and ')} at checkout.`);
  if (next) {
    const names = goals.filter((g) => g.at === next.at).map((g) => g.name);
    text.push(`Add ${rupees(Math.ceil(next.at - left))} more for ${names.join(' and ')}.`);
  }
  if (eligible.length && eligible.length % group) {
    const more = group - (eligible.length % group);
    text.push(
      `Add ${more} more offer ${more === 1 ? 'item' : 'items'} for ${bogoLabel(d).toLowerCase()}.`,
    );
  }
  if (!text.length) return null;
  const max = Math.max(0, ...goals.map((g) => g.at));
  return { message: text.join(' '), value: Math.min(left, max), max };
}
