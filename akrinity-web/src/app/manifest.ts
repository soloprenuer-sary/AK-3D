import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Akrinity',
    short_name: 'Akrinity',
    description: '3D printed products, custom prints and design-and-print from Bhiwandi.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F3F1EA',
    theme_color: '#0B0B0C',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
