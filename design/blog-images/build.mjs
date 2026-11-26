/**
 * Draws every Knowledge hub illustration. All artwork is original: flat shapes in the brand
 * colours, drawn by this script. No stock, downloaded or AI-generated pictures are used here.
 *
 *   node design/blog-images/build.mjs            write svg/ and ../../content/blog/images/
 *
 * Needs the frontend dependencies (`npm install` in akrinity-web) and an installed Chrome.
 */
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const web = resolve(here, '../../akrinity-web');
const svgDir = join(here, 'svg');
const pngDir = resolve(here, '../../content/blog/images');
const require = createRequire(join(web, 'package.json'));

const W = 1600;
const H = 900;
const C = {
  ink: '#0B0B0C',
  paper: '#F3F1EA',
  white: '#FFFFFF',
  lime: '#D8FF3A',
  violet: '#5B2BE0',
  violet2: '#7A52EC',
  orange: '#FF6A1F',
  muted: '#55514A',
  frame: '#E4E1D7',
  shade: '#D6D2C6',
  stripe: '#E3DFD2',
  error: '#D92D20',
};
const LINE = 5;

/* ---------- shapes ---------- */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
const stroke = (sw = LINE, color = C.ink) => ({
  stroke: color,
  'stroke-width': sw,
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
});
const rect = (x, y, w, h, fill = C.white, r = 0, sw = LINE, extra = {}) =>
  `<rect ${attrs({ x, y, width: w, height: h, rx: r, fill, ...(sw ? stroke(sw) : {}), ...extra })}/>`;
const circle = (cx, cy, r, fill = C.white, sw = LINE, extra = {}) =>
  `<circle ${attrs({ cx, cy, r, fill, ...(sw ? stroke(sw) : {}), ...extra })}/>`;
const path = (d, fill = 'none', sw = LINE, extra = {}) =>
  `<path ${attrs({ d, fill, ...(sw ? stroke(sw) : {}), ...extra })}/>`;
const line = (x1, y1, x2, y2, sw = LINE, color = C.ink, extra = {}) =>
  `<line ${attrs({ x1, y1, x2, y2, ...stroke(sw, color), ...extra })}/>`;
const group = (x, y, s, body) => `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;
const shadow = (cx, cy, rx) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${Math.max(10, rx / 9)}" fill="#000" opacity="0.14"/>`;

/** Display text (Anton, capitals). */
const title = (x, y, s, size = 54, fill = C.ink, anchor = 'middle') =>
  `<text ${attrs({ x, y, fill, 'font-family': 'Anton', 'font-size': size, 'text-anchor': anchor })}>${esc(s.toUpperCase())}</text>`;
/** Body text (Inter). */
const label = (x, y, s, size = 32, fill = C.ink, anchor = 'middle', weight = 600) =>
  `<text ${attrs({ x, y, fill, 'font-family': 'Inter', 'font-weight': weight, 'font-size': size, 'text-anchor': anchor })}>${esc(s)}</text>`;

const card = (x, y, w, h, fill = C.white) =>
  rect(x + 10, y + 10, w, h, C.ink, 32, 0) + rect(x, y, w, h, fill, 32);
const pill = (cx, cy, s, fill = C.lime, color = C.ink, w) => {
  const width = w ?? s.length * 17 + 56;
  return rect(cx - width / 2, cy - 30, width, 60, fill, 30, 4) + label(cx, cy + 10, s, 28, color, 'middle', 700);
};

const tick = (cx, cy, r = 40, fill = C.lime) =>
  circle(cx, cy, r, fill) +
  path(`M${cx - r * 0.45} ${cy + r * 0.02} L${cx - r * 0.1} ${cy + r * 0.38} L${cx + r * 0.5} ${cy - r * 0.32}`, 'none', Math.max(5, r / 6));
const cross = (cx, cy, r = 40, fill = C.orange) =>
  circle(cx, cy, r, fill) +
  path(`M${cx - r * 0.38} ${cy - r * 0.38} L${cx + r * 0.38} ${cy + r * 0.38} M${cx + r * 0.38} ${cy - r * 0.38} L${cx - r * 0.38} ${cy + r * 0.38}`, 'none', Math.max(5, r / 6));
const arrow = (x1, y1, x2, y2, sw = 9, color = C.ink) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = sw * 3.2;
  const p = (da) => `${x2 - h * Math.cos(a + da)} ${y2 - h * Math.sin(a + da)}`;
  return line(x1, y1, x2, y2, sw, color) + path(`M${p(0.55)} L${x2} ${y2} L${p(-0.55)}`, 'none', sw, { stroke: color });
};

/** Vase silhouette: half width at height t (0 bottom, 1 top). */
const vaseProfile = (t) => 0.62 + 0.38 * Math.sin(t * Math.PI * 1.15 + 0.15) - (t > 0.82 ? (t - 0.82) * 0.4 : 0);
/** A vase built of stacked layers. `colours(i, t)` picks each layer's colour; `upto` prints part of it. */
function vase(cx, base, h, halfW, colours = (i) => (i % 2 ? C.violet2 : C.violet), n = 18, upto = 1, outline = true) {
  const lh = h / n;
  let out = '';
  for (let i = 0; i < Math.round(n * upto); i++) {
    const t = i / (n - 1);
    const w = halfW * vaseProfile(t);
    out += rect(cx - w, base - (i + 1) * lh, w * 2, lh + 1, colours(i, t), lh / 2, outline ? 3 : 0);
  }
  return out;
}

/** A flat desktop 3D printer with a part on the bed. 500 x 520 at scale 1, top-left origin. */
function printer(x, y, s = 1, upto = 0.65) {
  const base = 400;
  const h = 210;
  const headY = base - h * upto - 62;
  return group(
    x,
    y,
    s,
    shadow(250, 505, 260) +
      rect(30, 30, 36, 420, C.frame, 12) +
      rect(434, 30, 36, 420, C.frame, 12) +
      rect(30, 20, 440, 44, C.frame, 14) +
      circle(120, 22, 34, C.orange) +
      circle(120, 22, 10, C.white) +
      path(`M152 26 C 220 10, 250 ${headY - 70}, 250 ${headY}`, 'none', 4, { stroke: C.orange }) +
      rect(66, headY + 8, 368, 18, C.shade, 6) +
      rect(215, headY - 8, 70, 48, C.ink, 10) +
      path(`M236 ${headY + 40} L250 ${headY + 62} L264 ${headY + 40} Z`, C.orange, 4) +
      vase(250, base, h, 80, undefined, 18, upto) +
      rect(80, base, 340, 24, C.white, 8) +
      rect(10, 424, 480, 70, C.frame, 18) +
      rect(360, 440, 90, 38, C.ink, 8) +
      rect(370, 462, 48, 7, C.lime, 3, 0),
  );
}

