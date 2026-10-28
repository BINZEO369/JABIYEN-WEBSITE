import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import Head from 'next/head';
import HeroVideo from '../components/home/HeroVideo';
import CategoryShowcase from '../components/home/CategoryShowcase';
import HeroBanner from '../components/home/HeroBanner';
import HeroSecondaryBanner from '../components/home/HeroSecondaryBanner';
import NewArrivals from '../components/home/NewArrivals';
import TrendingNow from '../components/home/TrendingNow';
import FeaturedProducts from '../components/home/FeaturedProducts';
import BestSellers from '../components/home/BestSellers';
import OnSale from '../components/home/OnSale';
import LimitedEdition from '../components/home/LimitedEdition';
import { useCurrency } from '../components/currency/CurrencyProvider';

/* ============================================================
   SKELETON PRIMITIVES — World-class shimmer placeholders
   ============================================================ */
const Sk = ({ w = '100%', h = 16, r = 8, style = {} }: { w?: string | number; h?: string | number; r?: string | number; style?: CSSProperties }) => (
  <div className="sk-shimmer" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

const HeroVideoSkeleton = () => (
  <div className="sk-hero-video">
    <Sk w="100%" h="100%" r={0} style={{ position: 'absolute', inset: 0 }} />
    <div className="sk-hero-video-content">
      <Sk w={120} h={14} r={20} style={{ marginBottom: 18 }} />
      <Sk w="70%" h={64} r={12} style={{ marginBottom: 18 }} />
      <Sk w="50%" h={44} r={10} style={{ marginBottom: 24 }} />
      <div style={{ display: 'flex', gap: 12 }}>
        <Sk w={160} h={48} r={24} />
        <Sk w={160} h={48} r={24} />
      </div>
    </div>
  </div>
);

const CategoryShowcaseSkeleton = () => (
  <section className="sk-section">
    <div className="sk-section-header">
      <Sk w={200} h={14} r={20} style={{ margin: '0 auto 12px' }} />
      <Sk w={340} h={36} r={10} style={{ margin: '0 auto 48px' }} />
    </div>
    <div className="sk-category-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <Sk w="100%" h="auto" r={20} style={{ aspectRatio: '1', marginBottom: 14 }} />
          <Sk w="60%" h={16} r={6} style={{ margin: '0 auto 8px' }} />
          <Sk w="40%" h={12} r={6} style={{ margin: '0 auto' }} />
        </div>
      ))}
    </div>
  </section>
);

const HeroBannerSkeleton = () => (
  <section className="sk-section-tight">
    <div className="sk-hero-banner">
      <Sk w="100%" h="100%" r={24} style={{ position: 'absolute', inset: 0 }} />
      <div className="sk-hero-banner-content">
        <Sk w={100} h={14} r={20} style={{ marginBottom: 16 }} />
        <Sk w="65%" h={56} r={12} style={{ marginBottom: 16 }} />
        <Sk w="45%" h={20} r={8} style={{ marginBottom: 28 }} />
        <Sk w={150} h={46} r={23} />
      </div>
    </div>
  </section>
);

const ProductCarouselSkeleton = ({ cards = 5 }) => (
  <section className="sk-section">
    <div className="sk-section-header-row">
      <div>
        <Sk w={100} h={12} r={20} style={{ marginBottom: 10 }} />
        <Sk w={260} h={32} r={10} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Sk w={44} h={44} r={22} />
        <Sk w={44} h={44} r={22} />
      </div>
    </div>
    <div className="sk-carousel">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="sk-carousel-card">
          <Sk w="100%" h="auto" r={16} style={{ aspectRatio: '3/4', marginBottom: 14 }} />
          <Sk w="40%" h={11} r={4} style={{ marginBottom: 10 }} />
          <Sk w="85%" h={16} r={6} style={{ marginBottom: 10 }} />
          <Sk w="35%" h={16} r={6} />
        </div>
      ))}
    </div>
  </section>
);

const HeroSecondarySkeleton = () => (
  <section className="sk-section-tight">
    <div className="sk-hero-secondary-inner">
      <Sk w="100%" h="100%" r={20} style={{ position: 'absolute', inset: 0 }} />
      <div className="sk-hero-secondary-content">
        <Sk w={80} h={12} r={20} style={{ marginBottom: 14 }} />
        <Sk w="70%" h={40} r={10} style={{ marginBottom: 14 }} />
        <Sk w={140} h={42} r={21} />
      </div>
    </div>
  </section>
);

/* ============================================================ */

