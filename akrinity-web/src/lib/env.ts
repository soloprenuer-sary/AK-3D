/** Public configuration. Server-only secrets are read in server route code, never here. */
export const env = {
  wpGraphqlUrl: process.env.NEXT_PUBLIC_WP_GRAPHQL_URL ?? '',
  wcStoreApiUrl: process.env.NEXT_PUBLIC_WC_STORE_API_URL ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
} as const;
