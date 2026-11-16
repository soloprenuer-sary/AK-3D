# Backend agent brief: WordPress and WooCommerce for Akrinity

Give this file to the agent that works on WordPress. Read it fully before you touch anything.

Last updated 2026-11-15.

---

## 0. Your job in one paragraph

You build and configure the **backend** of the Akrinity store. The backend is **WordPress with WooCommerce**, running on a local test site now and later on a live host. The **frontend** is a separate Next.js site (`akrinity-web/`) that reads products and articles from WordPress and sends customers to WooCommerce for cart, checkout and accounts. The site is **headless**: the frontend does the look and the interaction, and WordPress holds the data, orders and payments.

You configure WordPress with plugins and settings. You write **no custom backend code** unless the owner approves one specific snippet (task B17 says how). All custom code belongs in the frontend, and the frontend is someone else's job.

---

## 1. Read first (in this order)

1. `docs/WORDPRESS_HANDOFF.md`: how the frontend reads WordPress, field names, category names, local site state.
2. `docs/PROJECT_CONTEXT.md`: decisions log (section 3), decisions table (section 4), local environment (section 6), open items (section 8).
3. `docs/WEBSITE_GUIDELINE.md`: architecture, the nine spikes (section 10), rules and phases.
4. `docs/CATEGORY_AND_PAGES_PLAN.md`: product attributes (section 1), category list (section 2), decisions recorded (section 8a).
5. `docs/FRONTEND_PLAN.md`: what the frontend needs from you (section 4 maps to tasks in this brief).
6. `docs/BRAND_GUIDELINE.md`: only if you need text or labels for WordPress admin screens that customers will see (emails, invoices).

---

## 2. Hard rules

- **Ask before you install, remove or change anything in the local site or any live site.** Approval for the plugins in task B2 is given by the owner handing you this brief. Install nothing outside that list without asking.
- **Never store secrets in the repo or in docs.** That includes admin passwords, database credentials, Razorpay keys, WooCommerce consumer keys, R2 keys and Turnstile secrets. Keep them in `wp-config.php` constants, the plugin's settings screen, or the host's environment variables. Tell the owner where each one was put, without the value.
- **No custom backend code** by default. If a plugin cannot do something, stop and write it up for the owner with the options. The owner decides on the one approved snippet.
- **No licensed characters.** Products are original designs only (decision 1, 2026-11-13).
- **No food storage items.** Kitchen products are non-food-contact only and labelled that way (decision 4).
- **No age-restricted or NSFW content** (decision 5).
- **No print hours shown to customers.** Never show, store in public data or put in emails how many hours a model takes to make. Orders are order-based. Customers see lead time in working days only.
- **Amazon:** never copy Amazon text or reviews, never point Amazon buyers to the site, and site prices stay at or below Amazon prices.
- **Legal and tax items are for the owner's CA or lawyer.** Mark them `LAWYER/CA`. Do not decide GST rates, HSN/SAC codes, return rules or privacy wording yourself.
- **Mark uncertain facts `VERIFY`** in anything you write down.
- **Record decisions** in `docs/PROJECT_CONTEXT.md` (section 3, next number) and update section 8 open items. Do this for every decision, including ones you made because the plugin only allowed one way.
- **Do not change the frontend.** If the frontend needs something, write it in your report. Do not edit files in `akrinity-web/`.

---

## 3. Environment

- **Live backend only:** WordPress is at `https://admin.akrinity.in` (admin at `/wp-admin`). The frontend reads and writes data only there. There is no local WordPress for this project any more. Ask the owner before changing anything on it, and take a backup first.
- Keep database credentials, application passwords and keys out of the repo and docs.
- Frontend endpoints are set in `akrinity-web/.env.local` and in the Cloudflare Pages environment (`NEXT_PUBLIC_WC_STORE_API_URL`, `NEXT_PUBLIC_WP_GRAPHQL_URL`, `WP_URL`).

---

## 4. Tasks

