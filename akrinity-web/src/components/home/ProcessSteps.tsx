import { processSteps } from '@/lib/placeholder-data';

export function ProcessSteps() {
  return (
    <section className="sec band-ink process" id="process">
      <div className="wrap">
        <h2 className="d">
          From file to <em>front door</em>
        </h2>
        <div className="steps">
          {processSteps.map((s, i) => (
            <div className="step" key={s.title}>
              <span className="n">{i + 1}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
