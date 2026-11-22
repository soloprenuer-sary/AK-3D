# Backend task: checkout, GST, payments, tracking, 3D models, forms and reviews

For the backend team. Frontend is ready and tested against a stand-in store; this note is everything WordPress and WooCommerce need so it works for real. Do the steps in order and tick them off. Items marked VERIFY could not be checked from outside the server.

## 1. Upload the snippets (wp-content/mu-plugins/)

**Emails (new):** upload `akrinity-emails.php` **and the folder `akrinity-emails/`** (it holds `render.php` and `stub.php`) next to the other files, and replace `akrinity-shop.php` with version 1.1.0 (it adds the In transit status). After that, WooCommerce > Settings > Emails shows a new email, **In transit order**; the other order emails switch to the Akrinity design on their own. Send yourself a test order first (WooCommerce > Settings > Emails > pick an email > Send a test or place a cash on delivery order) and check it in Gmail and on a phone.

| File | Version | New in this round |
|---|---|---|
| `akrinity-headless-auth.php` | 2.5.0 | Contact messages (`/contact`), newsletter (`/newsletter`), product reviews (`/reviews` list and post) |
| `akrinity-shop.php` | 1.0.0 | Bulk prices in the cart, item notes, cash on delivery rules, return to the storefront after payment, order lookup, tracking box on orders, 3D model field |
| `akrinity-hardening.php` | 1.0.0 | Security fixes (see `SECURITY_AND_SPEED_CHECK.md`), plus overall caps for the new routes |

Replace the old `akrinity-headless-auth.php` (2.4.0) with the new file; the other two are new. No edits needed. In `wp-config.php` the existing `AKRINITY_FRONTEND_URL` and `AKRINITY_SHARED_SECRET` must be set. Optional:

```php
define( 'AKRINITY_COD_FEE', 50 );      // cash on delivery fee in rupees, before GST (customer pays 50 + 18% = 59)
define( 'AKRINITY_COD_LIMIT', 3000 );  // largest cart (with GST) that may pay cash on delivery
define( 'AKRINITY_ALLOWED_ORIGINS', 'https://akrinity.in,https://www.akrinity.in,https://ak-3-d.vercel.app' );
```

The cash on delivery numbers are placeholders: the owner has not given the fee and limit yet.

## 2. GST (WooCommerce > Settings > Tax) — LAWYER/CA to confirm rates

The owner chose 18% on every product, prices already include GST, seller state Maharashtra.

