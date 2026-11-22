# Website flow report (22 Nov 2026)

What a shop like Akrinity needs, step by step, what the site does today, and what the tests found. 64 steps in 12 flows.

**Score:** Done 26 · Built, not confirmed 4 · Partly done 15 · On hold 2 · Not done 17

## Tests run

| Test | Result | Where |
|---|---|---|
| Whole-trip browser test (12 steps) | 24 passed, 2 skipped (the place-order step, off by default), desktop and phone | Live site |
| Single-flow browser tests (22 flows) | 36 passed, 6 failed, 2 skipped (device-specific), desktop and phone. The 6 failures are 3 real gaps, each seen on desktop and phone: no price sort, no delivery estimate in the pincode check, and placeholder text on live pages | Live site |
| Page speed on a phone (Lighthouse) | Home 78, shop 83, product 87, checkout 94, quote 93. Accessibility 98 to 100, best practices 100, SEO 100 (checkout is 60 on purpose: it is hidden from Google). Desktop was 99 to 100 in the earlier run | Live site |
| Page and address check (31 addresses) | 26 pages open (200). Missing: robots.txt, sitemap.xml, web manifest, share image, llms.txt (404) | Live site |
| Search-engine tags on 20 pages | Titles and descriptions are there. No canonical link, no share (Open Graph) tags, no product structured data on any page | Live site |
| Store set-up probe | Cash on delivery on, Cashfree hidden by choice, flat-rate delivery (₹60 plus GST), CGST and SGST for Maharashtra, IGST for Delhi, in-transit fields, reviews, contact and 3D-model routes all answer | Live store |
| Security re-check | Fixed: public username list in the REST API, author redirect, login error text, plugin list. Still open: WPGraphQL still lists the admin username, readme.html is still public | Live store |
| Emails | All 12 designs render without errors with stand-in orders, and the send-once rule passes 15 checks. NOT tested: a real email in a real inbox | Test harness |
| Not tested on purpose | Creating a customer account, sending a quote with a file, sending a contact message, subscribing, posting a review and placing another order: each would create real records on the live store. These were tested earlier on a stand-in store | - |

## 1. Find us

_A stranger finds Akrinity on Google, Instagram or WhatsApp and lands on a page that makes sense._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Fast, mobile-friendly pages | Opens in under 3 seconds on a phone | Opens fast; phone scores 78 to 94 | Done | Pass |
| Search engines can read the site | sitemap.xml, robots.txt, canonical links | None of the three exist | Not done | Fail (404) |
| Link previews on WhatsApp and Instagram | Share picture, title and price when a link is pasted | No share (Open Graph) tags | Not done | Fail |
| Rich results on Google | Product structured data: price, stock, rating | None | Not done | Fail |
| Know where visitors come from | Analytics, Search Console, Merchant Center | Nothing installed (and no cookie notice yet) | Not done | - |
| Clear home page | Says what you make and how to order | Home page, printing, categories, best sellers, process, knowledge hub | Done | Pass |

## 2. Browse and search

_Find the right product in a few taps._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Category menu | Main and sub-categories, popular picks | Menu under the header, driven from WordPress | Done | Pass (desktop), phone menu pass |
| Products in the right category | Every product belongs to a category | Most products have no category in WooCommerce yet; the site guesses from the name | Partly done | - |
| Search | Live results and a clear no-results message | Search overlay with live results | Done | Pass |
| Filter and sort | Filters plus sort by price | Filters (category, colour option, stock, material); sort is Featured, Name, In stock only | Partly done | Filters pass, price sort FAIL |
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
| Delivery estimate for my pincode | Gives a delivery date | Only says "shown at checkout"; checkout does not show a date either | Partly done | FAIL |
| Reviews | Real reviews with stars | Working and held for your approval; none posted yet | Done | Pass (earlier, stand-in) |
| Free-shipping message | "Add ₹X more for free shipping" | Shows the placeholder [AMOUNT] | Partly done | FAIL (placeholder) |

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
| Delivered and review request | Delivered email, then "how was it?" | Delivered email designed; the review request email does not exist | Partly done | - |

