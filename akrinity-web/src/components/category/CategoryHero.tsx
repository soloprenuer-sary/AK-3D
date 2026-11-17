import type { CSSProperties } from 'react';
import Link from 'next/link';
import { CategoryArt } from './CategoryArt';
import type { CategoryTheme } from '@/lib/category-themes';
import type { CategoryCopy } from '@/lib/category-content';
import type { ShopCategory } from '@/lib/shop-data';

/** Defaults for the FAQ when the category has none in WordPress. Nothing here promises a lead time. */
const DEFAULT_FAQ = [
  {
    q: 'Can I choose the colour?',
    a: 'Yes. Most products come in black, white, orange, violet and lime, as a single colour or multi-colour. The options each product offers are on its page.',
  },
  {
    q: 'Can I order in bulk?',
    a: 'Yes. Where a product has bulk prices they are shown on its page. Send a bulk quote request and we confirm the price.',
  },
  {
    q: 'Can you make a different size or shape?',
    a: 'Often, yes. Send your idea through the quote form and we tell you what is possible and the price.',
  },
];

/** The top of a category page. Colours, pattern, drawing and layout all come from the category's theme. */
export function CategoryHero({
  category,
  theme,
  count,
  copy,
  fromPrice,
}: {
  category: ShopCategory;
  theme: CategoryTheme;
  count: number;
  copy?: CategoryCopy;
  /** Lowest price in the category, for example "₹299". */
  fromPrice?: string;
}) {
  const tagline = copy?.tagline ?? theme.tagline;
  const facts = copy?.facts?.length ? copy.facts : theme.facts;
  const cta = { ...theme.cta, ...stripEmpty(copy?.cta) };
  const meta = [
    count > 0 ? `${count} ${count === 1 ? 'product' : 'products'}` : 'New pieces coming soon',
    fromPrice ? `From ${fromPrice}` : '',
    copy?.leadTime ? `Ships in ${copy.leadTime}` : '',
  ].filter(Boolean);
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
          <span className="cat-kicker">{meta.join(' · ')}</span>
          <h1 className={`d${longest >= 11 ? ' cat-h1-long' : ''}`} id="cat-title">
            {first} {last && <span className="cat-hl">{last}</span>}
          </h1>
          {tagline && <p className="cat-tagline">{tagline}</p>}
          <p className="cat-desc">{category.description}</p>
          {facts.length > 0 && (
            <ul className="cat-facts" aria-label="At a glance">
              {facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
          <div className="cat-actions">
            <a className="btn cat-btn" href={count > 0 ? '#products' : '/shop'}>
              {count > 0 ? 'Shop this category' : 'Browse the whole shop'}
            </a>
            <Link className="btn cat-btn-ghost" href={cta.href}>
              {cta.label}
            </Link>
          </div>
        </div>
        <div className="cat-hero-art">
          {copy?.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="cat-hero-img" src={copy.heroImage} alt="" />
          ) : (
            <CategoryArt kind={theme.art} />
          )}
        </div>
      </div>
    </section>
  );
}

function stripEmpty<T extends object>(o?: T): Partial<T> {
  if (!o) return {};
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v)) as Partial<T>;
}

/** Tips and FAQ side by side, then a call to action. Text comes from WordPress, with defaults. */
export function CategoryInfo({ theme, copy }: { theme: CategoryTheme; copy?: CategoryCopy }) {
  const style = {
    '--ch-bg': theme.bg,
    '--ch-fg': theme.fg,
    '--ch-accent': theme.accent,
    '--ch-accent-ink': theme.accentInk ?? '#0B0B0C',
  } as CSSProperties;
  const tips = copy?.showTips === false ? [] : (copy?.tips ?? theme.tips);
  const faq = copy?.showFaq === false ? [] : (copy?.faq ?? DEFAULT_FAQ);
  const cta = { ...theme.cta, ...stripEmpty(copy?.cta) };
  return (
    <>
      {(tips.length > 0 || faq.length > 0) && (
        <section
          className={tips.length && faq.length ? 'wrap cat-info' : 'wrap cat-info cat-info--one'}
          aria-label="Good to know"
          style={style}
        >
          {tips.length > 0 && (
            <div>
              <h2 className="d cat-info-h">
                Good to <span className="cat-hl-ink">know</span>
              </h2>
              <ol className="cat-tip-list">
                {tips.map((t, i) => (
                  <li className="cat-tip" key={t.title}>
                    <span className="cat-tip-n" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <h3>{t.title}</h3>
                      <p>{t.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {faq.length > 0 && (
            <div>
              <h2 className="d cat-info-h">
                Common <span className="cat-hl-ink">questions</span>
              </h2>
              <div className="cat-faq">
                {faq.map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="wrap cat-cta-wrap" aria-label="Next step" style={style}>
        <div className="cat-cta">
          <div>
            <h2 className="d">{cta.title}</h2>
            <p>{cta.text}</p>
          </div>
          <Link className="btn cat-btn" href={cta.href}>
            {cta.label}
          </Link>
        </div>
      </section>
    </>
  );
}
