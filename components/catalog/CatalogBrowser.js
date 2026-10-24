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

function ProductCard({ product, index }) {
  const [imageIndex, setImageIndex] = useState(0);
  const { formatMoney } = useCurrency();
  const images = productImages(product);
  const soldOut = product.is_out_of_stock === true || Number(product.stock) === 0;
  const hasSale = product.old_price && Number(product.old_price) > Number(product.price || 0);
  const slug = productSlug(product);

  return (
    <article
      className="product-card animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 0.06}s` }}
    >
      <Link href={`/product/${encodeURIComponent(slug)}`} className="product-link">
        <div className="product-media">
          {images.length ? (
            <img src={images[imageIndex]} alt={product.title || 'JABIYEN product'} loading="lazy" />
          ) : (
            <div className="media-empty">JABIYEN</div>
          )}
          {soldOut && <span className="badge sold">Sold out</span>}
          {!soldOut && product.is_new_arrival && <span className="badge">New</span>}
          {!soldOut && product.is_featured && <span className="badge featured">Featured</span>}
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
          {product.short_description && <p>{product.short_description}</p>}
          <div className="product-price">
            <strong>{formatMoney(product.price || 0)}</strong>
            {hasSale && <del>{formatMoney(product.old_price)}</del>}
          </div>
          <div className="product-meta">
            <span>{product.gender || 'Unisex'}</span>
            {product.fabric_type && <span>{product.fabric_type}</span>}
            {product.fit_type && <span>{product.fit_type}</span>}
          </div>
        </div>
      </Link>
    </article>
  );
}

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
        <p>
          {entity?.meta_description ||
            entity?.keywords ||
            `Explore the ${entity?.name || 'JABIYEN'} collection, selected for everyday expression and modern wardrobe essentials.`}
        </p>
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
    <div className="state">
      <div className="spinner" />
      <p>Loading collection…</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="minimal-box">
      <p>{message || 'This collection could not be loaded right now.'}</p>
      <Link href="/" className="btn-outline">Return to home</Link>
    </div>
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
        setState({
          loading: false,
          entity,
          parent: isSubcategory ? related : entity,
          subcategories: isSubcategory ? [] : (Array.isArray(related) ? related : []),
          products: Array.isArray(products) ? products : [],
          error: '',
        });
      } catch (error) {
        if (!cancelled) {
          setState({ loading: false, entity: null, parent: null, subcategories: [], products: [], error: error.message || 'Unable to load this collection.' });
        }
      }
    }
    if (slug) load();
    return () => { cancelled = true; };
  }, [isSubcategory, slug]);

  const visibleProducts = useMemo(() => {
    let products = state.products.filter((product) =>
      !query || `${product.title} ${product.short_description || ''} ${product.tags || ''}`.toLowerCase().includes(query.toLowerCase())
    );
    if (activeSubcategory !== 'all') {
      products = products.filter((product) => slugify(product.subcategory_slug || product.subcategory || '') === activeSubcategory);
    }
    return [...products].sort((a, b) =>
      sort === 'price-low'
        ? Number(a.price || 0) - Number(b.price || 0)
        : sort === 'price-high'
        ? Number(b.price || 0) - Number(a.price || 0)
        : new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
  }, [activeSubcategory, query, sort, state.products]);

  if (state.loading) {
    return (
      <>
        <Head><title>Loading collection | JABIYEN</title></Head>
        <style jsx global>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="catalog-page">
          <div className="catalog-shell">
            <LoadingState />
          </div>
        </div>
        <style jsx>{`
          .catalog-page { min-height: 100vh; background: #ffffff; padding-top: 100px; padding-bottom: 60px; }
          .catalog-shell { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
          .state { text-align: center; padding: 100px 24px; color: #777; }
          .spinner { width: 32px; height: 32px; border: 2px solid #f0f0f0; border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
          .state p { font-size: 13px; margin: 0; }
        `}</style>
      </>
    );
  }

  if (state.error || !state.entity) {
    return (
      <>
        <Head><title>Collection unavailable | JABIYEN</title></Head>
        <div className="catalog-page">
          <div className="catalog-shell">
            <ErrorState message={state.error} />
          </div>
        </div>
        <style jsx>{`
          .catalog-page { min-height: 100vh; background: #ffffff; padding-top: 100px; padding-bottom: 60px; }
          .catalog-shell { width: 100%; max-width: 600px; margin: 0 auto; padding: 0 20px; }
          .minimal-box { padding: 32px 24px; background: #fafafa; text-align: center; }
          .minimal-box p { margin: 0 0 16px; font-size: 13px; color: #555; line-height: 1.6; }
          .btn-outline { display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 20px; background: transparent; color: #000; border: 1px solid #000; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; transition: all 0.2s; }
          .btn-outline:hover { background: #000; color: #fff; }
        `}</style>
      </>
    );
  }

  const entity = state.entity;
  const parentSlug = isSubcategory
    ? slugify(categorySlug || entity.category_slug || state.parent?.slug || '')
    : slugify(entity.slug || slug);
  const title = `${entity.name || 'Collection'} | JABIYEN`;
  const subtitle = entity.meta_description || `Explore ${entity.name || 'JABIYEN collection'} products.`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={subtitle} />
        <link
          rel="canonical"
          href={`https://jabiyen-website.vercel.app/${isSubcategory ? `category/${parentSlug}/${slug}` : `category/${slug}`}`}
        />
      </Head>

      <style jsx global>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="catalog-page">
        <div className="catalog-shell">

          {/* Breadcrumb */}
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

          {/* Hero */}
          <MediaHero entity={entity} eyebrow={isSubcategory ? 'Subcategory' : 'Category'} />

          {/* Subcategory tabs */}
          {!isSubcategory && state.subcategories.length > 0 && (
            <nav className="subcategories animate-fade-up" aria-label="Subcategories">
              <button
                className={activeSubcategory === 'all' ? 'active' : ''}
                onClick={() => setActiveSubcategory('all')}
              >
                All
              </button>
              {state.subcategories.map((sub) => (
                <Link key={sub.id} href={`/category/${parentSlug}/${slugify(sub.slug || sub.name)}`}>
                  {sub.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Products section */}
          <section className="products-section">
            <div className="section-head animate-fade-up">
              <h2 className="section-title">
                {isSubcategory ? `${entity.name} pieces` : `${entity.name} collection`}
                <span className="count">({visibleProducts.length})</span>
              </h2>
              <div className="controls">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search this collection"
                  aria-label="Search this collection"
                  className="search-input"
                />
                <div className="sort-wrap">
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    aria-label="Sort products"
                    className="sort-select"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price · Low to High</option>
                    <option value="price-high">Price · High to Low</option>
                  </select>
                  <svg className="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {visibleProducts.length ? (
              <div className="products-grid">
                {visibleProducts.map((product, idx) => (
                  <ProductCard key={product.id} product={product} index={idx} />
                ))}
              </div>
            ) : (
              <div className="minimal-box animate-fade-up">
                <p>No products in this collection yet. New JABIYEN pieces will appear here as soon as they are published.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <style jsx>{`
        .catalog-page {
          min-height: 100vh;
          background: #ffffff;
          color: #000;
          padding-top: 80px;
          padding-bottom: 60px;
        }
        .catalog-shell {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        @media (min-width: 768px) {
          .catalog-page { padding-top: 100px; padding-bottom: 80px; }
          .catalog-shell { padding: 0 40px; }
        }

        /* Breadcrumb */
        .breadcrumb {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .breadcrumb a {
          color: #555;
          text-decoration: none;
          transition: color 0.2s;
        }
        .breadcrumb a:hover { color: #000; }
        .breadcrumb strong { color: #000; font-weight: 600; }

        /* Hero */
        .hero {
          position: relative;
          width: 100%;
          min-height: 340px;
          overflow: hidden;
          background: #f5f5f5;
          margin-bottom: 40px;
        }
        @media (min-width: 768px) {
          .hero { min-height: 500px; }
        }
        .hero-media {
          position: absolute;
          inset: 0;
        }
        .hero-media img,
        .hero-media video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .hero-shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.6));
        }
        .hero-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          background: #f5f5f5;
          color: #000;
          gap: 12px;
        }
        .hero-fallback span {
          font-size: 48px;
          font-weight: 300;
          letter-spacing: 6px;
        }
        .hero-fallback small {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #777;
        }
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 620px;
          padding: 60px 24px;
          color: #fff;
        }
        @media (min-width: 768px) {
          .hero-content { padding: 100px 60px; }
        }
        .eyebrow {
          display: inline-block;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.85);
        }
        .hero h1 {
          font-size: 42px;
          font-weight: 300;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin: 14px 0 16px;
          line-height: 1.05;
        }
        @media (min-width: 768px) {
          .hero h1 { font-size: 64px; }
        }
        .hero p {
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255,255,255,0.85);
          max-width: 440px;
          margin: 0;
        }
        @media (min-width: 768px) {
          .hero p { font-size: 14px; }
        }
        .hero-cta {
          display: inline-flex;
          margin-top: 24px;
          padding: 12px 20px;
          border: 1px solid rgba(255,255,255,0.7);
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .hero-cta:hover {
          background: #fff;
          color: #000;
        }

        /* Subcategories */
        .subcategories {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 16px 0;
          margin-bottom: 32px;
          border-bottom: 1px solid #f0f0f0;
          scrollbar-width: none;
        }
        .subcategories::-webkit-scrollbar { display: none; }
        .subcategories button,
        .subcategories a {
          white-space: nowrap;
          border: 1px solid #e5e5e5;
          background: #fff;
          color: #555;
          padding: 8px 14px;
          text-decoration: none;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }
        .subcategories button:hover,
        .subcategories a:hover {
          border-color: #000;
          color: #000;
        }
        .subcategories button.active {
          background: #000;
          color: #fff;
          border-color: #000;
        }

        /* Section head */
        .products-section { padding-bottom: 40px; }
        .section-head {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 28px;
        }
        @media (min-width: 768px) {
          .section-head {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
          }
        }
        .section-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #000;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-title .count {
          color: #999;
          font-weight: 400;
          letter-spacing: 0;
          text-transform: none;
        }
        @media (min-width: 768px) {
          .section-title { font-size: 13px; }
        }
        .controls {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: center;
        }
        .search-input {
          border: none;
          border-bottom: 1px solid #000;
          border-radius: 0;
          padding: 8px 0;
          font-size: 12px;
          color: #000;
          background: transparent;
          outline: none;
          min-width: 200px;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .search-input::placeholder { color: #aaa; }
        .search-input:focus { border-bottom-color: #555; }
        .sort-wrap {
          position: relative;
        }
        .sort-select {
          border: none;
          border-bottom: 1px solid #000;
          border-radius: 0;
          padding: 8px 24px 8px 0;
          font-size: 11px;
          color: #000;
          background: transparent;
          text-transform: uppercase;
          letter-spacing: 1px;
          appearance: none;
          outline: none;
          cursor: pointer;
          font-family: inherit;
        }
        .chevron {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        /* Products grid */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px 12px;
        }
        @media (min-width: 768px) {
          .products-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px 16px; }
        }
        @media (min-width: 1024px) {
          .products-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px 20px; }
        }

        /* Product card */
        .product-card { min-width: 0; }
        .product-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        .product-media {
          position: relative;
          aspect-ratio: 4/5;
          background: #f5f5f5;
          overflow: hidden;
        }
        .product-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .product-link:hover .product-media img {
          transform: scale(1.03);
        }
        .media-empty {
          height: 100%;
          display: grid;
          place-items: center;
          color: #aaa;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: #fff;
          color: #000;
          padding: 4px 8px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .badge.featured {
          left: auto;
          right: 8px;
        }
        .badge.sold {
          background: #000;
          color: #fff;
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
          background: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: background 0.2s;
        }
        .dots button.active { background: #fff; }

        .product-copy { padding: 10px 0; }
        .product-category {
          display: block;
          color: #999;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .product-copy h3 {
          margin: 6px 0 4px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          line-height: 1.3;
          color: #000;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (min-width: 768px) {
          .product-copy h3 { font-size: 13px; }
        }
        .product-copy p {
          color: #777;
          font-size: 10px;
          line-height: 1.4;
          margin: 0 0 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .product-copy p { font-size: 12px; }
        }
        .product-price {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          color: #000;
        }
        @media (min-width: 768px) {
          .product-price { font-size: 13px; }
        }
        .product-price del {
          color: #aaa;
          font-weight: 400;
          font-size: 0.9em;
        }
        .product-meta {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .product-meta span {
          padding: 3px 6px;
          background: #fafafa;
          color: #777;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* State UI */
        .minimal-box {
          padding: 32px 24px;
          background: #fafafa;
          text-align: center;
        }
        .minimal-box p {
          margin: 0 0 16px;
          font-size: 13px;
          color: #555;
          line-height: 1.6;
        }

        /* Animations */
        .animate-fade-up {
          animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up, .spinner { animation: none !important; }
          .product-media img { transition: none !important; }
        }
      `}</style>
    </>
  );
}
