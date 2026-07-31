import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

export default function Home() {
  const [currentData, setCurrentData] = useState({
    products: [], categories: [], news: [], hero: [], heroVideos: [], hero_secondary: []
  });
  const [currentFilters, setCurrentFilters] = useState({ cat: 'all', minPrice: null, maxPrice: null });
  const [productsDisplayLimit, setProductsDisplayLimit] = useState(12);
  const [activePage, setActivePage] = useState('home');
  const [loading, setLoading] = useState(true);
  const productsLoadMoreIncrement = 12;

  const fetchAPI = useCallback(async (endpoint) => {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [];
    }
  }, []);

  const getCategorySlug = (c) => c ? c.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '') : '';
  const getProductSlug = (p) => (p.slug || p.title || 'product').toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

  const getFilteredProducts = useCallback(() => {
    let list = currentData.products;
    if (currentFilters.cat !== 'all') list = list.filter(p => p.category === currentFilters.cat);
    if (currentFilters.minPrice) list = list.filter(p => p.price >= currentFilters.minPrice);
    if (currentFilters.maxPrice) list = list.filter(p => p.price <= currentFilters.maxPrice);
    return list;
  }, [currentData.products, currentFilters]);

  useEffect(() => {
    async function loadData() {
      try {
        const [hero, cats, prods, newsData, heroVideosData, heroSecondaryData] = await Promise.all([
          fetchAPI('/api/hero'), fetchAPI('/api/categories'), fetchAPI('/api/products'),
          fetchAPI('/api/news'), fetchAPI('/api/hero-videos'), fetchAPI('/api/hero-secondary')
        ]);
        setCurrentData({
          hero: hero || [], categories: cats || [], products: prods || [],
          news: newsData || [], heroVideos: heroVideosData || [], hero_secondary: heroSecondaryData || []
        });
      } catch (err) {
        console.error('[App] Error:', err);
      }
      setLoading(false);
    }
    loadData();
  }, [fetchAPI]);

  const productCard = (p) => {
    const isOut = p.stock <= 0;
    const slug = getProductSlug(p);
    return (
      <a key={p.id} href={`/product/${slug}`} className="carousel-card" style={{ width: '100%' }}>
        <div className="card-img" style={{ aspectRatio: '3/4' }}>
          <img src={p.img} alt={p.title} loading="lazy" />
          {isOut && <div className="card-soldout-overlay"><span>Sold Out</span></div>}
          {p.is_new_arrival && !isOut && <span className="card-badge">New</span>}
          {p.is_on_sale && !isOut && <span className="card-badge badge-sale">Sale</span>}
        </div>
        <div className="card-body">
          <span className="card-category">{p.category}</span>
          <h3 className="card-title">{p.title}</h3>
          <div>
            <span className="card-price">৳ {p.price}</span>
            {p.old_price && <span className="card-old-price">৳{p.old_price}</span>}
          </div>
        </div>
      </a>
    );
  };

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

  const loadMoreProducts = () => setProductsDisplayLimit(prev => prev + productsLoadMoreIncrement);

  const handleSorting = (type) => {
    let sorted = [...getFilteredProducts()];
    if (type === 'price-low') sorted.sort((a, b) => a.price - b.price);
    else if (type === 'price-high') sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setCurrentData(prev => ({ ...prev, products: sorted }));
    setProductsDisplayLimit(12);
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

  const filteredProducts = getFilteredProducts();
  const displayedProducts = filteredProducts.slice(0, productsDisplayLimit);
  const totalProducts = filteredProducts.length;
  const hasMore = totalProducts > productsDisplayLimit;

  const newArrivals = currentData.products.filter(p => p.is_new_arrival);
  const trendingNow = currentData.products.filter(p => p.is_hot);
  const featured = currentData.products.filter(p => p.is_featured);
  const bestSellers = currentData.products.filter(p => p.is_best);
  const onSale = currentData.products.filter(p => p.is_on_sale);
  const limitedEdition = currentData.products.filter(p => p.is_limited_edition);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #e5e5ea', borderTopColor: '#1d1d1f', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
            "description": "Premium lifestyle products and quality cotton T-shirts store by BINZEO. Shop authentic apparel with fast delivery across World.",
            "priceRange": "৳450 - ৳5000",
            "image": "https://www.jayenware.shop/logo.png",
            "address": { "@type": "PostalAddress", "addressLocality": "Dhaka", "addressRegion": "Dhaka Division", "addressCountry": "BD" },
            "geo": { "@type": "GeoCoordinates", "latitude": "23.8103", "longitude": "90.4125" },
            "contactPoint": { "@type": "ContactPoint", "contactType": "customer service", "url": "https://m.me/861762253694814", "availableLanguage": ["English", "Bengali"] },
            "sameAs": ["https://www.facebook.com/jayenware", "https://www.instagram.com/jayenware", "https://www.twitter.com/jayenware"],
            "openingHoursSpecification": { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "09:00", "closes": "21:00" },
            "parentOrganization": { "@type": "Organization", "name": "BINZEO", "url": "https://binzeo.vercel.app" }
          })
        }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              { "@type": "WebSite", "name": "JAYENWARE", "alternateName": "JAYENWARE SHOP", "url": "https://www.jayenware.shop/", "description": "Premium lifestyle products and quality cotton T-shirts store by BINZEO." },
              { "@type": "Organization", "name": "JAYENWARE", "url": "https://www.jayenware.shop/", "logo": { "@type": "ImageObject", "url": "https://www.jayenware.shop/logo.png", "width": 512, "height": 512 }, "sameAs": ["https://www.facebook.com/jayenware","https://www.instagram.com/jayenware","https://www.twitter.com/jayenware"] }
            ]
          })
        }} />
      </Head>

      {/* ==================== HOME PAGE ==================== */}
      <section id="home" className="page-section active-page fade-in" style={{ display: activePage === 'home' ? 'block' : 'none' }}>
        {/* Category Showcase */}
        <div id="categoryshow-container"></div>
        
        {/* New Arrivals */}
        <div id="new-arrivals-container"></div>
        
        {/* Hero Secondary Banner */}
        <div id="hero-secondary-container"></div>
        
        {/* Trending Now */}
        <div id="trending-now-container"></div>
        
        {/* Featured Products */}
        <div id="featured-products-container"></div>
        
        {/* Best Sellers */}
        <div id="best-sellers-container"></div>
        
        {/* On Sale */}
        <div id="on-sale-container"></div>
        
        {/* Limited Edition */}
        <div id="limited-edition-container"></div>

        {/* Fallback if scripts not loaded */}
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
              </div>
            </div>
          </section>
        )}
      </section>

      {/* ==================== PRODUCTS PAGE ==================== */}
      <section id="products" className="py-6 sm:py-8 lg:py-12" style={{ display: activePage === 'products' ? 'block' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            <aside className="lg:w-64 shrink-0">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-primary">Categories</h3>
                  <button onClick={() => {
                    const el = document.getElementById('mobile-filters');
                    if (el) el.classList.toggle('hidden');
                  }} className="lg:hidden text-accent">
                    <i className="fa-solid fa-sliders text-sm"></i>
                  </button>
                </div>
                <div id="sidebar-categories" className="space-y-1 hidden lg:block" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <button onClick={() => filterByCategory('all')} className={`block w-full text-left py-2 px-3 rounded-lg text-[10px] sm:text-xs font-semibold transition ${currentFilters.cat === 'all' ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}>All</button>
                  {currentData.categories.map(c => (
                    <button key={c.id || c.name} onClick={() => filterByCategory(c.name)} className={`block w-full text-left py-2 px-3 rounded-lg text-[10px] sm:text-xs font-semibold transition ${currentFilters.cat === c.name ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}>{c.name}</button>
                  ))}
                </div>
                <div id="mobile-filters" className="hidden lg:hidden mt-4 pt-4 border-t border-gray-100">
                  <div className="space-y-3">
                    <div><label className="text-[10px] font-semibold uppercase text-accent block mb-1">Min Price</label><input type="number" id="filter-min-price" placeholder="৳ Min" className="w-full p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs" /></div>
                    <div><label className="text-[10px] font-semibold uppercase text-accent block mb-1">Max Price</label><input type="number" id="filter-max-price" placeholder="৳ Max" className="w-full p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs" /></div>
                    <button onClick={applyPriceFilter} className="w-full py-2 bg-primary text-white rounded-xl text-xs font-semibold">Apply</button>
                  </div>
                </div>
              </div>
            </aside>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <p id="product-count" className="text-xs font-medium text-accent">
                  Showing {displayedProducts.length} of {totalProducts} products
                </p>
                <div id="sort-container" className="relative">
                  <select onChange={(e) => handleSorting(e.target.value)} className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-semibold">
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {displayedProducts.length > 0 ? (
                  displayedProducts.map(p => productCard(p))
                ) : (
                  <div className="col-span-full text-center py-20">
                    <p className="text-accent text-lg">No products found</p>
                  </div>
                )}
              </div>
              {hasMore && (
                <div className="text-center mt-8">
                  <button onClick={loadMoreProducts} className="px-8 py-3 bg-primary text-white rounded-full font-semibold uppercase text-xs tracking-wider hover:bg-blue transition">
                    Load More ({totalProducts - productsDisplayLimit} remaining)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PRODUCT DETAILS PAGE ==================== */}
      <section id="product-details" className="page-section" style={{ display: activePage === 'product-details' ? 'block' : 'none' }}></section>

      {/* ==================== WISHLIST PAGE ==================== */}
      <section id="wishlist" className="py-6 sm:py-8 lg:py-12" style={{ display: activePage === 'wishlist' ? 'block' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-serif text-primary">Your Wishlist</h2>
          </div>
          <div id="wishlist-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"></div>
          <div id="empty-wishlist" className="text-center py-20">
            <i className="fa-regular fa-heart text-5xl sm:text-7xl text-gray-200 mb-6 block"></i>
            <p className="text-lg sm:text-xl text-accent font-medium">Your wishlist is empty</p>
            <button onClick={() => setActivePage('products')} className="mt-6 px-8 py-3 bg-primary text-white rounded-full font-semibold uppercase text-xs tracking-wider hover:bg-blue transition inline-block">
              Explore Products
            </button>
          </div>
        </div>
      </section>

      {/* ==================== NEWS / JOURNAL PAGE ==================== */}
      <section id="news" className="py-6 sm:py-8 lg:py-12" style={{ display: activePage === 'news' ? 'block' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-serif text-primary">The Journal</h2>
          </div>
          <div id="news-grid" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {currentData.news.length > 0 ? (
              currentData.news.map(n => (
                <article key={n.id || n.title} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition">
                  <img src={n.img} alt={n.title} className="w-full h-48 object-cover" loading="lazy" />
                  <div className="p-4 sm:p-6">
                    <time className="text-[10px] font-semibold uppercase text-accent">
                      {new Date(n.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </time>
                    <h3 className="font-bold text-lg mt-2 mb-3 text-primary">{n.title}</h3>
                    <p className="text-xs text-accent line-clamp-3">{n.excerpt}</p>
                    <a href={n.link || '#'} className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-blue no-underline hover:gap-3 transition">
                      Read More <i className="fa-solid fa-arrow-right text-[10px]"></i>
                    </a>
                  </div>
                </article>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <p className="text-accent text-lg">No articles yet</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
