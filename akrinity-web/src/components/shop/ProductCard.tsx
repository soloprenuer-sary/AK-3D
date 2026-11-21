'use client';

import { useState, type CSSProperties, type PointerEvent } from 'react';
import Link from 'next/link';
import { Pic } from '@/components/ui/Pic';
import { CompareButton, WishButton } from './ProductActions';
import {
  COLOURS,
  MODE_LABEL,
  productSlug,
  type ColourKey,
  type ShopProduct,
} from '@/lib/shop-data';

interface ProductCardProps {
  product: ShopProduct;
  justAdded: boolean;
  onQuickView: (product: ShopProduct) => void;
  onAdd: (product: ShopProduct) => void;
  onSave: (product: ShopProduct, saved: boolean) => void;
}

export function ProductCard({ product, justAdded, onQuickView, onAdd, onSave }: ProductCardProps) {
  const [colour, setColour] = useState<ColourKey>(product.colours[0]);

  // Tilt follows the pointer on desktop. Touch screens skip it (CSS hides the hover actions there).
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
    e.currentTarget.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
  };
  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
  };

  const objStyle = { '--c': COLOURS[colour] } as CSSProperties;

  return (
    <article className="pc">
      <div className="pc-media" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div className={product.images?.length ? 'pc-art has-img' : 'pc-art'}>
          {product.images?.length ? (
            <Pic
              src={product.images[0]}
              alt=""
              sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 300px"
              widths={[256, 384, 640]}
            />
          ) : (
            <div className="pc-obj" style={objStyle} />
          )}
        </div>
        <span className={product.inStock ? 'tag accent' : 'tag'}>
          {product.inStock ? 'In stock' : 'Made to order'}
        </span>
        <span className="tag mode-tag">{product.modes.map((m) => MODE_LABEL[m]).join(' · ')}</span>

        <WishButton
          id={product.id}
          name={product.name}
          onChange={(saved) => onSave(product, saved)}
        />

        <button
          type="button"
          className="pc-round pc-qv"
          aria-label={`Quick view ${product.name}`}
          onClick={() => onQuickView(product)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0B0B0C"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        <div className="pc-sw" role="group" aria-label={`Colours for ${product.name}`}>
          {product.colours.map((key) => (
            <button
              key={key}
              type="button"
              aria-label={key}
              aria-pressed={colour === key}
              style={{ background: COLOURS[key] }}
              onClick={() => setColour(key)}
              onMouseEnter={() => setColour(key)}
            />
          ))}
        </div>

        <button
          type="button"
          className={justAdded ? 'pc-add done' : 'pc-add'}
          onClick={() => onAdd(product)}
        >
          {justAdded ? 'Added ✓' : 'Quick add'}
        </button>
      </div>

      <div className="pc-info">
        <div>
          <Link className="pc-name" href={`/product/${productSlug(product)}`}>
            {product.name}
          </Link>
          <span className="pc-meta" style={{ display: 'block' }}>
            {product.material} · {product.sub}
          </span>
          {product.reviewCount && product.rating ? (
            <span
              className="pc-rate"
              aria-label={`Rated ${product.rating.toFixed(1)} out of 5 from ${product.reviewCount} ${product.reviewCount === 1 ? 'review' : 'reviews'}`}
            >
              <span aria-hidden="true">★</span> {product.rating.toFixed(1)}{' '}
              <span className="pc-rate-n">({product.reviewCount})</span>
            </span>
          ) : null}
        </div>
        <span className="pc-price">
          {product.regularPrice && (
            <s style={{ opacity: 0.55, fontSize: '0.7em', marginRight: 6 }}>
              {product.regularPrice}
            </s>
          )}
          {product.price ?? '₹[price]'}
        </span>
      </div>
      <div className="pc-foot">
        <CompareButton id={product.id} name={product.name} />
      </div>
    </article>
  );
}
