# Akrinity: category structure, category pages, knowledge hub and page list

Version 1.0, 2026-11-13. Planning only. Nothing here is built yet. Build order is decided after review.
Tags: **[DECIDE]** your choice needed, **[LAWYER/CA]** legal review, **[VERIFY]** check before relying on it.

---

## 1. How a product is described (the attributes behind every category)

Each product carries category placement plus attributes. Attributes drive the filters on every category page, so one product can appear in several filtered views without duplicating the product.

| Attribute | Values | Shown to customer as | Notes |
|---|---|---|---|
| Category and subcategory | see section 2 | Breadcrumb and category tiles | One primary category, optional tags |
| Filament | PLA / PLA+, PETG, ABS / ASA, Resin | "Material" | Resin is a different process (section 4) |
| Colour mode | **Single colour**, **Multi-colour**, **Custom colour** | "Colour" | Multi-colour needs a multi-filament machine; price and lead time differ |
| Print process | FDM standard, FDM multi-filament, Resin (SLA/MSLA) | "How it is printed" | Set by which machine the product is printed on |
| Machine family | Assigned internally (for example standard FDM, multi-filament FDM, resin) | Not shown as model names | Keep model names internal; customers choose process, not machine |
| Size class | S, M, L, XL, or custom scale | "Size" | Size drives price and print time |
| Finish | Standard, smooth, painted [DECIDE: is painting offered] | "Finish" | Painted items are made to order |
| Fulfilment | In stock, Made to order | Tag on card and product page | COD is never offered for made-to-order or personalized items |
| Lead time | Days, set per product | "Ready in [X] working days" | |
| Use | Decor, functional, gift, collectible, hobby | Shop by use (home page, category filter) | |
| Personalization | None, name or short text (40 characters) | Personalization field | Uses the approved snippet path if plugins fail |
| Licence status | Original design, or licensed character (with proof) | Internal only | Licensed characters are not sold without written permission **[LAWYER/CA]** |

