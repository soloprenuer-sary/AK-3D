import type { Metadata } from 'next';
import Link from 'next/link';
import { StudioSlider } from '@/components/layout/StudioSlider';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Who makes Akrinity prints in Bhiwandi, how each part is checked, and the materials we use.',
};

const FACTS = [
  'Studio in Bhiwandi',
  'Made layer by layer',
  'Prices include GST',
  'Checked before packing',
];

/** The people behind the studio. Add `photo` (a path under /public) and `bio` when they are ready. */
const TEAM: { name: string; role: string; tone: string; photo?: string; bio?: string }[] = [
  { name: 'Satyam Chaudhary', role: 'Founder', tone: 'lime' },
  { name: 'Sujit Prajapati', role: 'Co-Founder', tone: 'violet' },
];

const MAKE = [
  'Home decor and desk organisers',
  'Display stands for die-cast cars',
  'Jewellery and accessory stands',
  'Gifts, keychains and personalised pieces',
  'Spare parts and brackets',
  'Custom work from your own file',
];

const STEPS = [
  {
    tone: 'lime',
    name: 'Print',
    text: 'Made-to-order parts are printed after you order. You see the lead time before you pay.',
  },
  { tone: 'violet', name: 'Check', text: 'Layer adhesion, size and surface finish are checked.' },
  { tone: 'orange', name: 'Reprint', text: 'A part that fails is printed again, not sent.' },
  { tone: 'ink', name: 'Ship', text: 'Ready-made parts ship from stock when they are in stock.' },
];

const MATERIALS = [
  { tone: 'lime', name: 'PLA / PLA+', text: 'Detail and decor' },
  { tone: 'violet', name: 'PETG', text: 'Tougher everyday parts' },
  { tone: 'orange', name: 'ABS / ASA', text: 'Heat and outdoor use' },
  { tone: 'ink', name: 'Resin', text: 'Very fine detail' },
];

export default function About() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">About</span>
      </nav>

      <div className="wrap ab">
        <section className="ab-hero">
          <div>
            <h1 className="d">
              About <span className="hl">Akrinity</span>
            </h1>
            <p>
              A 3D printing studio in Bhiwandi. We print ready-made products, custom parts from your
              own file, and designs we make from a sketch or an idea.
            </p>
            <div className="ab-btns">
              <Link className="btn btn-primary btn-sm" href="/shop">
                Shop ready-made
              </Link>
              <Link className="btn btn-sm" href="/quote">
                Get a quote
              </Link>
            </div>
            <ul className="ab-facts">
              {FACTS.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <img
            src="/images/about/hero.png"
            alt="Illustration of four printed objects in brand colours"
            width={1200}
            height={900}
          />
        </section>

        <section aria-labelledby="ab-team">
          <h2 className="ab-h" id="ab-team">
            Meet the <span className="hl">team</span>
          </h2>
          <ul className="ab-team">
            {TEAM.map((m) => (
              <li key={m.name} className="ab-person">
                <div className={`ab-avatar tone-${m.tone}`} aria-hidden="true">
                  {m.photo ? <img src={m.photo} alt="" /> : <span>{m.name.charAt(0)}</span>}
                </div>
                <div>
                  <b>{m.name}</b>
                  <span className="ab-role">{m.role}</span>
                  {m.bio && <p>{m.bio}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="ab-card" aria-labelledby="ab-make">
          <h2 id="ab-make">What we make</h2>
          <ul className="ab-chips">
            {MAKE.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <p className="muted">Design-and-print from a sketch or a photo, too.</p>
        </section>

        <section aria-labelledby="ab-how">
          <h2 className="ab-h" id="ab-how">
            How we work
          </h2>
          <ol className="ab-grid4">
            {STEPS.map((s, i) => (
              <li key={s.name} className={`ab-tile tone-${s.tone}`}>
                <span className="ab-num">0{i + 1}</span>
                <b>{s.name}</b>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="ab-mat">
          <h2 className="ab-h" id="ab-mat">
            Materials
          </h2>
          <ul className="ab-grid4">
            {MATERIALS.map((m) => (
              <li key={m.name} className="ab-mat">
                <i className={`tone-${m.tone}`} aria-hidden="true" />
                <div>
                  <b>{m.name}</b>
                  <span>{m.text}</span>
                </div>
              </li>
            ))}
          </ul>
          <Link className="ab-more" href="/materials">
            Compare the materials →
          </Link>
        </section>

        <div className="ab-studio">
          <StudioSlider
            slides={[
              {
                src: '/images/about/slide-printer.png',
                alt: 'Illustration of a 3D printer building a part layer by layer',
                caption: 'The printer: one thin layer at a time.',
              },
              {
                src: '/images/about/slide-workshop.png',
                alt: 'Illustration of the workshop bench where parts are finished',
                caption: 'The workshop: where parts are finished.',
              },
              {
                src: '/images/about/slide-packaging.png',
                alt: 'Illustration of a box being packed for dispatch',
                caption: 'Packing: checked, wrapped and boxed.',
              },
            ]}
          />
          <div className="ab-stack">
            <section className="ab-card" aria-labelledby="ab-why">
              <h2 id="ab-why">Why we started</h2>
              <p>
                Many of the problems we print for are small and specific: a shelf for a growing car
                collection, a mount that keeps rackets off the floor, a stand for two controllers
                and a headset.
              </p>
              <p>
                They are hard to solve with a shop-bought object and quick to solve with a 3D
                printer. We make the part that fits your space, your collection or your idea.
              </p>
            </section>
            {/* VERIFY with the owner: the promise lines are drafts until the studio confirms them. */}
            <section className="ab-card ab-promise" aria-labelledby="ab-pro">
              <h2 id="ab-pro">Our promise</h2>
              <p>Prices include GST, and each product page shows the lead time before you pay.</p>
              <p>
                If a part cannot be made the way you asked, we tell you straight away. We fix any
                part that is wrong.
              </p>
              <Link className="btn btn-primary btn-sm" href="/contact">
                Contact us
              </Link>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
