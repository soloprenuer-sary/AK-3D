import Link from 'next/link';
import { categories } from '@/lib/placeholder-data';

export function CategoryTiles() {
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
        <div className="grid4">
          {categories.map((c) => (
            <Link
              key={c.name}
              className="tile"
              href="/shop"
              style={{ background: c.background, color: c.color }}
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
