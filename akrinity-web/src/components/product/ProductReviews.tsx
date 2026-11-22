'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { loadReviews, sendReview, type ReviewList } from '@/lib/auth-client';

function Stars({ value }: { value: number }) {
  return (
    <span className="rv-stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? 'on' : ''} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

/**
 * Reviews for one product. Approved reviews come from WordPress (WooCommerce reviews). A new review is
 * saved as pending and only appears after it is approved in WordPress, so nothing shows unchecked.
 */
export function ProductReviews({
  productId: rawId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  // The store keeps ids like wc-281; WordPress needs the number.
  const productId = rawId.replace(/\D/g, '');
  const [list, setList] = useState<ReviewList | null>(null);
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    loadReviews(productId).then((r) => {
      if (live) setList(r);
    });
    return () => {
      live = false;
    };
  }, [productId]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setMessage('');
    if (rating === 0) {
      setError('Choose a star rating first.');
      return;
    }
    setError('');
    setBusy(true);
    const problem = await sendReview({
      product: productId,
      rating,
      name: String(f.get('name') ?? '').trim(),
      email: String(f.get('email') ?? '').trim(),
      text: String(f.get('text') ?? '').trim(),
      website: String(f.get('website') ?? ''),
    });
    setBusy(false);
    if (problem) {
      setError(problem);
      return;
    }
    setMessage('Thank you. Your review will appear on this page once we have approved it.');
    form.reset();
    setRating(0);
  }

  return (
    <section className="review-box" aria-labelledby="reviews-h">
      <div className="reviews-head">
        <h2 id="reviews-h" className="d">
          Reviews
        </h2>
        {list && list.count > 0 ? (
          <p className="rv-summary">
            <Stars value={list.average} /> <b>{list.average.toFixed(1)}</b> out of 5 from{' '}
            {list.count} review{list.count === 1 ? '' : 's'}
          </p>
        ) : (
          <p className="muted">
            {list
              ? `No reviews yet for ${productName}. Be the first to tell us how it turned out.`
              : 'Loading reviews…'}
          </p>
        )}
      </div>

      {list && list.reviews.length > 0 && (
        <ul className="rv-list">
          {list.reviews.map((r) => (
            <li key={r.id} className="rv-item">
              <div className="rv-top">
                <Stars value={r.rating} />
                <b>{r.name}</b>
                {r.verified && <span className="rv-badge">Verified buyer</span>}
                <span className="muted">{r.date}</span>
              </div>
              <p>{r.text}</p>
            </li>
          ))}
        </ul>
      )}

      <form className="review-form" onSubmit={onSubmit} noValidate>
        <h3 className="rv-form-h">Write a review</h3>
        <fieldset className="stars">
          <legend className="label">Your rating</legend>
          <div
            role="radiogroup"
            aria-label="Rating out of five"
            style={{ display: 'flex', gap: 6 }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                className={n <= rating ? 'star on' : 'star'}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
          </div>
        </fieldset>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="rev-name">Name</label>
            <input
              id="rev-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="How should we show your name?"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="rev-email">Email (not shown)</label>
            <input id="rev-email" name="email" type="email" autoComplete="email" required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="rev-text">Your review</label>
          <textarea
            id="rev-text"
            name="text"
            rows={4}
            placeholder="What did you order, and how did it turn out?"
            required
          />
        </div>
        <input
          className="hp"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          defaultValue=""
        />
        {error && (
          <p className="err" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="ok" role="status">
            {message}
          </p>
        )}
        <button className="btn btn-dark" type="submit" disabled={busy} aria-busy={busy}>
          {busy ? 'Sending…' : 'Post review'}
        </button>
      </form>
    </section>
  );
}
