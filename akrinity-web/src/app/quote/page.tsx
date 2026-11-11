import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Custom quote' };

export default function QuotePage() {
  return (
    <main id="main" className="wrap">
      <h1>Custom quote</h1>
      <p>Quote form placeholder. Uploads go straight to private storage via signed URLs.</p>
    </main>
  );
}
