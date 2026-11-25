import type { CategoryArtKey } from '@/lib/category-themes';

/** Flat illustrations in the brand style: ink outlines, brand colours, no gradients. One per category. */
const C = {
  ink: '#0B0B0C',
  paper: '#F3F1EA',
  white: '#FFFFFF',
  lime: '#D8FF3A',
  violet: '#5B2BE0',
  violet2: '#7A52EC',
  orange: '#FF6A1F',
  frame: '#E4E1D7',
};

const line = {
  stroke: C.ink,
  strokeWidth: 3,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};
const thin = { ...line, strokeWidth: 1.8 };

function Ground({ y = 336, w = 340 }: { y?: number; w?: number }) {
  return <ellipse cx={220} cy={y} rx={w / 2} ry={14} fill={C.ink} opacity={0.18} />;
}

function Decor() {
  return (
    <g>
      <Ground />
      <defs>
        <clipPath id="vase-clip">
          <path d="M112 128 C86 176 92 262 124 326 L226 326 C258 262 264 176 238 128 Z" />
        </clipPath>
      </defs>
      <path
        d="M112 128 C86 176 92 262 124 326 L226 326 C258 262 264 176 238 128 Z"
        fill={C.white}
        {...line}
      />
      <g clipPath="url(#vase-clip)">
        {[150, 172, 194, 216, 238, 260, 282, 304].map((y) => (
          <path key={y} d={`M80 ${y} H270`} stroke={C.ink} strokeWidth={1.6} opacity={0.35} />
        ))}
      </g>
      <rect x={106} y={112} width={138} height={20} rx={10} fill={C.violet} {...line} />
      <path d="M150 112 C142 70 128 52 112 42" fill="none" {...line} />
      <path d="M176 112 C178 64 190 40 206 28" fill="none" {...line} />
      <path d="M204 112 C214 78 236 62 252 58" fill="none" {...line} />
      <ellipse
        cx={108}
        cy={42}
        rx={20}
        ry={11}
        transform="rotate(-30 108 42)"
        fill={C.orange}
        {...line}
      />
      <ellipse
        cx={210}
        cy={26}
        rx={19}
        ry={11}
        transform="rotate(50 210 26)"
        fill={C.violet2}
        {...line}
      />
      <ellipse
        cx={258}
        cy={58}
        rx={19}
        ry={10}
        transform="rotate(-10 258 58)"
        fill={C.white}
        {...line}
      />
      {/* lamp */}
      <circle cx={340} cy={190} r={64} fill={C.white} opacity={0.55} />
      <path d="M300 300 L318 190 H368 L386 300 Z" fill={C.orange} {...line} />
      {[216, 240, 264, 286].map((y, i) => (
        <path
          key={y}
          d={`M${310 - i * 2} ${y} L${376 + i * 2} ${y - 18}`}
          stroke={C.ink}
          strokeWidth={1.6}
          opacity={0.4}
        />
      ))}
      <rect x={296} y={298} width={94} height={30} rx={9} fill={C.ink} />
    </g>
  );
}

function Desk() {
  return (
    <g>
      <rect x={30} y={318} width={380} height={18} rx={9} fill={C.ink} />
      {/* phone stand */}
      <path d="M88 318 L108 262 H190 L210 318 Z" fill={C.lime} {...line} />
      <g transform="rotate(-14 150 190)">
        <rect x={104} y={106} width={92} height={160} rx={16} fill={C.white} {...line} />
        <rect x={114} y={122} width={72} height={116} rx={8} fill={C.violet2} />
        <circle cx={150} cy={250} r={5} fill={C.ink} />
      </g>
      <path d="M118 262 H182" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      {/* cable organiser */}
      <rect x={252} y={262} width={140} height={56} rx={14} fill={C.orange} {...line} />
      {[282, 322, 362].map((x) => (
        <rect key={x} x={x - 10} y={254} width={20} height={26} rx={8} fill={C.ink} />
      ))}
      <path
        d="M292 254 C292 200 252 220 240 172"
        fill="none"
        stroke={C.white}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path
        d="M332 254 C332 190 372 200 372 150"
        fill="none"
        stroke={C.lime}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path
        d="M372 254 C372 224 400 226 400 196"
        fill="none"
        stroke={C.white}
        strokeWidth={5}
        strokeLinecap="round"
      />
      {/* pencil pot */}
      <rect x={226} y={196} width={0} height={0} />
    </g>
  );
}

