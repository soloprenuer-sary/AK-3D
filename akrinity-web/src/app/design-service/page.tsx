import type { Metadata } from 'next';
import Link from 'next/link';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = {
  title: 'Design service',
  description: 'Send a sketch, photo or idea and we turn it into an original 3D design, ready to print.',
};

export default function DesignService() {
  return (
    <InfoPage
      title="Design service"
      intro="Have a sketch, a photo or just an idea? We model it as an original 3D design, check it prints well, and only then quote the print."
      note="Original designs only. We do not model licensed characters or copy someone else's work."
      image={{ src: '/images/about/story.png', alt: 'From idea to part: a sketch becomes a 3D design ready to print' }}
      sections={[
        {
          heading: '1. Tell us the idea',
          paragraphs: [
            'Send a sketch, a photo, a rough description or a reference. Say what the piece is for, where it will sit and roughly how big it should be.',
          ],
        },
        {
          heading: '2. We model it',
          paragraphs: ['We build the design in 3D and send you preview images. You can ask for changes before anything is printed.'],
        },
        {
          heading: '3. We check it for print',
          paragraphs: [
            'We check wall thickness, overhangs and fit, and suggest the right material. Where a change would make the print more reliable, we tell you what it is and why.',
          ],
        },
        {
          heading: '4. You approve, then we print',
          paragraphs: [
            'You get a quote with the price and lead time. You pay only after you approve it. Made-to-order parts are printed after approval and checked before they leave the studio.',
          ],
        },
        {
          heading: 'What you keep',
          paragraphs: ['Design ownership and licence terms are set out in the file and IP terms before you send anything. [LAWYER/CA]'],
        },
      ]}
    >
      <div
        className="info-card"
        style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div>
          <h2>Start a design request</h2>
          <p className="muted">Use the quote form. Add your idea in the notes and attach a file if you have one.</p>
        </div>
        <Link className="btn btn-primary" href="/quote">
          Request a quote
        </Link>
      </div>
    </InfoPage>
  );
}
