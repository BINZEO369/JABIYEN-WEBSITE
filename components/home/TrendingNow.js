'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function TrendingNow({ products = [] }) {
  const [items, setItems] = useState([]);
  const [colorCache, setColorCache] = useState({});
  const [loading, setLoading] = useState(true);
  const maxProducts = 8;

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const all = Array.isArray(data) ? data : data?.data || data?.products || [];
        const filtered = all.filter(p => 
          p.is_hot === true || p.is_hot === 1 || p.is_hot === 'true' ||
          p.is_trending === true || p.is_trending === 1 || p.is_trending === 'true'
        );
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setItems(filtered.slice(0, maxProducts));
      } catch (e) {
        const filtered = products.filter(p => 
          p.is_hot === true || p.is_hot === 1 || p.is_trending === true || p.is_trending === 1
        );
        setItems(filtered.slice(0, maxProducts));
      }
      setLoading(false);
    }
    if (products.length > 0) {
      const filtered = products.filter(p => 
        p.is_hot === true || p.is_hot === 1 || p.is_trending === true || p.is_trending === 1
      );
      setItems(filtered.slice(0, maxProducts));
      setLoading(false);
    } else fetchItems();
  }, [products]);

  if (loading) return <Skeleton title="Trending Now" />;
  if (!items.length) return <Empty title="Trending Now" message="Hot picks coming soon — stay tuned" />;

  return (
    <section style={{ padding: '32px 0', maxWidth: 1400, margin: '0 auto', background: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: 20, padding: '0 8px' }}>
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: '#1d1d1f', letterSpacing: '-0.3px' }}>Trending Now</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }} className="tn-grid">
        {items.map(p => <Card key={p.id} product={p} colorCache={colorCache} setColorCache={setColorCache} />)}
      </div>
      <style jsx>{`
        @media (min-width: 768px) { .tn-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 1024px) { .tn-grid { grid-template-columns: repeat(4, 1fr) !important; } }
      `}</style>
    </section>
  );
}

function Skeleton({ title }) {
  return (
    <section style={{ padding: '32px 0', background: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: '#1d1d1f' }}>{title}</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ background: '#fff' }}>
            <div style={{ aspectRatio: '4/5', background: 'linear-gradient(90deg, #e5e5ea 0%, #f0f0f5 40%, #e5e5ea 80%)', backgroundSize: '800px 100%', animation: 'shimmer 1.8s infinite linear' }} />
            <div style={{ padding: '4px 6px' }}><div style={{ height: 13, background: '#e5e5ea', width: '85%', margin: '0 auto', borderRadius: 4 }} /></div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } }`}</style>
    </section>
  );
}

function Empty({ title, message }) {
  return (
    <section style={{ padding: '32px 0', background: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: '#1d1d1f' }}>{title}</h2>
      </div>
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 400, margin: '0 auto' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ margin: '0 auto 16px', opacity: 0.4 }}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#86868b' }}>No trending products right now</p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#b0b0b5', marginTop: 6 }}>{message}</p>
      </div>
    </section>
  );
}

function Card({ product, colorCache, setColorCache }) {
  const [colors, setColors] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const isOut = product.is_out_of_stock || product.stock === 0 || product.stock === '0';
  const slug = (product.slug || product.title || 'product').toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
  const mainImg = product.img || product.image || product.image_url || '/placeholder.png';

  const getAll = () => {
    const imgs = [];
    if (mainImg !== '/placeholder.png') imgs.push(mainImg);
    colors.forEach(c => { if (c.color_image?.trim() && !imgs.includes(c.color_image)) imgs.push(c.color_image); });
    return imgs;
  };
  const allImages = getAll();
  const total = allImages.length;

  useEffect(() => {
    if (colorCache[slug]) { setColors(colorCache[slug]); return; }
    fetch(`/api/product-colors?slug=${slug}`).then(r => r.json()).then(d => {
      setColors(d || []);
      setColorCache(prev => ({ ...prev, [slug]: d || [] }));
    }).catch(() => {});
  }, [slug]);

  const navigate = (i) => { if (i >= 0 && i < total) { setCurrentImage(i); setDragOffset(0); } };
  const onTS = (e) => { startX.current = e.touches[0].clientX; setIsDragging(true); };
  const onTM = (e) => { if (!isDragging) return; setDragOffset(e.touches[0].clientX - startX.current); };
  const onTE = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) > 60) dragOffset < 0 && currentImage < total - 1 ? navigate(currentImage + 1) : dragOffset > 0 && currentImage > 0 ? navigate(currentImage - 1) : null;
    setDragOffset(0);
  };

  const badgeText = product.is_hot || product.is_trending ? 'Trending' : product.is_on_sale ? 'Sale' : '';

  return (
    <div style={{ position: 'relative', background: '#fff', cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.3s' }}
      className="tn-card"
      onTouchStart={total > 1 ? onTS : undefined}
      onTouchMove={total > 1 ? onTM : undefined}
      onTouchEnd={total > 1 ? onTE : undefined}
    >
      <Link href={`/product/${slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ position: 'relative', aspectRatio: '4/5', background: '#f5f5f7', overflow: 'hidden', marginBottom: 6 }}>
          {allImages.map((img, i) => (
            <img key={i} src={img} alt={product.title || ''} style={{
              position: 'absolute', top: 0,
              left: isDragging ? `calc(${(i - currentImage) * 100}% + ${dragOffset}px)` : `${(i - currentImage) * 100}%`,
              width: '100%', height: '100%', objectFit: 'cover',
              transition: isDragging ? 'none' : 'left 0.45s cubic-bezier(0.25,0.1,0.25,1)',
              zIndex: i === currentImage ? 2 : 1
            }} />
          ))}
          {!isOut && badgeText && (
            <span style={{ position: 'absolute', top: 4, left: 4, zIndex: 5, padding: '2px 7px', fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 8, textTransform: 'uppercase', background: '#fff', color: badgeText === 'Sale' ? '#d70015' : '#1d1d1f', letterSpacing: '0.5px', borderRadius: 1 }}>{badgeText}</span>
          )}
          {isOut && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6 }}><span style={{ background: '#1d1d1f', color: '#fff', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 9, textTransform: 'uppercase', padding: '5px 14px' }}>Sold Out</span></div>}
          {total > 1 && (
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 4 }}>
              {allImages.map((_, i) => (
                <span key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(i); }} style={{ width: i === currentImage ? 8 : 6, height: i === currentImage ? 8 : 6, borderRadius: '50%', background: i === currentImage ? '#fff' : 'rgba(255,255,255,0.55)', cursor: 'pointer', transition: 'all 0.35s ease' }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '4px 6px 6px' }}>
          <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, color: '#1d1d1f', lineHeight: 1.35, textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>{product.title}</h3>
          {colors.length > 0 && (
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              {colors.map((c, i) => <span key={i} title={c.color_name} style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: c.color_code || '#ccc', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer' }} />)}
            </div>
          )}
        </div>
      </Link>
      <style jsx>{`
        .tn-card:active { transform: scale(0.98); }
        @media (hover: hover) { .tn-card:hover { transform: translateY(-2px); z-index: 2; box-shadow: 0 8px 25px rgba(0,0,0,0.12); } }
      `}</style>
    </div>
  );
}