**Colour choice on the product page:** Single colour (pick one filament colour), Multi-colour (pick a colour scheme from the machine's options, shown with swatches), Custom colour (customer describes a colour, quoted manually). Multi-colour products list their extra cost and lead time before add to cart.

---

## 2. Category hierarchy

Level 1 = main category (a tile on the home page and in the menu). Level 2 = subcategory (filter chips at the top of the category page). Products can carry tags from another category (for example a lamp can be tagged "Gifts").

### 2.1 Home decor
- Vases and planters
- Lamps and lighting (lamp shades, tealight holders, light covers)
- Wall art and wall hooks
- Trays, bowls and storage
- Clocks and frames

### 2.2 Desk and gadgets
- Desk organisers (pen, card, cable)
- Phone and tablet stands
- Monitor and laptop stands
- Desk toys and fidgets
- Cable management

### 2.3 Kitchen organisers
- Spice racks and jar holders
- Cutlery and utensil holders
- Drawer organisers and dividers
- Bottle and cup holders
- Note: **only non-food-contact** designs unless the material and print process are approved for food contact [LAWYER/CA] [VERIFY]. Plan to label every kitchen product "not for food contact" until then.

### 2.4 Figurines and miniatures
- Human figurines (portrait, character, bust, custom likeness)
- Tabletop miniatures (wargames, RPG)
- Scale models and replicas
- Animals and creatures
- Note: figurines may fall under the BIS toy rules for children under 14 **[LAWYER/CA]**. Figurines are labelled "collectible, not a toy, 14+" until cleared.

### 2.5 Anime figures
- By series (each series is a subcategory once there are enough products)
- Characters and busts
- Display stands and bases
- Note: licensed characters need written permission. Original anime-inspired designs go under "Original characters" (section 2.7).

### 2.6 Marvel and pop culture
- Marvel
- Other franchises (only with licence)
- Note: same licence rule as anime. Do not list copyrighted characters without written permission **[LAWYER/CA]**.

### 2.7 Original designs and experiments ("freaky" and artistic)
- Original characters (anime-inspired, our own designs)
- Geometric and organic art
- Parametric and generative designs
- Print-in-place and mechanical (moving parts, puzzles)
- Abstract sculptures

### 2.8 Gifts and personalised
- Name plates and signs
- Keychains and tags
- Custom gift sets
- Engraved-look (texture) items

### 2.9 Hobby and cosplay
- Dice towers and board game accessories
- Cosplay badges and props (non-weapon) **[LAWYER/CA]** (weapon-like items are not sold)
- Miniature bases and terrain

### 2.10 Spare parts and replacements
- Knobs and handles
- Brackets and clips
- Feet, spacers and gaskets

### 2.11 Collections (not a product category, a curated view)
- New drops
- Best for gifts
- Under ₹[AMOUNT]
- Multi-colour showcase
- Made to order specials
- Seasonal campaigns (festival, exam season, Valentine)

---

## 3. Category page design (how the customer browses)

### 3.1 Layout on desktop

```
Breadcrumb: Home / Shop / Desk and gadgets
Title block: "Desk and gadgets" + one-line description + product count
Subcategory chips: All · Desk organisers · Phone stands · Monitor stands · Desk toys · Cable management
-----------------------------------------------------------------------
[Sidebar, sticky]                  [Toolbar: results · sort · active chips]
 Material                           [Product grid, 3 to 4 columns]
 Colour mode                        
 Print process                      
 Size                               
 Availability                       
 Price range                        
 Use                                
 Clear all                          
-----------------------------------------------------------------------
Load more (or pagination)
Category story block (short text + link to a guide)
Related guides (from the knowledge hub)
```

### 3.2 Product card (category grid)
- Main photo (transparent or white background, approved product photo set)
- Status tag: In stock or Made to order
- Small row of chips: material, colour mode ("Multi-colour" as a chip), process
- Name and price (₹[price]), "from" price when there are options
- Hover: lift, colour dots, quick view, quick add (same as shop now)
- Touch: actions always visible

### 3.3 Interactions
- Filters update the URL (shareable, back button works)
- Sort: Featured, New, Price low to high, Price high to low, Lead time short
- Empty state: "No products match" with the active filters listed and a Clear button
- Subcategory chips switch view without leaving the page
- "Customise" link on products that offer colour or size options

### 3.4 Mobile
- Filters open in a bottom sheet with an Apply button and a count
- Subcategories become a horizontal scroll row
- Grid is 2 columns

### 3.5 SEO and content
- Each category page has a unique title, description, and a short paragraph that explains the category (written for people, not for keywords)
- Structured data: breadcrumbs and product lists
- Canonical URLs for filtered views (filtered views point to the category page)

---

## 4. Knowledge hub (blog, guides and research)

### 4.1 Purpose
- Explain materials and processes so customers choose well
- Show research and testing (honest results, including failures)
- Support SEO for "3D printing service Mumbai", material questions and design help
- Give the studio a voice and a place to publish drops and news

### 4.2 Content types
| Type | Example | Why |
|---|---|---|
| Material guides | PLA vs PETG; ABS/ASA for outdoor use; resin for detail | Customers compare before buying |
| How-to guides | Choosing a multi-colour print; cleaning a resin print; care for PLA parts | Reduces support and returns |
| Design tips | Wall thickness, overhangs, designing for print in place | Helps customers with design-and-print |
| Research notes | Test results: strength, heat resistance, UV fade, dimensional accuracy | Unique content; builds trust |
| Case studies | A custom figurine from sketch to print; a lamp build | Shows the process |
| News and drops | New collections, machine upgrades, campaign news | Keeps people returning |
| Safety and compliance | Food-contact warnings, child safety for figurines | Legal and trust |

### 4.3 Hub structure
- **Knowledge hub** (`/guides`): featured article, filter by type and material, search, latest list
- **Categories** inside the hub: Materials, Guides, Design, Research, Case studies, News
- **Article page** (`/guides/[slug]`): hero, title, meta line (date, reading time, type, author), table of contents, body, callouts (Tip, Note, Warning), specs table, related products, related articles, author card, share, CTA to shop
- **Series**: for multi-part topics (for example "Material series: 6 parts")

### 4.4 Reading experience (design rules)
- Reading width about 65 characters, body Inter 18 / 1.7
- Headings in Anton, uppercase, used sparingly (h2 only; h3 in Inter 600)
- Callouts use the existing palette: lime for Tip, violet for Note, error red border for Warning
- Tables use the stripe colour on header rows and ink borders
- Progress bar at top while scrolling (thin lime line)
- Table of contents sticks on desktop, collapses on mobile
- GSAP: gentle reveal of section headings, parallax on one hero image; no motion in the body text

### 4.5 WordPress workflow (so posts appear automatically)
1. Satyam writes a post in WordPress (block editor) and fills ACF fields: summary, type, material tags, reading time, featured image, related products, author.
2. WPGraphQL exposes posts and the ACF fields.
3. Publishing a post triggers the frontend rebuild webhook (same as products).
4. The frontend creates the article page, updates the hub list, sitemap and related blocks.
5. Drafts never appear on the site. Preview links for drafts use a signed token.

Posts need these fields to render well: title, slug, summary (150 characters), type, material tags, featured image (1600 x 900 WebP), body blocks (headings, paragraphs, images with alt text, tables, callouts, code-free), related products (up to 4), related posts, author, last updated date.

### 4.6 Research pages
- Each research note states method, sample size, conditions and limitations
- Raw data downloadable as CSV where safe to publish
- Failed tests are published too, with what was learned

---

## 5. Home page additions (for the knowledge hub and the category model)

Proposed sections added to the existing 13:
1. **Shop by use** (decor, desk, gifts, collectibles, hobby): tiles, below Shop by category
2. **Find your filament**: three cards (PLA, PETG, Resin) with "when to pick it" and a link to the guide
3. **Colour your way**: single, multi-colour and custom colour, with swatches (ties to the colour-mode feature)
4. **From the knowledge hub**: three latest posts, with type, date and reading time
5. **How we print** (process and machines): short, with the four machine types as cards (no model names)
6. **Collections strip**: New drops, Best for gifts, Under ₹[AMOUNT]
7. **Reviews**: placeholder for real customer reviews (needs a review system; do not invent reviews)
8. **Trust strip**: GST invoices, tracked shipping, returns policy, UPI and COD (where allowed)
9. **Newsletter**: already in the footer; a short block near the end once there is a mail provider

---

## 6. Full page list

Priority: **P1** = needed for launch, **P2** = after launch, **P3** = later. Phase 1 blocks mark pages that wait for the WooCommerce integration.

### 6.1 Shopping
| Page | Why we need it | Priority |
|---|---|---|
| Category pages (all levels, section 3) | The main way people browse 20 to 100+ products | P1 |
| All products | Full catalogue with filters | P1 |
| Search results | People search by name, material and use | P1 |
| Collections (new drops, gifts, under ₹[AMOUNT]) | Campaign and gift shopping | P2 |
| Product page (exists, add multi-colour options) | Product detail and options | P1 |
| Material chooser ("Find your filament") | Helps people pick PLA, PETG or resin | P2 |
| Compare materials | Side-by-side for a chosen product | P3 |
| Custom figure commission | For "human figurine" and custom likeness orders | P2 |
| Design-service page | Sketch, photo or idea to print | P1 |

### 6.2 Custom work (later, as you said)
| Page | Why | Priority |
|---|---|---|
| Custom quote (form) | Custom prints from a file | P1 (later) |
| Quote detail (customer) | Accept, decline, pay advance | P2 (later) |
| Business and bulk | Bulk quotes, GST invoices | P2 |

### 6.3 Account and checkout (later, with WooCommerce)
| Page | Why | Priority |
|---|---|---|
| Cart and mini-cart | Basket and totals | P1 (later) |
| Checkout | Pay and deliver | P1 (later) |
| Order confirmation | Thank you and next steps | P1 (later) |
| Login and register | Accounts for tracking and quotes | P2 (later) |
| Account dashboard | Orders, addresses, GSTIN | P2 (later) |
| Order tracking | Status timeline and courier link | P2 (later) |
| Returns request | Start a return or refund | P2 |

### 6.4 Knowledge and content
| Page | Why | Priority |
|---|---|---|
| Knowledge hub (blog index) | Central place for guides and research | P1 |
| Article page (template) | Every post | P1 |
| Materials guides (PLA, PETG, ABS/ASA, resin) | Explain choices; SEO | P1 |
| Design tips | Helps design-and-print customers | P2 |
| Research notes | Test results and trust | P2 |
| Case studies | Show projects | P2 |
| Care and safety | Cleaning, child safety, food-contact warnings | P1 |

### 6.5 Brand and trust
| Page | Why | Priority |
|---|---|---|
| About | Who the studio is | P1 |
| How we print (process and machines) | Shows quality and the four machine types | P1 |
| Contact | WhatsApp, email, studio address | P1 |
| FAQ | Answers to common questions | P1 |
| Shipping | Rates, times, tracking | P1 |
| Returns and warranty | Required by law and for trust | P1 |
| Reviews | Real reviews once collected | P2 |
| Sustainability | Filament waste, end-of-life options | P3 |
| Press and media | Press kit | P3 |

### 6.6 Policies and legal
| Page | Why | Priority |
|---|---|---|
| Privacy policy | DPDP and general privacy | P1 [LAWYER/CA] |
| Terms of sale | Orders, payment, cancellations | P1 [LAWYER/CA] |
| File and IP terms | Customer files, licences, takedown | P1 [LAWYER/CA] |
| Refund and cancellation | Made-to-order rules | P1 [LAWYER/CA] |
| Grievance officer | Required disclosure | P1 [LAWYER/CA] |
| Accessibility statement | Good practice, WCAG commitment | P2 |

### 6.7 Utility and system
| Page | Why | Priority |
|---|---|---|
| 404 | Friendly missing-page page with search | P1 |
| Search (empty and no results) | Helps when nothing matches | P1 |
| Maintenance / coming soon | Launch control | P1 |
| Sitemap (HTML) | Helpful for navigation and SEO | P2 |

### 6.8 Community (later)
| Page | Why | Priority |
|---|---|---|
| Customer gallery | Customers show their prints (with permission) | P3 |
| Design submissions | Other designers sell through us (needs terms) | P3 |

---

## 7. Menu and navigation

- **Main menu:** Shop (all categories), Custom printing, Design service, Knowledge hub, Business, About
- **Shop mega-menu:** the eleven main categories, each with its subcategories, plus Collections
- **Footer:** Shop, Custom, Learn (hub, guides, research), Help (FAQ, shipping, returns, contact), Policies (privacy, terms, files, refund), Company (about, process, press)

---

## 8. Decisions needed from you

1. **Licensed characters:** Are you willing to skip Marvel and anime franchise characters, or sell only original designs in those areas?
2. **Painted items:** Offer them, or print only?
3. **Multi-colour:** Which machines do multi-colour? Price difference for multi-colour, or a flat fee?
4. **Food-contact kitchen items:** Sell them with a "not for food contact" label, or hold off?
5. **Figurine age labelling:** Label figurines "collectible, 14+" until the BIS question is answered?
6. **Knowledge hub name:** "Knowledge hub", "Guides", "Journal" or "Lab notes"?
7. **Reviews:** Start with a simple review form, or wait for a review system?
8. **Campaigns:** Which seasonal campaigns in the first year?

---

## 8a. Decisions recorded (2026-11-13)

| # | Question | Decision |
|---|---|---|
| 1 | Licensed characters (Marvel, anime franchises) | **No licensed characters.** Only original designs, made by the studio owner. Anime-inspired and Marvel-inspired *original* designs are fine as long as they don't copy a protected character. Section 2.5 and 2.6 change: licensed-character sub-categories are removed. |
| 2 | Painted items | **Yes, on a few products only.** Those products are sold in single colour now, and a "Painted (later)" option can be added to the product page so the customer can request painting later. Painted items are made to order. |
| 3 | Single vs multi colour | **Variations in the backend.** Each product carries a colour-mode variation: "Single colour" or "Multi-colour" (and "Painted (later)" where offered). The product card shows a tag such as "Single colour" or "Multi-colour". Multi-colour is one product with variations, not two products. |
| 4 | Kitchen items and food contact | **Non-food-contact only.** Examples: egg trays, spoon holders, knife holders. **No food storage items** (no containers for grains, rice, flour or other food). Kitchen items are labelled "not for food contact" and the product text says so. |
| 5 | Age and NSFW | **No age limit labelling needed. No NSFW content is sold or shown.** The figurines category follows the same rule. |
| 6 | Knowledge hub name | **Open.** Any name that fits the theme. Default proposal: "Knowledge hub", to be confirmed. |
| 7 | Reviews | **Yes, per product.** Each product page has reviews (ratings, text, photos later). Needs a review system; choose the approach when we build. |
| 8 | Remaining questions (section 8) | **Discussed later.** |

Consequences for the plan:
- Section 2.5 (Anime figures) becomes "Anime-inspired original characters" under section 2.7. Section 2.6 (Marvel and pop culture) is removed from the shop.
- Section 1 colour mode: "Painted (later)" is an option only on the products that offer it.
- Kitchen organisers (section 2.3) are limited to the non-food-contact list above.

---

## 9. Suggested order when we start building (after your review)

1. Category structure in the product data (categories, subcategories, attributes) and the category page template
2. All products page and search, using the same grid and filters
3. Knowledge hub and article template, with the GSAP reading touches
4. Home page additions (section 5)
5. About, process, FAQ, shipping, returns, contact
6. Policy pages (after legal review)
7. Cart, checkout, confirmation, custom quote, account (after WooCommerce integration)
