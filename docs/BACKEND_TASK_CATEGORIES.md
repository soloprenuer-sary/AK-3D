# Backend task: product categories, sub-categories and menu settings

For the WordPress / WooCommerce backend team (`admin.akrinity.in`). No custom code and no new plugin is needed beyond ACF, which is already installed.

## Why

The storefront menu, the category pages and the sub-category pages are now built from the WooCommerce category tree. The tree on the live backend is not set up yet, so the site shows a built-in copy of the list below. Once the tree exists, the site switches to it automatically (about a minute after each edit), and the owner can then change the menu from the WordPress admin.

## Current state on live (checked 2026-11-18)

Only 3 main categories exist, with no sub-categories and no pictures:

| Category | Slug | Products |
|---|---|---|
| Desk & gadgets | `desk-gadgets` | 2 |
| Home decor | `home-decor` | 1 |
| Kitchen | `kitchen` | 2 |

Needed: 9 main categories and 30 sub-categories, with pictures on the sub-categories.

## 1. Create the categories (Products > Categories)

Use these **slugs exactly** (the storefront page addresses come from them). Set the **Parent category** as shown. Set **Menu order** with the ACF field `cat_menu_order` (step 3): mains 1 to 9 in the order listed, sub-categories 1 to 4 in the order listed.

| # | Main category (no parent) | Slug | Sub-categories (slug in brackets) |
|---|---|---|---|
| 1 | Home decor | `home-decor` | Showpieces (`showpieces`), Vases and planters (`vases-and-planters`), Lamps (`lamps`), Wall art (`wall-art`) |
| 2 | Desk & gadgets | `desk-gadgets` | Desk organisers (`desk-organisers`), Phone stands (`phone-stands`), Cable management (`cable-management`), Desk toys (`desk-toys`) |
| 3 | Kitchen | `kitchen` | Egg trays (`egg-trays`), Spoon and knife holders (`spoon-and-knife-holders`), Drawer dividers (`drawer-dividers`), Utility tools (`utility-tools`) |
| 4 | Figurines & miniatures | `figurines-miniatures` | Busts (`busts`), Miniatures (`miniatures`), Display models (`display-models`) |
| 5 | Original characters | `original-characters` | Chibi figures (`chibi-figures`), Busts (`busts-characters`), Display stands (`display-stands`) |
| 6 | Experimental & art | `experimental-art` | Parametric (`parametric`), Print-in-place (`print-in-place`), Geometric (`geometric`) |
| 7 | Gifts & personalised | `gifts-personalised` | Name plates (`name-plates`), Keychains (`keychains`), Corporate gifts (`corporate-gifts`) |
| 8 | Hobby & cosplay | `hobby-cosplay` | Dice towers (`dice-towers`), Terrain (`terrain`), Cosplay badges (`cosplay-badges`) |
| 9 | Spare parts | `spare-parts` | Knobs and clips (`knobs-and-clips`), Brackets (`brackets`), Custom parts (`custom-parts`) |

Notes:
- "Busts" exists under two parents. WordPress will want a different slug for the second one, so use `busts-characters` for the one under Original characters (name stays "Busts").
- Do not rename the existing three categories; add the children under them.
- Keep the default "Uncategorized" category as it is. The site ignores it.

## 2. Upload the pictures (sub-categories only)

30 PNG files are in the repo at `design/category-images/png/`, named `<main-slug>_<sub-slug>.png`, for example `home-decor_lamps.png`. For each sub-category, edit it and set the file as its **Thumbnail image**. (The file for "Busts" under Original characters is `original-characters_busts.png`.) Main categories do not need a picture.

If a picture is not set, the site uses the same illustration from its own files, so this step is not blocking.

## 3. ACF field group on product categories

Create a field group with location **Taxonomy Term is equal to Product categories** and turn on **Show in REST API** (VERIFY: the site only reads the fields when this is on). Exact field names and types are in `docs/CATEGORY_ACF_FIELDS.md`. The menu fields are:

| Field name | Type | On | Meaning |
|---|---|---|---|
| `cat_menu_order` | Number | every category | Lower comes first. Fill it as in step 1. |
| `cat_menu_label` | Text | main | Short name for the top bar. Leave empty for now. |
| `cat_menu_group` | Text | sub-category | Heading in the menu's full list. Leave empty for now. |
| `cat_popular` | True / false | sub-category | One of the 4 picture tiles. Leave unticked for now (each main has 4 or fewer, so all show). |

The page-text fields (`cat_tagline`, `cat_fact_1` and so on) in the same document are optional and can be filled later by the owner.

## 4. Put the existing products in their sub-categories

On each of the 5 live products, tick the **main category and its sub-category**. Suggested:

- Layered rectangular vase: Home decor, Vases and planters
- Egg tray (6 eggs): Kitchen, Egg trays
- Spoon holder: Kitchen, Spoon and knife holders
- Phone stand: Desk & gadgets, Phone stands
- The other Desk & gadgets product: its closest sub-category

Until a sub-category is ticked, the site guesses it from the product name, so this is not blocking either.

## How to check

1. `https://admin.akrinity.in/wp-json/wc/store/v1/products/categories?per_page=100` lists 9 main categories (parent 0) and 30 sub-categories, with an `image` on each sub-category.
2. `https://admin.akrinity.in/wp-json/wp/v2/product_cat?per_page=100&_fields=id,acf` shows `cat_menu_order` for each category (this proves ACF is exposed).
3. On the storefront, hover a category in the row under the header: four pictures and the list appear. Open a sub-category: only its products show.

## Later (owner's decision, not part of this task)

The owner is considering changing to 5 main categories (Home decor, Desk & gadgets, Figurines & miniatures including action figures, Spare parts, Sports equipment holders) with sub-categories that can be changed from the admin. Do not start that until the owner confirms the list. The storefront reads whatever the tree contains, so the change will need no code.
