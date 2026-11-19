import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { ProductDetail } from '@/components/product/ProductDetail';
import { getCategoryTree } from '@/lib/category-content';
import {
  PREVIEW_COOKIE,
  fetchPreview,
  isExpired,
  parseTicket,
  previewProblem,
} from '@/lib/preview';
import { mapStoreProduct } from '@/lib/wp';

/** A draft preview is built fresh on every view, never cached, and kept out of search engines. */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Draft preview',
  robots: { index: false, follow: false, nocache: true },
};

type Props = { searchParams: Promise<{ id?: string }> };

function Message({ text }: { text: string }) {
  return (
    <main id="main" className="wrap" style={{ padding: '64px var(--gutter)' }}>
      <h1 className="d">Draft preview</h1>
      <p className="muted" style={{ marginTop: 12 }}>
        {text}
      </p>
      <p style={{ marginTop: 20 }}>
        <Link className="btn" href="/shop">
          Go to the shop
        </Link>
      </p>
    </main>
  );
}

export default async function ProductPreviewPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const ticket = parseTicket((await cookies()).get(PREVIEW_COOKIE)?.value);
  if (!ticket || String(ticket.id) !== id || isExpired(ticket)) {
    return (
      <Message text="This preview has expired or was not opened from WordPress. Press Preview on the product again." />
    );
  }
  const r = await fetchPreview(ticket);
  if (r.status !== 200 || !r.product) return <Message text={previewProblem(r.status)} />;

  const product = mapStoreProduct(r.product, await getCategoryTree());
  const status = (r.product as { preview?: { status?: string } }).preview?.status;
  return (
    <>
      <div className="draft-banner" role="status">
        <b>Draft preview, not public yet.</b>
        <span>
          {status ? `Status: ${status}. ` : ''}This shows what is saved in WordPress right now. Only
          people with the link can see it.
        </span>
      </div>
      <ProductDetail product={product} crossSells={[]} related={[]} preview />
    </>
  );
}
