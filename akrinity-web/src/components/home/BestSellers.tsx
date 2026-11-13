import Link from 'next/link';
import { productSlug, type ShopProduct } from '@/lib/shop-data';

/** Four products from the catalogue, in-stock ones first. */
export function BestSellers({ products }: { products: ShopProduct[] }) {
  const picks = [...products].sort((a, b) => Number(b.inStock) - Number(a.inStock)).slice(0, 4);
  return (
    <section className="sec" style={{ paddingTop: 24 }}>
      <div className="wrap">
        <div className="sec-head">
          <h2 className="d">
            Best <span className="hl">sellers</span>
          </h2>
          <Link className="btn btn-sm" href="/shop">
            Shop all
          </Link>
        </div>
        <div className="grid4">
          {picks.map((p) => (
            <Link className="card-p" href={`/product/${productSlug(p)}`} key={p.id}>
              <div className={p.images?.length ? 'img has-img' : 'img stripes'}>
                {p.images?.length ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" loading="lazy" />
                ) : null}
                <span className={p.inStock ? 'tag accent' : 'tag'}>
                  {p.inStock ? 'In stock' : 'Made to order'}
                </span>
              </div>
              <div className="row">
                <div>
                  <div className="name">{p.name}</div>
                  <div className="price">{p.price ?? '₹[price]'}</div>
                </div>
                <span className="add" aria-hidden="true">
                  +
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
