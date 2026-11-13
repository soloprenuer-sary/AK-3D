export interface TimelineStep {
  title: string;
  note?: string;
  state?: 'done' | 'now' | 'next';
}

/** Vertical status timeline used on the order confirmation and order tracking pages. */
export function Timeline({ steps, label }: { steps: TimelineStep[]; label: string }) {
  return (
    <ol className="timeline" aria-label={label}>
      {steps.map((s, i) => (
        <li key={s.title} className={`tl-step ${s.state ?? 'next'}`}>
          <span className="tl-dot" aria-hidden="true">
            {s.state === 'done' ? '✓' : i + 1}
          </span>
          <div>
            <b>{s.title}</b>
            {s.note && <span className="meta">{s.note}</span>}
          </div>
          {s.state === 'now' && <span className="tag accent">Current</span>}
        </li>
      ))}
    </ol>
  );
}
