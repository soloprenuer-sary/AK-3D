import type { MetadataRoute } from 'next';
import { getGuides, getProducts } from '@/lib/catalogue';
import { getCategoryTree } from '@/lib/category-content';
import { MATERIAL_GUIDES } from '@/lib/materials-data';
import { productSlug } from '@/lib/shop-data';
import { site } from '@/lib/site-config';

/** Every public page: the fixed pages, each category and sub-category, product, article and material. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, guides, tree] = await Promise.all([
    getProducts(),
    getGuides(),
    getCategoryTree(),
  ]);
  const at = (
    path: string,
    priority: number,
    changeFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly',
  ) => ({
    url: `${site.url}${path}`,
    changeFrequency,
    priority,
  });
  const fixed = [
    at('/', 1, 'daily'),
    at('/shop', 0.9, 'daily'),
    at('/quote', 0.8),
    at('/business', 0.7),
    at('/design-service', 0.7),
    at('/materials', 0.6, 'monthly'),
    at('/guides', 0.6),
    at('/how-we-print', 0.5, 'monthly'),
    at('/faq', 0.5, 'monthly'),
    at('/about', 0.4, 'monthly'),
    at('/contact', 0.5, 'monthly'),
    at('/shipping', 0.4, 'monthly'),
    at('/returns', 0.4, 'monthly'),
    at('/refunds', 0.4, 'monthly'),
    at('/care', 0.3, 'monthly'),
    at('/privacy', 0.2, 'monthly'),
    at('/terms', 0.2, 'monthly'),
    at('/grievance', 0.2, 'monthly'),
  ];
  const categories = tree.flatMap((c) => [
    at(`/shop/${c.slug}`, 0.8, 'daily'),
    ...c.subInfo.map((s) => at(`/shop/${c.slug}/${s.slug}`, 0.7, 'daily')),
  ]);
  return [
    ...fixed,
    ...categories,
    ...products.map((p) => at(`/product/${productSlug(p)}`, 0.8, 'daily')),
    ...guides.map((g) => ({
      ...at(`/guides/${g.slug}`, 0.5),
      lastModified: g.updated ?? g.date,
    })),
    ...MATERIAL_GUIDES.map((m) => at(`/materials/${m.slug}`, 0.5, 'monthly')),
  ];
}
