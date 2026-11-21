'use client';

import Link from 'next/link';
import { Pic } from '@/components/ui/Pic';
import { useLiveProducts } from '@/lib/live-catalogue';
import { productSlug, type ShopProduct } from '@/lib/shop-data';

/** The newest products from the catalogue, one large and three smaller. Replaces the old lamp renders. */
export function SelectedWork({ products: built }: { products: ShopProduct[] }) {
  const all = useLiveProducts(built);
  // WooCommerce ids go up as products are added, so the highest ids are the newest.
  const fresh = [...all]
    .sort((a, b) => Number(b.id.replace(/\D/g, '')) - Number(a.id.replace(/\D/g, '')))
    .slice(0, 4);
  if (fresh.length === 0) return null;
  return (
    <section className="sec work" id="work" style={{ paddingTop: 24 }} aria-labelledby="fresh-h">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="d" id="fresh-h">
            Fresh off the <span className="hl">printer</span>
          </h2>
          <Link className="btn btn-sm" href="/shop">
            See what is new
          </Link>
        </div>
        <div className={`fresh fresh-${fresh.length}`}>
          {fresh.map((p, i) => (
            <Link
              key={p.id}
              className={i === 0 ? 'fresh-card fresh-main' : 'fresh-card'}
              href={`/product/${productSlug(p)}`}
            >
              <span className={p.images?.length ? 'fresh-img' : 'fresh-img stripes'}>
                {p.images?.[0] && (
                  <Pic
                    src={p.images[0]}
                    alt=""
                    sizes="(max-width: 640px) 50vw, 25vw"
                    widths={[256, 384, 640]}
                  />
                )}
              </span>
              <span className="fresh-body">
                <span className="tag accent">{i === 0 ? 'Newest' : p.category}</span>
                <b className="fresh-name">{p.name}</b>
                <span className="fresh-meta">
                  {p.price ?? '₹[price]'} · {p.inStock ? 'In stock' : 'Made to order'}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
