# Akrinity Project Context (read this first in a new session)

Last updated 2026-11-12. This file holds the memory of the project: who, what, decisions made and why, where every file lives, and what is still open. Brand rules: `BRAND_GUIDELINE.md`. Build rules: `WEBSITE_GUIDELINE.md`.

---

## 1. One-paragraph summary

Akrinity is a Mumbai 3D printing business run by Satyam (CS graduate, five years of WordPress). It sells ready-made 3D prints (already on Amazon.in), custom prints from customer files, and design-and-print. The new website is **fully headless: WordPress + WooCommerce as the backend (no custom backend code), a React/Next.js frontend with GSAP, parallax and a flat animated printer illustration as the front end**, hosted within a ₹15,000 first-year budget. The visual design is "v2, bold and playful" (Anton + Inter, ink / paper / lime, violet and orange, hard shadows, layer-line stripes). We are finishing the **planning and design phase** and about to start development after the spikes and design sign-off.

## 2. Working agreements with the user

- **No development without explicit confirmation.** Planning, research and design drafts are fine; installing or building needs a go-ahead. (Earlier, Elementor was installed on the local site before the user said stop; see section 7.)
- Explain choices like a developer pair, ask before big decisions, keep it simple to maintain.
- The canvas design wins over any older doc; do not invent a new look or swap fonts or colours. Missing pages are designed in the same system and shown before building.
- Show each finished page for review against the design.
- Keep Amazon rules: no Amazon messages or inserts pointing buyers to the site, site prices at or below Amazon, fresh product copy.
- Keep secrets, keys and customer files out of code and repos. Do not write the local database credentials into documents.
- Mark uncertain facts clearly (VERIFY, LAWYER/CA, SPIKE, DECIDE, INFERRED). Research is not legal advice.
- User preference seen in this project: wants visuals and samples to review, short answers, and decisions presented as clear options.

## 3. Timeline of decisions

