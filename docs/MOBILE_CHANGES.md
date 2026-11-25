# Phone view changes (owner list, 25 Nov 2026)

Code was pulled from GitHub first (9 new commits, up to `fe66d91`). Status below is after that pull.

## Done in the code, not pushed yet

| # | Change | Where | Checked |
|---|---|---|---|
| 1 | Shop and category lists: 2 products per row on phones (the newer commit had made it 1 per row) | `globals.css` | Local build, 375px |
| 2 | Phone product card: compact layout, name on 2 lines, price below, "Add to cart" button (a product with options shows "Choose options") | `ProductCard.tsx`, `globals.css` | Add to cart tried |
| 3 | Best sellers and Knowledge hub: view-all button beside the heading, arrows under the cards (desktop unchanged) | `Carousel.tsx` | 375px and 1280px |
| 4 | Product page opens at the top with the breadcrumb visible, phone and desktop | `layout.tsx`, `globals.css` | Opened from a scrolled list |
| 5 | Product page: photo previews under the main photo | `PhotoCarousel.tsx` | Yes |
| 6 | Product page: "3D view" tab back (it had been removed in a newer commit); a sample preview with a note when a product has no 3D file | `ProductDetail.tsx` | Yes |
| 7 | Colour options shown as named buttons, above the description | `ProductDetail.tsx` | Variable product |
| 8 | Phone menu no longer sits under the Add to cart bar, and it scrolls | `globals.css` | Yes |
| 9 | New phone menu (owner picked the colour block design, links as buttons): quick links on top, six category colour blocks below (tap opens the category), "Get a quote" fixed at the bottom; the sub-category lists are gone from the phone menu | `MegaMenu.tsx`, `globals.css` | 375px, from home and a scrolled product page |

Browser tests (after the menu change): 72 passed, 6 skipped, 0 failed. Type check and lint are clean.

## Waiting for the owner

- **Push:** nothing above is on GitHub or the live site yet.

## Not possible from code alone (store content)

- 21 of 22 products are **simple** products, so they have no colour or size to choose. Only "Jewellery Organiser" (#354) is **variable** (Colour: black, white). To offer choices, the product must be set up as variable in WooCommerce.
- #354 has one photo and both colours use it. Upload a photo per colour; showing that photo on selection is not built yet.
- Only product #281 has a real 3D file. Upload a `.glb` or `.stl` for the others.

## To confirm

- "When I click on the product detail page" (first message) was cut off. Items 4 to 7 cover the second message.
- "Shop by category" screenshot: no change was written. Should "View all" move beside that heading, and should the tiles get pictures?
