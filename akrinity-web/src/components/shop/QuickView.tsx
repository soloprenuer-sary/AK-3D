'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Pic } from '@/components/ui/Pic';
import { COLOURS, type ColourKey, type ShopProduct } from '@/lib/shop-data';

interface QuickViewProps {
  product: ShopProduct | null;
  onClose: () => void;
  onAdd: (product: ShopProduct) => void;
}

/** Native modal dialog: traps focus, closes on Escape and on backdrop click. */
export function QuickView({ product, onClose, onAdd }: QuickViewProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (product && !d.open) d.showModal();
    if (!product && d.open) d.close();
  }, [product]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="qv-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current?.close();
      }}
    >
      {product && (
        <QuickViewBody key={product.id} product={product} onClose={onClose} onAdd={onAdd} />
      )}
    </dialog>
  );
}

function QuickViewBody({
  product,
  onClose,
  onAdd,
}: { product: ShopProduct } & Omit<QuickViewProps, 'product'>) {
  const [colour, setColour] = useState<ColourKey>(product.colours[0]);
  const artStyle = { '--c': COLOURS[colour] } as CSSProperties;

  return (
    <div className="qv-body">
      <button
        type="button"
        className="qv-close"
        aria-label="Close quick view"
        onClick={() => onClose()}
      >
        ×
      </button>
      <div className={product.images?.length ? 'qv-art has-img' : 'qv-art'}>
        {product.images?.length ? (
          <Pic
            src={product.images[0]}
            alt={product.name}
            sizes="(max-width: 700px) 90vw, 500px"
            widths={[384, 640, 828]}
            priority
          />
        ) : (
          <div className="pc-obj" style={artStyle} />
        )}
      </div>
      <div className="qv-info">
        <span className={product.inStock ? 'tag accent' : 'tag'}>
          {product.inStock ? 'In stock' : 'Made to order'}
        </span>
        <h2 id="qv-title" className="d">
          {product.name}
        </h2>
        <p className="muted">
          {product.material} · {product.category}
          {product.inStock ? '' : ' · Made to order'}
        </p>
        <div className="price">
          <span className="amt">{product.price ?? '₹[price]'}</span>
          <span className="muted" style={{ fontSize: 14 }}>
            incl. GST
          </span>
        </div>
        {product.description && <p>{product.description}</p>}
        <div className="swatches" role="group" aria-label="Colour">
          {product.colours.map((key) => (
            <button
              key={key}
              type="button"
              className="sw"
              aria-label={key}
              aria-pressed={colour === key}
              style={{ background: COLOURS[key] }}
              onClick={() => setColour(key)}
            />
          ))}
        </div>
        <div className="qv-actions">
          <button type="button" className="btn btn-primary" onClick={() => onAdd(product)}>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
