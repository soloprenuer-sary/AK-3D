/* global process */
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the site is served from a CDN (Cloudflare Pages), no Node server needed.
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  trailingSlash: false,
  // Local development only: send account calls to the Cloudflare Pages dev server (npm run auth:dev, port 8788).
  // Static export has no server, so this is not used in the production build.
  ...(process.env.NODE_ENV === 'development'
    ? {
        async rewrites() {
          return [
            { source: '/api/auth/:path*', destination: 'http://localhost:8788/api/auth/:path*' },
            {
              source: '/api/catalog/:path*',
              destination: 'http://localhost:8788/api/catalog/:path*',
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
