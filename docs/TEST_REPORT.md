# Site check report (2026-11-18)

Tested on a local copy of the storefront reading the live backend (`admin.akrinity.in`), in a headless Chrome at desktop width (1322 px) and phone width (390 px), plus the production build. Nothing here was tested on the deployed Vercel site or on a real phone.

## 1. What was tested

- **Crawl:** every page reachable by links, 84 pages, on desktop and phone (168 loads). All returned 200. No browser errors, no sideways scrolling, one main heading per page, no broken images, no links without text.
- **Links and buttons:** every internal link on those pages opens a real page (no dead or `#` links). The only automatic redirects are sign-in and sign-up going to the account page. There are no redirect loops.
- **Menus:** all 20 category-menu links, hover and keyboard open, phone drawer (category, then group, then item).
- **Pages built or changed:** home, shop, category and sub-category pages, product page, search overlay, wishlist, compare, cart, checkout, FAQ, contact map, privacy, terms.
- **Phone:** all of the above at 390 px, including the sticky cart button and the compare bar. Swiping the sliders was not tested.
- **Build, lint, types:** pass.

## 2. Fixed during this check

- Shop sidebar buttons had no gap; now spaced.
- The heart (wishlist) button was hidden on phones; now visible.
- The compare bar wrapped badly on phones; now one line.
- The header wrapped onto two rows between 900 and 1000 px; the phone menu now starts at 1000 px.
- Small touch targets (product names, text links, contents list) enlarged.
- Product page said "Sample only, no order is placed" and "Sample check" for the pincode; wording is now plain.
- Kitchen and Original characters banners were far taller than the others; now match.

## 3. What does not work yet, or needs configuration

These are not bugs in the pages; the site is not connected to the service behind them.

| Item | State | What is needed |
|---|---|---|
| **Checkout and payment** | The form checks the details and stops. No order is created, nothing is charged. | Decide the payment method (cash on delivery first, as you said), then connect checkout to WooCommerce orders. Razorpay (or another gateway) needs an account and keys from you. Not built. |
| **Order confirmation email, track order** | Not connected. Track-order only confirms the form. | Needs orders in WooCommerce first. |
| **Contact form** | Validates and says "not connected". Nothing is sent. | Connect it to WordPress with an email to you (same way as the bulk quote form). Needs your go-ahead; not built. |
| **Quote form and file upload** | Connected and checked against the live WordPress on 2026-11-19: a test request was saved (reference QR-138). The 3D file itself is **not** uploaded: only its name and size are saved. | Delete the test entry QR-138 under Quote requests. Choose private file storage (for example Cloudflare R2) if you want files uploaded. |
| **Newsletter sign-up (footer)** | Says "not connected". Nothing is saved. | Needs a mail provider (for example Mailchimp or Brevo) and an account. |
| **Product reviews form** | Does not save. Existing WooCommerce reviews show as stars on cards only. | Decide: connect to WooCommerce reviews, or hide the form until then. |
| **Pincode delivery check** | Always returns a generic message. | Needs a courier (Shiprocket or similar) account to give real delivery dates. |
| **Backend snippet on live** | The product data now carries the snippet extension (bulk prices, cross-sells, upsells) and the quote route answers. The snippet is deployed. | Fill in bulk prices and linked products on products to see them on the site. |
| **Sign-in and sign-up on live** | The status check says the shared key matches and the sign-in plugin is active. A real sign-up on the live site has not been tested end to end in this check. | Test one real sign-up and one sign-in on the live site after the snippet is updated. |
| **Rate limits and bot check** | Upstash Redis and Cloudflare Turnstile are not set. | Add `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and `TURNSTILE_SECRET_KEY` in Vercel before launch. |
| **Amazon products** | Not imported. Amazon blocks automated access. | Send the listing titles (paste them, or put the Seller Central report in `imports/amazon/`). |

## 4. Content that still shows placeholders

Visible to customers until you fill them in:

- Announcement bar: "Free shipping above ₹[AMOUNT]". Same in the cart.
- Footer: "GSTIN [YOUR GSTIN]".
- Contact page: WhatsApp number, support email, reply time, studio address.
- Home: statistic "[X] hrs" quote reply time; printer build plate and part size "[X] × [X] mm".
- Product pages: Details, Shipping, and Returns and warranty text; "Ships in [X] working days".
- FAQ, shipping, returns, refunds, care and grievance pages: figures in brackets.
- Privacy policy and Terms: sample text, every value highlighted, lawyer review needed (LAWYER).
- Contact map: the street address (it searches "Mumbai" until you give one).

## 5. Catalogue and WordPress data

- Only **5 products** are live. Only the **vase has photos** (9); the other four show a striped placeholder. The twisted lamp is not in WooCommerce.
- The category tree is in place (9 main categories, 30 sub-categories, pictures). Products are ticked into sub-categories for four of the five. Seven main categories have no products yet and show "New pieces coming soon".
- The top bar shows the first five categories by menu order. "Popular in menu" and "Menu group" are not set, so each menu panel shows its first four sub-categories as pictures and an ungrouped list.
- The "Original characters" Busts sub-category uses the slug `busts-characters`, so its illustration came from WordPress, not from the built-in set. That is fine.
- Product text fields are empty: no short description on any product.

## 6. Known limits (by design, not faults)

- The wishlist and compare lists are stored in the visitor's browser only. They do not follow a customer to another device, and signing in does not sync them.
- The cart is also stored in the browser, not in WooCommerce.
- The "Fresh off the printer" block treats the highest product numbers as the newest.
- The search overlay loads the product list the first time it is opened, so the first search can take a moment.
- Printer illustrations, the "Sample vase" and the touchscreen text are illustrations, not the real printer.

## 7. Before launch (from earlier notes)

- Replace the claude-agent login used by the storefront with a limited account and lock down WordPress admin accounts.
- Delete the leftover test customers in WordPress.
- Turn off `AUTH_STATUS` in Vercel.
- Decide whether to keep or delete the `founderofakrinity` customer.
