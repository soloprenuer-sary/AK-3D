# Knowledge hub articles (not uploaded yet)

Eleven articles, ready to upload. Nothing here is live yet. Articles live in WordPress (owner decision 2026-11-27, see `docs/PROJECT_CONTEXT.md`, decision 57). How to upload them: `docs/BACKEND_TASK_BLOG.md`.

## Files

- `posts.json`: slug, title, summary, category, cover picture and its alt text.
- `<slug>.html`: the article text, written in the plain HTML the WordPress editor accepts (headings, lists, tables, quote boxes, figures).
- `import-articles.php`: uploads the pictures and creates or updates the posts (WP-CLI).
- `images/`: the pictures to upload (PNG, 1600 x 900). Editable sources and the drawing script are in `design/blog-images/`.
- `preview.mjs`: shows these drafts on the real site without publishing: `node content/blog/preview.mjs`, then open http://localhost:3200/guides.

The five slugs that were already published are kept, so their addresses do not change.

## Articles

| # | Title | Category | Slug | Was |
|---|---|---|---|---|
| 1 | 3D printing vs normal printing: what is the difference? | Guides | `3d-printing-vs-normal-printing` | new |
| 2 | 3D printing, CNC machining, or moulding: which fits your part? | Guides | `3d-printing-vs-injection-moulding-and-cnc` | new |
| 3 | 7 common 3D printing problems and how to avoid them | Guides | `common-3d-printing-problems-and-fixes` | new |
| 4 | PLA, PETG, or ABS/ASA: which filament for your part? | Materials | `pla-petg-or-abs-asa-which-filament-for-your-part` | sample, rewritten |
| 5 | Designing for print: wall thickness, overhangs, and fit | Design | `designing-for-print-wall-thickness-and-overhangs` | sample, rewritten |
| 6 | How to prepare a 3D file for printing: STL, 3MF, and STEP | Design | `how-to-prepare-a-3d-file-for-printing` | new |
| 7 | How to order a custom 3D print, from idea to delivery | Guides | `how-to-order-a-custom-3d-print` | new |
| 8 | Single colour or multi-colour: what actually changes | Guides | `single-colour-or-multi-colour-what-actually-changes` | sample, rewritten |
| 9 | What we do differently: how we check every print | Guides | `how-we-check-every-print-before-it-ships` | sample, rewritten |
| 10 | Caring for 3D prints, and what non-food-contact means | Guides | `non-food-contact-kitchen-pieces-what-that-means` | sample, rewritten |
| 11 | What we make: a tour of Akrinity's 3D printed products | Guides | `what-we-make-akrinity-3d-printed-products` | new |

## Picture sources

**Illustrations (31 files in `images/`)**: original artwork drawn for this site by `design/blog-images/build.mjs` in the brand colours, with the Anton and Inter fonts (SIL Open Font License, already used by the site). No stock, downloaded, or AI-generated pictures.

| Article | Cover | Pictures inside |
|---|---|---|
| 1 | `cover-vs-printing` | `vs-flat-and-layers`, `vs-model-slice-print` |
| 2 | `cover-methods` | `make-add-remove-mould`, `make-cost-curve` |
| 3 | `cover-problems` | `problems-six-faults`, `problems-first-layer` |
| 4 | `cover-materials` | `materials-heat`, `materials-where` |
| 5 | `cover-design` | `design-walls-clearance`, `design-overhang-angles` |
| 6 | `cover-files` | `files-resolution`, `files-watertight` |
| 7 | `cover-order` | `order-checklist`, `order-steps` |
| 8 | `cover-colour` | `colour-purge`, `colour-three-routes` |
| 9 | `cover-quality` | `quality-checks`, one product photo |
| 10 | `cover-care` | `care-dos`, `care-layer-grooves` |
| 11 | `cover-products` | `products-range`, four product photos |

**Product photos (5)**: the studio's own product pictures, already in the live WordPress media library (`https://admin.akrinity.in/wp-content/uploads/2026/11/`). The articles link to them; no copy is stored in this repo. VERIFY that the studio owns each one, since some look edited or generated.

| Article | File | Product it belongs to |
|---|---|---|
| 9 | `cc143cd656eff774.webp` | Listed as "Layered rectangular vase" (the other pictures on that product show a lamp) |
| 11 | `61SHKLa9DcL._SL1500_.jpg` | 10-car hexagon wall rack |
| 11 | `61Gvt66ffL._SL1500_.jpg` | 16 badminton racket wall mount (a racket maker's name is visible on a racket) |
| 11 | `51LzoMYfmwL._SL1500_.jpg` | Dual controller and headphone stand |
| 11 | `81TKyZiPAgL._SL1500_.jpg` | 2-tier jewellery organiser stand |

## Facts to confirm before publishing (VERIFY)

The technical figures (softening temperatures, wall thickness, overhang angle, clearances) are general guidance from public sources and vendor guides, worded as approximate. These statements about the business come from site pages or project decisions that are drafts or not yet live:

1. Quality check: layer bonding, dimensions, surface finish, packing; a failed print is reprinted (`/how-we-print` is marked as a draft).
2. Online payment by UPI, card, or net banking after approving a quote (Cashfree is still in test mode).
3. Larger jobs may start with an advance (not built in the quote flow).
4. A sample can be printed before a batch (`/business`).
5. Painting: "where we offer it", made to order and quoted separately (still a DECIDE item).
6. Upload limit of 300 MB per file, and files kept in private storage.
7. Product facts taken from product names: 1:64 scale, sixteen rackets, two controllers.

LAWYER/CA: the pixel sword is listed as a toy (BIS Toys Order), and "Hot Wheels" in the category name is another company's trademark (the articles say "die-cast cars").

## Facts used for the technical guidance

- Warping, adhesion, stringing: https://help.prusa3d.com/article/x9mw59v39a-warping
- Moisture in filament: https://help.prusa3d.com/article/drying-filaments_332086
- Softening temperatures: https://all3dp.com/2/pla-petg-glass-transition-temperature-3d-printing/ and https://www.wevolver.com/article/asa-glass-transition-temperature
- Design starting values: https://louisville.edu/amist/amist-print-farm/design-rules-for-fff-3d-printing-cheat-sheet
- Process comparison: https://www.xometry.com/resources/injection-molding/injection-molding-vs-3d-printing/
- File formats: https://www.onshape.com/en/resource-center/tech-tips/stl-vs-3mf-files-additive-manufacturing
- Food contact: https://help.prusa3d.com/article/food-safe-fdm-printing_112313
- Resin handling: https://formlabs.com/blog/resin-safety-resin-terms-faq/

All wording is original; nothing is copied from these pages or from Amazon.