function spool(cx, cy, r, colour) {
  let rings = '';
  for (let i = 1; i < 5; i++) rings += circle(cx, cy, r * (0.84 - i * 0.1), 'none', 2, { stroke: 'rgba(0,0,0,.28)' });
  return (
    circle(cx, cy, r, C.frame) +
    circle(cx, cy, r * 0.84, colour) +
    rings +
    circle(cx, cy, r * 0.34, C.white) +
    circle(cx, cy, r * 0.12, C.ink, 0)
  );
}

/** A die-cast style car, about 200 x 90, origin at its bottom-left. */
const car = (x, y, colour = C.orange, s = 1) =>
  group(
    x,
    y,
    s,
    path('M5 -25 Q8 -52 45 -54 L70 -82 Q80 -90 100 -90 L128 -90 Q142 -88 152 -74 L166 -54 Q196 -50 196 -30 L196 -22 L5 -22 Z', colour) +
      path('M78 -76 L100 -78 L100 -56 L62 -56 Z M112 -78 L132 -76 L148 -56 L112 -56 Z', C.white, 4) +
      circle(48, -22, 22, C.ink) +
      circle(48, -22, 8, C.white, 0) +
      circle(154, -22, 22, C.ink) +
      circle(154, -22, 8, C.white, 0),
  );

const parcel = (x, y, s = 1) =>
  group(
    x,
    y,
    s,
    path('M0 40 L90 0 L180 40 L90 80 Z', '#E9B77E') +
      path('M0 40 L90 80 L90 180 L0 140 Z', '#D99C5C') +
      path('M180 40 L90 80 L90 180 L180 140 Z', '#C98B4B') +
      path('M45 20 L135 60 L135 100 L117 92 L117 70 L27 28 Z', C.lime, 4),
  );

/** A document with a folded corner. */
const doc = (x, y, w, h, fill = C.white) =>
  path(`M${x} ${y} H${x + w - 46} L${x + w} ${y + 46} V${y + h} H${x} Z`, fill) +
  path(`M${x + w - 46} ${y} V${y + 46} H${x + w}`, C.stripe);
const textLines = (x, y, w, n, gap = 28) =>
  Array.from({ length: n }, (_, i) => line(x, y + i * gap, x + w - (i % 3) * 30, y + i * gap, 8, C.shade)).join('');

const cube = (x, y, s, top = C.violet2, left = C.violet, right = '#4A22BD') =>
  path(`M${x} ${y} l${s} ${-s / 2} l${s} ${s / 2} l${-s} ${s / 2} Z`, top) +
  path(`M${x} ${y} l${s} ${s / 2} v${s} l${-s} ${-s / 2} Z`, left) +
  path(`M${x + s * 2} ${y} l${-s} ${s / 2} v${s} l${s} ${-s / 2} Z`, right);

const nozzle = (cx, tipY, s = 1, tip = C.orange) =>
  group(
    cx,
    tipY,
    s,
    rect(-50, -170, 100, 90, C.ink, 14) +
      rect(-34, -82, 68, 34, C.frame, 6) +
      path('M-30 -48 L-10 0 L10 0 L30 -48 Z', tip),
  );

const drop = (cx, cy, s, fill = C.violet2) =>
  group(cx, cy, s, path('M0 -50 C 22 -16 34 2 34 18 A34 34 0 1 1 -34 18 C -34 2 -22 -16 0 -50 Z', fill));
const sun = (cx, cy, r) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return line(cx + Math.cos(a) * (r + 18), cy + Math.sin(a) * (r + 18), cx + Math.cos(a) * (r + 46), cy + Math.sin(a) * (r + 46), 9);
  }).join('') + circle(cx, cy, r, C.orange);

const magnifier = (cx, cy, r) =>
  line(cx + r * 0.72, cy + r * 0.72, cx + r * 1.55, cy + r * 1.55, r * 0.26) +
  circle(cx, cy, r, 'rgba(255,255,255,.22)', r * 0.1);

const ruler = (x, y, w, h = 70) =>
  rect(x, y, w, h, C.lime, 10) +
  Array.from({ length: Math.floor(w / 30) - 1 }, (_, i) => line(x + 30 * (i + 1), y, x + 30 * (i + 1), y + (i % 5 === 4 ? h * 0.55 : h * 0.3), 4)).join('');

const phoneStand = (x, y, s = 1) =>
  group(
    x,
    y,
    s,
    path('M0 0 H190 V-26 H150 L110 -170 L78 -160 L108 -26 H26 V-52 H0 Z', C.violet) +
      path('M46 -50 L96 -62 L66 -230 L16 -218 Z', C.ink) +
      path('M50 -66 L84 -74 L60 -212 L26 -204 Z', C.white, 3),
  );

const racket = (cx, cy, angle, colour) =>
  `<g transform="translate(${cx} ${cy}) rotate(${angle})">` +
  `<ellipse cx="0" cy="-120" rx="48" ry="66" fill="${C.white}" stroke="${colour}" stroke-width="13"/>` +
  [-24, 0, 24].map((i) => line(i, -178, i, -62, 2, C.muted)).join('') +
  [-150, -120, -90].map((j) => line(-40, j, 40, j, 2, C.muted)).join('') +
  line(0, -54, 0, 60, 9) +
  rect(-12, 40, 24, 80, C.ink, 8, 0) +
  '</g>';

const dots = (opacity = 0.09) =>
  `<defs><pattern id="d" width="52" height="52" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="3.4" fill="#000" opacity="${opacity}"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#d)"/>`;
