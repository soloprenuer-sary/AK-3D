# Website flow report (27 Nov 2026 (after the account, email and courier work))

What a shop like Akrinity needs, step by step, what the site does today, and what the tests found. 64 steps in 12 flows.

**Score:** Done 37 · Built, not confirmed 9 · Partly done 15 · On hold 0 · Not done 3

## Tests run

| Test | Result | Where |
|---|---|---|
| Quote, approve and pay (live) | QR-350: quote sent, wrong pincode blocked, approved with address (Awaiting payment, order made), Cashfree test checkout opened from the website, test wallet payment SUCCESS, back on the website "Payment received", quote and order Paid. QR-330: request with a 3D file, then every status to Completed with an email logged for each. Not run: failed or cancelled payment, live Cashfree | Live website and server, test records |
| Phone view changes (27 Nov) | Live site, 375px: menu opens with quick links and category blocks, Get a quote fixed at the bottom, tapping a block opens its category, page does not scroll behind the menu, links close it; no page errors. Shop in 2 columns, product page opens at the top, photo previews and named colour options, Best sellers and Knowledge hub controls. Browser suite before the push: 72 passed, 6 skipped. Owner to confirm on a real phone | Live website at 375px and 1280px |
| Whole-trip browser test + single-flow tests (all 78 checks) | Latest run on the clean-up build: 72 passed, 6 skipped (2 place-order steps off by default, 2 device-specific, 2 policy-text checks parked until the lawyer text exists), 0 failed. Type check and lint are clean. One earlier run showed a forgot-password failure caused by my own repeated runs hitting the rate limit; it passed on a fresh server | Local build (not yet deployed; the changes are not committed) |
| Same tests before the fixes, on the live site | 36 passed, 6 failed (3 real gaps: no price sort, no delivery estimate, placeholder text), desktop and phone | Live site, before the fixes |
| Settings check (values set and not set) | With values set: free-shipping bar and message, WhatsApp button, footer GSTIN, contact lines, studio address all appear. With nothing set: those lines are left out instead of showing [placeholder] | Local build, both ways |
| Search engines and sharing | robots.txt, sitemap.xml (87 pages), web manifest, canonical links, share tags and a share picture, product data (price, stock, rating) on every product: all present on the new build. Live after the next deploy | Local build |
| Page speed on a phone (Lighthouse) | Local production build, phone: home 96, shop 97 to 98, category 92, product 92, FAQ 97, cart 97, checkout 97; total blocking time 30 to 120 ms. Before the speed work: home 82 to 92 here, 78 on the live site. Left: render-blocking CSS (about 20 KB gzipped) and about 27 KB of unused script. The live site has not been re-measured; do that after the deploy | Local production build (live site measured before: home 78, shop 83, product 87) |
| Accessibility and code clean-up | Footer and category-list headings skipped a level (h3 straight after h1): now h2, same look. Accessibility is 100 on home, shop, category, product, cart, checkout and FAQ (was 98 on shop, cart, checkout and category). Removed unused code: lib/env.ts, bestSellers, SHOP_CATEGORIES, subSlug. Not touched: about 49 CSS classes that look unused (some style WordPress A+ content), needs a visual check first | Local production build |
| Store set-up probe | Cash on delivery on, Cashfree hidden at that time (it is on now), flat-rate delivery (₹60 plus GST), CGST and SGST for Maharashtra, IGST for Delhi, in-transit fields, reviews, contact and 3D-model routes all answer | Live store |
| Security re-check | Fixed: public username list in the REST API, author redirect, login error text, plugin list. Still open: WPGraphQL still lists the admin username, readme.html still public | Live store |
| Emails | Order and account emails (12) plus the five request emails (quote, bulk, contact, newsletter, review) render without errors in the lime design; the send-once rule for the in-transit email passes 15 checks. NOT tested: a real email in a real inbox | Test harness |
| Not tested on purpose | Creating a customer account, sending a contact message, subscribing, posting a review and placing another order: each would create real records on the live store. These were tested earlier on a stand-in store | - |

## 1. Find us

