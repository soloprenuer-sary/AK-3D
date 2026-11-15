# Frontend plan: missing pages and home page additions

Last updated 2026-11-15. Frontend: `akrinity-web/` (Next.js static export). Backend plan: `docs/BACKEND_AGENT_BRIEF.md`.

Tags: **[DECIDE]** owner choice needed, **[LAWYER/CA]** legal or tax review, **[VERIFY]** check before relying on it.

---

## 1. Where we are

- **41 pages built** (plus one dev-only test page). List in the section "Pages done" of the reply and in `docs/PROJECT_CONTEXT.md`.
- **Home page:** 12 sections built (hero, stats, statement, category tiles, custom print banner, best sellers, process, materials, selected work, knowledge hub, printing-now loop, final CTA), plus header and footer.
- **Not connected yet:** cart, checkout, quote upload, all forms, accounts, order tracking, reviews, newsletter. Products and articles come from WordPress at build time.

**Rule before building any new page or home section:** design it on the canvas (https://claude.ai/artifact/WcmpoCedMZH5GvyVEXiMJX) and get approval first. The guidelines say new pages are shown before they are built. No autoplay motion on new sections (the canvas System board says so; the printing-now loop is still an open decision).

---

## 2. Pages still missing

Priority: **P1** needed before launch, **P2** after launch, **P3** later. "Backend?" says whether the page needs WordPress data to work.

### 2.1 P1: build before launch (no backend needed unless noted)

| # | Page (suggested route) | Why we need it | Backend? |
|---|---|---|---|
| 1 | Design service `/design-service` | "Sketch, photo or idea to print." The home banner and quote page point to design-and-print, but there is no page that explains it. | No (CTA goes to quote) |
| 2 | Materials hub `/materials` and four guides `/materials/pla`, `/materials/petg`, `/materials/abs-asa`, `/materials/resin` | Customers compare filaments before they buy. Today one article covers this. Also an SEO target. | No (content from WordPress later) |
| 3 | Care and safety `/care` | Cleaning and care for PLA and resin prints, child safety for figurines, and the "not for food contact" warning for kitchen items. Legal and trust. | No |
| 4 | File and IP terms `/terms/files` [LAWYER/CA] | Customer files, licences, right to refuse, takedown. Required before accepting uploads. | No |
| 5 | Refund and cancellation `/refunds` [LAWYER/CA] | Made-to-order rules, cancellation before production, COD rules. Separate from Returns. | No |
| 6 | Grievance officer `/grievance` [LAWYER/CA] | Required disclosure: name, contact, acknowledgement in 48 hours, resolution in one month. Owner supplies details. | No |
| 7 | Maintenance page `/maintenance` | Launch control, so the site can be closed for changes. | No |

### 2.2 P2: build after launch or with the backend

| # | Page | Why | Backend? |
|---|---|---|---|
| 8 | Collections: `/collections`, `/collections/new-drops`, `/collections/gifts`, `/collections/under-[amount]` | Campaign and gift shopping. | Yes (product tags) |
| 9 | Custom figure commission `/custom-figures` | For human figurines and custom likeness orders. Needs the figurine rules [LAWYER/CA]. | Quote |
| 10 | Portfolio `/portfolio` and project pages `/portfolio/[slug]` | The home "Selected work" section should link here. Listed in the guidelines but not in the page plan. [DECIDE] whether it is P1. | Partly |
| 11 | Knowledge hub filters: design tips, research notes, case studies | Hub types exist in WordPress. Add filter pages or chips. | Yes (WPGraphQL) |
| 12 | Account dashboard `/account` (real version), addresses and GSTIN, files | Replaces the signed-out placeholder. | Yes (auth) |
| 13 | Order tracking timeline `/track-order/[number]` | Real status after the form is connected. | Yes |
| 14 | Quote detail `/account/quotes/[id]` | Accept, decline, request changes, pay advance. | Yes |
| 15 | Returns request `/account/returns` | Start a return or refund for a ready-made item. | Yes |
| 16 | Accessibility statement `/accessibility` | Good practice, WCAG commitment. | No |
| 17 | HTML sitemap `/sitemap` | Helps navigation and SEO. | No |
| 18 | Compare materials `/materials/compare` | Side-by-side for a chosen product. | No |
| 19 | Material chooser "Find your filament" `/materials/find` | Short questionnaire that suggests PLA, PETG or resin. | No |

### 2.3 P3: later

| # | Page | Note |
|---|---|---|
| 20 | Sustainability `/sustainability` | Filament waste, end-of-life options. |
| 21 | Press and media `/press` | Press kit. |
| 22 | Customer gallery `/gallery` | Only with customer permission. |
| 23 | Design submissions `/designers` | Other designers sell through us. Needs its own terms [LAWYER/CA]. |

### 2.4 Not needed as separate pages

- **Reviews page:** reviews live on each product page (already built, not connected). A separate page is not needed.
- **Category subcategory pages:** the subcategory chips on category pages filter in place (see the category plan section 3). No extra routes.
- **Anime and Marvel pages:** removed by decision 1 (no licensed characters, 2026-11-13).
- **404 and search:** both built (`not-found.tsx`, `/search`).

---

## 3. Home page

### 3.1 Current sections (built)

1. Announcement bar
2. Header
3. Hero (headline, buttons, printer illustration)
4. Stats strip
5. Statement band ("Made layer by layer")
6. Shop by category (tiles)
7. Custom print banner
8. Best sellers
9. Process (five steps)
10. Materials (PLA, PETG/ABS/ASA, resin)
11. Selected work
12. Knowledge hub (three latest articles) **[already built]**
13. Printing-now loop
14. Final CTA
15. Footer (with newsletter form, not connected)

### 3.2 Items to fix on the existing home page

| Item | Problem | Fix |
|---|---|---|
| Stats strip | Shows "[X] HRS" for quote reply time, and "GST" and "PAN-INDIA" claims. | Replace with real numbers once the owner supplies them. Remove any stat that cannot be proven. |
| Announcement bar | "₹[AMOUNT]" placeholder. | Real free-shipping threshold from the owner. |
| Best sellers | Sample products until WooCommerce holds the real list. | Real products (backend brief task B3). |
| Selected work | Uses lamp renders labelled "3D render". | Real print photos from the owner. Until then, label honestly. |
| Printing-now loop | Autoplay exception not yet approved. | Owner decision: keep it or switch to scroll-driven only. |
| Materials | Three cards with no link to a guide. | Link each card to its material page (section 2.1, item 2). |

### 3.3 Proposed new home sections

Build these after the canvas approval. Order in brackets is the proposed position.

| # | Section | What it shows | Depends on | Position |
|---|---|---|---|---|
| A | **Shop by use** | Tiles for Decor, Desk, Gifts, Collectibles, Hobby. Each links to a filtered shop view. | Category pages (built) | After category tiles |
| B | **Colour your way** (new) | Single colour, multi-colour, custom colour, with swatches. Ties to the colour-mode feature. Multi-colour costs more; say so. | Owner decision on multi-colour pricing | After custom print banner |
| C | **Collections strip** | New drops, Best for gifts, Under ₹[amount]. Each card links to a collection page. | Collection pages (item 8) and product tags | After best sellers |
| D | **Find your filament** | Merged into the existing Materials section, not a new one. Adds "when to pick it" text and a link to the guide. | Material pages (item 2) | Inside Materials |
| E | **How we print** (machine types) | Four machine cards: standard FDM, multi-filament FDM, resin, and custom. No model names. Merge into the process section if it gets long. | Owner confirms the machine list | Inside Process |
| F | **Reviews** | Only real reviews from WooCommerce, with a link to the product. Hidden when there are none. Do not invent reviews. | Review system (backend task B12) | After Selected work |
| G | **Trust strip** | GST invoices, tracked shipping, returns policy, payment methods. COD is listed only where it is allowed. | Shipping and payment decisions | Before the final CTA |
| H | **Newsletter band** | A short block near the end. The footer form stays. | Mail provider (Brevo, planned) | Before the footer |

**Proposed home order after the changes:** hero, stats, statement, shop by category, shop by use (A), custom print banner, colour your way (B), best sellers, collections (C), process with how we print (E), materials with filament guidance (D), selected work, knowledge hub, reviews (F), trust strip (G), printing-now loop, final CTA, newsletter (H), footer.

---

## 4. Frontend work that is not a page

Needed for the headless setup. Each depends on the backend brief.

| Work | Depends on backend task |
|---|---|
| Cart drawer and cart page sync with WooCommerce cart (store API cart token) | B7 |
| Checkout with Razorpay and COD rules | B6, B7 |
| Quote form: file upload to private R2 through server routes (presigned) and quote order creation | B9, B4 |
| Contact, business and bulk forms send to the chosen destination | B11 |
| Turnstile check on every form, verified in a server route | none |
| Reviews form and list per product | B12 |
| Newsletter sign-up | Mail provider |
| Track order lookup by order number and phone | B13 |
| Account pages (login, register, orders, addresses) | B14 |
| Rebuild webhook route that triggers a Cloudflare Pages build | B15 |
| Sitemap, robots, canonical URLs for filtered views | none |
| Analytics (GA4, Meta Pixel) behind a consent banner; purchase event after WooCommerce confirms payment | B7 |
| WhatsApp button | owner's number |
| Form error and empty states on every page | none |

---

## 5. Owner decisions needed

1. Publish which P1 pages first? Suggested: items 1 to 7 above.
2. Is the Portfolio P1 or P2? (item 10)
3. Multi-colour pricing: flat fee or per-product? (home section B)
4. Is "Find your filament" a questionnaire or just cards with guidance? (item 19 and section D)
5. Keep the printing-now loop (autoplay exception), or go scroll-only?
6. Machine list for the "How we print" section (section E).
7. Which reviews system: WooCommerce native or a plugin? (backend B12)
8. Knowledge hub name: "Knowledge hub", "Guides", "Journal" or "Lab notes"?
9. Real values for placeholders: free-shipping threshold, reply time, WhatsApp number, support email, GSTIN, studio hours, return terms, grievance officer details.

---

## 6. Order of work

1. **Design** the P1 pages and the proposed home sections on the canvas. Owner approves.
2. **Build P1 pages** that need no backend (items 1 to 7). Keep to the design system; no new fonts or colours.
3. **Home page changes:** fix the items in section 3.2 and add sections A to E, G and H as the owner's data arrives. Section F (reviews) waits for the review system.
4. **Connect the backend** (see `docs/BACKEND_AGENT_BRIEF.md`), then the frontend work in section 4.
5. **P2 pages** that need data: collections, account pages, tracking, quote detail, returns request.
6. **QA** on phone and desktop, placeholder sweep, legal review, then launch.

Each finished step is logged in `docs/PROJECT_CONTEXT.md`.
