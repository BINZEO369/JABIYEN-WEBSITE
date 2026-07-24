import '../styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <title>Jayenware Official Store | Bangladesh Heritage Fashion</title>
        <meta name="description" content="Shop at the official site of Jayenware BD. Discover the latest ready-to-wear, handbags, T-shirt, shoes and accessory collections" />
        <meta name="keywords" content="buy t-shirts online Bangladesh, premium lifestyle products BD, quality cotton t-shirt, JAYENWARE shop, BINZEO store" />
        <meta name="author" content="BINZEO" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="theme-color" content="#ffffff" />

        <link rel="canonical" href="https://www.jayenware.shop/" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/logo.png" />
        <link rel="apple-touch-icon" href="/images/logo.png" />

        <meta property="og:title" content="Jayenware Official Store | Bangladesh Heritage Fashion" />
        <meta property="og:description" content="Discover luxury Bangladesh clothing, T-shirt, bags, accessories and fragrances for women and men." />
        <meta property="og:image" content="https://www.jayenware.shop/images/logo.png" />
        <meta property="og:url" content="https://www.jayenware.shop/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="JAYENWARE" />
        <meta property="fb:app_id" content="861762253694814" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Jayenware Official Store | Bangladesh Heritage Fashion" />
        <meta name="twitter:image" content="https://www.jayenware.shop/images/logo.png" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>

      <script dangerouslySetInnerHTML={{
        __html: `
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ["'Inter', 'sans-serif'"],
                  serif: ["'Manrope', 'sans-serif'"],
                  mono: ["'Sora', 'sans-serif'"]
                },
                colors: { primary: '#1d1d1f', accent: '#86868b', soft: '#f5f5f7', blue: '#007aff' }
              }
            }
          }
        `
      }} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="bg-[#1d1d1f] text-white text-center py-2 text-[10px] sm:text-xs font-medium uppercase tracking-wider">
          Free Shipping on Orders Over ৳2000 | Easy Returns
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2">
              <img src="/images/logo.png" alt="JAYENWARE" className="h-8 w-8 sm:h-10 sm:w-10" />
              <span className="font-bold text-lg sm:text-xl text-[#1d1d1f]">JAYENWARE</span>
            </a>
            <nav className="hidden lg:flex items-center gap-8">
              <a href="/products" className="text-sm font-medium hover:text-[#86868b] transition">Shop</a>
              <a href="/journal" className="text-sm font-medium hover:text-[#86868b] transition">Journal</a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
              <a href="/wishlist" className="p-2 hover:bg-gray-100 rounded-full"><i className="fa-regular fa-heart"></i></a>
              <a href="/checkout" className="p-2 hover:bg-gray-100 rounded-full"><i className="fa-solid fa-bag-shopping"></i></a>
              <a href="/signin" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-gray-100 rounded-full"><i className="fa-regular fa-user"></i><span>Sign In</span></a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Component {...pageProps} />
      </main>

      {/* Footer */}
      <footer className="bg-[#1d1d1f] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <a href="/" className="flex items-center gap-2 mb-4">
                <img src="/images/logo.png" alt="JAYENWARE" className="h-8 w-8 brightness-0 invert" />
                <span className="font-bold text-lg">JAYENWARE</span>
              </a>
              <p className="text-sm text-gray-400">Premium lifestyle products by BINZEO.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase mb-4">Shop</h4>
              <a href="/products" className="block text-sm text-gray-400 hover:text-white">All Products</a>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase mb-4">Support</h4>
              <a href="/faq" className="block text-sm text-gray-400 hover:text-white">FAQ</a>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase mb-4">Legal</h4>
              <a href="/privacy-policy" className="block text-sm text-gray-400 hover:text-white">Privacy Policy</a>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-xs text-gray-500">© 2026 JAYENWARE. A BINZEO Brand.</p>
          </div>
        </div>
      </footer>

      {/* Cookie Consent */}
      <div id="cookieConsent" className="cookie-consent-overlay">
        <div className="cookie-banner">
          <div className="cookie-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
          <div className="cookie-text">
            <h4>We Value Your Privacy</h4>
            <p>We use cookies. <a href="/privacy-policy">Privacy Policy</a></p>
          </div>
          <div className="cookie-buttons">
            <button className="cookie-btn decline" onClick={() => { localStorage.setItem('jayenware_consent', 'declined'); document.getElementById('cookieConsent')?.classList.remove('show'); }}>Decline</button>
            <button className="cookie-btn accept" onClick={() => { localStorage.setItem('jayenware_consent', 'accepted'); document.getElementById('cookieConsent')?.classList.remove('show'); }}>Accept</button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          if (!localStorage.getItem('jayenware_consent')) {
            setTimeout(function() { document.getElementById('cookieConsent')?.classList.add('show'); }, 2000);
          }
        `
      }} />
    </>
  );
}
