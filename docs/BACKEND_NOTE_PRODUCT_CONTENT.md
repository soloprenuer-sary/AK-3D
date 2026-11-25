# Frontend note: product page content fields and draft preview

From the WordPress side (2026-11-20). Both pieces are live on `admin.akrinity.in` in the must-use file `akrinity-product-content.php` v3.0.0. It is separate from `akrinity-headless-auth.php`, so nothing in that file changed. No new settings. The existing `AKRINITY_SHARED_SECRET` and `AKRINITY_FRONTEND_URL` are used.

## 1. Product page content (Store API)

Every product from `GET /wp-json/wc/store/v1/products` now carries `extensions.akrinity_content`:

```json
{
  "layout": "pictures" | "text",
  "features":    ["18-car display capacity: Designed to ...", "..."],
  "description": ["Intro paragraph one.", "Intro paragraph two."],
  "about": [
    { "title": "Durable & Sturdy Build", "text": "Strong PLA+ ...", "picture": { "id": 152, "url": "...-1024x1024.jpg", "full": "...jpg", "width": 1500, "height": 1500, "alt": "..." } },
    { "title": "Easy Wall Installation", "text": "Screw slots ...", "picture": null }
  ],
  "pictures": [{ "id": 152, "url": "...", "full": "...", "width": 1500, "height": 1500, "alt": "...", "caption": "Durable & Sturdy Build" }],
  "package":     ["1 x Car display rack"],
  "details":     [{ "label": "Design", "value": "Hexagonal Geometric Frame" }],
  "specs":       [{ "label": "Brand", "value": "Akrinity" }],
  "has_content": true
}
```

All values are plain text (no HTML). Escape on render as usual. Empty lists mean the owner left that part blank. In WordPress the owner fills ONE ordered "Page content" list that mirrors the page: Key features, Intro, Section blocks (picture + heading + text), Package includes, Product Details; the Product specs table is a second tab. `pictures` is derived from the blocks that have a picture, in order, and a picture's `caption` is its block's heading. A picture that is not yet in the Media Library (fresh Amazon import) has `id: 0`, `width: 0`, `height: 0` and an `https://m.media-amazon.com/...` url; render it with `referrerpolicy="no-referrer"` and without fixed dimensions.

### Which layout to draw

| `layout` | When | What to render (same look as today) |
|---|---|---|
| `pictures` | at least one block has a picture | "About this product": left column = `features` (Key features), `description` (intro), then the `about` blocks (heading and text, divider lines), then `package` and `details` ("Product Details"); right column = `pictures` grid with `caption` over the picture and `alt` |
| `text` | no A+ pictures | "About this product": `features` as the ticked "Key features" list in the left column; `description` paragraphs in the right column; "Package includes" (`package`) under the description, hidden when the list is empty |

Fallback: when `has_content` is `false`, keep rendering the old way (the product description box and attributes), so products that were imported before these fields still look as they do now.

### Product specs table

Render the "Product specs" grid from `specs` (label and value rows, in order). It no longer comes from WooCommerce attributes, because the owner will use attributes for variations. Material, Colour, Colour option, Size and Personalization keep coming from WooCommerce as today (the fact tiles and the options). If `specs` is empty, hide the "Product specs" section.

### Limits

The box is custom code (no ACF) with Add row and Remove, so lists have no fixed slot count. Safety limits: 40 section blocks, 60 spec rows, 30 key features, 30 package lines, 40 detail lines. Empty rows are never sent. Output shape is unchanged from the first version.

## 2. Draft preview

The Preview button on a product in WordPress opens the storefront at:

```
{AKRINITY_FRONTEND_URL}/api/preview?id=<product id>&exp=<unix time>&token=<signature>
```

The link is signed (HMAC with the shared secret) and stops working after 24 hours.

### What to build

1. `GET /api/preview` (server route): read `id`, `exp`, `token`. Call WordPress to check them (step 2). On success enable Next.js draft mode, remember the three values (for example in a short-lived signed cookie or as the draft-mode payload) and redirect to the product page, for example `/product/preview?id=<id>` or `/product/<slug>?preview=1`.
2. Server-side fetch of the draft, with the shared key (never expose the key to the browser):

   ```
   GET {WP}/wp-json/akrinity/v1/preview/product?id=<id>&exp=<exp>&token=<token>
   Header: X-Akrinity-Key: <AKRINITY_SHARED_SECRET>
   ```

   Answers: `200` the product in **the same shape as a Store API product** (`name`, `prices`, `images`, `attributes`, `extensions.akrinity_content`, and so on), plus `preview: { status, expires }`. `401` wrong or missing key. `403` `{"code":"bad_token"}`. `410` `{"code":"expired"}`. `404` not found. `502` `{"code":"not_available"}`.
3. Render the product page with the same component as a live product, using this data instead of the Store API list. Add a visible banner ("Draft preview, not public yet"), and set `noindex, nofollow`. The route already sends `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`.
4. Never cache the preview page or add it to the sitemap or product lists.

Notes:
- A draft may have an empty `slug` (WordPress creates it on first publish), so open the preview by `id`.
- Editors should click **Save draft** first and then **Preview**. ACF values are only saved on Save draft.
- The preview shows what is saved in WordPress right now, including a product that is already published, so it can also be used to check edits before pressing Update.

## 3. Tested on the live server

Checked on 2026-11-20 with a temporary draft product (deleted afterwards): no key and wrong key give 401; wrong token, or a token for another product, gives 403; an expired link gives 410; the public Store API still returns 404 for the draft; a valid call returns 200 with the draft in Store API shape, including `akrinity_content` and the existing `akrinity` extension, with `X-Robots-Tag: noindex, nofollow`.
