# Akrinity Website: Build Plan, Draft 2

Status: PLANNING AND DESIGN ONLY. Nothing in this document has been built. No development starts until Satyam confirms.
Date: 2026-11-12. Replaces the approach in `BUILD_SPEC.md` (draft 1) where they differ; draft 1 stays as the technical reference for data model, upload flow, pricing and legal items.
Sources: the new handoff brief, the design canvas (5 boards: Home, Product page, Custom quote, Mobile home, Design system and specs), `reports/Akrinity WooCommerce build research.md`.
Tags: **[VERIFY]** test or confirm before relying on it. **[LAWYER/CA]** needs professional sign-off. **[INFERRED]** my design decision, not a sourced fact.

---

## 1. What changed from draft 1

| Topic | Draft 1 | Draft 2 (this draft) | Why |
|---|---|---|---|
| Visual direction | Paper `#F6F3EE`, orange accent, Space Grotesk | **Design v2**: bold and playful, Anton + Inter, ink `#0B0B0C`, paper `#F3F1EA`, lime accent `#D8FF3A`, violet `#5B2BE0`, orange `#FF6A1F` | The canvas now holds v2, and the new brief says the canvas wins over the older doc |
| Page builder | Not stated in draft 1; later discussed using Elementor | **No page builder on the front end** (custom theme + custom plugins) | New brief states this as a made decision |
| Theme | `akrinity-theme`, classic vs block undecided | Hybrid: PHP templates + `theme.json` + CSS variables + component classes | Brief maps the design-system board to `theme.json` / CSS variables / classes |
| Fonts | Space Grotesk + Inter | Anton (display, caps, 400) + Inter, **self-hosted** | Brief and System board |
| Process steps | quote, approved, printing, QC, shipped | Brief's pipeline: Quote requested, Quoted, Approved, Advance paid, Printing, QC, Shipped, Delivered | Brief |
| Missing page designs | Flagged as open | Listed in section 8 with a proposal to design them on the canvas first | Brief: design in the same system and show before building |

Unchanged from draft 1: WooCommerce + Razorpay + Shiprocket, COD off for made-to-order and personalized items, direct-to-R2 private uploads, GST invoice layer, custom quote tables, hybrid quote (manual first, engine in Phase 3), legal gates and dates.

---

## 2. Decisions that need Satyam's answer before anything is built

### 2.1 Elementor vs custom theme (conflict)

Earlier in this conversation Satyam asked for pages built entirely in Elementor. The new brief says the opposite: custom theme, avoid page builders.

What I already did, before being told to stop: on the **local** `akrinity-3d` site I installed and activated **Elementor 4.4.0**, **Header Footer Elementor (Ultimate Addons) 2.9.7**, and switched the active theme to **Hello Elementor 3.5.2**. No pages were created. Production is untouched.

| | A. Custom theme, no builder (new brief, recommended) | B. Elementor pages on a thin child theme |
|---|---|---|
| Matches the brief | Yes | No (brief says avoid builders) |
| Mobile speed priority | Best: minimal CSS/JS, one font-loading strategy | Adds Elementor CSS/JS and DOM weight; mitigations needed |
| Matches the canvas exactly (hard shadows, rotated highlight chips, stripes, per-breakpoint specs) | Straightforward in CSS | Possible but needs custom CSS on most widgets |
| WooCommerce templates (product, cart, checkout, account) | Native template overrides, free | Visual editing of these needs Elementor Pro (about $59/yr, **[VERIFY]**, would push year one past ₹15,000) |
| Satyam editing copy later | Edit in WordPress editor or Site Settings fields; layout changes need code | Visual drag and drop |
| Maintenance | Own code only | Elementor + add-ons updates and compatibility |

Recommendation: **A**. Satyam is an experienced WordPress developer, the design is highly specific, and speed and cost are top priorities. To keep copy editable without a builder, section text (stats, announcement bar, process steps, materials, CTA) lives in a **Site Settings** screen and the Gutenberg editor, so Satyam does not edit PHP to change words.

