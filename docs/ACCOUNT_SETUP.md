# Account setup: sign-in, sign-up, account area (decision 32)

How customers sign in and sign up on the storefront, and exactly what must be set on WordPress and Vercel. No named WordPress user or application password is used: the storefront and WordPress share one private key.

## How it works

1. **Sign in** asks for the email first.
   - Email has an account: ask for the password, sign in, go to the account area.
   - Email only ordered as a guest before: go to Create account with the email filled in, and a message that explains why. WooCommerce links the earlier guest orders to the new account (same billing email).
   - Email is new: go to Create account with the email filled in.
2. **Create account** takes full name, email, phone (optional), password, re-enter password, and the terms tick box. The customer is saved in WordPress under Users with the role **Customer**, then signed in.
3. **Account area** (`/account`): orders (list and detail), my details, saved billing and delivery addresses, change password. Payment is cash on delivery for now; card details are never stored on the site.
4. **Checkout** (next phase): guests may order. An order confirmation email lets them find the order. If they later sign in with that email they are asked to create a password, and their orders appear.

## What must be set

### WordPress (`wp-config.php` on admin.akrinity.in)
Add above the line "That's all, stop editing":

```php
define( 'AKRINITY_FRONTEND_URL', 'https://ak-3-d.vercel.app' );   // already set, keep
define( 'AKRINITY_SHARED_SECRET', '<the 64-character key>' );
```

The key is in `C:\Users\shiro\akrinity-secrets\AKRINITY_SHARED_SECRET.txt` on the owner's computer. It must be at least 32 characters, and must **not** be pasted in chat, the repo or docs.

### WordPress file
Replace `wp-content/mu-plugins/akrinity-headless-auth.php` with the latest version from the repo (`wordpress/mu-plugins/akrinity-headless-auth.php`, version 2.0.0). It needs no activation. Also keep the **JWT Authentication for WP REST API** plugin active with `JWT_AUTH_SECRET_KEY` set.

### Vercel (Settings, Environment Variables, Production and Preview)

| Name | Value |
|---|---|
| `AKRINITY_SHARED_SECRET` | the same key as in `wp-config.php` (mark Sensitive) |
| `WP_URL` | `https://admin.akrinity.in` |
| `NEXT_PUBLIC_WC_STORE_API_URL`, `NEXT_PUBLIC_WP_GRAPHQL_URL`, `NEXT_PUBLIC_SITE_URL` | as already set |
| `AUTH_STATUS` | `1` while checking, then remove |

`WC_APP_USER` and `WC_APP_PASSWORD` are no longer used. Delete them from Vercel. Redeploy after changes.

## Check it

1. Open `https://ak-3-d.vercel.app/api/auth/status` (needs `AUTH_STATUS=1`). These lines must be OK: WordPress answers, JWT plugin, JWT secret, account snippet, shared key set, **shared key matches WordPress**, WooCommerce. Upstash and Turnstile are optional while building.
2. Create an account from `/login`. In WordPress, Users shows it with role **Customer**.
3. Sign out, then sign in again from the email step. Open Orders, My details and Addresses.
4. Delete test users when done. Remove `AUTH_STATUS`.

## Notes

- A typed email that has no account is told so. That helps customers but also shows which emails have accounts, so sign-in checks are rate limited (30 per 15 minutes per visitor address).
- A customer who exists in WordPress but never chose a password (for example an account made by guest checkout) uses "Forgot your password?" to set one.
- Limits per visitor address: sign-in 20 per 15 minutes, 5 failures per email per 15 minutes; sign-up 5 per hour; password reset 10 per hour. Add Upstash Redis so the counters are shared across instances.
