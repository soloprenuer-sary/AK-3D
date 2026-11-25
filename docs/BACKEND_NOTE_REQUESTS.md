# Frontend note: quote accept, cancel or return request, reminder emails

From the WordPress side (2026-11-22). Live on `admin.akrinity.in` in the new must-use file `akrinity-requests.php` v1.0.0. It is separate from the other Akrinity files, so nothing in them changed. No new settings. All three routes need the shared key (`X-Akrinity-Key`), so call them from the storefront server, never from the browser.

## 1. Quote reply, accept link and payment (updated 2026-11-24, file `akrinity-quotes.php` v1.0.0)

The studio opens a quote request in WordPress, adds quote lines (what, why, amount before GST), the lead time and a note, and presses **Send quote**. The customer gets an email with the price, the reasons ("Why this price"), GST, the total and an **Accept this quote** button that opens:

```
{storefront}/quote/accept?ref=QR-306&exp=1795972248&token=<signature>
```

The link is valid for 7 days (`AKRINITY_QUOTE_DAYS`). A revised or withdrawn quote makes older links stop working (`bad_token`).

### What to build: page `/quote/accept`

1. Server call to show the quote:

   ```
   GET {WP}/wp-json/akrinity/v1/quote/view?ref=<ref>&exp=<exp>&token=<token>
   Header: X-Akrinity-Key: <AKRINITY_SHARED_SECRET>
   ```

   `200`:
   ```json
   { "ref": "QR-306", "name": "Meera Rao", "summary": "Wall bracket · PLA+ · Qty 2",
     "lines": [ { "label": "Printing", "reason": "PLA+ black, 142 g, 6 h 40 min", "amount": 640 } ],
     "subtotal": "800.00", "gst": "144.00", "gst_pct": 18, "price": "944.00",
     "lead": "5 working days", "message": "Note from the studio", "expires": 1795972248,
     "status": "quoted", "accepted": false, "pay_url": "" }
   ```
   Show the lines as "Why this price", then subtotal, GST and the total (`price`, rupees including GST), `lead`, `message` and an **Accept** button. Collect the **delivery address** on this page (name is known; ask for address lines, city, state and PIN) and send it with the accept call. When `accepted` is true, show "You accepted this quote". If `pay_url` is not empty, show a **Pay now** button to it (the same link as in the email).
   Errors: `401` wrong or missing key, `403 {"code":"bad_token"}` ("This quote was replaced or withdrawn. Check your email for the latest."), `404 not_found`, `410 {"code":"expired"}`.

2. When the customer presses Accept:

   ```
   POST {WP}/wp-json/akrinity/v1/quote/accept
   Header: X-Akrinity-Key
   Body: { "ref": "...", "exp": 123, "token": "...",
           "address": { "line1": "...", "line2": "...", "city": "...", "state": "KA", "pincode": "560038" } }
   ```
   `state` is the WooCommerce state code for India (KA, MH, ...). `address` is optional. `200 { "ok": true, "quote": { ...same shape..., "status": "awaiting_payment", "accepted": true, "pay_url": "https://admin.akrinity.in/checkout/order-pay/..." } }`. Repeating the call is safe. Accepting **makes a WooCommerce order at the quoted price** and emails the customer the payment link; nothing is charged until they pay. After the call, redirect the customer to `quote.pay_url` (or show the button): it is the WooCommerce payment page, which takes Cashfree when it is enabled.

Send `noindex` on this page.

**Switch:** until this page is live, the quote email has no Accept button; it asks the customer to reply to approve, and the studio sets Awaiting payment by hand. When the page is live, the studio's wp-config gets `define( 'AKRINITY_QUOTE_ACCEPT_PAGE', true );` and the button comes back. Tell the backend when `/quote/accept` is deployed.

### Every status sends an email (no frontend work)

The studio moves the request through the statuses in WordPress and the customer gets the matching email: Received, In review, Quote, Awaiting payment (with the payment link), Paid (when the payment goes through, or the studio sets it), In production, Ready to ship, Shipped (partner, tracking ID, ETA, GST invoice PDF attached), Completed (order closed) and Cancelled, Refunded, Returned. A tick box on the request lets the studio change a status without emailing.

## 2. Cancel or return request

