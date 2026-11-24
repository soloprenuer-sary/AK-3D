/** Shapes shared by the checkout page and the /api/shop route. Money is in rupees. */

export interface LineIn {
  /** Product id as the store keeps it, for example "wc-281". */
  id: string;
  qty: number;
  /** Chosen options for the print shop, for example "Single colour · PLA+ · white · Medium". */
  note?: string;
  /** Made to order: cash on delivery is not offered. */
  mto?: boolean;
}

export interface AddressIn {
  name: string;
  phone: string;
  email: string;
  address1: string;
  address2?: string;
  city: string;
  /** Two-letter state code used by WooCommerce, for example MH. */
  state: string;
  pincode: string;
  company?: string;
  gstin?: string;
}

export interface QuoteIn {
  lines: LineIn[];
  address?: Partial<AddressIn>;
  /** Shipping option the customer picked. */
  rate?: string;
  /** Payment method id: cashfree or cod. */
  method?: string;
  coupon?: string;
  removeCoupon?: string;
}

export interface ViewItem {
  key: string;
  id: number;
  name: string;
  qty: number;
  unit: number;
  line: number;
  note: string;
  image: string;
}

export interface ViewRate {
  id: string;
  name: string;
  cost: number;
  selected: boolean;
  delivery: string;
}

export interface CartView {
  items: ViewItem[];
  /** Item prices before any coupon, GST included. */
  subtotal: number;
  discount: number;
  shipping: number;
  fees: { name: string; amount: number }[];
  /** GST lines, for example CGST and SGST for Maharashtra or IGST for other states. These are already inside the total. */
  taxes: { name: string; amount: number }[];
  tax: number;
  total: number;
  rates: ViewRate[];
  paymentMethods: string[];
  coupons: { code: string; amount: number }[];
  needsShipping: boolean;
  /** True when the server could work out shipping for the address given. */
  addressKnown: boolean;
}

export interface QuoteReply {
  cart: CartView;
  /** Items the store refused (out of stock, removed), with a message for the customer. */
  problems: { id: string; message: string }[];
  /** A message about the coupon, when one was tried. */
  couponMessage?: string;
}

export interface PlaceReply {
  orderId: number;
  key: string;
  number: string;
  status: string;
  /** Where to send the customer to pay (Cashfree). Empty for cash on delivery. */
  redirect: string;
}

export interface OrderLookup {
  id: number;
  number: string;
  status: string;
  status_label: string;
  date: string;
  date_paid: string;
  is_paid: boolean;
  payment_method: string;
  payment_title: string;
  items: { name: string; quantity: number; total: string; meta: string[] }[];
  subtotal: string;
  shipping_total: string;
  discount_total: string;
  fees: { name: string; total: string }[];
  taxes: { label: string; amount: string }[];
  total: string;
  name: string;
  city: string;
  state: string;
  tracking: { courier: string; awb: string; url: string; eta?: string; shipped_at?: number };
  email: string;
  pay_url?: string;
  /** The customer's cancel or return request on this order, or null. While open is true, show the label instead of the form. */
  request?: {
    type: 'cancel' | 'return';
    state: 'requested' | 'approved' | 'received' | 'closed';
    label: string;
    open: boolean;
    at?: number;
  } | null;
}

/** Indian states and union territories with the codes WooCommerce uses. */
export const STATES: { code: string; name: string }[] = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'CT', name: 'Chhattisgarh' },
  { code: 'DN', name: 'Dadra and Nagar Haveli' },
  { code: 'DD', name: 'Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OD', name: 'Odisha' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TS', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
];

export const METHOD_LABEL: Record<string, string> = {
  cashfree: 'UPI, cards and netbanking',
  cod: 'Cash on delivery',
};

/** Why a customer cancels or returns an order. The code is what WordPress expects. */
export const ORDER_REASONS: { code: string; label: string; forReturn?: boolean }[] = [
  { code: 'ordered_by_mistake', label: 'I ordered by mistake' },
  { code: 'changed_mind', label: 'I changed my mind' },
  { code: 'faulty', label: 'It arrived faulty or damaged', forReturn: true },
  { code: 'wrong_item', label: 'I received the wrong item', forReturn: true },
  { code: 'not_as_described', label: 'It is not as described', forReturn: true },
  { code: 'other', label: 'Another reason' },
];
