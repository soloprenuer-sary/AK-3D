/**
 * Preview the articles in this folder on the real website before they are published.
 *
 *   node content/blog/preview.mjs        site on http://localhost:3200/guides
 *
 * It answers the article query the way WordPress would (a stand-in on port 4100) and starts the
 * frontend pointed at it. Products and categories are still read from the live store (read only).
 * Nothing is written to WordPress.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const web = resolve(here, '../../akrinity-web');
const SITE_PORT = process.env.PORT ?? '3200';
const API_PORT = 4100;
const api = `http://localhost:${API_PORT}`;

/** The five topics already published keep their first date; the rest are new. */
const FIRST_PUBLISHED = {
  'how-we-check-every-print-before-it-ships': '2026-11-13',
  'non-food-contact-kitchen-pieces-what-that-means': '2026-11-13',
  'designing-for-print-wall-thickness-and-overhangs': '2026-11-13',
  'single-colour-or-multi-colour-what-actually-changes': '2026-11-13',
  'pla-petg-or-abs-asa-which-filament-for-your-part': '2026-11-13',
};

const picture = (file, alt) => ({
  sourceUrl: `${api}/images/${file}`,
  altText: alt,
  mediaDetails: { width: 1600, height: 900 },
});

/** Read on every request, so edits to the HTML show on the next page load. */
function posts() {
  const list = JSON.parse(readFileSync(join(here, 'posts.json'), 'utf8'));
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
  return list.map((p, i) => ({
    databaseId: i + 1,
    slug: p.slug,
    title: p.title,
    excerpt: `<p>${p.excerpt}</p>`,
    content: readFileSync(join(here, `${p.slug}.html`), 'utf8').replaceAll(
      'src="images/',
      `src="${api}/images/`,
    ),
    date: `${FIRST_PUBLISHED[p.slug] ?? today}T10:00:00`,
    modified: `${today}T10:00:00`,
    categories: { nodes: [{ name: p.category }] },
    featuredImage: { node: picture(p.cover, p.coverAlt) },
  }));
}

createServer((req, res) => {
  try {
    if (req.url?.startsWith('/graphql')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: { posts: { nodes: posts() } } }));
    } else if (req.url?.startsWith('/images/')) {
      const file = basename(req.url.split('?')[0]);
      const data = readFileSync(join(here, 'images', file));
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(data);
    } else {
      res.writeHead(404).end();
    }
  } catch {
    res.writeHead(404).end();
  }
}).listen(API_PORT, '127.0.0.1', () => {
  console.log(`Article stand-in on ${api}`);
  const next = spawn(
    process.execPath,
    [join(web, 'node_modules/next/dist/bin/next'), process.env.BLOG_PREVIEW_CMD ?? 'dev', '-p', SITE_PORT],
    {
      cwd: web,
      stdio: 'inherit',
      env: {
        ...process.env,
        NEXT_PUBLIC_WP_GRAPHQL_URL: `${api}/graphql`,
        NEXT_PUBLIC_WC_STORE_API_URL:
          process.env.NEXT_PUBLIC_WC_STORE_API_URL ?? 'https://admin.akrinity.in/wp-json/wc/store/v1',
      },
    },
  );
  next.on('exit', (code) => process.exit(code ?? 0));
});
