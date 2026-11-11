# Akrinity Website: Build Spec

Status: draft v1 (2026-11-12). Derived from the owner's handoff brief and `reports/Akrinity WooCommerce build research.md`.
Items marked **[INFERRED]** are design decisions from the research, not sourced facts. Items marked **[VERIFY]** must be tested or confirmed before relying on them. Items marked **[LAWYER/CA]** need professional sign-off.

---

## 1. Goals and scope

Akrinity is a 3D printing business (Mumbai). The site must:

1. Sell 20-100 ready-made products (in stock and made-to-order).
2. Take custom print orders with file upload (STL, 3MF, OBJ, STEP, IGES, plus images and sketches).
3. Offer design-and-print from an idea, sketch or photo.
4. Serve consumers, businesses, hobbyists and students. India first, English only, international later.

Hard constraints:

- WordPress + WooCommerce, custom theme and custom plugins, built by one developer.
- First-year tools and hosting under ₹15,000 (research estimate for baseline: about ₹11,600).
- Priorities: fast on mobile, customer designs private, easy admin, low maintenance.
- Same ready-made products also sell on Amazon.in. Site copy is written fresh, site prices are at or below Amazon's.

### Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| 1 | Shop, manual quote form + file upload, payments, COD rules, shipping, GST invoices, policy pages | A customer can buy a stocked item, and request, approve and pay a custom quote end to end, with a valid GST invoice |
| 2 | Customer accounts, order tracking, B2B accounts and bulk quote, 3D viewer, WhatsApp Cloud API notifications, reviews | Logged-in customers see order and quote status; viewer works on mobile |
| 3 | Instant quote engine (Python service), resin model, rush/quantity rules | Instant estimate within tolerance on reference parts; manual fallback always works |

---

## 2. Environments

### Local (exists)

- Local by Flywheel site `akrinity-3d`, path `C:\Users\shiro\Local Sites\akrinity-3d\app\public`, URL `http://akrinity-3d.local`.
- WordPress 7.1.4, PHP 8.2.29, MySQL 8.4.0, nginx 1.26.1, DB `local`, prefix `wp_`.
- PHP limits: upload 300M, post 1000M, memory 256M, execution 1200s.
- Fresh install: default themes only, no plugins. WooCommerce not installed yet.
- Mailpit available on port 10018 for email testing.

### Production (to choose)

- Recommended for year one **[INFERRED]**: Hostinger India shared WordPress (Premium 48-month prepay ₹6,672; Unlimited ₹9,552 if daily backups are needed), Cloudflare DNS/CDN free, Cloudflare R2 for customer files.
- **[VERIFY]** inside the 30-day refund window: a 300 MB chunked upload works, WP-Cron/background jobs run, REST signing endpoint is not rate-blocked, PHP 8.2+ available, HPOS and WooCommerce run without worker limits.
- Fallback if tests fail: small India-region VPS (Lightsail Mumbai $7-12/mo, or Hostinger KVM) with CloudPanel. Phase 3 needs a VPS anyway for the Python service.
- Set `WP_ENVIRONMENT_TYPE` to `production` at launch. Use a different table prefix from `wp_` on the live site.

### Repository layout

Create a git repo (none exists yet) containing only custom code, not WordPress core:

```
akrinity-3d/
  wp-content/
    themes/akrinity-theme/
    plugins/akrinity-core/
    plugins/akrinity-files/
    plugins/akrinity-quotes/
    plugins/akrinity-gst/          (invoice template layer)
    plugins/akrinity-b2b/          (Phase 2)
  services/quote-engine/           (Phase 3, Python)
  docs/
```

---

## 3. Site map

Public:

- Home
- Shop (categories, product pages)
- Custom print: landing + upload and quote request form
- Design service: landing + brief form (idea / sketch / photo upload)
- Portfolio gallery (CPT `akr_portfolio`)
- Materials guide (PLA/PLA+, PETG/ABS/ASA, resin) (SEO content)
- Blog / guides
- About, Contact (WhatsApp button, email)
- Cart, Checkout
- Policy pages: Privacy, Terms, Shipping, Returns/Refund/Cancellation, Warranty, IP and file handling, Grievance officer

Account (Phase 2 for full features, basic WooCommerce account in Phase 1):

