import Link from 'next/link';
import { site } from '@/lib/site-config';

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
            <Link className="btn" href="/business">
              Business and bulk orders
            </Link>
          </div>
        </div>
        <div className="contact">
          {site.whatsappText && (
            <div>
              <span>WhatsApp</span>
              <p>
                <a href={site.whatsappLink} rel="noopener noreferrer">
                  {site.whatsappText}
                </a>
              </p>
            </div>
          )}
          {site.supportEmail && (
            <div>
              <span>Email</span>
              <p>
                <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
              </p>
            </div>
          )}
          <div>
            <span>Studio</span>
            <p>Mumbai, India</p>
          </div>
          {site.replyHours > 0 && (
            <div>
              <span>Reply time</span>
              <p>Within {site.replyHours} hours</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
