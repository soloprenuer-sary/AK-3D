# Akrinity Brand Guideline

Version 1.0, 2026-11-12. Source of truth for how Akrinity looks and sounds. Derived from the design canvas (v2, "bold and playful"), the System board, and decisions made with Satyam. Where this file and the canvas differ, the canvas System board wins until this file is updated. Tags: **[DECIDE]** open choice, **[VERIFY]** check before relying on it.

---

## 1. Who Akrinity is

- A 3D printing business in Mumbai, India, run by Satyam (computer science graduate, five years of WordPress experience, building the site himself).
- Already sells ready-made 3D printed products on Amazon.in under the seller name "Akrinity". Already has the business name, logo, domain, product photos and GST registration.
- Offers three things: **ready-made products** (in stock and made to order), **custom printing** from the customer's file (STL, 3MF, OBJ, STEP, IGES), and **design-and-print** from a sketch, photo or idea (JPG, PNG, PDF).
- Materials: PLA/PLA+, PETG, ABS/ASA, resin (SLA/MSLA). No TPU for now.
- Audience: everyday shoppers, businesses, hobbyists and makers, students. India first, English only, international later.
- Site role: a second channel next to Amazon, and the home for custom work, B2B and repeat buyers.

### Brand idea

**"Made layer by layer."** Every design choice should echo what 3D printing is: building up in thin, visible layers. Stacked bars, layer-line stripes, a nozzle that prints a part, process steps that stack. The tone is bold, playful and direct, and the craft is honest and precise.

### Personality

Confident, friendly, plain-spoken, a little playful. Like a skilled maker who explains things clearly and does not oversell. Never corporate, never cute for its own sake.

---

## 2. Name and logo