- [ ] Settings > General: tick **Enable tax rates and calculations**; set store address to the Mumbai studio (country India, state Maharashtra).
- [ ] Tax tab: **Prices entered with tax = Yes, I will enter prices inclusive of tax**; **Calculate tax based on = Customer shipping address**; **Shipping tax class = Based on cart items**; **Display prices in the shop = Including tax**; **Display prices during cart and checkout = Including tax**; **Display tax totals = Itemized**.
- [ ] Tax > Standard rates > **Import CSV**: `docs/gst-tax-rates-india.csv` (38 rows). Result: Maharashtra buyers get CGST 9% and SGST 9%; every other state and union territory gets IGST 18%.
- [ ] Product tax status = Taxable and tax class = Standard on every product. (Some 3D-printed items may carry 12% or 18% depending on their HSN code: VERIFY with the CA; use a second tax class for those.)
- [ ] Store the HSN code and GSTIN for invoices (the buyer's GSTIN is saved on the order as `_billing_gstin` and as an order note).

Test: add a product, set state Maharashtra, the cart shows CGST and SGST; set Karnataka, it shows IGST.

## 3. Shipping (Shiprocket)

- [ ] Shiprocket plugin connected with the studio pincode; the courier rates must appear as WooCommerce shipping methods in a shipping zone for India (WooCommerce > Settings > Shipping). Until it does, checkout shows "We could not find a delivery option".
- [ ] If live rates are not ready, add a **Flat rate** (for example ₹60) and a **Free shipping above ₹[amount]** method to the India zone as a stop-gap.
- [ ] Product weight and size are filled in (rates depend on them).
- [ ] **Shipping an order (manual for now):** open the order, set the status to **In transit**. A box "In transit: delivery partner and tracking" appears. Choose the delivery partner, type the tracking ID (AWB), optionally the expected delivery date, then press **Update**. The customer gets the "In transit" email once; the order page and the storefront tracking page then show the partner, the tracking ID and a "Track the parcel" button. Change the tracking ID and press Update to send it again. Set the order to **Completed** after delivery.
- [ ] VERIFY the tracking web addresses of each delivery partner in `akr_delivery_partners()` (`akrinity-shop.php`). Where a partner has no direct link, type the tracking link by hand in the box.

## 4. Payments

**Right now only cash on delivery is offered.** Cashfree is on hold: the storefront hides it until the setting `ENABLED_PAYMENT_METHODS` in Vercel includes it (default is `cod`; later set `cod,cashfree`). The Cashfree steps below can wait.

**To take a cash on delivery order, the store needs just three things** (WooCommerce settings, no code):
1. Settings > Payments: turn on **Cash on delivery**.
2. Settings > Shipping: add a shipping zone for India with a **Flat rate** (for example ₹60) and optionally **Free shipping** above a limit. Without a shipping method, WooCommerce cannot place any order.
3. Upload `akrinity-shop.php` (so the COD fee, limit and options note work) and, for the GST split, section 2 above.

**Cashfree** (plugin "Cashfree for WooCommerce" is installed):
- [ ] Settings: enter the **test** App ID and Secret first; mode = test. VERIFY the plugin settings page for the exact field names.
- [ ] Add the storefront and admin domains to Cashfree's allowed list; set the webhook address the plugin shows.
- [ ] Confirm the plugin's payment page opens after "Pay" at checkout (the storefront places the order, then sends the customer to the address WooCommerce returns). After payment the plugin returns the customer to the storefront order page (done by `akrinity-shop.php`, filter `woocommerce_get_return_url`).
- [ ] Do 3 test orders in test mode: success, failed payment, abandoned payment. Check each order's status in WooCommerce (paid orders go to Processing).
- [ ] Switch to live keys only after the tests and the owner's OK.

**Cash on delivery**:
- [ ] WooCommerce > Settings > Payments: enable **Cash on delivery**; title "Cash on delivery"; leave "Enable for shipping methods" empty.
- [ ] The snippet hides it for made-to-order carts and carts above the limit, and adds the fee. Test: a cart over the limit must not offer COD.

## 5. Email

- [ ] WP Mail SMTP sending test mail OK; WooCommerce order emails (new order to admin, processing order and completed order to the customer) switched on and checked for the brand text.
- [ ] The Akrinity routes send their own emails: contact message, newsletter welcome, review waiting for approval, quote and bulk requests.

## 6. Product reviews

- [ ] WooCommerce > Settings > Products: **Enable product reviews** and **Show verified owner label** are on.
- [ ] Customers post from the product page; every review lands as **pending** (Products > Reviews, or Comments). Approve it there and it shows on the storefront within about a minute. The admin also gets an email for each new review.

## 7. 3D model on products

- [ ] The snippet adds a **3D model** box on every product (field `model_3d`, needs ACF). Upload a `.glb` (best), `.stl`, `.3mf` or `.obj` under 10 MB. The storefront shows a **3D view** tab only for products that have a file.
- [ ] **File host CORS** (recommended): ask Hostinger/nginx to send `Access-Control-Allow-Origin: https://<storefront domain>` for `.glb .stl .3mf .obj .gltf` files in `wp-content/uploads`. Without it the storefront reads the file through its own copy, which only works for files under about 4 MB.
- [ ] Upload test: if WordPress refuses a file type, check Media > Add New again after the snippet is in place (it allows these five types for users who can upload files).

## 8. Quick test list for the team

1. Contact form, newsletter, a review: each shows up in WordPress (Quote requests / Reviews).
2. COD order for one stocked product: appears in WooCommerce with the options text on the line, GST split, COD fee line; customer sees it on `/order-confirmation` and `/track-order`.
3. Cashfree test order: pays on the Cashfree page, returns to the storefront order page showing "Payment received".
4. Mark an order shipped with a tracking number: customer gets the email; the tracking page shows "Track the parcel".
5. A bulk price product at its tier quantity: cart price equals the tier price.
6. Product with a 3D file: 3D view tab works on phone and desktop.
