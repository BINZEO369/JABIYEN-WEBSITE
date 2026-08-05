import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | JAYENWARE</title>
        <meta name="description" content="The page you are looking for does not exist." />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '40px 20px',
        textAlign: 'center',
        background: '#ffffff'
      }}>
        {/* Large 404 Number */}
        <h1 style={{
          fontFamily: "var(--font-heading), 'Manrope', sans-serif",
          fontSize: 'clamp(80px, 15vw, 180px)',
          fontWeight: 900,
          color: '#f5f5f7',
          lineHeight: 1,
          margin: 0,
          letterSpacing: '-0.04em',
          userSelect: 'none',
          position: 'relative'
        }}>
          404
        </h1>

        {/* Title */}
        <h2 style={{
          fontFamily: "var(--font-heading), 'Manrope', sans-serif",
          fontSize: 'clamp(20px, 3vw, 32px)',
          fontWeight: 700,
          color: '#1d1d1f',
          margin: '16px 0 12px',
          letterSpacing: '-0.02em'
        }}>
          Page Not Found
        </h2>

        {/* Description */}
        <p style={{
          fontFamily: "var(--font-body), 'Inter', sans-serif",
          fontSize: 'clamp(14px, 1.5vw, 16px)',
          color: '#86868b',
          maxWidth: 460,
          margin: '0 auto 32px',
          lineHeight: 1.6
        }}>
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 28px',
            background: '#1d1d1f',
            color: '#fff',
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            borderRadius: '50px',
            transition: 'all 0.3s ease'
          }}
            className="notfound-btn-primary"
          >
            <i className="fa-solid fa-house" style={{ fontSize: 13 }}></i>
            Back to Home
          </Link>

          <Link href="/products" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 28px',
            background: 'transparent',
            color: '#1d1d1f',
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            borderRadius: '50px',
            border: '1.5px solid #1d1d1f',
            transition: 'all 0.3s ease'
          }}
            className="notfound-btn-secondary"
          >
            <i className="fa-solid fa-bag-shopping" style={{ fontSize: 13 }}></i>
            Browse Products
          </Link>
        </div>

        {/* Quick Links */}
        <div style={{
          marginTop: 48,
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {[
            { href: '/about', label: 'About Us' },
            { href: '/faq', label: 'FAQ' },
            { href: '/contact', label: 'Contact' },
            { href: '/journal', label: 'Journal' },
          ].map(link => (
            <Link key={link.href} href={link.href} style={{
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              fontSize: 13,
              color: '#86868b',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
              padding: '4px 0',
              borderBottom: '1px solid transparent'
            }}
              className="notfound-quick-link"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .notfound-btn-primary:hover {
          background: #333 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .notfound-btn-secondary:hover {
          background: #1d1d1f !important;
          color: #fff !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .notfound-quick-link:hover {
          color: #1d1d1f !important;
          border-bottom-color: #1d1d1f !important;
        }
      `}</style>
    </>
  );
}
