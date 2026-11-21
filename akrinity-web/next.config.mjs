const isProd = process.env.NODE_ENV === 'production';

/** The WordPress address the browser talks to (picture files, the store API, quote file uploads). */
let wpOrigin = 'https://admin.akrinity.in';
try {
  if (process.env.NEXT_PUBLIC_WC_STORE_API_URL) {
    wpOrigin = new URL(process.env.NEXT_PUBLIC_WC_STORE_API_URL).origin;
  }
} catch {
  /* keep the default */
}

/**
 * What the browser may load. Pictures come from WordPress and the Amazon picture host, the bot check
 * (Cloudflare Turnstile) and the Mumbai map are the only outside scripts and frames, and nothing may
 * frame this site. 'unsafe-inline' is there because Next.js writes small inline scripts and styles.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${wpOrigin} https://m.media-amazon.com https://secure.gravatar.com`,
  "font-src 'self' data:",
  `connect-src 'self' blob: data: ${wpOrigin} https://challenges.cloudflare.com`,
  "worker-src 'self' blob:",
  'frame-src https://challenges.cloudflare.com https://www.google.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Not set while developing, because the dev server needs eval and websockets.
  ...(isProd ? [{ key: 'Content-Security-Policy', value: csp }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Runs on Vercel as a normal Next.js app: pages are built ahead of time and refreshed in the
  // background (see `revalidate` on each page), and /api/* routes run as server functions.
  // Pictures are resized and converted to WebP by Vercel's image service, then cached for a year.
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: 'https', hostname: 'admin.akrinity.in', pathname: '/wp-content/uploads/**' },
      { protocol: 'https', hostname: 'm.media-amazon.com', pathname: '/images/**' },
    ],
  },
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  trailingSlash: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
