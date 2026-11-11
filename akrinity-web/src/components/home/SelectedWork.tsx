import { work } from '@/lib/placeholder-data';

export function SelectedWork() {
  return (
    <section className="sec work" id="work" style={{ paddingTop: 24 }}>
      <div className="wrap">
        <div className="sec-head">
          <h2 className="d">Selected work</h2>
        </div>
        <div className="grid4">
          {work.map((w) => (
            <div key={w.id}>
              <div className="tile2 stripes" />
              <div className="cap">
                <b>{w.name}</b>
                <span>{w.meta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