const layers = (y, colour = 'rgba(0,0,0,.07)') =>
  Array.from({ length: Math.ceil((H - y) / 24) }, (_, i) => rect(0, y + i * 24, W, 12, colour, 0, 0)).join('');

const svg = (bg, body, deco = dots()) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${bg}"/>${deco}${body}</svg>`;

/* ---------- covers (important parts stay inside the middle 1380 px: cards crop to 16:10) ---------- */

const images = {};

images['cover-vs-printing'] = svg(
  C.lime,
  rect(800, 0, 800, H, C.violet, 0, 0) +
    shadow(420, 745, 270) +
    rect(285, 160, 270, 250, C.white, 12) +
    textLines(325, 215, 190, 5, 36) +
    rect(180, 380, 480, 250, C.frame, 36) +
    rect(250, 365, 340, 40, C.ink, 14) +
    rect(250, 560, 340, 175, C.white, 12) +
    textLines(290, 612, 260, 4, 34) +
    circle(600, 450, 18, C.orange) +
    circle(545, 450, 18, C.lime) +
    printer(940, 190, 1.1, 0.75),
  dots(),
);

images['cover-methods'] = svg(
  C.paper,
  card(130, 170, 410, 560, C.lime) +
    card(595, 170, 410, 560, C.violet) +
    card(1060, 170, 410, 560, C.orange) +
    nozzle(335, 440, 1.25) +
    vase(335, 640, 190, 110, undefined, 12) +
    rect(180, 640, 310, 26, C.white, 10) +
    rect(770, 230, 60, 150, C.frame, 8) +
    path('M758 380 H842 L842 440 L800 478 L758 440 Z', C.white) +
    path('M764 396 L838 420 M764 424 L826 444', 'none', 5) +
    path('M660 470 H740 L760 520 H840 L860 470 H940 V650 H660 Z', C.frame) +
    [0, 1, 2, 3].map((i) => rect(650 + i * 88, 665 + (i % 2) * 14, 26, 18, C.lime, 5, 3)).join('') +
    rect(1130, 330, 270, 140, C.frame, 18) +
    rect(1130, 500, 270, 140, C.frame, 18) +
    path('M1190 470 Q1265 380 1340 470 Z', C.white, 4) +
    path('M1190 500 Q1265 590 1340 500 Z', C.white, 4) +
    arrow(1265, 215, 1265, 305, 14),
);

images['cover-problems'] = svg(
  C.orange,
  card(150, 190, 600, 520) +
    card(850, 190, 600, 520) +
    rect(220, 610, 460, 30, C.frame, 10) +
    rect(380, 520, 140, 90, C.violet, 12) +
    path(
      'M450 515 C300 470 240 560 320 590 C420 620 330 400 460 380 C610 355 640 560 520 540 C400 520 560 300 400 300 C270 300 300 470 440 450 C600 428 680 330 560 300 C470 280 360 360 470 420 C560 470 650 450 640 590 C630 610 590 600 600 560',
      'none',
      11,
      { stroke: C.violet2 },
    ) +
    cross(660, 270, 48) +
    rect(920, 610, 460, 30, C.frame, 10) +
    vase(1150, 610, 320, 130) +
    tick(1360, 270, 48),
);

images['cover-materials'] = svg(
  C.paper,
  shadow(800, 710, 620) +
    spool(360, 510, 195, C.violet) +
    spool(720, 475, 230, C.orange) +
    spool(1065, 530, 175, C.white) +
    rect(1285, 330, 100, 70, C.ink, 14) +
    path('M1270 400 H1400 Q1440 420 1440 470 V690 Q1440 710 1420 710 H1250 Q1230 710 1230 690 V470 Q1230 420 1270 400 Z', C.violet2) +
    rect(1255, 500, 160, 120, C.lime, 14, 4) +
    drop(1335, 565, 0.75, C.violet),
  layers(710),
);

images['cover-design'] = svg(
  C.violet,
  card(210, 110, 1180, 680, C.white) +
    Array.from({ length: 22 }, (_, i) => line(260 + i * 50, 140, 260 + i * 50, 760, 2, C.stripe)).join('') +
    Array.from({ length: 12 }, (_, i) => line(240, 180 + i * 50, 1360, 180 + i * 50, 2, C.stripe)).join('') +
    path('M480 250 H630 V540 Q630 580 670 580 H1060 V690 H480 Z', C.lime, 7) +
    circle(555, 340, 34, C.white) +
    circle(555, 480, 34, C.white) +
    circle(930, 635, 30, C.white) +
    line(480, 215, 480, 190, 5) +
    line(1060, 215, 1060, 190, 5) +
    arrow(770, 200, 482, 200, 6) +
    arrow(770, 200, 1058, 200, 6) +
    line(1100, 580, 1140, 580, 5) +
    line(1100, 690, 1140, 690, 5) +
    arrow(1120, 520, 1120, 576, 6) +
    arrow(1120, 750, 1120, 694, 6) +
    pill(770, 150, '60 mm', C.white) +
    pill(1230, 635, '11 mm', C.white) +
    ruler(820, 360, 420),
);

images['cover-files'] = svg(
  C.lime,
  shadow(800, 745, 600) +
    ['STL', '3MF', 'STEP']
      .map((name, i) => {
        const x = 230 + i * 400;
        const y = i === 1 ? 140 : 200;
        const fill = [C.white, C.violet, C.orange][i];
        const color = i === 1 ? C.white : C.ink;
        const icon =
          i === 0
            ? path(`M${x + 70} ${y + 280} L${x + 170} ${y + 100} L${x + 270} ${y + 280} Z M${x + 120} ${y + 190} H${x + 220} L${x + 170} ${y + 280} Z`, C.violet2)
            : i === 1
              ? cube(x + 80, y + 170, 90, C.lime, C.white, C.frame)
              : path(`M${x + 80} ${y + 260} V${y + 160} Q${x + 80} ${y + 100} ${x + 170} ${y + 100} Q${x + 260} ${y + 100} ${x + 260} ${y + 160} V${y + 260} Z`, C.white) +
                circle(x + 170, y + 180, 40, C.lime);
        return doc(x, y, 340, 500, fill) + icon + title(x + 170, y + 430, name, 96, color);
      })
      .join(''),
);