## 7. Cancel, return, refund and help

_Problems get solved without a phone call._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| Contact form | Saved in WordPress and emailed | Works (validation tested live; sending tested earlier) | Done | Pass |
| Real contact details | WhatsApp number and support email on the page | Shows [WhatsApp number] and [support email] | Partly done | FAIL (placeholder) |
| Policies | Shipping, returns, refunds, privacy, terms reviewed by a lawyer | Pages exist but hold placeholders and sample text | Partly done | FAIL (placeholder) |
| Cancel or return from the order page | A request button | None; customer must write to you | Not done | - |
| Refund email | Branded refund email | Designed and coded | Built, not confirmed | Render only |
| Quick chat | WhatsApp button on every page | None | Not done | - |

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
| Quote received email | Branded email with a summary | Plain text today; the lime design exists but is not connected | Partly done | - |
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
| Newsletter | Sign-up with a welcome email | Works (saved in WordPress, welcome email) | Done | Earlier test |
| Abandoned cart, back in stock, review request | Automatic reminder emails | None | Not done | - |
| Offers and referral | Coupon campaigns, share-and-earn | Coupons work; no campaigns | Not done | - |

## 12. Your daily work in WordPress

_An order arrives, gets printed, shipped and closed without mistakes._

| Step | A good shop | Akrinity today | Status | Test |
|---|---|---|---|---|
| New order alert | Email with items, options and photos | Designed and coded (not seen in a real inbox) | Built, not confirmed | Render only |
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
| Quote request received (customer) | Designed only | Still sent as plain text |
| Contact, newsletter welcome, bulk request, review waiting | Plain text | Not yet in the lime design |
| Review request, abandoned cart, back in stock, order delayed, GST invoice | Not started |  |

## Still to do

### You (the owner)
- [ ] Give the real values: WhatsApp number, support email, GSTIN, free-shipping amount, COD fee and limit, delivery days, refund time, return and warranty terms (they replace the [placeholders] on every page).
- [ ] Send the Cashfree test keys so online payment can be switched on and tested.
- [ ] Have the policies and the tax set-up reviewed by a lawyer and your CA.
- [ ] Upload your own product photos in place of Amazon-hosted pictures; put every product into a category in WooCommerce.
- [ ] Upload a .glb or .stl file on the products you want a 3D view for.
- [ ] Place one cash on delivery order, set it to In transit with a tracking ID, and send me a screenshot of both emails from your inbox.

### Backend team
- [ ] Confirm akrinity-emails.php and the akrinity-emails folder are uploaded; confirm WP Mail SMTP sends.
- [ ] Connect Shiprocket (or enter courier rates) and check each delivery partner's tracking link.
- [ ] Deactivate WPGraphQL and unused plugins, delete readme.html, add 2FA, remove the claude-agent account before launch.
- [ ] Set the real working-day numbers in wp-config (AKRINITY_PRINT_DAYS, AKRINITY_DELIVERY_DAYS) and the COD fee and limit.
- [ ] Configure daily backups and the host firewall.
- [ ] Delete the test orders (#295, #300) and test quote requests.

### Frontend (Claude)
- [ ] P1 Search engines: sitemap.xml, robots.txt, canonical links, share tags, product structured data.
- [ ] P1 Replace the [placeholders] with values from the owner (a settings file, one place).
- [ ] P1 Pincode check that gives a real delivery date; free-shipping progress bar.
- [ ] P1 Price sort and a few more filters (price range).
- [ ] P2 Cancel and return request on the order page; WhatsApp chat button.
- [ ] P2 GST invoice (PDF) on the order page and in the email.
- [ ] P2 Reorder button and wishlist sync in the account; cart synced to the account.
- [ ] P2 Quote reply flow: price email, accept-and-pay link, quote status page.
- [ ] P2 Move the quote, contact, newsletter, bulk and review emails into the lime design.
- [ ] P3 Abandoned-cart, back-in-stock and review-request emails; offers and referral.
- [ ] P3 Analytics and a cookie notice once you choose the tools.
- [ ] After Cashfree keys: online payment, advance payment for custom jobs, refunds to the original method.
