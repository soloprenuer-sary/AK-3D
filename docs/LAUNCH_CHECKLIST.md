# Akrinity launch plan and checklist

Written 2026-11-22. Tick a box when it is done and checked. Owner tags: **[Me]** frontend (Claude), **[BE]** backend team, **[You]** owner decisions and business facts, **[LAWYER/CA]** legal or tax.

Status today: browsing, categories, product pages, search, wishlist, compare, accounts, quote requests with file upload and statuses are built. Not built: checkout and payment, the contact, newsletter and review forms, real legal text, the full product list, the live domain.

## Progress update, 2026-11-22

Built and tested on a stand-in store (not yet on the real one): contact form, newsletter, product reviews (held for approval), checkout with state-wise GST (CGST and SGST in Maharashtra, IGST elsewhere), shipping options, coupon, Cashfree and cash on delivery, order confirmation, order tracking, 3D model upload field and 3D view. Backend steps to make it real are in `BACKEND_TASK_CHECKOUT.md`. Still to build: advance payment for custom quotes, the quote reply and accept-and-pay link, customer file upload after payment, return and refund request form.

## The whole customer journey, step by step

Status: **Done** = built and tested, **Part** = built but missing something, **Missing** = not built. The phases below fix every Part and Missing step.

### A. Buying a ready-made product

| # | Step | What the customer does | Status | Gap, and where it is fixed |
|---|---|---|---|---|
| 1 | Find us | Google, Instagram, WhatsApp, Amazon card, ad | Part | Page titles, share pictures, Google product data, Search Console (Phase 6). Amazon cards must not point to the site. |
| 2 | Land | Home page, announcement bar, trust points | Done | Real photos and wording check (Phase 4). |
| 3 | Browse | Mega menu, category and sub-category pages, filters, sort | Done | Real category images, all products imported (Phase 4). |
| 4 | Search | Search overlay with live results | Done | Check results for typos and empty search (Phase 7). |
| 5 | Choose | Product page: photos, material, colour, personal text, bulk prices, specs, reviews | Part | Reviews not connected (Phase 3); 5 products lack content fields (Phase 4). |
| 6 | Save or compare | Wishlist, compare tray | Done | Saved only on the device; sync to the account later (after launch). |
| 7 | Add to cart | Cart page, quantities, bulk price tiers | Part | Cart lives in the browser; prices and stock are not re-checked by the server (Phase 2). |
| 8 | Sign in or guest | Sign-in, sign-up, password reset, guest checkout | Part | Account works; the guest and returning-customer path inside checkout is not built (Phase 2). |
| 9 | Address and shipping | Pincode check, address, shipping options, coupon | Missing | Phase 2 (needs your shipping decision, Phase 0). |
| 10 | Pay | UPI, card, net banking (Cashfree), COD | Missing | Phase 2 (needs your payment decision, Phase 0). |
| 11 | Confirmation | Thank-you page, confirmation email, invoice | Missing | Phase 2, invoice format by CA. |
| 12 | Follow the order | Track-order page, account order history, status emails (printing, packed, shipped) | Part | Page and account route exist; not connected to real orders or Shiprocket (Phase 2). |
| 13 | Receive | Delivery, delivery call or SMS | Missing | Shiprocket set-up (Phase 2 backend checks). |
| 14 | Problems | Returns, refund, damaged item, support | Part | Policy pages are placeholders; no return request form (Phase 3 and 5). |
| 15 | Come back | Review, reorder, newsletter, offers | Missing | Reviews, newsletter, re-order button (Phase 3). |

### B. Custom 3D printing (quote first, then pay)

| # | Step | Status | Gap |
|---|---|---|---|
| 1 | Open the quote page, upload the 3D file, fill job details | Done | Tested with large files on a stand-in; test once on the real server (Phase 1). |
| 2 | Get a reference (QR number) and a confirmation email | Done | |
| 3 | Team sees the request, downloads the file, sets status (reviewing, quoted) | Done | Snippet 2.4.0 must be on the server (Phase 1). |
| 4 | Customer receives the price and accepts it | Missing | Quote reply email template, and a link where the customer accepts and pays (Phase 2). |
| 5 | Advance payment, then production status updates (paid, in production, ready, shipped) | Missing | Same Cashfree set-up; customer status look-up by reference (Phase 3). |
| 6 | Delete the customer file after the order is complete | Done | Button exists; decide how long to keep files (Phase 5). |

