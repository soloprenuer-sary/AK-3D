# Category page: WordPress setup

Everything below is optional. A category with no value filled in uses the default text built into the site, and a section with no content stays hidden. Pictures and text are read at most once a minute, so edits show without a deploy.

## 1. Categories in WooCommerce (Products > Categories)

Main categories are the nine already used (Home decor, Desk & gadgets, Kitchen, Figurines & miniatures, Original characters, Experimental & art, Gifts & personalised, Hobby & cosplay, Spare parts).

Create the sub-categories below as **child categories** of their main category, and set a **Thumbnail image** on each one (this is the picture on the tile and in the menu). The names can use "&" or "and"; the site treats them the same.

| Main category | Sub-categories |
|---|---|
| Home decor | Showpieces, Vases and planters, Lamps, Wall art |
| Desk & gadgets | Desk organisers, Phone stands, Cable management, Desk toys |
| Kitchen | Egg trays, Spoon and knife holders, Drawer dividers, Utility tools |
| Figurines & miniatures | Busts, Miniatures, Display models |
| Original characters | Chibi figures, Busts, Display stands |
| Experimental & art | Parametric, Print-in-place, Geometric |
| Gifts & personalised | Name plates, Keychains, Corporate gifts |
| Hobby & cosplay | Dice towers, Terrain, Cosplay badges |
| Spare parts | Knobs and clips, Brackets, Custom parts |

On each product, tick the **sub-category** (the site finds the main category from it). A product with no sub-category is shown under "More <category>". "Busts" exists under two main categories, so tick the main category too on those products.

## 2. ACF fields on the product category

Create one ACF field group, location **Taxonomy Term = Product categories**, and turn on **Show in REST API** for the group (VERIFY: the site only reads the fields when this is on). Use these exact field names. Fill them on the **main** categories (not the sub-categories).

| Page area | Field name | Type |
|---|---|---|
| Header | `cat_tagline` | Text |
| Header | `cat_fact_1`, `cat_fact_2`, `cat_fact_3` | Text (short chips) |
| Header | `cat_lead_time` | Text, for example "3 to 5 days". Shown as "Ships in 3 to 5 days" |
| Header | `cat_hero_image` | Image (replaces the drawing; return format URL or image array) |
| Good to know | `cat_show_tips` | True / false (default on) |
| Good to know | `cat_tip_1_title`, `cat_tip_1_text`, same for `_2` and `_3` | Text, text area |
| Questions | `cat_show_faq` | True / false (default on) |
| Questions | `cat_faq_1_q`, `cat_faq_1_a` up to `cat_faq_5_q`, `cat_faq_5_a` | Text, text area |
| Call to action | `cat_cta_title`, `cat_cta_text`, `cat_cta_label` | Text |
| Call to action | `cat_cta_link` | Text, a site path such as `/design-service` or `/business` |
| Search listing | `cat_seo_title`, `cat_seo_description` | Text |

The category description box (Products > Categories > Description) is the line shown under the tagline in the header.

Do not put shipping times, returns or legal promises in the fields unless they are confirmed (VERIFY, and LAWYER for returns text).

## 3. Stars on product cards

Stars come from WooCommerce's own product reviews (Products > Reviews). A product with no reviews shows no stars. Amazon reviews must never be copied in.
