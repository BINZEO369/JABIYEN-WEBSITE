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
// HERO — Matches checkout banner style
// ============================================
function MediaHero({ entity, eyebrow }) {
  const video = cleanMedia(entity?.video_url);
  const image = cleanMedia(entity?.image_url);
  return (
    <section className="hero animate-fade-up">
      <div className="hero-media">
        {video ? (
          <video src={video} poster={image || undefined} autoPlay muted loop playsInline />
        ) : image ? (
          <img src={image} alt={entity?.name || eyebrow} />
        ) : (
          <div className="hero-fallback">
            <span>JABIYEN</span>
            <small>{entity?.name || eyebrow}</small>
          </div>
        )}
        <div className="hero-shade" />
      </div>
      <div className="hero-content">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{entity?.name || 'Collection'}</h1>
        <p>{entity?.meta_description || entity?.keywords || `Explore the ${entity?.name || 'JABIYEN'} collection, selected for everyday expression and modern wardrobe essentials.`}</p>
        {(entity?.image_cta_title || entity?.video_cta_title) && (
          <a className="hero-cta" href={entity.image_cta_link || entity.video_cta_link || '#'}>
            {entity.image_cta_title || entity.video_cta_title}
          </a>
        )}
      </div>
    </section>
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
  const { selectedCurrency } = useCurrency();
  const [state, setState] = useState({ loading: true, entity: null, parent: null, subcategories: [], products: [], error: '' });
  const [sort, setSort] = useState('newest');
  const [query, setQuery] = useState('');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const isSubcategory = mode === 'subcategory';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState((current) => ({ ...current, loading: true, error: '' }));
      try {
        const entityUrl = isSubcategory ? `/api/subcategories/${encodeURIComponent(slug)}` : `/api/categories/${encodeURIComponent(slug)}`;
        const productsUrl = isSubcategory ? `/api/subcategories/${encodeURIComponent(slug)}/products` : `/api/categories/${encodeURIComponent(slug)}/products`;
        const read = async (responsePromise) => { 
          const response = await responsePromise; 
          const payload = await response.json().catch(() => null); 
          if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status})`); 
          return payload; 
        };
        const entity = await read(fetch(entityUrl));
        const products = await read(fetch(productsUrl));
        const related = isSubcategory
          ? await read(fetch(`/api/categories/${encodeURIComponent(entity.category_slug || entity.categories?.slug || '')}`))
          : await read(fetch(`/api/subcategories?category_slug=${encodeURIComponent(slug)}`));
        if (cancelled) return;
        setState({ loading: false, entity, parent: isSubcategory ? related : entity, subcategories: isSubcategory ? [] : (Array.isArray(related) ? related : []), products: Array.isArray(products) ? products : [], error: '' });
      } catch (error) { 
        if (!cancelled) setState({ loading: false, entity: null, parent: null, subcategories: [], products: [], error: error.message || 'Unable to load this collection.' }); 
      }
    }
    if (slug) load();
    return () => { cancelled = true; };
  }, [isSubcategory, slug]);

  const visibleProducts = useMemo(() => {
    let products = state.products.filter((product) => !query || `${product.title} ${product.short_description || ''} ${product.tags || ''}`.toLowerCase().includes(query.toLowerCase()));
    if (activeSubcategory !== 'all') products = products.filter((product) => slugify(product.subcategory_slug || product.subcategory || '') === activeSubcategory);
    return [...products].sort((a, b) => 
      sort === 'price-low' ? Number(a.price || 0) - Number(b.price || 0) 
      : sort === 'price-high' ? Number(b.price || 0) - Number(a.price || 0) 
      : new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
  }, [activeSubcategory, query, sort, state.products]);

  const entity = state.entity;
  const parentSlug = isSubcategory ? slugify(categorySlug || entity?.category_slug || state.parent?.slug || '') : slugify(entity?.slug || slug);
  const title = `${entity?.name || 'Collection'} | JABIYEN`;

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

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={entity.meta_description || `Explore ${entity.name || 'JABIYEN collection'} products.`} />
        <link rel="canonical" href={`https://jabiyen-website.vercel.app/${isSubcategory ? `category/${parentSlug}/${slug}` : `category/${slug}`}`} />
      </Head>

      <div className="catalog-page">
        
        {/* Full-width edge-to-edge banner (hero) */}
        <MediaHero entity={entity} eyebrow={isSubcategory ? 'Subcategory Collection' : 'Category Collection'} />

        <div className="checkout-shell">
          
          {/* Breadcrumb — minimal */}
          <nav className="breadcrumb animate-fade-up" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            {isSubcategory && (
              <>
                <Link href={`/category/${parentSlug}`}>{state.parent?.name || 'Category'}</Link>
                <span>/</span>
              </>
            )}
            <strong>{entity.name}</strong>
          </nav>

          {/* Page Title */}
          <h1 className="page-title animate-fade-up">{entity.name || 'Collection'}</h1>

          {/* Subcategory tabs (only for category mode) */}
          {!isSubcategory && state.subcategories.length > 0 && (
            <nav className="subcategories animate-fade-up" aria-label="Subcategories">
              <button 
                className={activeSubcategory === 'all' ? 'active' : ''} 
                onClick={() => setActiveSubcategory('all')}
              >
                All Products
              </button>
              {state.subcategories.map((subcategory) => (
                <Link 
                  key={subcategory.id} 
                  href={`/category/${parentSlug}/${slugify(subcategory.slug || subcategory.name)}`} 
                >
                  {subcategory.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Products Section */}
          <section className="products-section">
            
            {/* Section head — search + sort */}
            <div className="section-head animate-fade-up">
              <h2 className="section-heading">
                {isSubcategory ? `${entity.name} Pieces` : `${entity.name} Collection`}
                <span className="item-count-label">({visibleProducts.length})</span>
              </h2>
              
              <div className="controls">
                <input 
                  type="search" 
                  value={query} 
                  onChange={(event) => setQuery(event.target.value)} 
                  placeholder="Search this collection" 
                  aria-label="Search this collection" 
                />
                <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
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
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }

        /* ============================================
           BASE LAYOUT
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
          margin: 32px 0 40px 0; 
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
          margin: 0 0 16px 0; 
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
           BREADCRUMB
           ============================================ */
        .breadcrumb { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          font-size: 11px; 
          color: #888; 
          margin-bottom: 8px;
          padding-top: 20px;
        }
        .breadcrumb a { 
          color: #000; 
          text-decoration: none; 
          font-weight: 500;
        }
        .breadcrumb a:hover { opacity: 0.6; }
        .breadcrumb strong { 
          font-weight: 600; 
          color: #000;
        }

        /* ============================================
           HERO — Full width edge-to-edge banner
           ============================================ */
        .hero { 
          width: 100%; 
          min-height: 320px; 
          position: relative; 
          overflow: hidden; 
          background: #f5f5f5;
        }
        .hero-media, 
        .hero-media img, 
        .hero-media video { 
          position: absolute; 
          inset: 0; 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
        }
        .hero-shade { 
          position: absolute; 
          inset: 0; 
          background: linear-gradient(90deg, rgba(0,0,0,.65), rgba(0,0,0,.1) 75%); 
        }
        .hero-fallback { 
          height: 100%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          flex-direction: column; 
          color: #fff; 
          background: linear-gradient(135deg, #1a1a1a, #333); 
        }
        .hero-fallback span { 
          font: 700 clamp(40px, 8vw, 90px) inherit; 
          letter-spacing: 0.18em; 
        }
        .hero-fallback small { 
          font-size: 11px; 
          letter-spacing: 2px; 
          text-transform: uppercase; 
          margin-top: 8px;
          opacity: 0.7;
        }
        .hero-content { 
          position: relative; 
          z-index: 1; 
          max-width: 600px; 
          padding: clamp(60px, 10vw, 100px) clamp(24px, 6vw, 60px); 
          color: #fff; 
        }
        .eyebrow { 
          font-size: 11px; 
          font-weight: 600; 
          letter-spacing: 1.5px; 
          text-transform: uppercase; 
          color: rgba(255, 255, 255, 0.7); 
        }
        .hero-content h1 { 
          font-size: clamp(32px, 5vw, 56px); 
          font-weight: 300; 
          letter-spacing: 1px; 
          line-height: 1.05; 
          margin: 14px 0 16px; 
          text-transform: uppercase;
        }
        .hero-content p { 
          max-width: 440px; 
          margin: 0; 
          color: rgba(255, 255, 255, 0.82); 
          font-size: 13px; 
          line-height: 1.7; 
        }
        .hero-cta { 
          display: inline-flex; 
          margin-top: 24px; 
          padding: 14px 28px; 
          border: 1px solid rgba(255, 255, 255, 0.9); 
          color: #fff; 
          text-decoration: none; 
          font-size: 11px; 
          font-weight: 500; 
          letter-spacing: 2px; 
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .hero-cta:hover { 
          background: #fff; 
          color: #000; 
        }

        /* ============================================
           SUBCATEGORY TABS
           ============================================ */
        .subcategories { 
          display: flex; 
          gap: 0; 
          overflow-x: auto; 
          margin: 0 0 32px 0; 
          border-bottom: 1px solid #e5e5e5;
          scrollbar-width: none;
        }
        .subcategories::-webkit-scrollbar { display: none; }
        
        .subcategories button, 
        .subcategories a { 
          white-space: nowrap; 
          border: none; 
          background: transparent; 
          color: #777; 
          padding: 12px 16px; 
          text-decoration: none; 
          font-size: 11px; 
          font-weight: 500; 
          letter-spacing: 1px; 
          text-transform: uppercase;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.2s;
        }
        .subcategories button:hover, 
        .subcategories a:hover { 
          color: #000; 
        }
        .subcategories button.active { 
          color: #000; 
          border-bottom-color: #000;
        }

        /* ============================================
           PRODUCTS SECTION
           ============================================ */
        .products-section { 
          padding-top: 8px;
        }

        .section-head { 
          display: flex; 
          flex-direction: column; 
          gap: 16px; 
          margin-bottom: 24px; 
        }

        .controls { 
          display: flex; 
          gap: 12px; 
          flex-wrap: wrap;
        }
        .controls input, 
        .controls select { 
          border: none; 
          border-bottom: 1px solid #000; 
          background: transparent; 
          padding: 12px 0; 
          font-size: 13px; 
          color: #000; 
          outline: none;
          font-family: inherit;
          border-radius: 0;
          appearance: none;
          transition: border-color 0.2s;
        }
        .controls input::placeholder { color: #aaa; }
        .controls input:focus, 
        .controls select:focus { 
          border-bottom-color: #555; 
        }
        .controls input { 
          flex: 1; 
          min-width: 200px;
        }
        .controls select { 
          min-width: 140px;
          cursor: pointer;
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
        .badge.sold { 
          background: #000; 
        }

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
        .dots button.active { 
          background: #fff; 
        }

        .product-copy { 
          padding: 12px;
        }
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
        .product-price strong { 
          font-weight: 600; 
          color: #000;
        }
        .product-price del { 
          color: #aaa; 
          font-size: 11px; 
        }

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
        .btn-outline:hover { 
          background: #000; 
          color: #fff; 
        }

        /* ============================================
           DESKTOP
           ============================================ */
        @media (min-width: 768px) {
          .catalog-page { padding-top: 120px; }
          .checkout-shell { max-width: 800px; padding: 0 40px 80px; }
          .page-title { font-size: 42px; margin: 40px 0 48px 0; }
          .section-heading { font-size: 13px; margin-bottom: 20px; }
          .item-count-label { font-size: 13px; }
          
          .hero { min-height: 400px; }
          .hero-content h1 { font-size: 56px; }
          .hero-content p { font-size: 15px; }
          
          .breadcrumb { font-size: 12px; padding-top: 28px; }
          
          .subcategories { margin-bottom: 40px; }
          .subcategories button, 
          .subcategories a { 
            padding: 14px 20px; 
            font-size: 12px; 
          }
          
          .section-head { 
            flex-direction: row; 
            align-items: flex-end; 
            justify-content: space-between;
            margin-bottom: 32px;
          }
          .section-heading { margin-bottom: 0; }
          
          .controls { gap: 16px; }
          .controls input, 
          .controls select { font-size: 14px; }
          .controls input { min-width: 240px; }
          
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
          .animate-fade-up, .shimmer { animation: none !important; }
          .product-media img, 
          .product-card, 
          .hero-cta, 
          .btn-outline,
          .subcategories button,
          .subcategories a,
          .controls input,
          .controls select {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
