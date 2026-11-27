"""Builds the 25 knowledge-hub articles (round 2): content as HTML in the same layout as the
live articles, plus two brand images per article (a cover and a detail card).
Run: python build_articles.py  -> writes assets/ and articles-round-2-html.json
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'assets')
os.makedirs(OUT, exist_ok=True)

INK, PAPER, LIME, VIOLET, ORANGE, WHITE = (11, 11, 12), (243, 241, 234), (216, 255, 58), (91, 43, 224), (255, 106, 31), (255, 255, 255)
F_BOLD = 'C:/Windows/Fonts/bahnschrift.ttf'
F_TEXT = 'C:/Windows/Fonts/arial.ttf'
F_TEXT_B = 'C:/Windows/Fonts/arialbd.ttf'


def font(path, size):
    return ImageFont.truetype(path, size)


def wrap(draw, text, fnt, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=fnt) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def stripes(img, box, colour, gap=14, width=7):
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = box
    for y in range(y0, y1, gap):
        d.rectangle([x0, y, x1, min(y + width, y1)], fill=colour)


def cover(slug, title, cat, accent):
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    # brand block and stripes, as on the site's own pictures
    d.rectangle([0, 0, 520, H], fill=accent)
    stripes(img, (0, 0, 520, H), (0, 0, 0), gap=26, width=5)
    d.rounded_rectangle([60, 70, 460, 560], radius=36, fill=WHITE, outline=INK, width=4)
    # a simple printed object (a stand) in the middle of the card
    d.rounded_rectangle([170, 260, 350, 480], radius=18, fill=INK)
    d.rounded_rectangle([130, 470, 390, 510], radius=10, fill=INK)
    d.rectangle([236, 160, 284, 260], fill=INK)
    d.ellipse([196, 130, 324, 200], fill=INK)
    d.text((80, 520), cat.upper(), font=font(F_TEXT_B, 26), fill=INK)
    # title on the right
    fb = font(F_BOLD, 92)
    lines = wrap(d, title, fb, 620)
    y = 170
    for ln in lines[:4]:
        d.text((560, y), ln, font=fb, fill=INK)
        y += 100
    d.rounded_rectangle([560, 80, 760, 130], radius=25, fill=LIME, outline=INK, width=3)
    d.text((585, 92), 'AKRINITY', font=font(F_BOLD, 28), fill=INK)
    d.text((560, 560), 'Made layer by layer in Mumbai', font=font(F_TEXT, 26), fill=INK)
    img.save(os.path.join(OUT, slug + '-cover.png'))


def detail(slug, heading, points, accent):
    W, H = 1200, 760
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    d.text((70, 60), heading, font=font(F_BOLD, 60), fill=INK)
    d.rectangle([70, 140, 300, 150], fill=accent)
    y = 190
    colours = [LIME, VIOLET, ORANGE, INK]
    for i, pt in enumerate(points[:4]):
        col = colours[i % 4]
        d.rounded_rectangle([70, y, 1130, y + 105], radius=26, fill=WHITE, outline=INK, width=3)
        d.rounded_rectangle([96, y + 26, 152, y + 82], radius=28, fill=col, outline=INK, width=2)
        d.text((118, y + 30), str(i + 1), font=font(F_BOLD, 34), fill=INK if col != INK else WHITE)
        lines = wrap(d, pt, font(F_TEXT, 30), 880)
        ty = y + 22
        for ln in lines[:2]:
            d.text((190, ty), ln, font=font(F_TEXT, 30), fill=INK)
            ty += 40
        y += 125
    d.text((70, 720), 'AKRINITY  ·  Knowledge hub', font=font(F_TEXT_B, 24), fill=INK)
    img.save(os.path.join(OUT, slug + '-detail.png'))


# ---- article content: (slug, title, category, excerpt, accent, blocks)
# blocks: ('p', html) | ('h2', text) | ('ul', [html,...]) | ('fig', 'cover'|'detail', alt, caption) | ('link', text, href)
A = []
def art(slug, title, cat, excerpt, accent, points, blocks):
    A.append(dict(slug=slug, title=title, cat=cat, excerpt=excerpt, accent=accent, points=points, blocks=blocks))

art('tpu-flexible-filament-what-it-is-good-for', 'TPU flexible filament: what it is good for', 'Materials',
    'TPU bends, squeezes and springs back. Here is where a flexible part earns its place, and where a rigid one is better.', LIME,
    ['Protective covers and bumpers', 'Grips and handles', 'Seals, gaskets and pads', 'Print slowly, keep parts simple'],
    [('p', 'Some parts need to give a little. A phone case that absorbs a drop, a grip that feels soft in the hand, a gasket that seals a lid. That is what <strong>TPU</strong> is for. It is a flexible filament that bends, squeezes and returns to shape.'),
     ('h2', 'Where TPU shines'),
     ('ul', ['<strong>Covers and bumpers</strong> that take a knock without cracking.', '<strong>Grips and handles</strong> that sit comfortably in the palm.', '<strong>Seals, gaskets and pads</strong> that press against another surface.']),
     ('fig', 'detail', 'Four tips for printing TPU', 'Four habits that make flexible prints come out clean.'),
     ('h2', 'Where it is the wrong choice'),
     ('p', 'A soft part does not hold a load. For a bracket, a hinge or a part that must keep an exact size, a stiffer material such as <a href="/guides/pla-petg-or-abs-asa-which-filament-for-your-part">PETG or PLA+</a> does the job better.'),
     ('h2', 'Printing tips'),
     ('ul', ['Print slowly, because fast moves make the soft strand buckle in the feed path.', 'Use a direct-drive extruder if you have one. It feeds TPU more reliably.', 'Keep the shape simple. Tall, thin, soft parts wobble on the way up.']),
     ('p', 'Want a flexible part made for you? <a href="/quote">Send us the file</a> and we will tell you whether TPU suits it.')])

art('nylon-pa-strong-parts-for-wear-and-load', 'Nylon (PA): strong parts for wear and load', 'Materials',
    'Nylon is tough, slightly flexible and resists rubbing. It is the choice for gears and clips, if you keep it dry.', VIOLET,
    ['Gears, hinges and clips in daily use', 'Parts that rub against each other', 'Tools that take a knock', 'Keep the spool sealed and dry'],
    [('p', 'If a part has to work every day, slide against another part, or take a knock without snapping, <strong>nylon</strong> (also called PA) is a strong candidate. It is one of the toughest common filaments, and it bends a little before it breaks.'),
     ('h2', 'When nylon is the right answer'),
     ('ul', ['<strong>Gears and clips</strong> used again and again.', '<strong>Parts that rub</strong>, where a rigid plastic would wear through.', '<strong>Tools and holders</strong> that take a fall or a knock.']),
     ('fig', 'detail', 'Nylon before you print', 'Keep it dry, warm the bed, and use an enclosure.'),
     ('h2', 'The catch: moisture'),
     ('p', 'Nylon takes water from the air. A damp spool prints with bubbles, rough walls and weak layers. Keep it in a sealed box with desiccant. If it has been open a while, dry it before you print. Our guide on <a href="/guides/filament-storage-how-moisture-ruins-a-print">filament storage</a> shows how.'),
     ('h2', 'Warping and printing'),
     ('p', 'Nylon shrinks more than PLA as it cools. Use an enclosure if you can, and a build plate that grips it well. Keep large, flat bases to a minimum.'),
     ('p', 'Nylon parts need a little more care, but they last. <a href="/shop">Browse our functional range</a> or <a href="/quote">ask us for a custom part</a>.')])

art('pla-plus-and-tough-pla-when-the-upgrade-is-worth-it', 'PLA+ and tough PLA: when the upgrade is worth it', 'Materials',
    'Standard PLA is crisp and easy, but it snaps. PLA+ and tough PLA bend a little more. Here is how to choose.', ORANGE,
    ['Standard PLA: figurines and decor', 'PLA+ and tough PLA: brackets and covers', 'Heat is the limit for all PLA', 'Check the data sheet for exact temperatures'],
    [('p', 'PLA is the most common 3D printing material for a reason. It prints easily, holds fine detail and comes in many colours. Its weakness is that it is brittle, so a part dropped on a hard floor can crack.'),
     ('h2', 'Standard PLA is best for'),
     ('ul', ['<strong>Figurines and display pieces</strong> that are looked at, not handled.', '<strong>Decor</strong> that stays indoors.', '<strong>Prototypes</strong> where looks matter more than strength.']),
     ('fig', 'detail', 'Choosing between PLA types', 'Look at what the part has to do, then pick.'),
     ('h2', 'PLA+ and tough PLA are better for'),
     ('ul', ['<strong>Brackets and clips</strong> that carry a little weight.', '<strong>Covers and cases</strong> that may be dropped.', '<strong>Parts that are handled</strong> many times a day.']),
     ('h2', 'The limit to know'),
     ('p', 'All PLA softens at fairly low temperatures. A part left on a hot dashboard or in direct sun can sag. For heat, look at <a href="/guides/heat-resistance-which-material-survives-a-hot-place">ASA, ABS or PETG</a>.'),
     ('p', 'Our <a href="/materials/pla">PLA guide</a> covers colours and finishes. Not sure which fits your part? <a href="/contact">Ask us</a>.')])

art('carbon-fibre-filament-stiff-light-and-matte', 'Carbon-fibre filament: stiff, light, and matte', 'Materials',
    'Carbon-fibre filament makes stiff, light parts with a velvet matte finish. It also needs the right nozzle.', INK,
    ['Stiff parts for their weight', 'Matte finish that hides fingerprints', 'Use a hardened nozzle', 'Dry the spool before use'],
    [('p', 'Carbon-fibre filament is a base plastic mixed with short carbon fibres. The result is stiffer than the plastic alone, lighter than most metals and has a dull, velvet look that hides fingerprints.'),
     ('h2', 'Why people choose it'),
     ('ul', ['<strong>Stiffness for weight</strong>, useful for tool handles and drone parts.', '<strong>A matte finish</strong> that looks premium straight off the printer.', '<strong>Less warp</strong> than some unfilled materials.']),
     ('fig', 'detail', 'Before a carbon print', 'Check the nozzle, dry the spool, and print a test.'),
     ('h2', 'The catch: the nozzle'),
     ('p', 'The fibres are hard and wear brass nozzles quickly. Use a <strong>hardened steel</strong> or ruby-tipped nozzle for carbon-filled material. A brass nozzle may last only a few spools.'),
     ('h2', 'Printing tips'),
     ('ul', ['Dry the spool. The base plastic still takes in moisture.', 'Add wall thickness to thin sections, because the material can be brittle there.', 'Clean the nozzle often, since fibres leave residue.']),
     ('p', 'Looking for a stiff, light part? <a href="/quote">Send us your file</a>.')])

art('resin-or-filament-which-one-for-fine-detail', 'Resin or filament: which one for fine detail', 'Materials',
    'Resin gives very fine detail and a smooth surface. Filament is easier to run and cheaper per part. Here is how to choose.', VIOLET,
    ['Resin: miniatures and smooth surfaces', 'Filament: large, strong, and everyday parts', 'Resin needs washing and curing', 'Wear gloves when handling resin'],
    [('p', 'Both resin and filament printers make 3D printed parts, but they are good at different things. A <strong>resin printer</strong> cures liquid with light, layer by layer. A <strong>filament printer</strong> melts plastic and lays it down as a thread.'),
     ('h2', 'Choose resin for'),
     ('ul', ['<strong>Miniatures</strong> with small faces, hands and lettering.', '<strong>Glossy, smooth surfaces</strong> with almost no layer lines.', '<strong>Tiny, very detailed</strong> parts.']),
     ('fig', 'detail', 'Resin or filament at a glance', 'Detail and finish on one side, size and strength on the other.'),
     ('h2', 'Choose filament for'),
     ('ul', ['<strong>Large parts</strong> and big batches.', '<strong>Functional parts</strong> that need strength or heat resistance.', '<strong>Lower running cost</strong> and simpler cleaning.']),
     ('h2', 'Know the resin routine'),
     ('p', 'Resin parts must be washed in alcohol or a cleaner and then cured under UV light. Uncured resin irritates the skin, so wear gloves. Read our <a href="/guides/resin-printer-basics-curing-washing-and-safety">resin printer basics</a> before you start.'),
     ('p', 'Both processes are used in our studio. <a href="/shop">Browse ready-made parts</a> or <a href="/quote">ask which process suits your design</a>.')])

art('wood-fill-and-silk-filament-the-finish-you-get', 'Wood-fill and silk filament: the finish you get', 'Materials',
    'Wood-fill looks like timber and can be sanded and stained. Silk has a satin shine. Each needs its own settings.', ORANGE,
    ['Wood-fill: sand, stain and wax', 'Use a larger nozzle for wood-fill', 'Silk shows layer lines: tune the height', 'Test each colour under real light'],
    [('p', 'Specialty filaments change how a plain plastic looks. <strong>Wood-fill</strong> mixes fine wood powder into PLA, so a finished part looks like timber. <strong>Silk</strong> filament has a glossy, satin sheen that catches the light.'),
     ('h2', 'Wood-fill, step by step'),
     ('ul', ['Sand the printed part to bring out the grain.', 'Stain or wax it for a warm, natural colour.', 'Use a larger nozzle, often 0.6 mm, so the powder does not block the tip.']),
     ('fig', 'detail', 'Getting a good wood finish', 'Sand, stain, and use a bigger nozzle.'),
     ('h2', 'Silk and its shine'),
     ('p', 'Glossy colours show layer lines more than matte ones. Lower the layer height for a smoother surface. Silk can also be a little less stiff than standard PLA, so choose the wall thickness with care.'),
     ('p', 'Lighting changes these finishes a lot. Print a small sample and look at it in your own room. <a href="/materials/pla">Read about our PLA materials</a>, or <a href="/quote">send a file</a> for a finish test.')])

art('translucent-and-glow-filament-for-lamps', 'Translucent and glow filament for lamps', 'Materials',
    'Thin translucent filament lets light through and makes a warm lamp shade. Here is how to print one that glows evenly.', LIME,
    ['Thin, even walls', 'Natural or white base colour', 'PETG for a warm bulb', 'Glow-in-the-dark only stores light'],
    [('p', 'Translucent filament lets light through. A single-wall lamp shade in a light colour glows warmly when a small bulb sits inside. It is one of the most rewarding things to print.'),
     ('h2', 'What makes a good lamp part'),
     ('ul', ['<strong>Thin walls</strong>, usually one or two perimeters, so light is not blocked.', '<strong>Even thickness</strong>, so the glow is even.', '<strong>A natural or white base</strong>, which glows more than dark colours.']),
     ('fig', 'detail', 'Four rules for a glowing shade', 'Thin, even, light, and kept cool.'),
     ('h2', 'Choosing the material'),
     ('p', 'PLA and PETG are the usual choices. PETG is a little tougher and handles a warm bulb better. Keep the bulb small and the shade ventilated.'),
     ('h2', 'Glow-in-the-dark is different'),
     ('p', 'Glow filament stores light and fades over minutes. It does not light up by itself, so it suits decor rather than a working lamp.'),
     ('p', 'Want a lamp designed for your room? <a href="/quote">Tell us the size and colour</a>.')])

art('filament-storage-how-moisture-ruins-a-print', 'Filament storage: how moisture ruins a print', 'Materials',
    'Damp filament pops, bubbles and prints weak. A sealed box and a little desiccant keep every spool in shape.', INK,
    ['Popping or crackling while printing', 'Rough, bubbly surfaces', 'Keep spools in a sealed box', 'Re-dry if the maker allows it'],
    [('p', 'Filament takes in water from the air over time. A wet spool hisses and pops in the nozzle, and the part comes out rough, stringy or weak. <strong>Nylon and PETG</strong> are the most sensitive, but PLA can be affected too.'),
     ('h2', 'Signs a spool is wet'),
     ('ul', ['A popping or crackling sound while it prints.', 'Rough, bubbly surfaces and fuzzy top layers.', 'Parts that snap along the layers.']),
     ('fig', 'detail', 'Keeping filament dry', 'A sealed box, desiccant and only one spool open at a time.'),
     ('h2', 'How to store it'),
     ('ul', ['Keep spools in a sealed box with silica gel or a desiccant pack.', 'Use a vacuum bag for long storage.', 'Open only the spool you are printing.', 'Re-dry in a filament dryer, if the maker allows it.']),
     ('p', 'Good storage is the cheapest upgrade a printer can get. Our <a href="/guides/nylon-pa-strong-parts-for-wear-and-load">nylon guide</a> explains why it matters most for that material.')])

art('heat-resistance-which-material-survives-a-hot-place', 'Heat resistance: which material survives a hot place', 'Materials',
    'A part on a sunny sill or in a hot car can sag. Compare PLA, PETG, ASA and nylon to pick one that stays put.', ORANGE,
    ['PLA: good indoors, poor in a hot car', 'PETG: a sensible middle choice', 'ASA: built for sun and UV', 'Check the heat figure on the data sheet'],
    [('p', 'Heat changes how a 3D printed part behaves. A car interior or a window ledge in the sun can reach temperatures that soften some plastics. Choosing the right material avoids a part that sags out of shape.'),
     ('h2', 'A quick comparison'),
     ('ul', ['<strong>PLA</strong> softens at low temperatures. Good indoors, poor in a hot car.', '<strong>PETG</strong> handles moderate heat and is tough. A practical middle choice.', '<strong>ASA</strong> is made for outdoor sun, with good UV resistance.', '<strong>Nylon</strong> handles heat well and is strong, but it takes in moisture.']),
     ('fig', 'detail', 'Where each material belongs', 'Match the material to the place it will live.'),
     ('h2', 'What we would choose'),
     ('p', 'For a part in the sun, choose ASA. For an indoor part that must not sag, PETG is a good, practical answer. Always check the heat figure on the data sheet before you order a critical part.'),
     ('p', 'Need a part for a hot place? <a href="/quote">Send us the details</a> and we will suggest a material.')])

art('how-an-fdm-printer-works', 'How an FDM 3D printer works', 'Machines',
    'Most desktop printers melt plastic and build a part one thin layer at a time. Here is what each part of the machine does.', LIME,
    ['Extruder pushes the filament', 'Hot end melts it', 'Nozzle places each layer', 'Bed holds the part'],
    [('p', 'Most home and studio printers use a method called <strong>fused deposition modelling</strong>, or FDM. Plastic filament is pulled into a hot nozzle, melted and pushed out as a thread. The nozzle follows a path on each layer, and the part grows upward one thin slice at a time.'),
     ('h2', 'The main parts'),
     ('ul', ['<strong>Extruder</strong> grips the filament and pushes it toward the heat.', '<strong>Hot end</strong> melts the filament to the right temperature.', '<strong>Nozzle</strong>, usually 0.4 mm, is where the plastic leaves the machine.', '<strong>Build plate</strong> is the surface the part sticks to.', '<strong>Frame and motion system</strong> move the head and bed on accurate rails.']),
     ('fig', 'detail', 'The five parts to know', 'Each part is a place to look when something goes wrong.'),
     ('h2', 'Why this helps you'),
     ('p', 'Knowing these parts makes problems easier to solve. A poor first layer points to the bed. Weak parts can point to temperature or moisture. Our <a href="/guides/7-common-3d-printing-problems-and-how-to-avoid-them">common problems</a> article follows the same logic.')])

art('bed-levelling-explained', 'Bed levelling explained', 'Machines',
    'A level bed is the first step to a good print. Here is how levelling works and how to check it without guesswork.', VIOLET,
    ['Nozzle a paper-thickness above the bed', 'Manual or automatic levelling', 'Heat the bed before you check', 'Re-check after moving the printer'],
    [('p', 'Every print starts with the first layer, and the first layer depends on the gap between the nozzle and the bed. It should be about the thickness of a sheet of paper, at every point. Too high and the plastic does not stick. Too low and the nozzle scratches the surface.'),
     ('h2', 'Two ways to level'),
     ('ul', ['<strong>Manual levelling</strong>: turn the bed screws until a sheet of paper drags a little at each corner and the centre.', '<strong>Automatic levelling</strong>: a probe measures many points and corrects the first layer in software.']),
     ('fig', 'detail', 'A four-step check', 'Warm the bed, print a test, read the lines, and re-check.'),
     ('h2', 'How to check it'),
     ('ul', ['Heat the bed to its normal temperature, because metal expands when warm.', 'Print a single-layer test square and look at the lines.', 'Re-check after moving the printer or changing the build plate.']),
     ('p', 'If the first layer still fails, look at the <a href="/guides/first-layer-not-sticking">first-layer guide</a> next.')])

art('nozzle-sizes-what-changes-when-you-switch', 'Nozzle sizes: what changes when you switch', 'Machines',
    'The nozzle diameter sets the detail and speed of a print. Here is what a 0.2, 0.4 or 0.6 mm nozzle does well.', ORANGE,
    ['0.2 mm: fine detail, slow', '0.4 mm: the everyday default', '0.6 mm: fast, large parts', 'Match the slicer to the real nozzle'],
    [('p', 'The <strong>nozzle</strong> is the small opening the plastic leaves through. The common size is 0.4 mm. Changing it shifts the balance between detail and speed.'),
     ('h2', 'Smaller nozzles, such as 0.2 mm'),
     ('ul', ['Finer lines and sharper small details.', 'Much slower printing, often several times longer.', 'Clogs more easily with dirty filament.']),
     ('h2', 'Larger nozzles, such as 0.6 mm'),
     ('ul', ['Faster printing for large, simple parts.', 'Coarser lines and less fine detail.', 'Good for wood-fill and other filled materials.']),
     ('fig', 'detail', 'Choosing a nozzle', 'Detail on one side, speed and size on the other.'),
     ('h2', 'Changing the nozzle'),
     ('p', 'Update the nozzle size in your slicer too, and check the first layer again. A mismatch between the slicer and the real nozzle causes many poor prints. Our <a href="/guides/layer-height-detail-against-speed">layer height</a> article explains how the two settings work together.')])

art('layer-height-detail-against-speed', 'Layer height: detail against speed', 'Machines',
    'Layer height is the thickness of each slice. Thin layers look smooth and take longer. Here is how to pick one.', LIME,
    ['Thin: smooth and detailed', 'Thick: fast and practical', 'Keep it under about three quarters of the nozzle', 'Test before a big batch'],
    [('p', '<strong>Layer height</strong> is how thick each slice of the part is. A 0.2 mm layer is common for detailed work. A thicker layer is used when speed matters more than a smooth surface.'),
     ('h2', 'Thin layers'),
     ('ul', ['Smoother surfaces with fainter layer lines.', 'Better for curves and small detail.', 'Much longer print times.']),
     ('h2', 'Thick layers'),
     ('ul', ['Faster prints, sometimes in half the time.', 'Visible steps on curved surfaces.', 'Good for functional parts where looks matter less.']),
     ('fig', 'detail', 'Three layer heights, three jobs', 'Pick the height by what the part is for.'),
     ('h2', 'A practical rule'),
     ('p', 'Keep the layer height below about three quarters of the nozzle size. With a 0.4 mm nozzle, layers between about 0.1 and 0.3 mm work well. Print the same part twice and compare, to see what you gain for the time.')])

art('enclosures-why-they-matter-for-abs-and-asa', 'Enclosures: why they matter for ABS and ASA', 'Machines',
    'Some materials shrink as they cool. An enclosure keeps the air warm and still, so large parts stay flat.', INK,
    ['Holds the air warm and still', 'Stops draughts from fans and windows', 'Keeps fumes contained', 'PLA and PETG often do not need one'],
    [('p', 'ABS and ASA shrink as they cool. Without help, the corners of a large part lift off the bed and crack. A closed box around the printer keeps the air warm and still, so the part cools slowly and evenly.'),
     ('h2', 'What an enclosure does'),
     ('ul', ['Holds the air temperature steady around the part.', 'Stops cold draughts from a fan or an open window.', 'Keeps fumes from ABS and ASA contained.']),
     ('fig', 'detail', 'When an enclosure matters', 'Shrinking materials need it. Easy materials often do not.'),
     ('h2', 'When you can skip it'),
     ('p', 'PLA, PETG and most TPU prints work without one. Keep the printer away from fans and open windows, and print at a steady room temperature. Ventilate the room when you print ABS or ASA, even with an enclosure.'),
     ('p', 'For warping on big flat parts, see our <a href="/guides/warping-and-lifting-corners">warping guide</a>.')])

art('build-plate-types-pei-glass-and-textured', 'Build plate types: PEI, glass and textured', 'Machines',
    'The build plate decides whether a part sticks while it prints and releases once it cools. Here is how the common types compare.', VIOLET,
    ['PEI: sticks warm, releases cool', 'Glass: flat, glossy base', 'Textured: matte base, good grip', 'Clean with alcohol, not fingers'],
    [('p', 'The <strong>build plate</strong> is the surface your part is printed on. It has to hold the part while it prints and let go once it cools. No single plate does everything well.'),
     ('h2', 'Common choices'),
     ('ul', ['<strong>PEI sheet</strong> sticks well to PLA, PETG and ABS when warm, and releases when cool.', '<strong>Smooth glass</strong> gives a flat, glossy bottom. Some materials need an adhesive.', '<strong>Textured sheet</strong> gives a matte bottom and grips well, good for PETG and nylon.']),
     ('fig', 'detail', 'Match the plate to the material', 'Start from the material, then choose the surface.'),
     ('h2', 'Care for your plate'),
     ('ul', ['Clean with isopropyl alcohol and never touch the surface with bare fingers.', 'Replace a worn sheet before it starts to lift parts.', 'Use a glue stick only if the material asks for it.']),
     ('p', 'Still getting parts that will not stick? Read <a href="/guides/first-layer-not-sticking">first layer not sticking</a>.')])

art('resin-printer-basics-curing-washing-and-safety', 'Resin printer basics: curing, washing and safety', 'Machines',
    'A resin printer needs a wash and a cure after every print. Here is the routine that gives strong, clean results.', ORANGE,
    ['Drain, then wash', 'Dry fully, then cure under UV', 'Wear nitrile gloves', 'Ventilate and store resin away from light'],
    [('p', 'A resin printer cures liquid resin with UV light, one layer at a time. The part that comes off the plate is still soft and wet with resin, so it needs two more steps before it is finished.'),
     ('h2', 'The routine'),
     ('ul', ['Print, then lift the plate and let the excess resin drip off.', 'Wash the part in isopropyl alcohol or a resin cleaner.', 'Dry it fully, then cure under UV for the time on the resin data sheet.']),
     ('fig', 'detail', 'Four steps, every time', 'Drain, wash, dry, cure.'),
     ('h2', 'Safety first'),
     ('ul', ['Wear nitrile gloves. Uncured resin irritates the skin.', 'Work in a ventilated room, away from food areas.', 'Store resin in its bottle, away from light and heat.']),
     ('p', 'Resin suits detail work. Compare it with filament in <a href="/guides/resin-or-filament-which-one-for-fine-detail">resin or filament</a>.')])

art('print-speed-and-acceleration-fast-without-losing-quality', 'Print speed and acceleration: fast without losing quality', 'Machines',
    'Faster printing saves time, but high speed and acceleration can ripple the surface and weaken layers. Here is how to tune them.', LIME,
    ['Ringing: wavy lines near corners', 'Weak or uneven layers', 'Lower acceleration first', 'Change one setting at a time'],
    [('p', '<strong>Print speed</strong> is how fast the nozzle moves while it extrudes. <strong>Acceleration</strong> is how quickly it reaches that speed. High values save time, but they make the frame shake and leave ripples.'),
     ('h2', 'Signs the speed is too high'),
     ('ul', ['<strong>Ringing</strong>: wavy lines near sharp corners.', '<strong>Weak layers</strong> or uneven walls.', 'Skipped steps or a head that shifts.']),
     ('fig', 'detail', 'Tuning in four steps', 'Start from the default and change one thing at a time.'),
     ('h2', 'How to tune it'),
     ('ul', ['Start from the slicer default for your material and printer.', 'Raise the speed in steps of about 10 percent, and print the same test part each time.', 'If ringing appears, lower the acceleration first.']),
     ('p', 'For ringing and shifting, see <a href="/guides/layer-shifts-and-ringing-when-the-print-moves">layer shifts and ringing</a>.')])

art('stringing-and-oozing-how-to-stop-the-hairs', 'Stringing and oozing: how to stop the hairs', 'Troubleshooting',
    'Fine hairs between parts come from heat, retraction and damp filament. Here is how to fix each cause.', ORANGE,
    ['Lower the temperature in small steps', 'Increase retraction a little', 'Dry the filament', 'Raise travel speed'],
    [('p', '<strong>Stringing</strong> is the fine hair of plastic left between two parts when the nozzle crosses an open gap. Oozing is the same thing, leaking while the nozzle moves.'),
     ('h2', 'Causes and fixes'),
     ('ul', ['<strong>Too hot</strong>: lower the temperature in steps of about 5 °C until the hairs stop.', '<strong>Retraction too low</strong>: increase the distance and speed a little.', '<strong>Damp filament</strong>: dry the spool and print again.', '<strong>Travel too slow</strong>: raise the travel speed so the nozzle spends less time over gaps.']),
     ('fig', 'detail', 'Four quick fixes', 'Work through them in this order.'),
     ('h2', 'Check the nozzle'),
     ('p', 'A worn or dirty nozzle drips more. Clean it, and replace it if the tip is damaged. Our <a href="/guides/nozzle-clogs-how-to-clear-them">clog guide</a> shows how to clear a blocked tip.')])

art('warping-and-lifting-corners', 'Warping and lifting corners', 'Troubleshooting',
    'When corners lift off the bed, the plastic shrinks unevenly. Here is what to change to keep the part flat.', VIOLET,
    ['Set the bed to the right temperature', 'Use an enclosure', 'Add a brim', 'Clean the plate'],
    [('p', 'Warping happens when the bottom of a part cools and shrinks faster than the top. The corners lift and can crack away from the plate. It is most common with ABS, ASA and large flat parts.'),
     ('h2', 'Fixes to try'),
     ('ul', ['Heat the bed to the right temperature for the material.', 'Use an enclosure to keep the air warm and still.', 'Add a <strong>brim</strong>, a thin flat border around the part, so it holds better.', 'Clean the build plate. Oil from fingers stops adhesion.']),
     ('fig', 'detail', 'Keeping corners down', 'Heat, enclosure, brim and a clean plate.'),
     ('h2', 'Design helps too'),
     ('p', 'Round the corners of a part, and avoid very large flat bases. A smaller footprint warps less. Our <a href="/guides/enclosures-why-they-matter-for-abs-and-asa">enclosure guide</a> covers the air side of the problem.')])

art('layer-shifts-and-ringing-when-the-print-moves', 'Layer shifts and ringing: when the print moves', 'Troubleshooting',
    'A sudden shift or ripples near edges point to belts, the frame or the speed. Here is how to tell which.', INK,
    ['Tighten belts to a steady note', 'Check every bolt on the frame', 'Lower speed and acceleration', 'Check for a snag on the spool'],
    [('p', 'A <strong>layer shift</strong> is a sudden sideways jump, and every layer above it sits off-centre. <strong>Ringing</strong> is a set of ripples near sharp edges. They have different causes but often appear together.'),
     ('h2', 'Causes of a layer shift'),
     ('ul', ['<strong>Loose belts</strong>. Tighten until a plucked belt gives a steady note, without bending the motor shaft.', 'Loose pulleys or screws on the carriage.', 'Speed or acceleration too high for the frame.', 'A tangle or snag on the spool that stops the feed.']),
     ('fig', 'detail', 'Shift or ringing?', 'Sudden jumps are belts. Ripples at corners are speed and frame.'),
     ('h2', 'Causes of ringing'),
     ('ul', ['High acceleration, so the frame vibrates at each corner.', 'A frame that is not rigid. Check every bolt.', 'A heavy or unbalanced fan on the head.']),
     ('p', 'Tuning the speed is covered in <a href="/guides/print-speed-and-acceleration-fast-without-losing-quality">print speed and acceleration</a>.')])

art('under-extrusion-gaps-and-weak-walls', 'Under-extrusion: gaps and weak walls', 'Troubleshooting',
    'When the printer does not push out enough plastic, walls come out thin and gappy. Here is how to find the cause.', LIME,
    ['Check the nozzle for a clog', 'Check the filament drive', 'Check the temperature', 'Adjust the flow in small steps'],
    [('p', '<strong>Under-extrusion</strong> means the nozzle is not pushing out the planned amount of plastic. The walls look thin, the infill has gaps, and the part feels weak.'),
     ('h2', 'Check in this order'),
     ('ul', ['<strong>A blocked nozzle</strong>. Clear it first; see <a href="/guides/nozzle-clogs-how-to-clear-them">clearing a clog</a>.', '<strong>Filament drive</strong>. Too tight, or a worn gear that slips.', '<strong>Temperature too low</strong>, so the plastic does not melt fully.', '<strong>Flow set too low</strong> in the slicer.', '<strong>Damp filament</strong> that swells and resists the feed.']),
     ('fig', 'detail', 'Find it in five checks', 'Start with the nozzle and work down the list.'),
     ('h2', 'A simple test'),
     ('p', 'Print a small cube and measure the walls with calipers. If they are thin by a steady amount, change the flow multiplier in small steps and print again.')])

art('first-layer-not-sticking', 'First layer not sticking', 'Troubleshooting',
    'If the first layer does not stick, nothing above it will print well. Here is the order to check the bed, the nozzle and the settings.', ORANGE,
    ['Level the bed', 'Clean the plate', 'Warm the bed to the material', 'Slow the first layer'],
    [('p', 'The first layer is the foundation of the whole print. If it lifts, shifts or leaves gaps, the print fails. Most first-layer problems come from the gap between nozzle and bed, or from a dirty surface.'),
     ('h2', 'Check these first'),
     ('ul', ['<strong>Bed level</strong>. Too high leaves gaps and loose ropes; too low scratches and blobs. See <a href="/guides/bed-levelling-explained">bed levelling</a>.', '<strong>Build plate</strong>. Clean it with isopropyl alcohol.', '<strong>Bed temperature</strong>. Too cold means weak adhesion for PETG and ABS.', '<strong>First-layer speed</strong>. Slow it down, often to about 20 to 30 mm/s.']),
     ('fig', 'detail', 'Five checks for a first layer', 'Level, clean, warm, slow, then dry the filament.'),
     ('h2', 'Then check the filament'),
     ('p', 'Wet filament and old spools change how the first layer lays down. Dry it and try again.')])

art('nozzle-clogs-how-to-clear-them', 'Nozzle clogs: how to clear them', 'Troubleshooting',
    'A clog stops the filament at the nozzle. Most can be cleared with heat, a cold pull or a fresh needle.', VIOLET,
    ['Heat to the material temperature', 'Cold pull to take the debris out', 'Use a cleaning needle while hot', 'Clean after every colour change'],
    [('p', 'A clogged nozzle prints thin lines, grinds the filament or does not extrude at all. The usual cause is dust, burnt filament or a piece of an old colour stuck in the tip.'),
     ('h2', 'Clearing a clog'),
     ('ul', ['<strong>Heat</strong> the nozzle to the material temperature and push a little filament through by hand.', '<strong>Cold pull</strong>: heat, push filament in, cool to about 90 °C, then pull the filament out quickly to take the debris with it.', '<strong>Needle</strong>: with the nozzle hot, use a fine cleaning needle. Keep fingers clear.', 'If the blockage is hard, remove the nozzle and soak or replace it.']),
     ('fig', 'detail', 'Clearing a clog, in order', 'Heat, cold pull, needle, replace.'),
     ('h2', 'Prevent the next one'),
     ('ul', ['Keep filament dry and dust-free.', 'Clean the nozzle after every colour or material change.', 'Do not let the nozzle sit far below printing temperature.']),
     ('p', 'A clog often shows up as under-extrusion. See <a href="/guides/under-extrusion-gaps-and-weak-walls">under-extrusion</a>.')])

art('blobs-and-zits-on-the-surface', 'Blobs and zits on the surface', 'Troubleshooting',
    'Small bumps on the outside of a print usually come from the seam, retraction or temperature. Here is how to tame them.', LIME,
    ['Move the seam to a hidden corner', 'Tune retraction', 'Lower the outer wall temperature', 'Avoid long pauses on outer walls'],
    [('p', 'Blobs and zits are small bumps on the surface, often in a line or in one spot. They happen when the nozzle pauses in one place long enough to leave a little extra plastic.'),
     ('h2', 'Likely causes'),
     ('ul', ['<strong>Seam placement</strong>. Each layer starts and ends in the same place. Move the seam to a corner or a hidden side.', '<strong>Retraction too low</strong>, so plastic oozes while the nozzle moves.', '<strong>Temperature too high</strong> for the outer wall.', '<strong>Slow outer walls</strong> with long pauses.']),
     ('fig', 'detail', 'Three settings to check', 'Seam, retraction and temperature.'),
     ('h2', 'Fixes'),
     ('p', 'Set the seam to a hidden corner, tune retraction in small steps, and lower the temperature a little. Print a test cube and compare. For stringing between parts, see <a href="/guides/stringing-and-oozing-how-to-stop-the-hairs">stringing and oozing</a>.')])

art('supports-that-will-not-come-off', 'Supports that will not come off', 'Troubleshooting',
    'Supports should snap away cleanly. When they fuse to the part, the settings are usually too dense or too close.', INK,
    ['Lower the support density', 'Use a small interface gap', 'Design overhangs at 45 degrees or less', 'Try tree supports'],
    [('p', 'Supports hold up overhangs while the part prints. They should break away cleanly. When they fuse to the surface, the part is left with scars and rough patches.'),
     ('h2', 'Why supports stick'),
     ('ul', ['<strong>Too dense</strong>. A high density bonds more strongly to the part.', '<strong>No gap</strong>. The interface layer sits right on the part; add a small gap, usually one layer.', '<strong>Too hot</strong>, which makes the plastic bond harder.']),
     ('fig', 'detail', 'Easier supports', 'Less density, a small gap, and better design.'),
     ('h2', 'Better settings'),
     ('ul', ['Lower the density and use a simple pattern.', 'Use an interface layer with a small gap.', 'Design overhangs at 45 degrees or less, so supports are needed less.', 'Try tree supports, which touch the part at fewer points.']),
     ('p', 'Designing parts for printing is a big help. Our <a href="/guides/designing-for-print-wall-thickness-and-overhangs">design guide</a> covers overhangs in detail.')])


def html_of(blocks, slug):
    out = []
    for b in blocks:
        k = b[0]
        if k == 'p':
            out.append(f'<p>{b[1]}</p>')
        elif k == 'h2':
            out.append(f'<h2>{b[1]}</h2>')
        elif k == 'ul':
            out.append('<ul>' + ''.join(f'<li>{i}</li>' for i in b[1]) + '</ul>')
        elif k == 'fig':
            out.append('<figure><img class="wp-image-IMG_' + b[1] + '_' + slug + '" src="{IMG_' + b[1] + '}" alt="' + b[2] + '" width="1200" height="760"><figcaption>' + b[3] + '</figcaption></figure>')
    return '\n'.join(out)


if __name__ == '__main__':
    import sys
    records = []
    for a in A:
        cover(a['slug'], a['title'], a['cat'], a['accent'])
        detail(a['slug'], a['title'].split(':')[0][:34], a['points'], a['accent'])
        records.append({
            'title': a['title'], 'slug': a['slug'], 'cat': a['cat'], 'excerpt': a['excerpt'],
            'cover': a['slug'] + '-cover.png', 'detail': a['slug'] + '-detail.png',
            'html': html_of(a['blocks'], a['slug']),
        })
    with open(os.path.join(HERE, 'articles-round-2-html.json'), 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=1)
    print(len(records), 'articles,', len(records) * 2, 'images')
