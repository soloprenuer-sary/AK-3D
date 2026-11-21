# Security and page speed check (2026-11-21)

Scope: the storefront (ak-3-d.vercel.app) and the WordPress backend (admin.akrinity.in). Only read-only requests were made against WordPress (GET and empty POSTs to public routes). No logins were guessed, nothing was changed on the server, and no files were uploaded.

## 1. Page speed (Lighthouse, throttled phone, before the fixes, on the live site)

| Page | Perf | Accessibility | Best practices | SEO | LCP | TBT |
|---|---|---|---|---|---|---|
| Home | 86 | 99 | 96 | 100 | 2.1 s | 450 ms |
| Shop | 96 | 98 | 96 | 100 | 1.8 s | 210 ms |
| Category (Home decor) | 92 | 98 | 96 | 100 | 3.0 s | 190 ms |
| Product (F1 stand) | 87 | 95 | 96 | 100 | 2.8 s | 360 ms |
| Contact | 97 | 100 | 96 | 100 | 1.8 s | 190 ms |
| Quote | 91 | 100 | 96 | 100 | 1.8 s | 350 ms |
| Cart | 93 | 98 | 96 | 100 | 2.0 s | 300 ms |

Desktop: 99 to 100 on every page.

What held the score back, and what was done:

- **Full-size pictures** (the product page downloaded 2.4 MB, with about 1.6 MB wasted). Pictures now go through Vercel's image service: resized to the box they fill, served as WebP, cached for a year (`next.config.mjs`, `components/ui/Pic.tsx`). If the resized copy fails, the original is used. On a local production build the product page went from 2,433 KB to 1,103 KB.
- **Slow first picture.** The first four sub-category tiles and the product and category hero pictures now load at once with high priority instead of lazily.
- **Missing favicon** (a 404 on every page): added `src/app/icon.svg` and `favicon.ico`.
- **Accessibility:** removed two invalid ARIA uses (a button with `role="listitem"` in "From file to front door", and `aria-pressed` on a radio button). Local result: accessibility 98 to 100, best practices 100.
- **Not changed:** script time (about 180 KB compressed JavaScript on the home page, mostly React and Next). Further gains would need splitting the big client components; the score is already in the 80s to 90s on a slow phone.

Re-run after the deploy (the PageSpeed Insights API was over its free daily quota when tried): https://pagespeed.web.dev/ with `https://ak-3-d.vercel.app/`.

## 2. WordPress findings (admin.akrinity.in)

| # | Finding | Risk | Fix |
|---|---|---|---|
| 1 | **Admin username is public**: `/wp-json/wp/v2/users/1`, the `/?author=1` redirect, `/wp-sitemap-users-1.xml` and WPGraphQL `{users{nodes{slug}}}` all give `sujit`. The users record also exposes a gravatar hash of the admin email. | High (half of a login guess) | `akrinity-hardening.php` blocks the REST users route, author redirect and users sitemap. **WPGraphQL is not used by the storefront: deactivate it** (it still lists users). Also give the admin a login name that is not the public author name. |
| 2 | **Login says whether a username exists** ("The username admin is not registered") on wp-login.php, and the JWT route says "Unknown username". | Medium | Same message for every failure (hardening file). |
| 3 | **CORS repeats any Origin back with credentials allowed** (`Origin: https://evil.example` was echoed). Cookie calls still need a nonce, so this is hardening, not an open door. | Medium | Allow only the storefront origins (hardening file; set `AKRINITY_ALLOWED_ORIGINS` when the live domain is final). |
| 4 | **`/wp-json/` is 1.4 MB** and lists every plugin (jwt-auth, wp-graphql, jetpack, ai1wm, elementor, wpforms, shiprocket and others), which helps an attacker pick known bugs. | Medium | Hidden from visitors (hardening file). |
| 5 | **Login page open to everyone**, and the JWT token route is a second login door. Limit Login Attempts Reloaded is installed (good). | Medium | Keep it on, add two-step login (2FA) for every admin, and ask the host to allow wp-login.php only from your own IP if you have a fixed one. |
| 6 | `readme.html` and `license.txt` are public. The WordPress version is in the page head (`generator` meta). | Low | Delete both files in hPanel File Manager; the head tag is removed by the hardening file. |
| 7 | No security headers on the WordPress domain. | Low | Added in the hardening file. |
| 8 | Many plugins that a headless store does not need: WPGraphQL, Jetpack (not connected), Header Footer Elementor, Elementor, Astra and Hello themes, All-in-One WP Migration, WPForms (if unused), the WooCommerce POS catalogue. Each is extra code that can have a bug. | Medium | Deactivate and delete what the storefront does not use. Keep: WooCommerce, JWT Auth, Cashfree, Limit Login Attempts, WP Mail SMTP, ACF, Shiprocket, and the Akrinity snippets. |
| 9 | Plugin versions looked current (WooCommerce 11.2.2, Elementor 4.4.0, WPGraphQL 2.28.0, ai1wm 7.113, JWT 1.5.0, LLAR 3.4.3, WP Mail SMTP 4.10.4; WordPress 7.1.4). | Info | Turn on automatic plugin updates and re-check monthly. |

