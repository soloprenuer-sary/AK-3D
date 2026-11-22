# Website flow report (22 Nov 2026 (updated after the fixes))

What a shop like Akrinity needs, step by step, what the site does today, and what the tests found. 64 steps in 12 flows.

**Score:** Done 30 · Built, not confirmed 5 · Partly done 15 · On hold 2 · Not done 12

## Tests run

| Test | Result | Where |
|---|---|---|
| Whole-trip browser test + single-flow tests (all 78 checks) | Final run on a local production build: 72 passed, 6 skipped (2 place-order steps off by default, 2 device-specific, 2 policy-text checks parked until the lawyer text exists), 0 failed. Two earlier hiccups were test faults: a menu click before the page finished loading, and my own repeated runs hitting the forgot-password limit | Local build (same code as the next deploy) |
| Same tests before the fixes, on the live site | 36 passed, 6 failed (3 real gaps: no price sort, no delivery estimate, placeholder text), desktop and phone | Live site, before the fixes |
| Settings check (values set and not set) | With values set: free-shipping bar and message, WhatsApp button, footer GSTIN, contact lines, studio address all appear. With nothing set: those lines are left out instead of showing [placeholder] | Local build, both ways |
| Search engines and sharing | robots.txt, sitemap.xml (87 pages), web manifest, canonical links, share tags and a share picture, product data (price, stock, rating) on every product: all present on the new build. Live after the next deploy | Local build |
| Page speed on a phone (Lighthouse, live) | Home 78, shop 83, product 87, checkout 94, quote 93. Accessibility 98 to 100, best practices 100, SEO 100 (checkout is 60 on purpose: hidden from Google). Desktop was 99 to 100 earlier | Live site |
| Store set-up probe | Cash on delivery on, Cashfree hidden by choice, flat-rate delivery (₹60 plus GST), CGST and SGST for Maharashtra, IGST for Delhi, in-transit fields, reviews, contact and 3D-model routes all answer | Live store |
| Security re-check | Fixed: public username list in the REST API, author redirect, login error text, plugin list. Still open: WPGraphQL still lists the admin username, readme.html still public | Live store |
| Emails | Order and account emails (12) plus the five request emails (quote, bulk, contact, newsletter, review) render without errors in the lime design; the send-once rule for the in-transit email passes 15 checks. NOT tested: a real email in a real inbox | Test harness |
| Not tested on purpose | Creating a customer account, sending a quote with a file, sending a contact message, subscribing, posting a review and placing another order: each would create real records on the live store. These were tested earlier on a stand-in store | - |

## 1. Find us

_A stranger finds Akrinity on Google, Instagram or WhatsApp and lands on a page that makes sense._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Fast, mobile-friendly pages | Opens in under 3 seconds on a phone | Opens fast; phone scores 78 to 94 | Done | Pass |
| Search engines can read the site | sitemap.xml, robots.txt, canonical links | sitemap.xml (87 pages), robots.txt and canonical links added | Done | Pass (live after deploy) |
| Link previews on WhatsApp and Instagram | Share picture, title and price when a link is pasted | Share tags and a branded share picture added | Done | Pass (live after deploy) |
| Rich results on Google | Product structured data: price, stock, rating | Product data (price, stock, rating) added to every product page, plus Organisation data | Done | Pass (live after deploy) |
| Know where visitors come from | Analytics, Search Console, Merchant Center | Nothing installed (and no cookie notice yet) | Not done | - |
| Clear home page | Says what you make and how to order | Home page, printing, categories, best sellers, process, knowledge hub | Done | Pass |

## 2. Browse and search

_Find the right product in a few taps._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Category menu | Main and sub-categories, popular picks | Menu under the header, driven from WordPress | Done | Pass (desktop), phone menu pass |
| Products in the right category | Every product belongs to a category | Most products have no category in WooCommerce yet; the site guesses from the name | Partly done | - |
| Search | Live results and a clear no-results message | Search overlay with live results | Done | Pass |
| Filter and sort | Filters plus sort by price | Filters plus sort by price now on the shop page too | Done | Pass |
| Save and compare | Wishlist and compare | Both work and survive a reload (kept in the browser, not synced to the account) | Done | Pass |
| Wrong address | Friendly 404 with a way home | Yes | Done | Pass |

