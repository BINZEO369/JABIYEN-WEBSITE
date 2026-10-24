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

function ProductCard({ product }) {
  const [imageIndex, setImageIndex] = useState(0);
  const { formatMoney } = useCurrency();
  const images = productImages(product);
  const soldOut = product.is_out_of_stock === true || Number(product.stock) === 0;
  const hasSale = product.old_price && Number(product.old_price) > Number(product.price || 0);
  const slug = productSlug(product);
  return (
    <article className="catalog-product-card">
      <Link href={`/product/${encodeURIComponent(slug)}`} className="catalog-product-link">
        <div className="catalog-product-media">
          {images.length ? <img src={images[imageIndex]} alt={product.title || 'JABIYEN product'} loading="lazy" /> : <div className="catalog-media-empty">JABIYEN</div>}
          {soldOut && <span className="catalog-badge sold">Sold out</span>}
          {!soldOut && product.is_new_arrival && <span className="catalog-badge">New arrival</span>}
          {!soldOut && product.is_featured && <span className="catalog-badge featured">Featured</span>}
          {images.length > 1 && <div className="catalog-dots" aria-label="Product images">
            {images.map((image, index) => <button key={image} type="button" aria-label={`Show image ${index + 1}`} className={index === imageIndex ? 'active' : ''} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setImageIndex(index); }} />)}
          </div>}
        </div>
        <div className="catalog-product-copy">
          <span className="catalog-product-category">{product.subcategory || product.category || 'Collection'}</span>
          <h3>{product.title || 'Untitled product'}</h3>
          {product.short_description && <p>{product.short_description}</p>}
          <div className="catalog-product-price"><strong>{formatMoney(product.price || 0)}</strong>{hasSale && <del>{formatMoney(product.old_price)}</del>}</div>
          <div className="catalog-product-meta"><span>{product.gender || 'Unisex'}</span>{product.fabric_type && <span>{product.fabric_type}</span>}{product.fit_type && <span>{product.fit_type}</span>}</div>
        </div>
      </Link>
    </article>
  );
}

function MediaHero({ entity, eyebrow }) {
  const video = cleanMedia(entity?.video_url);
  const image = cleanMedia(entity?.image_url);
  return <section className="catalog-hero">
    <div className="catalog-hero-media">
      {video ? <video src={video} poster={image || undefined} autoPlay muted loop playsInline controls={false} /> : image ? <img src={image} alt={entity?.name || eyebrow} /> : <div className="catalog-hero-fallback"><span>JABIYEN</span><small>{entity?.name || eyebrow}</small></div>}
      <div className="catalog-hero-shade" />
    </div>
    <div className="catalog-hero-content">
      <span className="catalog-eyebrow">{eyebrow}</span>
      <h1>{entity?.name || 'Collection'}</h1>
      <p>{entity?.meta_description || entity?.keywords || `Explore the ${entity?.name || 'JABIYEN'} collection, selected for everyday expression and modern wardrobe essentials.`}</p>
      {(entity?.image_cta_title || entity?.video_cta_title) && <a className="catalog-hero-cta" href={entity.image_cta_link || entity.video_cta_link || '#'}>{entity.image_cta_title || entity.video_cta_title}</a>}
    </div>
  </section>;
}

function LoadingState() { return <div className="catalog-state"><div className="catalog-spinner" /><p>Loading collection…</p></div>; }
function ErrorState({ message }) { return <div className="catalog-state error"><h1>Collection unavailable</h1><p>{message || 'This collection could not be loaded right now.'}</p><Link href="/">Return to home</Link></div>; }

