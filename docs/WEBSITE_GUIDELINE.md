# Akrinity Website Guideline

Version 1.0, 2026-11-12. How the Akrinity website is built, run and kept consistent. Collects every decision made so far. Brand and visual rules are in `BRAND_GUIDELINE.md`; project history and file map are in `PROJECT_CONTEXT.md`.
Tags: **[DECIDE]** open, **[VERIFY]** test or confirm first, **[SPIKE]** short throwaway experiment that must pass, **[LAWYER/CA]** needs professional sign-off, **[INFERRED]** my design choice, not a sourced fact.

**Working rule:** no development starts without Satyam's confirmation. Planning and design phases come first; each build step is shown for review against the design.

---

## 1. Goals and scope

1. Sell **ready-made products** (20 to 100 at launch), in stock and made to order (set per product). Variations: colour/material, size/scale, personalization text, quantity discounts for bulk buyers.
2. Take **custom print orders** with private file upload.
3. Offer **design-and-print** from an idea, sketch or photo.
4. Serve shoppers, businesses, hobbyists, students. India now, international later (keep multi-currency and global shipping possible, do not build now). English only.

Budget: **under ₹15,000 for tools and hosting in year one** (research estimate for the baseline about ₹11,600). Favour free or cheap plugins and Satyam's own code. No fixed launch date; work in phases.

Priorities in order: fast on mobile, customer design files private, easy admin, low maintenance cost.

---

## 2. Architecture (decided: fully headless)

- **Backend: WordPress + WooCommerce, headless.** All commerce lives in WooCommerce and its plugins: products, variations, prices, bulk discounts, GST, shipping rates, COD rules, coupons, stock, cart, checkout, payment, orders, order statuses, emails, invoices, customers. **No custom backend code** by default (no custom theme, no custom plugins). A short, explicit list of exceptions is in section 4.3.
- **Frontend: React (Next.js, TypeScript), three.js only where needed, GSAP + ScrollTrigger, CSS variables from the brand tokens.** All custom code lives in one repo (`akrinity-web`).
- The frontend only renders what WooCommerce returns. It never calculates prices, tax, shipping or availability.
- **Static-first rendering** **[INFERRED]**: catalogue, content and policy pages generated at build time from WordPress; a WooCommerce/WordPress webhook triggers a rebuild when products or content change. Live data (stock, cart, account, order tracking, quote status) is fetched in the browser.
- **Cart and checkout run through WooCommerce's Store API** (cart token header, checkout endpoint). Fallback if Razorpay cannot take a Store API checkout **[SPIKE]**: keep cart and address steps headless and send only the payment step to a WooCommerce order-pay page, then return to the frontend.
- **Frontend server routes (BFF)** live in the frontend repo and hold secrets: R2 upload signing, quote-order creation (WooCommerce REST with server-side keys), pincode lookup, Turnstile check, revalidation hook.
- WordPress runs on a subdomain (for example `cms.`); the public domain serves the frontend. Public WordPress pages redirect to the frontend except admin, API and the fallback pay page. Feed plugins must emit frontend product URLs **[VERIFY]**.

Diagram:

```
Visitor -> Frontend (Next.js, static pages + small server routes)
   -> WooCommerce Store API / WPGraphQL  (catalogue, cart, checkout, account)
   -> Cloudflare R2 (private customer files, signed uploads)
   -> Razorpay (payment step, confirmed by webhook)
```

---

## 3. Frontend

### 3.1 Stack and structure