- Name: **Akrinity** (display form: AKRINITY, uppercase in the display face).
- Wordmark in designs: Anton, uppercase, about 34 px in the header, with a **12 px lime dot** to the right (1.5 px ink border). Footer wordmark Anton about 40 px.
- The owner's real logo file is not yet supplied. **[DECIDE]** Replace the placeholder wordmark with the real logo (SVG) when received, and match the accent colour to it if wanted.
- Do not stretch, recolour outside the palette, add effects or place the wordmark on busy imagery. Keep clear space of at least the dot's diameter on all sides.
- Brand Registry on Amazon and trademark: file the trademark early (₹4,500 per class e-filed for individuals and startups per Amazon's seller blog) **[LAWYER/CA]** to pick classes.

---

## 3. Colour

One accent, switchable by a single variable. Tokens (from the System board):

| Token | Hex | Use |
|---|---|---|
| Ink | `#0B0B0C` | Text, borders, dark sections |
| Paper | `#F3F1EA` | Page background |
| White | `#FFFFFF` | Cards, inputs |
| Accent (lime) | `#D8FF3A` | Primary actions, highlights, announcement bar. Tweakable |
| Violet | `#5B2BE0` | Feature banners, link hover, focus ring, the printed object |
| Orange | `#FF6A1F` | Category and material tiles, nozzle tip, filament |
| Muted | `#55514A` | Secondary text on light |
| Muted on dark | `#B8B4A8` | Secondary text on ink |
| Dark card | `#17171A` | Cards on ink |
| Dark border | `#34343A` | Borders on dark |
| Stripe | `#E3DFD2` (alt `#ECE8DC`) | Photo placeholder lines |
| Error | `#D92D20` | Form errors |

Extra tones used in the printer illustration: frame `#E4E1D7`, frame shade `#D6D2C6`, violet light `#7A52EC`.

Accent alternatives that keep ink text readable: `#FFD23F`, `#7CF5C8`, `#FF9ACB`. Re-check contrast after any accent change.

Pairs that must stay as designed: ink on paper, ink on accent, white on violet, accent on ink, muted on paper, muted-on-dark on ink. All are intended to pass WCAG AA for body text **[VERIFY]** with a contrast checker.

Rules: one accent only; use violet and orange for tiles, banners and the printer, not for body text; no gradients; no blur shadows; no dark-mode palette (single committed light look) **[DECIDE]** if a dark mode is wanted later.

---

## 4. Typography

- **Display:** Anton, weight 400, **always uppercase**, tight line height (about 0.94 to 1.1).
- **UI and body:** Inter (400 to 700).
- Both self-hosted on the real site (latin subset, `font-display: swap`, preload Anton for the hero). Google Fonts is used only in the design samples.

| Style | Spec | Use |
|---|---|---|
| Display XL | Anton 124 / 0.94, caps. Tablet 96, mobile 78 | Home hero |
| Display L | Anton 112 / 0.94, caps. Mobile 64 | Final CTA, quote page title |
| Heading 2 | Anton 72 to 88 / 1.0. Tablet 56, mobile 48 | Section titles |
| Heading 3 | Anton 44 to 56 / 1.0 | Stats, step numbers, product price |
| Card title | Anton 28 / 1.1 | Cards, form section titles |
| Body L | Inter 18 / 1.6, 400, `#55514A`, max 480 to 560 wide | Hero and section intros |
| Body | Inter 16 / 1.5, 400 to 500 | Default copy, inputs |
| Label | Inter 12 / 1.4, 700, +0.12em, caps | Eyebrows, field labels, tags |

Highlight chip: a lime block behind one key word in a headline, radius 14, rotated about -1.5 degrees. Use at most one per heading.

---

## 5. Shape, borders and depth

- Radius: **14** inputs, **16** images inside cards, **24** cards, **32** feature banners, **999** buttons and pills.
- Border: **1.5 px ink** on light surfaces, **1.5 px `#34343A`** on dark.
- Shadow: only the **hard offset shadow** (no blur). `8px 8px 0 ink` for one hero element per page; `4px 4px 0` on button hover; `6px 6px 0` / `8px 8px 0` on card hover.
- No gradients (the only repeating-line backgrounds are the layer-line stripes).
- Layer-line stripes: 6 px lines on a 12 px pitch (`#E3DFD2` / `#ECE8DC`), used as photo placeholders until real photos arrive.

---

## 6. Components (look and states)

- **Buttons:** height 56 (48 in headers and forms), padding 0 28, radius 999, Inter 16 / 700. One primary (lime) per section; others dark or outline. Hover: translate(-2px, -2px) plus a 4 px hard shadow. Focus: 3 px violet outline, 2 px offset. Disabled: 40% opacity.
- **Option pills:** height 48, selected = ink fill with paper text. **Status tags:** 28 to 32 high, 11 to 12 / 700 caps. "In stock" is lime; "Made to order" is white.
- **Inputs:** height 52, radius 14, 1.5 px ink border, text 16 px (never smaller, avoids iOS zoom). Labels always visible above, 12 / 700 caps. Error: 2 px `#D92D20` border plus a message below. Focus: 3 px violet.
- **Cards:** white, radius 24, 1.5 px ink border. Hover: lift 3 px and hard shadow. Product image 1:1, radius 16.
- **Product card (shop):** stripes or photo, tag top-left, save (heart) and quick view buttons top-right on hover, colour dots that recolour the product, "Quick add" bar sliding up, name turns violet on hover, material and category line, price in Anton.
- **Header:** logo left with lime dot, nav centre (Shop, Custom printing, How it works, Portfolio, Business), search and cart as 48 px circles, "Get a quote" dark pill. Sticky.
- **Announcement bar:** lime, ink text, 13 / 600 caps. Content: free-shipping threshold and payment methods.
- **Footer:** ink band, wordmark, newsletter pill, link columns, GSTIN and payment line.
- **Touch targets:** at least 44 px everywhere.

---

## 7. The printer illustration (signature graphic)

- A flat illustration of a modern desktop 3D printer (grey frame, top gantry, spool at the top left, black control screen on the right, white heated bed at the bottom) drawn as SVG, **not** a copy of any brand's product or photo.
- Shows a vase being printed layer by layer: the head sweeps across each layer (left to right, then right to left), the object grows upward, the control-screen progress bar fills, the filament runs from the spool to the head.
- Colours: layers alternate violet `#5B2BE0` and `#7A52EC`; nozzle tip orange; frame warm greys; ink outlines at 2 to 2.5 px.
- Used in two places: the **hero** (layers follow scroll position; scrolling down prints more, up prints less) and a **"Printing now" section** that loops while on screen.
- Fallbacks: Light and Static levels show a still, partly or fully printed object with no movement.
- If the owner wants it to match a specific printer, supply a clean photo of it and redraw to match.

---

## 8. Imagery and content assets

- Use real product and project photos when supplied (products already photographed for Amazon). Target 1200 x 1200 px, WebP, square for product cards and 4:5 for category tiles.
- Photos: clean, well lit, neutral or paper-toned backgrounds, show scale and layer detail. Avoid heavy filters.
- Until photos exist, use the layer-line stripe placeholders and bracketed text.
- Never copy Amazon listing text or images wholesale. Write fresh product copy for the site. Do not import Amazon reviews.
- Customer files are private. Never show a customer's uploaded model publicly without written permission.

---

## 9. Voice and copy

- **Sentence case** for UI text, buttons, labels, menus. Display headings are uppercase through the display face, not typed in capitals.
- Plain, active, verb first. Buttons: "Request a quote", "Add to cart", "Upload a file". 1 to 3 words.
- Contractions are fine. No ampersands in UI text. Serial comma.
- Errors: say what happened and what to do, one sentence. "Use letters, numbers and spaces only." Never blame the customer. No raw error strings.
- Avoid: "please", "successfully", "simply", "just", "easy", exclamation marks on system copy, buzzwords ("leverage", "seamless", "unlock").
- Prices show "incl. GST". Dates and times in plain language. India context: ₹, pincode, GST, UPI, COD.
- Placeholders in brackets until real content exists: `[price]`, `[AMOUNT]`, `[XX] MB`, `[X] hrs`, `[YOUR GSTIN]`, `[Product name]`.
- Core lines in use: "We print anything." / "Made layer by layer." / "Your file. Our printers." / "From file to front door" / "Let's print something." / "Pay only after you approve the quote."

Honest claims only: stats must be real facts (for example "4 material families", "Tracked shipping", "GST invoices for business"), never invented numbers.

---

## 10. Motion (brand level)

- Motion explains printing: build up, stack, sweep, settle. Not decoration.
- Driven by scroll or pointer, or by a looping demo of a print while it is on screen. Decision log: the "no autoplay" rule on the design canvas was **amended** to "no autoplay loops; scroll or pointer driven; every effect has a reduced-motion and low-end fallback" (approved by Satyam 2026-11-12). The "Printing now" loop is a deliberate exception that needs owner confirmation **[DECIDE]**.
- Durations 0.6 to 0.9 s, ease-out (power3.out or `cubic-bezier(.2,.7,.2,1)`), stagger 0.06 to 0.1 s. Animate transform and opacity only.
- Respect `prefers-reduced-motion`, Save-Data, slow connections and low-end devices. Details in `WEBSITE_GUIDELINE.md` and `MOTION_SPEC_DRAFT.md`.

---

## 11. Accessibility (non-negotiable)

- Real buttons, links and labels; every image has alt text; icon-only buttons have `aria-label`.
- Visible focus on every control (3 px violet outline).
- Contrast as in the palette; do not place muted text on violet or orange.
- No information by colour alone (status tags also use text).
- Touch targets 44 px or more; text 16 px or more in inputs.
- Do not use dark patterns (countdown timers, fake scarcity, pre-ticked boxes, forced accounts, hidden charges), which the amended e-commerce rules ban from 1 January 2027.

---

## 12. Brand do and don't

Do: use one lime highlight per section; keep borders and shadows flat and hard; let big Anton headings carry the page; show real layers and real prints.
Don't: add gradients, blur shadows, extra accent colours, emoji as icons, stock photos of random printers, or Amazon copy.

---

## 13. Legal and trust lines

- Footer: "© Akrinity · GSTIN [YOUR GSTIN]" and payment methods line ("UPI · Cards · Netbanking · Cash on Delivery").
- Made-to-order and personalized items are not available as cash on delivery and are not returnable unless faulty (exact wording to be confirmed **[LAWYER/CA]**).
- Required disclosures (legal entity, address, grievance officer, return and refund terms) are listed in `WEBSITE_GUIDELINE.md`.

---

## 14. Reference files

- Design canvas (5 boards): https://claude.ai/artifact/WcmpoCedMZH5GvyVEXiMJX
- Older handoff brief (superseded where it differs): https://claude.ai/artifact/VLWf7raDnewh5Zt6gv1nmr
- Working design sample (home, product, shop): https://claude.ai/artifact/D2jHXWTMc2AgtrnAMq1bqM
- Source of the sample: `design-sample/` in this repo