export default function CatalogBrowser({ mode = 'category', slug }) {
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
        const read = async (responsePromise) => { const response = await responsePromise; const payload = await response.json().catch(() => null); if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status})`); return payload; };
        const entity = await read(fetch(entityUrl));
        const products = await read(fetch(productsUrl));
        const related = isSubcategory
          ? await read(fetch(`/api/categories/${encodeURIComponent(entity.category_slug || entity.categories?.slug || '')}`))
          : await read(fetch(`/api/subcategories?category_slug=${encodeURIComponent(slug)}`));
        if (cancelled) return;
        setState({ loading: false, entity, parent: isSubcategory ? related : entity, subcategories: isSubcategory ? [] : (Array.isArray(related) ? related : []), products: Array.isArray(products) ? products : [], error: '' });
      } catch (error) { if (!cancelled) setState({ loading: false, entity: null, parent: null, subcategories: [], products: [], error: error.message || 'Unable to load this collection.' }); }
    }
    if (slug) load();
    return () => { cancelled = true; };
  }, [isSubcategory, slug]);

  const visibleProducts = useMemo(() => {
    let products = state.products.filter((product) => !query || `${product.title} ${product.short_description || ''} ${product.tags || ''}`.toLowerCase().includes(query.toLowerCase()));
    if (activeSubcategory !== 'all') products = products.filter((product) => slugify(product.subcategory_slug || product.subcategory || '') === activeSubcategory);
    return [...products].sort((a, b) => sort === 'price-low' ? Number(a.price || 0) - Number(b.price || 0) : sort === 'price-high' ? Number(b.price || 0) - Number(a.price || 0) : new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [activeSubcategory, query, sort, state.products]);

  if (state.loading) return <><Head><title>Loading collection | JABIYEN</title></Head><LoadingState /></>;
  if (state.error || !state.entity) return <><Head><title>Collection unavailable | JABIYEN</title></Head><ErrorState message={state.error} /></>;
  const entity = state.entity;
  const parentSlug = isSubcategory ? slugify(entity.category_slug || state.parent?.slug || '') : slugify(entity.slug || slug);
  const title = `${entity.name || 'Collection'} | JABIYEN`;
  return <>
    <Head><title>{title}</title><meta name="description" content={entity.meta_description || `Explore ${entity.name || 'JABIYEN collection'} products.`} /><link rel="canonical" href={`https://jabiyen-website.vercel.app/${isSubcategory ? `subcategory/${slug}` : `category/${slug}`}`} /></Head>
    <main className="catalog-page">
      <div className="catalog-breadcrumb"><Link href="/">Home</Link><span>/</span>{isSubcategory && <><Link href={`/category/${parentSlug}`}>{state.parent?.name || 'Category'}</Link><span>/</span></>}<strong>{entity.name}</strong></div>
      <MediaHero entity={entity} eyebrow={isSubcategory ? 'Subcategory collection' : 'Category collection'} />
      {!isSubcategory && state.subcategories.length > 0 && <nav className="catalog-subcategories" aria-label="Subcategories"><button className={activeSubcategory === 'all' ? 'active' : ''} onClick={() => setActiveSubcategory('all')}>All products</button>{state.subcategories.map((subcategory) => <Link key={subcategory.id} href={`/category/${parentSlug}/${slugify(subcategory.slug || subcategory.name)}`} className="active">{subcategory.name}</Link>)}</nav>}
      <section className="catalog-products-section"><div className="catalog-section-head"><div><span className="catalog-eyebrow">JABIYEN edit</span><h2>{isSubcategory ? `${entity.name} pieces` : `${entity.name} collection`}</h2><p>{visibleProducts.length} product{visibleProducts.length === 1 ? '' : 's'} selected from Central catalog.</p></div><div className="catalog-controls"><span className="catalog-currency-note">Prices in {selectedCurrency.currency_code} · 1 USD = {selectedCurrency.currency_symbol || ''}{Number(selectedCurrency.exchange_rate || 1).toLocaleString('en-US', { maximumFractionDigits: 4 })}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this collection" aria-label="Search this collection" /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></div></div>{visibleProducts.length ? <div className="catalog-products-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="catalog-empty"><h3>No products in this collection yet</h3><p>New JABIYEN pieces will appear here as soon as they are published.</p></div>}</section>
    </main>
    <style jsx>{`
      .catalog-page{background:#fff;min-height:70vh;padding:18px 0 80px;color:#1d1d1f}.catalog-breadcrumb{max-width:1400px;margin:0 auto;padding:0 28px 18px;display:flex;gap:9px;align-items:center;font:11px Inter,sans-serif;color:#86868b}.catalog-breadcrumb a{color:#1d1d1f;text-decoration:none}.catalog-breadcrumb strong{font-weight:600}.catalog-hero{max-width:1400px;margin:0 auto;min-height:430px;position:relative;overflow:hidden;background:#161616}.catalog-hero-media,.catalog-hero-media img,.catalog-hero-media video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.catalog-hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.68),rgba(0,0,0,.08) 75%),linear-gradient(0deg,rgba(0,0,0,.2),transparent 45%)}.catalog-hero-fallback{height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff;background:linear-gradient(135deg,#343434,#a6a6a6)}.catalog-hero-fallback span{font:700 clamp(40px,8vw,110px) Sora,sans-serif;letter-spacing:.18em}.catalog-hero-fallback small{font:12px Inter,sans-serif;letter-spacing:.2em;text-transform:uppercase}.catalog-hero-content{position:relative;z-index:1;max-width:600px;padding:clamp(80px,12vw,150px) clamp(28px,7vw,100px);color:#fff}.catalog-eyebrow{font:600 10px Sora,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#86868b}.catalog-hero .catalog-eyebrow{color:rgba(255,255,255,.7)}.catalog-hero h1{font:500 clamp(42px,7vw,86px) Manrope,sans-serif;letter-spacing:-.06em;line-height:.95;margin:14px 0 20px}.catalog-hero p{max-width:440px;margin:0;color:rgba(255,255,255,.82);font:14px/1.7 Inter,sans-serif}.catalog-hero-cta{display:inline-flex;margin-top:26px;padding:12px 20px;border:1px solid rgba(255,255,255,.7);color:#fff;text-decoration:none;font:600 10px Sora,sans-serif;letter-spacing:.1em;text-transform:uppercase}.catalog-subcategories{max-width:1400px;margin:0 auto;padding:24px 28px;display:flex;gap:10px;overflow:auto;border-bottom:1px solid #eee}.catalog-subcategories button,.catalog-subcategories a{white-space:nowrap;border:1px solid #dedede;background:#fff;color:#1d1d1f;border-radius:999px;padding:10px 16px;text-decoration:none;font:600 11px Inter,sans-serif;cursor:pointer}.catalog-subcategories button.active,.catalog-subcategories a.active:hover{background:#1d1d1f;color:#fff;border-color:#1d1d1f}.catalog-products-section{max-width:1400px;margin:0 auto;padding:54px 28px}.catalog-section-head{display:flex;justify-content:space-between;gap:28px;align-items:end;margin-bottom:28px}.catalog-section-head h2{font:500 clamp(28px,4vw,48px) Manrope,sans-serif;letter-spacing:-.05em;margin:10px 0 5px}.catalog-section-head p{margin:0;color:#86868b;font:13px Inter,sans-serif}.catalog-controls{display:flex;gap:8px;flex-wrap:wrap}.catalog-controls input,.catalog-controls select{border:1px solid #dedede;background:#fff;border-radius:999px;padding:11px 14px;font:12px Inter,sans-serif;color:#1d1d1f}.catalog-controls input{min-width:210px}.catalog-products-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px 14px}.catalog-product-card{min-width:0}.catalog-product-link{display:block;text-decoration:none;color:inherit}.catalog-product-media{position:relative;aspect-ratio:4/5;background:#f5f5f7;overflow:hidden}.catalog-product-media img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}.catalog-product-link:hover .catalog-product-media img{transform:scale(1.035)}.catalog-media-empty{height:100%;display:grid;place-items:center;color:#aaa;font:600 12px Sora;letter-spacing:.15em}.catalog-badge{position:absolute;top:10px;left:10px;background:#fff;padding:5px 8px;font:600 9px Inter;text-transform:uppercase;letter-spacing:.06em}.catalog-badge.featured{left:auto;right:10px}.catalog-badge.sold{background:#1d1d1f;color:#fff}.catalog-dots{position:absolute;bottom:10px;left:0;right:0;display:flex;justify-content:center;gap:5px}.catalog-dots button{width:7px;height:7px;padding:0;border:0;border-radius:50%;background:#fff8;cursor:pointer}.catalog-dots button.active{background:#fff}.catalog-product-copy{padding:12px 3px}.catalog-product-category{display:block;color:#86868b;font:600 9px Inter;text-transform:uppercase;letter-spacing:.08em}.catalog-product-copy h3{margin:7px 0 4px;font:600 14px/1.35 Inter}.catalog-product-copy p{color:#86868b;font:12px/1.4 Inter;margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.catalog-product-price{display:flex;align-items:center;gap:8px;font:13px Inter}.catalog-product-price del{color:#aaa;font-size:12px}.catalog-product-meta{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.catalog-product-meta span{padding:4px 6px;background:#f5f5f7;color:#68686d;font:9px Inter;text-transform:capitalize}.catalog-empty,.catalog-state{text-align:center;padding:100px 24px;color:#86868b}.catalog-empty h3,.catalog-state h1{color:#1d1d1f;font:600 24px Manrope;margin:0 0 10px}.catalog-empty p,.catalog-state p{font:13px/1.6 Inter}.catalog-state a{display:inline-block;margin-top:18px;color:#1d1d1f;font:600 12px Inter}.catalog-spinner{width:36px;height:36px;border:3px solid #eee;border-top-color:#1d1d1f;border-radius:50%;animation:catalog-spin 1s linear infinite;margin:0 auto 16px}@keyframes catalog-spin{to{transform:rotate(360deg)}}
      @media(max-width:900px){.catalog-products-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.catalog-section-head{align-items:flex-start;flex-direction:column}.catalog-controls{width:100%}.catalog-controls input{flex:1}}
      @media(max-width:600px){.catalog-breadcrumb{padding-left:18px;padding-right:18px}.catalog-hero{min-height:390px}.catalog-hero-content{padding:100px 24px 60px}.catalog-products-section{padding:38px 18px}.catalog-products-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 8px}.catalog-product-copy h3{font-size:12px}.catalog-controls{display:grid;grid-template-columns:1fr 1fr;width:100%}.catalog-controls input{min-width:0;width:100%}.catalog-controls select{width:100%}}
    `}</style>
    <style jsx>{`
      .catalog-page{background:#f7f6f2;padding-top:24px}.catalog-hero{border-radius:0 0 22px 22px;box-shadow:0 18px 44px rgba(24,24,24,.12)}.catalog-hero-content{padding-left:clamp(28px,8vw,118px)}.catalog-subcategories{background:#fff;border-bottom:0;border-radius:18px;max-width:1344px;margin:18px auto 0;box-shadow:0 8px 24px rgba(24,24,24,.05)}.catalog-products-section{padding-top:62px}.catalog-section-head{background:rgba(255,255,255,.72);border:1px solid rgba(24,24,24,.06);border-radius:18px;padding:22px 24px;margin-bottom:30px}.catalog-controls{align-items:center}.catalog-currency-note{font:600 10px Inter,sans-serif;color:#777;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}.catalog-product-card{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 5px 18px rgba(24,24,24,.06);transition:transform .25s ease,box-shadow .25s ease}.catalog-product-card:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(24,24,24,.12)}.catalog-product-copy{padding:15px 15px 18px}.catalog-product-price strong{font-size:15px}.catalog-product-meta{margin-top:11px}.catalog-empty{background:#fff;border-radius:18px}
      @media(max-width:600px){.catalog-page{padding-top:10px}.catalog-hero{border-radius:0 0 16px 16px}.catalog-section-head{padding:18px 15px}.catalog-currency-note{width:100%;white-space:normal;order:-1}.catalog-products-section{padding-top:38px}.catalog-product-copy{padding:11px 10px 14px}}
    `}</style>
  </>;
}
