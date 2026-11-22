/**
 * Values only the owner knows. Each one comes from a setting in Vercel (Settings > Environment Variables),
 * so nothing has to be edited in the code. While a value is not set, the line that needs it is left out of
 * the page instead of showing a [placeholder] to customers.
 *
 *   NEXT_PUBLIC_SITE_URL           the live address, for example https://akrinity.in
 *   NEXT_PUBLIC_WHATSAPP           the WhatsApp number with country code, for example 919876543210
 *   NEXT_PUBLIC_SUPPORT_EMAIL      the support email address
 *   NEXT_PUBLIC_GSTIN              the shop's GSTIN
 *   NEXT_PUBLIC_FREE_SHIPPING_FROM free shipping from this cart value in rupees, for example 999
 *   NEXT_PUBLIC_STUDIO_ADDRESS     the studio address, shown with the map and used to centre it
 *   NEXT_PUBLIC_REPLY_HOURS        usual reply time in hours, for example 4
 *   NEXT_PUBLIC_PRINT_DAYS         working days to print and pack (default 2)
 *   NEXT_PUBLIC_DELIVERY_DAYS      working days from dispatch to delivery (default 5)
 *   NEXT_PUBLIC_ONLINE_PAYMENTS    1 once Cashfree is switched on (changes the "UPI, cards" wording)
 */

const text = (v: string | undefined): string => (v ?? '').trim();
const num = (v: string | undefined, fallback: number): number => {
  const n = Number(text(v));
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

function liveAddress(): string {
  const set = text(process.env.NEXT_PUBLIC_SITE_URL);
  if (set && !/localhost/.test(set)) return set.replace(/\/$/, '');
  const vercel = text(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercel) return `https://${vercel}`;
  return 'https://ak-3-d.vercel.app';
}

const whatsappDigits = text(process.env.NEXT_PUBLIC_WHATSAPP).replace(/\D/g, '');

export const site = {
  name: 'Akrinity',
  url: liveAddress(),
  whatsappDigits,
  /** "+91 98765 43210" style text for display. */
  whatsappText: whatsappDigits
    ? whatsappDigits.length === 12
      ? `+${whatsappDigits.slice(0, 2)} ${whatsappDigits.slice(2, 7)} ${whatsappDigits.slice(7)}`
      : `+${whatsappDigits}`
    : '',
  whatsappLink: whatsappDigits ? `https://wa.me/${whatsappDigits}` : '',
  supportEmail: text(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
  gstin: text(process.env.NEXT_PUBLIC_GSTIN).toUpperCase(),
  freeShippingFrom: num(process.env.NEXT_PUBLIC_FREE_SHIPPING_FROM, 0),
  studioAddress: text(process.env.NEXT_PUBLIC_STUDIO_ADDRESS),
  replyHours: num(process.env.NEXT_PUBLIC_REPLY_HOURS, 0),
  printDays: num(process.env.NEXT_PUBLIC_PRINT_DAYS, 2),
  deliveryDays: num(process.env.NEXT_PUBLIC_DELIVERY_DAYS, 5),
  onlinePayments: text(process.env.NEXT_PUBLIC_ONLINE_PAYMENTS) === '1',
} as const;

/** Working days (Monday to Saturday) after a date. */
export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) left--;
  }
  return d;
}

/** The ways to pay, as one line. */
export const paymentLine = site.onlinePayments
  ? 'UPI · Cards · Netbanking · Cash on Delivery'
  : 'Cash on Delivery across India';
