'use client';

import Link from 'next/link';
import { Pic } from '@/components/ui/Pic';
import { Carousel } from '@/components/ui/Carousel';
import { useLiveProducts } from '@/lib/live-catalogue';
import { productSlug, type ShopProduct } from '@/lib/shop-data';

/** Products from the catalogue (in-stock first) in a slider with arrows beside "Shop all". */
export function BestSellers({ products: builtProducts }: { products: ShopProduct[] }) {
  const products = useLiveProducts(builtProducts);
  const picks = [...products].sort((a, b) => Number(b.inStock) - Number(a.inStock)).slice(0, 12);
  return (
    <Carousel
      id="best"
      title={
        <>
          Best <span className="hl">sellers</span>
        </>
      }
      ctaLabel="Shop all"
      ctaHref="/shop"
      label="best sellers"
    >
      {picks.map((p) => (
        <Link className="card-p car-item" href={`/product/${productSlug(p)}`} key={p.id}>
          <div className={p.images?.length ? 'img has-img' : 'img stripes'}>
            {p.images?.length ? (
              <Pic
                src={p.images[0]}
                alt=""
                sizes="(max-width: 640px) 70vw, 300px"
                widths={[256, 384, 640]}
              />
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
    </Carousel>
  );
}
