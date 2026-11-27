import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { StudioSlider } from '@/components/layout/StudioSlider';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Who makes Akrinity prints in Mumbai, how each part is checked, and the materials we use.',
};

export default function About() {
  return (
    <InfoPage
      title="About Akrinity"
      intro="Akrinity is a 3D printing studio in Mumbai. We print ready-made products, custom parts from your own file, and designs we make from a sketch or an idea. Every part is made layer by layer, and checked before it leaves us."
      heroImage={{
        src: '/images/about/hero.png',
        alt: 'Four printed objects in brand colours standing on a striped lime background',
        caption: 'Illustration. Studio photos are coming.',
      }}
      afterSections={
        <StudioSlider
          slides={[
            {
              src: '/images/about/slide-printer.png',
              alt: 'Illustration of a 3D printer building a part layer by layer',
              caption: 'The printer: one thin layer at a time.',
            },
            {
              src: '/images/about/slide-workshop.png',
              alt: 'Illustration of the workshop bench where parts are finished',
              caption: 'The workshop: where parts are finished.',
            },
            {
              src: '/images/about/slide-packaging.png',
              alt: 'Illustration of a box being packed for dispatch',
              caption: 'Packing: checked, wrapped and boxed.',
            },
          ]}
        />
      }
      sections={[
        {
          heading: 'Why we started',
          image: {
            src: '/images/about/story.png',
            alt: 'A sketch on the left becomes a finished printed part on the right',
            caption: 'From a sketch to a printed part.',
          },
          paragraphs: [
            'Many of the problems we print for are small and specific: a shelf for a growing collection of die-cast cars, a mount that keeps rackets off the floor, a stand that holds two controllers and a headset in one place.',
            'Those problems are hard to solve with a shop-bought object, and quick to solve with a 3D printer. That is what we do: make the part that fits your space, your collection or your idea.',
          ],
        },
        {
          heading: 'What we make',
          paragraphs: [
            'Ready-made products: home decor, desk and bedside organisers, sports holders, jewellery stands, figurines, gifts, and spare parts.',
            'Custom prints from your own 3D file, and design-and-print from a sketch or a photo.',
          ],
          items: [
            'Home decor and desk organisers',
            'Display stands for die-cast cars',
            'Jewellery and accessory stands',
            'Gifts, keychains and personalised pieces',
            'Spare parts and brackets',
            'Custom work from your own file',
          ],
        },
        {
          heading: 'How we work',
          image: {
            src: '/images/about/process.png',
            alt: 'Four steps from check to print to finish to ship',
            caption: 'Check, print, finish, ship.',
          },
          paragraphs: [
            'Every part is checked for layer adhesion, size and surface finish before packing. A part that fails is printed again, not sent.',
            'Made-to-order parts are printed after you order, so we tell you the lead time before you pay. Ready-made parts ship from stock when they are in stock.',
          ],
        },
        {
          heading: 'Materials',
          image: {
            src: '/images/about/materials.png',
            alt: 'Four material colours: PLA, PETG, ABS and ASA, and resin',
            caption: 'PLA, PETG, ABS/ASA and resin.',
          },
          paragraphs: [
            'We print in PLA and PLA+ for detail and decor, PETG for tougher everyday parts, ABS and ASA for heat and outdoor use, and resin for very fine detail.',
            'The knowledge hub explains when to pick each one, with the trade-offs in plain language.',
          ],
        },
        {
          // VERIFY with the owner: the promise lines are drafts until the studio confirms them.
          heading: 'Our promise',
          paragraphs: [
            'Prices include GST. Each product page shows the lead time before you pay. If a part cannot be made the way you asked, we tell you straight away, and we fix any part that is wrong.',
            'Reply to any email from us. Our contact page shows the reply time.',
          ],
        },
      ]}
    />
  );
}
