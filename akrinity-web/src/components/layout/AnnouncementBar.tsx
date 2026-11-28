import { getDeals, offerHeadline } from '@/lib/deals';
import { paymentLine } from '@/lib/site-config';

export async function AnnouncementBar() {
  const offer = offerHeadline(await getDeals());
  return (
    <div className="announce">
      <div className="wrap">
        <span>{offer || 'Made layer by layer in Bhiwandi'}</span>
        <span>{paymentLine}</span>
      </div>
    </div>
  );
}
