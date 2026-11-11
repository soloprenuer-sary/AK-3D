# Akrinity Motion and 3D Spec, Draft 1

Status: PLANNING AND DESIGN ONLY. Nothing here is built. For Satyam's approval before any motion code is written.
Date: 2026-11-12. Belongs with `BUILD_PLAN_DRAFT_3_HEADLESS.md` (section 6). Stack: React (Next.js), GSAP + ScrollTrigger (free for commercial use), three.js via @react-three/fiber.
Tags: **[VERIFY]** measure or confirm before relying on it. **[INFERRED]** my proposal, not a sourced fact. **[DECIDE]** needs Satyam's choice.

---

## 0. Decisions so far

| Decision | Status |
|---|---|
| Hero | **A, scroll-built vase: chosen by Satyam (2026-11-12).** Full tier gets the 3D vase; Light tier gets the 2D layered-bar version (C); Static tier gets the static disc. If measurements on a low-end Android show A hurts mobile LCP or frame rate, A becomes desktop-only and phones get C. |
| Amend the design rule to "no autoplay loops; scroll or pointer driven; every effect has a fallback" | **Approved by Satyam (2026-11-12).** The wording on the canvas System board ("Respect prefers-reduced-motion; no autoplay motion") has not been edited yet; update it there so the design and the build agree. |
| Device tiers Full / Light / Static | Open |
| Smooth-scroll library | Open (proposal: none) |
| Section motion table (section 5) | Open |

---

## 1. Principles

1. **Content first, motion second.** Every page is fully readable and usable as static HTML/CSS before any animation or 3D code loads.
2. **Motion explains 3D printing.** The brand idea is "made layer by layer". Motion should build, stack and reveal in layers, not spin or float for decoration.
3. **The visitor drives it.** Motion responds to scroll and pointer. No autoplay loops.
4. **Everything has a static fallback** (reduced motion, low-end phone, no WebGL, slow connection, JavaScript error).
5. **Mobile speed is priority 1.** Motion must never delay the first meaningful paint or block taps.

### Conflict with the design: resolved (amendment approved 2026-11-12)

The System board says: "Respect prefers-reduced-motion; no autoplay motion." Scroll- and pointer-driven effects are compatible with that rule; continuous autoplay is not. Proposal: amend the board line to "No autoplay loops. Motion is driven by scroll or pointer, and every effect has a reduced-motion and low-end fallback."

---

## 2. Device tiers and fallbacks **[INFERRED]**

The frontend picks a tier once, on load, from signals the browser exposes, and never blocks rendering to do so.

| Tier | Who | What loads |
|---|---|---|
| **Full** | Desktop and recent phones with good connection | GSAP scroll effects + 3D hero + parallax |
| **Light** | Mid-range phones, Save-Data off but limited CPU/memory signals | GSAP reveals only (no 3D, no parallax); hero shows the static layered disc |
| **Static** | `prefers-reduced-motion: reduce`, Save-Data on, 2g/3g connection, very low memory, no WebGL, or any script error | No GSAP, no 3D; everything visible immediately; hover effects stay (CSS) |

Signals to read **[VERIFY]** for support: `prefers-reduced-motion`, `navigator.connection.saveData` / `effectiveType` (not in all browsers), `navigator.deviceMemory` and `hardwareConcurrency` (approximate), WebGL context creation, and a short measured frame-rate probe after load. Tier can also be forced with a URL flag for testing.

---

## 3. Performance and accessibility budgets **[INFERRED]** (to be measured on a real mid-range Android)

| Item | Budget |
|---|---|
| LCP on home, throttled mid-range phone | under 2.5 s, **with motion and 3D code not on the critical path** |
| JS before 3D (React app, GSAP core, ScrollTrigger) | home page under about 200 KB gzip |
| 3D hero chunk (three.js subset + scene) | lazy; **three.js is large**, a trimmed three + r3f build is likely in the range of 150 to 250 KB gzip **[VERIFY]** by measuring; loaded only on the Full tier, after load, when the hero is visible |
| Frame rate | 60 fps desktop; 30 fps floor on mid-range phones, else drop to the Light tier |
| Main-thread blocking | no single task over 50 ms from animation setup |
| Layout shift | zero from motion (animate `transform` and `opacity` only) |
| Accessibility | all content in the DOM and readable in reading order; focus never trapped by effects; no parallax or movement on text that must be read; focus outline (3px violet) unchanged; the 3D canvas is decorative (`aria-hidden`) with the headline and buttons as normal HTML |

Measurement plan: Lighthouse CI in the repo, a real Android phone test pass before each release of motion changes, and an on/off flag per effect so any effect can be disabled without a rebuild.

---

## 4. Hero 3D: options **[DECIDE]**

The design's hero is a lime disc (540 px, ink border) with 30 stacked violet bars (14 px tall, 4 px gap) and a rotating-text badge. Three ways to evolve it:

