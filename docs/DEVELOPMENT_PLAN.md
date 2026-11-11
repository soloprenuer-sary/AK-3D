# Akrinity Development Plan

Version 1.0, 2026-11-12. Turns the planning documents into an ordered build. Nothing here starts until Satyam confirms each gate. Durations are relative (weeks of work), not calendar dates, because there is no fixed launch date.

Source documents: `BUILD_PLAN_DRAFT_3_HEADLESS.md` (architecture), `WEBSITE_GUIDELINE.md` (rules and phases), `BRAND_GUIDELINE.md` (look), `MOTION_SPEC_DRAFT.md` (motion), `design-sample/` (approved home, product and shop designs).

---

## 0. Current state (done)

- `akrinity-web/` created inside the akrinity folder with Next.js 16 (App Router, static export), React 19, TypeScript 5.9, ESLint 9, Prettier, Playwright, Wrangler, GSAP, three.js, React Three Fiber, Zustand, TanStack Query, React Hook Form with Zod, GraphQL client, and self-hosted Anton and Inter.
- Config: `next.config.mjs` (static export), `tsconfig.json` (strict, `@/` alias), `eslint.config.mjs`, `.prettierrc.json`, `playwright.config.ts`, `wrangler.toml`, `.env.example`, `.gitignore`, `README.md`.
- Folder structure created (components by area, lib by integration, tests, public). Starter routes: home, shop, quote, not found. Starter test file.
- Verified: `npx tsc --noEmit` passes, `npx eslint .` passes, `npx next build` produces a static site.
- Not yet done: git repository, real components, WordPress backend, Cloudflare account setup, Playwright browser install.

Notes from setup: the package registry on this machine rejected some newer versions, so TypeScript is pinned to 5.9 and ESLint to 9, with the Next lint rules applied through the plugins directly (`@next/eslint-plugin-next` 15). `tsconfig.json` was adjusted by Next (`jsx: react-jsx`), which is expected.

---

## 1. Decisions needed before Phase 1 (owner: Satyam)

| # | Decision | Default in this plan |
|---|---|---|
| D1 | "Printing now" loop: keep (breaks the no-autoplay rule) or scroll-only | Keep, pauses off screen |
| D2 | Accent colour and real logo (SVG) | Lime `#D8FF3A`; placeholder wordmark |
| D3 | Hosting after tests | Hostinger Premium, after the upload test passes |
| D4 | Free-shipping threshold, COD advance %, upload limit | Placeholders |
| D5 | Product categories and first product list | Six guessed categories |
| D6 | Git hosting (GitHub or other) and Cloudflare account | Needed in Phase 0 |
| D7 | Remove Elementor, Header Footer Elementor and Hello theme from local site | Yes, once the headless site runs |

---

## 2. Phases and gates

### Phase 0: foundations and proof (weeks 1 to 2)

Goal: prove the risky parts before building pages.

1. Git repo for `akrinity-web` (private), first commit, branch protection on `main`.
2. Local WordPress backend (the existing `akrinity-3d` site) with WooCommerce, WPGraphQL, WooGraphQL, ACF + WPGraphQL for ACF, the custom-order-status plugin, Razorpay, COD rules, Shiprocket, PDF invoices, JWT auth, and a minimal headless theme with CORS.
3. Run the nine spikes (listed in section 3). Each spike has a pass or fail result written into `docs/SPIKE_RESULTS.md`.
4. Design sign-off for the missing pages: cart and mini-cart, checkout, order confirmation, account, order tracking, quote states, policy template, 404, search, login, emails, mobile drawer, and the motion spec.

Gate 0 (owner): spikes 1, 2, 3 and 5 pass (the core commerce path); missing page designs approved; hosting choice made.
If spike 1 fails: switch to the order-pay fallback (documented in the plan) before Phase 1.

### Phase 1: launch (weeks 3 to 10, rough)

Built in this order. Each step is shown to Satyam against the canvas before the next one starts.

