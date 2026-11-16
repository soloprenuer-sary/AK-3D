# Backend issue: storefront sign-up and login not working against admin.akrinity.in

Reported 2026-11-17. For the WordPress backend team. Related: `docs/BACKEND_AGENT_BRIEF.md` task B19.

## Problem

Creating an account or signing in from the storefront fails. Every account created through the storefront must be saved in WordPress at `https://admin.akrinity.in` with the **Customer** role.

## What we checked (read-only, no logins made on the live site)

- `https://admin.akrinity.in/wp-json/` answers and lists these routes: `jwt-auth/v1`, `akrinity/v1`, `wc/v3`, `wc/store/v1`, `llar/v1` (Limit Login Attempts), `wp-mail-smtp`. So the JWT plugin, the account snippet, WooCommerce and the login limiter are installed.
- The site name is still `akrinity-3d`, so it looks like a copy of the local test site.
- The storefront project was still configured for the local site. That is a frontend matter and is being fixed on our side.

## What we could NOT confirm on the live site (please check each)

1. `JWT_AUTH_SECRET_KEY` is defined in `wp-config.php`. Copies of a site usually do not carry `wp-config.php` settings. Without it, login fails.
2. `AKRINITY_FRONTEND_URL` is defined in `wp-config.php` (live storefront address, https, no trailing slash). Without it, verification and reset emails link to the wrong place.
3. A user `akrinity-auth` exists with the **Shop manager** role and a working **Application Password**. Application passwords need https. The password copied from the local site must not be reused. Create a new one.
4. Outgoing email works (WP Mail SMTP test). Sign-up sends a verification email, and sign-in is blocked until it is clicked.
5. The mu-plugin `wp-content/mu-plugins/akrinity-headless-auth.php` is the current version from the repo (`wordpress/mu-plugins/`). Its route permission is `manage_woocommerce`.
6. WordPress is not blocking REST calls from the storefront host (security plugin, firewall or host rules), and the Authorization header reaches PHP.
7. Nothing else rewrites or blocks `wp-json/jwt-auth/v1/token` or `wp-json/wc/v3/customers`.

## What the frontend does (so you can match it)

- `POST /wp-json/wc/v3/customers` as `akrinity-auth` (Basic auth with the application password). Body includes `email`, `password`, `first_name`, `last_name`, `role: "customer"`, billing phone.
- The snippet flags the new user unverified and emails a link `AKRINITY_FRONTEND_URL/verify-email?key=…&login=…`.
- `POST /wp-json/jwt-auth/v1/token` with `username` (email) and `password` for sign-in.
- `POST /wp-json/akrinity/v1/{password/forgot, password/reset, email/verify, email/resend}` as `akrinity-auth`.

## How to verify the fix

1. In the storefront deployment, set `AUTH_STATUS=1` and open `/api/auth/status`. Every line must be OK (KV and Turnstile are optional for a first test). It never shows secrets.
2. Create one account from the storefront with a real mailbox. Confirm in WordPress: Users shows it with role **Customer**; the verification email arrives; sign-in works after verifying.
3. Delete the test user. Remove `AUTH_STATUS`.

## Rules

- Never put keys, passwords, application passwords or the JWT secret in the repo or in chat. Store them in `wp-config.php` and the Cloudflare Pages environment.
- Do not reuse the local test secrets on the live site.
- Ask the owner before changing the live site. Report what you changed, using the report format in the brief.