| | A. Scroll-built vase (recommended) | B. Pointer-reactive object | C. 2D layers only (no three.js on home) |
|---|---|---|---|
| Idea | A printed vase builds layer by layer as the visitor scrolls the hero; a small nozzle marks the current layer; desktop pointer gives a slight tilt | A finished 3D stack of layers that tilts and separates slightly toward the pointer | The existing stacked bars animate with GSAP: they rise and settle in sequence and drift with parallax |
| Fits the brand story | Strongest: shows the printing process | Good | Good, simplest |
| three.js on home | Yes (lazy, Full tier only) | Yes (lazy) | No (three.js kept for product viewer and upload preview) |
| Mobile cost | Highest | Medium | Lowest |
| Autoplay | None (scroll-driven) | None (pointer) | None |
| Fallback | Static layered disc (the board's version) | Same | It is the fallback |

Recommendation: **A on the Full tier, C on the Light tier, the static disc on the Static tier.** One design, three levels, built from the same layer data so they look consistent. If measurements show A hurts mobile LCP or frame rate, ship C and keep A for desktop only.

### 4.1 Technical design of option A

- Geometry: a vase profile (a smooth outline) turned into about 60 thin layers (rings), generated in code. No model file to download, which keeps the payload small. A real product model (STL or GLB) could replace it later.
- Look: flat colour, no lighting, no shadows, no post-processing (matches "no gradients, no blur shadows"). Layers in the violet shades from the board with an ink rim; the disc behind it stays lime (accent variable).
- Scroll link: ScrollTrigger drives one number, progress 0 to 1, which sets how many layers exist and moves the nozzle. Pinning the hero for the build is optional and **off by default on mobile** (pinned scrolling feels bad on phones); the build can instead play as the hero scrolls out of view.
- Pointer: slight tilt (a few degrees) on desktop only; none on touch.
- Rendering: render only while scrolling or interacting (no continuous loop); cap device pixel ratio at about 1.5; antialias off on mobile; pause when off-screen or the tab is hidden; recover from WebGL context loss by showing the static disc; dispose geometry and materials on leave.
- Loading sequence: static HTML/CSS hero paints first (headline, buttons, the layered disc) -> after load and idle, check tier -> dynamic import of the 3D chunk -> cross-fade from the disc to the canvas with no layout shift.
- The rotating-text badge stays CSS (reduced-motion safe), rotating only when the visitor hovers or scrolls, never on a timer.

---

## 5. Motion by home section **[INFERRED]**

Defaults for GSAP effects: duration 0.6 to 0.9 s, ease `power3.out`, stagger 0.06 to 0.1 s, trigger when the element is about 80% into the viewport, play **once**, animate `transform` and `opacity` only, translateY of about 24 px, never hide content permanently if the script fails (elements start visible and are set up by the script, not by CSS). Static tier: none of this runs.

| # | Section | Motion | Parallax | Tier |
|---|---|---|---|---|
| 01 | Announcement bar | None | None | all |
| 02 | Header | Sticky; drawer opens with a short slide; link hover turns violet (CSS) | None | all |
| 03 | Hero | Text lines stagger in; buttons settle; 3D scroll-built vase (Full) or layered-bar rise (Light) | Disc and bars drift 6 to 10% against scroll (Full) | see section 4 |
| 04 | Stats strip | Numbers count up once on first view (real values only) | None | Full, Light |
| 05 | Statement band | Highlight chip draws in; heading reveals line by line | Band background shape drifts slowly | Full, Light |
| 06 | Shop by category | Tiles stagger up; hover lift with hard shadow (CSS) | Decorative stripe shape inside each tile moves 8 to 12% | Full, Light |
| 07 | Custom print banner | Violet card slides up; upload mock card enters with a slight offset | None | Full, Light |
| 08 | Best sellers | Cards stagger up; hover shadow and add-button colour change (CSS) | None | Full, Light |
| 09 | Process | Five cards reveal in sequence; each numeral highlights as it enters | None | Full, Light |
| 10 | Materials | Cards reveal; colour header shifts slightly | Header blocks drift 4 to 6% | Full, Light |
| 11 | Selected work | Tiles reveal; image scale 1.03 on hover (CSS) | Tiles move at slightly different speeds (6 to 10%) | Full, Light |
| 12 | Final CTA | Headline reveals; buttons settle | None | Full, Light |
| 13 | Footer | None | None | all |

Rules for parallax: decorative layers only, small amounts, transform only, off on Static, and off for any element inside a form.

### Smooth scrolling **[DECIDE]**

Proposal: **no smooth-scroll library.** It can hurt accessibility and mobile feel, and native scroll with ScrollTrigger is enough. Revisit only if Satyam wants it after seeing the pages.

---

## 6. Other places for motion and 3D

| Place | Proposal | Tier |
|---|---|---|
| Product page gallery | Image zoom on hover/tap; **3D viewer tab** (three.js, loads on click, STL/GLB) for products that have a model | Viewer loads on demand on any tier that supports WebGL |
| Quote page | Instant file preview in the browser (STL, 3MF, OBJ; STEP/IGES via a lazy converter) with orbit, dimensions and an advisory volume figure; upload progress ring | On demand |
| Cart / checkout | Only functional feedback (drawer slide, add-to-cart confirmation); no decorative motion near payment or forms | all |
| Account / order tracking | Status timeline fills step by step on load (once), respecting reduced motion | Full, Light |
| Page transitions | None at first (fast, simple); revisit later | none |

---

## 7. Assets and decisions needed

**Assets (none needed for option A or C):** the vase profile is generated in code. For product viewers later: GLB or STL files per product, kept small (decimated), and poster images for the static state.

**Decisions for Satyam**

1. Hero: A (scroll-built vase, recommended), B (pointer object), or C (2D layers only)?
2. Amend the design rule to "no autoplay loops; motion is scroll or pointer driven, with fallbacks"?
3. Which tiers: confirm Full / Light / Static as described?
4. Smooth scrolling: no (recommended)?
5. Any section where he wants more or less motion than the table shows?

**Before building** (spikes, from the plan): run the hero on a low-end Android and record frame rate, memory and LCP impact; measure the real 3D chunk size; test that the tier detection works on several devices.