## 3. Choose a product

_Be sure it is the right one, then pick options._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Photos and 3D view | Photos, and a 3D preview for printed items | Photos yes; 3D field is live but no 3D file is uploaded to any product yet, so the tab never shows | Partly done | Pass (tab hidden as designed) |
| Description, features, specs | Intro, key features, A+ pictures, specs table | Done (intro and features on the text side; full width without A+ pictures) | Done | Pass |
| Options and personalised text | Material, colour, size, name text with checks | Yes, odd characters refused | Done | Pass |
| Bulk prices | Price ranges by quantity | Shown where the ranges are filled in | Done | Pass |
| Delivery estimate for my pincode | Gives a delivery date | Gives "estimated delivery by [date]" worked out from the printing and delivery days you set; a real courier date comes later with Shiprocket | Partly done | Pass |
| Reviews | Real reviews with stars | Working and held for your approval; none posted yet | Done | Pass (earlier, stand-in) |
| Free-shipping message | "Add ₹X more for free shipping" | Free-shipping message and progress bar appear in the cart once you set the amount; hidden until then | Partly done | Pass (set and not set) |

## 4. Cart

_Review and change the order without friction._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Add, change quantity, remove | Works, with a drawer and a cart page | Yes | Done | Pass |
| Cart is kept | Survives a reload; follows the customer to another device | Survives a reload; stays on this device only | Partly done | Pass (reload) |
| Upsell in the cart | Products that go with the cart | None in the cart (product page has suggested rows) | Not done | - |
| Coupon | Coupon box with clear messages | At checkout; bad code shows the store's message | Done | Pass (stand-in) |

## 5. Checkout and payment