```
POST {WP}/wp-json/akrinity/v1/order-request
Header: X-Akrinity-Key
Body: { "order": "302", "contact": "email or phone used on the order"  (or "key": "<order key>"),
        "type": "cancel" | "return",
        "reason": "faulty" | "wrong_item" | "not_as_described" | "changed_mind" | "ordered_by_mistake" | "other",
        "note": "optional, up to 1000 characters" }
```

`200 { "ok": true, "reference": "#302", "order": "302" }`. **Changed 25 Nov 2026:** there is no separate record or CM-number any more. The request stays on the WooCommerce order (an order note, a flag, a "Cancel or return request" box on the order screen and a Request badge in the Orders list); for an order made from a custom quote every step is also written to that quote's History. The reference is the order number with a hash (`#302`). The studio is emailed, and the customer gets a confirmation copy. **Nothing is cancelled or refunded automatically.** The studio approves it: for a cancel request, Approve cancels the order; for a return, Approve return emails the customer how to send it back, then Return received, then the refund from WooCommerce's Refund button. Older requests made before this change (CM-325, CM-327) still work.

The customer emails for Cancelled, Return approved, Return received and Refunded are one design (order number, items with photos, wording by payment method, a **Continue shopping** button to `/shop` and a line about a custom quote). They are sent the same way whether the studio presses Approve or sets the order to Cancelled by hand in WooCommerce (before this, a hand-set Cancelled sent the customer nothing). An unpaid checkout that WooCommerce drops by itself after the stock hold sends nothing.

**Order page:** `POST /order-lookup` now also returns `request`: `null` when the order has no request, else `{ "type": "cancel" | "return", "state": "requested" | "approved" | "received" | "closed", "label": "Cancel requested", "open": true, "at": "ISO date" }`. Suggested use: when `request.open` is true show the label (for example "Return requested: we will email you") instead of the cancel or return form, so the customer cannot send a second one (the server answers `already_requested` with `reference: "#302"` anyway). When the order itself is Cancelled or Refunded the order status already says so.

Errors, all with a `code`:

| HTTP | code | Meaning and suggested wording |
|---|---|---|
| 400 | `invalid` | Missing or unknown type or reason |
| 404 | `not_found` | Order number and email/phone/key do not match |
| 409 | `not_cancellable` | Cancel only while the order is Pending, On hold or Processing. Show "This order has already been shipped. You can ask for a return once it arrives." |
| 409 | `not_delivered_yet` | Returns only after the order is In transit or Completed |
| 409 | `return_window_closed` | More than 7 days after delivery (`AKRINITY_RETURN_DAYS`) |
| 409 | `made_to_order` | Made-to-order and personalised items are returned only when faulty (`reason: faulty`) |
| 409 | `already_requested` + `reference` | One open request per order. Show the reference (the order number, for example `#302`). |
| 429 | `busy` | Too many requests this hour |
| 401 | `rest_forbidden` | Wrong or missing key |

Suggested order page logic using the data you already read from `/order-lookup`: `status` is `processing` or `pending` or `on-hold` → show **Cancel order**; `in-transit` or `completed` → show **Request a return**; anything else → neither. Ask for the reason from the list above and an optional note. For cash on delivery the studio contacts the customer by email about the refund; do not ask for bank or UPI details on the site.

## 3. Review-request and delayed-order emails (no frontend work)

Sent by WordPress twice a day, in the Akrinity email design:
- **Review request:** 7 days after an order becomes Completed, once. The button opens `{storefront}/product/<slug>#reviews`, so that anchor must exist on the product page.
- **Order delayed:** when an order is still Processing after the print days plus 2 working days. The customer gets a short apology with a link to `{storefront}/order-confirmation?order=..&key=..`, and the studio gets a copy.

Each has an off switch in `wp-config.php` (`AKRINITY_REVIEW_EMAILS`, `AKRINITY_DELAY_EMAILS`).

## Tested on the live server (2026-11-22)

Quote: send, view, accept, accept twice, bad token, no key, unknown reference, a newer quote invalidating the old link. Order request: cancel request created, duplicate refused, wrong contact refused, invalid type refused, return before delivery refused, cancel approved from WordPress (order Cancelled, request Cancelled, customer emailed), return window, made-to-order and faulty rules. Emails: late-order notice sent once and not repeated. Not tested: the review email with a real Completed order, how the emails look on Gmail and phones.