images['cover-order'] = svg(
  C.paper,
  card(140, 270, 330, 360, C.white) +
    cube(215, 430, 90) +
    card(635, 220, 330, 460, C.lime) +
    textLines(685, 300, 230, 5, 46) +
    line(685, 560, 810, 560, 14) +
    tick(900, 600, 62, C.white) +
    card(1130, 270, 330, 360, C.violet) +
    parcel(1205, 360, 1) +
    arrow(495, 450, 610, 450, 14) +
    arrow(990, 450, 1105, 450, 14),
  layers(760),
);

images['cover-colour'] = svg(
  C.white,
  rect(800, 0, 800, H, C.lime, 0, 0) +
    shadow(450, 745, 240) +
    vase(450, 740, 580, 230, (i) => (i % 2 ? C.violet2 : C.violet), 24) +
    shadow(1150, 745, 240) +
    vase(1150, 740, 580, 230, (i) => [C.violet, C.orange, C.white, C.ink][Math.floor(i / 6)], 24),
  dots(),
);

images['cover-quality'] = svg(
  C.violet,
  shadow(640, 755, 300) +
    vase(640, 750, 540, 230, (i) => (i % 2 ? C.orange : '#FF8442'), 22) +
    magnifier(800, 420, 210) +
    tick(1230, 330, 130),
  dots(0.16),
);

images['cover-care'] = svg(
  C.paper,
  rect(150, 660, 1300, 42, C.violet, 14) +
    line(280, 705, 280, 790, 16) +
    line(1320, 705, 1320, 790, 16) +
    vase(520, 658, 400, 170) +
    path('M760 655 Q770 560 860 570 Q900 520 970 560 Q1070 560 1060 655 Z', C.lime) +
    path('M800 625 Q880 590 960 620 M840 590 Q900 575 960 590', 'none', 4) +
    sun(1220, 270, 90) +
    drop(900, 340, 1.8),
);

images['cover-products'] = svg(
  C.orange,
  rect(150, 420, 1300, 34, C.white, 12) +
    rect(150, 750, 1300, 34, C.white, 12) +
    car(200, 418, C.violet, 1.15) +
    car(470, 418, C.lime, 1.15) +
    vase(870, 418, 270, 105, (i) => (i % 2 ? C.white : C.frame), 15) +
    phoneStand(1120, 418, 1.15) +
    rect(230, 520, 400, 38, C.ink, 14) +
    racket(310, 650, -12, C.violet) +
    racket(430, 650, 0, C.lime) +
    racket(550, 650, 12, C.white) +
    rect(760, 610, 230, 140, C.violet, 18) +
    line(800, 610, 790, 500, 14, C.lime) +
    line(870, 610, 885, 490, 14, C.white) +
    rect(915, 540, 40, 70, C.lime, 8) +
    rect(1110, 720, 300, 30, C.ink, 10) +
    line(1260, 720, 1260, 510, 18) +
    rect(1150, 520, 220, 26, C.lime, 10) +
    circle(1200, 590, 45, 'none', 14, { stroke: C.violet }) +
    circle(1320, 600, 45, 'none', 14, { stroke: C.white }),
);

/* ---------- diagrams ---------- */

images['vs-flat-and-layers'] = svg(
  C.paper,
  card(90, 90, 680, 720) +
    card(830, 90, 680, 720) +
    title(430, 190, 'Paper printing', 66) +
    title(1170, 190, '3D printing', 66) +
    path('M200 520 L480 420 L670 500 L390 610 Z', C.white) +
    path('M300 520 L460 462 L560 505 L400 566 Z', C.violet, 0) +
    path('M200 520 V540 L390 630 L670 520 V500 L390 610 Z', C.shade) +
    label(430, 710, 'One thin coat of ink', 34) +
    label(430, 755, 'on a flat sheet', 34, C.muted, 'middle', 500) +
    Array.from({ length: 9 }, (_, i) =>
      path(`M980 ${590 - i * 34} L1170 ${660 - i * 34} L1360 ${590 - i * 34} L1170 ${520 - i * 34} Z`, i % 2 ? C.violet2 : C.violet),
    ).join('') +
    arrow(1430, 620, 1430, 300, 10) +
    label(1170, 710, 'Many layers stacked', 34) +
    label(1170, 755, 'into a solid shape', 34, C.muted, 'middle', 500),
);

images['vs-model-slice-print'] = svg(
  C.paper,
  [
    ['1. Model', 'Design the shape in 3D'],
    ['2. Slice', 'Cut it into layers'],
    ['3. Print', 'Build from the bottom up'],
  ]
    .map(([h, s], i) => {
      const x = 80 + i * 500;
      return card(x, 110, 430, 680) + title(x + 215, 215, h, 62) + label(x + 215, 730, s, 30);
    })
    .join('') +
    Array.from({ length: 19 }, (_, i) => {
      const t = i / 18;
      return `<ellipse cx="295" cy="${620 - i * 18}" rx="${130 * vaseProfile(t)}" ry="22" fill="none" stroke="${C.violet}" stroke-width="3"/>`;
    }).join('') +
    path(
      `M${295 - 130 * vaseProfile(0)} 620 ${Array.from({ length: 19 }, (_, i) => `L${295 - 130 * vaseProfile(i / 18)} ${620 - i * 18}`).join(' ')} M${295 + 130 * vaseProfile(0)} 620 ${Array.from({ length: 19 }, (_, i) => `L${295 + 130 * vaseProfile(i / 18)} ${620 - i * 18}`).join(' ')}`,
      'none',
      5,
    ) +
    Array.from({ length: 9 }, (_, i) => {
      const w = 130 * vaseProfile(i / 8);
      return rect(795 - w, 612 - i * 42, w * 2, 22, i % 2 ? C.lime : C.orange, 11, 4);
    }).join('') +
    rect(1130, 630, 330, 24, C.frame, 8) +
    vase(1295, 630, 340, 130) +
    arrow(522, 450, 568, 450, 12) +
    arrow(1022, 450, 1068, 450, 12),
);