Checked and fine: `wp-config.php`, `.env`, `.git`, `debug.log`, `uploads/`, `mu-plugins/`, `akr-private/` (customer 3D files) and `ai1wm-backups/` all return 403 or 404; XML-RPC returns 405; `wc/v3` (orders, customers, products, system status) needs a key and returns 401 or 403; REST settings and plugins need login; GraphQL introspection is off; the Akrinity service routes return 401 without the shared key; the Store API checkout needs a nonce; the JWT route gives no token without valid credentials; `install.php` says "Already installed".

## 3. Storefront findings (code review)

- Sign-in, sign-up, password reset, quote and business forms already have per-IP and per-email limits, an Origin check (cross-site posts get 403), a size cap, generic login errors, and the session in an HttpOnly, Secure, SameSite=Strict cookie. Nothing sensitive is returned to the browser.
- **Added:** security headers on every page: a Content-Security-Policy that allows only WordPress, the Amazon picture host, Cloudflare Turnstile and the Google map; X-Frame-Options DENY; nosniff; Referrer-Policy; Permissions-Policy; HSTS. Checked on 17 pages at desktop and phone size: no policy violations and no failed requests.
- **VERIFY in Vercel settings** (cannot be read from here): `AKRINITY_SHARED_SECRET` is 40+ random characters and equals the one in wp-config.php; `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and its secret are set (without Turnstile the forms rely on rate limits only); Upstash Redis (`AUTH_KV`) is set (without it the limits live in memory per server and reset often).
- **Amazon-hosted pictures:** some product pages show pictures loaded directly from `m.media-amazon.com`. Amazon can block or change those links at any time, and the project rule is not to copy Amazon content. Download your own product photos and upload them to the WordPress media library instead (BUSINESS decision).

## 4. What to do on the server (for the backend team)

1. Upload `wordpress/mu-plugins/akrinity-hardening.php` next to the other snippet (set the live domain in `AKRINITY_ALLOWED_ORIGINS` first). After uploading, check that the storefront still signs in, shows products and accepts a quote with a file.
2. Deactivate and delete WPGraphQL, Jetpack, Header Footer Elementor, and any other plugin the store does not use.
3. Delete `readme.html` and `license.txt` from the WordPress root.
4. Add 2FA for every admin; give the admin a login name that is not the public author name; use long unique passwords; swap `claude-agent` out before launch (see the go-live reminder).
5. Check that the shared secret in `wp-config.php` is 40+ characters.
6. Ask the host (Hostinger) to turn on the firewall and malware scanner, and keep backups off the web folder (not in `wp-content/ai1wm-backups`).
