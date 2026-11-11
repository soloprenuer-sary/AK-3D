import Link from 'next/link';
import { bestSellers } from '@/lib/placeholder-data';

export function BestSellers() {
  return (
    <section className="sec" style={{ paddingTop: 24 }}>
      <div className="wrap">
        <div className="sec-head">
          <h2 className="d">
            Best <span className="hl">sellers</span>
          </h2>
        </div>
        <div className="grid4">
          {bestSellers.map((p, i) => (
            <Link className="card-p" href="/shop" key={i}>
              <div className="img stripes">
                <span className={p.inStock ? 'tag accent' : 'tag'}>
                  {p.inStock ? 'In stock' : 'Made to order'}
                </span>
              </div>
              <div className="row">
                <div>
                  <div className="name">{p.name}</div>
                  <div className="price">{p.price}</div>
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