1. Located the new Local site `akrinity-3d` (fresh WordPress 7.1.4, PHP 8.2.29, no plugins). Confirmed it runs.
2. Handoff brief: WordPress + WooCommerce, custom theme and plugins (then), hybrid quotes, Razorpay, COD, Shiprocket, GST invoices, B2B, 3D viewer, phases, ₹15,000 budget.
3. Six-topic deep research (hosting, WooCommerce stack, channels and SEO, quote engine, file security and viewer, Indian legal) produced `reports/Akrinity WooCommerce build research.md`.
4. `BUILD_SPEC.md` (draft 1): technical spec with custom plugins.
5. Elementor idea, then a newer brief (no page builders, v2 design with Anton and lime) led to `BUILD_PLAN_DRAFT_2.md`; a hybrid theme + Elementor option was added at the user's request.
6. **User changed direction to fully headless** (React frontend, WordPress backend, no custom backend code, three.js, GSAP, parallax): `BUILD_PLAN_DRAFT_3_HEADLESS.md` (version 3.1). Cart, checkout and statuses stay in WooCommerce via its API. The user approved one tiny personalization snippet if needed.
7. Motion: `MOTION_SPEC_DRAFT.md`. Chose the scroll-built hero; approved amending the design rule to "no autoplay loops; scroll or pointer driven; fallbacks".
8. Design samples published as an artifact. The hero evolved from a three.js vase to a **flat SVG printer illustration** (user request: a printer like the photo they supplied, animated, with nozzle and bed). Pages built: Home, Product, Shop. Shop was redesigned (sidebar filters, interactive cards) and approved ("Looks good").
9. Brand and website guidelines written (this folder).
10. `docs/DEVELOPMENT_PLAN.md` written; `akrinity-web/` scaffolded (Next.js 16 static export, React 19, TypeScript 5.9, ESLint 9, Prettier, Playwright, Wrangler, GSAP, three.js, R3F, Zustand, TanStack Query, RHF + Zod, GraphQL client, self-hosted Anton and Inter). Typecheck, lint and build pass.
11. **Home page development started (2026-11-12, on the user's go-ahead, with plan defaults for the undecided items D1 to D7):** layout (announcement bar, sticky header, footer with newsletter form not yet connected), the 13 home sections as React components under `akrinity-web/src/components/home/`, the flat SVG printer as `components/printer/` (`PrinterSvg`, `PrinterHero` scroll-linked, `PrintingLoop` looping while visible), geometry in `lib/printer-geometry.ts`, placeholder content in `lib/placeholder-data.ts`, approved design styles in `src/app/globals.css`. Checked in the browser pane at 1440 and 375 wide: renders as designed, no horizontal scroll, loop and scroll behaviour work. Header search and cart are static; links to product, policy and account pages point at placeholders.
12. **Shop page built (2026-11-12):** `/shop` in `akrinity-web` with a filter sidebar (category counts, availability, material, sort, clear all), active filter chips, the product grid, hover cards (tilt, colour dots, save, quick view, quick add), a quick-view dialog and a toast. Sample data in `src/lib/shop-data.ts`. Checked in the browser: filtering, quick view and layout work, and there is no sideways scroll. The product detail route is not built yet, so card names are not links.

13. **WordPress connected to the frontend (2026-11-13):** the storefront reads products from the WooCommerce Store API (`/wp-json/wc/store/v1/products`) and articles from WPGraphQL (`/graphql`) through `akrinity-web/src/lib/catalogue.ts`. The sample catalogue is the fallback when WordPress is unreachable at build time, so the static build always succeeds. Local URLs live in `akrinity-web/.env.local` (`NEXT_PUBLIC_WC_STORE_API_URL`, `NEXT_PUBLIC_WP_GRAPHQL_URL`), not in the repo. Five products (Home decor, Desk & gadgets, Kitchen) and five articles were created and published in the local WordPress site. Prices and stock are placeholders until the studio enters real values.

14. **Site audit and fixes (2026-11-14):** every page checked at desktop and phone width with Playwright (no console errors, no sideways scroll, internal links all resolve) plus 33 interaction checks (cart, filters, search, quick view, product options, reviews, quote form, STL preview and colour, mobile menu). Fixes: the twisted lamp stays on the site while it exists only in code (`LOCAL_PRODUCTS` in `catalogue.ts`), the default WordPress "Hello world!" post is hidden from the hub, product descriptions and photos from WordPress now show on cards, quick view and product pages, stock and colour-option tags no longer overlap, home Best sellers uses real products and Selected work uses the lamp renders, the quote preview centres models that sit far from the origin, and phone tap targets are larger.

15. **Remaining pages built (2026-11-14), following the page design board:** `/cart`, `/checkout`, `/order-confirmation` (preview with placeholder values), `/login`, `/account` (signed-out state), `/track-order`, `/business` (bulk and GST request), `/how-we-print`, plus a contact form on `/contact`. The cart is now saved in the browser (localStorage) with photos, options and prices. Checkout checks details in the browser only: no payment is taken, no order is created, no personal data is stored, and cash on delivery is disabled for carts with made-to-order items. All forms validate but send nothing until the backend (Store API, Razorpay, mail, accounts) is connected. Still open: payments (Razorpay test mode), order creation through the Store API, accounts, order lookup, real shipping and tax from the server, and legal review of policy text **[LAWYER/CA]**.
16. **Mobile pass (2026-11-14):** checked every page at 390, 360 and 320 px wide. Changes: shop filters open as a bottom sheet with a "Show N products" button; the cart dialog is a bottom sheet on phones; the product page keeps the quantity and Add to cart bar stuck to the bottom while reading options; the home knowledge hub scrolls sideways instead of stacking three tall cards; "Quick add" on shop cards is a small chip; form cards, article cards and info pages use tighter padding (placeholder hero images hidden on phones); footer links sit in two columns; category arrow icons and process step numbers fixed. No sideways scrolling on any page at these widths. Tested in headless Chrome emulation only, not on a physical phone **[VERIFY on a real device]**.
17. **P1 pages built (2026-11-15):** `/design-service`, `/materials` with four material guides (`/materials/pla`, `/petg`, `/abs-asa`, `/resin`), `/care`, `/terms/files`, `/refunds`, `/grievance`, and a `/maintenance` page (noindex). Footer links updated. Legal pages are drafts marked **[LAWYER/CA]**; officer details, return windows and refund timings are placeholders until the owner supplies them.
18. **No print hours shown to customers (2026-11-15, owner instruction):** no page, model viewer, quote or email shows how many hours a model takes to make. Pricing is order-based, and lead time is shown in working days only.
19. **Sign-up and sign-in connected to WordPress (2026-11-15, local only, not pushed):** a Cloudflare Pages Function (`akrinity-web/functions/api/auth/[action].ts`) sits between the browser and WordPress. Sign-up creates a WooCommerce customer through the REST API using a low-privilege shop-manager account; sign-in is checked by WordPress through the JWT Authentication plugin. The session is an httpOnly, Secure, SameSite=Strict cookie, so page scripts never see the token. Limits: login 20 per IP and 5 failures per email per 15 minutes; sign-up 5 per IP and 3 per email per hour; same-origin check; generic error messages; Turnstile check once the key is set. Local site plugins added: JWT Authentication for WP REST API and Limit Login Attempts Reloaded (WordPress-side lockout, tested). Local secrets live in `akrinity-web/.dev.vars` (ignored). Run with `npm run auth:dev` (port 8788). Open: Cloudflare KV for counters, a Cloudflare rate-limit rule on `/api/auth/*`, Turnstile keys, password reset, email verification, and a production shop-manager WooCommerce key **[VERIFY]**.
20. **Password reset and email verification (2026-11-15, local only, not pushed; owner approved the one WordPress snippet):** `wordpress/mu-plugins/akrinity-headless-auth.php` (about 150 lines, no secrets) makes WordPress reset and verification emails link to the storefront, flags customers created through the account service as unverified, blocks their sign-in until the emailed link is used, and adds four routes under `/wp-json/akrinity/v1/` that need a signed-in WooCommerce manager (the service account), so the public cannot call them. New storefront pages: `/forgot-password`, `/reset-password`, `/verify-email`. Sign-up no longer signs the user in; it asks them to verify first. Links work once, verification links last 2 days, reset links 24 hours; resend has a 60-second gap. Limits: forgot 3 per email and 10 per IP per hour, resend 3 per email and 10 per IP per hour, reset 10 per IP per hour, verify 20 per IP per hour. A reset also verifies the email. Needs `AKRINITY_FRONTEND_URL` in `wp-config.php`. Tested with Mailpit: 18 of 18 browser checks pass. Open: production mail delivery (SMTP or Brevo, **VERIFY**), a verification-email design, and keeping the snippet in sync on the live host.
21. **Clearer account errors and dev setup (2026-11-15, not pushed):** the form text "We could not create your account" appeared when the browser got no answer from the account service, typically on `npm run dev` (port 3000), which has no Cloudflare functions. Fixes: in development Next now forwards `/api/auth/*` to the service on port 8788 (start it with `npm run auth:service` after one `npm run build`, set `ALLOWED_ORIGINS=http://localhost:3000` in `.dev.vars`); the browser tells apart no connection, service missing, too many attempts (with wait time), locked account, unverified email, WordPress down and wrong password; sign-up reports which field is wrong; WordPress timeouts raised to 25 seconds; real causes are written to the service log, never shown to the visitor.
22. **Live backend check (2026-11-16):** the WordPress backend is at `https://admin.akrinity.in` (a copy of the local site: WooCommerce, WPGraphQL, `jwt-auth/v1` and `akrinity/v1` routes are present). Account sign-up and login failed from the frontend because the frontend project is still configured for the local site and no deployed account service exists yet (the `akrinity.in` hosts did not answer). Everyone who signs up through the storefront is now forced to the WooCommerce **customer** role. Added a setup check, `GET /api/auth/status`, enabled only when `AUTH_STATUS=1`, that lists exactly what is missing (JWT secret, snippet, service account, KV, Turnstile). Live-site steps still to be done by the owner or the backend agent are listed in `docs/BACKEND_AGENT_BRIEF.md` section B19 **[VERIFY]**.
23. **Live backend only (2026-11-17, owner instruction):** all data reading and storage now goes to the live WordPress at `https://admin.akrinity.in`. The local test site (`akrinity-3d`) is retired: its URLs and credentials were removed from the frontend config, example files and docs, and local test servers were stopped. Local credentials do not work on the live site and were deleted from `.dev.vars`; the live service account must be created on the live site and entered by the owner. (The sample-data fallback was removed the same day, see decision 24.)
24. **Products and articles come only from WordPress (2026-11-17, owner instruction):** the sample products, sample articles and the hard-coded twisted lamp were deleted from the code, and `catalogue.ts` reads the WooCommerce Store API and WPGraphQL directly. If WordPress cannot be reached the build now stops with a clear message instead of publishing sample data, so the last good deploy stays live. The site currently shows exactly the live catalogue: 5 products and 5 articles. The lamp is no longer on the site until it is created in WooCommerce with its photos (renders are kept in `public/products/rectangular-twisted-lamp/`). Material, colour and size options are still fixed defaults because WooCommerce does not store them yet (backend brief task B3).
25. **Live catalogue refresh from WooCommerce (2026-11-17):** the site is still built from WordPress, but every page that lists products or articles now also asks `GET /api/catalog/products` and `/api/catalog/posts` (a cached proxy, `functions/api/catalog/[kind].ts`, one-minute edge cache) when it opens and replaces the built data with the fresh data. Edits in WooCommerce (name, price, sale price, stock, backorder, photos, description, categories, attributes, deletions, new products) show on the shop, search, home best sellers, knowledge hub and product pages without a rebuild. If the proxy fails, the built data stays. WooCommerce slug is used for product addresses, products on backorder show as made to order, and Material, Colour, Colour mode and Process attributes are read when set. Limit: a product added after the last build appears in lists, but its own page needs a rebuild (it would 404 until then), so the automatic rebuild trigger (backend brief B15) is still needed **[VERIFY]**. Needs `WP_URL` in the Cloudflare Pages environment.
26. **Hosting moved to Vercel (2026-11-17, owner choice):** the project is deployed from GitHub to Vercel (project akrinity/ak-3-d, Root Directory `akrinity-web`). The static export was dropped: the site is a normal Next.js app, pages refresh in the background every 60 seconds (`revalidate = 60`), so edits in WooCommerce show without a deploy and a product added later gets its page on demand. The Cloudflare functions were ported to Next route handlers (`src/app/api/auth/[action]/route.ts`, `src/app/api/catalog/[kind]/route.ts`); `functions/`, `wrangler.toml` and the dev proxy were removed. Server settings now live in Vercel environment variables (names in `.env.example`); rate-limit counters use Upstash Redis when its two variables are set, otherwise they are per instance and weak. Tested locally with `next build` and `next start`: catalogue, validation, origin check, rate limit and setup check pass. Sign-up and sign-in were NOT tested end to end because the live service account does not exist yet. The earlier Vercel build error was missing `NEXT_PUBLIC_WC_STORE_API_URL` and `NEXT_PUBLIC_WP_GRAPHQL_URL`. Vercel Hobby is non-commercial only, so a paid plan is needed for a live shop **[VERIFY terms]**.
27. **Go-live reminder: admin accounts (2026-11-17, owner request):** during development the WordPress user `claude-agent` is an administrator (plugin uploads, settings) and may also be used as the storefront service account in Vercel (`WC_APP_USER`). **Before going live, remind the owner to:** (a) switch Vercel to the Shop manager account `akrinity-auth` with its own application password, (b) downgrade or remove the `claude-agent` admin account or revoke its application password, (c) delete the old test customers, (d) turn email verification, Turnstile and the Upstash rate-limit store on, (e) remove `AUTH_STATUS`. Reason: an administrator password stored in Vercel gives full control of WordPress if it ever leaks.
28. **Product attributes created in WooCommerce (2026-11-17):** with the Shop manager account `akrinity-auth` (owner authorised using its password file for this task), four global attributes were created on admin.akrinity.in and assigned to all 5 products: **Colour option** (Single colour, Multi-colour, Painted (later); starting value Single colour), **Material** (PLA+, PETG, ABS / ASA, Resin), **Colour** (black, white, orange, violet, lime; starting value black) and **Size** (Small, Medium, Large). The storefront reads them (materials, colour options, colours and sizes on the product page) and sorts them into shop order, because WordPress returns terms alphabetically. An older attribute **Material Type** already existed and was left untouched (consider removing it). The host caches the public Store API, so changes can take a while to show; ask the host or cache plugin to exclude `/wp-json/wc/store/` from caching **[VERIFY]**. The login for this task was copied into the git-ignored `akrinity-web/.env.local`; remove it from there when done.

## 4. Key decisions (current state)

| Area | Decision |
|---|---|
| Architecture | Headless WooCommerce backend + Next.js frontend; static-first; Store API for cart and checkout; fallback order-pay page |
| Backend code | None by default; one approved personalization snippet if plugins fail; quote-engine is a separate Phase 3 service |
| Design | Canvas v2 (5 boards); tokens in `BRAND_GUIDELINE.md` |
| Hero | Flat SVG printer printing layer by layer, scroll-linked; looping "Printing now" section (needs confirmation) |
| Quotes | WooCommerce orders in a "Quote requested" status; manual first, instant engine Phase 3 |
| Files | Private Cloudflare R2, presigned multipart uploads via frontend server routes |
| Payments | Razorpay; COD off for made-to-order and personalized items; advance + balance (manual first) |
| Shipping | Shiprocket (Delhivery via aggregator) |
| Hosting | Hostinger shared (after tests) + Cloudflare Pages/R2/DNS; VPS as fallback and for Phase 3 |
| Budget | About ₹11,600 baseline, ₹15,000 ceiling |
| Data source | WooCommerce Store API for products, WPGraphQL for articles; sample data as build-time fallback |
| Elementor | Dropped for the front end (headless); still installed on the local site until removal is approved |

## 5. Files and where to find them

Repo root: `C:\Users\shiro\OneDrive\Desktop\akrinity\` (not a git repo yet).

| File | What it is |
|---|---|
| `docs/PROJECT_CONTEXT.md` | This file |
| `docs/BRAND_GUIDELINE.md` | Brand, tokens, components, voice, accessibility |
| `docs/WEBSITE_GUIDELINE.md` | Architecture, stack, rules, phases, checklists, open items |
| `BUILD_PLAN_DRAFT_3_HEADLESS.md` | Latest plan (v3.1, headless). Source for the architecture details and the spikes |
| `MOTION_SPEC_DRAFT.md` | Motion and 3D spec; decisions log at the top |
| `BUILD_PLAN_DRAFT_2.md` | Earlier plan (custom theme, hybrid Elementor). Superseded, kept for history |
| `BUILD_SPEC.md` | Draft 1 technical spec (custom plugins, data model, pricing formula, Phase 3 engine). Still useful for pricing, upload validation and the quote engine |
| `reports/Akrinity WooCommerce build research.md` | Final research report with citations |
| `research_notes/Akrinity WooCommerce build research/` | Six raw research notes (hosting, WooCommerce stack, channels and SEO, quote engine, file security and viewer, legal) |
| `design-sample/source/` | Modular source of the design sample: `index.html`, `shop.html`, `product.html`, `styles.css`, `printer.js`, `app.js`, `shop.js`, `product.js` |
| `design-sample/published/` | Self-contained copies (CSS and JS inlined) that are what the artifact serves |
| `CLAUDE.md` | Short pointer so future sessions load this context |
| `docs/DEVELOPMENT_PLAN.md` | Phased development plan, gates, spikes, risks |
| `akrinity-web/` | The frontend project (see its README). Home page built; shop, product, cart, checkout, quote, account not yet |
| `.claude/launch.json` | Preview config: serves `akrinity-web/out` on port 3000 (run `npm run build` first) |
| Other SVG files in the folder (`dodge*.svg`, `ippo*.svg`) | Unrelated to Akrinity, not part of the project |

Design artifacts:
- Design canvas (source of truth): https://claude.ai/artifact/WcmpoCedMZH5GvyVEXiMJX (boards: Home, Product page, Custom quote, Mobile home, Design system and specs)
- Old handoff brief: https://claude.ai/artifact/VLWf7raDnewh5Zt6gv1nmr
- Working design sample (Home, Product, Shop; inline pages): https://claude.ai/artifact/D2jHXWTMc2AgtrnAMq1bqM

Note on the sample: stylesheets and scripts must be inline in published artifact pages (separate CSS and JS files are blocked). Build the inline copies from `design-sample/source` with a small script that replaces the `<link>` and `<script src>` tags with their contents.

## 6. Local environment

- (Retired, see decision 23) Local (Local by Flywheel) site `akrinity-3d`: `C:\Users\shiro\Local Sites\akrinity-3d\`, WordPress root `app\public\`, URL `http://akrinity-3d.local`, admin `/wp-admin`. WordPress 7.1.4, PHP 8.2.29, MySQL 8.4.0, nginx 1.26.1. Services run only while Local is open. Other Local sites exist (bhakti-samagra-uat, great-andhra-test, iimb-eep-local) and are unrelated.
- WP-CLI works with Local's PHP and the site's generated `php.ini`: PHP `C:\Users\shiro\AppData\Roaming\Local\lightning-services\php-8.2.29+0\bin\win64\php.exe`, ini `C:\Users\shiro\AppData\Roaming\Local\run\r_J78whv3\conf\php\php.ini`, phar `C:\Users\shiro\AppData\Local\Programs\Local\resources\extraResources\bin\wp-cli\wp-cli.phar`, run as `php -c <ini> <phar> --path=<site public path> <command>`.
- Installed on the local site before the user paused development: **Elementor 4.4.0** (active), **Header Footer Elementor / Ultimate Addons 2.9.7** (active), theme **Hello Elementor 3.5.2** (active). No pages created. Production untouched. Under the headless plan these are not needed; removal needs the user's yes.
- For the headless backend, the local site will need: WooCommerce, WPGraphQL, WooGraphQL, ACF + WPGraphQL for ACF, a custom-order-status plugin, Razorpay, COD rules, Shiprocket, PDF invoices, JWT auth plugin, a minimal headless theme (redirects public pages to the frontend), CORS configuration.

## 7. Research facts worth remembering (all dated Nov 2026, vendor or secondary sources unless noted)

- Razorpay about 2% + 18% GST (2.36%), T+1; Cashfree 1.95%; COD return-to-origin about 22 to 38% versus 1.5 to 5% prepaid.
- Hostinger India Premium ₹139/mo (48-month prepay, renews ₹449/mo), Unlimited ₹199/mo (renews ₹649/mo); KVM 1 VPS ₹14,376 for 24 months; Lightsail Mumbai $7 to $12/mo; Cloudflare proxy caps request bodies at 100 MB on the free plan.
- R2: 10 GB free, then $0.015/GB-month, free egress; B2 $6.95/TB-month.
- Vercel Hobby is non-commercial only; Next.js on Cloudflare free Workers has about 3 MiB size and 10 ms CPU limits; GSAP including all plugins is free for commercial use; WooCommerce Store API is stable with a cart token header, and since 9.8 browsers can read it through CORS.
- GST: regular registration needed; composition not available; own-site sales have no marketplace TCS (Amazon TCS 0.5%); e-invoicing only above ₹5 crore; HSN/SAC classification for printed goods and design services conflicts across sources.
- Legal dates: amended E-Commerce Rules from 1 January 2027; DPDP main duties about 13 May 2027; no statutory carve-out for made-to-order returns; BIS Toys Order may apply to toy-like figurines.
- Unverified in research: Amazon.in off-platform and price-parity text, India WhatsApp rates, Hostinger's real PHP limits, SEO and keyword data, B2B specifics, GDPR, abandoned-cart tooling, Meta Shops availability in India, WooGraphQL custom status handling, Razorpay through the Store API.

## 8. Open items and next steps

Priority order proposed:
1. Satyam to supply: real product categories and list, photos, free-shipping threshold, GSTIN, WhatsApp number, support email, upload limit, quote reply time, advance percentage, return and warranty terms, logo (SVG), accent choice, real stats.
2. Design the missing pages on the canvas (cart, checkout, confirmation, account, tracking, quote states, policy, 404, search, auth, emails, mobile drawer) and update the canvas System board motion line.
3. Run the nine spikes in `WEBSITE_GUIDELINE.md` section 10 on a clean local WordPress backend.
4. Confirm hosting after the upload and API tests; set up the git repo.
5. Confirm the "Printing now" loop (autoplay exception).
6. Start Phase 1 step by step only after confirmation.

## 9. How to resume in a new session

1. Read this file, then `BRAND_GUIDELINE.md` and `WEBSITE_GUIDELINE.md`.
2. Open the design canvas and the design sample links to see the approved look.
3. Do not start development until the user confirms; propose the next step with options.
4. Keep appending decisions to section 3 and updating section 8 as the project moves.
