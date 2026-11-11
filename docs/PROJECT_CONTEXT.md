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

- Local (Local by Flywheel) site `akrinity-3d`: `C:\Users\shiro\Local Sites\akrinity-3d\`, WordPress root `app\public\`, URL `http://akrinity-3d.local`, admin `/wp-admin`. WordPress 7.1.4, PHP 8.2.29, MySQL 8.4.0, nginx 1.26.1. Services run only while Local is open. Other Local sites exist (bhakti-samagra-uat, great-andhra-test, iimb-eep-local) and are unrelated.
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