images['make-add-remove-mould'] = svg(
  C.paper,
  [
    ['Add', '3D printing', C.lime],
    ['Remove', 'CNC machining', C.white],
    ['Mould', 'Injection moulding', C.white],
  ]
    .map(([h, s], i) => {
      const x = 80 + i * 500;
      return card(x, 110, 430, 680) + title(x + 215, 215, h, 66) + pill(x + 215, 730, s, C.lime);
    })
    .join('') +
    nozzle(340, 420, 1.1) +
    vase(295, 630, 190, 120, undefined, 10) +
    path('M340 420 L400 428', 'none', 12, { stroke: C.orange }) +
    rect(150, 630, 290, 22, C.frame, 8) +
    rect(640, 440, 310, 200, C.stripe, 10, 4, { 'stroke-dasharray': '14 12' }) +
    path('M640 640 V530 H720 Q740 470 800 470 Q860 470 870 540 H950 V640 Z', C.violet) +
    rect(840, 270, 46, 110, C.frame, 6) +
    path('M828 380 H898 V420 L863 455 L828 420 Z', C.white) +
    path('M690 440 l30 -34 l18 38 Z M750 400 l34 6 l-16 28 Z M630 400 l26 -10 l4 30 Z', C.orange, 4) +
    path('M1140 350 H1420 V470 H1330 Q1330 420 1280 420 Q1230 420 1230 470 H1140 Z', C.frame) +
    path('M1140 480 H1230 Q1230 580 1280 580 Q1330 580 1330 480 H1420 V640 H1140 Z', C.frame) +
    path('M1238 476 Q1238 432 1280 432 Q1322 432 1322 476 Q1322 570 1280 570 Q1238 570 1238 476 Z', C.orange, 4) +
    line(1090, 475, 1230, 475, 14, C.orange) +
    arrow(1088, 475, 1132, 475, 8, C.ink),
);

images['make-cost-curve'] = svg(
  C.white,
  title(800, 100, 'How cost per part changes with quantity', 62) +
    arrow(240, 720, 1450, 720, 8) +
    arrow(240, 720, 240, 150, 8) +
    label(845, 790, 'Number of identical parts', 34) +
    `<g transform="translate(160 440) rotate(-90)">${label(0, 0, 'Cost per part', 34)}</g>` +
    path('M290 180 C 380 520, 640 640, 1390 665', 'none', 14, { stroke: C.violet }) +
    path('M290 490 C 600 520, 1000 535, 1390 540', 'none', 14, { stroke: C.orange }) +
    pill(520, 280, 'Moulding', C.violet, C.white) +
    pill(1230, 475, '3D printing', C.orange) +
    line(668, 250, 668, 720, 4, C.ink, { 'stroke-dasharray': '14 14' }) +
    pill(668, 215, 'Lines cross', C.lime) +
    label(800, 855, 'A sketch of the pattern only. Real figures depend on the part.', 28, C.muted, 'middle', 500),
  '',
);

const faultTile = (i, name, draw) => {
  const x = 70 + (i % 3) * 500;
  const y = 60 + Math.floor(i / 3) * 400;
  return card(x, y, 450, 360) + group(x, y, 1, rect(55, 262, 340, 20, C.frame, 8, 4) + draw) + pill(x + 225, y + 322, name);
};
images['problems-six-faults'] = svg(
  C.paper,
  faultTile(0, 'Warping', path('M95 215 Q130 250 180 258 H270 Q320 250 355 215 V90 Q320 130 270 135 H180 Q130 130 95 90 Z', C.violet) + arrow(70, 250, 70, 195, 7, C.orange) + arrow(380, 250, 380, 195, 7, C.orange)) +
    faultTile(1, 'Stringing', rect(95, 80, 80, 182, C.violet, 10) + rect(275, 80, 80, 182, C.violet, 10) + [100, 128, 150, 185, 212].map((v, k) => path(`M175 ${v} Q225 ${v + 18 + k * 4} 275 ${v + 6}`, 'none', 3, { stroke: C.violet2 })).join('')) +
    faultTile(2, 'Elephant foot', path('M145 60 H305 V210 Q350 222 350 242 Q350 262 320 262 H130 Q100 262 100 242 Q100 222 145 210 Z', C.violet) + arrow(60, 237, 92, 237, 7, C.orange) + arrow(390, 237, 358, 237, 7, C.orange)) +
    faultTile(3, 'Layer shift', rect(115, 165, 180, 97, C.violet, 8) + rect(165, 68, 180, 97, C.violet2, 8) + arrow(100, 115, 150, 115, 7, C.orange)) +
    faultTile(4, 'Under-extrusion', Array.from({ length: 10 }, (_, k) => {
      const yy = 72 + k * 19;
      return k % 3 === 1 ? rect(115, yy, 60, 15, C.violet, 7, 3) + rect(215, yy, 40, 15, C.violet, 7, 3) + rect(300, yy, 35, 15, C.violet, 7, 3) : rect(115, yy, 220, 15, C.violet, 7, 3);
    }).join('')) +
    faultTile(5, 'Split layers', rect(135, 168, 180, 94, C.violet, 8) + path('M135 60 H315 V135 L135 160 Z', C.violet2) + arrow(375, 90, 335, 148, 7, C.orange)),
);

images['problems-first-layer'] = svg(
  C.paper,
  [
    ['Too high', 'Round lines that do not touch', false],
    ['About right', 'Flat lines joined edge to edge', true],
    ['Too low', 'Squashed ridges and drag marks', false],
  ]
    .map(([h, s, good], i) => {
      const x = 80 + i * 500;
      const bed = 560;
      let beads = '';
      if (i === 0) beads = [0, 1, 2, 3].map((k) => circle(x + 80 + k * 90, bed - 30, 30, C.violet)).join('');
      if (i === 1) beads = [0, 1, 2, 3].map((k) => rect(x + 55 + k * 80, bed - 40, 80, 40, k % 2 ? C.violet2 : C.violet, 18)).join('');
      if (i === 2) beads = path(`M${x + 50} ${bed} L${x + 70} ${bed - 14} L${x + 105} ${bed - 46} L${x + 125} ${bed - 10} L${x + 190} ${bed - 14} L${x + 225} ${bed - 52} L${x + 245} ${bed - 10} L${x + 300} ${bed - 14} L${x + 340} ${bed - 44} L${x + 380} ${bed} Z`, C.violet);
      const tipY = [bed - 125, bed - 44, bed - 14][i];
      return card(x, 110, 430, 680) + title(x + 215, 210, h, 62) + nozzle(x + 360, tipY, 0.9) + beads + rect(x + 35, bed, 360, 30, C.frame, 8) + (good ? tick(x + 215, 655, 42) : cross(x + 215, 655, 42)) + label(x + 215, 750, s, 26);
    })
    .join(''),
);

