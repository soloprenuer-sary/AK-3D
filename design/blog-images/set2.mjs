/**
 * Illustrations for the second batch of articles (25 covers and 50 pictures inside), in the same
 * flat style as the first batch. Called by build.mjs with its drawing helpers.
 */
export default function secondSet(S) {
  const { W, H, C, rect, circle, path, line, group, shadow, title, label, card, pill, tick, cross, arrow, vase, printer, spool, car, parcel, doc, textLines, cube, nozzle, drop, sun, magnifier, ruler, phoneStand, racket, dots, layers, svg } = S;
  const images = {};
  const DEEP = '#4A22BD';
  const WOOD = '#D99C5C';
  const SKIN = '#F0C9A4';
  const inkOn = (fill) => (fill === C.violet || fill === C.ink ? C.white : C.ink);

  /* ---------- extra shapes ---------- */

  const bottle = (cx, base, s, fill = C.violet2) =>
    group(cx, base, s, rect(-42, -300, 84, 56, C.ink, 12) + path('M-58 -244 H58 Q95 -224 95 -180 V-20 Q95 0 75 0 H-75 Q-95 0 -95 -20 V-180 Q-95 -224 -58 -244 Z', fill) + rect(-68, -160, 136, 96, C.lime, 12, 4) + drop(0, -108, 0.6, C.violet));
  const dome = (cx, base, r, n, fill = C.violet, alt = C.violet2) => {
    const lh = r / n;
    return Array.from({ length: n }, (_, i) => {
      const w = Math.sqrt(Math.max(0, r * r - (i * lh) ** 2));
      return rect(cx - w, base - (i + 1) * lh, w * 2, lh, i % 2 ? alt : fill, Math.min(lh / 2, 8), n > 24 ? 1.5 : 4);
    }).join('');
  };
  const column = (cx, base, w, h, n, fill = C.violet, alt = C.violet2) =>
    Array.from({ length: n }, (_, i) => rect(cx - w / 2, base - ((i + 1) * h) / n, w, h / n, i % 2 ? alt : fill, Math.min(h / n / 2, 18), n > 20 ? 2 : 4)).join('');
  const bar = (x, y, w = 340) => rect(x, y, w, 24, C.frame, 8, 4);
  const cloud = (cx, cy, s, fill = C.white) =>
    group(cx, cy, s, path('M-110 40 Q-150 40 -150 5 Q-150 -35 -100 -35 Q-90 -90 -20 -85 Q20 -120 70 -80 Q140 -80 135 -20 Q165 -10 150 20 Q145 40 110 40 Z', fill));
  const rain = (cx, cy, s) => cloud(cx, cy, s) + [-80, 0, 80].map((d, i) => drop(cx + d * s, cy + (110 + (i % 2) * 40) * s, 0.55 * s)).join('');
  const leaf = (cx, cy, s, fill = C.lime) => group(cx, cy, s, path('M-80 60 Q-90 -60 80 -80 Q90 60 -40 80 Z', fill) + path('M-90 80 Q-20 20 50 -45', 'none', 6));
  const plant = (cx, base, s, pot = C.orange) =>
    group(cx, base, s, leaf(-55, -190, 0.8) + group(50, -215, 0.8, `<g transform="scale(-1 1)">${leaf(0, 0, 1)}</g>`) + leaf(0, -250, 0.7) + line(0, -120, 0, -230, 8) + path('M-90 -130 H90 L65 0 H-65 Z', pot) + rect(-102, -148, 204, 30, pot, 8));
  const gift = (x, y, s, fill = C.violet, ribbon = C.lime) =>
    group(x, y, s, rect(0, 50, 220, 170, fill, 14) + rect(-14, 30, 248, 48, fill, 12) + rect(92, 30, 36, 190, ribbon, 4) + path('M110 30 Q40 -50 55 5 Q65 35 110 30 Q180 -50 165 5 Q155 35 110 30 Z', ribbon));
  const brush = (x, y, angle, fill = C.orange) =>
    `<g transform="translate(${x} ${y}) rotate(${angle})">${rect(-18, -190, 36, 200, WOOD, 16)}${rect(-30, 0, 60, 50, C.frame, 6)}${path('M-30 50 H30 Q34 110 0 140 Q-34 110 -30 50 Z', fill)}</g>`;
  const tube = (x, y, angle, fill = C.orange, cap = C.ink) =>
    `<g transform="translate(${x} ${y}) rotate(${angle})">${path('M-55 -150 H55 L42 90 H-42 Z', fill)}${rect(-62, -170, 124, 26, C.frame, 6)}${rect(-18, 90, 36, 40, C.frame, 4)}${path('M-14 130 L14 130 L4 172 L-4 172 Z', cap)}${rect(-32, -70, 64, 80, C.white, 8, 4)}</g>`;
  const gearShape = (cx, cy, r, fill = C.lime) =>
    Array.from({ length: 8 }, (_, i) => `<g transform="rotate(${i * 45} ${cx} ${cy})">${rect(cx - r * 0.18, cy - r * 1.28, r * 0.36, r * 0.42, fill, 6, 4)}</g>`).join('') + circle(cx, cy, r, fill) + circle(cx, cy, r * 0.36, C.white);
  const caliper = (x, y, s, gap = 160) =>
    group(x, y, s, rect(0, 0, 620, 60, C.frame, 8) + Array.from({ length: 24 }, (_, i) => line(40 + i * 24, 0, 40 + i * 24, i % 5 ? 18 : 30, 3)).join('') + path('M0 0 V250 L50 220 V0 Z', C.frame) + path(`M${gap + 50} 0 V220 L${gap + 100} 250 V0 Z`, C.frame) + rect(gap + 40, -22, 190, 104, C.violet, 14) + rect(gap + 70, 4, 130, 48, C.lime, 8, 4) + title(gap + 135, 42, '42.0', 34));
  const bracket = (x, y, s, fill = C.violet) => group(x, y, s, path('M0 0 H80 V150 Q80 180 110 180 H260 V260 H0 Z', fill) + circle(40, 55, 16, C.white, 4) + circle(205, 220, 16, C.white, 4));
  const hookShape = (x, y, s, fill = C.violet) => group(x, y, s, path('M0 0 H60 V150 Q60 175 85 175 H130 Q150 175 150 150 V120 H200 V170 Q200 235 135 235 H0 Z', fill) + circle(30, 45, 13, C.white, 4));
  const laptop = (x, y, s, screen = C.violet) =>
    group(x, y, s, rect(40, 0, 380, 250, C.ink, 18) + rect(58, 18, 344, 214, screen, 8, 0) + path('M0 250 H460 L430 290 H30 Z', C.frame) + rect(180, 258, 100, 12, C.shade, 6, 0));
  const monitor = (x, y, s) => group(x, y, s, rect(0, 0, 360, 220, C.ink, 16) + rect(16, 16, 328, 188, C.violet, 6, 0) + rect(160, 220, 40, 60, C.frame, 4) + rect(100, 276, 160, 22, C.frame, 8));
  const person = (cx, base, s, shirt = C.violet) => group(cx, base, s, circle(0, -190, 52, SKIN) + path('M-85 0 Q-85 -120 0 -125 Q85 -120 85 0 Z', shirt));
  const bulb = (cx, cy, s, fill = C.lime) => group(cx, cy, s, circle(0, -30, 80, fill) + rect(-38, 40, 76, 62, C.frame, 12) + line(-34, 62, 34, 62, 5) + line(-34, 82, 34, 82, 5) + path('M-24 40 L-10 -20 H10 L24 40', 'none', 5));
  const shop = (x, y, s) =>
    group(x, y, s, rect(0, 90, 420, 270, C.white, 8) + path('M-20 90 L20 0 H400 L440 90 Z', C.orange) + [0, 1, 2, 3, 4].map((i) => path(`M${-20 + i * 92} 90 H${72 + i * 92} Q${72 + i * 92} 136 ${26 + i * 92} 136 Q${-20 + i * 92} 136 ${-20 + i * 92} 90 Z`, i % 2 ? C.white : C.orange, 4)).join('') + rect(40, 180, 190, 130, C.violet, 10) + rect(280, 180, 100, 180, C.ink, 10) + circle(300, 275, 8, C.lime, 0));
  const lock = (cx, cy, s, fill = C.orange) => group(cx, cy, s, path('M-60 -20 V-75 Q-60 -135 0 -135 Q60 -135 60 -75 V-20', 'none', 26) + rect(-100, -30, 200, 160, fill, 24) + circle(0, 38, 22, C.ink, 0) + rect(-8, 48, 16, 40, C.ink, 4, 0));
  const key = (cx, cy, s, fill = C.lime) => group(cx, cy, s, circle(-90, 0, 46, fill) + circle(-90, 0, 16, C.white, 4) + path('M-46 -14 H110 V14 H86 V42 H56 V14 H-46 Z', fill));
  const nameplate = (x, y, w, h, text, base = C.ink, letters = C.lime, size = 90) => rect(x, y, w, h, base, 26) + rect(x + 18, y + 18, w - 36, h - 36, 'none', 16, 0, { stroke: letters, 'stroke-width': 6 }) + title(x + w / 2, y + h / 2 + size * 0.36, text, size, letters);
  const box = (x, y, w, h, fill = C.white) => rect(x, y, w, h, fill, 16);
  const hex = (cx, cy, r, fill) => path(Array.from({ length: 6 }, (_, i) => `${i ? 'L' : 'M'}${(cx + r * Math.cos((i * Math.PI) / 3)).toFixed(1)} ${(cy + r * Math.sin((i * Math.PI) / 3)).toFixed(1)}`).join(' ') + ' Z', fill);
  const calendar = (cx, cy, s) => group(cx, cy, s, rect(-90, -80, 180, 170, C.white, 18) + rect(-90, -80, 180, 46, C.orange, 12) + [0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => rect(-68 + c * 38, -16 + r * 32, 22, 18, r === 2 && c === 1 ? C.violet : C.stripe, 4, 0))).join(''));
  const trophy = (cx, cy, s) => group(cx, cy, s, path('M-60 -90 H60 V-30 Q55 30 0 35 Q-55 30 -60 -30 Z', C.lime) + path('M-60 -70 Q-110 -70 -90 -25 Q-80 -5 -52 -8 M60 -70 Q110 -70 90 -25 Q80 -5 52 -8', 'none', 9) + rect(-12, 35, 24, 40, C.frame, 4) + rect(-60, 72, 120, 26, C.ink, 8));
  const spiderStrings = (x, y) => [0, 26, 55, 88].map((v, i) => path(`M${x} ${y + v} Q${x + 60} ${y + v + 24 + i * 5} ${x + 120} ${y + v + 6}`, 'none', 3, { stroke: C.violet2 })).join('');

  const plus = (cx, cy, s, fill = C.violet) => group(cx, cy, s, path('M-22 -70 H22 V-22 H70 V22 H22 V70 H-22 V22 H-70 V-22 H-22 Z', fill));

  /* ---------- layouts ---------- */

  const GRID = { 2: [90, 740, 680], 3: [80, 500, 430], 4: [60, 380, 340], 5: [55, 305, 270] };
  /** Side-by-side cards: title on top, drawing in the middle, optional mark and caption below. */
  const panels = (items, { bg = C.paper, titleSize = items.length > 3 ? 40 : 56, capSize = items.length > 3 ? 23 : items.length > 2 ? 27 : 32 } = {}) => {
    const [x0, step, w] = GRID[items.length];
    return svg(
      bg,
      items
        .map((it, i) => {
          const x = x0 + i * step;
          const cx = x + w / 2;
          return card(x, 110, w, 680, it.fill) + title(cx, 205, it.title, titleSize, inkOn(it.fill)) + it.art(cx, x, w) + (it.mark ? (it.mark === 'tick' ? tick(cx, 660, 32) : cross(cx, 660, 32)) : '') + (it.caption ? label(cx, 745, it.caption, capSize, inkOn(it.fill)) : '');
        })
        .join(''),
    );
  };
  /** Four (2 x 2) or six (3 x 2) tiles with a name pill under each drawing. */
  const tiles = (items, bg = C.paper) => {
    const cols = items.length === 4 ? 2 : 3;
    const w = cols === 2 ? 690 : 450;
    const step = cols === 2 ? 760 : 500;
    return svg(
      bg,
      items
        .map((it, i) => {
          const x = (cols === 2 ? 75 : 70) + (i % cols) * step;
          const y = 60 + Math.floor(i / cols) * 400;
          return card(x, y, w, 360) + it.art(x + w / 2, y) + pill(x + w / 2, y + 318, it.name, it.fill ?? C.lime, inkOn(it.fill ?? C.lime));
        })
        .join(''),
    );
  };
  /** Numbered steps joined by arrows. */
  const flow = (items, bg = C.paper) => {
    const n = items.length;
    const w = n === 5 ? 270 : n === 4 ? 340 : 430;
    const step = n === 5 ? 305 : n === 4 ? 385 : 515;
    const x0 = (W - (step * (n - 1) + w)) / 2;
    return svg(
      bg,
      items
        .map((it, i) => {
          const x = x0 + i * step;
          const cx = x + w / 2;
          return card(x, 190, w, 520) + circle(cx, 265, 40, i % 2 ? C.orange : C.violet) + title(cx, 281, String(i + 1), 44, i % 2 ? C.ink : C.white) + it.art(cx) + label(cx, 650, it.name, n === 5 ? 27 : 32, C.ink, 'middle', 700) + (i < n - 1 ? arrow(x + w + 4, 450, x + step - 3, 450, 7) : '');
        })
        .join(''),
      layers(780),
    );
  };
  /** A titled checklist on a coloured background. */
  const checklist = (heading, rows, bg = C.violet) =>
    svg(
      bg,
      card(300, 60, 1000, 780) + title(800, 165, heading, 68) + rows.map((s, i) => {
        const y = 255 + i * (rows.length > 5 ? 90 : 112);
        return tick(410, y, 32) + label(475, y + 14, s, 38, C.ink, 'start') + (i < rows.length - 1 ? line(475, y + 48, 1210, y + 48, 3, C.stripe) : '');
      }).join(''),
      dots(0.16),
    );
  /** A comparison scored with one to five dots. */
  const ratings = (heading, a, b, rows) =>
    svg(
      C.white,
      title(800, 115, heading, 62) + pill(760, 205, a, C.lime, C.ink, 240) + pill(1210, 205, b, C.violet, C.white, 240) +
        rows.map(([name, va, vb], i) => {
          const y = 315 + i * 120;
          const row = (x, v, fill) => [0, 1, 2, 3, 4].map((k) => circle(x + k * 62, y, 24, k < v ? fill : C.white, 4)).join('');
          return label(120, y + 12, name, 38, C.ink, 'start', 700) + row(636, va, C.lime) + row(1086, vb, C.violet) + line(120, y + 60, 1480, y + 60, 3, C.stripe);
        }).join('') + label(800, 840, 'More dots means more of it. A general guide only.', 28, C.muted, 'middle', 500),
      '',
    );
  const split = (left, right) => rect(800, 0, 800, H, right, 0, 0) + rect(0, 0, 800, H, left, 0, 0);

  /* ---------- 1. resin or filament ---------- */
  images['cover-resin-vs-filament'] = svg(C.lime, split(C.lime, C.violet) + shadow(400, 760, 280) + spool(330, 520, 220, C.orange) + vase(590, 750, 330, 100, undefined, 14) + shadow(1200, 760, 260) + bottle(1060, 745, 1.5, C.orange) + circle(1320, 380, 92, C.lime) + path('M1230 745 Q1240 560 1320 540 Q1400 560 1410 745 Z', C.lime) + rect(1220, 745, 200, 26, C.ink, 8), dots());
  images['resin-process'] = panels([
    { title: 'Filament', art: (cx) => nozzle(cx, 465, 1.15) + vase(cx, 640, 160, 120, undefined, 9) + path(`M${cx} 465 q40 4 60 14`, 'none', 12, { stroke: C.orange }) + bar(cx - 170, 640), caption: 'Melted plastic drawn line by line' },
    { title: 'Resin', art: (cx) => rect(cx - 90, 270, 180, 40, C.ink, 10) + line(cx, 240, cx, 270, 14) + dome(cx, 400, 90, 8, C.orange, '#FF8442').replace(/^/, `<g transform="rotate(180 ${cx} 355)">`) + '</g>' + path(`M${cx - 210} 420 H${cx + 210} V560 H${cx - 210} Z`, 'rgba(122,82,236,.45)') + rect(cx - 220, 560, 440, 22, C.ink, 6) + [-110, 0, 110].map((d) => arrow(cx + d, 650, cx + d * 0.5, 592, 9, C.violet)).join(''), caption: 'Liquid hardened by light' },
  ]);
  images['resin-compare'] = ratings('Filament or resin?', 'Filament', 'Resin', [['Fine detail', 3, 5], ['Toughness', 4, 2], ['Large parts', 5, 2], ['Smooth surface', 2, 5]]);

  /* ---------- 2. PLA and PLA+ ---------- */
  images['cover-pla-plus'] = svg(C.paper, shadow(800, 760, 520) + spool(470, 500, 230, C.white) + plus(800, 500, 1.25) + spool(1130, 500, 230, C.violet) + circle(1330, 270, 80, C.lime) + plus(1330, 270, 0.7, C.ink), layers(770));
  images['plus-blend'] = svg(C.paper, card(90, 300, 330, 300, C.white) + spool(255, 425, 88, C.white) + title(255, 570, 'Base PLA', 44) + plus(520, 450, 0.85, C.ink) + card(620, 300, 330, 300, C.lime) + [[720, 390], [790, 440], [860, 385], [750, 490], [845, 480]].map(([x, y], i) => circle(x, y, 26, i % 2 ? C.orange : C.violet)).join('') + title(785, 570, 'Additives', 44) + arrow(980, 450, 1090, 450, 14) + ['Toughness', 'Layer bonding', 'Surface finish'].map((s, i) => card(1120, 170 + i * 200, 390, 150, i === 1 ? C.violet : C.white) + title(1315, 263 + i * 200, s, 44, i === 1 ? C.white : C.ink)).join(''));
  images['plus-test'] = panels([
    { title: 'Snaps sharply', art: (cx) => `<g transform="rotate(-14 ${cx - 90} 450)">${rect(cx - 220, 420, 210, 56, C.violet, 10)}</g><g transform="rotate(16 ${cx + 90} 450)">${rect(cx + 10, 420, 210, 56, C.violet, 10)}</g>` + path(`M${cx} 370 l16 -40 M${cx - 34} 380 l-24 -30 M${cx + 36} 380 l28 -26`, 'none', 7), caption: 'Little warning before it breaks', mark: 'cross' },
    { title: 'Bends first', art: (cx) => path(`M${cx - 220} 390 Q${cx} 560 ${cx + 220} 390 L${cx + 220} 450 Q${cx} 620 ${cx - 220} 450 Z`, C.violet) + arrow(cx, 300, cx, 440, 12, C.orange), caption: 'Gives a little before failing', mark: 'tick' },
  ]);

  /* ---------- 3. ASA outdoors ---------- */
  images['cover-asa'] = svg(C.violet, sun(330, 270, 110) + rain(1250, 250, 1.1) + rect(0, 700, W, 200, C.ink, 0, 0) + rect(240, 560, 1120, 34, C.white, 14) + [320, 520, 720, 920, 1120, 1280].map((x) => rect(x, 594, 22, 140, C.white, 6)).join('') + hookShape(700, 470, 1.1, C.orange) + plant(990, 560, 0.75, C.lime), dots(0.16));
  images['asa-weather'] = tiles([
    { name: 'Sunlight', art: (cx, y) => sun(cx, y + 140, 55) },
    { name: 'Rain', art: (cx, y) => rain(cx, y + 105, 0.75), fill: C.violet },
    { name: 'Heat', art: (cx, y) => rect(cx - 25, y + 45, 50, 170, C.white, 25) + rect(cx - 10, y + 95, 20, 120, C.orange, 8, 0) + circle(cx, y + 220, 42, C.orange) + [70, 105, 140].map((v) => line(cx + 55, y + v, cx + 100, y + v, 7)).join(''), fill: C.orange },
    { name: 'Dust and dirt', art: (cx, y) => bracket(cx - 90, y + 45, 0.72) + [[-190, 90], [-150, 180], [140, 70], [180, 150], [120, 220], [-200, 230]].map(([dx, dy]) => circle(cx + dx, y + dy, 12, WOOD, 4)).join(''), fill: C.white },
  ]);
  images['asa-checklist'] = checklist('Built for outdoors', ['Drain holes at low points', 'Thicker walls', 'Rounded corners', 'Stainless screws and washers', 'Pale colours in full sun'], C.orange);

  /* ---------- 4. monsoon ---------- */
  images['cover-monsoon'] = svg(C.paper, rect(0, 0, W, 420, C.violet, 0, 0) + rain(330, 190, 1.2) + rain(800, 130, 0.9) + rain(1270, 210, 1.2) + shadow(800, 780, 420) + rect(450, 470, 700, 290, C.white, 36) + rect(430, 430, 740, 70, C.lime, 24) + spool(620, 630, 105, C.orange) + spool(850, 630, 105, C.violet) + circle(1040, 590, 52, C.white) + drop(1040, 592, 0.65) + rect(990, 670, 100, 55, C.stripe, 12), '');
  images['monsoon-signs'] = tiles([
    { name: 'Popping sounds', art: (cx, y) => nozzle(cx - 40, y + 230, 1) + [[60, 90], [110, 150], [55, 200]].map(([dx, dy]) => path(`M${cx + dx} ${y + dy} l45 -14 M${cx + dx} ${y + dy + 26} l50 8`, 'none', 8, { stroke: C.orange })).join('') },
    { name: 'Rough surface', art: (cx, y) => column(cx, y + 250, 190, 190, 8) + Array.from({ length: 26 }, (_, i) => circle(cx - 80 + ((i * 47) % 160), y + 75 + ((i * 61) % 160), 7, C.white, 2)).join('') },
    { name: 'Stringing', art: (cx, y) => rect(cx - 140, y + 60, 80, 190, C.violet, 10) + rect(cx + 60, y + 60, 80, 190, C.violet, 10) + spiderStrings(cx - 60, y + 80) },
    { name: 'Brittle strands', art: (cx, y) => path(`M${cx - 230} ${y + 130} Q${cx - 120} ${y + 60} ${cx - 25} ${y + 140}`, 'none', 22, { stroke: C.orange }) + path(`M${cx + 30} ${y + 165} Q${cx + 130} ${y + 230} ${cx + 230} ${y + 150}`, 'none', 22, { stroke: C.orange }) + path(`M${cx} ${y + 105} v-40 M${cx - 20} ${y + 200} v38`, 'none', 7) },
  ]);
  images['monsoon-storebox'] = svg(C.paper, card(220, 190, 1160, 560) + rect(190, 150, 1220, 90, C.lime, 30) + spool(460, 500, 150, C.violet) + spool(800, 500, 150, C.orange) + rect(1030, 330, 280, 160, C.white, 24) + title(1170, 410, '18%', 74) + label(1170, 460, 'Humidity', 28) + [0, 1, 2].map((i) => rect(1040 + i * 92, 560, 76, 110, C.stripe, 14) + [0, 1, 2, 3].map((k) => circle(1062 + i * 92 + (k % 2) * 32, 592 + Math.floor(k / 2) * 40, 9, C.violet2, 3)).join('')).join('') + pill(460, 700, 'Spools', C.white) + pill(800, 700, 'Sealed lid', C.white) + pill(1170, 715, 'Desiccant', C.lime), dots());

  /* ---------- 5. eco ---------- */
  const recycle = (cx, cy, r, c = C.ink) => [0, 120, 240].map((a) => `<g transform="rotate(${a} ${cx} ${cy})">${path(`M${cx - r * 0.75} ${cy - r * 0.55} A${r} ${r} 0 0 1 ${cx + r * 0.72} ${cy - r * 0.6}`, 'none', r * 0.16, { stroke: c })}${path(`M${cx + r * 0.45} ${cy - r * 0.9} L${cx + r * 0.9} ${cy - r * 0.45} L${cx + r * 0.38} ${cy - r * 0.34} Z`, c)}</g>`).join('');
  images['cover-eco'] = svg(C.lime, recycle(800, 450, 300) + leaf(800, 440, 1.7, C.white) + spool(250, 640, 120, C.violet) + vase(1360, 750, 300, 100, undefined, 13), dots());
  images['eco-waste'] = tiles([
    { name: 'Failed prints', art: (cx, y) => path(`M${cx} ${y + 210} C${cx - 150} ${y + 160} ${cx - 100} ${y + 270} ${cx - 30} ${y + 230} C${cx + 80} ${y + 170} ${cx - 160} ${y + 60} ${cx - 20} ${y + 70} C${cx + 140} ${y + 80} ${cx + 160} ${y + 220} ${cx + 50} ${y + 200} C${cx - 60} ${y + 180} ${cx + 40} ${y + 30} ${cx + 100} ${y + 110}`, 'none', 10, { stroke: C.violet }) + bar(cx - 170, y + 245) },
    { name: 'Supports', art: (cx, y) => rect(cx - 130, y + 50, 260, 46, C.violet, 10) + [0, 1, 2, 3, 4].map((i) => line(cx - 110 + i * 55, y + 100, cx - 110 + i * 55, y + 240, 12, C.orange)).join('') + bar(cx - 170, y + 245) },
    { name: 'Purge material', art: (cx, y) => column(cx - 70, y + 250, 110, 190, 10, C.orange, C.lime) + [[40, 235], [90, 220], [135, 240], [75, 190]].map(([dx, dy], i) => circle(cx + dx, y + dy, 22, [C.violet, C.orange, C.lime, C.violet2][i], 4)).join('') + bar(cx - 170, y + 245) },
    { name: 'Spools and packing', art: (cx, y) => spool(cx - 90, y + 155, 95, C.frame) + parcel(cx + 30, y + 75, 0.95) },
  ]);
  images['eco-actions'] = panels([
    { title: 'Design out', art: (cx) => path(`M${cx - 90} 600 V440 L${cx + 90} 320 V400 L${cx - 20} 475 V600 Z`, C.violet) + bar(cx - 130, 600, 260), caption: 'Fewer supports' },
    { title: 'Test small', art: (cx) => cube(cx - 40, 480, 40) + cube(cx - 110, 550, 28, C.lime, C.orange, WOOD) + magnifier(cx + 20, 430, 90), caption: 'Check fit first' },
    { title: 'Make it last', art: (cx) => hookShape(cx - 100, 330, 1.05), caption: 'Right material, thick walls' },
    { title: 'Repair', art: (cx) => rect(cx - 110, 360, 220, 200, C.frame, 20) + circle(cx, 460, 55, C.orange) + gearShape(cx + 85, 540, 40), caption: 'Replace one small part' },
  ]);

  /* ---------- 6. layer height ---------- */
  images['cover-layer-height'] = svg(C.violet, shadow(800, 780, 620) + column(360, 770, 260, 580, 7, C.orange, '#FF8442') + column(800, 770, 260, 580, 15, C.lime, '#C4EE20') + column(1240, 770, 260, 580, 32, C.white, C.frame), dots(0.16));
  images['layers-compare'] = panels([
    { title: 'Thick', art: (cx) => column(cx, 640, 220, 340, 7) + bar(cx - 150, 640, 300), caption: 'Fewer passes, visible ridges' },
    { title: 'Medium', art: (cx) => column(cx, 640, 220, 340, 14) + bar(cx - 150, 640, 300), caption: 'A good everyday choice' },
    { title: 'Thin', art: (cx) => column(cx, 640, 220, 340, 30) + bar(cx - 150, 640, 300), caption: 'Smoother, many more passes' },
  ]);
  images['layers-curve'] = panels([
    { title: 'Thick layers', art: (cx) => dome(cx, 620, 250, 6) + bar(cx - 290, 620, 580), caption: 'Steps show on the curve' },
    { title: 'Thin layers', art: (cx) => dome(cx, 620, 250, 26) + bar(cx - 290, 620, 580), caption: 'The curve looks smooth' },
  ]);

  /* ---------- 7. infill and walls ---------- */
  const cell = (cx, cy, kind, s = 220) => {
    const x = cx - s / 2;
    const y = cy - s / 2;
    const clip = `c${kind}${Math.round(cx)}`;
    let inner = '';
    if (kind === 'grid') for (let i = 1; i < 5; i++) inner += line(x + (i * s) / 5, y, x + (i * s) / 5, y + s, 7, C.violet) + line(x, y + (i * s) / 5, x + s, y + (i * s) / 5, 7, C.violet);
    if (kind === 'honey') for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) inner += path(Array.from({ length: 6 }, (_, i) => `${i ? 'L' : 'M'}${x + c * 52 + 26 * Math.cos((i * Math.PI) / 3)} ${y + r * 46 + (c % 2) * 23 + 26 * Math.sin((i * Math.PI) / 3)}`).join(' ') + ' Z', 'none', 5, { stroke: C.violet });
    if (kind === 'gyroid') for (let r = 0; r < 6; r++) inner += path(`M${x} ${y + 20 + r * 42} ${Array.from({ length: 4 }, (_, i) => `q${s / 8} ${i % 2 ? 40 : -40} ${s / 4} 0`).join(' ')}`, 'none', 7, { stroke: C.violet });
    if (kind === 'solid') inner += rect(x, y, s, s, C.violet, 0, 0);
    return `<clipPath id="${clip}"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="18"/></clipPath>` + rect(x, y, s, s, C.white, 18, 0) + `<g clip-path="url(#${clip})">${inner}</g>` + rect(x, y, s, s, 'none', 18, 16, { stroke: C.violet }) + rect(x - 8, y - 8, s + 16, s + 16, 'none', 24, 5);
  };
  images['cover-infill'] = svg(C.orange, [['grid', 320], ['honey', 800], ['gyroid', 1280]].map(([k, x], i) => card(x - 200, 210 + (i % 2) * 60, 400, 440) + cell(x, 430 + (i % 2) * 60, k, 270)).join(''), dots());
  images['infill-patterns'] = panels([['Grid', 'grid', 'All-round stiffness'], ['Honeycomb', 'honey', 'Strong for its weight'], ['Gyroid', 'gyroid', 'Even in many directions'], ['Solid', 'solid', 'Heavy, rarely needed']].map(([t, k, c]) => ({ title: t, art: (cx) => cell(cx, 450, k), caption: c })));
  const cutHook = (cx, wall, gap) => {
    const x = cx - 120;
    let fill = '';
    for (let i = 20; i < 320; i += gap) fill += line(x + i, 300, x + i - 60, 620, 4, C.violet2);
    const d = `M${x} 320 H${x + 100} V500 Q${x + 100} 520 ${x + 120} 520 H${x + 240} V620 H${x} Z`;
    const id = `h${wall}${Math.round(cx)}`;
    return `<clipPath id="${id}"><path d="${d}"/></clipPath>` + path(d, C.white, 0) + `<g clip-path="url(#${id})">${fill}${path(d, 'none', wall * 2, { stroke: C.violet })}</g>` + path(d, 'none', 5);
  };
  images['infill-walls'] = panels([
    { title: 'Thin walls, dense fill', art: (cx) => cutHook(cx, 8, 22), caption: 'Weaker when it bends', mark: 'cross' },
    { title: 'Thick walls, light fill', art: (cx) => cutHook(cx, 30, 70), caption: 'Usually the stronger choice', mark: 'tick' },
  ]);

  /* ---------- 8. orientation ---------- */
  const striped = (d, id, horizontal = true) => {
    let s = '';
    for (let i = 0; i < 1000; i += 20) s += horizontal ? line(0, i, 1600, i, 4, C.violet2) : line(i * 1.6, 0, i * 1.6, 900, 4, C.violet2);
    return `<clipPath id="${id}"><path d="${d}"/></clipPath>` + path(d, C.violet, 0) + `<g clip-path="url(#${id})">${s}</g>` + path(d, 'none', 5);
  };
  const lShape = (x, y) => `M${x} ${y} H${x + 80} V${y + 190} H${x + 250} V${y + 270} H${x} Z`;
  images['cover-orientation'] = svg(C.paper, card(160, 170, 580, 560, C.lime) + card(860, 170, 580, 560, C.violet) + group(300, 270, 1.35, hookShape(0, 0, 1, C.violet)) + `<g transform="rotate(-90 1150 450)">${hookShape(1010, 290, 1.35, C.lime)}</g>` + path('M720 130 C 800 70, 880 80, 930 150', 'none', 14) + path('M898 140 L934 156 L938 116', 'none', 14), layers(780));
  images['orient-load'] = panels([
    { title: 'Printed upright', art: (cx) => striped(lShape(cx - 130, 300), 'or1') + path(`M${cx - 140} 492 l45 -16 l30 22 l40 -18`, 'none', 10, { stroke: C.orange }) + arrow(cx + 150, 400, cx + 150, 540, 12, C.orange), caption: 'Load pulls the layers apart', mark: 'cross' },
    { title: 'Printed on its side', art: (cx) => path(lShape(cx - 130, 300), C.violet) + path(`M${cx - 108} 322 H${cx - 72} V512 H${cx + 98} V548 H${cx - 108} Z`, 'none', 6, { stroke: C.violet2 }) + path(`M${cx - 90} 322 V530 H${cx + 98}`, 'none', 6, { stroke: C.violet2 }) + arrow(cx + 150, 400, cx + 150, 540, 12, C.orange), caption: 'Load runs along the lines', mark: 'tick' },
  ]);
  images['orient-three'] = panels([
    { title: 'Flat', art: (cx) => striped(`M${cx - 150} 530 H${cx + 150} V610 H${cx - 150} Z`, 'or2') + bar(cx - 170, 610), caption: 'Stable, few supports' },
    { title: 'On its side', art: (cx) => striped(lShape(cx - 125, 340), 'or3', false) + bar(cx - 170, 610), caption: 'Strong profile, clean sides' },
    { title: 'Upright', art: (cx) => striped(`M${cx - 40} 280 H${cx + 40} V610 H${cx - 40} Z`, 'or4') + bar(cx - 170, 610), caption: 'Weak to sideways force' },
  ]);

  /* ---------- 9. supports ---------- */
  const table = (cx, y = 330) => rect(cx - 170, y, 340, 56, C.violet, 12) + rect(cx - 170, y, 70, 290, C.violet, 12);
  const tree = (cx) => path(`M${cx + 40} 620 V520 M${cx + 40} 520 L${cx - 60} 392 M${cx + 40} 520 L${cx + 40} 392 M${cx + 40} 520 L${cx + 140} 392`, 'none', 18, { stroke: C.orange });
  images['cover-supports'] = svg(C.lime, shadow(800, 790, 520) + rect(420, 230, 760, 90, C.violet, 24) + rect(420, 230, 150, 540, C.violet, 24) + path('M900 770 V620 M900 620 L720 322 M900 620 L860 322 M900 620 L1000 322 M900 620 L1140 322', 'none', 30, { stroke: C.orange }) + rect(330, 770, 940, 34, C.white, 12), dots());
  images['supports-types'] = panels([
    { title: 'Grid', art: (cx) => table(cx) + [0, 1, 2, 3, 4].map((i) => line(cx - 60 + i * 52, 392, cx - 60 + i * 52, 620, 8, C.orange)).join('') + [440, 500, 560].map((v) => line(cx - 60, v, cx + 148, v, 5, C.orange)).join('') + bar(cx - 190, 620, 380), caption: 'Stable under flat areas' },
    { title: 'Tree', art: (cx) => table(cx) + tree(cx) + bar(cx - 190, 620, 380), caption: 'Less material, fewer marks' },
    { title: 'Resin pillars', art: (cx) => rect(cx - 140, 320, 280, 60, C.violet, 30) + [-100, -35, 35, 100].map((d) => path(`M${cx + d - 14} 600 L${cx + d - 3} 384 H${cx + d + 3} L${cx + d + 14} 600 Z`, C.orange, 4)).join('') + rect(cx - 160, 600, 320, 34, C.ink, 8), caption: 'Fine tips, used in resin' },
  ]);
  images['supports-avoid'] = panels([
    { title: 'Flat ledge', art: (cx) => table(cx) + [0, 1, 2, 3, 4].map((i) => line(cx - 60 + i * 52, 392, cx - 60 + i * 52, 620, 8, C.orange)).join('') + bar(cx - 190, 620, 380), caption: 'Needs support underneath', mark: 'cross' },
    { title: 'Chamfered ledge', art: (cx) => path(`M${cx - 170} 330 H${cx + 170} V386 L${cx - 100} 600 V620 H${cx - 170} Z`, C.violet) + bar(cx - 190, 620, 380), caption: 'Prints without support', mark: 'tick' },
  ]);

  /* ---------- 10. joints ---------- */
  images['cover-joints'] = svg(C.violet, card(210, 240, 520, 420, C.lime) + card(880, 240, 520, 420, C.orange) + path('M310 340 H470 V400 Q540 380 540 450 Q540 520 470 500 V560 H310 Z', C.violet) + path('M620 340 H560 V420 Q610 405 610 450 Q610 495 560 480 V560 H620 Z', C.white) + rect(960, 470, 360, 90, C.white, 12) + rect(1100, 300, 80, 150, C.frame, 10) + path('M1060 300 H1220 L1200 270 H1080 Z', C.frame) + [330, 360, 390, 420].map((v) => line(1100, v + 16, 1180, v, 5)).join('') + arrow(1140, 480, 1140, 540, 9) + arrow(750, 450, 855, 450, 14, C.white), dots(0.16));
  images['joints-types'] = tiles([
    { name: 'Snap fit', art: (cx, y) => rect(cx - 220, y + 190, 440, 60, C.frame, 10) + path(`M${cx - 70} ${y + 190} V${y + 70} H${cx - 40} L${cx - 20} ${y + 105} H${cx - 40} V${y + 190} Z`, C.violet) + rect(cx - 20, y + 108, 150, 36, C.orange, 8) },
    { name: 'Screw', art: (cx, y) => rect(cx - 150, y + 150, 300, 100, C.violet, 12) + rect(cx - 22, y + 85, 44, 130, C.frame, 6) + path(`M${cx - 60} ${y + 85} H${cx + 60} L${cx + 40} ${y + 52} H${cx - 40} Z`, C.frame) + [110, 135, 160, 185].map((v) => line(cx - 22, y + v + 12, cx + 22, y + v, 4)).join('') },
    { name: 'Pin and socket', art: (cx, y) => rect(cx - 240, y + 90, 180, 150, C.violet, 14) + rect(cx - 60, y + 140, 70, 50, C.violet2, 14) + rect(cx + 70, y + 90, 180, 150, C.orange, 14) + rect(cx + 70, y + 136, 78, 58, C.white, 8, 4) + arrow(cx + 20, y + 80, cx + 60, y + 80, 8) },
    { name: 'Dovetail', art: (cx, y) => path(`M${cx - 230} ${y + 90} H${cx - 40} V${y + 135} L${cx + 40} ${y + 110} V${y + 220} L${cx - 40} ${y + 195} V${y + 240} H${cx - 230} Z`, C.violet) + path(`M${cx + 230} ${y + 90} H${cx} V${y + 122} L${cx + 40} ${y + 110} V${y + 220} L${cx} ${y + 208} V${y + 240} H${cx + 230} Z`, C.orange) },
  ]);
  const snap = (cx, ledge, bend) => rect(cx - 170, 580, 340, 56, C.frame, 10) + rect(cx - 40, ledge, 170, 44, C.orange, 8) + path(`M${cx - 80} 580 Q${cx - 80} 480 ${cx - 80 - bend} 370 H${cx - 50 - bend} L${cx - 6 - bend} 418 H${cx - 44 - bend} Q${cx - 44} 490 ${cx - 44} 580 Z`, C.violet);
  images['joints-snap'] = panels([
    { title: 'Before', art: (cx) => snap(cx, 270, 0) + arrow(cx + 60, 325, cx + 60, 400, 10, C.orange), caption: 'The part moves down' },
    { title: 'Bending', art: (cx) => snap(cx, 374, 62) + arrow(cx - 40, 330, cx - 140, 330, 10, C.orange), caption: 'The arm flexes aside' },
    { title: 'Clicked', art: (cx) => snap(cx, 420, 0) + tick(cx + 95, 330, 40), caption: 'The hook springs back over it' },
  ]);

  /* ---------- 11. measuring ---------- */
  images['cover-measure'] = svg(C.orange, card(200, 130, 1200, 640) + caliper(430, 280, 1.35, 250) + bracket(512, 440, 0.95), dots());
  images['measure-caliper'] = panels([
    { title: 'Outside', art: (cx) => rect(cx - 90, 350, 180, 200, C.violet, 12) + rect(cx - 150, 300, 40, 280, C.frame, 8) + rect(cx + 110, 300, 40, 280, C.frame, 8) + arrow(cx - 190, 450, cx - 94, 450, 9, C.orange) + arrow(cx + 190, 450, cx + 94, 450, 9, C.orange), caption: 'Jaws close on the part' },
    { title: 'Inside', art: (cx) => circle(cx, 450, 130, C.violet) + circle(cx, 450, 80, C.white) + arrow(cx - 10, 450, cx - 78, 450, 9, C.orange) + arrow(cx + 10, 450, cx + 78, 450, 9, C.orange), caption: 'Small jaws open in a hole' },
    { title: 'Depth', art: (cx) => path(`M${cx - 130} 380 H${cx - 60} V540 H${cx + 60} V380 H${cx + 130} V600 H${cx - 130} Z`, C.violet) + rect(cx - 8, 270, 16, 268, C.frame, 4) + arrow(cx + 90, 390, cx + 90, 372, 7, C.orange) + arrow(cx + 32, 390, cx + 32, 532, 9, C.orange), caption: 'The rod drops to the bottom' },
  ]);
  const dim = (x1, y1, x2, y2, s, tx, ty) => arrow((x1 + x2) / 2, (y1 + y2) / 2, x1, y1, 5) + arrow((x1 + x2) / 2, (y1 + y2) / 2, x2, y2, 5) + label(tx, ty, s, 30);
  images['measure-sketch'] = svg(C.white, Array.from({ length: 31 }, (_, i) => line(i * 54, 0, i * 54, H, 1.5, C.stripe)).join('') + Array.from({ length: 17 }, (_, i) => line(0, i * 54, W, i * 54, 1.5, C.stripe)).join('') + path('M180 280 H280 V540 H520 V640 H180 Z', 'none', 7) + circle(230, 360, 24, 'none') + dim(180, 700, 520, 700, '68 mm', 350, 750) + dim(130, 280, 130, 640, '72', 90, 470) + title(350, 190, 'Front', 56) + rect(660, 280, 200, 360, 'none', 6, 7) + circle(760, 360, 24, 'none') + circle(760, 560, 24, 'none') + dim(660, 700, 860, 700, '40 mm', 760, 750) + dim(900, 360, 900, 560, '40', 945, 470) + title(760, 190, 'Side', 56) + rect(1060, 340, 360, 200, 'none', 6, 7) + line(1160, 340, 1160, 540, 5) + circle(1320, 440, 24, 'none') + dim(1060, 700, 1420, 700, '68 mm', 1240, 750) + title(1240, 190, 'Top', 56) + pill(800, 835, 'Every number in millimetres', C.lime, C.ink, 520), '');

  /* ---------- 12. name plate ---------- */
  images['cover-nameplate'] = svg(C.violet, shadow(800, 720, 620) + nameplate(260, 280, 1080, 320, 'Your name', C.ink, C.lime, 170) + circle(330, 440, 20, C.frame) + circle(1270, 440, 20, C.frame) + brush(1420, 250, 30, C.orange), dots(0.16));
  images['plate-anatomy'] = svg(C.paper, nameplate(380, 290, 840, 320, 'Studio', C.violet, C.white, 150) + circle(445, 450, 20, C.frame) + circle(1155, 450, 20, C.frame) + [['Border', 560, 305, 330, 150], ['Raised letters', 900, 430, 1330, 170], ['Base plate', 1100, 590, 1300, 760], ['Fixing holes', 445, 470, 260, 740]].map(([s, x1, y1, x2, y2]) => arrow(x2, y2, x1, y1, 7) + pill(x2, y2, s, C.lime, C.ink, 300)).join(''));
  images['plate-fonts'] = panels([
    { title: 'Too thin', art: (cx) => rect(cx - 260, 330, 520, 230, C.ink, 22) + `<text x="${cx}" y="490" text-anchor="middle" font-family="Inter" font-weight="100" font-size="150" fill="${C.lime}">Maya</text>` + rect(cx - 40, 420, 30, 14, C.ink, 0, 0) + rect(cx + 80, 470, 34, 16, C.ink, 0, 0), caption: 'Fine strokes break or vanish', mark: 'cross' },
    { title: 'Bold and even', art: (cx) => nameplate(cx - 260, 330, 520, 230, 'Maya', C.ink, C.lime, 150), caption: 'Prints cleanly, reads from afar', mark: 'tick' },
  ]);

  /* ---------- 13. design software ---------- */
  images['cover-software'] = svg(C.paper, laptop(480, 180, 1.4, C.violet) + cube(640, 380, 100, C.lime, C.white, C.frame) + circle(955, 380, 80, C.orange) + path('M1260 620 L1260 470 L1300 505 L1330 450 L1362 468 L1334 522 L1386 526 Z', C.lime) + gearShape(280, 330, 80) + vase(300, 730, 240, 90, undefined, 11), layers(760));
  images['software-types'] = panels([
    { title: 'Measured parts', art: (cx) => bracket(cx - 150, 300, 1.1, C.lime) + dim(cx - 150, 630, cx + 136, 630, '', cx, 0) + arrow(cx + 190, 450, cx + 190, 586, 5) + arrow(cx + 190, 450, cx + 190, 300, 5), caption: 'Numbers you can change later' },
    { title: 'Sculpted forms', art: (cx) => path(`M${cx - 150} 590 Q${cx - 220} 470 ${cx - 90} 410 Q${cx - 130} 290 ${cx} 290 Q${cx + 130} 290 ${cx + 90} 410 Q${cx + 220} 470 ${cx + 150} 590 Z`, C.violet) + circle(cx - 40, 360, 11, C.ink, 0) + circle(cx + 40, 360, 11, C.ink, 0) + bar(cx - 180, 590, 360) + path(`M${cx + 250} 300 L${cx + 120} 420`, 'none', 22, { stroke: WOOD }) + circle(cx + 118, 424, 16, C.orange, 4), caption: 'A surface shaped like clay' },
  ]);
  images['software-path'] = flow([
    { name: 'Simple shapes', art: (cx) => cube(cx - 80, 420, 50, C.lime, C.orange, WOOD) + circle(cx + 40, 450, 55, C.violet) },
    { name: 'Measured parts', art: (cx) => bracket(cx - 80, 370, 0.62) },
    { name: 'Sculpting', art: (cx) => path(`M${cx - 80} 530 Q${cx - 120} 440 ${cx - 40} 430 Q${cx - 60} 360 ${cx} 360 Q${cx + 60} 360 ${cx + 40} 430 Q${cx + 120} 440 ${cx + 80} 530 Z`, C.violet) },
    { name: 'Printable file', art: (cx) => doc(cx - 75, 350, 150, 190, C.lime) + title(cx, 480, 'STL', 56) },
  ]);

  /* ---------- 14. history ---------- */
  images['cover-history'] = svg(C.ink, line(120, 700, 1480, 700, 12, C.lime) + [200, 560, 920, 1320].map((x) => circle(x, 700, 28, C.orange)).join('') + circle(200, 400, 120, C.violet) + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => line(200 + 150 * Math.cos((i * Math.PI) / 4), 400 + 150 * Math.sin((i * Math.PI) / 4), 200 + 195 * Math.cos((i * Math.PI) / 4), 400 + 195 * Math.sin((i * Math.PI) / 4), 10, C.lime)).join('') + bottle(560, 640, 1.25, C.violet2) + nozzle(920, 520, 1.5) + vase(920, 650, 110, 90, undefined, 7) + printer(1130, 210, 0.86, 0.8), dots(0.35));
  images['history-timeline'] = svg(C.white, title(800, 120, 'A few landmarks', 70) + line(110, 450, 1490, 450, 12) + [['Early 1980s', 'Light-hardened layers'], ['1986', 'Stereolithography patent'], ['Late 1980s', 'Melted filament'], ['2005', 'RepRap begins'], ['2010s', 'Desktop printers']].map(([y, s], i) => {
    const x = 200 + i * 300;
    const up = i % 2 === 0;
    return line(x, 450, x, up ? 380 : 520, 6) + circle(x, 450, 26, [C.violet, C.orange, C.lime, C.violet2, C.orange][i]) + card(x - 135, up ? 220 : 520, 270, 160, i === 4 ? C.lime : C.white) + title(x, up ? 290 : 590, y, 44) + label(x, up ? 345 : 645, s, 21, C.muted);
  }).join('') + label(800, 820, 'Dates for early work are approximate.', 28, C.muted, 'middle', 500), '');
  images['history-spread'] = tiles([
    { name: 'Industry', art: (cx, y) => path(`M${cx - 190} ${y + 250} V${y + 130} L${cx - 90} ${y + 180} V${y + 130} L${cx + 10} ${y + 180} V${y + 60} H${cx + 70} V${y + 180} H${cx + 190} V${y + 250} Z`, C.violet) + gearShape(cx + 150, y + 110, 36) },
    { name: 'Schools', art: (cx, y) => path(`M${cx - 190} ${y + 120} L${cx} ${y + 55} L${cx + 190} ${y + 120} L${cx} ${y + 185} Z`, C.ink) + path(`M${cx - 100} ${y + 155} V${y + 220} Q${cx} ${y + 265} ${cx + 100} ${y + 220} V${y + 155} L${cx} ${y + 185} Z`, C.violet) + line(cx + 150, y + 135, cx + 150, y + 230, 8) + circle(cx + 150, y + 232, 14, C.orange) },
    { name: 'Homes', art: (cx, y) => path(`M${cx - 150} ${y + 150} L${cx} ${y + 45} L${cx + 150} ${y + 150} V${y + 250} H${cx - 150} Z`, C.orange) + rect(cx - 35, y + 175, 70, 75, C.white, 6) },
    { name: 'Small studios', art: (cx, y) => printer(cx - 110, y + 40, 0.44, 0.7) },
  ]);

  /* ---------- 15. home ideas ---------- */
  images['cover-home-ideas'] = svg(C.lime, path('M320 420 L800 110 L1280 420 V780 H320 Z', C.white) + rect(300, 770, 1000, 30, C.ink, 8) + rect(390, 500, 360, 24, C.violet, 8) + vase(470, 498, 150, 55, undefined, 8) + phoneStand(580, 498, 0.65) + hookShape(900, 430, 0.75, C.orange) + hookShape(1100, 430, 0.75, C.violet) + rect(390, 620, 360, 120, WOOD, 14) + [480, 570, 660].map((x) => line(x, 632, x, 728, 10)).join('') + plant(1030, 770, 0.9), dots());
  images['home-rooms'] = tiles([
    { name: 'Entrance', art: (cx, y) => rect(cx - 150, y + 70, 300, 40, WOOD, 10) + [-100, 0, 100].map((d) => path(`M${cx + d} ${y + 110} v70 q0 30 30 20`, 'none', 14, { stroke: C.violet })).join('') + key(cx + 20, y + 235, 0.5) },
    { name: 'Desk', art: (cx, y) => phoneStand(cx - 130, y + 250, 0.9) + rect(cx + 60, y + 170, 100, 80, C.orange, 12) + line(cx + 90, y + 170, cx + 78, y + 80, 12, C.violet) + line(cx + 130, y + 170, cx + 145, y + 95, 12, C.lime) },
    { name: 'Kitchen', art: (cx, y) => rect(cx - 170, y + 160, 340, 80, C.violet, 20) + [-110, -37, 37, 110].map((d) => `<ellipse cx="${cx + d}" cy="${y + 145}" rx="30" ry="40" fill="${C.white}" stroke="${C.ink}" stroke-width="5"/>`).join('') },
    { name: 'Bathroom', art: (cx, y) => rect(cx - 120, y + 170, 240, 80, C.orange, 18) + [-60, 20].map((d, i) => rect(cx + d, y + 80, 30, 100, i ? C.lime : C.violet, 12) + rect(cx + d - 8, y + 50, 46, 34, C.white, 8)).join('') + drop(cx + 165, y + 130, 0.8) },
    { name: 'Bedroom', art: (cx, y) => rect(cx - 190, y + 160, 380, 70, C.violet, 20) + rect(cx - 170, y + 125, 110, 45, C.white, 16) + line(cx - 190, y + 90, cx - 190, y + 255, 14) + line(cx + 190, y + 200, cx + 190, y + 255, 14) + rect(cx + 120, y + 80, 90, 60, C.orange, 12) },
    { name: 'Balcony', art: (cx, y) => plant(cx - 70, y + 250, 0.7) + sun(cx + 105, y + 125, 36) + bar(cx - 180, y + 246, 360) },
  ]);
  images['home-measure'] = svg(C.paper, path('M330 330 L560 200 H1270 L1040 330 Z', C.frame) + path('M330 330 H1040 V620 H330 Z', WOOD) + path('M1040 330 L1270 200 V490 L1040 620 Z', '#C98B4B') + path('M370 322 L575 214 H1215 L1005 322 Z', '#B77B3E', 4) + line(600, 322, 805, 214, 14, C.violet) + line(800, 322, 1005, 214, 14, C.violet) + circle(685, 475, 30, C.ink) + dim(330, 690, 1040, 690, '', 0, 0) + pill(685, 750, 'Width', C.lime) + dim(250, 330, 250, 620, '', 0, 0) + pill(170, 475, 'Height', C.lime) + dim(1100, 650, 1340, 515, '', 0, 0) + pill(1360, 640, 'Depth', C.lime));

  /* ---------- 16. desk setup ---------- */
  images['cover-desk'] = svg(C.violet, rect(180, 640, 1240, 40, WOOD, 14) + rect(260, 680, 36, 220, WOOD, 6) + rect(1300, 680, 36, 220, WOOD, 6) + monitor(560, 342, 1) + phoneStand(260, 640, 0.95) + rect(1080, 540, 100, 100, C.orange, 14) + line(1110, 540, 1095, 440, 12, C.lime) + line(1150, 540, 1170, 452, 12, C.white) + plant(1310, 640, 0.75, C.lime) + rect(620, 612, 260, 28, C.white, 8) + circle(930, 624, 20, C.white), dots(0.16));
  images['desk-zones'] = svg(C.paper, card(90, 90, 1420, 720, '#E9B77E') + rect(430, 330, 740, 430, C.lime, 30, 5, { 'stroke-dasharray': '18 14' }) + rect(150, 330, 250, 430, C.white, 30, 5) + rect(1200, 330, 250, 430, C.white, 30, 5) + rect(150, 130, 1300, 170, C.violet, 30, 5) + title(800, 235, 'Storage zone: chargers and spares', 56, C.white) + rect(560, 440, 400, 150, C.ink, 18) + circle(1040, 515, 36, C.ink) + rect(620, 620, 280, 100, C.white, 12) + title(800, 395, 'Work zone', 50) + title(275, 395, 'Reach', 46) + rect(220, 450, 110, 180, C.violet, 20) + circle(275, 695, 36, C.orange) + title(1325, 395, 'Reach', 46) + rect(1260, 450, 130, 130, C.orange, 12) + circle(1325, 665, 46, C.violet2));
  const deskBase = (cx) => rect(cx - 280, 460, 560, 28, WOOD, 10) + rect(cx - 250, 488, 24, 150, WOOD, 4) + rect(cx + 226, 488, 24, 150, WOOD, 4) + monitor(cx - 90, 310, 0.5);
  images['desk-cables'] = panels([
    { title: 'Before', art: (cx) => deskBase(cx) + path(`M${cx} 450 C${cx - 250} 600 ${cx + 220} 500 ${cx - 80} 620 M${cx - 180} 460 C${cx + 160} 540 ${cx - 200} 590 ${cx + 150} 630 M${cx + 180} 465 C${cx} 640 ${cx - 120} 470 ${cx + 30} 636`, 'none', 9, { stroke: C.violet }), caption: 'Cables cross and fall', mark: 'cross' },
    { title: 'After', art: (cx) => deskBase(cx) + path(`M${cx} 450 V498 H${cx + 214} V636`, 'none', 14, { stroke: C.violet }) + [60, 140].map((d) => rect(cx + d, 484, 26, 28, C.orange, 6, 4)).join('') + rect(cx + 202, 550, 34, 24, C.orange, 6, 4), caption: 'One route, clipped in place', mark: 'tick' },
  ]);

  /* ---------- 17. die-cast displays ---------- */
  images['cover-diecast'] = svg(C.orange, [[470, 300], [800, 300], [1130, 300], [635, 592], [965, 592]].map(([x, y], i) => hex(x, y, 190, C.white) + car(x - 112, y + 55, [C.violet, C.lime, C.ink, C.orange, C.violet2][i], 1.15)).join(''), dots());
  images['diecast-layouts'] = panels([
    { title: 'Shelf row', art: (cx) => rect(cx - 190, 500, 380, 26, WOOD, 8) + car(cx - 180, 498, C.violet, 0.85) + car(cx + 5, 498, C.orange, 0.85), caption: 'No drilling needed' },
    { title: 'Wall pattern', art: (cx) => [[-70, 360], [70, 440], [-70, 520]].map(([d, y], i) => hex(cx + d, y, 92, C.lime) + car(cx + d - 54, y + 28, [C.violet, C.orange, C.ink][i], 0.55)).join(''), caption: 'Grows with the collection' },
    { title: 'Stepped stand', art: (cx) => path(`M${cx - 190} 610 V530 H${cx - 60} V440 H${cx + 60} V350 H${cx + 190} V610 Z`, C.violet) + car(cx - 184, 530, C.lime, 0.6) + car(cx - 58, 440, C.orange, 0.6) + car(cx + 66, 350, C.white, 0.6), caption: 'See every row' },
  ]);
  images['diecast-care'] = panels([
    { title: 'Soft brush', art: (cx) => brush(cx + 40, 400, 35, C.lime) + car(cx - 140, 580, C.violet, 1.2), caption: 'Dust gently' },
    { title: 'Shade', art: (cx) => sun(cx, 410, 70), caption: 'No direct sun', mark: 'cross' },
    { title: 'Fixings', art: (cx) => rect(cx - 110, 400, 220, 70, C.violet, 14) + circle(cx - 65, 435, 22, C.frame) + circle(cx + 65, 435, 22, C.frame) + path(`M${cx - 77} 423 l24 24 M${cx + 53} 423 l24 24`, 'none', 6) + magnifier(cx + 40, 470, 60), caption: 'Check now and then' },
    { title: 'Rotate', art: (cx) => recycle(cx, 445, 130) + car(cx - 62, 480, C.orange, 0.62), caption: 'Swap models around' },
  ]);

  /* ---------- 18. rackets ---------- */
  images['cover-rackets'] = svg(C.paper, rect(0, 0, W, 760, C.violet, 0, 0) + rect(300, 300, 1000, 70, C.white, 24) + [420, 610, 800, 990, 1180].map((x, i) => racket(x, 480, [-3, 2, 0, -2, 3][i], [C.lime, C.orange, C.white, C.lime, C.orange][i]).replaceAll(`fill="${C.white}"`, `fill="rgba(255,255,255,.2)"`)).join('') + circle(180, 660, 55, C.lime) + path('M150 615 Q205 660 150 705', 'none', 6) + layers(780), dots(0.16));
  images['rackets-spots'] = tiles([
    { name: 'Shaded wall: good', art: (cx, y) => rect(cx - 170, y + 100, 340, 30, C.violet, 12) + group(cx - 70, y + 165, 0.7, racket(0, 0, 0, C.orange)) + group(cx + 70, y + 165, 0.7, racket(0, 0, 0, C.violet)) + tick(cx + 260, y + 80, 40) },
    { name: 'Car boot: poor', fill: C.orange, art: (cx, y) => path(`M${cx - 200} ${y + 210} V${y + 150} Q${cx - 150} ${y + 140} ${cx - 100} ${y + 80} H${cx + 90} L${cx + 180} ${y + 150} V${y + 210} Z`, C.violet) + circle(cx - 110, y + 220, 38, C.ink) + circle(cx + 100, y + 220, 38, C.ink) + cross(cx + 260, y + 80, 40) },
    { name: 'Sunny window: poor', fill: C.orange, art: (cx, y) => rect(cx - 130, y + 50, 260, 200, C.white, 12) + line(cx, y + 50, cx, y + 250) + line(cx - 130, y + 150, cx + 130, y + 150) + sun(cx - 60, y + 105, 24) + cross(cx + 260, y + 80, 40) },
    { name: 'Damp corner: poor', fill: C.orange, art: (cx, y) => path(`M${cx - 150} ${y + 40} V${y + 250} H${cx + 150}`, 'none', 14) + drop(cx - 60, y + 110, 0.9) + drop(cx + 20, y + 170, 0.7) + drop(cx + 80, y + 90, 0.6) + cross(cx + 260, y + 80, 40) },
  ]);
  images['rackets-wall'] = svg(C.paper, card(90, 90, 1420, 720) + rect(340, 300, 920, 66, C.violet, 20) + circle(400, 333, 17, C.frame) + circle(1200, 333, 17, C.frame) + [520, 800, 1080].map((x, i) => racket(x, 468, 0, [C.orange, C.violet, C.ink][i])).join('') + pill(800, 160, 'Keep it level', C.lime, C.ink, 340) + line(340, 215, 1260, 215, 5, C.ink, { 'stroke-dasharray': '14 12' }) + arrow(230, 520, 385, 355, 7) + pill(260, 560, 'Strong fixings', C.lime, C.ink, 300) + dim(540, 690, 780, 690, '', 0, 0) + dim(820, 690, 1060, 690, '', 0, 0) + pill(800, 750, 'Space between rackets', C.lime, C.ink, 440));

  /* ---------- 19. gifts ---------- */
  images['cover-gifts'] = svg(C.violet, shadow(800, 780, 560) + gift(270, 380, 1.75, C.orange, C.white) + gift(760, 490, 1.25, C.lime, C.violet2) + gift(1100, 420, 1.6, C.white, C.orange) + [[240, 200], [700, 270], [1000, 180], [1380, 260]].map(([x, y], i) => path(`M${x} ${y - 36} L${x + 10} ${y - 10} L${x + 36} ${y} L${x + 10} ${y + 10} L${x} ${y + 36} L${x - 10} ${y + 10} L${x - 36} ${y} L${x - 10} ${y - 10} Z`, i % 2 ? C.orange : C.lime, 4)).join(''), dots(0.16));
  images['gifts-ideas'] = tiles([
    { name: 'Name plate', art: (cx, y) => nameplate(cx - 170, y + 90, 340, 150, 'Anya', C.ink, C.lime, 76) },
    { name: 'Keychain', art: (cx, y) => circle(cx - 100, y + 150, 55, 'none', 12) + line(cx - 55, y + 160, cx - 10, y + 170, 10) + rect(cx - 15, y + 125, 170, 100, C.orange, 26) + circle(cx + 15, y + 160, 12, C.white, 4) + title(cx + 90, y + 195, 'RK', 56) },
    { name: 'Desk stand', art: (cx, y) => phoneStand(cx - 95, y + 250, 0.95) },
    { name: 'Display rack', art: (cx, y) => rect(cx - 180, y + 210, 360, 24, WOOD, 8) + car(cx - 175, y + 208, C.violet, 0.85) + car(cx + 5, y + 208, C.orange, 0.85) },
    { name: 'Plant pot', art: (cx, y) => plant(cx, y + 250, 0.7, C.violet) },
    { name: 'Miniature', art: (cx, y) => circle(cx, y + 95, 42, C.violet2) + path(`M${cx - 60} ${y + 230} Q${cx - 55} ${y + 140} ${cx} ${y + 138} Q${cx + 55} ${y + 140} ${cx + 60} ${y + 230} Z`, C.violet) + rect(cx - 90, y + 230, 180, 28, C.ink, 8) },
  ]);
  images['gifts-timeline'] = flow([
    { name: 'Idea', art: (cx) => bulb(cx, 440, 0.95) },
    { name: 'Details', art: (cx) => doc(cx - 70, 350, 140, 180) + textLines(cx - 42, 410, 90, 4, 28) },
    { name: 'Approve', art: (cx) => nameplate(cx - 100, 380, 200, 110, 'Anya', C.ink, C.lime, 46) + tick(cx + 70, 505, 36) },
    { name: 'Print and check', art: (cx) => printer(cx - 100, 330, 0.4, 0.7) },
    { name: 'Deliver', art: (cx) => gift(cx - 92, 360, 0.84) },
  ]);

  /* ---------- 20. small business ---------- */
  images['cover-business'] = svg(C.lime, shadow(540, 790, 380) + shop(320, 360, 1.18) + rect(930, 620, 460, 36, WOOD, 10) + rect(960, 656, 28, 150, WOOD, 4) + rect(1330, 656, 28, 150, WOOD, 4) + nameplate(960, 520, 240, 100, 'Open', C.ink, C.lime, 52) + vase(1300, 618, 230, 75, undefined, 11) + parcel(1060, 230, 1.2), dots());
  images['business-uses'] = tiles([
    { name: 'Counter display', art: (cx, y) => path(`M${cx - 160} ${y + 250} H${cx + 160} L${cx + 120} ${y + 190} H${cx - 120} Z`, C.violet) + [-80, 0, 80].map((d, i) => rect(cx + d - 32, y + 80, 64, 112, [C.lime, C.orange, C.white][i], 10)).join('') },
    { name: 'Shop sign', art: (cx, y) => line(cx - 110, y + 40, cx - 110, y + 100) + line(cx + 110, y + 40, cx + 110, y + 100) + nameplate(cx - 170, y + 100, 340, 140, 'Open', C.violet, C.white, 70) },
    { name: 'Packing jig', art: (cx, y) => path(`M${cx - 180} ${y + 140} H${cx - 90} V${y + 200} H${cx + 90} V${y + 140} H${cx + 180} V${y + 250} H${cx - 180} Z`, C.violet) + rect(cx - 80, y + 90, 160, 105, C.orange, 12) },
    { name: 'Prototype', art: (cx, y) => cube(cx - 90, y + 110, 90) + magnifier(cx + 75, y + 130, 50) },
    { name: 'Branded gift', art: (cx, y) => gift(cx - 100, y + 40, 0.95) },
    { name: 'Spare part', art: (cx, y) => gearShape(cx, y + 150, 72, C.orange) },
  ]);
  images['business-sample'] = flow([
    { name: 'One sample', art: (cx) => cube(cx - 90, 400, 90) },
    { name: 'Feedback', art: (cx) => path(`M${cx - 120} 360 H${cx + 120} V480 H${cx} L${cx - 50} 530 V480 H${cx - 120} Z`, C.lime) + [-55, 0, 55].map((d) => circle(cx + d, 420, 15, C.ink, 0)).join('') },
    { name: 'Approved batch', art: (cx) => [[-130, 450], [-40, 450], [50, 450], [-85, 395], [5, 395]].map(([d, y]) => cube(cx + d, y, 38)).join('') + tick(cx + 105, 370, 38) },
  ]);

  /* ---------- 21. students ---------- */
  images['cover-students'] = svg(C.paper, rect(0, 700, W, 200, WOOD, 0, 0) + laptop(220, 392, 1.05, C.violet) + cube(390, 520, 55, C.lime, C.white, C.frame) + person(900, 700, 1.9, C.violet) + path('M780 280 L900 225 L1020 280 L900 335 Z', C.ink) + line(1000, 292, 1000, 370, 8) + rect(1130, 580, 250, 90, C.orange, 20) + circle(1170, 685, 36, C.ink) + circle(1340, 685, 36, C.ink) + circle(1255, 540, 36, C.lime) + line(1255, 575, 1255, 582, 8) + bulb(1260, 300, 1.1), dots());
  images['students-parts'] = panels([
    { title: 'Print', art: (cx) => rect(cx - 120, 450, 240, 100, C.violet, 20) + circle(cx - 70, 570, 40, C.violet2) + circle(cx + 70, 570, 40, C.violet2) + bracket(cx - 60, 320, 0.45, C.lime), caption: 'Custom shapes and mounts' },
    { title: 'Buy', art: (cx) => [-70, 30].map((d, i) => rect(cx + d, 330 + i * 40, 34, 230, C.frame, 6) + rect(cx + d - 20, 310 + i * 40, 74, 34, C.frame, 8)).join('') + gearShape(cx + 100, 380, 36, C.orange), caption: 'Screws, rods, and sheets' },
    { title: 'Electronics', art: (cx) => rect(cx - 150, 340, 300, 220, '#2E7D5B', 18) + rect(cx - 60, 400, 120, 100, C.ink, 8) + [-110, -70, 80, 120].map((d) => circle(cx + d, 375, 12, C.lime, 3) + line(cx + d, 387, cx + d, 440, 5, C.lime)).join('') + rect(cx - 130, 500, 60, 34, C.orange, 6, 4), caption: 'Boards, motors, and wires' },
  ]);
  images['students-plan'] = flow([
    { name: 'Sketch', art: (cx) => doc(cx - 70, 350, 140, 180) + path(`M${cx - 40} 490 L${cx - 40} 420 L${cx + 30} 420 L${cx + 30} 490`, 'none', 6, { stroke: C.violet }) },
    { name: 'Model', art: (cx) => cube(cx - 80, 410, 80) },
    { name: 'Test print', art: (cx) => printer(cx - 100, 330, 0.4, 0.45) },
    { name: 'Revise', art: (cx) => recycle(cx, 450, 95) },
    { name: 'Final print', art: (cx) => trophy(cx, 440, 1.1) },
  ]);

  /* ---------- 22. prototype ---------- */
  images['cover-prototype'] = svg(C.violet, bulb(290, 430, 1.7) + arrow(480, 450, 590, 450, 16, C.white) + card(630, 270, 330, 380, C.white) + path('M700 560 L700 430 L800 360 L895 430 L895 560 Z', 'none', 7, { 'stroke-dasharray': '16 12' }) + arrow(1005, 450, 1115, 450, 16, C.white) + shadow(1315, 640, 150) + path('M1190 630 L1190 440 L1310 340 L1440 440 L1440 630 Z', C.lime) + rect(1280, 520, 70, 110, C.orange, 8), dots(0.16));
  images['proto-stages'] = panels([
    { title: 'Sketch', art: (cx) => doc(cx - 110, 320, 220, 280) + path(`M${cx - 60} 520 L${cx - 60} 440 L${cx} 390 L${cx + 60} 440 L${cx + 60} 520 Z`, 'none', 6, { stroke: C.violet }), caption: 'Is it worth pursuing?' },
    { title: 'Rough', art: (cx) => column(cx, 580, 200, 220, 6, C.frame, C.shade), caption: 'Is the size right?' },
    { title: 'Working', art: (cx) => column(cx, 580, 200, 220, 14) + rect(cx - 45, 470, 90, 110, C.ink, 8) + gearShape(cx + 100, 350, 34), caption: 'Does it do the job?' },
    { title: 'Sample', art: (cx) => column(cx, 580, 200, 220, 30, C.lime, '#C4EE20') + rect(cx - 45, 470, 90, 110, C.violet, 8) + tick(cx + 105, 340, 38), caption: 'Will people like it?' },
  ]);
  images['proto-loop'] = svg(C.paper, circle(800, 450, 290, 'none', 22) + [[800, 160, 'Design', C.violet], [1090, 450, 'Print', C.orange], [800, 740, 'Test', C.lime], [510, 450, 'Learn', C.white]].map(([x, y, s, f]) => card(x - 150, y - 80, 300, 160, f) + title(x, y + 22, s, 62, inkOn(f))).join('') + [45, 135, 225, 315].map((a) => {
    const r = (a * Math.PI) / 180;
    const x = 800 + 290 * Math.sin(r);
    const y = 450 - 290 * Math.cos(r);
    return `<g transform="translate(${x} ${y}) rotate(${a})">${path('M-14 -30 L30 0 L-14 30 Z', C.ink)}</g>`;
  }).join('') + title(800, 475, 'Repeat', 70, C.violet));

  /* ---------- 23. copyright ---------- */
  images['cover-copyright'] = svg(C.paper, doc(290, 170, 440, 560) + textLines(350, 300, 320, 4, 46) + cube(420, 520, 90) + circle(1090, 420, 220, C.lime) + `<text x="1090" y="515" text-anchor="middle" font-family="Anton" font-size="280" fill="${C.ink}">©</text>` + lock(780, 600, 0.95) + key(1220, 720, 1.1, C.violet2), dots());
  images['copyright-types'] = tiles([
    { name: 'Copyright: creative works', art: (cx, y) => circle(cx, y + 150, 95, C.lime) + `<text x="${cx}" y="${y + 195}" text-anchor="middle" font-family="Anton" font-size="130" fill="${C.ink}">©</text>` },
    { name: 'Trademark: names and logos', art: (cx, y) => path(`M${cx - 120} ${y + 80} H${cx + 60} L${cx + 140} ${y + 155} L${cx + 60} ${y + 230} H${cx - 120} Z`, C.orange) + title(cx - 25, y + 190, 'TM', 96), fill: C.orange },
    { name: 'Design: product shapes', art: (cx, y) => vase(cx, y + 255, 200, 90, undefined, 11), fill: C.violet },
    { name: 'Patent: inventions', art: (cx, y) => gearShape(cx - 55, y + 160, 68) + gearShape(cx + 85, y + 115, 40, C.violet2), fill: C.white },
  ]);
  images['copyright-check'] = checklist('Before you send a file', ['Did you make it, or hold the rights?', 'What does the licence allow?', 'Is paid printing or selling allowed?', 'Are the names and logos yours?', 'Is it lawful and safe to make?']);

  /* ---------- 24. painting ---------- */
  images['cover-painting'] = svg(C.lime, shadow(620, 780, 300) + vase(620, 770, 560, 240, (i) => (i > 11 ? C.frame : i % 2 ? C.violet2 : C.violet), 24) + brush(930, 290, 48, C.violet) + [[1150, C.violet], [1300, C.orange]].map(([x, f]) => rect(x - 65, 580, 130, 190, C.white, 14) + rect(x - 65, 620, 130, 80, f, 0, 4) + rect(x - 75, 560, 150, 40, C.frame, 8)).join('') + drop(1150, 460, 1.1, C.violet) + drop(1300, 400, 1.1, C.orange), dots());
  images['painting-steps'] = flow([
    { name: 'Clean up', art: (cx) => path(`M${cx - 90} 520 L${cx + 20} 390 L${cx + 50} 415 L${cx - 55} 540 Z`, C.frame) + path(`M${cx + 20} 390 L${cx + 80} 340 L${cx + 50} 415 Z`, C.white) + circle(cx + 50, 510, 16, C.violet) },
    { name: 'Sand', art: (cx) => column(cx - 30, 540, 120, 190, 9) + `<g transform="rotate(18 ${cx + 55} 430)">${rect(cx + 20, 380, 80, 100, WOOD, 10)}</g>` },
    { name: 'Prime', art: (cx) => column(cx - 40, 540, 110, 190, 24, C.frame, C.shade) + rect(cx + 50, 420, 55, 120, C.white, 10) + rect(cx + 62, 390, 30, 32, C.ink, 4) + [0, 1, 2, 3].map((i) => circle(cx + 25 - i * 14, 395 + (i % 2) * 24, 5, C.muted, 0)).join('') },
    { name: 'Paint', art: (cx) => column(cx - 30, 540, 120, 190, 24, C.orange, '#FF8442') + brush(cx + 60, 400, 30, C.orange) },
    { name: 'Seal', art: (cx) => column(cx, 540, 120, 190, 24, C.orange, '#FF8442') + path(`M${cx - 35} 380 Q${cx - 50} 440 ${cx - 35} 500`, 'none', 14, { stroke: C.white }) + tick(cx + 80, 370, 32) },
  ]);
  images['painting-grits'] = panels([
    { title: '120 to 180', fill: C.white, art: (cx) => path(`M${cx - 150} 600 V430 L${Array.from({ length: 10 }, (_, i) => `${cx - 135 + i * 30} ${i % 2 ? 450 : 390}`).join(' L')} L${cx + 150} 430 V600 Z`, C.violet), caption: 'Remove marks and ridges' },
    { title: '240 to 320', art: (cx) => path(`M${cx - 150} 600 V420 L${Array.from({ length: 18 }, (_, i) => `${cx - 142 + i * 17} ${i % 2 ? 430 : 405}`).join(' L')} L${cx + 150} 420 V600 Z`, C.violet), caption: 'Erase the scratches' },
    { title: '400', art: (cx) => path(`M${cx - 150} 600 V418 Q${cx - 75} 405 ${cx} 418 Q${cx + 75} 431 ${cx + 150} 418 V600 Z`, C.violet), caption: 'Even surface for primer' },
    { title: '600 and up', art: (cx) => rect(cx - 150, 415, 300, 185, C.violet, 10) + line(cx - 100, 440, cx + 60, 440, 10, C.white), caption: 'Between coats' },
  ]);

  /* ---------- 25. gluing ---------- */
  images['cover-gluing'] = svg(C.orange, shadow(800, 790, 520) + path('M360 760 V360 H740 L690 430 L760 500 L690 580 L750 650 L700 760 Z', C.violet) + path('M1240 760 V360 H870 L820 430 L890 500 L820 580 L880 650 L830 760 Z', C.violet2) + tube(1000, 200, 38, C.lime) + [[815, 330], [770, 270]].map(([x, y], i) => drop(x, y, 0.7 - i * 0.2, C.white)).join('') + arrow(220, 560, 330, 560, 16, C.white) + arrow(1380, 560, 1270, 560, 16, C.white), dots());
  images['gluing-adhesives'] = panels([
    { title: 'Super glue', art: (cx) => tube(cx, 430, 0, C.orange), caption: 'Quick, small joints' },
    { title: 'Epoxy', art: (cx) => tube(cx - 65, 430, 0, C.violet2) + tube(cx + 65, 430, 0, C.lime), caption: 'Strength and gap filling' },
    { title: 'Solvent cement', art: (cx) => rect(cx - 80, 390, 160, 210, C.violet, 20) + rect(cx - 45, 340, 90, 56, C.ink, 10) + path(`M${cx} 440 L${cx + 55} 540 H${cx - 55} Z`, C.lime) + title(cx, 530, '!', 70), caption: 'Some plastics, with great care' },
  ]);
  images['gluing-steps'] = flow([
    { name: 'Dry fit', art: (cx) => path(`M${cx - 110} 390 H${cx - 10} V430 H${cx + 25} V480 H${cx - 10} V520 H${cx - 110} Z`, C.violet) + path(`M${cx + 120} 390 H${cx + 15} V430 H${cx + 50} V480 H${cx + 15} V520 H${cx + 120} Z`, C.orange) },
    { name: 'Clean and rough', art: (cx) => rect(cx - 100, 440, 200, 90, C.violet, 12) + `<g transform="rotate(-12 ${cx} 390)">${rect(cx - 60, 360, 130, 60, WOOD, 10)}</g>` + path(`M${cx - 70} 540 l20 -12 M${cx} 545 l24 -12 M${cx + 60} 540 l20 -12`, 'none', 5) },
    { name: 'Thin layer', art: (cx) => rect(cx - 110, 470, 220, 70, C.violet, 12) + rect(cx - 100, 455, 200, 16, C.lime, 8, 4) + tube(cx + 40, 360, 25, C.orange).replace('translate(', 'translate(').replace('rotate(25)', 'rotate(25) scale(.5)') },
    { name: 'Clamp and wait', art: (cx) => rect(cx - 60, 400, 120, 120, C.violet, 8) + path(`M${cx - 110} 370 H${cx + 80} M${cx - 110} 370 V560 H${cx + 80}`, 'none', 26) + rect(cx - 12, 520, 24, 30, C.frame, 4) + rect(cx + 70, 346, 40, 48, C.orange, 8) },
  ]);

  return images;
}
