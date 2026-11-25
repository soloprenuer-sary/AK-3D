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
import { CheckoutTray } from '@/components/layout/CheckoutTray';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { site } from '@/lib/site-config';

const DESCRIPTION = '3D printed products, custom prints and design-and-print from Mumbai.';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Akrinity: 3D printed products and custom prints from Mumbai',
    template: '%s · Akrinity',
  },
  description: DESCRIPTION,
  // Each page names itself as the preferred address (the part after the site address).
  alternates: { canonical: './' },
  openGraph: {
    type: 'website',
    siteName: 'Akrinity',
    locale: 'en_IN',
    title: 'Akrinity',
    description: DESCRIPTION,
    images: [
      { url: '/og-default.png', width: 1200, height: 630, alt: 'Akrinity: we print anything' },
    ],
  },
  twitter: { card: 'summary_large_image', images: ['/og-default.png'] },
};

/** Who we are, for Google (shown once, on every page). */
const ORGANISATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Akrinity',
  url: site.url,
  logo: `${site.url}/icon.svg`,
  description: DESCRIPTION,
  address: { '@type': 'PostalAddress', addressLocality: 'Mumbai', addressCountry: 'IN' },
  ...(site.supportEmail ? { email: site.supportEmail } : {}),
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
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANISATION).replace(/</g, '\\u003c'),
          }}
        />
        <a className="skip" href="#main">
          Skip to content
        </a>
        <CategoryTreeProvider tree={tree}>
          <CartProvider>
            <AnnouncementBar />
            <SiteHeader menu={menu} />
            {children}
            <SiteFooter tree={tree} />
            <CheckoutTray />
            <WhatsAppButton />
          </CartProvider>
        </CategoryTreeProvider>
      </body>
    </html>
  );
}