_Pay with the least effort and the right tax._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Guest checkout and details | No account needed, address with state and pincode | Yes, signed-in customers are pre-filled | Done | Pass |
| GST by state | CGST and SGST in Maharashtra, IGST elsewhere | Live on the store: Maharashtra splits, Delhi shows IGST | Done | Pass |
| Delivery charge | Real courier rates by weight and pincode | Flat rate ₹60 plus GST for every pincode (Shiprocket rates not connected) | Partly done | Pass |
| Cash on delivery | Fee and limit, hidden for made-to-order | Live; fee ₹50 and limit ₹3,000 are placeholders for you to confirm | Done | Pass (orders #295, #300 were placed) |
| UPI, cards, netbanking | Online payment with Cashfree | Built, but hidden on purpose until you have test keys | On hold | Not run |
| Business GST details | GSTIN on the order | Saved on the order; bad GSTIN refused | Done | Pass |
| Made-to-order items | Pay online or an advance | Cannot be bought at all while only cash on delivery is on | On hold | Pass (message shown) |
| Advance payment for custom jobs | Pay part now, rest before dispatch | Not built | Not done | - |

## 6. After the order

_The customer always knows where the order is._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Confirmation page | Shows the real order | Real order, items, GST, timeline | Done | Pass |
| Confirmation email | Branded email with photos and tracker | Designed and coded; upload and delivery to a real inbox not confirmed | Built, not confirmed | Render only |
| Track an order | By number plus email or phone | Works; wrong details give a clear message | Done | Pass |
| In transit with tracking ID | You pick the partner and type the ID; the customer gets one email | Built and live on the store (status, box, once-per-ID email); the email itself not yet seen in a real inbox | Built, not confirmed | Stand-in only (15 checks) |
| Expected delivery date | Real date from the courier | Typed by you, or shipped date plus 5 working days (placeholder number) | Partly done | Pass (stand-in) |
| GST invoice | Invoice PDF with the email | None | Not done | - |
| Delivered and review request | Delivered email, then "how was it?" | Delivered email designed; the review request email does not exist yet | Partly done | - |

## 7. Cancel, return, refund and help

_Problems get solved without a phone call._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Contact form | Saved in WordPress and emailed | Works (validation tested live; sending tested earlier) | Done | Pass |
| Real contact details | WhatsApp number and support email on the page | WhatsApp, email, reply time and studio address now come from settings; each line stays hidden until you set it | Partly done | Pass (set and not set) |
| Policies | Shipping, returns, refunds, privacy, terms reviewed by a lawyer | Policy pages still hold placeholders and sample text until the owner and the lawyer give the real text | Partly done | Parked (waiting for text) |
| Cancel or return from the order page | A request button on the order | Order page now has "Ask a question" and "Cancel or return" links that open the contact form with the order number filled in; a one-tap request needs the backend | Partly done | Pass |
| Refund email | Branded refund email | Designed and coded | Built, not confirmed | Render only |
| Quick chat | WhatsApp button on every page | WhatsApp button on every page, shown once you set the number | Partly done | Pass (set and not set) |

## 8. Account

_Returning customers reorder in a tap._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Sign up, sign in, forgot password | Safe and simple | Works; forgot password gives the same answer whether or not the email exists | Done | Pass (live sign-up not tested) |
| Order history and saved addresses | Yes | Yes | Done | Pass (signed-out prompt) |
| Reorder, invoice download | Buy again, download invoice | Neither exists | Not done | - |
| Welcome email | After sign-up | Designed, but switched off for sign-ups made on the storefront | Partly done | - |
| Email check on sign-up | Confirm the address | Not built | Not done | - |

## 9. Custom print: quote, approve, pay, print

_A customer with a 3D file gets a price and a finished part._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Quote form with file upload | Upload up to 300 MB, get a reference | Works (QR number, file saved privately) | Done | Validation pass live; upload tested earlier |
| Your side: view, status, download, delete file | Request screen with statuses | Works in WordPress (Quote requests) | Done | Earlier test |
| Quote received email | Branded email with a summary | Quote request email now in the lime design (customer and studio copies) | Built, not confirmed | Render only |
| Send the price and let the customer accept | Email with price and an accept-and-pay link | Not built | Not done | - |
| Pay the advance, follow progress | Pay online; status page for the job | Not built (needs Cashfree and a status page) | Not done | - |

## 10. Business and bulk buyers

_A company gets a quote and a GST invoice._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Bulk price ranges and bulk quote form | Ranges on the product; request with GSTIN | Works | Done | Validation pass |
| Tax invoice, payment terms | GST invoice, optional credit terms | None | Not done | - |

## 11. Keep customers coming back

_Turn one order into the next._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Newsletter | Sign-up with a welcome email | Works; welcome email now in the lime design | Done | Earlier test |
| Abandoned cart, back in stock, review request | Automatic reminder emails | None | Not done | - |
| Offers and referral | Coupon campaigns, share-and-earn | Coupons work; no campaigns | Not done | - |

## 12. Your daily work in WordPress

_An order arrives, gets printed, shipped and closed without mistakes._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| New order alert | Email with items, options and photos | Designed and coded; quote, bulk, contact and review alerts to the studio now in the same design (not seen in a real inbox) | Built, not confirmed | Render only |
| Order statuses | Processing, In transit, Completed | In transit added; tracking box with partner list | Done | Stand-in |
| Courier tracking links | Each partner's link works | Links are my best knowledge and need checking; "Other" lets you type one | Partly done | - |
| Shiprocket | Labels, live rates, tracking sync | Plugin present, not connected to checkout or tracking | Not done | - |
| Security clean-up | No public username, unused plugins removed, 2FA | Mostly fixed; WPGraphQL still shows the admin username; readme.html public; plugins and 2FA unconfirmed | Partly done | Re-checked |

## Email templates

| Email | State | Note |
|---|---|---|
| Order confirmed (customer) | Designed, coded | Product photos, tracker, more from the category |
| In transit with tracking ID (customer) | Designed, coded, send-once rule tested | Needs the tracking box on the order |
| Order delivered (customer) | Designed, coded | Review button, more from the category |
| Payment needed and On hold (customer) | Designed, coded | Pay button |
| Payment failed (customer) | Designed, coded | Try again button |
| Refund issued (customer) | Designed, coded | Amount and method |
| A note from us (customer) | Designed, coded | Your note on the order |
| Welcome (customer) | Designed, coded, switched off | The account snippet turns it off for storefront sign-ups |
| Reset password (customer) | Designed, coded | Uses the storefront reset link |
| New order, cancelled, failed (to you) | Designed, coded | Print options and customer note |
| Quote request received (customer) | Designed, coded (customer and studio copies) | Needs the updated account snippet 2.6.0 and the emails plugin |
| Contact, newsletter welcome, bulk request, review waiting | Designed, coded | Same snippet 2.6.0; plain text is the fallback if the emails plugin is missing |
| Review request, abandoned cart, back in stock, order delayed, GST invoice | Not started |  |

## Still to do

### You (the owner)
- [ ] Set these values in Vercel (Settings, Environment Variables): NEXT_PUBLIC_WHATSAPP, NEXT_PUBLIC_SUPPORT_EMAIL, NEXT_PUBLIC_GSTIN, NEXT_PUBLIC_FREE_SHIPPING_FROM, NEXT_PUBLIC_REPLY_HOURS, NEXT_PUBLIC_STUDIO_ADDRESS, and NEXT_PUBLIC_SITE_URL once the real domain is chosen. Each one switches a line on; nothing else needs editing.
- [ ] Confirm the numbers: cash on delivery fee and limit, working days to print and to deliver (they drive the delivery date).
- [ ] Send the Cashfree test keys so online payment, advance payment and refunds to the original method can be built and tested.
- [ ] Give the real policy text (shipping, returns, refunds, privacy, terms, grievance) and have a lawyer and your CA review it.
- [ ] Put every product into a category in WooCommerce; upload your own product photos instead of Amazon-hosted ones; upload a .glb or .stl on products that should have a 3D view.
- [ ] Place one cash on delivery order, set it In transit with a tracking ID, and send me screenshots of the emails you receive.
- [ ] Choose analytics tools (Google Analytics, Search Console, Merchant Center, Meta pixel) so I can add them with a cookie notice.

### Backend team
- [ ] Upload the updated files: akrinity-headless-auth.php 2.6.0, akrinity-shop.php 1.1.0, akrinity-emails.php and the akrinity-emails folder. Confirm WP Mail SMTP sends.
- [ ] Connect Shiprocket for live rates and tracking, or enter courier rates by weight; check each delivery partner link in the tracking box.
- [ ] Deactivate WPGraphQL and unused plugins, delete readme.html, turn on 2FA for every admin, remove the claude-agent account before launch.
- [ ] Set wp-config values: AKRINITY_PRINT_DAYS, AKRINITY_DELIVERY_DAYS, AKRINITY_COD_FEE, AKRINITY_COD_LIMIT, AKRINITY_WHATSAPP, AKRINITY_GSTIN.
- [ ] Add a free-shipping method for orders above the amount the owner sets (so checkout matches the website message).
- [ ] Build the one-tap cancel and return request, the quote reply with an accept link, and a GST invoice (PDF) on the order; see the backend note.
- [ ] Daily off-site backups, host firewall and malware scan; delete the test orders (#295, #300) and the test quote requests.

### Frontend (Claude)
- [ ] P1 Cashfree online payment and advance payment for custom jobs, once the keys arrive.
- [ ] P1 GST invoice (PDF) on the order page and in the email, once the backend makes it.
- [ ] P2 One-tap cancel and return request, and the quote reply flow with an accept-and-pay link and a quote status page.
- [ ] P2 Reorder button, wishlist and cart synced to the account.
- [ ] P2 Cart upsell row; recently viewed.
- [ ] P2 Speed: the home page is 78 on a phone because of script work; split the heavy parts.
- [ ] P3 Abandoned-cart, back-in-stock and review-request emails; offers and referral.
- [ ] P3 Analytics and cookie notice after you choose the tools.