### C. Business and bulk buyers

| # | Step | Status | Gap |
|---|---|---|---|
| 1 | Bulk price tiers on products, business request form with GSTIN | Done | Check emails reach the team. |
| 2 | Quote, GST invoice, payment terms | Missing | CA decides invoice and credit terms (Phase 2, 5). |

### D. Your team's daily flow (behind the scenes)

| # | Step | Status | Gap |
|---|---|---|---|
| 1 | New order or quote arrives in WordPress and by email or WhatsApp | Part | Order emails need the WooCommerce and SMTP check (Phase 2, 3). |
| 2 | Print, check quality, pack | Manual | Keep status updated in WordPress so the customer sees it. |
| 3 | Make the shipping label and hand over to the courier (Shiprocket) | Missing | Shiprocket plugin set-up and tracking numbers on the order (Phase 2). |
| 4 | Mark shipped; the customer is told with a tracking link | Missing | Shipped email template (Phase 2). |
| 5 | Handle returns, refunds and support messages | Missing | Return form, refund steps in Cashfree, support inbox (Phase 3). |
| 6 | Update stock and prices | Done | In WordPress; shows on the site within a minute. |

## Phase 0. Decisions that block everything else (this week)

- [ ] **[You]** Payment: Cashfree for cards and UPI, with or without cash on delivery (COD)? Start in test mode first?
- [ ] **[You]** Live domain name (for example akrinity.in) and who controls its DNS.
- [ ] **[You]** Shipping: free-shipping amount, flat rate or Shiprocket live rates, which pincodes you serve, delivery time promise.
- [ ] **[You]** Business facts: GSTIN, registered address, WhatsApp number, support email, return and warranty terms, advance percentage on custom jobs, quote reply time.
- [ ] **[You]** Product list: send the Amazon listing titles so the rest can be imported, and say which products are in stock.
- [ ] **[You]** Own product photos for every product (no pictures loaded from Amazon).
- [ ] **[You]** Approve or change the page designs still on the canvas: checkout, confirmation, order tracking.

## Phase 1. Security and backend clean-up (before any real customer data)

- [ ] **[BE]** Upload `wordpress/mu-plugins/akrinity-hardening.php` (set the live domain in `AKRINITY_ALLOWED_ORIGINS` first), then check sign-in, products and a quote with a file still work.
- [ ] **[BE]** Deactivate and delete unused plugins: WPGraphQL, Jetpack, Header Footer Elementor, Elementor, All-in-One WP Migration (after a backup), WPForms if unused.
- [ ] **[BE]** Delete `readme.html` and `license.txt`; give the admin a login name that is not `sujit`; 2FA for every admin; long unique passwords.
- [ ] **[BE]** Swap the `claude-agent` account out and lock down WordPress accounts (see the go-live reminder).
- [ ] **[BE]** Confirm the quote snippet is version 2.4.0 on the server (file upload, statuses, delete-file button).
- [ ] **[BE]** Host firewall and malware scan on, daily off-site backups, automatic plugin updates.
- [ ] **[You]** In Vercel check: `AKRINITY_SHARED_SECRET` (40+ characters, same as WordPress), Turnstile site key and secret, Upstash Redis (`AUTH_KV`).
- [ ] **[BE]** Delete the test quote requests (QR-138, QR-139 and others) and any test customers.

## Phase 2. Checkout and orders (the biggest build)

Backend checks first:
- [ ] **[BE]** Cashfree plugin: confirm test or live mode, the allowed domain for the storefront, and the webhook address.
- [ ] **[BE]** WooCommerce: tax settings (GST), shipping zones and rates, order emails working through WP Mail SMTP, order statuses.
- [ ] **[BE]** COD enabled in WooCommerce if you chose it.

Frontend build:
- [ ] **[Me]** Cart saved in WooCommerce (Store API cart) so prices, stock and bulk tiers are checked on the server.
- [ ] **[Me]** Checkout page: contact, address with pincode check, shipping options, coupon, order notes, GST details for business buyers.
- [ ] **[Me]** Pay with Cashfree (test mode first), COD option, failed and cancelled payment screens.
- [ ] **[Me]** Order confirmation page and email, order tracking page connected to real orders.
- [ ] **[Me]** Account area: real order history, addresses, re-order.
- [ ] **[BE + LAWYER/CA]** GST invoice format and numbering.
- [ ] **[BE]** Test orders end to end: success, failure, refund, cancel, COD, shipped email.
- [ ] **[BE]** Switch Cashfree to live mode only after the test orders pass.

