import type { MetadataRoute } from 'next';
import { site } from '@/lib/site-config';

/** Tells search engines what to read: the shop, and not the cart, checkout, accounts or the API. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/cart',
          '/checkout',
          '/order-confirmation',
          '/track-order',
          '/account',
          '/login',
          '/forgot-password',
          '/reset-password',
          '/product/preview',
          '/wishlist',
          '/compare',
          '/search',
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
