import Link from 'next/link';

export function FinalCta() {
  return (
    <section className="final" id="business">
      <div className="wrap">
        <div>
          <h2 className="d">
            Let&apos;s print
            <br />
            something.
          </h2>
          <div className="cta">
            <Link className="btn btn-dark" href="/quote">
              Request a quote
            </Link>
            <Link className="btn" href="/quote">
              Business and bulk orders
            </Link>
          </div>
        </div>
        <div className="contact">
          <div>
            <span>WhatsApp</span>
            <p>[WhatsApp number]</p>
          </div>
          <div>
            <span>Email</span>
            <p>[support email]</p>
          </div>
          <div>
            <span>Studio</span>
            <p>Mumbai, India</p>
          </div>
          <div>
            <span>Reply time</span>
            <p>Within [X] hours</p>
          </div>
        </div>
      </div>
    </section>
  );
}