images['materials-heat'] = svg(
  C.white,
  title(800, 110, 'Where each filament starts to soften', 62) +
    label(800, 165, 'Approximate glass transition ranges in °C. Brands differ.', 30, C.muted, 'middle', 500) +
    [40, 60, 80, 100, 120]
      .map((t) => {
        const x = 380 + ((t - 40) / 80) * 1100;
        return line(x, 220, x, 730, 3, C.stripe) + label(x, 785, `${t} °C`, 30);
      })
      .join('') +
    [
      ['PLA', 55, 60, C.lime],
      ['PETG', 75, 85, C.orange],
      ['ABS / ASA', 95, 105, C.violet],
    ]
      .map(([name, a, b, fill], i) => {
        const y = 290 + i * 160;
        const x1 = 380 + ((a - 40) / 80) * 1100;
        const x2 = 380 + ((b - 40) / 80) * 1100;
        return title(120, y + 56, name, 54, C.ink, 'start') + line(380, y + 38, x1, y + 38, 6, C.shade) + rect(x1, y, x2 - x1, 76, fill, 22) + label(x2 + 24, y + 50, `${a} to ${b}`, 32, C.ink, 'start', 700);
      })
      .join(''),
  '',
);

images['materials-where'] = svg(
  C.paper,
  [
    ['Indoor decor', 'PLA / PLA+', C.lime],
    ['Handled parts', 'PETG', C.orange],
    ['Outdoors', 'ASA', C.violet],
    ['Fine detail', 'Resin', C.white],
  ]
    .map(([place, mat, fill], i) => {
      const x = 60 + i * 380;
      const cx = x + 170;
      const art = [
        vase(cx, 560, 270, 100, undefined, 14),
        path(`M${x + 70} 330 H${x + 150} V470 Q${x + 150} 490 ${x + 170} 490 H${x + 270} V560 H${x + 70} Z`, C.violet) + circle(x + 110, 370, 15, C.white) + circle(x + 110, 440, 15, C.white),
        sun(cx + 50, 310, 50) + rect(x + 62, 420, 170, 100, C.white, 14) + label(x + 147, 484, 'Studio', 34) + line(x + 147, 520, x + 147, 566, 14),
        circle(cx, 350, 55, C.violet2) + path(`M${cx - 75} 540 Q${cx - 70} 420 ${cx} 415 Q${cx + 70} 420 ${cx + 75} 540 Z`, C.violet) + rect(cx - 100, 540, 200, 30, C.ink, 8),
      ][i];
      return card(x, 140, 340, 620) + art + title(cx, 655, place, 44) + pill(cx, 715, mat, fill, fill === C.violet ? C.white : C.ink);
    })
    .join(''),
);

images['design-walls-clearance'] = svg(
  C.paper,
  card(90, 90, 680, 720) +
    card(830, 90, 680, 720) +
    title(430, 185, 'Wall thickness', 60) +
    title(1170, 185, 'Clearance', 60) +
    rect(250, 270, 22, 350, C.violet, 6) +
    rect(510, 270, 92, 350, C.violet, 8) +
    rect(170, 620, 520, 30, C.frame, 8) +
    cross(262, 700, 30) +
    tick(556, 700, 30) +
    label(262, 770, 'Too thin to carry load', 28) +
    label(580, 770, 'About 2 mm', 28) +
    path('M960 330 H1090 V610 H1250 V330 H1380 V690 H960 Z', C.violet) +
    rect(1112, 270, 116, 316, C.lime, 8) +
    arrow(1060, 262, 1096, 320, 6) +
    arrow(1280, 262, 1244, 320, 6) +
    label(1170, 750, 'Sliding fit: about 0.2 to 0.3 mm each side', 28),
);

images['design-overhang-angles'] = svg(
  C.paper,
  [
    [30, 'Prints cleanly', 'good'],
    [45, 'Usual limit', 'good'],
    [70, 'Needs support', 'bad'],
  ]
    .map(([deg, s, kind], i) => {
      const x = 80 + i * 500;
      const base = 620;
      const h = 270;
      const dx = Math.min(250, h * Math.tan((deg * Math.PI) / 180));
      const rise = dx / Math.tan((deg * Math.PI) / 180);
      const x0 = x + (kind === 'bad' ? 55 : 70);
      const steps = Array.from({ length: Math.floor(rise / 22) }, (_, k) => {
        const off = ((k * 22) / rise) * dx;
        const sag = kind === 'bad' && k > 2 ? (k - 2) * 2.5 : 0;
        return rect(x0 + off, base - (k + 1) * 22 + sag, kind === 'bad' ? 120 : 90, 22, k % 2 ? C.violet2 : C.violet, 10, 3);
      }).join('');
      return (
        card(x, 110, 430, 680) +
        title(x + 215, 225, `${deg} degrees`, 62) +
        line(x0, base, x0, base - 290, 4, C.ink, { 'stroke-dasharray': '12 12' }) +
        steps +
        rect(x + 40, base, 350, 24, C.frame, 8) +
        (kind === 'good' ? tick(x + 215, 695, 32) : cross(x + 215, 695, 32)) +
        label(x + 215, 765, s, 30)
      );
    })
    .join('') + label(800, 855, 'Angles are measured from vertical.', 28, C.muted, 'middle', 500),
);

const polygon = (cx, cy, r, n, fill) =>
  path(
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ') + ' Z',
    fill,
    7,
  ) +
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return line(cx, cy, cx + r * Math.cos(a), cy + r * Math.sin(a), n > 20 ? 1.2 : 3, 'rgba(11,11,12,.45)') + (n > 20 ? '' : circle(cx + r * Math.cos(a), cy + r * Math.sin(a), 9, C.white, 4));
  }).join('');

