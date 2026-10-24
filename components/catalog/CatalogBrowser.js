import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useCurrency } from '../currency/CurrencyProvider';

const slugify = (value = '') => String(value).toLowerCase().replace(/^category\//, '').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
const cleanMedia = (value) => typeof value === 'string' && value.trim() ? value.trim() : '';
const productSlug = (product) => slugify(product.slug || product.title || 'product');
const productImages = (product) => {
  const source = [product.img, ...(String(product.images || '').split(',') || [])]
    .map(cleanMedia).filter(Boolean);
  return [...new Set(source)];
};

// ============================================
// PRODUCT CARD — Matches order-confirmation summary style
// ============================================
function ProductCard({ product, index = 0 }) {
  const [imageIndex, setImageIndex] = useState(0);
  const { formatMoney } = useCurrency();
  const images = productImages(product);
  const soldOut = product.is_out_of_stock === true || Number(product.stock) === 0;
  const hasSale = product.old_price && Number(product.old_price) > Number(product.price || 0);
  const slug = productSlug(product);

  return (
    <article 
      className="product-card animate-fade-up" 
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <Link href={`/product/${encodeURIComponent(slug)}`} className="product-link">
        <div className="product-media">
          {images.length ? (
            <img 
              src={images[imageIndex]} 
              alt={product.title || 'JABIYEN product'} 
              loading="lazy" 
            />
          ) : (
            <div className="media-empty">JABIYEN</div>
          )}
          {soldOut && <span className="badge sold">Sold out</span>}
          {!soldOut && product.is_new_arrival && <span className="badge">New</span>}
          {images.length > 1 && (
            <div className="dots" aria-label="Product images">
              {images.map((image, i) => (
                <button 
                  key={image} 
                  type="button" 
                  aria-label={`Show image ${i + 1}`} 
                  className={i === imageIndex ? 'active' : ''} 
                  onClick={(event) => { 
                    event.preventDefault(); 
                    event.stopPropagation(); 
                    setImageIndex(i); 
                  }} 
                />
              ))}
            </div>
          )}
        </div>
        <div className="product-copy">
          <span className="product-category">{product.subcategory || product.category || 'Collection'}</span>
          <h3>{product.title || 'Untitled product'}</h3>
          <div className="product-price">
            <strong>{formatMoney(product.price || 0)}</strong>
            {hasSale && <del>{formatMoney(product.old_price)}</del>}
          </div>
        </div>
      </Link>
    </article>
  );
}

// ============================================
// BANNER — Full-width, no text overlay (like checkout)
// ============================================
function MediaBanner({ entity }) {
  const video = cleanMedia(entity?.video_url);
  const image = cleanMedia(entity?.image_url);
  
  return (
    <div className="banner-wrapper">
      {video ? (
        <video src={video} poster={image || undefined} autoPlay muted loop playsInline />
      ) : image ? (
        <img src={image} alt={entity?.name || 'Collection'} />
      ) : (
        <div className="banner-fallback">
          <span>JABIYEN</span>
        </div>
      )}
    </div>
  );
}

function LoadingState() { 
  return (
    <section className="form-block animate-fade-up">
      <div className="skeleton-profile">
        <div className="skeleton-avatar shimmer" />
        <div className="skeleton-lines">
          <div className="skeleton-line shimmer" style={{ width: '60%' }} />
          <div className="skeleton-line shimmer" style={{ width: '80%' }} />
        </div>
      </div>
    </section>
  );
}

function ErrorState({ message }) { 
  return (
    <section className="form-block animate-fade-up">
      <div className="minimal-box">
        <p>{message || 'This collection could not be loaded right now.'}</p>
        <Link href="/" className="btn-outline">Return to Home</Link>
      </div>
    </section>
  );
}

export default function CatalogBrowser({ mode = 'category', slug, categorySlug = '' }) {
  const [state, setState] = useState({ 
    loading: true, 
    entity: null, 
    parent: null, 
    subcategories: [], 
    products: [], 
    error: '' 
  });
  const [sort, setSort] = useState('newest');
  const isSubcategory = mode === 'subcategory';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const entityUrl = isSubcategory 
          ? `/api/subcategories/${encodeURIComponent(slug)}` 
          : `/api/categories/${encodeURIComponent(slug)}`;
        const productsUrl = isSubcategory 
          ? `/api/subcategories/${encodeURIComponent(slug)}/products` 
          : `/api/categories/${encodeURIComponent(slug)}/products`;

        const read = async (responsePromise) => { 
          const response = await responsePromise; 
          const payload = await response.json().catch(() => null); 
          if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status})`); 
          return payload; 
        };

        const entity = await read(fetch(entityUrl));
        const products = await read(fetch(productsUrl));

        let parent = null;
        let subcategories = [];

        if (isSubcategory) {
          // Fetch parent category + sibling subcategories
          const parentSlugValue = entity.category_slug || entity.categories?.slug || entity.category?.slug || '';

          if (parentSlugValue) {
            try {
              parent = await read(fetch(`/api/categories/${encodeURIComponent(parentSlugValue)}`));
            } catch (err) {
              console.warn('[CatalogBrowser] Failed to load parent category:', err);
            }

            try {
              const siblings = await read(fetch(`/api/subcategories?category_slug=${encodeURIComponent(parentSlugValue)}`));
              subcategories = Array.isArray(siblings) ? siblings : [];
            } catch (err) {
              console.warn('[CatalogBrowser] Failed to load sibling subcategories:', err);
            }
          }
        } else {
          // Category mode — fetch its subcategories
          parent = entity;
          try {
            const subs = await read(fetch(`/api/subcategories?category_slug=${encodeURIComponent(slug)}`));
            subcategories = Array.isArray(subs) ? subs : [];
          } catch (err) {
            console.warn('[CatalogBrowser] Failed to load subcategories:', err);
          }
        }

        if (cancelled) return;

        setState({
          loading: false,
          entity,
          parent,
          subcategories,
          products: Array.isArray(products) ? products : [],
          error: '',
        });
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            entity: null,
            parent: null,
            subcategories: [],
            products: [],
            error: error.message || 'Unable to load this collection.',
          });
        }
      }
    }

    if (slug) load();

    return () => { cancelled = true; };
  }, [isSubcategory, slug]);

  const visibleProducts = useMemo(() => {
    return [...state.products].sort((a, b) => 
      sort === 'price-low' ? Number(a.price || 0) - Number(b.price || 0) 
      : sort === 'price-high' ? Number(b.price || 0) - Number(a.price || 0) 
      : new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
  }, [sort, state.products]);

  const entity = state.entity;
  const parentSlug = isSubcategory 
    ? slugify(categorySlug || entity?.category_slug || state.parent?.slug || '') 
    : slugify(entity?.slug || slug);
  const currentSubSlug = isSubcategory ? slugify(entity?.slug || slug) : '';
  const title = `${entity?.name || 'Collection'} | JABIYEN`;

  // ============ Loading state ============
  if (state.loading) {
    return (
      <>
        <Head><title>Loading collection | JABIYEN</title></Head>
        <div className="catalog-page">
          <div className="checkout-shell">
            <h1 className="page-title animate-fade-up">Loading</h1>
            <LoadingState />
          </div>
        </div>
      </>
    );
  }

  // ============ Error state ============
  if (state.error || !state.entity) {
    return (
      <>
        <Head><title>Collection unavailable | JABIYEN</title></Head>
        <div className="catalog-page">
          <div className="checkout-shell">
            <h1 className="page-title animate-fade-up">Unavailable</h1>
            <ErrorState message={state.error} />
          </div>
        </div>
      </>
    );
  }

  // ============ Ready state ============
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={entity.meta_description || `Explore ${entity.name || 'JABIYEN collection'} products.`} />
        <link rel="canonical" href={`https://jabiyen-website.vercel.app/${isSubcategory ? `category/${parentSlug}/${currentSubSlug}` : `category/${slug}`}`} />
      </Head>

      <div className="catalog-page">
        
        {/* Full-width banner — no text, no gap from header */}
        <MediaBanner entity={entity} />

        <div className="checkout-shell">
          
          {/* Only category/subcategory name */}
          <h1 className="page-title animate-fade-up">{entity.name || 'Collection'}</h1>

          {/* Subcategory tabs — shown on BOTH category and subcategory pages */}
          {state.subcategories.length > 0 && (
            <nav className="subcategories animate-fade-up" aria-label="Subcategories">
              {/* All Products tab */}
              {isSubcategory ? (
                <Link 
                  href={`/category/${parentSlug}`} 
                  className="tab-link"
                >
                  All Products
                </Link>
              ) : (
                <span className="tab-link active" aria-current="page">
                  All Products
                </span>
              )}

              {/* Sibling subcategory tabs */}
              {state.subcategories.map((subcategory) => {
                const subSlug = slugify(subcategory.slug || subcategory.name);
                const isActive = isSubcategory && subSlug === currentSubSlug;

                return (
                  <Link 
                    key={subcategory.id} 
                    href={`/category/${parentSlug}/${subSlug}`}
                    className={`tab-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {subcategory.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Products Section */}
          <section className="products-section">
            
            <div className="section-head animate-fade-up">
              <h2 className="section-heading">
                {isSubcategory ? `Pieces` : `Products`}
                <span className="item-count-label">({visibleProducts.length})</span>
              </h2>
              
              <div className="controls">
                <select 
                  value={sort} 
                  onChange={(event) => setSort(event.target.value)} 
                  aria-label="Sort products"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </div>
            </div>

            {visibleProducts.length ? (
              <div className="products-grid">
                {visibleProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            ) : (
              <div className="minimal-box animate-fade-up">
                <p>No products in this collection yet. New JABIYEN pieces will appear here as soon as they are published.</p>
                <Link href="/" className="btn-outline">Return to Home</Link>
              </div>
            )}
          </section>

        </div>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #ffffff;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          color: #000;
        }
      `}</style>

      <style jsx>{`
        /* ============================================
           ANIMATIONS
           ============================================ */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }

        /* ============================================
           BASE LAYOUT — Matches checkout
           ============================================ */
        .catalog-page { min-height: 100vh; background: #ffffff; padding-top: 80px; }

        .checkout-shell { 
          width: 100%; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 0 20px 60px; 
        }

        .page-title { 
          font-size: 28px; 
          font-weight: 300; 
          margin: 32px 0 32px 0; 
          letter-spacing: 2px; 
          text-transform: uppercase; 
          text-align: center;
          color: #000;
        }

        .section-heading { 
          font-size: 11px; 
          font-weight: 600; 
          text-transform: uppercase; 
          letter-spacing: 1.5px; 
          margin: 0; 
          color: #000; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
        }

        .item-count-label { 
          color: #999; 
          font-weight: 400; 
          letter-spacing: 0; 
          text-transform: none; 
          font-size: 11px; 
        }

        /* ============================================
           BANNER — Full-width, no text overlay
           ============================================ */
        .banner-wrapper { 
          width: 100%; 
          height: 140px; 
          overflow: hidden; 
          background: #f5f5f5;
          position: relative;
        }
        .banner-wrapper img,
        .banner-wrapper video { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          display: block;
          animation: fadeIn 1s ease both;
        }
        .banner-fallback {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a1a, #333);
          color: #fff;
          animation: fadeIn 1s ease both;
        }
        .banner-fallback span {
          font-size: 20px;
          font-weight: 300;
          letter-spacing: 8px;
        }

        /* ============================================
           SUBCATEGORY TABS — Nicely arranged, working on both pages
           ============================================ */
        .subcategories { 
          display: flex; 
          gap: 0; 
          overflow-x: auto; 
          margin: 0 0 28px 0; 
          border-bottom: 1px solid #e5e5e5;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 1px;
        }
        .subcategories::-webkit-scrollbar { display: none; }
        
        .tab-link { 
          white-space: nowrap; 
          border: none; 
          background: transparent; 
          color: #888; 
          padding: 12px 14px; 
          text-decoration: none; 
          font-size: 11px; 
          font-weight: 500; 
          letter-spacing: 1px; 
          text-transform: uppercase;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color 0.2s, border-color 0.2s;
          display: inline-block;
        }
        .tab-link:hover { 
          color: #000; 
        }
        .tab-link.active { 
          color: #000; 
          border-bottom-color: #000;
          font-weight: 600;
        }
        .tab-link.active:not(a) {
          cursor: default;
        }

        /* ============================================
           PRODUCTS SECTION
           ============================================ */
        .products-section { 
          padding-top: 8px;
        }

        .section-head { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          gap: 16px; 
          margin-bottom: 24px; 
        }

        .controls { 
          display: flex; 
          gap: 12px; 
          flex-wrap: wrap;
        }
        .controls select { 
          border: none; 
          border-bottom: 1px solid #000; 
          background: transparent; 
          padding: 8px 0; 
          font-size: 11px; 
          color: #000; 
          outline: none;
          font-family: inherit;
          border-radius: 0;
          appearance: none;
          cursor: pointer;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: border-color 0.2s;
          min-width: 110px;
        }
        .controls select:focus { 
          border-bottom-color: #555; 
        }

        /* ============================================
           PRODUCT GRID
           ============================================ */
        .products-grid { 
          display: grid; 
          grid-template-columns: repeat(2, minmax(0, 1fr)); 
          gap: 16px; 
        }

        .product-card { 
          background: #fafafa;
          border: 1px solid #f0f0f0;
          overflow: hidden;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }
        .product-card:hover {
          transform: translateY(-2px);
          border-color: #d0d0d0;
        }

        .product-link { 
          display: block; 
          text-decoration: none; 
          color: inherit; 
        }

        .product-media { 
          position: relative; 
          aspect-ratio: 4/5; 
          background: #ffffff; 
          overflow: hidden; 
        }
        .product-media img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          display: block;
          transition: transform 0.5s ease;
        }
        .product-card:hover .product-media img { 
          transform: scale(1.035); 
        }
        
        .media-empty { 
          height: 100%; 
          display: grid; 
          place-items: center; 
          color: #ccc; 
          font-size: 11px; 
          font-weight: 600;
          letter-spacing: 2px;
        }

        .badge { 
          position: absolute; 
          top: 8px; 
          left: 8px; 
          background: #000; 
          color: #fff;
          padding: 5px 8px; 
          font-size: 9px; 
          font-weight: 600;
          text-transform: uppercase; 
          letter-spacing: 1px;
        }
        .badge.sold { background: #000; }

        .dots { 
          position: absolute; 
          bottom: 10px; 
          left: 0; 
          right: 0; 
          display: flex; 
          justify-content: center; 
          gap: 5px;
        }
        .dots button { 
          width: 6px; 
          height: 6px; 
          padding: 0; 
          border: 0; 
          border-radius: 50%; 
          background: rgba(255,255,255,.5); 
          cursor: pointer;
        }
        .dots button.active { background: #fff; }

        .product-copy { padding: 12px; }
        .product-category { 
          display: block; 
          color: #999; 
          font-size: 9px; 
          font-weight: 600; 
          text-transform: uppercase; 
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .product-copy h3 { 
          margin: 0 0 8px; 
          font-size: 12px; 
          font-weight: 500; 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-price { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          font-size: 12px;
        }
        .product-price strong { font-weight: 600; color: #000; }
        .product-price del { color: #aaa; font-size: 11px; }

        /* ============================================
           SKELETON LOADER
           ============================================ */
        .skeleton-profile { display: flex; align-items: center; gap: 12px; }
        .skeleton-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
        .skeleton-lines { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .skeleton-line { height: 12px; border-radius: 4px; }
        .shimmer { 
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); 
          background-size: 200% 100%; 
          animation: shimmer 1.4s infinite linear; 
        }

        /* ============================================
           STATES
           ============================================ */
        .minimal-box { 
          padding: 24px; 
          background: #fafafa; 
          text-align: center; 
        }
        .minimal-box p { 
          margin: 0 0 16px; 
          font-size: 13px; 
          color: #555; 
          line-height: 1.6; 
        }

        .btn-outline { 
          display: inline-flex; 
          align-items: center; 
          justify-content: center; 
          height: 44px; 
          padding: 0 20px; 
          background: transparent; 
          color: #000; 
          border: 1px solid #000; 
          border-radius: 0; 
          font-size: 10px; 
          font-weight: 500; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
          text-decoration: none; 
          transition: all 0.2s; 
        }
        .btn-outline:hover { background: #000; color: #fff; }

        /* ============================================
           DESKTOP
           ============================================ */
        @media (min-width: 768px) {
          .catalog-page { padding-top: 120px; }
          .checkout-shell { max-width: 800px; padding: 0 40px 80px; }
          .page-title { font-size: 42px; margin: 40px 0 40px 0; }
          .section-heading { font-size: 13px; }
          .item-count-label { font-size: 13px; }
          
          .banner-wrapper { height: 320px; }
          .banner-fallback span { font-size: 32px; letter-spacing: 12px; }
          
          .subcategories { margin-bottom: 36px; }
          .tab-link { 
            padding: 14px 18px; 
            font-size: 12px; 
          }
          
          .section-head { margin-bottom: 32px; }
          
          .controls select { font-size: 12px; padding: 10px 0; }
          
          .products-grid { 
            grid-template-columns: repeat(3, minmax(0, 1fr)); 
            gap: 20px; 
          }
          
          .product-copy { padding: 14px; }
          .product-copy h3 { font-size: 13px; }
          .product-price { font-size: 13px; }
          .product-price del { font-size: 12px; }
          .badge { padding: 6px 10px; font-size: 10px; }
          .product-category { font-size: 10px; }
          
          .skeleton-avatar { width: 56px; height: 56px; }
          .minimal-box { padding: 32px; }
          .minimal-box p { font-size: 14px; }
        }

        @media (min-width: 1024px) {
          .products-grid { 
            grid-template-columns: repeat(4, minmax(0, 1fr)); 
            gap: 20px; 
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up, .shimmer, .banner-wrapper img, .banner-wrapper video, .banner-fallback { animation: none !important; }
          .product-media img, 
          .product-card, 
          .btn-outline,
          .tab-link,
          .controls select {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
