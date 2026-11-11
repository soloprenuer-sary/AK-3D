# Akrinity Website: Build Plan, Draft 3.1 (Fully Headless, WooCommerce as the commerce engine)

Status: PLANNING ONLY. Nothing here is built. No development starts until Satyam confirms.
Date: 2026-11-12.
Replaces Draft 2's theme/Elementor approach. Draft 1 (`BUILD_SPEC.md`) and Draft 2 (`BUILD_PLAN_DRAFT_2.md`) stay on disk for reference; where this draft conflicts, this draft wins.
Tags: **[VERIFY]** test or confirm before relying on it. **[LAWYER/CA]** needs professional sign-off. **[INFERRED]** my design decision, not a sourced fact. **[SPIKE]** a short throwaway experiment that must pass before the dependent work starts.

---

## 1. The new direction

- **Backend: WordPress + WooCommerce, headless.** Used as the CMS, product catalogue, cart/order engine, payments, invoices and admin. **Satyam writes no custom backend code**: no custom theme, no custom plugins. Backend = stock WordPress/WooCommerce + existing plugins + configuration.
- **Frontend: React (Next.js), three.js, GSAP, parallax.** All custom code lives in one frontend repository. This is where the design from the canvas is built exactly.
- The visual design stays the canvas v2 (Anton + Inter, ink / paper / lime accent / violet / orange, 1.5px borders, hard shadows on hover, stripe placeholders).

What this changes from earlier drafts:

| Earlier | Now |
|---|---|
| Custom WP theme | None. WordPress shows no public pages; a minimal "headless" theme sends visitors to the frontend |
| Elementor | Dropped (no WP front end to build in) |
| Custom plugins: core, files, quotes, gst, b2b | **Replaced by stock plugins and frontend code** (section 4) |
| Motion | Not in the design earlier; now GSAP scroll animation, parallax and three.js are wanted (section 6) |

---

## 2. Architecture

```
Visitor (mobile/desktop)
   |
   v
[Frontend: Next.js + React + GSAP + three.js]  (static pages on a CDN, plus a few small server routes "BFF")
   |  GraphQL / REST (read catalogue, cart, account)      |  presigned upload      |  Store API checkout + payment
   v                                                       v                        v
[WordPress + WooCommerce  (cms.akrinity.com)]        [Cloudflare R2: private 3D files]   [Razorpay (payment step), confirmed by webhook]
   WPGraphQL + WooGraphQL, ACF, status plugin,
   Razorpay, Shiprocket, PDF invoices, forms
```

Key choices **[INFERRED]** (each backed by the spikes in section 11):

1. **Static-first frontend.** Catalogue pages (home, categories, products, guides, portfolio, policies) are generated at build time from WordPress. A WooCommerce/WordPress webhook triggers a rebuild when products or content change (20 to 100 products builds in minutes). Live data (stock, cart, account, order tracking, quote status) is fetched in the browser from WordPress. This is the cheapest, fastest-on-mobile and most SEO-friendly option, and avoids paying for server rendering.
2. **Completely headless: WooCommerce does all the commerce through its API, the frontend only renders it.** Products, variations, prices, bulk discounts, GST, shipping rates, COD rules, coupons, stock, cart, checkout, payment, orders, order statuses, emails and invoices are all WooCommerce. The React app calls WooCommerce's endpoints (Store API for cart, checkout and live data; WPGraphQL for catalogue and content) and never calculates prices, tax or shipping itself. No customer-facing WordPress checkout page is used (a fallback only if the Razorpay spike fails, see section 2A). This is Satyam's decision for this draft.
3. **Quotes are WooCommerce orders.** A quote request creates an order in a custom status "Quote requested"; the admin edits it, sets a price and moves it to "Quoted"; the customer approves and pays from the same order. One pipeline for quotes and orders, no custom tables.
4. **Customer files go straight to private Cloudflare R2** from the browser with short-lived signed URLs; WordPress only stores the file reference on the order.

---

## 2A. WooCommerce is the commerce engine; the frontend is the face

Principle: **every commerce rule lives in WooCommerce and its plugins.** The frontend shows what WooCommerce returns and sends the visitor's actions back. Prices, discounts, tax, shipping, COD availability, stock and order status are never decided in React. This keeps the numbers correct, keeps admin simple (Satyam manages everything in WooCommerce), and means a frontend bug cannot change a price.

### Endpoints the frontend uses