- Dashboard, Orders, Quotes, Files, Addresses, Details
- Order tracking (Shiprocket white-label tracking page + status timeline)

Admin:

- Quotes list and detail
- Order pipeline board
- Pricing settings
- Files (access log)

### Product categories

Design uses six guesses; the owner has not confirmed real categories. Treat as placeholders (taxonomy `product_cat`, easy to rename): home decor, desk and gadgets, figurines and miniatures, gifts and personalized, spare parts, hobby and cosplay.

---

## 4. Third-party plugins (Phase 1 baseline)

| Need | Choice | Notes |
|---|---|---|
| Commerce | WooCommerce (HPOS on) | Declare HPOS compatibility in every custom plugin |
| Payments | Razorpay for WooCommerce (free) | Leave Magic Checkout off; enable auto-updates; plugin had 2026 security fixes |
| COD rules | "Disable payment method / COD fees / Partial payment" (free tier) | Restrict by category, pincode, cart total; HPOS compatible |
| Shipping | Shiprocket WooCommerce plugin (free) + Lite plan | Pincode check on product page, white-label tracking |
| Invoices | PDF Invoices & Packing Slips (WP Overnight, free) | No native GST fields; `akrinity-gst` adds them |
| WhatsApp (P1) | Joinchat (free) | Click-to-chat only |
| SEO | Rank Math free or Yoast free (pick one) | One structured-data source only |
| Spam | Cloudflare Turnstile (free) | Guest quote form and login/register |
| Cache | Host-native caching (LiteSpeed Cache on Hostinger) | **[VERIFY]** |
| Email | Brevo free SMTP (300/day) | Transactional mail; **[VERIFY]** daily limit vs order volume |
| Catalog feeds | Meta for WooCommerce, Google Listings & Ads | Discovery feeds, not checkout |

Avoid: generic file-upload plugins for customer designs (2026 arbitrary-file-upload CVEs in several), paid deposit plugins ($99-119/yr), paid multichannel stock-sync tools (₹2,000-5,000/month).

Plugins to evaluate but not adopt without testing: product add-ons for personalization text (free options first; WooCommerce Product Add-Ons about $79/yr is the paid fallback), bulk/quantity-discount plugin (or implement in `akrinity-core`).

---

## 5. Custom code architecture

### 5.1 `akrinity-theme`

- Classic PHP theme with `theme.json` tokens, or block theme **[decision for developer]**. Must support WooCommerce templates overrides.
- Design tokens from the canvas: background `#F6F3EE`, ink `#17140F`, accent `#FF6A1F`, headings Space Grotesk, body Inter. Self-host fonts (no render-blocking third-party font calls), `font-display: swap`.
- Mobile-first. Target: LCP under 2.5 s on mid-range Android over 4G on the product page. **[VERIFY]** with PageSpeed and a throttled test.
- Layer-line stripe placeholders where photos are missing (CSS only).
- Templates: front page, shop archive, single product, cart, checkout, my-account, portfolio archive/single, quote form page, guide/blog templates.
- Cart, checkout, account and tracking pages have no design yet; design them in Phase 1 before building (open item).
- Load three.js and viewer code only on pages that need it.
- Compliance for the 1 Jan 2027 rules: no countdown timers, no pre-ticked add-ons or consents, no forced accounts, no hidden charges, no fake urgency or scarcity messages.

### 5.2 `akrinity-core`

- Registers custom order statuses (section 7) and loads status emails.
- Registers CPT `akr_portfolio`.
- Settings page: material prices, machine rates, margin, minimum order, setup fee, quote validity days, advance percentage, free-shipping threshold, upload size limit, quote reply-time text.
- Declares HPOS compatibility; all order access via `wc_get_orders()` and order-object CRUD (`update_meta_data()`, `save()`).
- Helper for audit log writes (`akr_quote_events`).

### 5.3 `akrinity-files`

Direct-to-bucket upload to private Cloudflare R2 (**[INFERRED]** architecture, **[VERIFY]** end to end on production).