If A is chosen, I would offer to **remove** the Elementor plugin, the Header Footer plugin and the Hello theme from the local site (they would be unused). I will not do that without confirmation.

### 2.1b Hybrid: custom theme AND Elementor (Satyam's choice, replaces the A vs B recommendation above)

Satyam asked for both. Architecture **[INFERRED]**:

- **Custom theme `akrinity` stays the base** (tokens, fonts, header, footer, announcement bar, components, WooCommerce templates). Elementor (free) is installed **on top** of it and is used only for content pages. Hello Elementor and Header Footer Elementor are not needed and would be removed (header and footer come from the theme, so they stay consistent and fast).
- **Elementor lays out and edits copy; code supplies anything dynamic or exact.** The theme registers shortcodes (for example `[akr_categories]`, `[akr_best_sellers]`, `[akr_portfolio]`, `[akr_process]`, `[akr_materials]`, `[akr_stats]`) that output the exact designed markup (hard shadows, stripes, tiles). In Elementor they sit inside the Shortcode widget, and the section around them (headings, text, buttons, backgrounds, spacing) is normal Elementor.
- **Elementor globals are synced to the design tokens**: Elementor Site Settings colours and fonts set to the System board values, default Elementor colours and fonts disabled, and component classes (`akr-btn`, `akr-pill`, `akr-card`, `akr-tag`) added through each widget's CSS Classes field so Elementor content uses the same CSS as the theme.
- **Free Elementor only.** Elementor Pro is not needed, so the budget is unchanged. Free Elementor cannot edit WooCommerce product, cart or checkout templates, which is why those stay in code anyway.
- **Page split:**

