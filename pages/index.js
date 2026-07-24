import React, { useEffect, useState } from 'react';

export default function Home() {
  const [cookieConsent, setCookieConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('jayenware_consent');
    if (!consent) {
      setTimeout(() => setCookieConsent(true), 2000);
    }
  }, []);

  const handleCookieAccept = () => {
    localStorage.setItem('jayenware_consent', 'accepted');
    setCookieConsent(false);
  };

  const handleCookieDecline = () => {
    localStorage.setItem('jayenware_consent', 'declined');
    setCookieConsent(false);
  };

  return (
    <div className="antialiased">
      {/* Header Container (To be replaced with Next.js <Header /> component) */}
      <div id="header-container"></div>

      <main className="pt-0">
        <section id="home" className="page-section active-page fade-in">
          <div id="categoryshow-container"></div>
          <div id="new-arrivals-container"></div>
          <div id="hero-secondary-container"></div>
          <div id="trending-now-container"></div>
          <div id="featured-products-container"></div>
          <div id="best-sellers-container"></div>
          <div id="on-sale-container"></div>
          <div id="limited-edition-container"></div>
        </section>

        <section id="products" className="page-section py-6 sm:py-8 lg:py-12" style={{ display: 'none' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
              <aside className="lg:w-64 shrink-0">
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-primary">Categories</h3>
                    <button className="lg:hidden text-accent">
                      <i className="fa-solid fa-sliders text-sm"></i>
                    </button>
                  </div>
                  <div id="sidebar-categories" className="space-y-1 hidden lg:block" style={{ maxHeight: '60vh', overflowY: 'auto' }}></div>
                  <div id="mobile-filters" className="hidden lg:hidden mt-4 pt-4 border-t border-gray-100">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-accent block mb-1">Min Price</label>
                        <input type="number" id="filter-min-price" placeholder="৳ Min" className="w-full p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-accent block mb-1">Max Price</label>
                        <input type="number" id="filter-max-price" placeholder="৳ Max" className="w-full p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs" />
                      </div>
                      <button className="w-full py-2 bg-primary text-white rounded-xl text-xs font-semibold">Apply</button>
                    </div>
                  </div>
                </div>
              </aside>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <p id="product-count" className="text-xs font-medium text-accent"></p>
                  <div id="sort-container" className="relative">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 text-xs font-semibold text-primary">
                      <span id="current-sort-label">Newest</span>
                      <i className="fa-solid fa-chevron-down text-[10px]"></i>
                    </button>
                    <div id="sort-dropdown" className="hidden absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                      <button className="block w-full text-left px-4 py-3 text-xs font-semibold hover:bg-gray-50 transition">Newest</button>
                      <button className="block w-full text-left px-4 py-3 text-xs font-semibold hover:bg-gray-50 transition">Price: Low to High</button>
                      <button className="block w-full text-left px-4 py-3 text-xs font-semibold hover:bg-gray-50 transition">Price: High to Low</button>
                    </div>
                  </div>
                </div>
                <div id="products-grid" className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6"></div>
              </div>
            </div>
          </div>
        </section>

        <section id="wishlist" className="page-section py-6 sm:py-8 lg:py-12" style={{ display: 'none' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-serif text-primary">Your Wishlist</h2>
            </div>
            <div id="wishlist-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"></div>
            <div id="empty-wishlist" className="hidden text-center py-20">
              <i className="fa-regular fa-heart text-5xl sm:text-7xl text-gray-200 mb-6 block"></i>
              <p className="text-lg sm:text-xl text-accent font-medium">Your wishlist is empty</p>
              <button className="mt-6 px-8 py-3 bg-primary text-white rounded-full font-semibold uppercase text-xs tracking-wider hover:bg-blue transition inline-block">
                Explore Products
              </button>
            </div>
          </div>
        </section>

        <section id="news" className="page-section py-6 sm:py-8 lg:py-12" style={{ display: 'none' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-serif text-primary">The Journal</h2>
            </div>
            <div id="news-grid" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"></div>
          </div>
        </section>
      </main>

      {/* Footer Container (To be replaced with Next.js <Footer /> component) */}
      <div id="footer-container"></div>

      {/* Cookie Consent Banner */}
      <div id="cookieConsent" className={`cookie-consent-overlay ${cookieConsent ? 'show' : ''}`}>
        <div className="cookie-banner">
          <div className="cookie-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <div className="cookie-text">
            <h4>We Value Your Privacy</h4>
            <p>We use cookies. <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a></p>
          </div>
          <div className="cookie-buttons">
            <button className="cookie-btn decline" onClick={handleCookieDecline}>Decline</button>
            <button className="cookie-btn accept" onClick={handleCookieAccept}>Accept</button>
          </div>
        </div>
      </div>
    </div>
  );
}
