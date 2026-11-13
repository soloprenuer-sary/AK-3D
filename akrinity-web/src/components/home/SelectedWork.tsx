/** Selected work: renders of the studio's own twisted lamp design, until finished-print photos exist. */
const WORK = [
  { src: '/products/rectangular-twisted-lamp/1.png', name: 'Rectangular twisted lamp', meta: '3D render · PLA+' },
  { src: '/products/rectangular-twisted-lamp/2.png', name: 'Lamp structure close-up', meta: '3D render · Printed lattice' },
  { src: '/products/rectangular-twisted-lamp/3.png', name: 'Lamp base part', meta: '3D render · Printed in parts' },
  { src: '/products/rectangular-twisted-lamp/4.png', name: 'Lamp height and width', meta: '3D render · Size sheet' },
];

export function SelectedWork() {
  return (
    <section className="sec work" id="work" style={{ paddingTop: 24 }}>
      <div className="wrap">
        <div className="sec-head">
          <h2 className="d">Selected work</h2>
        </div>
        <div className="grid4">
          {WORK.map((w) => (
            <figure key={w.src}>
              <div className="tile2 tile2-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.src} alt={w.name} loading="lazy" />
              </div>
              <figcaption className="cap">
                <b>{w.name}</b>
                <span>{w.meta}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
