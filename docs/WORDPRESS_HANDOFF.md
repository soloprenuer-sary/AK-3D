# WordPress handoff brief

For the agent or person who builds the WordPress and WooCommerce side of Akrinity. Read this first, then `docs/PROJECT_CONTEXT.md`, `docs/BRAND_GUIDELINE.md` and `docs/WEBSITE_GUIDELINE.md`.

Last updated 2026-11-15. Frontend state is the commit `6531cff` on `main`.

---

## 1. What the project is

Akrinity is a 3D printing business in Mumbai. It sells ready-made prints, custom prints from a customer's file, and design-and-print work. The site is **headless**:

- **WordPress + WooCommerce** is the backend: products, stock, prices, orders, cart and checkout API, articles.
- **Next.js frontend** (`akrinity-web/`) is the storefront. It is a static export, so pages are built ahead of time and served as files.
- **No custom backend code** is written by default. The one approved exception is a small personalisation snippet, and only if plugins fail. Everything custom is in the frontend.

Rules that apply to the WordPress work:

- **Do not install plugins, change the local WordPress site, or touch production without the owner's explicit confirmation.** Planning and drafts are fine.
- Follow the design canvas and brand tokens exactly. Do not invent a new look.
- Never copy Amazon text or reviews. Never point Amazon buyers to the site. Keep site prices at or below Amazon.
- Do not store secrets, API keys, customer files or database credentials in the repo or in docs.
- Mark uncertain facts `VERIFY`. Mark legal or tax items `LAWYER/CA`.
- Record each decision in `docs/PROJECT_CONTEXT.md` (section 3 decision log, section 8 open items).

## 2. How the frontend reads WordPress

All data is read **at build time**. The browser does not call WordPress for products or articles.

| What | Source | Frontend file |
|---|---|---|
| Products | WooCommerce Store API: `GET {NEXT_PUBLIC_WC_STORE_API_URL}/products?per_page=100` | `akrinity-web/src/lib/wp.ts` (`fetchStoreProducts`) |
| Articles (knowledge hub) | WPGraphQL: `POST {NEXT_PUBLIC_WP_GRAPHQL_URL}` with `posts(first: 50)` | `akrinity-web/src/lib/wp.ts` (`fetchPosts`) |
| Merge and fallback | `getProducts()` and `getGuides()` | `akrinity-web/src/lib/catalogue.ts` |

Fallback: if WordPress is unreachable during the build, the frontend uses its built-in sample catalogue. The build always succeeds. That is why a missing or broken WordPress can look like "sample data is showing".

**Changes in WordPress do not appear on the live site until the frontend is rebuilt** (`npm run build` in `akrinity-web`, then redeploy). There is no webhook or automatic revalidation yet. `REVALIDATE_SECRET` is listed in `.env.example` but is not implemented (VERIFY).

### 2.1 Product fields the frontend uses

From the Store API product object:

| Field | Used for |
|---|---|
| `id` | Frontend id is `wc-{id}` |
| `name` | Product name (HTML entities decoded) |
| `short_description`, else `description` | Card and page description (tags stripped) |
| `prices.price` and `prices.currency_minor_unit` | Price. Stored as minor units (paise), so `14900` with minor unit 2 means ₹149 |
| `is_in_stock` | In stock or made to order tag |
| `images[].src` | Photos (first image is the card photo) |
| `categories[0].name` | Category. **Must match one of the nine names below exactly** |

Category names the site expects (exact spelling and ampersands matter):

1. Home decor
2. Desk & gadgets
3. Kitchen
4. Figurines & miniatures
5. Original characters
6. Experimental & art
7. Gifts & personalised
8. Hobby & cosplay
9. Spare parts

If a product has no category, the frontend puts it under "Home decor". A product in a category not on this list will not appear in the shop filters.

Not yet in WooCommerce, so the frontend ignores them today:

- **Material** (defaults to PLA+), **process** (FDM), **colour options** (defaults to black, single colour) and **size options**. The frontend shows these as fixed defaults. They need a decision on how to store them: WooCommerce attributes or a custom field (VERIFY).
- Made-to-order flag: the frontend uses `is_in_stock` only.

### 2.2 Article fields the frontend uses

From WPGraphQL `posts`:

`databaseId`, `slug`, `title`, `excerpt`, `content`, `date`, `categories.nodes[].name`

- The post with slug `hello-world` is hidden on purpose.
- Category name `Materials` or `Design` gets that label. Any other category is shown as "Guides".
- Only the first 50 posts are read.

### 2.3 Two products are local to the frontend

