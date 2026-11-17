# Backend task: cross-sells and upsells on the product page

For the WordPress / WooCommerce backend team.

## What the storefront does

Under every product page there are two rows:

- **Goes well together** (cross-sell): the products set under **Cross-sells** in the product's **Linked products** box.
- **You may also like** (suggested): the products set under **Upsells** in the same box.

A row shows as many products as are set, even one, and is hidden if none are. Until a product has any linked products, the site fills the rows by itself (cross-sell: products from other categories; suggested: more from the same category), so nothing needs to be set for the rows to appear. Setting linked products in WordPress replaces the automatic choice for that product, within about a minute.

## What needs deploying

The WooCommerce Store API does not publish the linked product ids, so the existing snippet was extended (version 2.2.0). It adds `cross_sell_ids` and `upsell_ids` to each product under `extensions.akrinity`, next to `bulk_tiers`.

1. Replace `wp-content/mu-plugins/akrinity-headless-auth.php` with the file in the repo at `wordpress/mu-plugins/akrinity-headless-auth.php` (2.2.0). No other change is needed.
2. Check: `https://admin.akrinity.in/wp-json/wc/store/v1/products?per_page=1` shows `"extensions":{"akrinity":{"bulk_tiers":[...],"cross_sell_ids":[...],"upsell_ids":[...]}}`.
3. Edit a product, add products under Linked products, save, and open the product on the storefront.

The snippet code has been tested against a stand-in, not inside real WordPress yet. Expect small fixes on first deploy (VERIFY).
