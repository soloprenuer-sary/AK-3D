import { stats } from '@/lib/placeholder-data';

export function StatsStrip() {
  return (
    <section className="stats">
      <div className="wrap">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
