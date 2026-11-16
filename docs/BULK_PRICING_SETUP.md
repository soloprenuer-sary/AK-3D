# Bulk pricing and bulk quote requests (decision 34)

How bulk prices get from WordPress to the product page, and how a bulk quote request is saved and emailed.

## 1. The bulk price fields (already created in ACF)

The field group "Bulk Order price" on products holds a group field **bulk-quote** with three pairs:

| Label | Meaning |
|---|---|
| MOQ-1 and price-moq-1 | minimum order quantity for the first price, and the price per piece from that quantity |
| MOQ-2 and price-moq-2 | the second pair |
| MOQ-3 and price-moq-3 | the third pair |

The website needs no exact names: it reads any field whose name contains "moq" and ends in a number (moq_1, price_moq_1 and so on), inside the group or on its own. A pair is used only when **both** the quantity and the price are filled in. Ranges run from one MOQ up to the next MOQ minus one, and the last one is "and up".

To add more ranges, add MOQ-4 / price-moq-4 (up to 5 or more) in the same group.

## 2. Fill them in on each product

Example for one product:

| MOQ | Price per piece | Shows on the product page as |
|---|---|---|
| MOQ-1 = 10 | price-moq-1 = 449 | 10 to 49: ₹449 |
| MOQ-2 = 50 | price-moq-2 = 399 | 50 to 99: ₹399 |
| MOQ-3 = 100 | price-moq-3 = 349 | 100 and up: ₹349 |

Save. The product page shows the price cards within about a minute. A product with nothing filled in shows no cards, only the "Request a bulk quote" link. Bulk prices are **shown only**: the cart does not change price, and the customer sends a quote request.

## 3. What happens on a quote request

1. On a product page, "Request a bulk quote" opens `/business?product=<product>`. The form shows the product at the top as a link with a small red X, so the customer can remove it.
2. The customer fills company, contact name, phone, **email (required)**, what they need, quantity and notes.
3. WordPress saves it under **Quote requests** in the admin menu (reference `BQ-<number>`), and sends two emails:
   - to the WordPress admin email (**Settings, General, Administration Email Address**), with all details and a link to the product;
   - to the customer, with a copy of what they sent.
4. Emails go out after the reply, so the form answers fast. They need working outgoing email (WP Mail SMTP).

## 4. What must be deployed

- Replace `wp-content/mu-plugins/akrinity-headless-auth.php` with version **2.1.0** from the repo (same file as the account setup in `docs/ACCOUNT_SETUP.md`, including `AKRINITY_SHARED_SECRET` in `wp-config.php` and Vercel).
- Check: open `https://<site>/wp-json/wc/store/v1/products`. A product with filled fields shows `extensions.akrinity.bulk_tiers`.
- Check: send one test request from `/business`. A **Quote requests** menu appears in WordPress, and both emails arrive. Delete the test request.

## Notes

- The Store API is cached by the host, so a changed price can take a few minutes to appear. Purge the cache if it is slow.
- Limits: 5 requests per hour per visitor address.
