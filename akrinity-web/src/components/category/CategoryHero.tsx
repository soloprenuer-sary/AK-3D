import type { CSSProperties } from 'react';
import Link from 'next/link';
import { CategoryArt } from './CategoryArt';
import type { CategoryTheme } from '@/lib/category-themes';
import type { ShopCategory } from '@/lib/shop-data';

/** The top of a category page. Colours, pattern, drawing and layout all come from the category's theme. */
export function CategoryHero({
  category,
  theme,
  count,
}: {
  category: ShopCategory;
  theme: CategoryTheme;
  count: number;
}) {
  const words = category.name.split(' ');
  const last = words.length > 1 ? words[words.length - 1] : '';
  const first = words.length > 1 ? words.slice(0, -1).join(' ') : category.name;
  const longest = Math.max(...words.map((w) => w.length));
  const style = {
    '--ch-bg': theme.bg,
    '--ch-fg': theme.fg,
    '--ch-accent': theme.accent,
    '--ch-accent-ink': theme.accentInk ?? '#0B0B0C',
  } as CSSProperties;

  return (
    <section className="wrap cat-wrap" aria-labelledby="cat-title">
      <div
        className={`cat-hero cat-hero--${theme.layout}`}
        data-pattern={theme.pattern}
        style={style}
      >
        <div className="cat-hero-text">
          <span className="cat-kicker">
            {count > 0
              ? `${count} ${count === 1 ? 'product' : 'products'}`
              : 'New pieces coming soon'}
          </span>
          <h1 className={`d${longest >= 11 ? ' cat-h1-long' : ''}`} id="cat-title">
            {first} {last && <span className="cat-hl">{last}</span>}
          </h1>
          <p className="cat-tagline">{theme.tagline}</p>
          <p className="cat-desc">{category.description}</p>
          <ul className="cat-facts" aria-label="At a glance">
            {theme.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div className="cat-actions">
            <a className="btn cat-btn" href={count > 0 ? '#products' : '/shop'}>
              {count > 0 ? 'Shop this category' : 'Browse the whole shop'}
            </a>
            <Link className="btn cat-btn-ghost" href={theme.cta.href}>
              {theme.cta.label}
            </Link>
          </div>
        </div>
        <div className="cat-hero-art">
          <CategoryArt kind={theme.art} />
        </div>
      </div>
    </section>
  );
}

/** Tips and a call to action, shown under the products. */
export function CategoryExtras({ theme }: { theme: CategoryTheme }) {
  const style = {
    '--ch-bg': theme.bg,
    '--ch-fg': theme.fg,
    '--ch-accent': theme.accent,
    '--ch-accent-ink': theme.accentInk ?? '#0B0B0C',
  } as CSSProperties;
  return (
    <>
      <section className="wrap cat-tips" aria-labelledby="cat-tips-h" style={style}>
        <h2 id="cat-tips-h" className="d cat-tips-h">
          Good to <span className="cat-hl-ink">know</span>
        </h2>
        <div className="cat-tip-grid">
          {theme.tips.map((t, i) => (
            <article className="cat-tip" key={t.title}>
              <span className="cat-tip-n" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap cat-cta-wrap" aria-label="Next step" style={style}>
        <div className="cat-cta">
          <div>
            <h2 className="d">{theme.cta.title}</h2>
            <p>{theme.cta.text}</p>
          </div>
          <Link className="btn cat-btn" href={theme.cta.href}>
            {theme.cta.label}
          </Link>
        </div>
      </section>
    </>
  );
}