The **Rectangular twisted lamp** and its photos live in the frontend code (`LOCAL_PRODUCTS` in `catalogue.ts`). They show even when WordPress is connected, and they are skipped if a WooCommerce product with the same name exists. Once the lamp is created in WooCommerce with its photos, remove it from the frontend code (VERIFY with the frontend owner first).

## 3. Environment variables (names only, no values here)

Set in `akrinity-web/.env.local` for local work. Never commit that file. `.env.example` has placeholders only.

| Variable | Purpose | Scope |
|---|---|---|
| `NEXT_PUBLIC_WC_STORE_API_URL` | Store API base, e.g. `.../wp-json/wc/store/v1` | Public |
| `NEXT_PUBLIC_WP_GRAPHQL_URL` | WPGraphQL endpoint, e.g. `.../graphql` | Public |
| `NEXT_PUBLIC_SITE_URL` | Public site URL | Public |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_GA_ID` | Bot protection and analytics | Public |
| `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET` | WooCommerce REST keys for server use only | Server only, set in Cloudflare |
| `R2_*`, `TURNSTILE_SECRET_KEY`, `REVALIDATE_SECRET` | File storage, bot check, rebuild trigger | Server only |

Local URLs for development: the local WordPress site is `http://akrinity-3d.local` (see section 4). Its endpoints are in `akrinity-web/.env.local`. Do not copy those values into docs.

## 4. Local WordPress site

- Site name: `akrinity-3d`, created in **Local by Flywheel**. Files are in `C:\Users\shiro\Local Sites\akrinity-3d\`, WordPress root `app\public\`.
- URL: `http://akrinity-3d.local`. Admin is at `/wp-admin`. Admin login is held by the owner. Do not record it anywhere in the repo.
- Versions: WordPress 7.1.4, PHP 8.2.29, MySQL 8.4.0, nginx 1.26.1.
- **Local services run only while the Local app is open.** At the time of writing, the Store API and GraphQL endpoints did not answer, so the Local site was not running. Open Local and start the site before testing (VERIFY).
- Other Local sites on the same machine (`bhakti-samagra-uat`, `great-andhra-test`, `iimb-eep-local`) are unrelated. Do not touch them.
- WP-CLI works through Local's PHP and its generated `php.ini`. Paths are in `docs/PROJECT_CONTEXT.md` section 6. Run commands only against `akrinity-3d`.

### 4.1 Current state of the local site (VERIFY before relying on it)

