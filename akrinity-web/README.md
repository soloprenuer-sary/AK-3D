# akrinity-web

Frontend for the Akrinity storefront: Next.js (App Router, static export), React, TypeScript, GSAP, three.js. The backend is WordPress + WooCommerce (headless). See the project docs in `../docs/`.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the public endpoints
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Static export to `out/` |
| `npm run lint` | ESLint (TypeScript and React hooks rules) |
| `npm run typecheck` | TypeScript without emitting files |
| `npm run check` | Lint, typecheck and build together |
| `npm run format` | Prettier write |
| `npm run test:e2e` | Playwright tests (desktop and mobile) |
| `npm run pages:dev` | Preview the static build with Cloudflare Pages tooling |

## Folder structure

```
akrinity-web/
  src/
    app/                  routes (App Router)
      layout.tsx          root layout, fonts, skip link
      globals.css         design tokens and base styles
      page.tsx            home
      shop/               shop
      quote/              custom quote
    components/
      ui/                 buttons, pills, tags, inputs, cards
      layout/             announcement bar, header, footer
      home/               the 13 home sections
      product/            gallery, options, pincode check, bulk table
      quote/              quote form and file drop
      account/            order timeline, quote view
      motion/             reveal and parallax helpers (GSAP)
      three/              lazy-loaded three.js viewers
    lib/
      env.ts              public configuration
      graphql/            WPGraphQL client and queries
      store-api/          WooCommerce Store API (cart, checkout)
      r2/                 presigned upload helpers (server only)
      seo/                metadata and JSON-LD helpers
      analytics/          consent-aware tracking
    styles/               component styles (added as sections are built)
  public/
    fonts/                self-hosted fonts (if not using @fontsource)
    images/               static images
  tests/                  Playwright specs
  next.config.mjs         static export settings
  wrangler.toml           Cloudflare Pages settings
```

## Rules for this repo

- No secrets in the repo. Server keys live in the Cloudflare environment only.
- The site never calculates prices, tax or shipping; it renders what WooCommerce returns.
- Customer files never go through WordPress or public folders; uploads use signed URLs to a private bucket.
- Build sections one at a time and review each against the design canvas.
