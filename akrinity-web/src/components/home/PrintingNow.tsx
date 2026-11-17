import { PrintingLoop } from '@/components/printer/PrintingLoop';

const ink = '#0B0B0C';
const sw = {
  stroke: ink,
  strokeWidth: 3,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};

/** The printer's touchscreen: job name, progress bar, temperatures. */
function ScreenArt() {
  return (
    <svg
      viewBox="0 0 240 150"
      role="img"
      aria-label="Illustration of the printer touchscreen"
      className="bt-art"
    >
      <rect x="10" y="12" width="220" height="126" rx="14" fill={ink} {...sw} />
      <rect x="22" y="24" width="196" height="102" rx="8" fill="#17171A" />
      <text
        x="34"
        y="46"
        fill="#D8FF3A"
        fontFamily="Inter,sans-serif"
        fontWeight="700"
        fontSize="12"
      >
        PRINTING · vase.3mf
      </text>
      <rect x="34" y="58" width="172" height="10" rx="5" fill="#34343A" />
      <rect x="34" y="58" width="112" height="10" rx="5" fill="#D8FF3A" />
      <text x="34" y="92" fill="#F3F1EA" fontFamily="Inter,sans-serif" fontSize="11">
        Nozzle 215° Bed 60°
      </text>
      <rect x="34" y="102" width="56" height="16" rx="8" fill="#5B2BE0" />
      <rect x="98" y="102" width="56" height="16" rx="8" fill="#FF6A1F" />
      <text x="48" y="114" fill="#fff" fontFamily="Inter,sans-serif" fontWeight="700" fontSize="9">
        PAUSE
      </text>
      <text x="113" y="114" fill={ink} fontFamily="Inter,sans-serif" fontWeight="700" fontSize="9">
        STOP
      </text>
    </svg>
  );
}

/** The build plate seen from above, with the first layer being laid down. */
function PlateArt() {
  return (
    <svg
      viewBox="0 0 240 150"
      role="img"
      aria-label="Illustration of the build plate"
      className="bt-art"
    >
      <path d="M40 40 H200 L226 120 H14 Z" fill="#E4E1D7" {...sw} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M${64 + i * 28} 40 L${46 + i * 36} 120`}
          stroke="#B8B4A8"
          strokeWidth="1.6"
        />
      ))}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${34 - i * 8} ${62 + i * 24} H${206 + i * 8}`}
          stroke="#B8B4A8"
          strokeWidth="1.6"
        />
      ))}
      <ellipse cx="120" cy="82" rx="42" ry="14" fill="#D8FF3A" {...sw} />
      <ellipse cx="120" cy="82" rx="28" ry="8" fill="none" stroke={ink} strokeWidth="2" />
      <ellipse cx="120" cy="82" rx="14" ry="4" fill="none" stroke={ink} strokeWidth="2" />
    </svg>
  );
}

/** A box with dimension arrows: how big a part can be. */
function SizeArt() {
  return (
    <svg
      viewBox="0 0 240 150"
      role="img"
      aria-label="Illustration of the maximum part size"
      className="bt-art"
    >
      <path d="M60 50 H150 V120 H60 Z" fill="#fff" {...sw} />
      <path d="M60 50 L90 28 H180 L150 50 M180 28 V98 L150 120" fill="#D8FF3A" {...sw} />
      <path
        d="M60 134 H150 M60 128 V140 M150 128 V140"
        stroke="#5B2BE0"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M196 28 V98 M190 28 H202 M190 98 H202"
        stroke="#FF6A1F"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M160 132 L184 112"
        stroke="#0B0B0C"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** "Printing now": the live printer loop beside a short intro, with three facts about the printer below. */
export function PrintingNow() {
  return (
    <section className="sec" id="printer" style={{ paddingTop: 0 }} aria-labelledby="printing-h">
      <div className="wrap">
        <div className="bento">
          <div className="bento-loop">
            <PrintingLoop />
          </div>

          <div className="bt bt-intro">
            <span className="tag accent">Printing now</span>
            <h2 className="d" id="printing-h">
              Watch a <span className="hl">part</span> come off the bed.
            </h2>
            <p>
              Every part is built one thin layer at a time. The head moves across each layer, then
              steps up to the next one.
            </p>
          </div>

          <div className="bt bt-tile bt-screen">
            <ScreenArt />
            <b>Touchscreen</b>
            <span>Start, pause and watch each job right at the printer.</span>
          </div>
          <div className="bt bt-tile bt-plate">
            <PlateArt />
            <b>Build plate</b>
            <span>
              Heated flat plate, [X] × [X] mm. The first layer decides how well a part sticks.
            </span>
          </div>
          <div className="bt bt-tile bt-size">
            <SizeArt />
            <b>Part size</b>
            <span>Up to [X] × [X] × [X] mm in one piece. Bigger parts print in sections.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
