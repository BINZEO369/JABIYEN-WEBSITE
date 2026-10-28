import { useState, useEffect, useCallback } from 'react';
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

/* ---------- Skeleton এর CSS ---------- */
const CSS = `
.sk{position:relative;overflow:hidden;background:#ececf0;border-radius:12px}
.sk::after{content:'';position:absolute;inset:0;transform:translateX(-100%);
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);
  animation:shimmer 1.5s infinite}
@keyframes shimmer{100%{transform:translateX(100%)}}
.reveal{animation:up .8s cubic-bezier(.22,1,.36,1) both}
@keyframes up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
.img-fade{opacity:0;transition:opacity .6s ease}
.img-fade.loaded{opacity:1}
`;

/* ---------- ছোট ছোট Skeleton অংশ ---------- */
const Sk = ({ w = '100%', h = 16, r = 12, style = {} }: any) => (
  <div className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

const Box = ({ children }: any) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
);

const CardSkeleton = () => (
  <div>
    <Sk h="auto" r={16} style={{ aspectRatio: '3/4' }} />
    <Sk w="35%" h={10} style={{ marginTop: 12 }} />
    <Sk w="85%" h={14} style={{ marginTop: 10 }} />
    <Sk w="45%" h={14} style={{ marginTop: 10 }} />
  </div>
);

const VideoSkeleton = () => (
  <Sk h="auto" r={0} style={{ aspectRatio: '16/8', minHeight: 260 }} />
);

const CategorySkeleton = () => (
  <div className="py-8"><Box>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i}>
          <Sk h="auto" r={20} style={{ aspectRatio: '1/1' }} />
          <Sk w="60%" h={12} style={{ marginTop: 10 }} />
        </div>
      ))}
    </div>
  </Box></div>
);

const BannerSkeleton = ({ ratio = '21/9' }: any) => (
  <div className="py-4 sm:py-8"><Box>
    <Sk h="auto" r={24} style={{ aspectRatio: ratio, minHeight: 180 }} />
  </Box></div>
);

const RowSkeleton = () => (
  <div className="py-8 sm:py-12"><Box>
    <Sk w={200} h={26} style={{ marginBottom: 20 }} />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
    </div>
  </Box></div>
);

const NewsSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
    <Sk h={192} r={0} />
    <div className="p-4">
      <Sk w={110} h={10} />
      <Sk w="90%" h={20} style={{ marginTop: 12 }} />
      <Sk h={10} style={{ marginTop: 12 }} />
      <Sk w="60%" h={10} style={{ marginTop: 8 }} />
    </div>
  </div>
);

