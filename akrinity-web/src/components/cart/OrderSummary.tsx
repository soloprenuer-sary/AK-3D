'use client';

import { formatRupees, parsePrice, useCart } from '@/lib/cart-store';

/** Totals box shared by the cart and checkout. Shipping and final tax come from the server later. */
export function OrderSummary({ showItems = false }: { showItems?: boolean }) {
  const { lines, subtotal } = useCart();
  const money = (n: number | null) => (n === null ? '₹[price]' : formatRupees(n));

  return (
    <aside className="order-summary" aria-label="Order summary">
      <h2 className="d">Order summary</h2>
      {showItems && (
        <ul className="sum-lines">
          {lines.map((l) => {
            const unit = parsePrice(l.price);
            return (
              <li key={l.key}>
                <span>
                  {l.name} ×{l.qty}
                </span>
                <b>{money(unit === null ? null : unit * l.qty)}</b>
              </li>
            );
          })}
        </ul>
      )}
      <dl className="sum-rows">
        <div>
          <dt>Subtotal</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>Shown at checkout</dd>
        </div>
        <div>
          <dt>GST</dt>
          <dd>Included in prices</dd>
        </div>
        <div className="sum-total">
          <dt>Total</dt>
          <dd>{money(subtotal)}</dd>
        </div>
      </dl>
      <p className="meta">
        Prices include GST. At checkout you choose your state and the exact GST (CGST and SGST in
        Maharashtra, IGST elsewhere), shipping and payment are shown before you pay.
      </p>
    </aside>
  );
}