REST namespace `akrinity/v1`:

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/uploads/init` | POST | Validate filename, extension, declared size; create `akr_quote_files` row (state `pending`); start R2 multipart upload; return upload ID and file ID | Logged-in user or valid quote-session token + Turnstile for guests |
| `/uploads/sign-part` | POST | Return a presigned PUT URL for one part (expiry 15 minutes or less) | Owner of file row |
| `/uploads/complete` | POST | Complete multipart upload; queue validation | Owner of file row |
| `/uploads/abort` | POST | Abort multipart upload | Owner |
| `/files/{id}/download` | GET | Return presigned GET (expiry 5 minutes) after ownership check; write access log | Admin or owning customer |

Rules:

- Every route has a real `permission_callback` and a nonce or token check. Never `__return_true`.
- Extension allowlist: `stl, 3mf, obj, step, stp, iges, igs, png, jpg, jpeg, pdf` (adjust). Keep CAD files out of the WordPress media library entirely.
- Rename to random object keys (`quotes/{quote_uuid}/{file_uuid}.{ext}`); store original filename in DB only.
- Size limit per file from settings (default proposal: 300 MB per file, 5 files per request) **[owner to confirm]**.
- Presigned URLs work only on the `*.r2.cloudflarestorage.com` host; they are bearer tokens, so keep expiry short and never log them.
- Bucket is private; no public access, no listing. Use an R2 API token scoped to this bucket only; store credentials in `wp-config.php` constants, not the database.
- File states: `pending` -> `uploaded` -> `validated` | `rejected` -> `deleted`. Files stay quarantined (not downloadable by anyone except admin) until `validated` or admin override.
- Server-side validation job (WP-Cron or Action Scheduler): fetch header bytes only, check magic bytes/structure (binary STL: size equals 84 + 50 x triangle count; ASCII STL starts with `solid` and has facet structure; 3MF is a zip with `3D/3dmodel.model`, cap uncompressed size and entry count to block zip bombs; OBJ is text), check file size matches declared size. **[VERIFY]** magic-byte rules against format specs; they came from general knowledge, not a fetched spec.
- No ClamAV (needs 3 GiB or more RAM); rely on structure checks + quarantine.
- Retention (proposal, **[LAWYER/CA]** for DPDP): delete unconverted quote uploads 30 days after quote expiry; delete originals 90-180 days after order completion unless the customer opts in to keep. Implement via scheduled job plus R2 lifecycle rules by prefix. **[VERIFY]** lifecycle expiry behaviour.
- Block PHP execution in `wp-content/uploads` (server config or `.htaccess`/nginx rule) as a backstop.
- Fallback if R2 direct upload fails on the host: chunked uploads to a non-public server directory, served by `X-Accel-Redirect` (nginx) or X-Sendfile (Apache). WooCommerce's `.htaccess`-based `woocommerce_uploads` protection does not work on nginx; add `location ~* /woocommerce_uploads/ { internal; }`.
- Rate limit init and sign endpoints per IP/user (suggest 20 inits/hour guest, 60/hour logged in). **[INFERRED]**

### 5.4 `akrinity-quotes`

- Quote request form (shortcode/block): name, email, phone/WhatsApp, quantity, material preference (PLA/PLA+, PETG, ABS/ASA, resin), colour, finish, size/scale notes, deadline, intended use, delivery pincode, notes, file uploads, "needs design help" toggle, consent checkbox (not pre-ticked) linking to Terms and IP policy, Turnstile for guests.
- Design-service request is the same form with the design toggle on, requiring at least a description; images/sketches accepted.
- Admin UI: list quotes by status, detail with files (viewer in Phase 2), price breakdown editor (material, machine time, labour, design hours, setup, margin, discounts), notes, send quote (email + optional WhatsApp template), expiry, convert to order.
- Customer UI: view quote, accept or decline, request revision, pay advance.
- Quote email contains expiry date, price breakdown, advance amount, estimated turnaround, cancellation terms box ("what happens if you cancel").
- Quote reply-time promise: owner to set (open item). Show on form.

### 5.5 `akrinity-gst`

- Adds to invoices: seller GSTIN, legal name, address, customer GSTIN (B2B, optional field at checkout), place of supply, HSN/SAC per line, CGST+SGST for intra-state or IGST for inter-state, taxable value, rate, totals in words, invoice number series.
- Design fee on its own invoice line with its own SAC.
- HSN/SAC and rate mapping table editable in settings. **[LAWYER/CA]** to confirm: SAC for 3D printing service (sources mostly say 9989 at 18%; one says 998347), HSN for printed articles (3926 vs others; toys 9503), GST on advance payments.
- Test on staging; sequential invoice numbers; credit notes for refunds.

### 5.6 `akrinity-b2b` (Phase 2)

- B2B account approval flow with GSTIN capture and validation (format check; API verification is optional).
- Bulk quote request (line-item list, quantities), reuse quote tables.
- Optional price lists or tiered discounts per approved B2B account.
- NDA: click-through acceptance for standard use; bespoke NDA only on request.
- B2B design is thinly sourced and largely my extrapolation; confirm needs with the owner before building.

---

## 6. Data model

Custom tables (prefix `$wpdb->prefix`), created via `dbDelta` on activation with versioned migrations.

### `akr_quotes`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| uuid | char(36) unique | Public-safe identifier |
| user_id | bigint null | Null for guests |
| guest_email | varchar(190) | |
| guest_token_hash | char(64) null | Hash of the guest access token |
| type | enum(`print`,`design`,`bulk`) | |
| status | varchar(20) | See quote states below |
| brief | longtext | Customer description |
| options | longtext (JSON) | Material, colour, finish, quantity, deadline, pincode |
| price_breakdown | longtext (JSON) | Admin-set lines, tax, totals |
| total | decimal(12,2) null | Pre-GST total in INR |
| advance_percent | decimal(5,2) | |
| valid_until | datetime null | |
| order_id | bigint null | Set when quote approved and order created |
| source | varchar(20) | `manual`, `engine` |
| estimate_meta | longtext (JSON) null | Phase 3 engine output |
| created_at, updated_at | datetime | |

Quote states (own state machine, not WooCommerce statuses): `requested`, `reviewing`, `quoted`, `revision`, `approved`, `declined`, `expired`, `cancelled`.

### `akr_quote_files`

`id`, `quote_id`, `user_id`, `object_key`, `original_name`, `ext`, `size_bytes`, `sha256` (null until computed), `state` (`pending`,`uploaded`,`validated`,`rejected`,`deleted`), `reject_reason`, `r2_upload_id`, `mesh_meta` (JSON: triangles, bbox, volume, watertight; populated by validation or Phase 3), `created_at`, `deleted_at`.

### `akr_quote_events`

Audit trail: `id`, `quote_id`, `actor_type` (`customer`,`admin`,`system`), `actor_id`, `event` (e.g. `file_uploaded`, `quote_sent`, `file_downloaded`), `data` (JSON, no secrets), `ip_hash`, `created_at`. Also used for file access logging.

### `akr_pricing_rules` (Phase 3, optional earlier)

`id`, `material`, `layer_height_profile`, `price_per_gram`, `machine_rate_per_hour`, `waste_percent`, `failure_percent`, `active_from`. Versioned so old quotes keep the rules they were priced with (store a rules snapshot id in `price_breakdown`).

### WooCommerce order meta (HPOS-safe, via order object)

`_akr_quote_id`, `_akr_advance_amount`, `_akr_balance_amount`, `_akr_balance_paid`, `_akr_tracking` (awb, courier, url), `_akr_gstin`, `_akr_production_notes`.

---

## 7. Order status pipeline

Design choice **[INFERRED]**: quote lifecycle lives in `akr_quotes` (section 6). A WooCommerce order is created only when the customer approves, so unapproved quotes never pollute order reports or revenue numbers. WooCommerce statuses cover everything from approval to delivery. This differs slightly from the research table, which listed quote-requested and quote-sent as WooCommerce statuses.

Custom statuses registered with `register_post_status()` and the `wc_order_statuses` filter. Slugs including the `wc-` prefix are stored in `varchar(20)`; longer slugs are silently truncated (WooCommerce issue #70266), so keep each slug 17 characters or fewer after `wc-`.

| Stage | Slug | Notes |
|---|---|---|
| Quote approved, awaiting advance | `wc-await-adv` | Order created with pay link (`get_checkout_payment_url()`); **[VERIFY]** custom status is payable on order-pay with Razorpay |
| Advance received | core `processing` | Reuse |
| Queued | `wc-queued` | In print queue |
| Printing | `wc-printing` | |
| Post-processing | `wc-post-proc` | Support removal, sanding, cure (resin), paint |
| QC | `wc-qc` | Photo of finished part attached to order notes |
| Ready to ship / balance due | `wc-ready-ship` | Balance payment link sent before dispatch if outstanding |
| Shipped | `wc-shipped` | AWB and tracking recorded |
| Delivered | core `completed` | |
| Exits | core `cancelled`, `refunded`, `on-hold`; custom `wc-reprint` | Failed print or QC fail goes back to `wc-queued` or `wc-reprint` |

Ready-made, in-stock products use core flow (pending, processing, completed) plus `wc-shipped`. Made-to-order catalogue products enter `wc-queued` after payment.

Transition rules:

- Only admins (capability `manage_woocommerce`) change production statuses.
- Each transition writes an order note and an event; customer emails/WhatsApp go out only on milestones: advance received, printing started, QC passed, shipped, delivered (do not spam).
- **[VERIFY]** hook names for custom-status emails against WooCommerce docs; the research could not confirm them.

---

## 8. Core flows

### 8.1 Ready-made product purchase

1. Product page shows: gallery, price, stock state (in stock / made to order with lead time), options (colour/material variations, size/scale, personalization text, quantity discounts table), pincode serviceability check (Shiprocket), delivery estimate, returns summary.
2. Cart and checkout: guest checkout allowed; GSTIN optional field; payment methods filtered by cart contents (section 9).
3. Payment via Razorpay (UPI, cards, netbanking); COD only where allowed.
4. Order confirmation email with GST invoice PDF.
5. Shiprocket syncs order; tracking number written back; customer gets tracking link.

### 8.2 Custom print quote (Phase 1, manual)

1. Customer opens Custom print page, fills form, uploads files directly to R2 with progress, resume on failure.
2. Quote row `requested`; files validated asynchronously; admin notified (email + dashboard badge).
3. Admin reviews files (downloads via signed link), sets price breakdown, validity, advance percent, estimated turnaround; sets `quoted` and sends email/WhatsApp link to the quote page.
4. Customer accepts: records terms acceptance (timestamp, IP hash, version of terms). System creates WooCommerce order in `wc-await-adv` with the advance amount as the payable total (or full order with deposit logic, see below) and redirects to the pay page.
5. Advance paid: order moves to `processing` then `wc-queued`.
6. Production statuses as section 7. At `wc-ready-ship`, balance collected, then shipped.

### 8.3 Advance + balance (no deposit plugin) **[INFERRED]**

- Option A (recommended): the WooCommerce order total equals the advance; a second linked order (type balance) is created at `wc-ready-ship` for the remainder and paid via order-pay.
- Option B: one order for the full amount, advance collected through ordinary checkout, balance via a Razorpay Payment Link with partial payments enabled; webhook updates `_akr_balance_paid`.
- Pick one in the first spike. GST treatment of advances **[LAWYER/CA]**. Invoice rules must handle advance receipt vs final tax invoice.

### 8.4 Design service

Same quote flow with `type=design`. Quote has design hours and a design fee line item; customer approves design concept (deliver preview images/model screenshots) before print quote is issued. IP assignment terms apply (section 12).

---

## 9. Payments, COD and shipping rules

- Razorpay: domestic fee about 2% + 18% GST (about 2.36% effective), no setup/AMC fees, T+1 settlement (research figures from Razorpay pricing page). Test mode via API keys on staging.
- COD policy:
  - Disabled for every made-to-order and personalized category, and for any cart containing a custom quote order.
  - Allowed on stocked items only, with pincode allowlist, order value cap, visible COD fee, and an advance requirement (proposal 20-30%) **[owner to confirm]**.
  - Rationale: research reports COD return-to-origin about 22-38% vs 1.5-5% prepaid (vendor data).
- Shipping: Shiprocket Lite initially; evaluate Business plan (₹199/month) at about 33-50 shipments/month. Weigh and photograph every packed parcel to contest weight disputes (about 7-day window). Free-shipping threshold: owner to set (open item). Delhivery as alternate courier through Shiprocket or direct later.
- Shipping classes by weight bands for rate display; fallback flat rate if the plugin is down.
- International (later): separate plan; needs IEC, export documentation, GDPR review.

---

## 10. Pricing model (manual quote guide, and Phase 3 input)

Cost-plus, applied per part:

```
material   = grams x (1 + waste%) x price_per_gram
machine    = print_hours x machine_rate_per_hour x (1 + failure%)
labour     = labour_minutes / 60 x labour_rate
base_cost  = material + machine + labour + setup_fee
price      = max(minimum_order, base_cost x (1 + margin%) x complexity x rush) x qty_discount
total      = price + design_fee (separate line) ; GST 18% added at invoice
```

Starting inputs from research (vendor-sourced, **[VERIFY]** against Akrinity's own costs before publishing prices):

- Filament: PLA about ₹700-1,500/kg, PETG/ABS about ₹900-1,500/kg, ASA about ₹1,200-1,800/kg; resin about ₹1,600-2,500/kg.
- Electricity about ₹7-12/kWh, printer draw 150-350 W, depreciation about ₹5/h, maintenance about ₹2-5/h, waste 10-15%, failure 5-10%, labour about ₹300/h.
- Market per-gram prices in India: FDM about ₹3-11/g (IamRapid lists ₹6/g), resin about ₹8-15/g; minimum orders ₹200-2,000.
- Worked example in the report: 100 g PLA, 9 h print is about ₹651 pre-GST, about ₹768 incl. GST (roughly ₹6.5/g).
- Complexity multipliers, rush percentages and discount tiers have no sourced standard; they are Akrinity policy choices (open item). Resin needs its own model (layer count and Z-height), not volume.
- Admin quote editor shows the formula inputs and lets the owner override any line with a reason (judgment on each quote, per the brief).

Product-page bulk pricing: tiered quantity table stored per product or category (e.g. 1-9, 10-49, 50+), applied in cart.

---

## 11. 3D viewer and file analysis

### Phase 2 viewer (client-side, custom three.js module, lazy-loaded)

- Formats: STL (STLLoader), 3MF (3MFLoader), OBJ (OBJLoader); STEP/IGES via `occt-import-js` loaded only when such a file is chosen (LGPL-2.1; check licensing obligations). Show "file received, preview unavailable" as fallback.
- Computes bounding box and signed-tetrahedron volume in the browser. STL is unitless: customer confirms mm or inches. Volume valid only for watertight meshes. Browser numbers are advisory; the server revalidates.
- Used in two places: product pages (showcase models; consider pre-converted GLB with `<model-viewer>` for AR/polish, optional) and the upload preview and admin quote review.
- Mobile: cap triangle count for preview, decimate or skip preview above a threshold, no autoload on slow connections.
- **[VERIFY]** bundle sizes (none found in research), 3MFLoader/OBJLoader behaviour, occt-import-js version 0.0.23 on real STEP files.

### Server-side conversion (optional)

STEP to GLB via `cascadio`, STL via `trimesh`; needs Python, so run on the Phase 3 service host, not shared hosting.

---

## 12. Legal, policy and compliance gates

This is research, not legal advice. Items needing a lawyer or CA are marked **[LAWYER/CA]**.

Before the first sale:

- GST registration (regular; inter-state sales and Amazon require it; composition not available). GSTIN on site and invoices.
- Policy pages live with required e-commerce disclosures: legal entity name, address, contact, grievance officer (acknowledge within 48 hours, resolve within one month), price breakup, return/refund/warranty terms, country of origin.
- Returns policy: "no returns" on custom items covers change of mind only. Defects, transit damage, wrong material/dimensions vs approved quote, and non-delivery stay remediable. Define defect tolerance objectively. **[LAWYER/CA]**
- Cancellation and deposits: tiered by production stage, shown in a "what happens if you cancel" box before payment. Whether non-refundable deposits are defensible under the cancellation-charge rule **[LAWYER/CA]**.
- Terms: upload warranty and indemnity (customer owns or has rights to the file), right to refuse/cancel, rights-holder notice contact, prohibited items (firearms and parts, lock-bypass tools, medical devices, food-contact claims, licensed characters). Copyright Act s.19: written assignment for designs Akrinity creates must state perpetual, worldwide, or choose licence-only. **[LAWYER/CA]**
- BIS Toys Order: check every product against the under-14 toy definition (scale models and figurines may count). No collectibles carve-out was found. **[LAWYER/CA]** / BIS check before listing figurines.

Dated deadlines:

- **1 January 2027:** E-Commerce (Amendment) Rules 2026 in force (dark-pattern ban with annual self-audit and certificate, lowest-price-in-30-days display on discounts, prominent entity and grievance details). Whether audit/certificate applies to a small own-site seller **[LAWYER/CA]**.
- **About 13 May 2027:** main DPDP Act duties (notice, consent, security safeguards, 72-hour breach reporting). Build consent logging, deletion workflow and a breach procedure into Phase 1 and 2 design.
- WhatsApp: INR billing required by 31 December 2026 for India accounts (Phase 2).

Other:

- File trademark early (₹4,500 per class e-filed for individual/startup) for Amazon Brand Registry; lawyer picks classes.
- Amazon: do not push Amazon buyers to the site through order messages or packaging; do not import Amazon reviews. Policy text on off-platform redirect and price parity was not retrievable **[VERIFY]** in Seller Central.
- International later: IEC, export rules, GDPR review (not researched).

---

## 13. Security checklist

- Capability checks and nonces on every action; REST routes with real `permission_callback`.
- Sanitize/escape all input and output; prepared statements for all custom SQL.
- Customer files private; signed short-lived URLs; access log; admin and owner only.
- PHP execution disabled in uploads; XML-RPC off unless needed; login rate limiting; 2FA for admin; limit admin accounts.
- Keep plugins minimal and updated; remove unused default themes/plugins on production; auto-update Razorpay plugin.
- Secrets (R2 keys, Razorpay keys, Shiprocket tokens) in `wp-config.php` constants or env, never in repo.
- Backups: daily DB + files (host backup plus an offsite copy); test restore. R2 bucket versioning/lifecycle optional.
- Razorpay webhooks: verify signature; idempotent handlers.
- Logs must not contain presigned URLs, file contents or full personal data.

---

## 14. Performance targets

- Mobile LCP under 2.5 s, CLS under 0.1, INP under 200 ms on product and home pages **[VERIFY]**.
- Self-hosted fonts, responsive images (WebP/AVIF), lazy-load below the fold, no render-blocking scripts, defer viewer code.
- Page caching for all non-cart/checkout/account pages; object cache only if the host provides it.
- Cloudflare in front for DNS/CDN/caching of static assets; uploads bypass it (direct to R2).
- Keep plugin count low; audit database queries on shop and checkout pages.

---

## 15. SEO and channels

- Unique product copy (not copied from Amazon); Product/Offer structured data once (SEO plugin or custom, not both); shipping and return details in markup.
- Pages: service landing pages (3D printing service Mumbai, custom print upload, design service), materials guide, PLA vs PETG guides, portfolio. Keyword research was not done: **[VERIFY]**.
- Google Merchant: Google Listings & Ads, `identifier_exists = no` for custom-made products, own brand set.
- Meta: catalog sync only (native checkout retired in mid-2025); India availability of Shops **[VERIFY]**; keep click-to-WhatsApp ads and link-in-bio as fallback.
- Reviews: verified on-site reviews only.
- Stock sync with Amazon: WooCommerce is the stock master; manual/inventory-file updates to Amazon at first; later a small SP-API script **[VERIFY]** (access for India not researched).
- Keep site prices at or below Amazon (recommendation; confirm with Amazon fair-pricing policy).

---

## 16. Phase 3: instant quote engine

Architecture **[INFERRED]**: Python microservice (FastAPI or similar) on a small VPS, called from WordPress over HTTPS with a shared-secret HMAC; WordPress never shells out to a slicer.

Pipeline:

1. WordPress sends `quote_id`, `file_id`, signed R2 GET URL (short expiry), material and options.
2. Service downloads the file, validates with `trimesh` (watertight, bounds, volume, triangle count), rejects over-limit meshes (guard rails: 1,000,000 triangles, 300 s slice time per OrcaSlicer defaults).
3. Fast path: volume x infill factor estimate for an instant range. Accurate path: headless OrcaSlicer or PrusaSlicer slice, parse filament grams and print time from G-code comments (`; filament used [g]`, `; estimated printing time`; binary G-code stores them in metadata blocks).
4. Apply pricing rules (section 10) and return a price range + confidence + warnings. Anything failing validation falls back to a manual quote with the reason shown (Zbotic-style behaviour).
5. Queue with timeouts and concurrency cap; results stored in `akr_quote_files.mesh_meta` and `akr_quotes.estimate_meta`.

Calibration: slice 10-20 reference parts, fit print time versus volume and surface area, and compare estimates to the slicer. Do not present an instant number as a binding price until accuracy is validated. Resin gets a separate layer-count model.

Data residency: files stay in Indian-owned infrastructure choices of your own; do not use third-party quote services that send files abroad (PrintPrice uses AWS Frankfurt).

---

## 17. Build order and milestones

Phase 1:

1. Spikes (do first, they gate the architecture): (a) 300 MB direct-to-R2 multipart upload from a browser on the chosen host; (b) Razorpay order-pay flow on a custom status; (c) advance + balance approach.
2. Repo, theme scaffold with tokens, WooCommerce install and base config, HPOS on, GST settings.
3. `akrinity-core` (settings, statuses), `akrinity-files`, `akrinity-quotes`.
4. Catalogue: categories, product templates, variations/add-ons, bulk tiers, content entry (owner supplies product list).
5. Payments (Razorpay), COD restrictions, Shiprocket, invoices (`akrinity-gst`).
6. Design and build cart, checkout, account, tracking pages.
7. Policy pages, consent logging, grievance officer, 1 Jan 2027 compliance pass.
8. Email/WhatsApp (Joinchat) integration, Turnstile, SEO basics, Meta/Google feeds.
9. QA on staging, security pass, load/mobile performance pass, trademark filing, GSTIN in place, soft launch.

Phase 2: accounts and tracking polish, B2B, viewer, WhatsApp Cloud API templates, review requests, DPDP workflows, Amazon stock-sync script.

Phase 3: engine, calibration, resin model, rush/quantity rules, VPS.

---

## 18. Testing and acceptance

Per phase, at minimum:

- Upload: 1 MB, 100 MB, 300 MB files on mobile and desktop; interrupted/resumed; wrong extension; renamed executable; oversized; zip-bomb 3MF; two users cannot access each other's files; guest token cannot be reused after expiry.
- Payments: Razorpay success, failure, cancel, webhook replay, refund; advance and balance paths; COD allowed/blocked by category/pincode/value.
- Statuses: every transition, emails sent only at milestones, HPOS on, slug length check.
- GST: intra-state vs inter-state invoices, B2B GSTIN, credit note, design fee line.
- Compliance: no dark patterns; policy pages present; grievance flow; consent logged.
- Performance: PageSpeed mobile on home, category, product, quote page.
- Security: nonce/permission tests, rate limits, PHP execution block verified in uploads.
- Backup restore test on staging.

---

## 19. Open items and assumptions

Open items from the brief still needing owner input:

1. Real product categories.
2. Product list, prices, free-shipping threshold, upload size limit, quote reply time.
3. Design of cart, checkout, account and order-tracking pages.
4. Hosting choice (confirm after the Hostinger test window).
5. Exact instant-quote formula inputs for Phase 3 (complexity, rush, quantity tiers, resin).
6. Amazon stock sync approach (default in this spec: WooCommerce master, manual updates, script later).
7. Visual references (current look is placeholder).

Additional decisions raised by research:

- COD policy and advance percentage on stocked items; advance percentage on custom jobs.
- Retention periods for customer files.
- Option A vs B for balance collection.
- Block theme vs classic theme.
- Whether existing Amazon products include toy-like figurines needing BIS review.

Assumptions: ₹88 per USD for cost estimates; vendor and secondary-source prices are as of November 2026 and will change; hosting prices may or may not include 18% GST (could add up to about ₹1,640 and break the budget).

Known research gaps (see report for full list): Amazon.in off-platform/price-parity policy; official GST classification; India WhatsApp rate card; Hostinger real PHP limits; SEO benchmarks; B2B specifics; GDPR; bundle sizes for viewer libraries.