_A stranger finds Akrinity on Google, Instagram or WhatsApp and lands on a page that makes sense._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Fast, mobile-friendly pages | Opens in under 3 seconds on a phone | Phone score is 92 to 98 on every page measured (live site was 78 to 94 before; the live site has not been re-measured) | Done | Pass (local build) |
| Search engines can read the site | sitemap.xml, robots.txt, canonical links | sitemap.xml (87 pages), robots.txt and canonical links added | Done | Pass (live after deploy) |
| Link previews on WhatsApp and Instagram | Share picture, title and price when a link is pasted | Share tags and a branded share picture added | Done | Pass (live after deploy) |
| Rich results on Google | Product structured data: price, stock, rating | Product data (price, stock, rating) added to every product page, plus Organisation data | Done | Pass (live after deploy) |
| Know where visitors come from | Analytics, Search Console, Merchant Center | Nothing installed (and no cookie notice yet) | Not done | - |
| Clear home page | Says what you make and how to order | Home page, printing, categories, best sellers (view-all beside the heading, arrows under the cards on phones), process, knowledge hub (same layout) | Done | Pass (phone and desktop widths) |

## 2. Browse and search

_Find the right product in a few taps._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Category menu | Main and sub-categories, popular picks | Eight main categories in menu order (Decor, Desk, Hot Wheels & diecast, Sports holders, Figurines & miniatures, Anime/gaming/cosplay, Jewellery, Keychains & gifts), driven from WordPress. Live since 25 Nov; owner approved the new pictures and banners on 27 Nov | Done | Pass (live menu check) |
| Products in the right category | Every product belongs to a category | Every product is placed in its category | Done | Owner checked |
| Search | Live results and a clear no-results message | Search overlay with live results | Done | Pass |
| Filter and sort | Filters plus sort by price | Filters plus sort by price on the shop page; the black box on the filter list when hovering is fixed | Done | Pass |
| Save and compare | Wishlist and compare | Wishlist and compare both work and survive a reload (kept in the browser, not synced to the account). Compare page rebuilt: sticky header with Add to cart, "show only differences", lowest price and best rating marked, size and weight rows, bulk prices | Done | Pass |
| Wrong address | Friendly 404 with a way home | Yes | Done | Pass |

## 3. Choose a product

_Be sure it is the right one, then pick options._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Photos and 3D view | Photos, and a 3D preview for printed items | The 3D view tab is back on every product. With a 3D file it shows the model; without one it shows a sample preview and a note that the real model is coming soon. The product quick view no longer overflows (short text with an ellipsis, link to full details) | Done | Owner checked; quick view overflow fixed |
| Description, features, specs | Intro, key features, A+ pictures, specs table | Done (intro and features on the text side; full width without A+ pictures) | Done | Pass |
| Options and personalised text | Material, colour, size, name text with checks | Yes, odd characters refused | Done | Pass |
| Bulk prices | Price ranges by quantity | Shown where the ranges are filled in | Done | Pass |
| Delivery estimate for my pincode | Gives a delivery date | Rule to build: printing time of the product + 7 business days (same rule as above) | Partly done | - |
| Reviews | Real reviews with stars | Working and held for your approval; none posted yet | Done | Pass (earlier, stand-in) |
| Free-shipping message | "Add ₹X more for free shipping" | Free-shipping message and progress bar appear in the cart once you set the amount; hidden until then | Partly done | Pass (set and not set) |

## 4. Cart

_Review and change the order without friction._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Add, change quantity, remove | Works, with a drawer and a cart page | Yes | Done | Pass |
| Cart is kept | Survives a reload; follows the customer to another device | Survives a reload; stays on this device only | Done | Pass (owner checked) |
| Upsell in the cart | Products that go with the cart | A "Goes well with your order" row is in the cart; not yet checked by eye with a live cart | Built, not confirmed | Cart tests pass |
| Coupon | Coupon box with clear messages | At checkout; the coupon box layout is fixed; a bad code shows the store's message | Done | Pass (stand-in) |

## 5. Checkout and payment