| Step | Work | Done when |
|---|---|---|
| 1.1 Tokens and base UI | `globals.css` tokens, buttons, pills, tags, inputs, cards, focus styles | Storybook-style test page matches the canvas System board |
| 1.2 Layout | Announcement bar, header (sticky, mobile drawer), footer, skip link | Works at 375, 768, 1024 and 1440 with no horizontal scroll |
| 1.3 Data layer | WPGraphQL client, Store API client, cart store, typed responses | Lists products from the local WordPress; cart add and remove work |
| 1.4 Home page | 13 sections in order (announcement to footer); static content from WordPress | Each section approved on the canvas, desktop and mobile |
| 1.5 Printer hero | Flat SVG printer, scroll-linked layers, reduced-motion and tier fallbacks | Passes the low-end Android check (spike 8) |
| 1.6 "Printing now" loop | Looping print section, pauses off screen | Owner decision D1 recorded |
| 1.7 Shop | Sidebar filters, product grid, interactive cards, quick view, quick add | Filters match WooCommerce product attributes; empty state works |
| 1.8 Product page | Gallery, options (material, colour, size), personalization (spike 2), quantity, pincode check, bulk tiers, related | Add to cart creates a Store API cart with the personalization text |
| 1.9 Cart and checkout | Cart page, checkout through Store API, Razorpay payment step, COD rules, shipping rates | Test orders succeed with Razorpay test mode and COD; COD hidden for made-to-order carts |
| 1.10 Confirmation and orders | Confirmation page, purchase event after payment is confirmed | Order visible in WooCommerce with the right status and invoice |
| 1.11 Custom quote | Quote form, server route creates a quote order, private R2 uploads (spike 4), Turnstile | 300 MB upload works from a phone; admin can open the file via a signed link |
| 1.12 Policy pages and compliance | Privacy, terms, shipping, returns, warranty, IP and file terms, grievance, consent banner | Legal review (LAWYER/CA) completed before go-live |
| 1.13 SEO and feeds | Metadata, JSON-LD, sitemap, robots, redirects; Google and Meta feeds pointing at frontend URLs | Lighthouse SEO 95 or higher on key pages |
| 1.14 Analytics and WhatsApp | GA4, Meta Pixel with consent, WhatsApp click-to-chat button | Events fire only after consent |
| 1.15 Hardening and QA | Security checklist, Playwright suite (desktop and mobile), Lighthouse CI, accessibility pass | All tests green; no critical accessibility issues |
| 1.16 Deploy | Cloudflare Pages production, WordPress hosting live, webhooks for rebuild, backups tested | Staging to production checklist signed off |

Gate 1 (owner): soft launch with a small set of real products; first real test order; policy pages signed off.

### Phase 2: accounts, B2B, viewer, portfolio (after Gate 1)

Accounts and order tracking (timeline from the custom statuses), quote detail with accept, decline and pay, B2B apply and bulk quotes, 3D viewer on product pages (three.js, loaded on demand), portfolio and guides, reviews, WhatsApp Cloud API order templates, Instagram and Facebook catalogue sync, abandoned-cart and offer automation, DPDP workflows (before about May 2027).

### Phase 3: instant quote engine and international (later)

Python service: mesh checks with trimesh, print estimate, calibrated against reference parts, slicer-based accuracy path, manual fallback always available. Resin model. Rush and quantity rules. International readiness (currency, shipping, export documents, GDPR review).

---

## 3. Spikes (Phase 0, throwaway code, each has a written result)

1. Store API cart and checkout with Razorpay and COD; COD hidden for made-to-order carts; paid status set by webhook.
2. Personalization text reaches cart, order line item, admin, email and invoice (plugin test, then the approved snippet if needed).
3. Custom order statuses readable by slug through the API, with the right label and per-status email.
4. 300 MB presigned multipart upload from a phone browser to R2; admin signed download.
5. Quote order created through the WooCommerce REST API from a server route.
6. Product or content change triggers a rebuild through a webhook; measure rebuild time.
7. Feed plugins output frontend URLs.
8. Printer hero and loop on a low-end Android: frame rate, memory, LCP impact.
9. WordPress API speed and CORS on the chosen host.

---

## 4. Working method

- One branch per step (`feat/1.4-home`), small commits, pull request reviewed by the owner before merge.
- Every UI step is checked against the canvas, then shown to Satyam at desktop and 390 px width.
- Commit messages: short imperative subject. No secrets in commits; `.env.local` stays local.
- A decision log entry (`docs/PROJECT_CONTEXT.md`) for every change of scope.
- Tests: Playwright for flows, Lighthouse CI for performance, manual phone test for each release.

## 5. Definition of done (every step)

- Matches the canvas for layout, type, spacing, radius and states.
- `npm run check` passes (lint, types, build).
- Works at 375, 768, 1024 and 1440 with no horizontal scroll; touch targets 44 px or more.
- Visible focus; labels and alt text; contrast checked.
- Motion has reduced-motion and low-end fallbacks.
- No placeholder text left in a live page; no copied Amazon text.
- No secrets in the repo; customer files never in public folders.

## 6. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Razorpay or COD plugin cannot take a Store API checkout | Medium | Spike 1 first; order-pay fallback; decision before Phase 1 |
| Personalization text does not reach the order | Medium | Spike 2; approved snippet; quote-flow backup |
| Shared hosting too slow for live cart and checkout calls | Medium | Spike 9 before the long prepay; VPS fallback |
| 300 MB upload fails on mobile or through hosting | Medium | Direct to R2 (spike 4); chunk size tuning |
| Mobile speed misses target with motion | Medium | Static tier, lazy loading, budgets; spike 8 |
| Local registry or tooling versions drift | Low | Lockfile committed; pinned major versions |
| Legal items (returns, deposits, BIS toys, DPDP) unresolved | High | LAWYER/CA review gate before Phase 1 step 1.12 |
| Amazon stock and price rules | Medium | Manual stock routine first; no Amazon messages; price check |

## 7. Immediate next actions (after this plan is approved)

1. Satyam answers D1 to D7.
2. Initialise git in `akrinity-web` and commit the scaffold (owner to confirm repo location).
3. Start Phase 0 spike 1 on the local WordPress site, after installing the backend plugin list.
4. Send the missing page designs to the canvas for sign-off.
