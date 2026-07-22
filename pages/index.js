import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const [currentData, setCurrentData] = useState({
    products: [],
    categories: [],
    news: [],
    hero: [],
    heroVideos: [],
    hero_secondary: []
  });
  const [currentFilters, setCurrentFilters] = useState({
    cat: 'all',
    minPrice: null,
    maxPrice: null
  });
  const [productsDisplayLimit, setProductsDisplayLimit] = useState(12);
  const [activePage, setActivePage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const productsLoadMoreIncrement = 12;

  // Fetch API
  const fetchAPI = useCallback(async (endpoint) => {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error('Fetch error:', e);
      return [];
    }
  }, []);

  // Helpers
  const getCategorySlug = (c) => {
    return c ? c.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '') : '';
  };

  const getProductSlug = (p) => {
    return (p.slug || p.title || 'product').toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const getFilteredProducts = useCallback(() => {
    let list = currentData.products;
    if (currentFilters.cat !== 'all') {
      list = list.filter(p => p.category === currentFilters.cat);
    }
    if (currentFilters.minPrice) {
      list = list.filter(p => p.price >= currentFilters.minPrice);
    }
    if (currentFilters.maxPrice) {
      list = list.filter(p => p.price <= currentFilters.maxPrice);
    }
    return list;
  }, [currentData.products, currentFilters]);

  // Load Data
  useEffect(() => {
    async function loadData() {
      try {
        const [hero, cats, prods, newsData, heroVideosData, heroSecondaryData] = await Promise.all([
          fetchAPI('/api/hero'),
          fetchAPI('/api/categories'),
          fetchAPI('/api/products'),
          fetchAPI('/api/news'),
          fetchAPI('/api/hero-videos'),
          fetchAPI('/api/hero-secondary')
        ]);

        const newData = { ...currentData };
        if (hero?.length) newData.hero = hero;
        if (cats?.length) newData.categories = cats;
        if (prods?.length) newData.products = prods;
        if (newsData?.length) newData.news = newsData;
        if (heroVideosData?.length) newData.heroVideos = heroVideosData;
        if (heroSecondaryData?.length) newData.hero_secondary = heroSecondaryData;
        setCurrentData(newData);

        // Render category sections
        if (cats?.length && typeof window.renderCategoryShow === 'function') {
          window.renderCategoryShow(cats);
        }

        setLoading(false);
      } catch (err) {
        console.error('[App] Error:', err);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Cookie Consent
  useEffect(() => {
    const consent = localStorage.getItem('jayenware_consent');
    if (!consent) {
      setTimeout(() => {
        document.getElementById('cookieConsent')?.classList.add('show');
      }, 2000);
    }
  }, []);

  // Product Card HTML
  const productCard = (p) => {
    const isOut = p.stock <= 0;
    const slug = getProductSlug(p);
    return (
      <a key={p.id} href={`/product/${slug}`} className="carousel-card" style={{ width: '100%' }}>
        <div className="card-img" style={{ aspectRatio: '3/4' }}>
          <img src={p.img} alt={p.title} loading="lazy" />
          {isOut && (
            <div className="card-soldout-overlay">
              <span>Sold Out</span>
            </div>
          )}
          {p.is_new_arrival && !isOut && <span className="card-badge">New</span>}
          {p.is_on_sale && !isOut && <span className="card-badge badge-sale">Sale</span>}
        </div>
        <div className="card-body">
          <span className="card-category">{p.category}</span>
          <h3 className="card-title" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--primary)',
            lineHeight: 1.4
          }}>{p.title}</h3>
          <div>
            <span className="card-price">৳ {p.price}</span>
            {p.old_price && <span className="card-old-price">৳{p.old_price}</span>}
          </div>
        </div>
      </a>
    );
  };

  // Filter functions
  const filterByCategory = (cat) => {
    setCurrentFilters(prev => ({ ...prev, cat }));
    setProductsDisplayLimit(12);
  };

  const applyPriceFilter = () => {
    const minPrice = parseFloat(document.getElementById('filter-min-price')?.value) || null;
    const maxPrice = parseFloat(document.getElementById('filter-max-price')?.value) || null;
    setCurrentFilters(prev => ({ ...prev, minPrice, maxPrice }));
    setProductsDisplayLimit(12);
  };

  const loadMoreProducts = () => {
    setProductsDisplayLimit(prev => prev + productsLoadMoreIncrement);
  };

  const handleSorting = (type) => {
    const filtered = getFilteredProducts();
    let sorted = [...filtered];
    if (type === 'price-low') sorted.sort((a, b) => a.price - b.price);
    else if (type === 'price-high') sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setCurrentData(prev => ({ ...prev, products: sorted }));
  };

  const slideCarousel = (carouselId, direction) => {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    const cardWidth = carousel.querySelector('.carousel-card')?.offsetWidth || 260;
    const gap = parseInt(getComputedStyle(carousel).gap) || 16;
    carousel.scrollBy({
      left: direction === 'next' ? (cardWidth + gap) * 2 : -(cardWidth + gap) * 2,
      behavior: 'smooth'
    });
  };

  // Filtered and displayed products
  const filteredProducts = getFilteredProducts();
  const displayedProducts = filteredProducts.slice(0, productsDisplayLimit);
  const totalProducts = filteredProducts.length;
  const hasMore = totalProducts > productsDisplayLimit;

  // Homepage sections
  const newArrivals = currentData.products.filter(p => p.is_new_arrival);
  const trendingNow = currentData.products.filter(p => p.is_hot);
  const featuredProducts = currentData.products.filter(p => p.is_featured);
  const bestSellers = currentData.products.filter(p => p.is_best);
  const onSale = currentData.products.filter(p => p.is_on_sale);
  const limitedEdition = currentData.products.filter(p => p.is_limited_edition);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e5ea',
          borderTop: '4px solid #1d1d1f',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Website",
            "name": "Jayenware",
            "alternateName": "JAYENWARE SHOP",
            "url": "https://www.jayenware.shop",
            "logo": "https://www.jayenware.shop/logo.png",
            "description": "Premium lifestyle products and quality cotton T-shirts store by BINZEO.",
            "priceRange": "৳450 - ৳5000",
            "address": { "@type": "PostalAddress", "addressLocality": "Dhaka", "addressRegion": "Dhaka Division", "addressCountry": "BD" },
            "contactPoint": { "@type": "ContactPoint", "contactType": "customer service", "url": "https://m.me/861762253694814", "availableLanguage": ["English", "Bengali"] },
            "sameAs": ["https://www.facebook.com/jayenware", "https://www.instagram.com/jayenware", "https://www.twitter.com/jayenware"],
            "parentOrganization": { "@type": "Organization", "name": "BINZEO", "url": "https://binzeo.vercel.app" }
          })
        }} />
      </Head>

      {/* HOME PAGE */}
      <section id="home" className="page-section active-page fade-in" style={{ display: activePage === 'home' ? 'block' : 'none' }}>
        {/* Category Showcase */}
        {currentData.categories.length > 0 && (
          <section className="py-8 sm:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {currentData.categories.map(cat => (
                  <a
                    key={cat.id || cat.name}
                    href={`/category/${getCategorySlug(cat.name)}`}
                    className="group relative aspect-square bg-gray-50 rounded-2xl overflow-hidden"
                  >
                    {cat.img && (
                      <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <h3 className="text-white font-semibold text-sm sm:text-base">{cat.name}</h3>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* New Arrivals Carousel */}
        {newArrivals.length > 0 && (
          <section className="carousel-section">
            <div className="carousel-container">
              <div className="carousel-header">
                <h2 className="section-title">New Arrivals</h2>
                <a href="/products?category=new" className="section-link">Shop New <i className="fa-solid fa-arrow-right text-xs"></i></a>
              </div>
              <div className="carousel-wrapper">
                <div id="new-arrivals-carousel" className="carousel-track no-scrollbar">
                  {newArrivals.map(p => productCard(p))}
                </div>
                <button onClick={() => slideCarousel('new-arrivals-carousel', 'prev')} className="carousel-nav prev">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button onClick={() => slideCarousel('new-arrivals-carousel', 'next')} className="carousel-nav next">
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Hero Secondary Banner */}
        <section className="py-8 sm:py-12 bg-[#f5f5f7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center">
              <h2 className="text-2xl sm:text-4xl font-bold text-[#1d1d1f] mb-4">Summer Collection 2026</h2>
              <p className="text-[#86868b] mb-6 max-w-2xl mx-auto">Discover our latest summer styles crafted for comfort and elegance.</p>
              <a href="/products?category=summer" className="inline-flex items-center gap-2 px-8 py-3 bg-[#1d1d1f] text-white rounded-full font-semibold text-sm hover:bg-opacity-90 transition">
                Explore Collection <i className="fa-solid fa-arrow-right text-xs"></i>
              </a>
            </div>
          </div>
        </section>

        {/* Trending Now Carousel */}
        {trendingNow.length > 0 && (
          <section className="carousel-section">
            <div className="carousel-container">
              <div className="carousel-header">
                <h2 className="section-title">Trending Now</h2>
                <a href="/products?category=trending" className="section-link">View All <i className="fa-solid fa-arrow-right text-xs"></i></a>
              </div>
              <div className="carousel-wrapper">
                <div id="trending-now-carousel" className="carousel-track no-scrollbar">
                  {trendingNow.map(p => productCard(p))}
                </div>
                <button onClick={() => slideCarousel('trending-now-carousel', 'prev')} className="carousel-nav prev">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button onClick={() => slideCarousel('trending-now-carousel', 'next')} className="carousel-nav next">
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Featured Products Carousel */}
        {featuredProducts.length > 0 && (
          <section className="carousel-section">
            <div className="carousel-container">
              <div className="carousel-header">
                <h2 className="section-title">Featured Products</h2>
                <a href="/products?category=featured" className="section-link">View All <i className="fa-solid fa-arrow-right text-xs"></i></a>
              </div>
              <div className="carousel-wrapper">
                <div id="featured-products-carousel" className="carousel-track no-scrollbar">
                  {featuredProducts.map(p => productCard(p))}
                </div>
                <button onClick={() => slideCarousel('featured-products-carousel', 'prev')} className="carousel-nav prev">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button onClick={() => slideCarousel('featured-products-carousel', 'next')} className="carousel-nav next">
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Best Sellers Carousel */}
        {bestSellers.length > 0 && (
          <section className="carousel-section">
            <div className="carousel-container">
              <div className="carousel-header">
                <h2 className="section-title">Best Sellers</h2>
                <a href="/products?category=best" className="section-link">View All <i className="fa-solid fa-arrow-right text-xs"></i></a>
              </div>
              <div className="carousel-wrapper">
                <div id="best-sellers-carousel" className="carousel-track no-scrollbar">
                  {bestSellers.map(p => productCard(p))}
                </div>
                <button onClick={() => slideCarousel('best-sellers-carousel', 'prev')} className="carousel-nav prev">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button onClick={() => slideCarousel('best-sellers-carousel', 'next')} className="carousel-nav next">
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* On Sale Carousel */}
        {onSale.length > 0 && (
          <section className="carousel-section">
            <div className="carousel-container">
              <div className="carousel-header">
                <h2 className="section-title">On Sale</h2>
                <a href="/products?category=sale" className="section-link">View Deals <i className="fa-solid fa-arrow-right text-xs"></i></a>
              </div>
              <div className="carousel-wrapper">
                <div id="on-sale-carousel" className="carousel-track no-scrollbar">
                  {onSale.map(p => productCard(p))}
                </div>
                <button onClick={() => slideCarousel('on-sale-carousel', 'prev')} className="carousel-nav prev">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button onClick={() => slideCarousel('on-sale-carousel', 'next')} className="carousel-nav next">
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Limited Edition Carousel (Dark Theme) */}
        {limitedEdition.length > 0 && (
          <section id="limited-edition-section" className="carousel-section" style={{ background: '#000000' }}>
            <div className="carousel-container">
              <div className="carousel-header">
                <h2 className="section-title" style={{ color: '#ffffff' }}>Limited Edition</h2>
                <a href="/products?category=limited" className="section-link" style={{ color: '#007aff' }}>View Exclusive <i className="fa-solid fa-arrow-right text-xs"></i></a>
              </div>
              <div className="carousel-wrapper">
                <div id="limited-edition-carousel" className="carousel-track no-scrollbar">
                  {limitedEdition.map(p => productCard(p))}
                </div>
                <button onClick={() => slideCarousel('limited-edition-carousel', 'prev')} className="carousel-nav prev" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button onClick={() => slideCarousel('limited-edition-carousel', 'next')} className="carousel-nav next" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </section>
        )}
      </section>

      {/* PRODUCTS PAGE */}
      <section id="products" className="py-6 sm:py-8 lg:py-12" style={{ display: activePage === 'products' ? 'block' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            <aside className="lg:w-64 shrink-0">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-[#1d1d1f] mb-4">Categories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => filterByCategory('all')}
                    className={`block w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition ${currentFilters.cat === 'all' ? 'bg-[#1d1d1f] text-white' : 'hover:bg-gray-50'}`}
                  >All</button>
                  {currentData.categories.map(c => (
                    <button
                      key={c.id || c.name}
                      onClick={() => filterByCategory(c.name)}
                      className={`block w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition ${currentFilters.cat === c.name ? 'bg-[#1d1d1f] text-white' : 'hover:bg-gray-50'}`}
                    >{c.name}</button>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-[#86868b] block mb-1">Min Price</label>
                    <input type="number" id="filter-min-price" placeholder="৳ Min" className="w-full p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-[#86868b] block mb-1">Max Price</label>
                    <input type="number" id="filter-max-price" placeholder="৳ Max" className="w-full p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs" />
                  </div>
                  <button onClick={applyPriceFilter} className="w-full py-2 bg-[#1d1d1f] text-white rounded-xl text-xs font-semibold">Apply</button>
                </div>
              </div>
            </aside>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <p className="text-xs font-medium text-[#86868b]">
                  Showing {displayedProducts.length} of {totalProducts} products
                </p>
                <select
                  onChange={(e) => handleSorting(e.target.value)}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {displayedProducts.map(p => productCard(p))}
              </div>
              {hasMore && (
                <div className="text-center mt-8">
                  <button onClick={loadMoreProducts} className="px-8 py-3 bg-[#1d1d1f] text-white rounded-full font-semibold uppercase text-xs tracking-wider hover:bg-opacity-90 transition">
                    Load More ({totalProducts - productsDisplayLimit} remaining)
                  </button>
                </div>
              )}
              {displayedProducts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-[#86868b] text-lg">No products found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* WISHLIST PAGE */}
      <section id="wishlist" className="py-6 sm:py-8 lg:py-12" style={{ display: activePage === 'wishlist' ? 'block' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#1d1d1f]">Your Wishlist</h2>
          </div>
          <div className="text-center py-20">
            <i className="fa-regular fa-heart text-5xl sm:text-7xl text-gray-200 mb-6 block"></i>
            <p className="text-lg sm:text-xl text-[#86868b] font-medium">Your wishlist is empty</p>
            <button onClick={() => setActivePage('products')} className="mt-6 px-8 py-3 bg-[#1d1d1f] text-white rounded-full font-semibold uppercase text-xs tracking-wider hover:bg-opacity-90 transition inline-block">
              Explore Products
            </button>
          </div>
        </div>
      </section>

      {/* JOURNAL / NEWS PAGE */}
      <section id="news" className="py-6 sm:py-8 lg:py-12" style={{ display: activePage === 'news' ? 'block' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#1d1d1f]">The Journal</h2>
          </div>
          {currentData.news.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {currentData.news.map(n => (
                <article key={n.id || n.title} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition">
                  <img src={n.img} alt={n.title} className="w-full h-48 object-cover" loading="lazy" />
                  <div className="p-4 sm:p-6">
                    <time className="text-[10px] font-semibold uppercase text-[#86868b]">
                      {new Date(n.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </time>
                    <h3 className="font-bold text-lg mt-2 mb-3 text-[#1d1d1f]">{n.title}</h3>
                    <p className="text-xs text-[#86868b] line-clamp-3">{n.excerpt}</p>
                    <a href={n.link || '#'} className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-[#007aff] no-underline hover:gap-3 transition">
                      Read More <i className="fa-solid fa-arrow-right text-[10px]"></i>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#86868b] text-lg">No articles yet</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
