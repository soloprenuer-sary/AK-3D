# Backend tasks, round 2 (22 Nov 2026)

For the backend team. The storefront side of these is done and tested; each item below needs WordPress, WooCommerce or the host. Tick them off in order. Full details of the first round are in `BACKEND_TASK_CHECKOUT.md` and `SECURITY_AND_SPEED_CHECK.md`.

## Status on 25 Nov 2026 (backend)

Done and live on admin.akrinity.in: section 1 uploads and the In transit email; section 2 values set as temporary (WhatsApp, GSTIN, name, address, HSN); section 6 items 1 to 3 and the review and delayed-order emails of item 4 (see decisions 20 to 22 and 46 in `PROJECT_CONTEXT.md`); section 7 Cashfree sandbox keys entered and success, failed and abandoned orders tested. The quote Accept button is on (`AKRINITY_QUOTE_ACCEPT_PAGE`).

Still open: section 3 (Shiprocket or courier rates, a Free shipping method, partner tracking links); section 4 and section 5 clean-up and security steps wait for the owner's go-live word (nothing is removed before); abandoned-cart and back-in-stock emails (item 4); a Cashfree refund test (section 7); real values for the temporary details in section 2.

## 1. Upload and confirm (today)

Upload to `wp-content/mu-plugins/` (replace the old files):

| File | Version | What changed |
|---|---|---|
| `akrinity-headless-auth.php` | 2.6.0 | Quote, bulk, contact, newsletter and review-waiting emails now use the Akrinity email design (plain text if the emails plugin is missing) |
| `akrinity-shop.php` | 1.1.0 | In transit status, tracking box (already live: confirm it is the same file) |
| `akrinity-emails.php` + folder `akrinity-emails/` (`render.php`, `stub.php`) | 1.0.0 | The email design for all WooCommerce order and account emails |
| `akrinity-hardening.php` | 1.0.0 | Security fixes (already live) |

- [ ] Open WooCommerce > Settings > Emails: the list shows **In transit order**. Open it and check it is enabled.
- [ ] WP Mail SMTP: send its own test email and confirm it arrives (in the inbox, not spam).
- [ ] Place one cash on delivery order on the website, then set it to **In transit**, pick a delivery partner, type a tracking ID, press Update. Check both emails arrive and look right on Gmail and on a phone. Send the owner the screenshots.

## 2. Settings in `wp-config.php`

```php
define( 'AKRINITY_PRINT_DAYS', 2 );      // working days to print and pack (the owner confirms the number)
define( 'AKRINITY_DELIVERY_DAYS', 5 );   // working days from dispatch to delivery (the owner confirms)
define( 'AKRINITY_COD_FEE', 50 );        // cash on delivery fee in rupees, before GST (the owner confirms)
define( 'AKRINITY_COD_LIMIT', 3000 );    // largest cart that may pay cash on delivery (the owner confirms)
define( 'AKRINITY_WHATSAPP', '+91 98xxx xxxxx' );   // shown in email footers
define( 'AKRINITY_GSTIN', '27ABCDE1234F1Z5' );      // shown in email footers
```

The same two day numbers are set on the website side by the owner, so the delivery date on the product page and in the emails match.

## 3. Shipping

- [ ] Connect Shiprocket (or enter courier rates by weight and pincode zone) so checkout shows real rates instead of the flat ₹60. Products need weight and size filled in.
- [ ] Add a **Free shipping** method in the India zone that applies above the amount the owner chooses (a minimum order amount). The website already shows "Add ₹X more for free shipping" once the owner sets that amount, so the two must match.
- [ ] Check each delivery partner's tracking link in the In transit box (Delhivery, Blue Dart, DTDC, Ecom Express, Xpressbees, Shadowfax, Amazon Shipping, India Post, Shiprocket). Fix any that does not open the right page: the list is `akr_delivery_partners()` in `akrinity-shop.php`; the "Tracking link" box on an order can override it.

## 4. Security (from `SECURITY_AND_SPEED_CHECK.md`, still open)

- [ ] Deactivate and delete **WPGraphQL** (the storefront does not use it; it still shows the admin username `sujit`). Also Jetpack, Header Footer Elementor, Elementor and any plugin the store does not use.
- [ ] Delete `readme.html` and `license.txt` from the WordPress root.
- [ ] Turn on two-step login (2FA) for every admin; give the admin a login name that is not the public author name.
- [ ] Before launch: remove the `claude-agent` account and any test users.
- [ ] Host: firewall and malware scan on; daily off-site backups (not in the web folder).

## 5. Data clean-up

- [ ] Put every product into a product category (WooCommerce > Products). Today most have none. The website menu and the "More from [category]" block in the emails use them.
- [ ] Delete the test orders (#295, #300 and any others) and the test quote requests (QR-138, QR-139 and others).
- [ ] Optional: upload a `.glb` or `.stl` in the 3D model box on products that should have a 3D view.

## 6. Features that need backend work (spec for each)

1. **One-tap cancel or return request.** A route `POST /akrinity/v1/order-request` (shared key) with the order number, the email or phone used, the type (cancel or return) and a reason. It creates an entry under Quote requests (type "Return request"), emails the studio, and emails the customer a copy. The order page then shows a button instead of the current link to the contact form.
2. **Quote reply and accept.** On a Quote request, a box to enter the price and lead time and a "Send quote" button. It emails the customer a link `{storefront}/quote/accept?ref=QR-139&token=...` (signed like the upload token). Accepting changes the status to "Awaiting payment". The advance payment itself needs Cashfree (see 7).
3. **GST invoice.** A numbered tax invoice (PDF) per order with GSTIN, HSN, CGST/SGST/IGST lines, linked from the order page and attached to the completed-order email. Use a plugin (for example WooCommerce PDF Invoices) or custom code; the invoice number series and layout must be confirmed by the owner's CA.
4. **Customer emails to add** (WooCommerce scheduled actions): a review request a few days after Completed; an "order delayed" email when an order stays Processing longer than the days the owner sets; abandoned-cart and back-in-stock emails (or a plugin that does them).

## 7. When the owner sends the Cashfree test keys

- [ ] Enter the test App ID and secret; allow the storefront domain; set the webhook.
- [ ] Place three test orders: paid, failed, abandoned. Check the status of each in WooCommerce.
- [ ] Tell the frontend (set `ENABLED_PAYMENT_METHODS=cod,cashfree` and `NEXT_PUBLIC_ONLINE_PAYMENTS=1` in Vercel) so the website offers it.
- [ ] Refunds for online payments are issued from the order screen and go back to the original method; check one.

## 8. Quick acceptance list

1. Customer places a cash on delivery order: confirmation email arrives in the Akrinity design with the product photo and "More from [category]".
2. You set it In transit with a partner and tracking ID: one email arrives with the partner, ID, expected date and a working "Track the parcel" button; the website's Track order page shows the same.
3. Change the tracking ID and press Update: a second email goes out. Press Update again without changing it: nothing is sent.
4. Contact form, quote form, bulk form, newsletter and a review: each email to the studio and to the customer arrives in the Akrinity design.
5. A product with a category shows three products from that category in the emails.