export default function Home() {
  const { formatMoney, convertToUsd, selectedCurrency } = useCurrency();
  const [currentData, setCurrentData] = useState({
    products: [], categories: [], news: [], hero: [], heroVideos: [], hero_secondary: []
  });
  const [currentFilters, setCurrentFilters] = useState({ cat: 'all', minPrice: null, maxPrice: null });
  const [productsDisplayLimit, setProductsDisplayLimit] = useState(12);
  const [activePage, setActivePage] = useState('home');
  const [loading, setLoading] = useState(true);
  const [revealedSections, setRevealedSections] = useState(new Set());
  const productsLoadMoreIncrement = 12;

  const fetchAPI = useCallback(async (endpoint) => {
    try { const res = await fetch(endpoint); if (!res.ok) throw new Error(); return await res.json(); }
    catch (e) { return []; }
  }, []);

  const getProductSlug = (p) =>
    (p.slug || p.title || 'product').toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

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
        window.dispatchEvent(new CustomEvent('jayenware:dataLoaded', {
          detail: { products: prods || [], hero: hero || [], heroVideos: heroVideosData || [], hero_secondary: heroSecondaryData || [] }
        }));
      } catch (err) { console.error('[App] Error:', err); }
      setLoading(false);
    }
    loadData();
  }, [fetchAPI]);

  /* ---- STAGGERED SECTION REVEAL: sections load one-by-one, world-class fade ---- */
  useEffect(() => {
    if (loading) return;
    const order = ['hero', 'categories', 'banner', 'newArrivals', 'secondary', 'trending', 'featured', 'bestSellers', 'onSale', 'limited'];
    const timers = order.map((name, i) =>
      setTimeout(() => {
        setRevealedSections(prev => new Set([...prev, name]));
      }, i * 170)
    );
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  const isRevealed = (name) => revealedSections.has(name);

  const productCard = (p) => {
    const isOut = p.stock <= 0; const slug = getProductSlug(p);
    return (
      <a key={p.id} href={`/product/${slug}`} className="carousel-card" style={{ width: '100%' }}>
        <div className="card-img" style={{ aspectRatio: '3/4' }}>
          <img src={p.img} alt={p.title} loading="lazy" />
          {isOut && <div className="card-soldout-overlay"><span>Sold Out</span></div>}
        </div>
        <div className="card-body">
          <span className="card-category">{p.category}</span>
          <h3 className="card-title">{p.title}</h3>
          <div><span className="card-price">{formatMoney(p.price)}</span>{p.old_price && <span className="card-old-price">{formatMoney(p.old_price)}</span>}</div>
        </div>
      </a>
    );
  };

  const filterByCategory = (cat) => { setCurrentFilters(prev => ({ ...prev, cat })); setProductsDisplayLimit(12); };
  const applyPriceFilter = () => {
    const minValue = parseFloat((document.getElementById('filter-min-price') as HTMLInputElement | null)?.value ?? '');
    const maxValue = parseFloat((document.getElementById('filter-max-price') as HTMLInputElement | null)?.value ?? '');
    const minPrice = Number.isFinite(minValue) && minValue > 0 ? convertToUsd(minValue) : null;
    const maxPrice = Number.isFinite(maxValue) && maxValue > 0 ? convertToUsd(maxValue) : null;
    setCurrentFilters(prev => ({ ...prev, minPrice, maxPrice })); setProductsDisplayLimit(12);
  };
  const loadMoreProducts = () => setProductsDisplayLimit(prev => prev + productsLoadMoreIncrement);
  const handleSorting = (type) => {
    let sorted = [...getFilteredProducts()];
    if (type === 'price-low') sorted.sort((a, b) => a.price - b.price);
    else if (type === 'price-high') sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setCurrentData(prev => ({ ...prev, products: sorted })); setProductsDisplayLimit(12);
  };
  const slideCarousel = (carouselId, direction) => {
    const carousel = document.getElementById(carouselId); if (!carousel) return;
    const cardWidth = carousel.querySelector<HTMLElement>('.carousel-card')?.offsetWidth || 260;
    const gap = parseInt(getComputedStyle(carousel).gap) || 16;
    carousel.scrollBy({ left: direction === 'next' ? (cardWidth + gap) * 2 : -(cardWidth + gap) * 2, behavior: 'smooth' });
  };

  const filteredProducts = getFilteredProducts();
  const displayedProducts = filteredProducts.slice(0, productsDisplayLimit);
  const totalProducts = filteredProducts.length;
  const hasMore = totalProducts > productsDisplayLimit;

  /* ---------- helpers to render either skeleton or revealed content ---------- */
  const Reveal = ({ name, children, skeleton }) => (
    <>
      {isRevealed(name)
        ? <div className="reveal-section">{children}</div>
        : skeleton}
    </>
  );

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context":"https://schema.org","@type":"Website","name":"Jayenware","alternateName":"JAYENWARE SHOP",
          "url":"https://jabiyen-website.vercel.app","logo":"https://jabiyen-website.vercel.app/logo.png",
          "description":"Premium lifestyle products and quality cotton T-shirts store by BINZEO.",
          "priceRange":"$10 - $100","image":"https://jabiyen-website.vercel.app/logo.png",
          "address":{"@type":"PostalAddress","addressLocality":"Dhaka","addressRegion":"Dhaka Division","addressCountry":"BD"},
          "contactPoint":{"@type":"ContactPoint","contactType":"customer service","url":"https://m.me/861762253694814"},
          "sameAs":["https://www.facebook.com/jayenware","https://www.instagram.com/jayenware","https://www.twitter.com/jayenware"],
          "parentOrganization":{"@type":"Organization","name":"BINZEO","url":"https://binzeo.vercel.app"}
        })}} />
      </Head>

      {/* ======================= GLOBAL STYLES ======================= */}
      <style jsx global>{`
        @keyframes skShimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
        .sk-shimmer {
          background: linear-gradient(90deg, #f2f2f5 0%, #e6e6eb 50%, #f2f2f5 100%);
          background-size: 200% 100%;
          animation: skShimmer 1.6s infinite linear;
        }
        @keyframes revealUp {
          0%   { opacity: 0; transform: translateY(44px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0)    scale(1);     }
        }
        .reveal-section {
          animation: revealUp 0.95s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
        .sk-section        { padding: 60px 5%; }
        .sk-section-tight  { padding: 30px 5%; }
        .sk-section-header { text-align: center; margin-bottom: 8px; }
        .sk-section-header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
        .sk-hero-video {
          position: relative; width: 100%; aspect-ratio: 16/9;
          overflow: hidden; background: #0a0a0a;
        }
        .sk-hero-video-content {
          position: absolute; left: 8%; right: 8%; bottom: 14%;
          max-width: 620px;
        }
        .sk-category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 20px;
        }
        .sk-hero-banner {
          position: relative; aspect-ratio: 21/9;
          border-radius: 24px; overflow: hidden; background: #f2f2f4;
        }
        .sk-hero-banner-content {
          position: absolute; left: 8%; right: 8%; bottom: 14%;
          max-width: 560px;
        }
        .sk-carousel      { display: flex; gap: 20px; overflow: hidden; }
        .sk-carousel-card { flex: 0 0 auto; min-width: 240px; width: 240px; }
        .sk-hero-secondary-inner {
          position: relative; aspect-ratio: 16/7;
          border-radius: 20px; overflow: hidden; background: #f2f2f4;
        }
        .sk-hero-secondary-content {
          position: absolute; left: 8%; right: 8%; bottom: 16%;
          max-width: 500px;
        }
        @media (max-width: 768px) {
          .sk-hero-video           { aspect-ratio: 4/5; }
          .sk-hero-banner          { aspect-ratio: 4/5; }
          .sk-hero-secondary-inner { aspect-ratio: 4/3; }
          .sk-carousel-card        { min-width: 200px; width: 200px; }
          .sk-section              { padding: 40px 4%; }
        }
      `}</style>

      {/* ======================== HOME PAGE ======================== */}
      <section id="home" className="page-section active-page" style={{ display: activePage === 'home' ? 'block' : 'none' }}>
        <Reveal name="hero"       skeleton={<HeroVideoSkeleton />}>
          <HeroVideo videos={currentData.heroVideos} />
        </Reveal>
        <Reveal name="categories" skeleton={<CategoryShowcaseSkeleton />}>
          <CategoryShowcase />
        </Reveal>
        <Reveal name="banner"     skeleton={<HeroBannerSkeleton />}>
          <HeroBanner slides={currentData.hero} />
        </Reveal>
        <Reveal name="newArrivals" skeleton={<ProductCarouselSkeleton cards={5} />}>
          <NewArrivals products={currentData.products} />
        </Reveal>
        <Reveal name="secondary"  skeleton={<HeroSecondarySkeleton />}>
          <HeroSecondaryBanner slides={currentData.hero_secondary} />
        </Reveal>
        <Reveal name="trending"   skeleton={<ProductCarouselSkeleton cards={5} />}>
          <TrendingNow products={currentData.products} />
        </Reveal>
        <Reveal name="featured"   skeleton={<ProductCarouselSkeleton cards={5} />}>
          <FeaturedProducts products={currentData.products} />
        </Reveal>
        <Reveal name="bestSellers" skeleton={<ProductCarouselSkeleton cards={5} />}>
          <BestSellers products={currentData.products} />
        </Reveal>
        <Reveal name="onSale"     skeleton={<ProductCarouselSkeleton cards={5} />}>
          <OnSale products={currentData.products} />
        </Reveal>
        <Reveal name="limited"    skeleton={<ProductCarouselSkeleton cards={5} />}>
          <LimitedEdition products={currentData.products} />
        </Reveal>
      </section>

      {/* ======================== PRODUCTS PAGE ======================== */}
      <section id="products" className="py-6 sm:py-8 lg:py-12" style={{ display: activePage === 'products' ? 'block' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            <aside className="lg:w-64 shrink-0">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
                <h3 className="font-semibold text-sm uppercase mb-4">Categories</h3>
                <div id="sidebar-categories" className="space-y-1" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <button onClick={() => filterByCategory('all')} className={`block w-full text-left py-2 px-3 rounded-lg text-xs font-semibold ${currentFilters.cat==='all'?'bg-primary text-white':'hover:bg-gray-50'}`}>All</button>
                  {currentData.categories.map(c => (
                    <button key={c.id||c.name} onClick={() => filterByCategory(c.name)} className={`block w-full text-left py-2 px-3 rounded-lg text-xs font-semibold ${currentFilters.cat===c.name?'bg-primary text-white':'hover:bg-gray-50'}`}>{c.name}</button>
                  ))}
                </div>
                <div id="mobile-filters" className="hidden mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div><label className="text-[10px] font-semibold uppercase text-accent block mb-1">Min Price ({selectedCurrency.currency_code})</label><input type="number" id="filter-min-price" placeholder={`${selectedCurrency.currency_symbol} Min`} className="w-full p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs" /></div>
                  <div><label className="text-[10px] font-semibold uppercase text-accent block mb-1">Max Price ({selectedCurrency.currency_code})</label><input type="number" id="filter-max-price" placeholder={`${selectedCurrency.currency_symbol} Max`} className="w-full p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs" /></div>
                  <button onClick={applyPriceFilter} className="w-full py-2 bg-primary text-white rounded-xl text-xs font-semibold">Apply</button>
                </div>
              </div>
            </aside>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <p className="text-xs font-medium text-accent">Showing {displayedProducts.length} of {totalProducts} products</p>
                <select onChange={(e) => handleSorting(e.target.value)} className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-semibold">
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {displayedProducts.length > 0 ? displayedProducts.map(p => productCard(p)) : <div className="col-span-full text-center py-20"><p className="text-accent text-lg">No products found</p></div>}
              </div>
              {hasMore && <div className="text-center mt-8"><button onClick={loadMoreProducts} className="px-8 py-3 bg-primary text-white rounded-full font-semibold uppercase text-xs">Load More ({totalProducts - productsDisplayLimit} remaining)</button></div>}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== PRODUCT DETAILS ======================== */}
      <section id="product-details" className="page-section" style={{ display: activePage === 'product-details' ? 'block' : 'none' }}></section>

      {/* ======================== WISHLIST ======================== */}
      <section id="wishlist" className="py-6 sm:py-8 lg:py-12" style={{ display: activePage === 'wishlist' ? 'block' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-8">Your Wishlist</h2>
          <div id="wishlist-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"></div>
          <div id="empty-wishlist" className="py-20">
            <i className="fa-regular fa-heart text-5xl text-gray-200 mb-6 block"></i>
            <p className="text-accent font-medium">Your wishlist is empty</p>
            <button onClick={() => setActivePage('products')} className="mt-6 px-8 py-3 bg-primary text-white rounded-full font-semibold uppercase text-xs">Explore Products</button>
          </div>
        </div>
      </section>

      {/* ======================== NEWS / JOURNAL ======================== */}
      <section id="news" className="py-6 sm:py-8 lg:py-12" style={{ display: activePage === 'news' ? 'block' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-bold text-center mb-8">The Journal</h2>
          <div id="news-grid" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {currentData.news.length > 0 ? currentData.news.map(n => (
              <article key={n.id||n.title} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition">
                <img src={n.img} alt={n.title} className="w-full h-48 object-cover" loading="lazy" />
                <div className="p-4 sm:p-6">
                  <time className="text-[10px] font-semibold uppercase text-accent">{new Date(n.date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</time>
                  <h3 className="font-bold text-lg mt-2 mb-3 text-primary">{n.title}</h3>
                  <p className="text-xs text-accent line-clamp-3">{n.excerpt}</p>
                  <a href={n.link||'#'} className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-blue">Read More <i className="fa-solid fa-arrow-right text-[10px]"></i></a>
                </div>
              </article>
            )) : <div className="col-span-full text-center py-20"><p className="text-accent text-lg">No articles yet</p></div>}
          </div>
        </div>
      </section>
    </>
  );
}
