/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the site is served from a CDN (Cloudflare Pages), no Node server needed.
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  trailingSlash: false,
};

export default nextConfig;