| Layer | Choice |
|---|---|
| Framework | Next.js App Router, React, TypeScript strict |
| Rendering | Static generation + client-side live data; no paid server rendering host |
| Data | GraphQL client for WPGraphQL (catalogue, ACF content); Store API for cart, checkout, live price and stock |
| State | Small store (Zustand) for cart UI; React Query or SWR for server state |
| Styling | CSS variables from tokens + Tailwind v4 (tokens mapped in theme) **[DECIDE]** |
| Animation | GSAP + ScrollTrigger (free, commercial use allowed since Webflow's change; confirm licence text) |
| 3D | three.js via @react-three/fiber, only for the product viewer and upload preview; **the hero printer is a flat SVG illustration**, not three.js |
| Forms | React Hook Form + Zod |
| Fonts | Anton + Inter self-hosted, latin subset |
| Images | Pre-generated WebP/AVIF sizes at build, `srcset`, lazy loading |
| Tests | Playwright flows, Lighthouse CI |

```
akrinity-web/
  app/ (site)/ page, shop, shop/[category], product/[slug], cart, checkout, quote,
        design-service, business, portfolio, guides, [policy], not-found
        account/ (login, orders, orders/[id], quotes, files, details)
        api/ uploads/sign, quotes/submit, pincode, revalidate, contact
  components/ ui, layout, home (Section01..), product, quote, account, motion, three
  lib/ graphql client, woo cart, auth, r2 signer, seo, analytics, env
  styles/ tokens.css, base.css
  public/ fonts, images
  tests/
```

### 3.2 Site map

Public: Home, Shop (categories), Product, Cart, Checkout, Custom print + quote form, Design service, Business and bulk, Portfolio (index and project), Guides (index and article), Materials guide, About, Contact, Policy pages (Privacy and file terms, Terms, Shipping, Returns and warranty, Refund and cancellation, IP and file handling, Grievance), 404, search.
Account: login and register, dashboard, orders and tracking timeline, quotes, files, addresses and GSTIN, B2B apply (Phase 2).

### 3.3 Home page sections (13), from the design

01 Announcement bar, 02 Header, 03 Hero (headline, buttons, printer illustration), 04 Stats strip (real facts only), 05 Statement band ("Made layer by layer"), 06 Shop by category (4 tiles), 07 Custom print banner (violet card with upload mock), 08 Best sellers, 09 Process (five steps on ink), 10 Materials (PLA / PETG-ABS-ASA / Resin), 11 Selected work (portfolio), 12 Final CTA band, 13 Footer. Specs per section are on the canvas System board.

### 3.4 Product page requirements

Gallery with Photos and 3D tabs (3D viewer Phase 2); In stock / Made to order tag; title, price "incl. GST"; description; material pills; colour swatches; size pills; personalization text (up to 40 characters, letters, numbers and spaces); quantity stepper; Add to cart; Order on WhatsApp; fulfilment box (lead time, COD note); pincode delivery check; bulk price tiers (1 to 9, 10 to 49, 50 and up) with "Request a bulk quote"; details, shipping, returns and warranty; related products.

### 3.5 Shop page requirements (approved sample)

Sidebar filters (category with counts, availability, material checkboxes, sort, clear all), sticky on desktop, collapsed behind a Filters button on phones; toolbar with result count and removable filter chips; interactive cards (hover lift and hard shadow, tilt, recolour dots, quick view, quick add, save), cart count in the header, empty state with Clear filters.

### 3.6 Cart, checkout, account (designs still needed)

Cart and mini-cart drawer (options and personalization text shown, free-shipping progress, pincode shipping estimate, COD notice). Checkout (contact, address with optional GSTIN toggle, shipping method, payment methods with COD hidden for made-to-order carts, order summary, consent boxes, error states). Order confirmation. Account dashboard, order tracking timeline, quote detail with accept, decline, request changes and pay. These pages must be designed on the canvas and approved before building.

---

## 4. Backend (WordPress and WooCommerce)

### 4.1 Plugin stack (free first)

| Need | Choice |
|---|---|
| Commerce | WooCommerce, HPOS on |
| API | WPGraphQL + WooGraphQL (catalogue, content); WooCommerce Store API (cart, checkout, live data); CoCart only as plan B |
| Content fields | ACF + WPGraphQL for ACF: made-to-order flag, lead time, bulk tiers, site settings (announcement text, stats, WhatsApp number, free-shipping threshold, quote reply time) |
| CPTs | Custom Post Type UI (portfolio, guides) |
| Auth | JWT auth for WPGraphQL **[VERIFY]** |
| Payments | Razorpay for WooCommerce (about 2.36% effective, T+1); Magic Checkout off; auto-update on |
| COD rules | "Disable payment method / COD fees / Partial payment" (free tier) |
| Shipping | Shiprocket plugin + Lite plan; Business plan only if volume justifies it |
| Bulk pricing | A free discount-rules plugin; tier table for display from ACF |
| Order statuses | A custom-order-status plugin that registers real WooCommerce statuses with per-status emails |
| Invoices | PDF Invoices & Packing Slips + GST add-on **[LAWYER/CA]** on HSN/SAC and advances |
| SEO data | Rank Math or Yoast with its GraphQL integration **[VERIFY]** |
| Feeds | Google Listings & Ads (`identifier_exists = no` for custom-made items); Meta for WooCommerce (catalogue only) |
| Email | Brevo SMTP (300/day) |
| Spam | Cloudflare Turnstile (frontend + server route) |
| Security | Login hardening plugin, admin 2FA, Cloudflare in front |

### 4.2 Commerce rules

- **COD off for made-to-order and personalized items** (return-to-origin on COD is roughly 22 to 38% against 1.5 to 5% prepaid, vendor data). On stocked items COD only with pincode and order-value limits, a visible COD fee and an advance (20 to 30%, **[DECIDE]**).
- **Advance + balance for custom jobs:** start manual (balance via a Razorpay Payment Link sent from the dashboard), deposit plugin later if volume justifies it.
- **Free shipping above a threshold** (**[DECIDE]**). Keep site prices at or below Amazon prices.
- **GST:** regular registration is required (inter-state sales and Amazon); composition scheme not available; e-invoicing only above ₹5 crore. HSN/SAC mapping and GST on advances need a CA.
- **Order status pipeline** (WooCommerce statuses, slug 17 characters or fewer after `wc-`): Quote requested, Quoted, Approved, Advance paid, Printing (with Queued, Post-processing), QC, Ready to ship, Shipped, Delivered; exits: cancelled, refunded, on-hold, reprint. The frontend reads the slug and maps it to labels, steps and icons; unknown slugs show a neutral "In progress" label.
- **Quotes are WooCommerce orders** in a "Quote requested" status. Admin prices the order (items or fees), moves it to "Quoted", the customer approves and pays from the same order. One pipeline for quotes and orders.

### 4.3 The "no custom backend code" rule and its approved exception

- Goal: zero custom PHP. Any gap is listed and decided case by case.
- **Approved exception (Satyam, 2026-11-12):** if no add-on plugin carries **personalization text** into the order, one tiny must-use snippet (about 30 to 60 lines) is allowed. Scope fixed: (a) register the field with the Store API so add-to-cart accepts it and cart responses return it, (b) sanitise it (strip tags, trim, length limit such as 40, allowed characters), (c) copy it to the order line item so it shows in admin, emails and invoice, (d) nothing else. Kept in the repo under version control and documented. Any further snippet needs a new approval. Backup: sell personalized items through the quote flow.
- Other likely seams **[SPIKE]**: custom statuses visible through the API; cart token across domains (CORS, token header exposed, WooCommerce 9.8+); revalidation webhooks for content; feed plugins emitting frontend URLs.
- No personalized product goes live until a test order shows the text on the order, the email and the invoice.

---

## 5. Customer files and quotes

- Files **never** go through WordPress or the public uploads folder. The browser uploads directly to a **private Cloudflare R2 bucket** with short-lived presigned multipart URLs signed by a frontend server route **[SPIKE]** (300 MB file from a phone browser; Cloudflare's proxy caps request bodies at 100 MB on the free plan, so the upload goes to the R2 host directly).
- Allowed types: STL, 3MF, OBJ, STEP/STP, IGES/IGS for printing; JPG, PNG, PDF for design help. Allowlist by extension and by magic bytes/structure (validate binary STL size rule, 3MF is a zip with limits on entry count and expanded size). No ClamAV; quarantine until validated.
- Random object keys, original file name stored only as order meta. Access limited to the admin and the owning customer through signed, short-lived links; access logged. Admin file access through a small protected frontend route behind Cloudflare Access **[VERIFY]**, fallback R2 dashboard.
- Retention (proposal **[LAWYER/CA]**): delete unconverted quote files after 30 days past quote expiry; originals 90 to 180 days after completion unless the customer opts to keep.
- Terms and IP page: customer warrants rights to the file, right to refuse (weapons, lock bypass, medical devices, food-contact claims, licensed characters), takedown contact, design ownership assignment must say perpetual and worldwide or choose licence-only (Copyright Act s.19) **[LAWYER/CA]**.
- Quote form fields: job type (Print my file / Design and print), files, material, colour, quantity, needed-by date, notes, name, WhatsApp or phone, email, optional business toggle revealing company name and GSTIN, consent checkbox (not pre-ticked), Turnstile for guests. Quote reply time to be set by Satyam.
- Upload size limit per file: draft assumption 300 MB, 5 files per request **[DECIDE]**.
- **Pricing for manual quotes** (cost-plus, inputs are vendor figures to be replaced with Satyam's own): material = grams x (1 + waste) x price per gram; machine = print hours x rate x (1 + failure); labour; setup/minimum fee; margin; complexity, rush and quantity multipliers; GST 18% added at invoice. Worked example from research: 100 g PLA, 9 h print is about ₹651 before GST, ₹768 with GST. Phase 3 instant quote uses trimesh plus a headless slicer (PrusaSlicer or OrcaSlicer) in a separate Python service, manual fallback always available.

---

## 6. Motion, 3D and the printer illustration

- Full spec in `MOTION_SPEC_DRAFT.md`. Summary:
  - **Hero:** the flat SVG printer prints layer by layer as the visitor scrolls (down prints more, up removes layers); the head idles with a slight movement while visible. Chosen by Satyam after the earlier "scroll-built vase" option; it replaced the three.js vase because it loads faster on phones.
  - **"Printing now" section:** loops a full print while on screen, pauses off screen. **[DECIDE]** This breaks the amended "no autoplay loops" rule; Satyam to confirm or restrict it to scroll.
  - Device levels: **Full** (animation), **Light** (reveals only, still printer), **Static** (no motion: reduced-motion, Save-Data, slow connection, no JS).
  - GSAP reveals and parallax only on decorative layers; transform and opacity only; no smooth-scroll library.
- Budgets **[VERIFY]**: LCP under 2.5 s on a throttled mid-range phone; about 200 KB JS before any 3D; no layout shift from motion; 60 fps desktop, 30 fps floor on mid-range phones.
- three.js loads only on demand (product 3D tab, upload preview), never on first paint.

---

## 7. Performance, SEO and analytics

- Performance: self-hosted fonts with preload of Anton, responsive WebP/AVIF, lazy load below the fold, static pages on a CDN, minimal JS, no render-blocking scripts, caching, Cloudflare in front. Uploads bypass Cloudflare (direct to R2).
- SEO moves to the frontend: titles, meta, canonical, Open Graph, Product/Offer/Organization/Breadcrumb JSON-LD, sitemap, robots, redirects. Write **fresh product copy** (not copied from Amazon). Merchant and Meta feeds must point to frontend URLs. Build content for guides, materials and "3D printing service Mumbai" **[VERIFY]** keyword research not done.
- Analytics: GA4, Meta Pixel and Conversions API with a consent banner, in the frontend; purchase events on the frontend confirmation page after WooCommerce confirms payment.
- WhatsApp: click-to-chat button in Phase 1; Cloud API order-status templates in Phase 2 (billing in INR required by 31 Dec 2026 for India; rates conflict across sources **[VERIFY]**).

---

## 8. Hosting and deployment

- Recommended **[INFERRED]**: WordPress on Hostinger India shared hosting (Premium or Unlimited on a long prepay) **after** a 300 MB upload and API speed test inside the 30-day refund window; frontend static on Cloudflare Pages; server routes on Cloudflare Pages Functions/Workers; Cloudflare R2 for files; Brevo for email; domain already owned.
- Not allowed on free tiers: Vercel Hobby is non-commercial only. Next.js server rendering on Cloudflare's free Workers is tight (size and CPU limits), which is a reason for static-first. Commercial terms of Cloudflare Pages **[VERIFY]**.
- Because cart, checkout and account call WordPress live, WordPress hosting speed matters; measure before the long prepay. Fallback: small India-region VPS with CloudPanel (Lightsail Mumbai or Hostinger KVM). A VPS is also needed for the Phase 3 quote service.
- Deploy: GitHub to Cloudflare Pages with preview per branch; WooCommerce webhooks call the build hook; secrets only in host environment variables or `wp-config.php` constants; staging WordPress (the Local site now).
- Year-one baseline: domain renewal about ₹1,200, Hostinger Premium ₹6,672, R2 about ₹600, Phase 3 VPS about ₹2,464, WhatsApp ₹0 to ₹700, total about ₹11,600. Optional Shiprocket Business ₹2,388, Hostinger Unlimited +₹2,880. Outside budget: trademark fee, CA and lawyer fees, Razorpay per-transaction fees. Assumes ₹88 per USD; if hosting prices exclude 18% GST the total can pass the budget.

---

## 9. Legal and compliance gates

- **Before the first sale:** GSTIN in place and shown; policy pages live; grievance officer listed (acknowledge within 48 hours, resolve within one month); entity name, address, price breakup, return/refund/warranty terms and country of origin shown.
- **1 January 2027:** amended E-Commerce Rules apply: binding dark-pattern rules with annual self-audit and certificate (applicability to a small own-site seller **[LAWYER/CA]**), lowest price in the last 30 days when showing a discount, prominent entity and grievance details.
- **About 13 May 2027:** main DPDP Act duties (notice, consent, security safeguards, 72-hour breach report). Build consent logging, deletion workflow and a breach procedure.
- Returns: no statutory exemption for made-to-order goods was found; "no returns" safely covers change of mind only; defects, transit damage, wrong material or dimensions versus the approved quote, and non-delivery stay remediable. Cancellation charges and deposits must be fair and shown before payment **[LAWYER/CA]**.
- BIS Toys Order: toy-like figurines (under 14) may need BIS marking; check every product before listing **[LAWYER/CA]**.
- Amazon: never use Amazon order messages or inserts to send Amazon buyers to the site; keep site prices at or below Amazon's; start stock sync as a manual routine (WooCommerce as master), add a script later; Amazon.in policy text on off-platform redirect and price parity was not retrievable **[VERIFY]** in Seller Central. Do not copy Amazon reviews.
- International later: IEC, export documentation, GDPR review (not researched).

---

## 10. Phases

- **Phase 0 (now, planning and design):** guidelines, missing page designs (cart, checkout, order confirmation, account, tracking timeline, quote states, policy template, 404, search, auth, emails, mobile nav, B2B), motion spec approval, the spikes, hosting choice, repo setup, clean-up of the local test install.
- **Phase 1 (launch):** backend setup; frontend foundation (tokens, fonts, components, header, footer); home page section by section; shop, product, cart; checkout through the Store API with Razorpay, COD rules, shipping; quote flow with private upload; policy pages, invoices, consent; SEO plumbing, feeds, analytics, WhatsApp button; motion layer; QA, speed and security; go live.
- **Phase 2:** accounts and order tracking, B2B accounts and bulk quotes, 3D viewer on products, portfolio, guides, reviews, Instagram/Facebook sync, abandoned-cart and offer automation, WhatsApp Cloud API, data-protection workflows.
- **Phase 3:** instant quote engine (Python service), resin model, rush and quantity rules, international readiness.

### Spikes that gate Phase 1

1. Store API cart and checkout with Razorpay and COD (COD hidden for made-to-order carts, paid status set by the webhook, frontend confirmation); order-pay fallback.
2. Personalization text reaches order item, admin, email and invoice.
3. Custom order statuses readable by slug with the right label and per-status email.
4. 300 MB presigned multipart upload from a phone browser to R2; admin download route.
5. Quote order created through the WooCommerce REST API from a server route.
6. Content or product change triggers a rebuild via webhook (time to rebuild).
7. Feed plugins output frontend URLs.
8. Hero illustration and loop on a low-end Android (frame rate, memory, LCP impact).
9. WordPress API speed and CORS on the chosen host.

---

## 11. Quality checklist (every page before sign-off)

- Matches the canvas for layout, spacing, type, radius, states and tokens.
- Works at 375 to 767, 768 to 1023, 1024 to 1365 and 1440+ with no horizontal scroll.
- Touch targets 44 px or more; visible focus; labels and alt text present; contrast checked.
- Mobile performance within budget; motion has reduced-motion and low-end fallbacks.
- No placeholder text left in a live page; no copied Amazon text.
- No secrets, API keys or customer files in the repo or theme.
- Forms: errors explain the fix; files validated by type and size; consent not pre-ticked.

---

## 12. Open items (as of 2026-11-12)

Real product categories and product list (names, prices, in stock vs made to order, lead times, photos); free-shipping threshold; GSTIN; WhatsApp number; support email; upload size limit; quote reply time; advance percentage and COD terms on stocked items; return and warranty terms; real logo (SVG) and accent choice; real stats; hosting confirmation after tests; design of cart, checkout, account, tracking, quote and policy pages; confirmation of the "Printing now" loop; canvas System board still says "no autoplay motion"; removal of Elementor, Header Footer Elementor and Hello Elementor from the local site; stock sync approach with Amazon; B2B requirements; abandoned-cart tool; the toy/BIS check on the product range; hero printer to match the owner's real printer if wanted.
