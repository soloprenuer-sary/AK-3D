# Knowledge hub articles (11 published, 25 drafts)

Thirty-six articles. Uploaded on 2026-11-27: articles 1 to 11 are published, 12 to 36 are WordPress drafts. Articles live in WordPress (owner decision 2026-11-27, see `docs/PROJECT_CONTEXT.md`, decision 57). How to upload them: `docs/BACKEND_TASK_BLOG.md`.

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
| 12 | Resin vs filament: which 3D printing process fits your piece? | Materials | `resin-vs-filament-3d-printing` | new |
| 13 | PLA vs PLA+: what the plus really means | Materials | `pla-vs-pla-plus` | new |
| 14 | ASA for outdoor 3D prints: sun, rain, and heat | Materials | `asa-for-outdoor-3d-prints` | new |
| 15 | Storing 3D printing filament in the monsoon | Materials | `filament-storage-in-monsoon` | new |
| 16 | Is 3D printing eco-friendly? The honest answer | Materials | `is-3d-printing-eco-friendly` | new |
| 17 | Layer height explained: smooth or quick? | Design | `layer-height-explained` | new |
| 18 | Infill and walls: what makes a 3D print strong | Design | `infill-and-walls-print-strength` | new |
| 19 | Print orientation: the choice that decides strength | Design | `print-orientation-strength-and-finish` | new |
| 20 | 3D printing supports explained, and how to need fewer | Design | `3d-printing-supports-explained` | new |
| 21 | Snap fits, screws, and joints in printed parts | Design | `snap-fits-screws-and-joints` | new |
| 22 | How to measure a broken part for a 3D printed replacement | Design | `measure-a-broken-part-for-replacement` | new |
| 23 | Designing a name plate that reads well and lasts | Design | `designing-a-name-plate` | new |
| 24 | Beginner 3D design software: where to start | Design | `beginner-3d-design-software` | new |
| 25 | A short history of 3D printing | Guides | `short-history-of-3d-printing` | new |
| 26 | 10 useful things to 3D print for your home | Guides | `useful-things-to-3d-print-for-home` | new |
| 27 | Desk setup ideas: tidy cables and useful organisers | Guides | `desk-setup-ideas-cables-and-organisers` | new |
| 28 | Die-cast car display ideas for a growing collection | Guides | `die-cast-car-display-ideas` | new |
| 29 | How to store and hang sports rackets | Guides | `how-to-store-and-hang-sports-rackets` | new |
| 30 | Personalised 3D printed gift ideas by person | Guides | `personalised-3d-printed-gift-ideas` | new |
| 31 | 3D printing for small businesses: displays, signs, and samples | Guides | `3d-printing-for-small-businesses` | new |
| 32 | 3D printing for student projects: plan it right | Guides | `3d-printing-for-student-projects` | new |
| 33 | From idea to prototype: test before you commit | Guides | `from-idea-to-prototype` | new |
| 34 | Copyright, licences, and 3D printing: the basics | Guides | `copyright-licences-and-3d-printing` | new |
| 35 | Sanding, priming, and painting 3D prints | Guides | `sanding-priming-and-painting-3d-prints` | new |
| 36 | Gluing and repairing 3D prints | Guides | `gluing-and-repairing-3d-prints` | new |

## Picture sources

**Illustrations (106 files in `images/`)**: original artwork drawn for this site by `design/blog-images/build.mjs` (first 11 articles) and `design/blog-images/set2.mjs` (articles 12 to 36), in the brand colours, with the Anton and Inter fonts (SIL Open Font License, already used by the site). No stock, downloaded, or AI-generated pictures.

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
| 12 | `cover-resin-vs-filament` | `resin-process`, `resin-compare` |
| 13 | `cover-pla-plus` | `plus-blend`, `plus-test` |
| 14 | `cover-asa` | `asa-weather`, `asa-checklist` |
| 15 | `cover-monsoon` | `monsoon-signs`, `monsoon-storebox` |
| 16 | `cover-eco` | `eco-waste`, `eco-actions` |
| 17 | `cover-layer-height` | `layers-compare`, `layers-curve` |
| 18 | `cover-infill` | `infill-patterns`, `infill-walls` |
| 19 | `cover-orientation` | `orient-load`, `orient-three` |
| 20 | `cover-supports` | `supports-types`, `supports-avoid` |
| 21 | `cover-joints` | `joints-types`, `joints-snap` |
| 22 | `cover-measure` | `measure-caliper`, `measure-sketch` |
| 23 | `cover-nameplate` | `plate-anatomy`, `plate-fonts` |
| 24 | `cover-software` | `software-types`, `software-path` |
| 25 | `cover-history` | `history-timeline`, `history-spread` |
| 26 | `cover-home-ideas` | `home-rooms`, `home-measure` |
| 27 | `cover-desk` | `desk-zones`, `desk-cables` |
| 28 | `cover-diecast` | `diecast-layouts`, `diecast-care` |
| 29 | `cover-rackets` | `rackets-spots`, `rackets-wall` |
| 30 | `cover-gifts` | `gifts-ideas`, `gifts-timeline` |
| 31 | `cover-business` | `business-uses`, `business-sample` |
| 32 | `cover-students` | `students-parts`, `students-plan` |
| 33 | `cover-prototype` | `proto-stages`, `proto-loop` |
| 34 | `cover-copyright` | `copyright-types`, `copyright-check` |
| 35 | `cover-painting` | `painting-steps`, `painting-grits` |
| 36 | `cover-gluing` | `gluing-adhesives`, `gluing-steps` |

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

## Added with articles 12 to 36 (VERIFY, LAWYER/CA)

- Articles 12 to 36 use only the original illustrations; no photos.
- History dates for early work are approximate, and sources differ.
- Software licence terms (Tinkercad, FreeCAD, Fusion, Blender) change; check before relying on them.
- The copyright article is general information marked "not legal advice" (LAWYER).
- Sanding grits, clearances, layer heights, infill percentages, and drying advice are general starting values.

## Facts used for the technical guidance

- Warping, adhesion, stringing: https://help.prusa3d.com/article/x9mw59v39a-warping
- Moisture in filament: https://help.prusa3d.com/article/drying-filaments_332086
- Softening temperatures: https://all3dp.com/2/pla-petg-glass-transition-temperature-3d-printing/ and https://www.wevolver.com/article/asa-glass-transition-temperature
- Design starting values: https://louisville.edu/amist/amist-print-farm/design-rules-for-fff-3d-printing-cheat-sheet
- Process comparison: https://www.xometry.com/resources/injection-molding/injection-molding-vs-3d-printing/
- File formats: https://www.onshape.com/en/resource-center/tech-tips/stl-vs-3mf-files-additive-manufacturing
- Food contact: https://help.prusa3d.com/article/food-safe-fdm-printing_112313
- Resin handling: https://formlabs.com/blog/resin-safety-resin-terms-faq/
- History: https://www.asme.org/getmedia/3005f6dc-2618-4045-8445-da4242d41a46/infographic-a-timeline-of-3d-printing-technology_download.pdf
- Gluing: https://blog.prusa3d.com/the-great-guide-to-gluing-and-assembling-3d-prints_44908/
- PLA end of life: https://pmc.ncbi.nlm.nih.gov/articles/PMC8069463
- Design software: https://www.autodesk.com/solutions/free-cad-software

All wording is original; nothing is copied from these pages or from Amazon.
