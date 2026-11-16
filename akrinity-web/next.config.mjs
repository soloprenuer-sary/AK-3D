/** @type {import('next').NextConfig} */
const nextConfig = {
  // Runs on Vercel as a normal Next.js app: pages are built ahead of time and refreshed in the
  // background (see `revalidate` on each page), and /api/* routes run as server functions.
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  trailingSlash: false,
};

export default nextConfig;