Facts from WooCommerce's own documentation: the Store API is stable and has cart, checkout and order-placement endpoints; it identifies a guest's cart with a `Cart-Token` header returned by cart responses; since WooCommerce 9.8 the token is exposed to CORS-protected browser requests, so React can call WooCommerce directly without a proxy ([Cart tokens](https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/), [Store API updates in 9.8](https://developer.woocommerce.com/2025/04/02/store-api-updates-coming-in-woocommerce-9-8/), [Checkout API](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/checkout/), [Placing an order tutorial](https://developer.woocommerce.com/2023/09/20/tutorial-placing-an-order-using-the-store-api/)).

| Frontend job | WooCommerce endpoint | Notes |
|---|---|---|
| Catalogue, categories, variations, ACF content (build time) | WPGraphQL + WooGraphQL | Used at build time to generate static pages; includes ACF fields (made-to-order flag, lead time, bulk tiers) |
| Live price, stock, variations (browser) | Store API `/wc/store/v1/products` | Refreshes what the static page showed |
| Cart | Store API `/cart`, `/cart/add-item`, `/cart/update-item`, `/cart/remove-item`, `/cart/apply-coupon` | `Cart-Token` kept in the browser; totals, tax and discounts come back from WooCommerce |
| Shipping rates and pincode check | Store API `/cart/update-customer` then `/cart/select-shipping-rate` | WooCommerce (with Shiprocket's plugin) returns the rates for the entered address **[VERIFY]** |
| Available payment methods | Cart response (payment methods list) **[VERIFY]** | COD disappears automatically for made-to-order and personalized carts because the COD rules plugin decides |
| Checkout | Store API `POST /checkout` | Sends billing and shipping address, GSTIN field, chosen payment method and its `payment_data`; WooCommerce creates the order and returns order id, status and a payment result |
| Payment | Razorpay plugin | Needs the format Razorpay's plugin expects inside `payment_data`; the docs say `payment_data` is gateway-defined and no Razorpay details were found, so this is the main **[SPIKE]** |
| Payment confirmation | Razorpay webhook to WordPress | WooCommerce marks the order paid; the frontend polls the order, it never trusts the browser alone |
| Order confirmation and status | Store API order lookup (order key + email) for guests; authenticated routes for accounts | Status comes back as a slug (WooCommerce REST returns a custom status's slug) |
| Accounts | JWT login via WPGraphQL; customer orders, addresses | Account reads go through WooCommerce, never from stored copies |
| Admin | WooCommerce admin | Orders, quotes, statuses, invoices, shipping labels, stock |

### Cart and checkout flow (all through WooCommerce)

1. Visitor adds an item; React calls `cart/add-item` with the product, variation and any personalization data; WooCommerce returns the new cart with prices and tax.
2. The cart drawer and `/cart` page render that response only.
3. Visitor enters the delivery address; the frontend updates the customer address; WooCommerce returns shipping rates and the free-shipping result.
4. The checkout page asks WooCommerce which payment methods apply; COD is absent when the cart contains a made-to-order or personalized item.
5. React submits `POST /checkout`; WooCommerce validates, creates the order and starts the payment.
6. For Razorpay the browser completes the payment step, WooCommerce confirms via the webhook, and the frontend shows the confirmation page when the order reaches a paid status.
7. WordPress sends the order emails and invoice; the customer sees the order, status timeline and invoice in their account.

If the Razorpay **[SPIKE]** fails (the plugin cannot take a Store API checkout), the fallback is to keep steps 1 to 4 headless and send only the payment step to a WooCommerce "order-pay" page, then return to the frontend. This keeps all commerce rules in WooCommerce.

### The two risks Satyam named, and the plan for each

**Product personalization text (for example a name on an item) may not survive into the order with a stock plugin.**

- Why: a custom field on the product page only reaches the order if something stores it with the cart item and then copies it to the order line item. WooCommerce's Store API can be extended to carry such data, but the copy into the order is done by server-side hooks, which stock plugins may or may not do for Store API requests ([extending the Store API](https://developer.woocommerce.com/docs/apis/store-api/extending-store-api/extend-store-api-add-data/)). A WooCommerce reference for another extension says add-on data can be added through the Store API and shown in cart responses, which suggests a good add-on plugin can do this.
- Plan, in order: (1) test candidate product add-on plugins (WooCommerce's own Product Add-Ons first) against four rules: the text is sent with `add-item`, comes back in the cart response so React can show it, is saved on the order line item and shown in the admin order, emails and invoice, and still works with the COD restriction; (2) if none passes, use **one tiny must-use snippet**, **approved by Satyam on 2026-11-12**, as the single exception to "no custom backend code". Its scope is fixed: (a) register the personalization field with the Store API so `add-item` accepts it and cart responses return it, (b) sanitise it (strip tags, trim, length limit such as 40 characters, allowed characters to be decided), (c) copy it to the order line item so it shows in the admin order, emails and invoice, and (d) nothing else. It is a single file of about 30 to 60 lines, kept in the project repo under version control and documented, and any further backend snippet needs a new approval; (3) the quote-flow route (personalization text as part of a quote order) stays as the backup if the snippet cannot be made to work.
- Rule: no personalized product goes live until a test order proves the text appears on the order, the email and the invoice.

**Custom order statuses may not show up in the endpoint.**

- Why: custom statuses registered through a plugin are normal WooCommerce statuses, and the WooCommerce REST API returns an order's custom status as its slug ([Custom Order Status docs](https://woocommerce.com/document/custom-order-status/)). The risk is in WPGraphQL: its status type may be a fixed list that does not include custom slugs (I could not confirm either way).
- Plan: read order status from the Store API or WooCommerce REST (slug) rather than from a GraphQL enum; keep a small status map in the frontend config (slug to customer label, step number, icon): Quote requested, Quoted, Approved, Advance paid, Printing, QC, Shipped, Delivered. Pick a status plugin that registers real WooCommerce statuses with per-status emails. Unknown slugs fall back to a neutral "In progress" label so the page never breaks.
- **[SPIKE]**: create each status, place a test order, change its status in admin, and confirm the account page shows the right label and the right email is sent.

---

## 3. The "no custom backend code" rule: what is realistic

Honest assessment: stock plugins cover most of the old custom-plugin jobs, but headless always has a few seams. Rule proposed **[INFERRED]**: the goal is **zero custom PHP**. Anything below that cannot be done with a plugin or setting is listed explicitly, and Satyam decides case by case whether to allow a tiny snippet (for example a ~50 to 100 line must-use file) or change the feature.

### 3.1 Old custom plugins mapped to stock parts

| Earlier custom plugin / job | Headless replacement (no custom PHP) |
|---|---|
| `akrinity-core`: settings (announcement bar, stats, WhatsApp number, free-shipping threshold) | ACF fields on a "Site Settings" page, exposed through WPGraphQL for ACF **[VERIFY]** (ACF free has no options page; use a normal page with fields, or the fork/Pro if needed) |
| `akrinity-core`: custom order statuses (Quote requested, Quoted, Approved, Advance paid, Printing, QC, Shipped, Delivered) | A custom-order-status plugin (several free options exist; pick one that supports per-status emails) **[VERIFY]** |
| `akrinity-core`: portfolio | Custom post type via CPT UI + ACF, exposed by WPGraphQL |
| `akrinity-files`: private uploads | Frontend server route (BFF) signs R2 uploads; file keys saved in order meta. No WordPress file storage |
| `akrinity-quotes`: quote form, tables, admin editor | Frontend form + BFF creates a WooCommerce order via the WooCommerce REST API (server-side keys); admin uses the normal WooCommerce order screen |
| `akrinity-gst`: GST invoices | PDF Invoices & Packing Slips (free) plus a GST add-on/template; GSTIN collected as a checkout/account field by a plugin **[VERIFY]** |
| `akrinity-b2b`: B2B accounts, bulk quotes | Bulk quote = the same quote flow. B2B approval and price lists: evaluate an existing wholesale/B2B plugin in Phase 2 **[VERIFY]** |
| `akrinity-viewer`: 3D viewer | Frontend three.js (section 6) |
| Quote engine (Phase 3) | Separate service called by the frontend (section 9); not WordPress code |
| Advance + balance payment | Start manual: owner sends a Razorpay Payment Link for the balance from the Razorpay dashboard; a deposit/partial-payment plugin later if volume justifies it |

### 3.2 Known seams that may need a tiny backend snippet (decide later)

1. **Personalization text and other custom cart data** (name or text on a product): the most likely place a stock plugin falls short. Full plan in section 2A: test add-on plugins first, then use the one small snippet Satyam approved (2026-11-12); the quote-flow route stays as a backup. No personalized product goes live until a test order shows the text on the order, email and invoice.
2. **Custom order statuses in the API**: WooCommerce REST returns the slug; GraphQL may not list custom statuses. The frontend reads the slug from the Store API or REST and maps it to labels (section 2A).
3. **Cart session across domains**: the Store API `Cart-Token` header avoids cookie problems between the frontend domain and WordPress; WordPress must allow the frontend origin through CORS and expose the token header **[VERIFY]** on the installed WooCommerce version (the CORS change shipped in 9.8).
4. **CORS, JWT auth, cookie settings, redirect of public WP pages to the frontend**: configuration plugins or `wp-config.php`/host settings; one small config file at most.
5. **Revalidation webhooks**: WooCommerce has built-in webhooks (product created/updated) that can call a build hook URL; content (ACF, pages, posts) may need a plugin **[VERIFY]**.

Frontend server routes (BFF) are the one "backend-like" place and they live in the **frontend repo** (so within Satyam's rule): R2 upload signing, quote submission (creates the order with server-side WooCommerce keys), pincode serviceability, form spam check (Turnstile), analytics events, revalidation. Secrets (R2 keys, WooCommerce REST keys, Turnstile secret) live only in the frontend host's environment variables.

---

## 4. Backend: WordPress setup (no custom code)

### 4.1 Plugin list (all free unless noted)

| Need | Plugin | Notes |
|---|---|---|
| Commerce | WooCommerce | HPOS on |
| API for the frontend | WPGraphQL + WPGraphQL for WooCommerce (WooGraphQL) | De facto standard for headless Woo reads and cart/checkout mutations; docs cover cart and checkout **[VERIFY]** current version and WordPress 7.x compatibility |
| Cart, checkout, shipping rates, live stock | **WooCommerce Store API** (built into WooCommerce, no plugin) | Primary API for everything transactional (section 2A) |
| Alternative API | CoCart (headless cart REST API) | Plan B only if the Store API cannot do something; some features are in its paid tier **[VERIFY]** |
| Content fields | ACF + WPGraphQL for ACF | Product fields: fulfilment type (in stock / made to order), lead time, bulk price tiers, material tags; pages and settings |
| CPTs | Custom Post Type UI | Portfolio, guides if not using posts |
| Auth for accounts | JWT auth plugin for WPGraphQL **[VERIFY]** | Customer login from the frontend |
| Payments | Razorpay for WooCommerce | Runs on the WordPress checkout page; confirm payment through webhooks, not redirects |
| COD rules | "Disable payment method / COD fees / Partial payment" (free tier) | COD off for made-to-order and personalized; pincode and value limits |
| Shipping | Shiprocket WooCommerce plugin | Labels, tracking; frontend pincode check through the Store/GraphQL shipping rates or Shiprocket's API from the BFF **[VERIFY]** |
| Bulk pricing | A free discount-rules plugin | Applies tiers at the cart; tier table for display comes from ACF **[VERIFY]** they agree |
| Order statuses | Custom order status plugin | The brief's 8-stage pipeline plus emails |
| Invoices | PDF Invoices & Packing Slips + GST fields add-on | **[LAWYER/CA]** on HSN/SAC and advances |
| SEO data | Rank Math or Yoast + its GraphQL integration | Feeds titles, descriptions, schema to the frontend **[VERIFY]** |
| Feeds | Google Listings & Ads; Meta for WooCommerce | Product URLs must point at the frontend domain (section 8) |
| Email | Brevo SMTP (300/day) | Order and status emails stay WordPress-sent |
| Security | A login-hardening plugin; Cloudflare in front | Admin 2FA, rate limits |

### 4.2 Configuration

- WordPress on `cms.akrinity.com`; the public domain (`akrinity.com`) serves the frontend. A "headless" minimal theme redirects any public WP URL to the equivalent frontend URL, except `/wp-admin`, `/wp-json`, `/graphql`, and the checkout, order-pay and payment-return pages.
- WooCommerce: INR, India tax and GST settings, shipping zones and classes by weight band, COD restricted by category.
- Products: categories (placeholders until Satyam confirms), variations (material, size, colour), ACF fields for in-stock vs made-to-order, lead time and bulk tiers. Product images pre-optimised (WebP, 1200 x 1200).
- Customers never see WordPress checkout or account pages; they use the frontend. WordPress pages are used only for the admin and, if the Razorpay spike fails, the order-pay fallback page (lightly styled with Customizer CSS). CORS must allow the frontend origin for the Store API.
- Quote order flow in WooCommerce admin: new status "Quote requested" -> admin adds the price as order items or fees -> status "Quoted" (customer is emailed an order-pay link) -> customer pays the advance or full amount -> statuses continue to Printing, QC, Shipped, Delivered.

---

## 5. Frontend stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** | Mainstream React meta-framework, strong static generation, big ecosystem |
| Rendering | **Static export / static generation with client-side data for live parts** | Cheapest hosting, fastest mobile pages. Server rendering is not required for 20 to 100 products |
| Data | GraphQL client against WPGraphQL (typed with codegen) | Matches WooGraphQL |
| State | Lightweight store (Zustand) for cart UI and drawer; server state via React Query or SWR | Small bundles |
| Styling | CSS variables from the System board tokens + Tailwind CSS v4 (tokens mapped in its theme) | Exact tokens, fast to build the component classes |
| Animation | **GSAP + ScrollTrigger** (all GSAP plugins are free for commercial use since Webflow's acquisition, per Webflow's announcement; check gsap.com/standard-license) | Scroll reveals, parallax |
| 3D | **three.js via @react-three/fiber + drei** | Hero 3D scene, product and upload viewer |
| Forms | React Hook Form + Zod | Quote form validation |
| Fonts | Anton and Inter self-hosted, latin subset, `font-display: swap`, preload Anton | Design requirement |
| Images | Next image optimisation is not available on a pure static export; pre-generate WebP/AVIF sizes at build with a build script, `srcset`, lazy-load | Fast mobile |
| Testing | Playwright for flows (browse, cart, quote, checkout hand-off), Lighthouse CI for speed | |
| Repo | One repo `akrinity-web`, TypeScript strict, ESLint, GitHub Actions | |

Proposed structure:

```
akrinity-web/
  app/
    (site)/ page.tsx (Home), shop/, shop/[category]/, product/[slug]/, cart/, quote/, design-service/,
            business/, portfolio/, portfolio/[slug]/, guides/, guides/[slug]/, [policy]/, not-found.tsx
    account/ (login, register, orders, orders/[id], quotes, files, details)
    api/ (BFF server routes)  uploads/sign, quotes/submit, pincode, revalidate, contact
  components/
    ui/ (Button, Pill, Tag, Chip, Input, Card, Stripe)
    layout/ (AnnouncementBar, Header, MobileDrawer, Footer)
    home/ (Section01 ... Section13)
    product/ (Gallery, OptionPills, Swatches, QtyStepper, Fulfilment, PincodeCheck, BulkTable)
    quote/ (QuoteForm, FileDrop, UploadProgress)
    account/ (OrderTimeline, QuoteView)
    motion/ (Reveal, Parallax, useScrollTrigger)
    three/ (HeroLayers, ModelViewer, loaders)
  lib/ (graphql client, woo cart, auth, r2 signer, seo, analytics, env)
  styles/ (tokens.css, base.css)
  public/fonts/, public/images/
  tests/ (playwright)
```

---

## 6. Motion and 3D plan (GSAP, parallax, three.js)

Mobile speed is priority 1 and most Indian traffic is mid-range Android, so the rule is: **content and layout first, motion and 3D load after the page is usable, and everything has a static fallback.**

### 6.1 Rules **[INFERRED]**

- GSAP core (about 25 to 30 KB) + ScrollTrigger only where used; import per page, not globally.
- three.js scenes are dynamic imports, loaded after first paint (after LCP, and only when the section is near the viewport). No three.js on the first request of a product page unless the visitor opens the viewer.
- Cap device pixel ratio (about 1.5), simple geometry, no heavy post-processing, no shadows on mobile; pause rendering when off-screen or the tab is hidden.
- Respect `prefers-reduced-motion`, data-saver and low-memory/low-end device hints: show the static design (the CSS disc with stacked bars from the board, or a poster image) instead.
- Parallax and scroll animation only on decorative layers (stripe shapes, stacked bars, tile backgrounds, portfolio tiles), never on text that must be readable or on form controls. Keep transforms and opacity only (no layout thrash).
- Scroll smoothing (Lenis-style) off by default: it can hurt accessibility and mobile performance **[VERIFY]** if wanted.
- Performance budget (proposal): home page JS under about 200 KB gzip before three.js; LCP under 2.5 s on a throttled mid-range phone; three.js bundle lazy and under about 150 KB gzip for the hero scene **[VERIFY]** by measurement.
- **Conflict with the design to resolve:** the System board says "respect prefers-reduced-motion; no autoplay motion". Scroll-linked motion that the visitor drives is compatible; continuous autoplay spin or float is not. Proposal: scroll- and pointer-driven only, no autoplay, and Satyam approves a short motion spec before building.

### 6.2 Where motion/3D goes (all proposed, none designed yet)

| Home section | Proposed effect |
|---|---|
| 01 Announcement, 02 Header | None (header sticky; drawer open/close on mobile) |
| 03 Hero | three.js scene of stacked layers (echoing the 30 bars on the disc) that builds up as the visitor scrolls, with the CSS disc as the fallback poster; text has a short staggered reveal |
| 04 Stats | Numbers count up on first view (respecting reduced motion) |
| 05 Statement | Highlight chip draws in on reveal; slight parallax on the band background |
| 06 Categories | Tiles reveal with stagger; parallax on the decorative stripe shapes |
| 07 Custom print banner | Upload card slides in; drop-zone arrow nudge on hover only |
| 08 Best sellers | Cards reveal with stagger; hover lift with hard shadow (CSS) |
| 09 Process | Five steps reveal in sequence, number highlights as each enters |
| 10 Materials | Cards reveal; colour header subtle parallax |
| 11 Selected work | Tiles parallax at different speeds; image scale on hover (CSS) |
| 12 Final CTA, 13 Footer | Headline reveal; none on footer |

Product page: image gallery with optional **3D viewer tab** (three.js, loads on click) for products that have a GLB or STL. Quote page: **instant file preview** in the browser (STL, 3MF, OBJ via three.js loaders; STEP/IGES via `occt-import-js`, lazy) showing dimensions and an advisory volume figure; the real validation still happens when staff review the file (units for STL are unknown, so the customer confirms mm or inches).

---

## 7. Frontend routes, data and flows

| Route | Data source | Rendering |
|---|---|---|
| `/` Home | ACF (stats, announcement, copy), categories, best sellers, portfolio | Static |
| `/shop`, `/shop/[category]` | WooGraphQL products | Static; filters in the browser |
| `/product/[slug]` | Product, variations, ACF fields, related | Static; live stock and price check in the browser |
| `/cart` | Cart (WooGraphQL/CoCart session) | Client |
| Checkout | Store API checkout (address, shipping, payment, confirmation) | Client |
| `/quote` | Form + BFF | Client form, signed uploads |
| `/account/*` | JWT login, orders, quotes (orders in quote statuses), files | Client |
| `/portfolio`, `/guides`, policy pages, `/business`, `/design-service` | WordPress pages/CPTs | Static |
| 404, search | Client search over a prebuilt index | Static |

### 7.1 Quote with private upload

1. Visitor picks "Print my file" or "Design and print", chooses files (STL/3MF/OBJ/STEP/IGES, or JPG/PNG/PDF for design), sees an instant local preview.
2. Browser asks the BFF for upload URLs (Turnstile checked); the BFF validates extension and size limits and returns presigned multipart URLs for a private R2 bucket (short expiry, random object keys).
3. Browser uploads directly to R2 (handles 100 to 300 MB, bypassing WordPress and Cloudflare's 100 MB proxy cap) **[SPIKE]**.
4. On submit the BFF creates a WooCommerce order with status "Quote requested" through the WooCommerce REST API using server-side keys, storing the request details, GSTIN and the R2 object keys as order meta; the customer gets a confirmation email from WordPress.
5. Admin reviews in WooCommerce. Opening a customer's file uses a signed download link: a small protected frontend route (behind Cloudflare Access, which is free for small teams **[VERIFY]**) generates a short-lived link from the stored key. Fallback: open the object in the Cloudflare R2 dashboard.
6. Admin prices the order, sets "Quoted"; the customer is emailed and sees it in their account; approves and pays.
7. Retention: lifecycle rules delete unconverted quote files after a set period and originals some months after completion (periods to be decided) **[LAWYER/CA]** for DPDP.

Data model, pricing formula and Phase 3 engine design from `BUILD_SPEC.md` sections 10 and 16 still apply, except that data lives in WooCommerce orders and R2 rather than custom tables.

### 7.2 Cart and checkout

- Product page: variation pills (material, size), colour swatches, personalization text (see seam 3.2), quantity stepper, Made-to-order or In-stock tag from the ACF field, delivery text, pincode check, bulk price table, WhatsApp button, add to cart.
- Cart drawer and `/cart` page in React; free-shipping progress from the settings page.
- Checkout is a full React page that talks to WooCommerce's Store API end to end (address, shipping rates, payment methods, order placement; flow in section 2A). COD is automatically unavailable for made-to-order and personalized carts because the COD rules plugin decides; Razorpay handles UPI, cards and netbanking **[SPIKE]**; payment is confirmed server-side by the Razorpay webhook, and the frontend shows the confirmation page once WooCommerce marks the order paid.

### 7.3 Accounts and order tracking

- Login/registration via JWT from the React app; the account area lists orders and quotes with the 8-stage timeline (statuses from the status plugin), courier tracking link from Shiprocket order meta, invoice download link, and "pay balance" link.
- B2B: Phase 2; GSTIN stored on the customer/order; bulk quotes use the same quote flow.

---

## 8. SEO, marketing and compliance impact of going headless

Going headless moves several WordPress plugin jobs into the frontend, which is extra work Draft 2 did not have:

| Job | Where it now lives |
|---|---|
| Page titles, meta, canonical, Open Graph, structured data (Product, Offer, Organization, Breadcrumb) | Frontend (data from the SEO plugin's GraphQL fields **[VERIFY]**, JSON-LD generated in React) |
| XML sitemap and robots.txt | Frontend build |
| Google Merchant and Meta product feeds | Plugins run in WordPress but must emit **frontend** product URLs (set the WordPress home URL to the public domain, keep the site URL on `cms`, or add redirects) **[VERIFY]**; otherwise Google will crawl `cms` URLs |
| Analytics (GA4), Meta Pixel and Conversions API, consent banner | Frontend code; purchase events fire on the frontend confirmation page once WooCommerce confirms payment |
| WhatsApp button | Frontend component |
| Spam protection (Turnstile) | Frontend + BFF |
| Redirects, 404s | Frontend host config |
| Reviews | WooCommerce reviews exposed through GraphQL; submission through a GraphQL mutation or BFF **[VERIFY]** |
| Policy pages, grievance officer, consent logging | Pages from WordPress; consent UI in the frontend **[LAWYER/CA]** |

Legal dates and gates unchanged: amended e-commerce rules from 1 January 2027 (no dark patterns, prominent seller and grievance details, lowest-price display on discounts), DPDP duties around 13 May 2027, GST registration before first sale. Marketing rules unchanged: never use Amazon order messages or inserts to send Amazon buyers to the site, keep site prices at or below Amazon, write fresh product copy.

---

## 9. Hosting, deployment and cost

Facts checked for this draft:

- **Vercel's free (Hobby) plan is for non-commercial personal use only**; commercial use needs a paid plan ([Vercel fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)). A business site would need the paid plan, which is not in the ₹15,000 budget **[VERIFY]** current price.
- **Next.js running on Cloudflare's free Workers tier is tight**: about a 3 MiB worker size cap and about 10 ms CPU per request on the free plan per the OpenNext and third-party sources ([OpenNext Cloudflare](https://opennext.js.org/cloudflare)); commercial-use terms were not confirmed. This is another reason for a static-first frontend instead of server rendering.
- **GSAP is free for commercial use**, including ScrollTrigger and the former paid plugins ([Webflow announcement](https://webflow.com/blog/gsap-becomes-free)); confirm the license text.

Recommended setup **[INFERRED]**:

| Part | Where | Cost (year one) |
|---|---|---|
| Frontend (static pages) | Cloudflare Pages (static hosting, global CDN; confirm commercial terms and build limits) **[VERIFY]** | ₹0 |
| BFF routes (upload signing, quote submit, pincode) | Cloudflare Pages Functions / Workers (free tier request and CPU limits are fine for signing and small API calls) **[VERIFY]** | ₹0 (Workers Paid if limits bite, about $5/month **[VERIFY]**) |
| WordPress backend | Shared WordPress hosting (Hostinger Premium or Unlimited, about ₹6,672 to ₹9,552 on a long prepay) or a small VPS if API speed demands it | about ₹6,700 to ₹9,600 |
| Private files | Cloudflare R2 | about ₹0 to ₹600 |
| Email | Brevo free | ₹0 |
| Domain | existing | about ₹1,200 renewal |
| WhatsApp (Phase 2) | Cloud API utility templates | ₹0 to ₹700 |
| Phase 3 quote-engine host | Small VPS for a few months | about ₹2,500 |

Baseline stays about ₹11,600 if the free tiers hold. Risks: a paid frontend plan or Workers Paid adds about ₹5,000 to ₹21,000; shared hosting may be slow for uncached GraphQL (mitigate with caching and by keeping reads static); Hostinger's data-centre location and API limits are unknown **[VERIFY]**. All prices are vendor figures at the ₹88/USD assumption.

Deployment: GitHub to Cloudflare Pages with preview deployments per branch; WooCommerce webhooks call the build hook when products change; environment variables for secrets; staging WordPress (Local site now, a staging subdomain later).

---

## 10. Phases (build only after confirmation)

### Phase 0: planning, design, spikes (now)

1. Satyam answers section 12.
2. Design the missing pages on the canvas (cart, checkout (address, shipping, payment, errors), order confirmation, account, order tracking timeline, quote states, shop archive, policy template, 404, search, auth, emails, mobile drawer) and a short **motion spec** for GSAP/three.js, for approval.
3. Run the spikes (below) in throwaway code; nothing from them ships.
4. Choose hosting; set up the git repo.
5. Local WordPress: remove Elementor, Header Footer Elementor and Hello Elementor (with Satyam's yes); install the backend plugin set (section 4) on the local site for the spikes.

### Phase 1: launch (sequence)

1. Backend setup: WooCommerce config, plugins, products, ACF fields, statuses, headless redirect.
2. Frontend foundation: Next.js project, tokens, fonts, UI components, header/footer, GraphQL client.
3. Home page, section by section (static first, motion later), reviewed against the design.
4. Shop, product page, cart.
5. Cart and checkout through the Store API, Razorpay, COD rules, shipping rates, confirmation page.
6. Quote flow with private upload and quote-order pipeline.
7. Policy pages, invoices, consent, SEO plumbing, feeds, analytics, WhatsApp button.
8. Motion layer (GSAP) and hero 3D, behind feature flags, measured on a low-end phone.
9. QA, speed and security pass, go live.

### Phase 2

Accounts and order tracking, B2B, 3D viewer on product pages, portfolio, guides, reviews, Instagram/Facebook sync, abandoned-cart and offer automation, WhatsApp Cloud API, DPDP workflows.

### Phase 3

Instant quote engine (Python service called from the frontend/BFF) and international readiness.

### Spikes (all **[SPIKE]**, each answers a yes/no that changes the plan)

1. **Store API cart and checkout with Razorpay**: add to cart, shipping rates by pincode, place an order with Razorpay and with COD, COD hidden for made-to-order carts, paid status set by the webhook, frontend confirmation page. If Razorpay cannot take a Store API checkout, test the order-pay fallback.
2. **Personalization text** reaches the order line item, the admin screen, the email and the invoice (test add-on plugins in order; then the tiny snippet; then the quote-flow route).
3. **Custom order statuses**: each status readable by slug from the Store API or REST, with the right label on the account page and the right per-status email.
4. Presigned multipart upload of a 300 MB file from a phone browser to R2; admin download via the protected route.
5. Creating a quote order through the WooCommerce REST API from a BFF route.
6. Product/content change triggers a rebuild through a webhook; time to rebuild.
7. Feed plugins output frontend URLs.
8. Hero three.js scene on a low-end Android: frame rate, memory, LCP impact.
9. WordPress API speed and CORS on the chosen host.

---

## 11. Risks and unverified items

- Fully headless checkout has the hardest edges: whether Razorpay's plugin accepts a Store API checkout, whether the COD, shipping, GST and invoice plugins behave when orders are placed through the API, and cart sessions across two domains. The static catalogue reduces risk elsewhere, but spike 1 must pass; the order-pay fallback is the safety net.
- Because cart, checkout and account calls hit WordPress live (uncached), WordPress hosting speed matters more than in Draft 3; a slow shared host would make the cart and checkout feel slow. Measure before the long prepay.
- "Zero custom backend code" may not hold for personalization data, GraphQL exposure of custom fields or statuses; each gap is listed and Satyam decides.
- Free-tier limits (Cloudflare Pages/Workers) and commercial terms are unconfirmed.
- Motion and 3D can hurt mobile speed; budgets, lazy loading and fallbacks are mandatory.
- SEO risk if feed or canonical URLs point at the `cms` domain.
- From earlier research, still unverified: Amazon.in off-platform and price-parity policy text, GST classification for printed goods and design services, WhatsApp India rates, SEO benchmarks, B2B specifics, GDPR, abandoned-cart tooling, Meta Shops availability in India.
- Legal items for a lawyer or CA: GST HSN/SAC and advances, returns and cancellation wording for custom goods, IP and design assignment, toy classification (BIS), DPDP consent and retention, applicability of the 2026 e-commerce amendment.

---

## 12. Questions for Satyam

1. Is a hands-off backend with a short, explicit list of exceptions (section 3.2) acceptable, or must it be strictly zero custom PHP even if a feature is dropped (for example product personalization)?
2. Cart and checkout run fully through WooCommerce's Store API (your decision). If the Razorpay spike shows it cannot work that way, are you OK with the fallback of sending only the payment step to a WooCommerce order-pay page?
3. **Decided (2026-11-12): one tiny snippet is allowed** if no add-on plugin carries personalization text into the order (scope in section 2A). No further question on this.
4. Static-first frontend (recommended), or do you want server rendering and accept a paid frontend host?
5. Motion: approve scroll- and pointer-driven effects only (no autoplay) and a static fallback on low-end devices? Which sections get the 3D hero?
6. Hosting: Cloudflare Pages for the frontend and Hostinger for WordPress, after the spikes pass?
7. Remove Elementor, Header Footer Elementor and Hello Elementor from the local site?
8. Real product categories, product list (names, prices, in stock vs made to order, lead times), free-shipping threshold, GSTIN, WhatsApp number, support email, upload size limit, quote reply time, advance percentage, return and warranty terms, real photos and stats, logo file, accent colour.
9. Approve designing the missing pages and the motion spec on the canvas first?
