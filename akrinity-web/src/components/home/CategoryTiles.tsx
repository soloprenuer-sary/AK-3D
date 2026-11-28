import Link from 'next/link';
import { Pic } from '@/components/ui/Pic';
import { Carousel } from '@/components/ui/Carousel';
import { getCategoryTree } from '@/lib/category-content';

function ink(tone: string): string {
  return tone === 'var(--violet)' || tone === 'var(--ink)' ? 'var(--white)' : 'var(--ink)';
}

/** Every main category in a slider with arrows beside "View all". Each card shows its WooCommerce picture. */
export async function CategoryTiles() {
  const categories = await getCategoryTree();
  return (
    <Carousel
      id="shop"
      title={
        <>
          Shop by <span style={{ color: 'var(--violet)' }}>category</span>
        </>
      }
      ctaLabel="View all"
      ctaHref="/shop"
      label="categories"
    >
      {categories.map((c) => (
        <Link
          key={c.slug}
          className="tile car-item"
          href={`/shop/${c.slug}`}
          style={{ background: c.tone, color: ink(c.tone) }}
        >
          {c.image ? (
            <Pic
              className="tile-img"
              src={c.image}
              alt=""
              sizes="(max-width: 640px) 78vw, (max-width: 1000px) 33vw, 25vw"
              widths={[384, 640]}
            />
          ) : (
            <div className="shape" />
          )}
          <span className="pill-l" style={{ color: 'var(--ink)' }}>
            {c.name}
          </span>
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </Link>
      ))}
    </Carousel>
  );
}