/* ছবি লোড হওয়া পর্যন্ত skeleton, তারপর fade-in */
const FadeImage = ({ src, alt }: any) => {
  const [ok, setOk] = useState(false);
  return (
    <>
      {!ok && <Sk h="100%" r={0} style={{ position: 'absolute', inset: 0 }} />}
      <img
        src={src} alt={alt} loading="lazy"
        className={`img-fade ${ok ? 'loaded' : ''}`}
        onLoad={() => setOk(true)} onError={() => setOk(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </>
  );
};

export default function Home() {
  const { formatMoney, convertToUsd, selectedCurrency } = useCurrency();
  const [currentData, setCurrentData] = useState({
    products: [], categories: [], news: [], hero: [], heroVideos: [], hero_secondary: []
  });
  const [currentFilters, setCurrentFilters] = useState({ cat: 'all', minPrice: null, maxPrice: null });
  const [productsDisplayLimit, setProductsDisplayLimit] = useState(12);
  const [activePage, setActivePage] = useState('home');
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState(0); // কয়টি সেকশন দেখানো হয়েছে
  const productsLoadMoreIncrement = 12;

  const fetchAPI = useCallback(async (endpoint) => {
    try { const res = await fetch(endpoint); if (!res.ok) throw new Error(); return await res.json(); }
    catch (e) { return []; }
  }, []);

  const getProductSlug = (p) => (p.slug || p.title || 'product').toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

  const getFilteredProducts = useCallback(() => {
    let list = currentData.products;
    if (currentFilters.cat !== 'all') list = list.filter(p => p.category === currentFilters.cat);
    if (currentFilters.minPrice) list = list.filter(p => p.price >= currentFilters.minPrice);
    if (currentFilters.maxPrice) list = list.filter(p => p.price <= currentFilters.maxPrice);
    return list;
  }, [currentData.products, currentFilters]);

  /* ডেটা লোড */
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

  /* সেকশনের তালিকা: skeleton + আসল কম্পোনেন্ট */
  const sections = [
    { sk: <VideoSkeleton />, el: <HeroVideo videos={currentData.heroVideos} /> },
    { sk: <CategorySkeleton />, el: <CategoryShowcase /> },
    { sk: <BannerSkeleton />, el: <HeroBanner slides={currentData.hero} /> },
    { sk: <RowSkeleton />, el: <NewArrivals products={currentData.products} /> },
    { sk: <BannerSkeleton ratio="3/1" />, el: <HeroSecondaryBanner slides={currentData.hero_secondary} /> },
    { sk: <RowSkeleton />, el: <TrendingNow products={currentData.products} /> },
    { sk: <RowSkeleton />, el: <FeaturedProducts products={currentData.products} /> },
    { sk: <RowSkeleton />, el: <BestSellers products={currentData.products} /> },
    { sk: <RowSkeleton />, el: <OnSale products={currentData.products} /> },
    { sk: <RowSkeleton />, el: <LimitedEdition products={currentData.products} /> },
  ];

  /* ডেটা আসার পর একটার পর একটা সেকশন দেখাও */
  useEffect(() => {
    if (loading || shown >= sections.length) return;
    const t = setTimeout(() => setShown(n => n + 1), shown === 0 ? 60 : 160);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, shown]);

  const productCard = (p, i = 0) => {
    const isOut = p.stock <= 0; const slug = getProductSlug(p);
    return (
      <a key={p.id} href={`/product/${slug}`} className="carousel-card reveal" style={{ width: '100%', animationDelay: `${(i % 12) * 60}ms` }}>
        <div className="card-img" style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden' }}>
          <FadeImage src={p.img} alt={p.title} />
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
    const minValue = parseFloat((document.getElementById('filter-min-price') as HTMLInputElement | null)?.value);
    const maxValue = parseFloat((document.getElementById('filter-max-price') as HTMLInputElement | null)?.value);
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

  const filteredProducts = getFilteredProducts();
  const displayedProducts = filteredProducts.slice(0, productsDisplayLimit);
  const totalProducts = filteredProducts.length;
  const hasMore = totalProducts > productsDisplayLimit;

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

      <style>{CSS}</style>

      {/* ==================== HOME PAGE ==================== */}
      <section id="home" className="page-section active-page" style={{ display: activePage === 'home' ? 'block' : 'none' }}>
        {sections.map((s, i) =>
          !loading && i < shown
            ? <div key={i} className="reveal">{s.el}</div>
            : <div key={i}>{s.sk}</div>
        )}
      </section>

      {/* ==================== PRODUCTS PAGE ==================== */}
      <section id="products" className="py-6 sm:py-8 lg:py-12" style={{ display: activePage === 'products' ? 'block' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            <aside className="lg:w-64 shrink-0">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
                <h3 className="font-semibold text-sm uppercase mb-4">Categories</h3>
                <div id="sidebar-categories" className="space-y-1" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {loading ? (
                    [1, 2, 3, 4, 5, 6, 7].map(i => <Sk key={i} h={32} r={8} style={{ marginBottom: 6 }} />)
                  ) : (
                    <>
                      <button onClick={() => filterByCategory('all')} className={`block w-full text-left py-2 px-3 rounded-lg text-xs font-semibold ${currentFilters.cat==='all'?'bg-primary text-white':'hover:bg-gray-50'}`}>All</button>
                      {currentData.categories.map(c => (
                        <button key={c.id||c.name} onClick={() => filterByCategory(c.name)} className={`block w-full text-left py-2 px-3 rounded-lg text-xs font-semibold ${currentFilters.cat===c.name?'bg-primary text-white':'hover:bg-gray-50'}`}>{c.name}</button>
                      ))}
                    </>
                  )}
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
                {loading
                  ? <Sk w={180} h={14} />
                  : <p className="text-xs font-medium text-accent">Showing {displayedProducts.length} of {totalProducts} products</p>}
                <select onChange={(e) => handleSorting(e.target.value)} disabled={loading} className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-semibold">
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {loading
                  ? [1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)
                  : displayedProducts.length > 0
                    ? displayedProducts.map((p, i) => productCard(p, i))
                    : <div className="col-span-full text-center py-20"><p className="text-accent text-lg">No products found</p></div>}
              </div>
              {!loading && hasMore && <div className="text-center mt-8"><button onClick={loadMoreProducts} className="px-8 py-3 bg-primary text-white rounded-full font-semibold uppercase text-xs">Load More ({totalProducts - productsDisplayLimit} remaining)</button></div>}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PRODUCT DETAILS ==================== */}
      <section id="product-details" className="page-section" style={{ display: activePage === 'product-details' ? 'block' : 'none' }}></section>

      {/* ==================== WISHLIST ==================== */}
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

      {/* ==================== NEWS / JOURNAL ==================== */}
      <section id="news" className="py-6 sm:py-8 lg:py-12" style={{ display: activePage === 'news' ? 'block' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-bold text-center mb-8">The Journal</h2>
          <div id="news-grid" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {loading
              ? [1, 2, 3].map(i => <NewsSkeleton key={i} />)
              : currentData.news.length > 0 ? currentData.news.map((n, i) => (
              <article key={n.id||n.title} className="reveal bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition" style={{ animationDelay: `${i * 80}ms` }}>
                <div style={{ position: 'relative', height: 192, overflow: 'hidden' }}>
                  <FadeImage src={n.img} alt={n.title} />
                </div>
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
