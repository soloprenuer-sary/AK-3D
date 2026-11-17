'use client';

import { useState } from 'react';

/** Google Maps search for Mumbai. Change the query to the studio's exact address once it is confirmed. */
const QUERY = 'Mumbai, Maharashtra, India';
const OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(QUERY)}`;
const EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(QUERY)}&output=embed`;

/**
 * An illustrated map of the Mumbai peninsula with a pin on the studio, a button that opens Google
 * Maps, and a button that swaps the picture for the live map (the Google frame loads only on request).
 */
export function MumbaiMap() {
  const [live, setLive] = useState(false);
  return (
    <section className="wrap mapsec" aria-labelledby="map-h">
      <div className="mapcard">
        <div className="map-copy">
          <span className="tag accent">Find the studio</span>
          <h2 className="d" id="map-h">
            Printed in <span className="hl">Mumbai</span>
          </h2>
          <p>
            The studio is in Mumbai, Maharashtra. Orders ship from here across India. Visits are by
            appointment, so please message us first. <b>[Full address to be added]</b>
          </p>
          <div className="map-actions">
            <a
              className="btn btn-primary"
              href={OPEN_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Google Maps
            </a>
            <button
              type="button"
              className="btn"
              onClick={() => setLive((v) => !v)}
              aria-pressed={live}
            >
              {live ? 'Show the illustration' : 'Show live map here'}
            </button>
          </div>
          {live && (
            <p className="meta">The live map is loaded from Google and may set its own cookies.</p>
          )}
        </div>

        <div className="map-art">
          {live ? (
            <iframe
              title="Map of Mumbai"
              src={EMBED_URL}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <svg
              viewBox="0 0 520 420"
              role="img"
              aria-label="Illustrated map of Mumbai with a pin on the studio"
            >
              <rect width="520" height="420" fill="#5B2BE0" />
              <g fill="#7A52EC" opacity="0.7">
                <circle cx="60" cy="60" r="3" />
                <circle cx="120" cy="320" r="3" />
                <circle cx="460" cy="90" r="3" />
                <circle cx="420" cy="360" r="3" />
              </g>
              {/* the sea, drawn as waves on the left and bottom */}
              <g fill="none" stroke="#9D85F2" strokeWidth="3" strokeLinecap="round" opacity="0.8">
                <path d="M20 120 q14 -12 28 0 t28 0" />
                <path d="M30 200 q14 -12 28 0 t28 0" />
                <path d="M16 280 q14 -12 28 0 t28 0" />
                <path d="M130 388 q14 -12 28 0 t28 0 t28 0" />
              </g>
              {/* the peninsula */}
              <path
                d="M190 30 C250 20 330 40 372 92 C410 140 396 210 366 262 C350 292 340 330 320 362 C300 394 268 404 244 386 C222 368 238 330 232 296 C226 262 196 244 188 200 C180 158 176 110 176 78 C176 52 178 36 190 30 Z"
                fill="#D8FF3A"
                stroke="#0B0B0C"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              {/* roads and the harbour */}
              <g fill="none" stroke="#0B0B0C" strokeWidth="3" strokeLinecap="round" opacity="0.55">
                <path d="M222 70 C240 140 252 210 262 300 C266 330 268 352 272 372" />
                <path d="M200 110 L360 130" strokeDasharray="2 8" />
                <path d="M206 190 L366 200" strokeDasharray="2 8" />
                <path d="M236 270 L352 280" strokeDasharray="2 8" />
              </g>
              <path
                d="M372 130 C392 150 392 180 376 204 C396 206 410 190 410 168 C410 146 392 130 372 130 Z"
                fill="#7A52EC"
                stroke="#0B0B0C"
                strokeWidth="3"
              />
              {/* label chips */}
              <g fontFamily="Inter,sans-serif" fontWeight="700" fontSize="13" fill="#0B0B0C">
                <rect
                  x="214"
                  y="44"
                  width="78"
                  height="24"
                  rx="12"
                  fill="#fff"
                  stroke="#0B0B0C"
                  strokeWidth="2"
                />
                <text x="253" y="61" textAnchor="middle">
                  NORTH
                </text>
                <rect
                  x="262"
                  y="340"
                  width="86"
                  height="24"
                  rx="12"
                  fill="#fff"
                  stroke="#0B0B0C"
                  strokeWidth="2"
                />
                <text x="305" y="357" textAnchor="middle">
                  SOUTH
                </text>
              </g>
              {/* the pin */}
              <g className="map-pin">
                <ellipse cx="280" cy="236" rx="22" ry="7" fill="#0B0B0C" opacity="0.25" />
                <path
                  d="M280 232 C258 204 252 190 252 174 A28 28 0 0 1 308 174 C308 190 302 204 280 232 Z"
                  fill="#FF6A1F"
                  stroke="#0B0B0C"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <circle cx="280" cy="174" r="10" fill="#fff" stroke="#0B0B0C" strokeWidth="3" />
              </g>
              <g fontFamily="Anton,Impact,sans-serif" fill="#fff" letterSpacing="2">
                <text x="40" y="52" fontSize="30">
                  MUMBAI
                </text>
                <text
                  x="40"
                  y="76"
                  fontSize="13"
                  fontFamily="Inter,sans-serif"
                  fontWeight="700"
                  letterSpacing="1"
                >
                  AKRINITY STUDIO
                </text>
              </g>
            </svg>
          )}
        </div>
      </div>
    </section>
  );
}