- Content created so far (per the project log): **5 sample products** in Home decor, Desk & gadgets and Kitchen, and **5 sample articles**. Prices and stock are placeholders.
- Installed earlier and **pending removal** (needs the owner's yes): **Elementor 4.4.0**, **Header Footer Elementor / Ultimate Addons 2.9.7**, theme **Hello Elementor 3.5.2**. The headless design does not use them.
- Plugins still needed for the headless backend (not confirmed installed):
  WooCommerce, WPGraphQL, WooGraphQL, ACF with WPGraphQL for ACF, a custom order-status plugin for "Quote requested", Razorpay for WooCommerce, COD rules, Shiprocket, PDF invoices, a JWT auth plugin, a minimal headless theme that sends public pages to the frontend, and CORS configuration.
- Check the installed plugin list and WooCommerce version first. Do not assume.

## 5. What the backend has to do (scope)

Decisions already made in `docs/PROJECT_CONTEXT.md` section 4:

| Area | Decision |
|---|---|
| Cart and checkout | WooCommerce Store API. The cart token header carries the cart between calls. Since WooCommerce 9.8, browsers can read the Store API through CORS |
| Payments | Razorpay. Card details never touch the site. Cash on delivery (COD) is **off** for made-to-order and personalised items |
| Advance payment | Larger jobs take an advance, then the balance before dispatch. Start manual, automate later |
| Quotes | WooCommerce orders in a status called **"Quote requested"**. Manual first. An automatic quote engine is a later phase (Phase 3) |
| Customer files | Private Cloudflare R2 storage. Uploads go through frontend server routes with presigned multipart uploads. Files are never public |
| Shipping | Shiprocket (Delhivery through the aggregator) |
| Invoices | GST invoices with the GSTIN. Tax rates to be confirmed by a CA (`LAWYER/CA`) |
| Accounts | Login, order history, saved addresses, GST details. Frontend pages exist as signed-out placeholders only |
| Order tracking | By order number and phone. Frontend page exists, not connected |
| Forms | Contact, business and bulk, quote, reviews, newsletter. All **validate in the browser but send nothing** yet. They need to write to WordPress (WooCommerce orders or a form plugin, to be decided) |

Points the backend must not break:

- Made-to-order items must block COD at checkout (frontend shows COD disabled, the server must enforce it too).
- Personalised items ("Name: …" detail) are stored as cart item detail. The frontend builds this text, so the order needs to carry it.
- Prices shown on the site must stay at or below Amazon's. This is a business rule, not a technical one; flag any price change that breaks it.

## 6. Frontend pages that depend on WordPress

| Page | Current state | Needs |
|---|---|---|
| `/shop`, `/shop/[category]`, `/product/[slug]` | Live products from the Store API, with sample fallback | Real categories, photos, prices, stock |
| `/cart` | Saved in browser localStorage. Not synced to WooCommerce | Store API cart |
| `/checkout` | Validates only. Takes no payment | Store API checkout and Razorpay |
| `/order-confirmation` | Preview with placeholder order number | Real order after payment |
| `/track-order` | Form only | Lookup by order number and phone |
| `/login`, `/account` | Signed-out placeholder | JWT or WooCommerce auth, account pages |
| `/quote` | Validates. Upload and STL preview work in the browser. Nothing is sent | Create "Quote requested" order and store the file in R2 |
| `/contact`, `/business` | Validate only | Form destination (order, email or CRM, to be decided) |
| Product reviews | Form only | Reviews (WooCommerce native or a plugin, to be decided) |
| `/guides`, `/guides/[slug]` | Live articles from WPGraphQL, with sample fallback | More real articles |
| Home newsletter | Form only | Email tool, to be decided |

## 7. Placeholders waiting for real values

These appear on the live pages and must be replaced by the owner's real values. Do not invent them:

- Free-shipping threshold (announcement bar shows `₹[AMOUNT]`)
- WhatsApp number, support email, studio hours, reply time (`[X] hours`, `[WhatsApp number]`, `[support email]`)
- GSTIN (footer shows `[YOUR GSTIN]`)
- Stock and delivery lead time ("ships in [X] working days")
- Advance percentage for larger jobs
- Upload size limit (the quote page says up to 300 MB; the frontend skips previews above 40 MB)
- Return window and warranty text (drafts, `LAWYER/CA`)
- Real product list, photos, prices and stock
- Business and bulk price tiers (sample: same price in all tiers)

## 8. Open items for the WordPress side

Priority order proposed in the project log, with the WordPress-specific items added:

1. Owner supplies: categories and product list, photos, free-shipping threshold, GSTIN, WhatsApp number, support email, upload limit, reply time, advance percentage, return and warranty terms, logo (SVG), real stats.
2. Confirm the Local site runs and list the installed plugins and WooCommerce version (section 4.1).
3. Run the spikes in `docs/WEBSITE_GUIDELINE.md` section 10 on the clean local backend (these test the Store API, cart token, Razorpay, file upload and status handling).
4. Decide where quotes, contact and business forms are stored (WooCommerce orders, a form plugin, or email).
5. Decide how material, colour and size options are stored (WooCommerce attributes or custom fields).
6. Remove Elementor, Header Footer Elementor and Hello Elementor once the owner approves.
7. Confirm hosting after upload and API tests. Hostinger is the planned shared host, Cloudflare for Pages, R2 and DNS.
8. Set up the rebuild trigger so product changes appear without a manual rebuild (`REVALIDATE_SECRET`, not started).
9. Set the git repo and remote. The repo is `main` on the owner's GitHub. Confirm the remote before pushing.

## 9. Known gaps and stale notes

- `docs/PROJECT_CONTEXT.md` section 5 says "not a git repo yet". That is out of date: the repo exists and `main` is pushed. Section 5 also says the shop, product, cart and checkout are not built. They are built in the frontend now. Update these in the next decision entry.
- Two product options (material and colour) are shown as fixed defaults on every product. Do not treat them as real data.
- The bracketed placeholders listed in section 7 are visible on the live preview. Replace them only with the owner's values.

## 10. How to start

1. Read this file, then `docs/PROJECT_CONTEXT.md`, `docs/BRAND_GUIDELINE.md`, `docs/WEBSITE_GUIDELINE.md`.
2. Confirm the Local site is running and the endpoints in `akrinity-web/.env.local` answer.
3. Check the plugin list and WooCommerce version. Report what you find before changing anything.
4. Propose the next step with options. Do not install or change the local site until the owner confirms.
5. After any change that affects the frontend data, rebuild `akrinity-web` (`npm run build`) and check the shop and articles pages.
6. Log every decision in `docs/PROJECT_CONTEXT.md`.