function Kitchen() {
  return (
    <g>
      <Ground />
      {/* egg tray */}
      <path d="M52 244 H232 L246 316 H38 Z" fill={C.paper} {...line} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <ellipse cx={86 + i * 58} cy={248} rx={24} ry={10} fill={C.frame} {...thin} />
          <ellipse cx={92 + i * 58} cy={284} rx={24} ry={10} fill={C.frame} {...thin} />
        </g>
      ))}
      {[0, 1].map((i) => (
        <g key={i}>
          <ellipse cx={92 + i * 58} cy={236} rx={19} ry={26} fill={C.white} {...line} />
          <ellipse cx={86 + i * 58} cy={228} rx={5} ry={9} fill={C.white} opacity={0.0} />
        </g>
      ))}
      <ellipse cx={208} cy={272} rx={19} ry={26} fill={C.lime} {...line} />
      {/* spoon holder */}
      <path d="M290 330 L286 200 H374 L370 330 Z" fill={C.violet} {...line} />
      <ellipse cx={330} cy={200} rx={44} ry={12} fill={C.violet2} {...line} />
      <path d="M304 200 L296 90" fill="none" {...line} strokeWidth={9} />
      <ellipse
        cx={294}
        cy={72}
        rx={17}
        ry={26}
        transform="rotate(8 294 72)"
        fill={C.white}
        {...line}
      />
      <path d="M332 200 L336 70" fill="none" {...line} strokeWidth={9} />
      <ellipse cx={337} cy={50} rx={16} ry={26} fill={C.lime} {...line} />
      <path d="M358 200 L384 100" fill="none" {...line} strokeWidth={9} />
      <path d="M376 96 L400 92 L394 130 L384 134 Z" fill={C.white} {...line} />
      <path d="M312 262 H350" stroke={C.ink} strokeWidth={2} opacity={0.35} />
      <path d="M312 288 H350" stroke={C.ink} strokeWidth={2} opacity={0.35} />
    </g>
  );
}

function Figurine() {
  return (
    <g>
      <ellipse cx={220} cy={330} rx={120} ry={20} fill={C.lime} opacity={0.35} />
      <ellipse cx={220} cy={322} rx={86} ry={22} fill={C.paper} {...line} />
      <path d="M134 322 V300 H306 V322" fill={C.ink} stroke={C.paper} strokeWidth={3} />
      <ellipse cx={220} cy={300} rx={86} ry={22} fill={C.violet2} {...line} />
      {/* body */}
      <path d="M180 292 L190 196 H250 L260 292 Z" fill={C.lime} {...line} />
      <path d="M190 232 H250" stroke={C.ink} strokeWidth={3} />
      <path d="M180 206 L146 252 L160 262 L192 226" fill={C.white} {...line} />
      <path d="M260 206 L290 160 L306 168 L276 226" fill={C.white} {...line} />
      <path
        d="M290 160 L296 96"
        fill="none"
        stroke={C.paper}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path d="M290 100 L296 76 L302 100 Z" fill={C.paper} {...thin} />
      {/* head and helmet */}
      <circle cx={220} cy={166} r={32} fill={C.paper} {...line} />
      <path d="M188 166 A32 32 0 0 1 252 166 Z" fill={C.orange} {...line} />
      <path d="M220 134 L220 100" stroke={C.ink} strokeWidth={3} />
      <path
        d="M220 104 C240 86 262 94 262 112 C246 106 232 110 220 124 Z"
        fill={C.orange}
        {...line}
      />
      <rect x={202} y={162} width={36} height={5} rx={2} fill={C.ink} />
    </g>
  );
}

