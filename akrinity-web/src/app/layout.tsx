import type { Metadata, Viewport } from 'next';
import '@fontsource/anton/400.css';
import '@fontsource-variable/inter';
import './globals.css';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { CartProvider } from '@/lib/cart-store';
import { buildMenu, getCategoryTree } from '@/lib/category-content';
import { CategoryTreeProvider } from '@/components/layout/CategoryTree';
import { CompareTray } from '@/components/layout/CompareTray';

export const metadata: Metadata = {
  title: { default: 'Akrinity', template: '%s · Akrinity' },
  description: '3D printed products, custom prints and design-and-print from Mumbai.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tree = await getCategoryTree();
  const menu = buildMenu(tree);
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <CategoryTreeProvider tree={tree}>
          <CartProvider>
            <AnnouncementBar />
            <SiteHeader menu={menu} />
            {children}
            <SiteFooter tree={tree} />
            <CompareTray />
          </CartProvider>
        </CategoryTreeProvider>
      </body>
    </html>
  );
}
