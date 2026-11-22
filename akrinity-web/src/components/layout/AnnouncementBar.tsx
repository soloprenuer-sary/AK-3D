import { paymentLine, site } from '@/lib/site-config';

export function AnnouncementBar() {
  return (
    <div className="announce">
      <div className="wrap">
        <span>
          {site.freeShippingFrom > 0
            ? `Free shipping across India above ₹${site.freeShippingFrom.toLocaleString('en-IN')}`
            : 'Made layer by layer in Mumbai'}
        </span>
        <span>{paymentLine}</span>
      </div>
    </div>
  );
}
