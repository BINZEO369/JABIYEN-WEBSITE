
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <title>Jayenware Official Store | Bangladesh Heritage Fashion</title>

        <meta name="description" content="Shop at the official site of Jayenware BD. Discover the latest ready-to-wear, handbags, T-shirt, shoes and accessory collections" />
        <meta name="keywords" content="buy t-shirts online Bangladesh, premium lifestyle products BD, quality cotton t-shirt, JAYENWARE shop, BINZEO store, stylish apparel, printed t-shirts, oversized t-shirts, fashion accessories, online shopping Bangladesh, authentic clothing, best t-shirt brand Bangladesh" />
        <meta name="author" content="BINZEO" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="theme-color" content="#ffffff" />

        <link rel="canonical" href="https://www.jayenware.shop/" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://www.jayenware.shop/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://www.jayenware.shop/logo.png" />
        <link rel="apple-touch-icon" href="https://www.jayenware.shop/logo.png" />

        <meta property="og:title" content="Jayenware Official Store | Bangladesh Heritage Fashion" />
        <meta property="og:description" content="Discover luxury Bangladesh clothing, T-shirt, bags, accessories and fragrances for women and men." />
        <meta property="og:image" content="https://www.jayenware.shop/logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://www.jayenware.shop/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="JAYENWARE" />
        <meta property="fb:app_id" content="861762253694814" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@jayenware" />
        <meta name="twitter:title" content="Jayenware Official Store | Bangladesh Heritage Fashion" />
        <meta name="twitter:description" content="Discover luxury Bangladesh clothing, T-shirt, bags, accessories and fragrances for women and men." />
        <meta name="twitter:image" content="https://www.jayenware.shop/logo.png" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>

      {/* Tailwind Config */}
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
                colors: {
                  primary: '#1d1d1f',
                  accent: '#86868b',
                  soft: '#f5f5f7',
                  blue: '#007aff'
                }
              }
            }
          }
        `
      }} />

      {/* Global Styles */}
      <style jsx global>{`
        :root {
          --primary: #1d1d1f;
          --accent: #86868b;
          --soft: #f5f5f7;
          --blue: #007aff;
          --card-width: 260px;
          --card-gap: 16px;
        }

        * {
          -webkit-tap-highlight-color: transparent;
          box-sizing: border-box;
        }

        body {
          background-color: #ffffff;
          color: #1d1d1f;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        main {
          flex-grow: 1;
          min-height: calc(100vh - 280px);
        }

        html {
          scroll-behavior: smooth;
        }

        img {
          max-width: 100%;
          height: auto;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Carousel Styles */
        .carousel-section { padding: 48px 0; background: #ffffff; }
        .carousel-container { max-width: 1400px; margin: 0 auto; padding: 0 40px; }
        .carousel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
        .carousel-header .section-title { font-size: 28px; color: var(--primary); font-weight: 700; }
        .carousel-header .section-link { font-size: 14px; font-weight: 500; color: var(--blue); text-decoration: none; display: flex; align-items: center; gap: 4px; }
        .carousel-wrapper { position: relative; overflow: hidden; }

        .carousel-track {
          display: flex; gap: var(--card-gap); overflow-x: auto; overflow-y: hidden;
          scroll-behavior: smooth; scrollbar-width: none;
          cursor: grab; padding: 4px;
        }
        .carousel-track::-webkit-scrollbar { display: none; }

        .carousel-card {
          flex: 0 0 auto; width: var(--card-width);
          cursor: pointer; text-decoration: none; color: inherit; display: flex;
          flex-direction: column; transition: transform 0.3s ease;
          position: relative; background: transparent;
        }
        .carousel-card:hover { transform: translateY(-2px); }
        .carousel-card .card-img {
          position: relative; aspect-ratio: 3/4; background: #fafafa; overflow: hidden;
          margin-bottom: 12px;
        }
        .carousel-card .card-img img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.4s ease;
        }
        .carousel-card:hover .card-img img { transform: scale(1.03); }
        .carousel-card .card-body { padding: 0 4px; display: flex; flex-direction: column; gap: 4px; }
        .carousel-card .card-title { font-size: 14px; font-weight: 500; color: var(--primary); line-height: 1.4; }
        .carousel-card .card-price { font-size: 14px; font-weight: 600; color: var(--primary); }
        .carousel-card .card-old-price { font-size: 13px; color: #b0b0b5; text-decoration: line-through; margin-left: 6px; font-weight: 400; }
        .carousel-card .card-category { font-size: 11px; font-weight: 500; text-transform: uppercase; color: var(--accent); }

        .carousel-card .card-badge {
          position: absolute; top: 8px; left: 8px; z-index: 2; padding: 2px 8px;
          font-size: 10px; font-weight: 600; text-transform: uppercase; background: #ffffff;
          color: var(--primary);
        }
        .badge-sale { color: #d70015 !important; }

        .carousel-card .card-soldout-overlay {
          position: absolute; inset: 0; background: rgba(255,255,255,0.6);
          display: flex; align-items: center; justify-content: center; z-index: 5;
        }
        .carousel-card .card-soldout-overlay span {
          background: var(--primary); color: #fff; font-size: 10px; font-weight: 600;
          text-transform: uppercase; padding: 6px 16px;
        }

        .carousel-nav {
          position: absolute; top: 35%; transform: translateY(-50%); z-index: 20;
          width: 44px; height: 44px; border-radius: 50%; background: #ffffff;
          border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--primary); font-size: 14px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .carousel-nav.prev { left: -20px; }
        .carousel-nav.next { right: -20px; }

        /* Cookie Consent */
        .cookie-consent-overlay {
          position: fixed; bottom: 0; left: 0; right: 0; background: rgba(29,29,31,0.95);
          backdrop-filter: blur(20px); z-index: 9999;
          transform: translateY(100%); transition: transform 0.5s;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .cookie-consent-overlay.show { transform: translateY(0); }
        .cookie-banner { max-width: 1200px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
        .cookie-icon { width: 40px; height: 40px; background: #007aff; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cookie-text { flex: 1; min-width: 200px; color: white; }
        .cookie-text h4 { font-size: 14px; font-weight: 700; margin-bottom: 4px; color: #fff; }
        .cookie-text p { font-size: 11px; color: #a1a1a6; line-height: 1.4; margin: 0; }
        .cookie-text a { color: #007aff; text-decoration: underline; }
        .cookie-buttons { display: flex; gap: 10px; flex-shrink: 0; }
        .cookie-btn { padding: 10px 24px; border-radius: 50px; font-size: 11px; font-weight: 700; text-transform: uppercase; cursor: pointer; transition: all 0.3s; border: none; }
        .cookie-btn.accept { background: #007aff; color: white; }
        .cookie-btn.decline { background: transparent; color: #a1a1a6; border: 1px solid #48484a; }

        /* Limited Edition Dark Theme */
        #limited-edition-section { background: #000000 !important; }
        #limited-edition-section .section-title { color: #ffffff !important; }
        #limited-edition-section .carousel-card .card-title { color: #ffffff !important; }
        #limited-edition-section .carousel-card .card-price { color: #ffffff !important; }
        #limited-edition-section .carousel-card .card-old-price { color: #a1a1a6 !important; }
        #limited-edition-section .carousel-card .card-category { color: #a1a1a6 !important; }
        #limited-edition-section .carousel-card .card-badge { background: #2d2d2f !important; color: #ffffff !important; }
        #limited-edition-section .carousel-card .card-img { background: #1c1c1e !important; }
        #limited-edition-section .carousel-card .card-soldout-overlay { background: rgba(0,0,0,0.6) !important; }
        #limited-edition-section .carousel-card .card-soldout-overlay span { background: #ffffff !important; color: #1d1d1f !important; }

        @media (max-width: 767px) {
          .carousel-container { padding: 0 20px; }
          .carousel-section { padding: 32px 0; }
          .carousel-header .section-title { font-size: 22px; }
          .carousel-nav { display: none; }
          :root { --card-width: 220px; --card-gap: 12px; }
          .cookie-banner { flex-direction: column; padding: 16px; text-align: center; }
          .cookie-buttons { width: 100%; flex-direction: column; }
          .cookie-btn { width: 100%; text-align: center; }
        }

        @media (min-width: 1400px) {
          :root { --card-width: 300px; --card-gap: 20px; }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="bg-[#1d1d1f] text-white text-center py-2 text-[10px] sm:text-xs font-medium tracking-wider uppercase">
          Free Shipping on Orders Over ৳2000 | Easy Returns
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button className="lg:hidden p-2">
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
            <a href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="JAYENWARE" className="h-8 w-8 sm:h-10 sm:w-10" />
              <span className="font-bold text-lg sm:text-xl text-[#1d1d1f]">JAYENWARE</span>
            </a>
            <nav className="hidden lg:flex items-center gap-8">
              <a href="/products" className="text-sm font-medium hover:text-[#86868b] transition">Shop</a>
              <a href="/products?category=new" className="text-sm font-medium hover:text-[#86868b] transition">New</a>
              <a href="/products?category=best" className="text-sm font-medium hover:text-[#86868b] transition">Best Sellers</a>
              <a href="/journal" className="text-sm font-medium hover:text-[#86868b] transition">Journal</a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition">
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
              <a href="/wishlist" className="p-2 hover:bg-gray-100 rounded-full transition">
                <i className="fa-regular fa-heart"></i>
              </a>
              <a href="/checkout" className="p-2 hover:bg-gray-100 rounded-full transition">
                <i className="fa-solid fa-bag-shopping"></i>
              </a>
              <a href="/signin" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-gray-100 rounded-full transition">
                <i className="fa-regular fa-user"></i>
                <span>Sign In</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-0">
        <Component {...pageProps} />
      </main>

      {/* Footer */}
      <footer className="bg-[#1d1d1f] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <a href="/" className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="JAYENWARE" className="h-8 w-8 brightness-0 invert" />
                <span className="font-bold text-lg">JAYENWARE</span>
              </a>
              <p className="text-sm text-gray-400 mb-4">Premium lifestyle products by BINZEO. Quality cotton T-shirts and authentic apparel.</p>
              <div className="flex gap-3">
                <a href="https://facebook.com/jayenware" target="_blank" rel="noopener" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <i className="fa-brands fa-facebook-f text-sm"></i>
                </a>
                <a href="https://instagram.com/jayenware" target="_blank" rel="noopener" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <i className="fa-brands fa-instagram text-sm"></i>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Shop</h4>
              <div className="flex flex-col gap-2">
                <a href="/products" className="text-sm text-gray-400 hover:text-white transition">All Products</a>
                <a href="/products?category=new" className="text-sm text-gray-400 hover:text-white transition">New Arrivals</a>
                <a href="/products?category=best" className="text-sm text-gray-400 hover:text-white transition">Best Sellers</a>
                <a href="/products?category=sale" className="text-sm text-gray-400 hover:text-white transition">On Sale</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Support</h4>
              <div className="flex flex-col gap-2">
                <a href="/faq" className="text-sm text-gray-400 hover:text-white transition">FAQ</a>
                <a href="/shipping-policy" className="text-sm text-gray-400 hover:text-white transition">Shipping Policy</a>
                <a href="/return-policy" className="text-sm text-gray-400 hover:text-white transition">Return Policy</a>
                <a href="/store-locator" className="text-sm text-gray-400 hover:text-white transition">Store Locator</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Legal</h4>
              <div className="flex flex-col gap-2">
                <a href="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition">Privacy Policy</a>
                <a href="/terms-and-conditions" className="text-sm text-gray-400 hover:text-white transition">Terms & Conditions</a>
                <a href="/cookie-policy" className="text-sm text-gray-400 hover:text-white transition">Cookie Policy</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} JAYENWARE. A BINZEO Brand. All rights reserved.</p>
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
            <p>We use cookies to enhance your experience. <a href="/privacy-policy">Privacy Policy</a></p>
          </div>
          <div className="cookie-buttons">
            <button className="cookie-btn decline" onClick={() => { localStorage.setItem('jayenware_consent', 'declined'); document.getElementById('cookieConsent')?.classList.remove('show'); }}>Decline</button>
            <button className="cookie-btn accept" onClick={() => { localStorage.setItem('jayenware_consent', 'accepted'); document.getElementById('cookieConsent')?.classList.remove('show'); }}>Accept</button>
          </div>
        </div>
      </div>

      {/* Cookie Consent Script */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            const consent = localStorage.getItem('jayenware_consent');
            if (!consent) {
              setTimeout(function() {
                document.getElementById('cookieConsent')?.classList.add('show');
              }, 2000);
            }
          })();
        `
      }} />
    </>
  );
}