## Phase 3. Forms and customer messages

- [ ] **[Me + BE]** Contact form saves to WordPress (like Quote requests) and emails the team.
- [ ] **[Me + BE]** Newsletter sign-up (choose the mail tool first: WordPress list or an email service).
- [ ] **[Me + BE]** Product reviews: customers post, you approve in WordPress, stars show on the product page.
- [ ] **[Me]** Quote form: show status look-up by reference (QR-number) if you want customers to follow progress.
- [ ] **[BE]** WhatsApp and email notifications for new quotes and orders.

## Phase 4. Products and content

- [ ] **[You + BE]** Import every remaining product with titles, prices at or below Amazon, stock, weight and size.
- [ ] **[You + BE]** Fill the product content fields (features, About blocks, A+ pictures, specs) on the 5 products that do not have them yet.
- [ ] **[BE]** After that, empty the old Description editor on the 16 products (see the saved reminder).
- [ ] **[You]** Real category images and a real hero photo for each category, and the four popular tiles in the menu.
- [ ] **[You]** Knowledge hub: real guide articles (printing materials, care, how to choose), replacing placeholders.
- [ ] **[You]** Materials, "how we print" and "about" pages: confirm the text is true.
- [ ] **[You + BE]** Free-shipping and bulk-price rules checked on every product.

## Phase 5. Legal pages

- [ ] **[You]** Fill the highlighted placeholders (company name, address, GSTIN, contact, grievance officer).
- [ ] **[LAWYER/CA]** Review privacy policy, terms, shipping, returns and refunds, grievance page, file-upload terms.
- [ ] **[LAWYER/CA]** Confirm GST, invoice and e-commerce rules for selling in India.
- [ ] **[Me]** Replace the sample text with the approved text and remove the "information needed" boxes.
- [ ] **[Me]** Cookie notice if you add analytics or ads.

## Phase 6. Speed, search and tracking

- [ ] **[Me]** Re-run PageSpeed on the live site after the last deploy; fix anything under 90 on phones.
- [ ] **[Me]** Page titles, descriptions and share pictures for every page; product structured data (price, stock, rating) for Google.
- [ ] **[Me]** Sitemap and robots file, canonical links on the live domain, redirects from old addresses.
- [ ] **[You]** Google Search Console and Google Merchant Center set up; Google Analytics or a similar tool.
- [ ] **[Me]** Add analytics only after the cookie notice is in.
- [ ] **[Me]** Reduce JavaScript on the home page if the phone score is still under 90.

## Phase 7. Testing before launch

- [ ] **[Me]** Full run of every page on phone, tablet and desktop (Chrome, Safari, Firefox) and fix what breaks.
- [ ] **[Me]** Automated browser tests (Playwright) for: browse, search, add to cart, checkout, sign-in, quote with file.
- [ ] **[Me]** Accessibility check (keyboard use, screen reader labels, colour contrast).
- [ ] **[BE + You]** Real test orders with real small amounts, then refund them.
- [ ] **[You]** Read every page once for wrong facts, prices and spelling.
- [ ] **[BE]** Restore test of a backup.

## Phase 8. Go live

- [ ] **[You + BE]** Point the domain to Vercel; WordPress stays on admin.akrinity.in.
- [ ] **[Me]** Set production environment variables in Vercel and the live domain in the site settings.
- [ ] **[BE]** Cashfree live keys and webhook; WordPress site address and CORS list updated to the live domain.
- [ ] **[Me]** Remove test data, the draft banner and any "coming soon" or maintenance notices.
- [ ] **[You]** Announce: WhatsApp, Instagram, Amazon listing cards (never send Amazon buyers to the site; site prices stay at or below Amazon).
- [ ] **[Me + BE]** Watch for errors for the first week: Vercel logs, WordPress error log, failed payments, form emails arriving.
- [ ] **[BE]** Uptime monitoring and a weekly backup check.

## After launch (next ideas, not blockers)

- [ ] Customer file upload for custom orders after payment, saved to the order.
- [ ] Discount codes and gift cards, abandoned-cart email.
- [ ] Hindi and Marathi text on key pages.
- [ ] Live order tracking from Shiprocket on the track-order page.