function Character() {
  return (
    <g>
      <Ground y={338} w={260} />
      <rect x={160} y={306} width={120} height={24} rx={8} fill={C.violet} {...line} />
      <path
        d="M180 306 C176 268 200 250 220 250 C240 250 264 268 260 306 Z"
        fill={C.orange}
        {...line}
      />
      {/* hair behind */}
      <path
        d="M96 190 C80 100 150 56 220 56 C290 56 360 100 344 190 L330 150 L300 190 L270 130 L220 190 L170 130 L140 190 L110 150 Z"
        fill={C.violet}
        {...line}
      />
      {/* face */}
      <path
        d="M122 196 C118 130 158 108 220 108 C282 108 322 130 318 196 C316 250 270 272 220 272 C170 272 124 250 122 196 Z"
        fill={C.paper}
        {...line}
      />
      <path
        d="M118 150 C150 160 190 130 220 118 C250 130 290 160 322 150 C310 100 270 80 220 80 C170 80 130 100 118 150 Z"
        fill={C.violet}
        {...line}
      />
      {/* eyes */}
      {[172, 268].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={204} rx={24} ry={30} fill={C.ink} />
          <ellipse cx={x} cy={208} rx={17} ry={22} fill={C.violet2} />
          <circle cx={x - 7} cy={196} r={9} fill={C.white} />
          <circle cx={x + 8} cy={216} r={4} fill={C.white} />
        </g>
      ))}
      <ellipse cx={142} cy={236} rx={14} ry={8} fill={C.orange} opacity={0.75} />
      <ellipse cx={298} cy={236} rx={14} ry={8} fill={C.orange} opacity={0.75} />
      <path d="M206 244 Q220 258 234 244" fill="none" {...line} />
      <path
        d="M118 162 L84 134 M322 162 L356 134"
        stroke={C.ink}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </g>
  );
}

function Experimental() {
  const blocks = [
    { y: 286, r: 0, c: C.lime, s: 150 },
    { y: 240, r: 12, c: C.white, s: 136 },
    { y: 196, r: 26, c: C.violet2, s: 122 },
    { y: 154, r: 40, c: C.lime, s: 108 },
    { y: 114, r: 54, c: C.white, s: 94 },
    { y: 76, r: 68, c: C.violet2, s: 80 },
  ];
  return (
    <g>
      <Ground y={336} w={300} />
      {blocks.map((b) => (
        <g key={b.y} transform={`rotate(${b.r} 220 ${b.y + 22})`}>
          <rect x={220 - b.s / 2} y={b.y} width={b.s} height={40} rx={14} fill={b.c} {...line} />
          <path
            d={`M${220 - b.s / 2 + 12} ${b.y + 20} H${220 + b.s / 2 - 12}`}
            stroke={C.ink}
            strokeWidth={1.8}
            opacity={0.4}
          />
        </g>
      ))}
      <path
        d="M40 120 C80 80 120 160 160 120 S240 80 280 120"
        fill="none"
        stroke={C.lime}
        strokeWidth={3}
        opacity={0.0}
      />
      <circle cx={360} cy={90} r={30} fill="none" stroke={C.lime} strokeWidth={3} />
      <circle cx={360} cy={90} r={14} fill={C.lime} {...thin} />
      <path d="M60 280 l22 -34 l22 34 z" fill={C.violet2} {...line} />
      <rect
        x={70}
        y={150}
        width={36}
        height={36}
        rx={8}
        transform="rotate(18 88 168)"
        fill={C.white}
        {...line}
      />
    </g>
  );
}

function Gift() {
  return (
    <g>
      <Ground />
      {/* box */}
      <rect x={70} y={170} width={210} height={150} rx={14} fill={C.orange} {...line} />
      <rect x={58} y={138} width={234} height={46} rx={12} fill={C.white} {...line} />
      <rect x={150} y={138} width={50} height={182} fill={C.lime} {...line} />
      <path
        d="M175 138 C150 90 100 90 108 120 C112 140 160 138 175 138 Z"
        fill={C.lime}
        {...line}
      />
      <path
        d="M175 138 C200 90 250 90 242 120 C238 140 190 138 175 138 Z"
        fill={C.lime}
        {...line}
      />
      <circle cx={175} cy={136} r={11} fill={C.violet} {...line} />
      {/* name plate on a keyring */}
      <circle cx={338} cy={104} r={34} fill="none" stroke={C.ink} strokeWidth={5} />
      <circle cx={338} cy={104} r={34} fill="none" stroke={C.paper} strokeWidth={2} />
      <path d="M326 134 L318 164" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <rect
        x={290}
        y={158}
        width={118}
        height={58}
        rx={12}
        transform="rotate(-6 349 187)"
        fill={C.violet}
        {...line}
      />
      <circle cx={304} cy={178} r={6} fill={C.paper} {...thin} transform="rotate(-6 349 187)" />
      <g transform="rotate(-6 349 187)" fill={C.white}>
        <rect x={322} y={176} width={60} height={8} rx={4} />
        <rect x={322} y={192} width={40} height={8} rx={4} />
      </g>
      <circle cx={52} cy={90} r={7} fill={C.violet} />
      <circle cx={96} cy={60} r={5} fill={C.orange} />
      <rect
        x={230}
        y={52}
        width={12}
        height={12}
        rx={2}
        transform="rotate(25 236 58)"
        fill={C.lime}
        {...thin}
      />
    </g>
  );
}

