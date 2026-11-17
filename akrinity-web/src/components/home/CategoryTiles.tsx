import Link from 'next/link';
import { getCategoryTree } from '@/lib/category-content';
import type { ShopCategory } from '@/lib/shop-data';

function ink(tone: string): string {
  return tone === 'var(--violet)' || tone === 'var(--ink)' ? 'var(--white)' : 'var(--ink)';
}

export async function CategoryTiles() {
  const featured: ShopCategory[] = (await getCategoryTree()).slice(0, 4);
  return (
    <section className="sec" id="shop">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="d">
            Shop by <span style={{ color: 'var(--violet)' }}>category</span>
          </h2>
          <Link className="btn btn-sm" href="/shop">
            View all
          </Link>
        </div>
        <div className="cat4">
          {featured.map((c) => (
            <Link
              key={c.name}
              className="tile"
              href={`/shop/${c.slug}`}
              style={{ background: c.tone, color: ink(c.tone) }}
            >
              <div className="shape" />
              <span className="pill-l" style={{ color: 'var(--ink)' }}>
                {c.name}
              </span>
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