images['files-resolution'] = svg(
  C.paper,
  card(90, 90, 680, 720) +
    card(830, 90, 680, 720) +
    title(430, 185, 'Coarse export', 60) +
    title(1170, 185, 'Fine export', 60) +
    polygon(430, 470, 230, 9, C.orange) +
    polygon(1170, 470, 230, 64, C.lime) +
    label(430, 765, 'Flat faces show on curves', 32) +
    label(1170, 765, 'Curves print smooth', 32),
);

images['files-watertight'] = svg(
  C.paper,
  card(90, 90, 680, 720) +
    card(830, 90, 680, 720) +
    title(430, 185, 'Closed', 60) +
    title(1170, 185, 'Open', 60) +
    cube(250, 400, 180) +
    path('M990 400 l180 -90 l180 90 l-180 90 Z', C.ink) +
    path('M990 400 l180 90 v180 l-180 -90 Z', C.violet) +
    path('M1350 400 l-180 90 v180 l180 -90 Z', '#4A22BD') +
    path('M1030 300 l180 -90 l180 90', 'none', 5, { 'stroke-dasharray': '14 14' }) +
    tick(260, 700, 40) +
    label(470, 712, 'A clear inside', 34) +
    cross(1000, 700, 40) +
    label(1220, 712, 'A missing face', 34),
);

images['order-checklist'] = svg(
  C.violet,
  card(330, 60, 940, 770) +
    title(800, 155, 'What to send', 70) +
    ['3D file or sketch', 'Size in millimetres', 'Material, or "not sure"', 'Colour', 'Quantity', 'Date you need it', 'How it will be used']
      .map((s, i) => {
        const y = 235 + i * 82;
        return tick(440, y, 28) + label(505, y + 13, s, 38, C.ink, 'start') + (i < 6 ? line(505, y + 40, 1170, y + 40, 3, C.stripe) : '');
      })
      .join(''),
  dots(0.16),
);

images['order-steps'] = svg(
  C.paper,
  ['Send your file', 'Get a quote', 'Approve and pay', 'Print and check', 'Delivery']
    .map((s, i) => {
      const x = 55 + i * 305;
      const cx = x + 135;
      const art = [
        doc(cx - 70, 340, 140, 180) + arrow(cx, 490, cx, 390, 10, C.violet),
        doc(cx - 70, 340, 140, 180, C.lime) + textLines(cx - 42, 400, 90, 4, 28),
        rect(cx - 85, 370, 170, 120, C.white, 18) + rect(cx - 85, 395, 170, 28, C.ink, 0, 0) + tick(cx + 60, 490, 40),
        printer(cx - 100, 330, 0.4, 0.7),
        parcel(cx - 90, 340, 1),
      ][i];
      return card(x, 190, 270, 520) + circle(cx, 265, 40, i % 2 ? C.orange : C.violet) + title(cx, 281, String(i + 1), 44, i % 2 ? C.ink : C.white) + art + label(cx, 640, s, 27, C.ink, 'middle', 700) + (i < 4 ? arrow(x + 275, 450, x + 303, 450, 7) : '');
    })
    .join(''),
  layers(780),
);

images['colour-purge'] = svg(
  C.paper,
  rect(150, 690, 1300, 36, C.frame, 12) +
    vase(520, 690, 520, 200, (i) => [C.violet, C.orange, C.lime][i % 3], 24) +
    Array.from({ length: 24 }, (_, i) => rect(1030, 690 - (i + 1) * 21.6, 190, 22, [C.violet, C.orange, C.lime][i % 3], 6, 3)).join('') +
    pill(520, 795, 'Printed part') +
    pill(1125, 795, 'Purge tower (waste)', C.white) +
    arrow(1000, 400, 760, 400, 8) +
    label(885, 365, 'flush', 32),
);

const figure = (cx, c) =>
  circle(cx, 335, 78, c.head) +
  path(`M${cx - 120} 580 Q${cx - 115} 420 ${cx} 415 Q${cx + 115} 420 ${cx + 120} 580 Z`, c.body) +
  rect(cx - 135, 580, 270, 46, c.base, 14) +
  circle(cx - 28, 325, 9, C.ink, 0) +
  circle(cx + 28, 325, 9, C.ink, 0) +
  path(`M${cx - 26} 365 Q${cx} 385 ${cx + 26} 365`, 'none', 5);
images['colour-three-routes'] = svg(
  C.paper,
  ['Single colour', 'Multi-colour', 'Painted']
    .map((h, i) => {
      const x = 80 + i * 500;
      const cx = x + 215;
      const c = [
        { head: C.violet2, body: C.violet2, base: C.violet2 },
        { head: C.lime, body: C.violet, base: C.orange },
        { head: '#F0C9A4', body: C.violet, base: C.shade },
      ][i];
      const shading =
        i === 2
          ? path(`M${cx + 30} 425 Q${cx + 112} 445 ${cx + 117} 576 L${cx + 55} 576 Q${cx + 70} 480 ${cx + 30} 425 Z`, '#3D1AA6', 0) +
            circle(cx - 48, 355, 15, '#F2918A', 0) +
            circle(cx + 48, 355, 15, '#F2918A', 0) +
            path(`M${cx - 76} 318 Q${cx - 60} 240 ${cx + 10} 255 Q${cx + 75} 260 ${cx + 77} 322 Q${cx + 20} 270 ${cx - 76} 318 Z`, '#6B3E26', 4) +
            circle(cx, 500, 22, C.lime, 4)
          : '';
      return card(x, 110, 430, 680) + title(cx, 210, h, 58) + figure(cx, c) + shading + label(cx, 730, ['One spool, top to bottom', 'Spools change during printing', 'Colour added by hand'][i], 28);
    })
    .join(''),
);

