# Backend task: product attributes (B3) on admin.akrinity.in

**Status: DONE on 2026-11-17** (created and assigned by the frontend session; see decision 28). Remaining for the backend agent: purge or exclude the Store API from the host cache, and remove the old `Material Type` attribute if unused.

For the WordPress backend agent. The storefront now reads these attributes from the WooCommerce Store API and shows exactly what is set. No code change is needed on WordPress.

## Create these global attributes (Products, Attributes)

Use the exact names and term names. Tick "Enable archives" off.

| Attribute name | Terms (exact) | What the site does with it |
|---|---|---|
| **Colour option** | Single colour, Multi-colour, Painted (later) | Buttons "Colour option" on the product page. The first term is the default. |
| **Material** | PLA+, PETG, ABS / ASA, Resin | Material buttons. The first term is the default. |
| **Colour** | black, white, orange, violet, lime | Colour swatches. The first term is the default. |
| **Size** | Small, Medium, Large | Size buttons. Medium is the default when offered. |

Optional: **Process** with terms FDM, Multi-filament FDM, Resin.

## Assign them to the products

Assign to each of the 5 products: Spoon holder, Egg tray (6 eggs), Phone stand, Desk cable organiser, Layered rectangular vase.

Starting values (the owner can change them later):
- Colour option: Single colour
- Material: PLA+, PETG, ABS / ASA, Resin (PLA+ first)
- Colour: black
- Size: Small, Medium, Large

On each product's Attributes tab, select the attribute, add the terms, and tick **Visible on the product page**. Save. Products with a variation-style "Used for variations" setting are not needed: these are display options only.

## Confirm

1. Open `https://admin.akrinity.in/wp-json/wc/store/v1/products?per_page=100`. Every product should list `attributes` with the four names and terms above.
2. Open `https://ak-3-d.vercel.app/product/spoon-holder` and wait a minute. The page should show only the options set in WooCommerce.

Report the result with the standard report format in `docs/BACKEND_AGENT_BRIEF.md`.
