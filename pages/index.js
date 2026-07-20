cat > pages/index.js << 'EOF'
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>JABIYEN | Premium Lifestyle Products</title>
        <meta name="description" content="Discover premium lifestyle products at JABIYEN. Quality craftsmanship, modern design, authentic style." />
      </Head>

      {/* Hero Section */}
      <section style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 100%)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '700px' }}>
          {/* Badge */}
          <span style={{
            display: 'inline-block',
            background: '#1d1d1f',
            color: '#fff',
            padding: '6px 20px',
            borderRadius: '50px',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '2rem'
          }}>
            New Collection 2026
          </span>

          {/* Main Heading */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: '800',
            color: '#1d1d1f',
            lineHeight: '1.1',
            marginBottom: '1.5rem',
            letterSpacing: '-1px'
          }}>
            Elevate Your<br />Everyday Style
          </h1>

          {/* Description */}
          <p style={{
            fontSize: '1.1rem',
            color: '#86868b',
            lineHeight: '1.8',
            marginBottom: '2.5rem',
            maxWidth: '500px',
            margin: '0 auto 2.5rem'
          }}>
            Premium lifestyle products crafted for those who appreciate quality, 
            design, and authenticity. Discover the JABIYEN difference.
          </p>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <a href="/products" style={{
              display: 'inline-block',
              padding: '16px 36px',
              background: '#1d1d1f',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '50px',
              fontSize: '0.9rem',
              fontWeight: '600',
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease',
              border: '2px solid #1d1d1f'
            }}>
              Shop Now →
            </a>
            <a href="/about" style={{
              display: 'inline-block',
              padding: '16px 36px',
              background: 'transparent',
              color: '#1d1d1f',
              textDecoration: 'none',
              borderRadius: '50px',
              fontSize: '0.9rem',
              fontWeight: '600',
              letterSpacing: '0.5px',
              border: '2px solid #1d1d1f',
              transition: 'all 0.3s ease'
            }}>
              Our Story
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '5rem 2rem',
        background: '#fff'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '3rem',
          textAlign: 'center'
        }}>
          {[
            { icon: '🚚', title: 'Free Shipping', desc: 'On orders over ৳2000' },
            { icon: '🔄', title: 'Easy Returns', desc: '30-day return policy' },
            { icon: '⭐', title: 'Premium Quality', desc: 'Crafted with care' },
            { icon: '💬', title: '24/7 Support', desc: 'Always here to help' }
          ].map((feature, index) => (
            <div key={index}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1d1d1f', marginBottom: '0.5rem' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#86868b' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#1d1d1f',
        color: '#fff',
        textAlign: 'center',
        padding: '2rem',
        fontSize: '0.85rem',
        color: '#86868b'
      }}>
        © {new Date().getFullYear()} JABIYEN. All rights reserved.
      </footer>
    </>
  );
}
EOF
