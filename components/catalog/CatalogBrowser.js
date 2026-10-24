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
// PRODUCT CARD — Clear price hierarchy
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
      style={{ animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}
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
          {soldOut && <span className="badge">Sold out</span>}
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
          <h3 className="product-title">{product.title || 'Untitled product'}</h3>
          <div className="product-price-row">
            <span className="price-current">{formatMoney(product.price || 0)}</span>
            {hasSale && (
              <span className="price-old">{formatMoney(product.old_price)}</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

// ============================================
// BANNER
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

// ============================================
// LOADING SKELETON
// ============================================
function LoadingSkeleton() {
  return (
    <>
      <div className="banner-skeleton shimmer" />
      <div className="checkout-shell">
        <div className="title-skeleton shimmer" />
        <div className="tabs-skeleton">
          <div className="tab-skeleton shimmer" />
          <div className="tab-skeleton shimmer" />
          <div className="tab-skeleton shimmer" />
        </div>
        <div className="products-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="product-skeleton">
              <div className="product-media-skeleton shimmer" />
              <div className="product-copy-skeleton">
                <div className="line-skeleton shimmer" style={{ width: '80%' }} />
                <div className="line-skeleton shimmer" style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ============================================
// ERROR STATE
// ============================================
function ErrorState({ message }) {
  return (
    <div className="checkout-shell">
      <div className="minimal-box animate-fade-up">
        <p>{message || 'This collection could not be loaded right now.'}</p>
        <Link href="/" className="btn-outline">Return to Home</Link>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function CatalogBrowser({ mode = 'category', slug, categorySlug = '' }) {
  const [state, setState] = useState({
    loading: true,
    entity: null,
    parent: null,
    subcategories: [],
    products: [],
    error: '',
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

        const parentSlugValue = isSubcategory
          ? (entity.category_slug || entity.categories?.slug || entity.category?.slug || categorySlug || '')
          : slug;

        let parent = null;
        if (isSubcategory && parentSlugValue) {
          try {
            parent = await read(fetch(`/api/categories/${encodeURIComponent(parentSlugValue)}`));
          } catch (err) {
            console.warn('[CatalogBrowser] Parent category fetch failed:', err);
          }
        } else if (!isSubcategory) {
          parent = entity;
        }

        let subcategories = [];
        if (parentSlugValue) {
          try {
            const subs = await read(fetch(`/api/subcategories?category_slug=${encodeURIComponent(parentSlugValue)}`));
            subcategories = Array.isArray(subs) ? subs : [];
          } catch (err) {
            console.warn('[CatalogBrowser] Subcategories fetch failed:', err);
          }
        }

        if (isSubcategory && subcategories.length === 0 && entity?.id) {
          subcategories = [entity];
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
  }, [isSubcategory, slug, categorySlug]);

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

  if (state.loading) {
    return (
      <>
        <Head><title>JABIYEN</title></Head>
        <div className="catalog-page">
          <LoadingSkeleton />
        </div>
      </>
    );
  }

  if (state.error || !state.entity) {
    return (
      <>
        <Head><title>Collection unavailable | JABIYEN</title></Head>
        <div className="catalog-page">
          <ErrorState message={state.error} />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={entity.meta_description || `Explore ${entity.name || 'JABIYEN collection'} products.`} />
        <link rel="canonical" href={`https://jabiyen-website.vercel.app/${isSubcategory ? `category/${parentSlug}/${currentSubSlug}` : `category/${slug}`}`} />
      </Head>

      <div className="catalog-page">
        <MediaBanner entity={entity} />

        <div className="checkout-shell">
          <h1 className="page-title animate-fade-up">{entity.name || 'Collection'}</h1>

          {state.subcategories.length > 0 && (
            <nav className="subcategories animate-fade-up" aria-label="Subcategories">
              {isSubcategory ? (
                <Link href={`/category/${parentSlug}`} className="tab-link">
                  All
                </Link>
              ) : (
                <span className="tab-link active" aria-current="page">
                  All
                </span>
              )}

              {state.subcategories.map((subcategory) => {
                const subSlug = slugify(subcategory.slug || subcategory.name);
                const isActive = isSubcategory && subSlug === currentSubSlug;

                return (
                  <Link
                    key={subcategory.id || subSlug}
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

          <section className="products-section">
            <div className="section-head animate-fade-up">
              <h2 className="section-heading">
                {isSubcategory ? 'Pieces' : 'Products'}
                <span className="item-count-label">({visibleProducts.length})</span>
              </h2>

              <select
                className="sort-select"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort products"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
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
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }

        /* Base Layout */
        .catalog-page { min-height: 100vh; background: #ffffff; padding-top: 0; }
        .checkout-shell { width: 100%; max-width: 600px; margin: 0 auto; padding: 0 20px 60px; }

        .page-title {
          font-size: 28px;
          font-weight: 300;
          margin: 32px 0 24px 0;
          letter-spacing: 2px;
          text-transform: uppercase;
          text-align: center;
          color: #000;
        }

        /* Banner */
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

        /* Loading skeleton */
        .banner-skeleton { width: 100%; height: 140px; }
        .title-skeleton { width: 200px; height: 32px; margin: 32px auto 24px; }
        .tabs-skeleton {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
        }
        .tab-skeleton { width: 80px; height: 32px; }
        .product-skeleton { background: #fafafa; border: 1px solid #f0f0f0; }
        .product-media-skeleton { width: 100%; aspect-ratio: 4/5; }
        .product-copy-skeleton { padding: 16px 0; display: flex; flex-direction: column; gap: 10px; }
        .line-skeleton { height: 12px; }
        .shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite linear;
        }

        /* Subcategory tabs */
        .subcategories {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          margin: 0 0 24px 0;
          padding: 2px 0;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .subcategories::-webkit-scrollbar { display: none; }

        .tab-link {
          white-space: nowrap;
          border: 1px solid #e8e8e8;
          background: #ffffff;
          color: #6b6b6b;
          padding: 9px 14px;
          text-decoration: none;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 0;
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          line-height: 1;
        }
        .tab-link:hover {
          color: #000;
          border-color: #000;
        }
        .tab-link.active {
          background: #000;
          color: #ffffff;
          border-color: #000;
          font-weight: 600;
        }
        .tab-link.active:not(a) { cursor: default; }

        /* Products section */
        .products-section { padding-top: 4px; }

        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
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

        .sort-select {
          border: none;
          border-bottom: 1px solid #000;
          background: transparent;
          padding: 6px 20px 6px 0;
          font-size: 11px;
          color: #000;
          outline: none;
          font-family: inherit;
          border-radius: 0;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: border-color 0.2s;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0 center;
        }
        .sort-select:focus { border-bottom-color: #555; }

        /* Product Grid */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px 14px;
        }

        .product-card {
          background: #ffffff;
          border: none;
          overflow: hidden;
        }

        .product-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }

        .product-media {
          position: relative;
          aspect-ratio: 4/5;
          background: #f7f7f7;
          overflow: hidden;
        }
        .product-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .product-card:hover .product-media img {
          transform: scale(1.04);
        }

        .media-empty {
          height: 100%;
          display: grid;
          place-items: center;
          color: #ccc;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 3px;
          background: #f7f7f7;
        }

        .badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #ffffff;
          color: #000;
          padding: 5px 9px;
          font-size: 8px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          border: 1px solid #000;
        }

        .dots {
          position: absolute;
          bottom: 12px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 5px;
        }
        .dots button {
          width: 5px;
          height: 5px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: rgba(0,0,0,.25);
          cursor: pointer;
        }
        .dots button.active { 
          background: #000;
          width: 14px;
          border-radius: 3px;
        }

        /* ============================================
           PRODUCT COPY — Clear title + price hierarchy
           ============================================ */
        .product-copy {
          padding: 14px 2px 4px 2px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Title — full width, one line, elegant */
        .product-title {
          margin: 0;
          font-size: 11px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 1px;
          line-height: 1.4;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }

        /* Price row — current + old, same line, no wrap */
        .product-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: nowrap;
          white-space: nowrap;
          min-width: 0;
        }

        /* Current price — BIG, bold, black — unmistakably the main price */
        .price-current {
          font-size: 14px;
          font-weight: 600;
          color: #000;
          line-height: 1;
          letter-spacing: 0;
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }

        /* Old price — SMALL, muted, strikethrough through the middle */
        .price-old {
          font-size: 11px;
          font-weight: 400;
          color: #a0a0a0;
          line-height: 1;
          letter-spacing: 0;
          font-variant-numeric: tabular-nums;
          text-decoration: line-through;
          text-decoration-thickness: 1px;
          text-decoration-color: #a0a0a0;
          flex-shrink: 0;
        }

        /* States */
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

        /* Desktop */
        @media (min-width: 768px) {
          .catalog-page { padding-top: 0; }
          
          .checkout-shell { max-width: 800px; padding: 0 40px 80px; }
          .page-title { font-size: 42px; margin: 40px 0 32px 0; }
          .section-heading { font-size: 13px; }
          .item-count-label { font-size: 13px; }

          .banner-wrapper { height: 320px; }
          .banner-skeleton { height: 320px; }
          .banner-fallback span { font-size: 32px; letter-spacing: 12px; }

          .title-skeleton { width: 300px; height: 48px; margin: 40px auto 32px; }

          .subcategories { 
            gap: 10px;
            margin-bottom: 32px; 
          }
          .tab-link { 
            padding: 10px 18px; 
            font-size: 11px; 
            letter-spacing: 1.3px;
          }

          .section-head { margin-bottom: 28px; }
          .sort-select { font-size: 12px; padding: 8px 24px 8px 0; }

          .products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 40px 22px;
          }

          .product-copy { 
            padding: 18px 2px 4px 2px; 
            gap: 12px; 
          }
          .product-title { 
            font-size: 13px; 
            letter-spacing: 1.2px;
          }
          .product-price-row { gap: 10px; }
          .price-current { 
            font-size: 16px; 
            font-weight: 600;
          }
          .price-old { 
            font-size: 12px; 
          }
          .badge { 
            top: 12px;
            left: 12px;
            padding: 6px 10px; 
            font-size: 9px; 
          }

          .minimal-box { padding: 32px; }
          .minimal-box p { font-size: 14px; }
        }

        @media (min-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 44px 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up, .shimmer, .banner-wrapper img, .banner-wrapper video, .banner-fallback { animation: none !important; }
          .product-media img, .product-card, .btn-outline, .tab-link, .sort-select { transition: none !important; }
        }
      `}</style>
    </>
  );
}
