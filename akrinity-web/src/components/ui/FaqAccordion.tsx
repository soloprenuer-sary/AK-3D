import Link from 'next/link';
import type { FaqItem } from '@/lib/faq-data';

/** Questions as an accordion. Uses native details elements, so it works without JavaScript. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="faq-acc">
      {items.map((f, i) => (
        <details key={f.q} name="faq" open={i === 0}>
          <summary>{f.q}</summary>
          <div className="faq-a">
            <p>{f.a}</p>
            {f.more && (
              <Link href={f.more.href} className="faq-more">
                {f.more.label} →
              </Link>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
