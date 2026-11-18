# Backend task: custom quote requests saved in WordPress

For the WordPress / WooCommerce backend team.

## What the storefront does

The **Request a quote** page (`/quote`) now sends its details to WordPress. Each request is saved as an entry under **Quote requests** in the WordPress admin menu (the same place the bulk quote requests from `/business` go), and an email goes to the admin email address. If the customer gave an email, they get a copy.

What is saved: type, reference (`QR-<number>`), received date, name, phone, email, job (Print my file or Design and print), material, quantity, company and GSTIN (if a business), notes, and the file name and size.

**The file itself is not uploaded.** Private file storage is not connected, so only the file name and size are saved. The admin entry and both emails tell the studio to ask the customer to send the file on WhatsApp or by email, quoting the reference.

## What needs deploying

Snippet version **2.3.0**: replace `wp-content/mu-plugins/akrinity-headless-auth.php` with `wordpress/mu-plugins/akrinity-headless-auth.php` from the repo. It adds:

- the route `POST /wp-json/akrinity/v1/quote-request` (protected by the same shared key as the other routes),
- the Quote requests list columns (Reference, Request, Type, Phone, Email, Received),
- a **Request details** box that shows every field of a request, for both bulk and custom requests.

No new settings are needed. The shared key (`AKRINITY_SHARED_SECRET`) must already be set in `wp-config.php` and in Vercel, as for sign-in.

## How to check

1. In WordPress admin, Plugins > Must-Use shows the Akrinity snippet at version 2.3.0.
2. Send a test request from `https://akrinity.in/quote`. The page should show "We received your request (QR-…)".
3. In WordPress admin, open **Quote requests**. The new entry is listed, and opening it shows the details. The admin email gets a message.

Anyone who can edit posts in WordPress (administrators and editors) can see Quote requests. The snippet code has been tested for syntax and against a stand-in, not inside real WordPress yet (VERIFY).