function d20Points(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

function Hobby() {
  const cx = 190;
  const cy = 190;
  const r = 118;
  return (
    <g>
      <Ground />
      <polygon points={d20Points(cx, cy, r)} fill={C.white} {...line} />
      <polygon
        points={d20Points(cx, cy, r * 0.56)
          .split(' ')
          .reverse()
          .join(' ')}
        fill={C.lime}
        {...line}
      />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const x1 = cx + r * Math.cos(a);
        const y1 = cy + r * Math.sin(a);
        const a2 = (Math.PI / 3) * i - Math.PI / 2;
        const x2 = cx + r * 0.56 * Math.cos(a2);
        const y2 = cy + r * 0.56 * Math.sin(a2);
        return (
          <path
            key={i}
            d={`M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`}
            {...thin}
          />
        );
      })}
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontFamily="Anton, Impact, sans-serif"
        fontSize={44}
        fill={C.ink}
      >
        20
      </text>
      {/* cosplay badge */}
      <circle cx={338} cy={112} r={52} fill={C.orange} {...line} />
      <circle cx={338} cy={112} r={38} fill="none" stroke={C.ink} strokeWidth={2} />
      <path
        d="M338 80 L348 104 L374 106 L354 122 L360 148 L338 134 L316 148 L322 122 L302 106 L328 104 Z"
        fill={C.lime}
        {...line}
      />
      {/* terrain */}
      <path d="M262 326 V286 H300 V262 H338 V286 H376 V326 Z" fill={C.paper} {...line} />
      <path d="M262 286 H376" stroke={C.ink} strokeWidth={2} opacity={0.4} />
      <rect x={282} y={300} width={22} height={26} rx={11} fill={C.ink} />
    </g>
  );
}

function gearPath(cx: number, cy: number, r: number, teeth: number) {
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (Math.PI * 2 * i) / teeth;
    const w = (Math.PI * 2) / teeth / 4;
    const o = r + 16;
    pts.push(
      `${(cx + r * Math.cos(a - w * 1.6)).toFixed(1)},${(cy + r * Math.sin(a - w * 1.6)).toFixed(1)}`,
      `${(cx + o * Math.cos(a - w)).toFixed(1)},${(cy + o * Math.sin(a - w)).toFixed(1)}`,
      `${(cx + o * Math.cos(a + w)).toFixed(1)},${(cy + o * Math.sin(a + w)).toFixed(1)}`,
      `${(cx + r * Math.cos(a + w * 1.6)).toFixed(1)},${(cy + r * Math.sin(a + w * 1.6)).toFixed(1)}`,
    );
  }
  return pts.join(' ');
}