Do them in order unless a task says it can run alongside another. Each task ends with a **Done when** list. Report after each task (format in section 6).

### B0. Preflight and inventory

**Goal:** know exactly what is installed before you change anything.

Steps:
1. Start the Local site. Confirm the WordPress admin loads.
2. Record: WordPress, PHP, MySQL and nginx versions; the active theme; every installed plugin with version and status (active or inactive).
3. Record WooCommerce version, whether the Store API responds at `/wp-json/wc/store/v1/products`, and whether `/graphql` responds.
4. List existing products, categories and posts (count and names only).
5. Check the site's permalinks, the `hello-world` post, and the default sample page.

**Done when:** an inventory report is written to the owner (section 6 format). Nothing is changed yet.

### B1. Remove the old page-builder setup (owner approval first)

**Goal:** remove the Elementor set that was installed earlier. The headless design does not use it.

Plugins to remove: **Elementor 4.4.0**, **Header Footer Elementor / Ultimate Addons 2.9.7**. Theme to switch away from: **Hello Elementor 3.5.2**.

Steps:
1. **Ask the owner for a yes.** Do not remove anything without it.
2. After the yes: switch to a minimal theme (for example WordPress's default block theme). Deactivate, then delete the three items above.
3. Check that no pages still depend on Elementor. Do not delete content.

**Done when:** the owner has said yes, the three items are gone, and the site still loads in the admin and in the Store API and GraphQL endpoints.

### B2. Core plugin set (installation approved by the owner)

**Goal:** the plugins the store needs. Install only this list. Each one needs a short note on its settings.

| Plugin | Purpose |
|---|---|
| WooCommerce (current, record version) | Products, cart, checkout, orders, Store API |
| WPGraphQL | Articles and content for the frontend |
| Advanced Custom Fields (ACF) and WPGraphQL for ACF | Extra article fields (task B5) |
| A JWT or application-password authentication plugin (choose one, VERIFY it supports the WooCommerce customer login) | Customer login for account pages (task B14) |
| Custom order statuses for WooCommerce (choose one) | Adds "Quote requested" and the quote statuses (task B4) |
| Razorpay for WooCommerce (current, VERIFY it works through the Store API) | Payments (task B6) |
| Shiprocket for WooCommerce (current) | Shipping (task B8) |
| A GST-invoice or PDF-invoice plugin (choose one) | Invoices (task B8) |
| A product feed plugin, only if the owner wants Google or Meta catalogue feeds (ask first) | Feeds (task B10) |

Do **not** install WooGraphQL, page builders, or a separate CORS plugin yet. Task B7 decides whether a CORS setting is needed.

Steps:
1. Install and activate the plugins above, one at a time. Log the version of each.
2. Run WooCommerce's setup wizard with placeholders. Set currency to INR and the store country to India.
3. Set the store address to a placeholder. Do not enter the real GSTIN here until the owner gives it (task B8).
4. Turn off WooCommerce's default payment methods that are not used (leave COD as is for now; B6 sets its rules).

**Done when:** every plugin in the table is active, its version is logged, and the Store API and `/graphql` still respond.

### B3. Product catalogue data model

**Goal:** every product carries the attributes the frontend needs, so filters and product pages work.

Categories (exact names, the frontend matches them):

1. Home decor
2. Desk & gadgets
3. Kitchen
4. Figurines & miniatures
5. Original characters
6. Experimental & art
7. Gifts & personalised
8. Hobby & cosplay
9. Spare parts

Subcategories are optional. Use them only if the owner asks, because the frontend shows subcategory chips from its own list.

Product attributes to create (WooCommerce global attributes, so they appear in the Store API):

| Attribute | Values | Notes |
|---|---|---|
| Material | PLA+, PETG, ABS / ASA, Resin | Frontend currently uses PLA+ as the default |
| Colour mode | Single colour, Multi-colour, Painted (later), Custom colour | Use variations for colour options (decision 3) |
| Print process | FDM, FDM multi-filament, Resin | Set by the machine used |
| Size | S, M, L, XL, Custom | Size drives price and print time |
| Use | Decor, Functional, Gift, Collectible, Hobby | Powers "Shop by use" |
| Lead time (working days) | number | Per product, shown as "ready in X working days" |
| Personalisation | None, Name or short text (max 40 characters) | Stored as order item detail |
| Licence status | Original design (only value allowed) | Internal. Never show to customers |

Steps:
1. Create the nine categories with the exact names above. Keep the frontend's category order.
2. Create the attributes above. Do not show "Licence status" on any public page.
3. Set stock management on. Set each product to in stock or made to order. Made-to-order items use the `is_in_stock` flag, plus a "Made to order" tag the frontend can read.
4. Add a short description for every product (plain text, under 200 characters) and a full description.
5. Set product images (main photo first, then 3 to 5 more). Use WebP where possible. Set alt text.
6. Create the product **Rectangular twisted lamp** in WooCommerce with its photos, so the frontend's local copy can be removed later. Do not delete the local copy yourself. Report back, and the frontend owner will remove it.
7. Confirm the Store API returns each attribute and the stock flag: `/wp-json/wc/store/v1/products`.

**Done when:** each product in the store has a category from the list, a material, a colour mode, a stock state, a lead time, a photo and a short description. The Store API response shows them. Report any product that is missing one, with its name.

**Owner input needed:** real product list, prices, stock, photos, and lead times. Do not invent prices or stock. Leave sample products marked "sample" in the title until replaced.

### B4. Quote workflow

**Goal:** a custom quote from a customer becomes a WooCommerce order in a status the team can work through.

Statuses to create (names exact):

- Quote requested
- Quote sent
- Quote approved (advance pending)
- In production
- Quality check
- Ready to dispatch
- Dispatched
- Completed
- Quote declined
- Cancelled before production

Steps:
1. Using the chosen custom-status plugin (B2), create the statuses above.
2. Set "Quote requested" as the status for a new quote order. Quote orders have no payment at this step (decision in the frontend plan: no payment at quote stage).
3. Create an order field or order note holding: job type, material, colour mode, quantity, GST needed (yes or no), notes, and a reference to the uploaded file (task B9). Use plugin fields or order meta. Do not show raw file URLs to staff outside the admin.
4. Set up an email to the team when a quote is requested (use the store's email settings, not custom code).
5. Write a short staff note (in the admin, not the site) on how each status is used.

**Done when:** a test quote created through the API or admin appears as "Quote requested", the team gets an email, and all statuses exist. Quotes cannot be paid until "Quote approved".

**Owner input needed:** team email address, the advance percentage (for B6), and quote reply time.

### B5. Article content model

**Goal:** articles in WordPress carry the fields the knowledge hub needs.

Fields to add with ACF (exposed to WPGraphQL):

| Field | Type | Notes |
|---|---|---|
| Summary | Text, max 150 characters | Shown on cards |
| Type | Choice: Materials, Design, Guides, Research, Case studies, News | Frontend maps Materials and Design; others show as Guides for now |
| Material tags | Choice list (PLA+, PETG, ABS / ASA, Resin) | |
| Reading time | Number (minutes) | Calculated or entered |
| Featured image | Image, 1600 x 900 | |
| Related products | Relationship, up to 4 | |
| Author | Text | |
| Last updated | Date | |

Steps:
1. Add the fields. Expose them to WPGraphQL. Confirm `posts` returns them.
2. Set drafts so they never appear in the public GraphQL query. Confirm with a draft post.
3. Set up a preview link for drafts that uses a signed or expiring token. Test it.
4. Keep the `hello-world` post in the database but do not publish it (the frontend hides it anyway).
5. Create the article categories listed in the type field.

**Done when:** a published article returns all fields in GraphQL, a draft does not, and the preview link works.

### B6. Payments: Razorpay, COD rules, advance and balance

**Goal:** customers can pay online, and the cash-on-delivery rules are enforced on the server, not just hidden on the page.

Rules:

- COD is **off** for made-to-order items and for personalised items.
- COD is allowed for stocked items only, up to the owner's limit (placeholder "₹[AMOUNT]" until the owner gives it).
- Larger jobs take an advance, then the balance before dispatch. Start manual: the team marks the advance paid in admin, then the balance is requested through a payment link. Automate later.
- No card details are stored on the site. Razorpay handles them.

Steps:
1. Set Razorpay to **test mode**, with test keys stored as constants or in the plugin settings. Never write live keys into docs.
2. Test a full payment with Razorpay's published test cards. Record the order status change.
3. Enforce the COD rules in WooCommerce payment gateway settings, or with the plugin's rules. Test: a cart with a made-to-order item must not offer COD. A cart with a personalised item must not offer COD. A stocked cart can offer COD.
4. Set up the advance flow: order in "Quote approved (advance pending)" takes a payment for the advance percentage, then moves on. Test with the test keys.
5. Check that the Store API checkout path can use Razorpay. This is spike work in task B7.
6. Write the refund steps for staff (admin only).

**Done when:** test payments succeed in test mode, COD rules block correctly in both cases, and the advance flow works end to end.

**Owner input needed:** advance percentage, COD order limit, the exact list of products that are personalised.

**LAWYER/CA:** refund and cancellation terms, GST on advance and balance payments.

### B7. Cart and checkout through the Store API (spike)

**Goal:** confirm the frontend can use the WooCommerce cart and checkout through the Store API. Decide whether the fallback is needed.

Steps:
1. Using the Store API from another origin (the frontend's dev address), create a cart, add items, update quantities, and remove items. Use the cart token header. Record the response headers and status codes.
2. Check CORS: a browser request from a different origin must work. WooCommerce 9.8 and later support this. Record whether the default headers are enough or a CORS setting is needed. If a plugin is needed, ask the owner first (B2 excluded it).
3. Run a checkout through the Store API: customer details, shipping, payment method, and place the order with Razorpay test mode (B6).
4. If the Store API checkout cannot take Razorpay, test the fallback from `WEBSITE_GUIDELINE.md` section 2: cart and address steps stay on the frontend, and only the payment step opens a WooCommerce order-pay page. Record which one works.
5. Test the cart token survives a page reload in the browser.

**Done when:** a written result says which path works (Store API checkout or the order-pay fallback), with the request steps and any CORS settings used. The frontend owner needs this before building checkout.

**VERIFY:** every spike result. Record the WooCommerce version it was tested on.

### B8. Shipping, tax and invoices

**Goal:** shipping quotes, tracking and GST invoices work.

Steps:
1. Set up Shiprocket with test credentials (or the sandbox, if available). Use the free-shipping threshold once the owner gives it (placeholder "₹[AMOUNT]" until then).
2. Set the pincode check used on product pages: the frontend calls the Store API shipping rates. Confirm the rates endpoint returns a price for a Mumbai pincode and a Delhi pincode.
3. Store the courier tracking number on the order. Make the tracking link available through the order API for B13.
4. Set up the invoice plugin. Invoice number format, the GSTIN field (placeholder "[YOUR GSTIN]" until the owner supplies it), and the business name and address.
5. Add the optional "business order, GST invoice" fields at checkout (name, GSTIN, company name). Validate the GSTIN format.
6. Check tax settings: prices shown on the site include GST (the frontend says so), and tax rates are set to the owner's CA's instructions.

**Done when:** a test order gets a shipping quote for two pincodes, a tracking number can be stored, and an invoice PDF with the GSTIN fields generates.

**LAWYER/CA:** GST rates per product type, HSN/SAC codes for printed goods and design services, invoice wording, and whether e-invoicing applies. Do not decide these. Record the options.

### B9. Customer files (private storage)

**Goal:** customer 3D files go to private storage, never the public WordPress media library.

Steps:
1. Confirm the design: the frontend uploads files to a **private** Cloudflare R2 bucket through server routes with presigned URLs. WordPress does not receive the file itself.
2. WordPress stores only a **reference** on the quote order: file key, original name, size in bytes, file type, upload date. Add these fields with the order fields from B4.
3. Block direct uploads of customer files into the WordPress media library. Test that a file upload through the normal media screen is either blocked for the quote type or clearly not used for quotes.
4. Set file limits to the owner's upload limit (VERIFY and the owner's value; the frontend currently says up to 300 MB and skips previews above 40 MB).
5. Document who can see files in admin: staff only, through a signed link valid for a short time.

**Done when:** a quote order can store a file reference (with test data), the file never appears in the public media library, and the reference shows in the admin.

**Owner input needed:** upload limit, the R2 bucket name and region (ask the owner to create the bucket; keys go in the host environment, not in docs).

### B10. Public routing and feeds

**Goal:** WordPress is not the public site. Visitors land on the frontend.

Steps:
1. Plan the domain layout: the frontend serves the public domain, WordPress serves a subdomain (for example `cms.`). Ask the owner for the subdomain name.
2. Make public WordPress pages redirect to the frontend, except admin, the API endpoints and the fallback order-pay page (B7). Set this with a minimal headless setting or a redirect plugin, not custom code.
3. Check feed plugins (if the owner asked for them in B2) emit **frontend** product URLs, not WordPress URLs. VERIFY.
4. Remove the default WordPress sample page and the `hello-world` post from public view.

**Done when:** a public WordPress page redirects to the frontend URL, the API and admin still work, and any feed shows frontend product URLs.

### B11. Form destinations

**Goal:** every form on the frontend has a place for its data.

Forms: contact, business and bulk, custom quote (B4), product reviews (B12), newsletter.

Options to offer the owner, with a recommendation:

| Form | Options | Recommended |
|---|---|---|
| Contact | Email to the team; a WooCommerce "enquiry" order; a form plugin | Email to the team, with a copy stored in WordPress |
| Business and bulk | A WooCommerce quote order (B4) | Quote order |
| Custom quote | B4 quote order | Quote order (already decided) |
| Newsletter | Brevo (planned in the guidelines) | Brevo, owner signs up |

Steps:
1. Write a short options note for the owner covering each form with the choice above.
2. After the owner decides, set up the destination for each form. Do not add form endpoints through custom code. Use the plugin or the store's own email tools.
3. Confirm each destination receives a test submission.
4. Make sure no personal data from these forms is in public pages or public API responses.

**Done when:** each form has a decided destination and a test submission arrives there.

**Owner decision needed:** which destination for contact, and the Brevo account (owner signs up; do not sign up for the owner).

### B12. Product reviews

**Goal:** each product page shows real reviews, moderated.

Steps:
1. Enable WooCommerce reviews (native). Turn on "only verified buyers can review" if the owner agrees. Ask first.
2. Set reviews to **pending approval** by default.
3. Set the review fields: rating (1 to 5), name shown, text. Photos later.
4. Confirm reviews appear in the Store API for each product. Test with one review.
5. Do not create fake reviews, not even test ones, outside the local site. Mark any test review "test" and delete it before launch.

**Done when:** a test review is submitted, held for approval, approved, and returned by the Store API.

**Owner decision needed:** verified-buyer rule, and whether to start with a simple form or wait for a review system (decision 7 says "choose the approach when we build").

### B13. Order tracking lookup

**Goal:** a customer can check an order by order number and phone number.

Steps:
1. Check whether the Store API order endpoint plus the order number and phone is enough. Prefer that. VERIFY it does not expose other customers' orders.
2. If it is not enough, write the requirement for the owner: the one approved snippet (B17) is the only route for custom code.
3. Return only: status, status history, courier and tracking link, and the last update date. Never return addresses, payment details or file references.
4. Rate-limit lookup attempts (plugin or host setting).

**Done when:** a test order can be found by number and phone, a wrong phone returns nothing, and no private fields are returned.

### B14. Customer accounts

**Goal:** customers can register, log in, and see their orders, addresses and GSTIN.

Steps:
1. Enable customer registration in WooCommerce (email and password). Require a password of at least 8 characters.
2. Set up the JWT or application-password plugin (B2) so the frontend can log customers in. Test login and token refresh.
3. Expose: order list, addresses, saved GSTIN and company name. Keep quotes (B4) visible to the customer only when they are logged in.
4. Turn on a password reset email and check the email wording with the owner.
5. Turn off public listing of customer data and check that a logged-out request gets nothing.

**Done when:** a test account can register, log in, see only its own orders, update addresses, and log out.

**LAWYER/CA:** privacy notice wording for account data (DPDP), and the consent text at sign-up.

### B15. Rebuild webhook

**Goal:** when products, articles or orders change, the frontend rebuilds so changes show.

Steps:
1. Ask the owner for the Cloudflare Pages build hook URL. Store it in WordPress as a constant or in the plugin settings. Do not write it into docs.
2. Trigger the build on: product created, updated or deleted; article published or updated; (optionally) stock change. Do not trigger on every order.
3. Debounce: at most one build every 5 minutes, so bulk edits do not start many builds. Use a plugin setting or a scheduled check.
4. Log each trigger and its response in the admin.

**Done when:** publishing a test article starts one build, and a second edit within five minutes does not start another.

### B16. Security and operations

**Goal:** the site is safe to run and easy to recover.

Steps:
1. Set up two-factor login for every admin account.
2. Set up daily backups of the files and the database, stored off the server. Test one restore on the local site.
3. Set a policy for updates: WordPress core, plugins and WooCommerce updated monthly, after a test on the local site.
4. Limit file upload types for admins (plugin setting).
5. Set the admin login page to not show user lists or usernames in public. Use strong passwords stored in the owner's password manager.
6. Confirm the forms are protected from spam. The frontend uses Turnstile; the server check happens in the frontend. Note that WordPress endpoints will also need rate limits (B13, B14).
7. Check that no public page or API returns the admin email or customer data.

**Done when:** 2FA is on, one backup is restored successfully on the local site, and the update policy is written in the project log.

### B17. Approved snippet (only if a plugin fails)

**Status: approved and written.** The owner approved one snippet for password reset and email verification: `wordpress/mu-plugins/akrinity-headless-auth.php` (decision 20). Deploy it by copying to `wp-content/mu-plugins/` and setting `AKRINITY_FRONTEND_URL` in `wp-config.php`. Do not add other custom code under this approval.

**Goal:** a last resort, used only if a plugin cannot do a required job.

Rules:
- Do not write this unless the owner approves **that specific task** in writing.
- Keep it to one small file or one plugin, with a comment that says what it does and why.
- Put it in a single file under version control in the repo only if the owner asks. Otherwise keep the file in the local site's plugin folder and record it in the project log.

**Done when:** the owner approved the snippet, it does only the one job, and it is written up in the project log.

### B19. Go-live account setup on admin.akrinity.in

**Superseded by `docs/ACCOUNT_SETUP.md` (decision 32): use the shared key, not a service account. Follow that file.**

**Goal:** make sign-up and login work against the live WordPress at `https://admin.akrinity.in`.

Steps (ask the owner before changing the live site):
1. In `wp-config.php` add `JWT_AUTH_SECRET_KEY` (a new long random value, never reuse the local one) and `AKRINITY_FRONTEND_URL` (the live storefront address, https).
2. Confirm `wp-content/mu-plugins/akrinity-headless-auth.php` is present and current, and the JWT and Limit Login Attempts plugins are active.
3. The storefront uses the `claude-agent` user. In its profile create an Application Password named "Storefront" and give it to the owner to store in the Vercel environment as `WC_APP_USER=claude-agent` and `WC_APP_PASSWORD`. Never put it in the repo. (Before launch, replace it with a limited account, see the go-live reminder in PROJECT_CONTEXT decision 27.)
4. Set up outgoing email (WP Mail SMTP is present) and send a test.
5. In the Vercel project (Settings, Environment Variables, Production and Preview) set: `NEXT_PUBLIC_WC_STORE_API_URL`, `NEXT_PUBLIC_WP_GRAPHQL_URL`, `NEXT_PUBLIC_SITE_URL`, `WP_URL=https://admin.akrinity.in`, `WC_APP_USER` and `WC_APP_PASSWORD` (mark Sensitive), `TURNSTILE_SECRET_KEY`, and `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (an Upstash Redis database, for shared rate-limit counters). Root Directory is `akrinity-web`. Temporarily set `AUTH_STATUS=1`, open `/api/auth/status`, fix every red item, then remove `AUTH_STATUS` and redeploy.
6. Create one test account from the storefront. Confirm it appears under Users as **Customer**, the verification email arrives, and sign-in works after verifying. Delete the test user.

**Done when:** the status page is all green and a new storefront sign-up appears in WordPress as a Customer.

### B18. Acceptance pass

**Goal:** prove the backend works end to end before the frontend connects.

Checks:

1. Product: a product appears in the Store API with its category, attributes, stock state, price and photo.
2. Cart: add, change quantity, remove, reload. The cart survives.
3. Checkout: a stocked item can pay with Razorpay test mode and COD. A made-to-order item cannot pay with COD. The personalised item shows its detail on the order.
4. Quote: a quote request creates a "Quote requested" order with a file reference. The team gets an email. The advance can be paid after approval.
5. Article: a published article is returned by GraphQL with all fields. A draft is not.
6. Review: a review waits for approval and then shows.
7. Account: register, log in, see only own orders, log out.
8. Tracking: a lookup works with the right number and phone, and fails with the wrong phone.
9. Rebuild: a publish triggers one build, debounced.
10. Routing: public WordPress pages redirect to the frontend. The API and admin still work.
11. Security: 2FA on, one backup restored, no public customer data.

**Done when:** every check above is marked pass or fail, with the test used, and failures have a written owner decision or a fix.

---

## 5. Items the owner must supply (ask, do not invent)

| Item | Used in |
|---|---|
| Real product list, photos, prices, stock, lead times | B3 |
| Free-shipping threshold | B8, frontend announcement bar |
| COD order limit | B6 |
| Advance percentage | B4, B6 |
| Upload size limit | B9 |
| Team email for quotes and contact | B4, B11 |
| GSTIN and company legal name | B8 |
| Support WhatsApp number and email | B11, frontend |
| Quote reply time | B4, frontend |
| Cloudflare Pages build hook URL | B15 |
| R2 bucket name and region | B9 |
| Subdomain for WordPress | B10 |
| Brevo account (owner signs up) | B11 |
| Verified-buyer rule for reviews | B12 |
| Destination for each form | B11 |
| Grievance officer contact (for the frontend) | frontend item 6 |

---

## 6. How to report

After each task, write a report with these headings:

```
Task: B<number> <name>
Status: done / blocked / partly done
What changed: (plugins installed with versions, settings changed, pages created)
Tests run: (what you tested, pass or fail, with the result)
Decisions made: (each one, logged in docs/PROJECT_CONTEXT.md section 3 as well)
Owner decisions needed: (numbered questions, with options and your recommendation)
Items to VERIFY: (anything uncertain)
Frontend impact: (anything the frontend must change, or "none")
```

Keep reports short. Lead with what is blocked, if anything, then what is done.

---

## 7. What not to do

- Do not change anything on a live site. Local only, until the owner says otherwise.
- Do not install plugins outside task B2 without asking.
- Do not write custom code unless B17 is approved.
- Do not put keys, passwords, database credentials, R2 keys, Razorpay live keys or webhook URLs in any file in the repo.
- Do not edit the frontend (`akrinity-web/`).
- Do not decide legal or tax items. Mark them `LAWYER/CA`.
- Do not create reviews, orders, customers or products that look real on a live site.
- Do not copy Amazon listings or reviews.
