import Link from 'next/link';

export function Statement() {
  return (
    <section className="statement">
      <div className="wrap">
        <h2 className="d">
          Made layer by <span className="hl">layer.</span>
        </h2>
        <div className="side">
          <p className="muted" style={{ fontSize: 17 }}>
            Every part starts as a file and ends as something you can hold. See how a job moves
            from upload to your door.
          </p>
          <Link
            className="btn btn-dark btn-sm"
            href="/#process"
            style={{ alignSelf: 'flex-start', borderRadius: 6 }}
          >
            See the process
          </Link>
        </div>
      </div>
    </section>
  );
}
