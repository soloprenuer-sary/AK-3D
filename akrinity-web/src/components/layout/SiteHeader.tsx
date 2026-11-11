import Link from 'next/link';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/#custom', label: 'Custom printing' },
  { href: '/#process', label: 'How it works' },
  { href: '/#work', label: 'Portfolio' },
  { href: '/#business', label: 'Business' },
];

export function SiteHeader() {
  return (
    <header className="site">
      <div className="wrap bar">
        <Link className="logo" href="/" aria-label="Akrinity home">
          Akrinity<i aria-hidden="true" />
        </Link>
        <nav className="main" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hdr-actions">
          <button className="circle" type="button" aria-label="Search">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B0B0C"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
          </button>
          <button className="circle" type="button" aria-label="Cart, 0 items">
            0
          </button>
          <Link className="btn btn-dark btn-sm" href="/quote">
            Get a quote
          </Link>
        </div>
      </div>
    </header>
  );
}
