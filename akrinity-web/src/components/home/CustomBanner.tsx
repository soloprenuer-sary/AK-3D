import Link from 'next/link';

const MATERIAL_PILLS = ['PLA / PLA+', 'PETG', 'ABS / ASA', 'Resin'];

export function CustomBanner() {
  return (
    <section className="custom" id="custom">
      <div className="wrap">
        <div className="card">
          <div>
            <span className="tag accent">Custom printing</span>
            <h2 className="d" style={{ marginTop: 16 }}>
              Your file.
              <br />
              Our <em>printers.</em>
            </h2>
            <p>
              Upload an STL, 3MF, OBJ, STEP or IGES file, pick a material, and get a price and lead
              time. Have only a sketch or an idea? We can model it first.
            </p>
            <Link className="btn btn-primary" href="/quote">
              Request a quote
            </Link>
          </div>
          <div className="upload" aria-label="Example of the upload form">
            <span className="label">3D file</span>
            <div className="drop">
              <span className="up" aria-hidden="true">
                ↑
              </span>
              <b>Choose files or drop them here</b>
              <span className="muted" style={{ fontSize: 14 }}>
                STL, 3MF, OBJ, STEP, IGES · up to [XX] MB each
              </span>
            </div>
            <div className="pills">
              {MATERIAL_PILLS.map((m, i) => (
                <span key={m} className="pill" aria-pressed={i === 0}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
