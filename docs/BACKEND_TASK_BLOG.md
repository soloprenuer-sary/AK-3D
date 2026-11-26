# Backend task: upload the Knowledge hub articles to WordPress

From the frontend side, 2026-11-27. The owner chose WordPress as the place articles live, so they can be edited without a code change. Nothing has been uploaded yet.

**Job:** put 11 articles and 31 pictures on `admin.akrinity.in`. Six are new; five replace the short "Sample article." posts and keep their addresses.

## Read before you start

1. **Drafts are safe at any time. Publish only after the new article pages are live on the website.** The new page code is on branch `claude/confident-banach-47cfa4` (commit `0ef34b1` or later) and is not merged or pushed yet. The current website drops pictures and tables from posts and runs headings and lists into the text.
2. **Keep WPGraphQL active.** The website reads articles through it (`/graphql`). An earlier hardening list suggested turning it off; do not.
3. **The owner confirms the facts below before publishing.**
4. No plugin, theme, setting, or must-use file changes. The script is a one-off tool; keep it outside the web folder.

## What is in the package

`akrinity-blog-upload.zip`

| File | What it is |
|---|---|
| `BACKEND_TASK_BLOG.md` | This note |
| `import-articles.php` | WP-CLI script that does the upload |
| `posts.json` | Title, summary, category, address (slug), featured picture, and its alt text for each article |
| `<slug>.html` (11) | Article text in plain editor HTML |
| `images/` (31 PNG, 1600 x 900) | Pictures to add to the media library |
| `README.md` | Picture sources and fact list |

## The articles

| # | Title | Category | Address `/guides/…` | Now |
|---|---|---|---|---|
| 1 | 3D printing vs normal printing: what is the difference? | Guides | `3d-printing-vs-normal-printing` | new |
| 2 | 3D printing, CNC machining, or moulding: which fits your part? | Guides | `3d-printing-vs-injection-moulding-and-cnc` | new |
| 3 | 7 common 3D printing problems and how to avoid them | Guides | `common-3d-printing-problems-and-fixes` | new |
| 4 | PLA, PETG, or ABS/ASA: which filament for your part? | Materials | `pla-petg-or-abs-asa-which-filament-for-your-part` | replaces sample |
| 5 | Designing for print: wall thickness, overhangs, and fit | Design | `designing-for-print-wall-thickness-and-overhangs` | replaces sample |
| 6 | How to prepare a 3D file for printing: STL, 3MF, and STEP | Design | `how-to-prepare-a-3d-file-for-printing` | new |
| 7 | How to order a custom 3D print, from idea to delivery | Guides | `how-to-order-a-custom-3d-print` | new |
| 8 | Single colour or multi-colour: what actually changes | Guides | `single-colour-or-multi-colour-what-actually-changes` | replaces sample |
| 9 | What we do differently: how we check every print | Guides | `how-we-check-every-print-before-it-ships` | replaces sample |
| 10 | Caring for 3D prints, and what non-food-contact means | Guides | `non-food-contact-kitchen-pieces-what-that-means` | replaces sample |
| 11 | What we make: a tour of Akrinity's 3D printed products | Guides | `what-we-make-akrinity-3d-printed-products` | new |

Five articles also link to product pictures that are already in the media library (nothing to upload for those).

## Steps

Replace `<wordpress folder>` with the WordPress folder on the server.

1. Copy the zip to the server, outside the web folder, and unpack it.

```bash
scp akrinity-blog-upload.zip akrinity-server:~/
ssh akrinity-server
mkdir -p ~/blog-upload && unzip -o ~/akrinity-blog-upload.zip -d ~/blog-upload
```

2. Back up the database.

```bash
mkdir -p ~/backups && wp --path=<wordpress folder> db export ~/backups/db-before-blog-$(date +%Y%m%d-%H%M%S).sql
```

3. Check. This writes nothing.

```bash
cd ~/blog-upload && wp --path=<wordpress folder> eval-file import-articles.php
```

Expect 6 lines marked `create`, 5 marked `update`, and no warnings. Stop and report anything else.

4. Create the drafts. This uploads the pictures and makes the 6 new articles as drafts. The 5 live ones are not touched.

```bash
cd ~/blog-upload && wp --path=<wordpress folder> eval-file import-articles.php draft
```

5. Look through the drafts in WordPress (Posts, Drafts): text, tables, pictures, featured picture, category, excerpt.

6. After the new article pages are live on the website and the owner says yes, publish. This publishes the 6 drafts and updates the 5 live articles.

```bash
cd ~/blog-upload && wp --path=<wordpress folder> eval-file import-articles.php publish
```

### How the script behaves

- Finds articles by address, so running it again does not make copies or upload pictures twice.
- Saves the old title, text, and excerpt of every article it changes to `~/backups/blog-articles-before-<time>.json`.
- **Skips an article somebody changed in WordPress** and says so. If you edited a draft and want your version, press Publish on it by hand. Add `force` after the mode only to throw the WordPress changes away.
- New articles: comments and pingbacks closed, same author as the old posts, dated at publish time in the order above. The 5 replaced ones keep their first date.

## Check after publishing

```bash
curl -s -X POST https://admin.akrinity.in/graphql -H "Content-Type: application/json" \
  --data '{"query":"{ posts(first: 50) { nodes { slug featuredImage { node { sourceUrl } } } } }"}'
```

- 11 articles (plus the default "Hello world!" if it is still there; the website hides it), each with a featured picture.
- `https://<website>/guides` shows 11 cards within a few minutes. If it does not, clear the WordPress host cache for `/graphql` **[VERIFY whether the host caches it]**.
- Open two articles on a phone and a computer: pictures, tables, and links work.
- The website's sitemap lists the new addresses within an hour.

**Send back:** the script's last output, the backup file names, and anything skipped.

## Undo

Set the 6 new articles to Draft. For the 5 replaced ones, use Revisions on the post, or the saved JSON file.

## Owner to confirm before publishing (VERIFY)

1. Quality check: layer bonding, dimensions, surface finish, packing; failed prints are reprinted.
2. Online payment by UPI, card, or net banking after approving a quote (Cashfree is still in test mode).
3. Larger jobs may start with an advance (not built in the quote flow).
4. A sample can be printed before a batch.
5. Painting: made to order and quoted separately, where offered.
6. 300 MB upload limit per file, kept in private storage.
7. Product facts from product names: 1:64 scale, sixteen rackets, two controllers.
8. The studio owns the five product pictures used (some look edited or generated).

LAWYER/CA: the pixel sword is listed as a toy (BIS Toys Order); "Hot Wheels" in the category name is another company's trademark.

## Editing articles later (for the owner)

- Title, **Excerpt** (the short summary on cards), one **category** (Guides, Materials, or Design), and a **Featured image** (16:9, about 1600 x 900).
- In the text use Heading 2 and Heading 3, lists, Image (with alt text and caption), Table, and **Quote** (shows as the highlighted tip box).
- An uploaded article opens as one "Classic" block; choose **Convert to blocks** to edit it block by block.
- Do not change the address (slug) of a published article; links to it would break.
- Colours, fonts, and layout come from the website. Embeds such as videos are not shown.

## Also noticed, separate from this upload (ask the owner before changing)

1. Some products' public **Brand** attribute contains a street address and phone number. Please treat as urgent.
2. The product "Layered rectangular vase" shows pictures of a lamp.
