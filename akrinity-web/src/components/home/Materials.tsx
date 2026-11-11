import { materials } from '@/lib/placeholder-data';

export function Materials() {
  return (
    <section className="sec">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="d">
            Pick your <span style={{ color: 'var(--violet)' }}>material</span>
          </h2>
        </div>
        <div className="mats">
          {materials.map((m) => (
            <div className="mat" key={m.name}>
              <div className="top" style={{ background: m.background }}>
                <b style={{ color: m.color }}>{m.name}</b>
              </div>
              <div className="body">
                <span className="label">Best for</span>
                <p>{m.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