_Pay with the least effort and the right tax._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Guest checkout and details | No account needed, address with state and pincode | Yes, signed-in customers are pre-filled | Done | Pass |
| GST by state | CGST and SGST in Maharashtra, IGST elsewhere | Live on the store: Maharashtra splits, Delhi shows IGST | Done | Pass |
| Delivery charge | Real courier rates by weight and pincode | Flat rate ₹60 plus GST for every pincode (Shiprocket rates not connected) | Partly done | Pass |
| Cash on delivery | Fee and limit, hidden for made-to-order | Live; fee ₹50 and limit ₹3,000 are placeholders for you to confirm | Done | Pass (orders #295, #300 were placed) |
| UPI, cards, netbanking | Online payment with Cashfree | Cashfree works (quote payment passed in test mode). Shop checkout payment still to be run; live keys not set yet | Built, not confirmed | Quote payment passed; shop payment to run |
| Business GST details | GSTIN on the order | Saved on the order; bad GSTIN refused | Done | Pass |
| Made-to-order items | Pay online or an advance | Cash on delivery shows "Not offered for made-to-order items. Pay online instead." Online payment is in Cashfree test mode; no made-to-order payment has been run | Done | Pass (owner checked) |
| Advance payment for custom jobs | Pay part now, rest before dispatch | Built: custom jobs can pay an advance and the rest later, as the owner set it up | Done | Owner checked |

## 6. After the order

_The customer always knows where the order is._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Confirmation page | Shows the real order | Real order, items, GST, timeline | Done | Pass |
| Confirmation email | Branded email with photos and tracker | Designed and coded; upload and delivery to a real inbox not confirmed | Done | Owner checked: emails arrive |
| Track an order | By number plus email or phone | Works; wrong details give a clear message | Done | Pass |
| In transit with tracking ID | You pick the partner and type the ID; the customer gets one email | Works for custom quotes. Products: partner and tracking pattern set per product in WooCommerce; the order uses them | Partly done | Product setting tested on the server |
| Expected delivery date | Real date from the courier | Rule to build: printing time of the product + 7 business days, shown on the product page, cart and emails | Partly done | Rule waiting for the print time per product |
| GST invoice | Invoice PDF with the email | The GST invoice PDF is sent by email; business details still to add | Partly done | PDF sent by email |
| Delivered and review request | Delivered email, then "how was it?" | Review request is sent 7 days after Completed. Owner asked where it is triggered: it runs on the Completed status | Partly done | Not seen in an inbox |

## 7. Cancel, return, refund and help

_Problems get solved without a phone call._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Contact form | Saved in WordPress and emailed | Works (validation tested live; sending tested earlier) | Done | Pass |
| Real contact details | WhatsApp number and support email on the page | WhatsApp, email, reply time and studio address now come from settings; each line stays hidden until you set it | Partly done | Pass (set and not set) |
| Policies | Shipping, returns, refunds, privacy, terms reviewed by a lawyer | Policy pages still hold placeholders and sample text until the owner and the lawyer give the real text | Partly done | Parked (waiting for text) |
| Cancel or return from the order page | A request button on the order | A cancel or return form is on the order page. The request is kept on the order itself (no separate record), you approve it there, and the order page shows its state | Built, not confirmed | Server run on test orders; website form not run by me |
| Refund email | Branded refund email | Cancelled, return and refund emails share one design with a "Continue shopping" button; an order cancelled by hand sends it too | Built, not confirmed | Server run on test orders; inbox not checked |
| Quick chat | WhatsApp button on every page | WhatsApp button on every page, shown once you set the number | Partly done | Pass (set and not set) |

## 8. Account

_Returning customers reorder in a tap._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Sign up, sign in, forgot password | Safe and simple | Works; forgot password gives the same answer whether or not the email exists | Done | Pass (live sign-up not tested) |
| Order history and saved addresses | Yes | Yes | Done | Pass (signed-out prompt) |
| Reorder, invoice download | Buy again, download invoice | Account page: GST invoice download for shipped and paid orders, and a Reorder button that adds the order items to the cart | Built, not confirmed | Built; not yet tested in a browser |
| Welcome email | After sign-up | Designed welcome email sent on sign-up: account created, shop photos, category links | Built, not confirmed | Test render only; inbox not checked |
| Email check on sign-up | Confirm the address | Confirmation email after sign-up; a new one is sent when an unconfirmed account signs in (once an hour) | Built, not confirmed | Owner to check inbox |

## 9. Custom print: quote, approve, pay, print

_A customer with a 3D file gets a price and a finished part._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Quote form with file upload | Upload up to 300 MB, get a reference | Works (QR number, file saved privately) | Done | Validation pass live; upload tested earlier |
| Your side: view, status, download, delete file | Request screen with statuses | Works in WordPress (Quote requests). Fixed: a request screen left open no longer overwrites a newer status (this is why quotes stayed on Quoted) | Done | Pass (stale save tried on QR-330) |
| Quote received email | Branded email with a summary | Branded email with a summary; logged as sent in the live runs. Inbox not checked by me | Built, not confirmed | Sent (history log) |
| Send the price and let the customer accept | Email with price and an accept-and-pay link | Live: the quote email has an Accept button. The approve page shows the price reasons, GST and total and takes the delivery address with pincode and state checks. The WhatsApp button stays hidden until the real number is set. "Ask for a revised quote" is on hold | Done | Pass (live runs QR-330 and QR-350) |
| Pay the advance, follow progress | Pay online; status page for the job | Full payment opens from the website (Cashfree, test mode); success marks the quote and order Paid and returns to a "Payment received" page. Every status has its own email. No advance payment and no job status page | Partly done | Pass: ₹472 test payment (QR-350). Failed and cancelled payments not run |

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
| Abandoned cart, back in stock, review request | Automatic reminder emails | Review request is built. Abandoned cart needs the storefront to send carts (not built); back in stock not built | Partly done | - |
| Offers and referral | Coupon campaigns, share-and-earn | Thank-you offer email with a code and share button, after each order; OFF until the owner sets the code and switches it on (referral logic on hold) | Partly done | Test render only |

## 12. Your daily work in WordPress

_An order arrives, gets printed, shipped and closed without mistakes._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| New order alert | Email with items, options and photos | Designed studio alert with items, photos and options; WooCommerce plain email kept as fallback | Built, not confirmed | Test on a real order, email not seen yet |
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
| Quote steps (customer): in review, quote, payment, paid, printing, ready, shipped, complete | Sent in live test runs (history log) | Inbox delivery not checked by me |

## Still to do

### You (the owner)
- [ ] Give the real WhatsApp number; the "Chat on WhatsApp" button in the quote email appears once it replaces the placeholder.
- [ ] Check the test inbox for the quote emails of QR-330 and QR-350, including the invoice on the Shipped one.
- [ ] Decide when to take real payments: Cashfree is in test mode; live keys go into WooCommerce, Payments, Cashfree.
- [ ] Say when to delete the test records: orders #295, #300, #331, #351; QR-138, QR-139, QR-328, QR-329, QR-330, QR-350; CM-325, CM-327.
- [ ] Set these values in Vercel (Settings, Environment Variables): NEXT_PUBLIC_WHATSAPP, NEXT_PUBLIC_SUPPORT_EMAIL, NEXT_PUBLIC_GSTIN, NEXT_PUBLIC_FREE_SHIPPING_FROM, NEXT_PUBLIC_REPLY_HOURS, NEXT_PUBLIC_STUDIO_ADDRESS, and NEXT_PUBLIC_SITE_URL once the real domain is chosen.
- [ ] Confirm the numbers: cash on delivery fee and limit, working days to print and to deliver. Give the real business name, GSTIN and address (invoices use temporary ones).
- [ ] Give the real policy text (shipping, returns, refunds, privacy, terms, grievance) and have a lawyer and your CA review it.
- [ ] Put every product into a category; use your own product photos; add a .glb or .stl on products that should have a 3D view.
- [ ] Choose analytics tools (Google Analytics, Search Console, Merchant Center, Meta pixel) so they can be added with a cookie notice.

### Backend team
- [ ] Replace the temporary values in wp-config (WhatsApp, GSTIN, legal name, address) when you send them.
- [ ] Connect Shiprocket for live rates and tracking, or enter courier rates by weight; check each delivery partner link.
- [ ] Add a free-shipping method above the amount you set, so checkout matches the website message.
- [ ] Deactivate WPGraphQL and unused plugins, delete readme.html, turn on 2FA for every admin, remove the claude-agent account before launch.
- [ ] Daily off-site backups, host firewall and malware scan.
- [ ] At launch: decide whether to switch off WooCommerce "Coming soon" (today only the pay pages are open to visitors).
- [ ] Merge the category pictures, banners and backend-note commits that are on origin/main (not pulled into the local checkout yet).

### Frontend (Claude)
- [ ] P1 Cart: make the cart popup smaller so the checkout button shows without zooming out; show the suggested products as a slider of cards.
- [ ] P1 Delivery: free delivery above Rs 999, otherwise Rs 60 (checkout and cart).
- [ ] P1 Delivery date: product printing time + 7 business days, on product page, cart, pincode check and emails. Needs the print time per product (see question).
- [ ] P2 Owner question: decision 18 says no print hours shown to customers; confirm that the date rule may use the hours behind the scenes.
- [ ] P2 Cash on delivery: 40% advance online, rest on delivery, with the percentage set in admin; update the quote PDF and email too.
- [ ] P1 Owner to confirm the new phone menu and the phone product page on a real phone.
- [ ] P1 Test a failed and a cancelled Cashfree payment, and an online payment from the shop checkout.
- [ ] P2 Reorder button; wishlist and cart synced to the account; recently viewed.
- [ ] P2 Abandoned-cart and back-in-stock emails (the cart must be sent to the server first).
- [ ] P3 "Ask for a revised quote" message box (on hold); advance payment only if you want it; offers and referral once you give the rules.
- [ ] P3 Analytics and cookie notice after you choose the tools.
- [ ] P3 Measure live speed again; then trim the render-blocking CSS, unused script and about 49 unused CSS classes.
- [ ] P2 Set each product's category in WooCommerce so the new category tree fills up; then check each category page.