images['quality-checks'] = svg(
  C.lime,
  [
    ['Layer bonding', 'No cracks or gaps'],
    ['Dimensions', 'Key sizes compared'],
    ['Surface finish', 'Cleaned and inspected'],
    ['Packing', 'Delicate points protected'],
  ]
    .map(([h, s], i) => {
      const x = 60 + i * 380;
      const cx = x + 170;
      const art = [
        vase(cx, 570, 280, 100, undefined, 16) + magnifier(cx + 30, 420, 62),
        cube(cx - 85, 385, 85) + ruler(cx - 120, 555, 240, 46),
        vase(cx, 570, 280, 100, (k) => (k % 2 ? C.orange : '#FF8442'), 16) + tick(cx + 90, 340, 40),
        parcel(cx - 90, 350, 1),
      ][i];
      return card(x, 140, 340, 620) + circle(x + 62, 202, 32, C.violet) + title(x + 62, 215, String(i + 1), 36, C.white) + art + title(cx, 665, h, 42) + label(cx, 715, s, 24, C.muted);
    })
    .join(''),
);

images['care-dos'] = svg(
  C.paper,
  [
    ['Wipe gently', 'Soft cloth, mild soap', true],
    ['Keep cool', 'No hot cars or stoves', false],
    ['No dishwasher', 'Hand wash only', false],
    ['Do not overload', 'Carry what it is made for', false],
  ]
    .map(([h, s, good], i) => {
      const x = 60 + i * 380;
      const cx = x + 170;
      const art = [
        path(`M${cx - 120} 490 Q${cx - 110} 390 ${cx - 30} 405 Q${cx + 10} 350 ${cx + 70} 400 Q${cx + 135} 405 ${cx + 115} 490 Z`, C.lime) + drop(cx + 70, 330, 0.9),
        sun(cx, 405, 70),
        rect(cx - 105, 300, 210, 240, C.white, 22) + line(cx - 105, 360, cx + 105, 360) + circle(cx - 65, 330, 9, C.ink, 0) + circle(cx, 450, 58, C.frame) + drop(cx, 452, 0.8),
        rect(cx - 125, 470, 250, 28, C.violet, 8) + line(cx - 95, 500, cx - 95, 545, 14) + rect(cx - 70, 330, 140, 140, C.ink, 20) + title(cx, 425, 'kg', 54, C.white),
      ][i];
      return card(x, 140, 340, 620) + art + (good ? tick(x + 275, 230, 36) : cross(x + 275, 230, 36)) + title(cx, 650, h, 42) + label(cx, 710, s, 24, C.muted);
    })
    .join(''),
);

images['care-layer-grooves'] = svg(
  C.white,
  title(540, 120, 'A printed wall, zoomed in', 62) +
    rect(150, 190, 200, 620, C.violet, 0, 0) +
    path(
      `M150 190 H350 ${Array.from({ length: 7 }, (_, i) => `C 500 ${190 + i * 88.6} 500 ${190 + (i + 1) * 88.6} 350 ${190 + (i + 1) * 88.6}`).join(' ')} H150 Z`,
      C.violet,
      7,
    ) +
    Array.from({ length: 6 }, (_, i) => line(150, 190 + (i + 1) * 88.6, 350, 190 + (i + 1) * 88.6, 4, C.violet2)).join('') +
    [1, 3, 5]
      .map((i) => {
        const y = 190 + i * 88.6;
        return circle(398, y - 8, 15, C.orange, 4) + circle(425, y + 12, 9, C.orange, 4) + circle(376, y + 8, 8, C.lime, 3);
      })
      .join('') +
    magnifier(980, 460, 230) +
    path('M860 330 C 960 330 960 420 860 420 C 960 420 960 510 860 510 C 960 510 960 600 860 600 H800 V330 Z', C.violet) +
    circle(900, 420, 20, C.orange, 4) +
    circle(928, 508, 14, C.orange, 4) +
    circle(894, 512, 10, C.lime, 3) +
    arrow(660, 460, 470, 366, 8) +
    pill(640, 840, 'Residue collects in grooves', C.lime, C.ink, 480),
  '',
);

images['products-range'] = svg(
  C.paper,
  card(80, 80, 1440, 740) +
    rect(150, 390, 1300, 30, C.violet, 10) +
    rect(150, 690, 1300, 30, C.violet, 10) +
    car(190, 388, C.orange, 1) +
    car(410, 388, C.lime, 1) +
    pill(390, 460, 'Car displays') +
    rect(680, 190, 260, 34, C.ink, 12) +
    racket(730, 290, -10, C.violet) +
    racket(810, 290, 0, C.orange) +
    racket(890, 290, 10, C.ink) +
    pill(810, 460, 'Racket mounts') +
    vase(1230, 388, 250, 100, (i) => (i % 2 ? C.orange : '#FF8442'), 14) +
    pill(1230, 460, 'Decor') +
    phoneStand(300, 688, 0.76) +
    pill(390, 760, 'Desk organisers') +
    rect(720, 560, 180, 130, C.frame, 16) +
    line(750, 560, 742, 500, 12, C.violet) +
    line(810, 560, 822, 490, 12, C.orange) +
    rect(850, 525, 32, 35, C.lime, 6) +
    pill(810, 760, 'Holders') +
    path('M1140 560 H1190 V640 H1310 V690 H1140 Z', C.lime) +
    circle(1165, 590, 10, C.white) +
    circle(1265, 666, 10, C.white) +
    pill(1230, 760, 'Custom parts', C.orange),
);

/* ---------- write the files ---------- */

const font = (pkg, file) => readFileSync(join(web, 'node_modules', pkg, 'files', file)).toString('base64');
const face = (family, data, weight) =>
  `@font-face{font-family:${family};font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2')}`;
const css =
  face('Anton', font('@fontsource/anton', 'anton-latin-400-normal.woff2'), '400') +
  face('Inter', font('@fontsource-variable/inter', 'inter-latin-wght-normal.woff2'), '100 900');

mkdirSync(svgDir, { recursive: true });
mkdirSync(pngDir, { recursive: true });
const only = process.argv.slice(2);
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
let count = 0;
for (const [name, markup] of Object.entries(images)) {
  if (only.length && !only.includes(name)) continue;
  writeFileSync(join(svgDir, `${name}.svg`), markup + '\n');
  await page.setContent(`<style>${css}html,body{margin:0}svg{display:block}</style>${markup}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(pngDir, `${name}.png`) });
  count++;
}
await browser.close();
console.log(`${count} images written to ${pngDir}`);
