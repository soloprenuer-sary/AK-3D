import type { Metadata, Viewport } from 'next';
import '@fontsource/anton/400.css';
import '@fontsource-variable/inter';
import './globals.css';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: { default: 'Akrinity', template: '%s · Akrinity' },
  description: '3D printed products, custom prints and design-and-print from Mumbai.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <AnnouncementBar />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