function Parts() {
  return (
    <g>
      <polygon points={gearPath(170, 170, 78, 12)} fill={C.lime} {...line} />
      <circle cx={170} cy={170} r={30} fill={C.paper} {...line} />
      <circle cx={170} cy={170} r={10} fill={C.ink} />
      {/* knob */}
      <circle cx={338} cy={112} r={52} fill={C.violet} {...line} />
      {Array.from({ length: 14 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 14;
        return (
          <path
            key={i}
            d={`M${(338 + 40 * Math.cos(a)).toFixed(1)} ${(112 + 40 * Math.sin(a)).toFixed(1)} L${(338 + 50 * Math.cos(a)).toFixed(1)} ${(112 + 50 * Math.sin(a)).toFixed(1)}`}
            stroke={C.paper}
            strokeWidth={4}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={338} cy={112} r={20} fill={C.white} {...line} />
      <path d="M338 96 V112" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      {/* bracket */}
      <path d="M120 320 V266 H250 V232 H290 V320 Z" fill={C.orange} {...line} />
      <circle cx={150} cy={294} r={9} fill={C.paper} {...thin} />
      <circle cx={220} cy={294} r={9} fill={C.paper} {...thin} />
      <circle cx={270} cy={296} r={9} fill={C.paper} {...thin} />
      {/* clip */}
      <path
        d="M330 320 V272 C330 244 382 244 382 272 V320 H364 V274 C364 266 348 266 348 274 V320 Z"
        fill={C.white}
        {...line}
      />
      {/* measuring marks */}
      <path d="M60 346 H400" stroke={C.ink} strokeWidth={2} />
      {Array.from({ length: 18 }, (_, i) => (
        <path
          key={i}
          d={`M${60 + i * 20} 346 v${i % 5 === 0 ? 14 : 8}`}
          stroke={C.ink}
          strokeWidth={2}
        />
      ))}
    </g>
  );
}

/** A wall rack holding a racket, a ball and a bottle. */
function Sports() {
  return (
    <g>
      <Ground />
      <rect x={60} y={70} width={320} height={230} rx={18} fill={C.paper} {...line} />
      <rect x={60} y={268} width={320} height={34} rx={10} fill={C.violet} {...line} />
      <rect x={96} y={254} width={14} height={20} fill={C.ink} />
      <rect x={330} y={254} width={14} height={20} fill={C.ink} />
      {/* racket */}
      <ellipse cx={150} cy={140} rx={54} ry={66} fill="none" stroke={C.ink} strokeWidth={7} />
      <ellipse cx={150} cy={140} rx={54} ry={66} fill="none" stroke={C.orange} strokeWidth={3} />
      {[-30, -10, 10, 30].map((dx) => (
        <line key={dx} x1={150 + dx} y1={84} x2={150 + dx} y2={196} {...thin} />
      ))}
      {[100, 130, 160].map((y) => (
        <line key={y} x1={106} y1={y} x2={194} y2={y} {...thin} />
      ))}
      <rect x={140} y={204} width={20} height={64} rx={8} fill={C.ink} />
      {/* ball in a ring */}
      <circle cx={262} cy={228} r={36} fill={C.lime} {...line} />
      <path
        d="M232 206 C250 222 250 238 232 252 M292 206 C274 222 274 238 292 252"
        fill="none"
        {...line}
      />
      <ellipse cx={262} cy={262} rx={44} ry={9} fill={C.white} {...line} />
      {/* bottle */}
      <rect x={322} y={150} width={32} height={116} rx={12} fill={C.violet2} {...line} />
      <rect x={330} y={130} width={16} height={24} rx={4} fill={C.white} {...line} />
      <rect x={322} y={196} width={32} height={26} fill={C.white} {...thin} />
    </g>
  );
}

/** A small die-cast car, side view. (x, y) is the left end at road level; s scales it (1 = 100 wide). */
function Car({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  const edge = { ...line, strokeWidth: 3 / s };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M0 -16 H100 V-30 Q100 -38 92 -40 L72 -44 L60 -62 H32 L20 -44 L6 -40 Q0 -36 0 -28 Z"
        fill={color}
        {...edge}
      />
      <path d="M36 -57 H57 L67 -44 H28 Z" fill={C.paper} {...edge} />
      {[25, 75].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={-13} r={13} fill={C.ink} />
          <circle cx={cx} cy={-13} r={5} fill={C.paper} />
        </g>
      ))}
    </g>
  );
}

/** Honeycomb wall rack with cars, and one car out on the track. */
function HotWheels() {
  const hex = (cx: number, cy: number, r: number) => {
    const w = r * 0.866;
    return [
      [cx, cy - r],
      [cx + w, cy - r / 2],
      [cx + w, cy + r / 2],
      [cx, cy + r],
      [cx - w, cy + r / 2],
      [cx - w, cy - r / 2],
    ]
      .map((p) => p.join(','))
      .join(' ');
  };
  const cells = [
    { cx: 171, cy: 160, color: C.violet },
    { cx: 269, cy: 160, color: C.lime },
    { cx: 220, cy: 75, color: C.ink },
  ];
  return (
    <g>
      {cells.map((c) => (
        <g key={`${c.cx}-${c.cy}`}>
          <polygon points={hex(c.cx, c.cy, 57)} fill={C.paper} {...line} />
          <circle cx={c.cx} cy={c.cy - 38} r={5} fill={C.orange} {...thin} />
          <Car x={c.cx - 30} y={c.cy + 22} s={0.6} color={c.color} />
        </g>
      ))}
      <rect x={26} y={312} width={388} height={42} rx={14} fill={C.ink} />
      <path d="M48 333 H392" stroke={C.lime} strokeWidth={4} strokeDasharray="22 18" />
      <Car x={150} y={316} s={1.55} color={C.violet} />
      {[250, 272, 294].map((y, i) => (
        <path
          key={y}
          d={`M${60 + i * 12} ${y} H${128 + i * 4}`}
          stroke={C.white}
          strokeWidth={6}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

/** A jewellery tree with a necklace, and an open box with a ring beside it. */
function Jewellery() {
  const beads = [
    [88, 118],
    [112, 146],
    [186, 146],
    [210, 118],
  ];
  return (
    <g>
      <Ground />
      <ellipse cx={149} cy={318} rx={78} ry={15} fill={C.violet} {...line} />
      <rect x={141} y={58} width={16} height={258} rx={6} fill={C.violet} {...line} />
      <circle cx={149} cy={48} r={15} fill={C.lime} {...line} />
      <rect x={66} y={84} width={166} height={15} rx={7} fill={C.lime} {...line} />
      <path d="M72 92 Q149 232 226 92" fill="none" {...line} />
      {beads.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={8} fill={C.orange} {...thin} />
      ))}
      <path d="M149 152 L170 174 L149 206 L128 174 Z" fill={C.violet2} {...line} />
      <rect x={96} y={232} width={106} height={13} rx={6} fill={C.orange} {...line} />
      {[112, 186].map((x) => (
        <g key={x}>
          <path d={`M${x} 245 V266`} {...thin} />
          <circle cx={x} cy={277} r={11} fill={C.lime} {...thin} />
        </g>
      ))}
      {/* box with its lid lifted */}
      <rect x={252} y={232} width={142} height={92} rx={14} fill={C.violet} {...line} />
      <rect x={262} y={236} width={122} height={20} rx={6} fill={C.ink} />
      <g transform="rotate(-12 252 236)">
        <rect x={248} y={196} width={150} height={40} rx={13} fill={C.lime} {...line} />
        <path d="M264 216 H382" stroke={C.violet} strokeWidth={5} strokeLinecap="round" />
      </g>
      <rect x={252} y={254} width={142} height={70} rx={14} fill={C.violet} {...line} />
      <rect x={310} y={274} width={26} height={26} rx={7} fill={C.white} {...line} />
      {/* ring */}
      <circle cx={356} cy={112} r={31} fill="none" stroke={C.ink} strokeWidth={12} />
      <circle cx={356} cy={112} r={31} fill="none" stroke={C.orange} strokeWidth={6} />
      <path d="M356 54 L377 73 L356 94 L335 73 Z" fill={C.white} {...line} />
    </g>
  );
}

/** An original helmet, a toy sword behind it and a few pixel blocks. */
function Anime() {
  return (
    <g>
      <Ground />
      <g transform="rotate(38 220 190)">
        <path d="M205 250 V52 L220 22 L235 52 V250 Z" fill={C.paper} {...line} />
        <path d="M220 56 V244" {...thin} />
        <rect x={176} y={250} width={88} height={20} rx={8} fill={C.lime} {...line} />
        <rect x={208} y={270} width={24} height={62} rx={9} fill={C.ink} />
        <circle cx={220} cy={340} r={13} fill={C.lime} {...line} />
      </g>
      <path
        d="M118 214 Q118 92 208 92 Q298 92 298 214 V286 Q298 318 266 318 H150 Q118 318 118 286 Z"
        fill={C.orange}
        {...line}
      />
      <path d="M146 176 Q208 154 270 176 L262 226 Q208 240 154 226 Z" fill={C.ink} />
      <path d="M160 188 L198 196 L193 214 L162 206 Z" fill={C.lime} {...thin} />
      <path d="M256 188 L218 196 L223 214 L254 206 Z" fill={C.lime} {...thin} />
      <path
        d="M170 254 H246 V286 Q246 298 234 298 H182 Q170 298 170 286 Z"
        fill={C.paper}
        {...line}
      />
      <path d="M189 262 V292 M208 262 V292 M227 262 V292" {...thin} />
      <path d="M208 92 V144" {...line} strokeWidth={6} />
      <rect x={194} y={82} width={28} height={13} rx={5} fill={C.violet} {...line} />
      {[
        [340, 244, C.lime],
        [364, 220, C.paper],
        [364, 268, C.paper],
        [388, 244, C.lime],
        [62, 106, C.lime],
        [86, 82, C.paper],
      ].map(([x, y, fill]) => (
        <rect
          key={`${x}-${y}`}
          x={x as number}
          y={y as number}
          width={24}
          height={24}
          fill={fill as string}
          {...thin}
        />
      ))}
    </g>
  );
}

/** Three keychains hanging from a rail: a cat charm, a game controller and a name tag. */
function Keychains() {
  const ring = (x: number, chain: number) => (
    <g>
      <circle cx={x} cy={66} r={21} fill="none" stroke={C.ink} strokeWidth={5} />
      {Array.from({ length: chain }, (_, i) => (
        <ellipse
          key={i}
          cx={x}
          cy={98 + i * 24}
          rx={6}
          ry={13}
          fill="none"
          stroke={C.ink}
          strokeWidth={4}
        />
      ))}
    </g>
  );
  return (
    <g>
      <Ground />
      <rect x={34} y={30} width={372} height={18} rx={9} fill={C.ink} />
      {ring(98, 3)}
      {ring(220, 5)}
      {ring(342, 2)}
      {/* cat charm */}
      <path d="M58 196 L46 146 L90 170 Z" fill={C.white} {...line} />
      <path d="M138 196 L150 146 L106 170 Z" fill={C.white} {...line} />
      <circle cx={98} cy={216} r={54} fill={C.white} {...line} />
      <ellipse cx={80} cy={218} rx={6} ry={10} fill={C.ink} />
      <ellipse cx={116} cy={218} rx={6} ry={10} fill={C.ink} />
      <circle cx={66} cy={236} r={7} fill={C.orange} opacity={0.75} />
      <circle cx={130} cy={236} r={7} fill={C.orange} opacity={0.75} />
      <path d="M91 235 Q98 242 105 235" fill="none" {...thin} />
      {/* controller charm */}
      <rect x={152} y={222} width={136} height={86} rx={38} fill={C.violet} {...line} />
      <path
        d="M180 265 H214 M197 248 V282"
        stroke={C.white}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <circle cx={250} cy={250} r={9} fill={C.orange} {...thin} />
      <circle cx={232} cy={268} r={9} fill={C.lime} {...thin} />
      <circle cx={268} cy={268} r={9} fill={C.paper} {...thin} />
      <circle cx={250} cy={286} r={9} fill={C.ink} />
      {/* name tag */}
      <g transform="rotate(6 342 176)">
        <rect x={290} y={134} width={106} height={74} rx={16} fill={C.orange} {...line} />
        <circle cx={342} cy={148} r={6} fill={C.paper} {...thin} />
        <rect x={308} y={166} width={70} height={9} rx={4} fill={C.white} />
        <rect x={318} y={184} width={50} height={9} rx={4} fill={C.white} />
      </g>
    </g>
  );
}

const ART: Record<CategoryArtKey, () => React.JSX.Element> = {
  decor: Decor,
  desk: Desk,
  kitchen: Kitchen,
  figurine: Figurine,
  character: Character,
  experimental: Experimental,
  gift: Gift,
  hobby: Hobby,
  parts: Parts,
  sports: Sports,
  hotwheels: HotWheels,
  jewellery: Jewellery,
  anime: Anime,
  keychains: Keychains,
};

export function CategoryArt({ kind }: { kind: CategoryArtKey }) {
  const Art = ART[kind];
  return (
    <svg
      viewBox="0 0 440 380"
      role="img"
      aria-hidden="true"
      className={`cat-art cat-art--${kind}`}
      focusable="false"
    >
      <Art />
    </svg>
  );
}
