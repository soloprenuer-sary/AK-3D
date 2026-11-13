'use client';

import { useState } from 'react';

/**
 * Reviews for one product. There are no published reviews yet, so this shows the empty state and
 * a review form that does not save anything. Real reviews need a review store (WooCommerce
 * reviews through the API) before they are shown. Nothing is invented here.
 */
export function ProductReviews({ productName }: { productName: string }) {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  return (
    <section className="review-box" aria-labelledby="reviews-h">
      <div className="reviews-head">
        <h2 id="reviews-h" className="d">
          Reviews
        </h2>
        <p className="muted">No reviews yet for {productName}. Be the first to tell us how it turned out.</p>
      </div>

      <form
        className="review-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (rating === 0) {
            setError('Choose a star rating first.');
            setMessage('');
            return;
          }
          setError('');
          setMessage('Thanks. Reviews are not published yet, so this one was not saved.');
        }}
      >
        <fieldset className="stars">
          <legend className="label">Your rating</legend>
          <div role="radiogroup" aria-label="Rating out of five" style={{ display: 'flex', gap: 6 }}>
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
        <div className="field">
          <label htmlFor="rev-name">Name</label>
          <input id="rev-name" type="text" placeholder="How should we show your name?" />
        </div>
        <div className="field">
          <label htmlFor="rev-text">Your review</label>
          <textarea id="rev-text" rows={4} placeholder="What did you order, and how did it turn out?" />
        </div>
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
        <button className="btn btn-dark" type="submit">
          Post review
        </button>
      </form>
    </section>
  );
}
