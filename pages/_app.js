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
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#ffffff" />

        <link rel="canonical" href="https://www.jayenware.shop/" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />

        <meta property="og:title" content="Jayenware Official Store | Bangladesh Heritage Fashion" />
        <meta property="og:description" content="Discover luxury Bangladesh clothing, T-shirt, bags, accessories and fragrances for women and men." />
        <meta property="og:image" content="https://www.jayenware.shop/logo.png" />
        <meta property="og:url" content="https://www.jayenware.shop/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="JAYENWARE" />
        <meta property="fb:app_id" content="861762253694814" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Jayenware Official Store | Bangladesh Heritage Fashion" />
        <meta name="twitter:image" content="https://www.jayenware.shop/logo.png" />

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

      <style jsx global>{`
        :root { --primary: #1d1d1f; --accent: #86868b; --soft: #f5f5f7; --blue: #007aff; --card-width: 260px; --card-gap: 16px; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; -webkit-user-select: none; user-select: none; }
        body { background-color: #ffffff; color: #1d1d1f; overflow-x: hidden; display: flex; flex-direction: column; min-height: 100vh; -webkit-font-smoothing: antialiased; }
        main { flex-grow: 1; min-height: calc(100vh - 280px); }
        html { scroll-behavior: smooth; }
        img { max-width: 100%; height: auto; pointer-events: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .page-section { display: none; opacity: 0; transform: translateY(8px); transition: opacity 0.3s ease, transform 0.3s ease; min-height: 60vh; }
        .page-section.active-page { display: block; }
        .page-section.fade-in { opacity: 1; transform: translateY(0); }
        .carousel-section { padding: 48px 0; background: #ffffff; }
        .carousel-container { max-width: 1400px; margin: 0 auto; padding: 0 40px; }
        .carousel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
        .carousel-header .section-title { font-size: 28px; color: var(--primary); font-weight: 700; }
        .carousel-header .section-link { font-size: 14px; font-weight: 500; color: var(--blue); text-decoration: none; display: flex; align-items: center; gap: 4px; }
        .carousel-wrapper { position: relative; overflow: hidden; }
        .carousel-track { display: flex; gap: var(--card-gap); overflow-x: auto; overflow-y: hidden; scroll-behavior: smooth; scrollbar-width: none; cursor: grab; padding: 4px; }
        .carousel-track::-webkit-scrollbar { display: none; }
        .carousel-card { flex: 0 0 auto; width: var(--card-width); cursor: pointer; text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: transform 0.3s; position: relative; }
        .carousel-card:active { transform: scale(0.96); }
        .carousel-card .card-img { aspect-ratio: 3/4; background: #fafafa; overflow: hidden; margin-bottom: 12px; }
        .carousel-card .card-img img { width: 100%; height: 100%; object-fit: cover; }
        .carousel-card .card-body { padding: 0 4px; display: flex; flex-direction: column; gap: 4px; }
        .carousel-card .card-title { font-size: 14px; font-weight: 500; color: var(--primary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .carousel-card .card-price { font-size: 14px; font-weight: 600; color: var(--primary); }
        .carousel-card .card-old-price { font-size: 13px; color: #b0b0b5; text-decoration: line-through; margin-left: 6px; }
        .carousel-card .card-category { font-size: 11px; font-weight: 500; text-transform: uppercase; color: var(--accent); }
        .carousel-card .card-badge { position: absolute; top: 8px; left: 8px; z-index: 2; padding: 2px 8px; font-size: 10px; font-weight: 600; text-transform: uppercase; background: #fff; color: var(--primary); }
        .badge-sale { color: #d70015 !important; }
        .carousel-card .card-soldout-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center; z-index: 5; }
        .carousel-card .card-soldout-overlay span { background: var(--primary); color: #fff; font-size: 10px; font-weight: 600; text-transform: uppercase; padding: 6px 16px; }
        .carousel-nav { position: absolute; top: 35%; transform: translateY(-50%); z-index: 20; width: 44px; height: 44px; border-radius: 50%; background: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .carousel-nav.prev { left: -20px; }
        .carousel-nav.next { right: -20px; }
        #limited-edition-section { background: #000 !important; }
        #limited-edition-section .section-title { color: #fff !important; }
        #limited-edition-section .card-title { color: #fff !important; }
        #limited-edition-section .card-price { color: #fff !important; }
        .cookie-consent-overlay { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(29,29,31,0.95); backdrop-filter: blur(20px); z-index: 9999; transform: translateY(100%); transition: transform 0.5s; }
        .cookie-consent-overlay.show { transform: translateY(0); }
        .cookie-banner { max-width: 1200px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
        .cookie-btn { padding: 10px 24px; border-radius: 50px; font-size: 11px; font-weight: 700; text-transform: uppercase; cursor: pointer; border: none; }
        .cookie-btn.accept { background: #007aff; color: white; }
        .cookie-btn.decline { background: transparent; color: #a1a1a6; border: 1px solid #48484a; }
        @media (max-width: 767px) { .carousel-container { padding: 0 20px; } .carousel-section { padding: 32px 0; } .carousel-nav { display: none; } :root { --card-width: 220px; --card-gap: 12px; } }
        @media (min-width: 1400px) { :root { --card-width: 300px; --card-gap: 20px; } }
      `}</style>

      <main className="flex-grow">
        <Component {...pageProps} />
      </main>

      <div id="cookieConsent" className="cookie-consent-overlay">
        <div className="cookie-banner">
          <div className="cookie-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
          <div className="cookie-text"><h4>We Value Your Privacy</h4><p>We use cookies. <a href="/privacy-policy">Privacy Policy</a></p></div>
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
