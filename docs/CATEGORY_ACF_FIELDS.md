# Category page and menu: WordPress setup

## How the menu and categories are controlled

The top menu, the category pages and the sub-category pages are all built from WooCommerce product categories (Products > Categories). Nothing is fixed in the site once WordPress has main categories with sub-categories. Until it does (and if WordPress cannot be reached), the site uses its built-in list of nine categories.

- **Main category** = a product category with no parent. The top bar shows the first five, in menu order. All of them are in the phone menu and on the Shop page.
- **Sub-category** = a child category. Each has its own page: `/shop/<main-slug>/<sub-slug>`. There is no limit to how many a main category has.
- **Picture** = the category Thumbnail image (tile and menu). If none is set, the site uses its own illustration when it has one, otherwise a coloured letter.
- **Menu panel** = four picture tiles ("Popular") and the full list in groups. Set both in the ACF fields below.

| What you want | Where to set it |
|---|---|
| Add a sub-category | Products > Categories > add, choose the Parent category |
| Change the 4 popular tiles | Tick **Popular in menu** on the sub-categories (tick four; with none ticked, the first four by order are used) |
| Group the full list (for example "Flowers and plants") | Type the same **Menu group** on each sub-category in that group |
| Order of categories and items | **Menu order** number on each category (lower comes first; blank counts as 100) |
| Shorter name in the top bar | **Menu label** on the main category (for example "Sports holders") |
| Change a picture | Category Thumbnail image |

Changes show on the site within about a minute.


Everything below is optional. A category with no value filled in uses the default text built into the site, and a section with no content stays hidden. Pictures and text are read at most once a minute, so edits show without a deploy.

## 1. Categories in WooCommerce (Products > Categories)

Main categories are the nine already used (Home decor, Desk & gadgets, Kitchen, Figurines & miniatures, Original characters, Experimental & art, Gifts & personalised, Hobby & cosplay, Spare parts).

Create the sub-categories below as **child categories** of their main category. The site already ships a picture for each one (`public/category-images`), so a Thumbnail image is optional: set one only to replace it. The names can use "&" or "and"; the site treats them the same.

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

On each product, tick the **sub-category** (until you do, the site guesses it from the product name, for example "vase" goes to Vases and planters) (the site finds the main category from it). A product with no sub-category is shown under "More <category>". "Busts" exists under two main categories, so tick the main category too on those products.

## 2. ACF fields on the product category

Create one ACF field group, location **Taxonomy Term = Product categories**, and turn on **Show in REST API** for the group (VERIFY: the site only reads the fields when this is on). Use these exact field names. The page-text fields go on the **main** categories; the four Menu fields go on the categories named in the table. A new main category that is not one of the built-in ones gets a colour look by its position and plain defaults, with text from these fields.

| Page area | Field name | Type |
|---|---|---|
| Menu | `cat_menu_label` | Text (main category only; short name for the top bar) |
| Menu | `cat_menu_order` | Number (any category; lower comes first) |
| Menu | `cat_menu_group` | Text (sub-category only; the heading it sits under in the full list) |
| Menu | `cat_popular` | True / false (sub-category only; one of the four picture tiles) |
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