| Built in Elementor (editable visually) | Built in theme code (exact, fast, not editable in Elementor) |
|---|---|
| Home page layout (all 13 sections' text, buttons, backgrounds, spacing) | Header, footer, announcement bar, mobile nav drawer |
| Design-service page, Business / bulk page | Single product, shop archive, cart, checkout, order confirmation |
| About, Contact, guides landing page | Custom quote page and form (`akrinity-quotes`, shown as a shortcode on an Elementor or plain page) |
| Policy pages (or plain editor, simpler) | Account, order tracking, quote detail |
| Campaign and landing pages later | Emails, 404, search, blog single template |

- **Rules to protect speed (mobile is priority 1)** **[VERIFY]** with PageSpeed on a real page before committing the Home to Elementor: use Elementor containers (not legacy sections), disable unused widgets and Google fonts, load Elementor assets only on Elementor pages, no Elementor animations (also matches the design's "no autoplay motion"), images as optimised WebP, cache enabled. If the Elementor Home page misses the speed target, fall back to the code-built `front-page.php` (already specified in section 7); nothing else changes.
- **Deviation to acknowledge:** the handoff brief says to avoid page builders on the front end. This hybrid contains Elementor to content pages and keeps all commerce, quote and account pages in code, but it is a deliberate departure from the brief, decided by Satyam.
- **Local site clean-up if this hybrid is approved:** keep Elementor 4.4.0, deactivate Header Footer Elementor, switch the active theme from Hello Elementor to the custom `akrinity` theme once it exists (Hello can be removed then).

Phase impact: Phase 1 step 2 (Home) becomes "Elementor Home page using theme shortcodes and classes", with the code-built `front-page.php` as the fallback. Everything else in section 9 is unchanged.

### 2.2 Other decisions

1. Hosting: confirm the recommendation in section 3, and agree to run the upload test inside the 30-day refund window before the long prepay.
2. Accent colour: lime `#D8FF3A` by default, or one of the System board options (`#FFD23F`, `#7CF5C8`, `#FF9ACB`), or match the logo. It is one CSS variable.
3. Design the missing pages first (section 8)? Recommended yes.
4. Placeholder values (section 11).

---

## 3. Hosting recommendation (within ₹15,000 total year one)

Recommended: **Hostinger India shared WordPress hosting + Cloudflare DNS/CDN (free) + Cloudflare R2 for private customer files.** **[INFERRED]** from research; prices are vendor figures as of Nov 2026.

| Item | Choice | Cost (year one) |
|---|---|---|
| Host | Hostinger Premium (48-month prepay ₹139/mo = ₹6,672 total; renews at ₹449/mo) or Unlimited (₹199/mo = ₹9,552; renews ₹649/mo; daily backups, 50 GB NVMe) | ₹6,672 to ₹9,552 (prepaid for 4 years) |
| Domain | Already owned | ₹0 (renewal about ₹1,200 placeholder) |
| Private file storage | Cloudflare R2: 10 GB free, then $0.015/GB-month, free egress | about ₹0 to ₹600 |
| Email | Brevo free SMTP (300/day) | ₹0 |
| CDN/DNS/Turnstile | Cloudflare free | ₹0 |
| WhatsApp | Joinchat free button in Phase 1; Cloud API templates in Phase 2 (about ₹0.12 to ₹0.15 per utility message plus provider fees, sources conflict) | ₹0 to ₹700 |

Why not a VPS first: it removes upload limits, but Hostinger KVM 1 needs ₹14,376 upfront, and a solo developer would also be the sysadmin. A VPS (Lightsail Mumbai $7/mo about ₹7,400/yr) becomes worthwhile in Phase 3 for the quote engine.

Must test before committing to the 48-month term **[VERIFY]**:

- A 300 MB multipart upload straight from the browser to R2 (avoids PHP and the Cloudflare 100 MB proxy cap).
- WP-Cron or Action Scheduler runs reliably (file validation, notifications).
- PHP 8.2+, WooCommerce with HPOS, and the Razorpay webhook all work within the plan's process limits.
- Hostinger's real PHP limits (their docs say shared limits cannot be edited via php.ini).

Fallback if any test fails: Lightsail Mumbai or Hostinger KVM with CloudPanel.

Check whether 18% GST is included in the quoted host prices. If it is not, add up to about ₹1,640 and the baseline gets tight.

---

## 4. Plugin list (free first)

Third-party plugins only where building would waste time:

| Need | Plugin | Cost | Notes |
|---|---|---|---|
| Commerce | WooCommerce | free | HPOS on; custom plugins must declare compatibility |
| Payments | Razorpay for WooCommerce | free (about 2.36% effective per transaction) | Leave Magic Checkout off; auto-update; had 2026 security fixes |
| COD rules | "Disable payment method / COD fees / Partial payment" (free tier) | free | Block COD for made-to-order categories; pincode and order-value limits |
| Shipping | Shiprocket WooCommerce plugin + Lite plan | free to start | Pincode check on product page, tracking; consider Business plan (₹199/mo) at roughly 33 to 50 shipments a month |
| Invoices | PDF Invoices & Packing Slips (WP Overnight) | free | No native GST fields; custom `akrinity-gst` plugin adds them |
| WhatsApp (Phase 1) | Joinchat | free | Click-to-chat button; Cloud API later |
| SEO | Rank Math free or Yoast free (pick one) | free | One structured-data source only |
| Google feed | Google Listings & Ads | free | `identifier_exists = no` for custom-made items |
| Meta feed | Meta for WooCommerce | free | Catalog sync only; India Shops availability **[VERIFY]** |
| Spam | Cloudflare Turnstile | free | Guest quote form, login, register |
| Cache | LiteSpeed Cache (if host provides LiteSpeed) | free | **[VERIFY]** on Hostinger |
| SMTP | Brevo plugin or WP Mail SMTP free | free | 300/day cap |

Not using plugins for: file uploads, quote requests, status pipeline, GST layer, 3D viewer, image optimisation (WebP generated on upload by theme code), analytics (a small consent-aware GA4 snippet in the theme instead of a heavy plugin).

Phase 2 candidates **[VERIFY]**: abandoned-cart and email/WhatsApp automation (a free tier of an automation plugin or Brevo; not researched), reviews (WooCommerce native reviews first), stock sync (manual routine first, small SP-API script later).

---

## 5. Theme structure

One custom theme, `akrinity`, hybrid: PHP templates for control, `theme.json` for design tokens so the block editor shows the same palette and type scale. No front-end page builder. No build step required in Phase 1 (plain CSS with variables; add a tiny minifier later if wanted).

```
wp-content/themes/akrinity/
  style.css                     theme header only
  theme.json                    palette, font families, font sizes, spacing scale, radii (custom)
  functions.php                 loads inc/*
  inc/
    setup.php                   theme supports, menus, image sizes (WebP), nav drawer data
    enqueue.php                 preload Anton, load per-template CSS, defer JS
    images.php                  WebP output on upload, responsive sizes, lazy-load rules
    woocommerce.php             hooks, product options markup, fulfilment tag, pincode check, bulk table
    settings-bridge.php         reads Site Settings from akrinity-core (stats, announcement, thresholds)
    seo.php                     structured data helpers (if not using SEO plugin for it)
    analytics.php               consent-aware GA4
  assets/
    fonts/                      anton-latin.woff2, inter-variable-latin.woff2 (self-hosted, subset)
    css/
      tokens.css                CSS variables (from the System board)
      base.css                  reset, body, typography classes
      layout.css                container 1280, paddings 40/28/20, breakpoints
      components/               button, pill, tag, input, card, chip, stripe-placeholder, focus
      sections/                 s01-announcement ... s13-footer
      woocommerce.css           product, cart, checkout, account
      quote.css
    js/
      nav.js                    mobile drawer, focus trap
      product.js                pills, swatches, qty stepper, pincode check
      (viewer.js)               Phase 2, lazy-loaded only where needed
  template-parts/
    header.php, footer.php, announcement-bar.php
    home/section-01 ... section-13.php
    components/card-product.php, card-category.php, option-pill.php, status-tag.php
  front-page.php
  page.php, single.php, archive.php, search.php, 404.php, index.php
  page-templates/
    custom-quote.php
    policy.php
  woocommerce/
    archive-product.php
    single-product.php (+ content-single-product.php)
    cart/cart.php
    checkout/form-checkout.php
    myaccount/ (dashboard, orders, quotes, files, details)
    emails/ (styled minimal)
```

CSS strategy for speed: tokens, base and layout load on every page (small, inlined if under about 14 KB); each template adds only its own file; no framework; all grids use `auto-fit` with a minimum column width (as the System board specifies) so very little responsive CSS is needed.

---

## 6. Custom plugins

| Plugin | Purpose | Phase |
|---|---|---|
| `akrinity-core` | Site Settings screen (announcement text, stats, WhatsApp number, free-shipping threshold, quote reply time, upload limit, advance %), custom order statuses, status notifications (email now, WhatsApp later), portfolio post type, shared helpers, audit log | 1 |
| `akrinity-files` | Private customer uploads: REST routes, R2 multipart upload with signed URLs, validation (extension, magic bytes, size), quarantine until validated, signed downloads for admin and owner, access log, retention jobs | 1 |
| `akrinity-quotes` | Custom quote form (matches Quote board), quote tables, admin quote editor and price breakdown, customer quote view and approve, convert approved quote to WooCommerce order | 1 |
| `akrinity-gst` | GST invoice layer on top of PDF Invoices plugin: GSTIN capture and validation, HSN/SAC mapping, CGST/SGST/IGST split, invoice numbering, credit notes | 1 |
| `akrinity-b2b` | B2B account approval, GSTIN, bulk quote requests, optional price lists | 2 |
| `akrinity-viewer` | Lazy-loaded three.js viewer (STL, 3MF, OBJ; STEP via occt-import-js) for product pages, upload preview and admin review | 2 |
| `quote-engine` service (not a WP plugin) | Python microservice: mesh checks and print estimate, called over signed REST | 3 |

Each plugin: HPOS-compatible, no secrets in code (R2, Razorpay and Shiprocket credentials in `wp-config.php` constants), documented in `docs/`. Data model, upload flow, status slugs (17 characters or fewer after `wc-`) and pricing formula stay as in `BUILD_SPEC.md` sections 5 to 8 and 10.

Order status pipeline mapped to the brief:

| Brief stage | Where it lives |
|---|---|
| Quote requested, Quoted | Quote record status (`requested`, `quoted`) |
| Approved | Quote status `approved`; WooCommerce order created |
| Advance paid | Order status `processing` after the advance payment (custom `wc-await-adv` before payment) |
| Printing | `wc-printing` (with `wc-queued` before it) |
| QC | `wc-qc` |
| Shipped | `wc-shipped` |
| Delivered | core `completed` |

Customers see this timeline in their account and receive email (WhatsApp in Phase 2) at milestones only.

---

## 7. Design-to-code mapping

| Canvas board | Becomes | Notes |
|---|---|---|
| Home (13 sections) | `front-page.php` + `template-parts/home/section-01..13.php` | Categories from product categories (tile colour and image as term fields), best sellers from featured products, stats/announcement/process/materials copy from Site Settings, portfolio from the portfolio post type |
| Product page | `woocommerce/single-product.php` | Material and size pills (variations), colour swatches, personalization text, quantity stepper, **In stock / Made to order** tag from product setting, delivery text, pincode check (Shiprocket), bulk price table (tier meta), WhatsApp button, details / shipping / returns blocks, related products |
| Custom quote | `page-templates/custom-quote.php` + `akrinity-quotes` form | Two job types (Print my file / Design and print) switch file label and accepted types; GST toggle reveals company name and GSTIN; private upload drop zone; "what happens next" side panel; WhatsApp and bulk cards |
| Mobile home | responsive rules for all pages | Breakpoints: 1440+, 1024 to 1365, 768 to 1023, 375 to 767. Single column on mobile, 2-column tiles and products, nav drawer |
| Design system and specs | `theme.json` + `tokens.css` + `components/*.css` | See tokens below |

### Tokens (from the System board)

- Colours: ink `#0B0B0C`, paper `#F3F1EA`, white `#FFFFFF`, accent `#D8FF3A` (one variable), violet `#5B2BE0`, orange `#FF6A1F`, muted `#55514A`, muted on dark `#B8B4A8`, dark card `#17171A`, dark border `#34343A`, stripe `#E3DFD2`, error `#D92D20`.
- Type: Anton (caps, 400) for Display XL 124 / L 112 / H2 72 to 88 / H3 44 to 56 / card title 28; Inter for body L 18, body 16, label 12 caps 700 with 0.12em tracking. Tablet and mobile sizes as on the board (for example hero 96 tablet, 78 mobile).
- Shape: radius 14 inputs, 16 card images, 24 cards, 32 feature banners, 999 buttons; 1.5px ink borders (1.5px `#34343A` on dark); no gradients, no blur shadows; hard offset shadow only on hover and one hero element per page.
- Layout: container 1280, side padding 40 / 28 / 20; section padding 96 / 72 / 56; grid gap 20 (16 mobile); spacing scale 4, 8, 12, 16, 24, 32, 40, 48, 56, 72, 96.
- Interaction: hover lifts 2px with 4px hard shadow (150 ms), focus is a 3px violet outline with 2px offset on every control, touch targets 44 minimum, respect `prefers-reduced-motion`, no autoplay motion.

Notes on the design that I would raise with Satyam (not changing, only flagging):

1. The board uses the accent for text-bearing chips; accent options keep ink text readable, but contrast must be re-checked if the accent changes (the System board says the same).
2. Product page shows only PLA+, PETG, ABS pills, while the Quote page lists PLA/PLA+, PETG, ABS/ASA and Resin. Materials will be set per product, so this is just sample data.
3. The Quote board has no states for upload progress, upload error, file rejected, validation errors, consent checkbox, or bot check. These need designing (section 8).
4. The footer has a newsletter field: needs a mail provider and a consent line (data protection law). **[LAWYER/CA]** for wording.
5. The stats strip must use real facts only; Satyam to supply them.
6. Mobile home board was updated after I first read it; I read the Home, Product, Quote and System boards in full for this draft and will diff the latest Mobile board before building.

---

## 8. Pages still to design (same system, shown before building)

Proposal: I design these on the canvas as new boards, in the same tokens, and Satyam reviews before any code.

| # | Page | Main contents |
|---|---|---|
| 1 | Shop / category archive | Filters (category, material, colour, price, in stock vs made to order), sort, product grid, pagination |
| 2 | Cart (and mini-cart drawer) | Line items with options and personalization text, fulfilment tag, free-shipping progress, pincode shipping estimate, COD notice, coupon |
| 3 | Checkout | Contact, address with GSTIN toggle, shipping method, payment (UPI, cards, netbanking; COD hidden when cart has made-to-order or personalized items), order summary, consent checkboxes |
| 4 | Order confirmation | Order summary, next steps, GST invoice download, WhatsApp link |
| 5 | Account dashboard | Orders, quotes, files, addresses, GSTIN, B2B status |
| 6 | Order tracking | Status timeline (the brief's pipeline), courier tracking, balance due and pay button, invoice |
| 7 | Quote detail (customer) | Price breakdown, validity, accept, decline, request changes, advance payment |
| 8 | Quote form states | Uploading, progress, rejected file, validation errors, success screen |
| 9 | Design-service page | Same system, brief-based (idea, sketch, photo) |
| 10 | Business / bulk page | B2B sign-up, bulk quote request, GST invoice info |
| 11 | Portfolio index and single | Grid, project detail with photos and 3D viewer slot |
| 12 | Blog index and single (guides) | Article layout, table of contents, related guides |
| 13 | Policy page template | Privacy, terms, shipping, returns, warranty, IP and file terms, grievance |
| 14 | 404 and search results | Friendly page, popular links, search |
| 15 | Login / register / B2B apply | Same system, error states |
| 16 | Emails | Order confirmation, quote ready, status change (simple HTML in brand colours) |
| 17 | Mobile nav drawer and mobile versions of all of the above | |

---

## 9. Phases (build only after confirmation)

### Phase 0: planning and design (now)

- Resolve section 2 decisions, fill placeholders (section 11), design pages in section 8.
- Choose hosting, run the upload test.
- Set up a git repo for custom code only. Decide whether to remove the Elementor install on the local site.
- Exit: Satyam approves this plan, the page designs and the hosting choice.

### Phase 1: launch

Build in small steps, each shown for review against the design:

1. Foundations: theme skeleton, `theme.json`, tokens, self-hosted fonts, base and component CSS, header, footer, announcement bar.
2. Home page: sections 01 to 13 one by one (announcement, header, hero, stats, statement, categories, custom-print banner, best sellers, process, materials, selected work, final CTA, footer), desktop and mobile.
3. WooCommerce set-up: products and categories, in-stock vs made-to-order setting, variations, personalization field, bulk price tiers.
4. Product page, shop archive, cart, checkout, order confirmation.
5. `akrinity-files` and `akrinity-quotes`: private uploads and the manual quote flow; customer quote page.
6. Payments and shipping: Razorpay, COD rules, Shiprocket, free-shipping threshold.
7. `akrinity-gst` invoices; policy pages; consent logging.
8. WhatsApp button, SEO basics, Google and Meta feeds, analytics, newsletter.
9. QA on mobile, speed, security, backups; trademark filing; go live.

Phase 1 gates before the first sale: GSTIN in place, policy pages live (the amended e-commerce rules apply from 1 January 2027), no dark patterns (countdown timers, pre-ticked boxes), grievance officer listed.

### Phase 2

Accounts and order tracking, quote status pipeline notifications (email, then WhatsApp Cloud API), B2B accounts and bulk quotes, 3D viewer, portfolio, blog and reviews, Instagram/Facebook sync, abandoned-cart and offer automation, data-protection workflows (before about 13 May 2027).

### Phase 3

Instant quote engine (Python service: volume, material, time and setup-fee rules, manual fallback) and international readiness (currency, shipping, GDPR review).

---

## 10. Budget (year one, estimate)

| Line | Amount |
|---|---|
| Domain renewal placeholder | about ₹1,200 |
| Hostinger Premium (48-month prepay) | ₹6,672 |
| Cloudflare R2 storage | about ₹600 |
| Quote-engine VPS for about 4 months in Phase 3 (Lightsail $7) | about ₹2,464 |
| WhatsApp messages | ₹0 to ₹700 |
| **Baseline** | **about ₹11,600** |

Optional: Shiprocket Business ₹2,388, Hostinger Unlimited instead of Premium +₹2,880. Baseline plus Shiprocket is about ₹14,000. Outside the budget: trademark fee (₹4,500 per class), CA and lawyer fees, Razorpay per-transaction fees. Assumes ₹88/USD and prices as of Nov 2026. If Elementor Pro were chosen, add about ₹5,200 and the total passes ₹15,000 **[VERIFY]**.

---

## 11. Questions and placeholders for Satyam

1. Page builder: confirm custom theme with no builder (recommended), or keep Elementor.
2. Hosting: OK to buy shared hosting only after the upload test passes?
3. Accent colour: keep lime `#D8FF3A` or match the logo?
4. Real product categories (current six are guesses: home decor, desk and gadgets, figurines, gifts, spare parts, hobby and cosplay) and the product list for launch (names, prices, in stock vs made to order, lead times, photos).
5. Free-shipping threshold, WhatsApp number, support email, GSTIN, upload size limit (draft assumes 300 MB per file), quote reply time in hours.
6. Advance percentage for custom jobs, and COD terms on stocked items (advance and pincode limits).
7. Return and warranty terms; whether any products are toy-like figurines (possible BIS toy rules **[LAWYER/CA]**).
8. Real facts for the stats strip, real photos for the hero and portfolio, logo file (SVG) and any logo colours.
9. Amazon stock sync: start with a manual routine (draft default)?
10. Visual references he still wants to share.
11. Approve designing the pages in section 8 on the canvas?

---

## 12. Risks and unverified items

- Budget is tight if hosting prices exclude GST or Shiprocket Business is needed.
- Direct-to-R2 upload escaping the Cloudflare cap is an inference to be tested.
- Not verified in research: Amazon.in off-platform and price-parity policy text, official GST classification for printed goods and design services, India WhatsApp rate card, Hostinger's real PHP limits, SEO benchmarks, B2B specifics, GDPR, abandoned-cart tooling.
- Legal items for a lawyer or CA: GST HSN/SAC and treatment of advances, returns and cancellation wording for custom goods, IP and design-assignment terms, toy classification, DPDP consent and retention, applicability of the 2026 e-commerce amendment to a small seller.
- Amazon rules: never use Amazon order messages or inserts to send Amazon buyers to the site; keep site prices at or below Amazon; write fresh product copy.

---

## 13. What happens next (only after Satyam confirms)

1. Answer sections 2 and 11.
2. I design the missing pages on the canvas for review.
3. After approval of designs and hosting test results, Phase 1 begins, step by step, each page shown for review.
