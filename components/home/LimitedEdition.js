'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function LimitedEdition({ products = [] }) {
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
        const filtered = all.filter(p => p.is_limited_edition === true || p.is_limited_edition === 1 || p.is_limited_edition === 'true');
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setItems(filtered.slice(0, maxProducts));
      } catch (e) {
        const filtered = products.filter(p => p.is_limited_edition === true || p.is_limited_edition === 1);
        setItems(filtered.slice(0, maxProducts));
      }
      setLoading(false);
    }
    if (products.length > 0) {
      const filtered = products.filter(p => p.is_limited_edition === true || p.is_limited_edition === 1);
      setItems(filtered.slice(0, maxProducts));
      setLoading(false);
    } else fetchItems();
  }, [products]);

  if (loading) return <Skeleton title="Limited Edition" />;
  if (!items.length) return <Empty title="Limited Edition" message="Exclusive drops coming soon" />;

  return (
    <section style={{ padding: '32px 0', maxWidth: 1400, margin: '0 auto', background: '#1d1d1f' }}>
      <div style={{ textAlign: 'center', marginBottom: 20, padding: '0 8px' }}>
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: '#ffffff', letterSpacing: '-0.3px' }}>Limited Edition</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }} className="le-grid">
        {items.map(p => <Card key={p.id} product={p} colorCache={colorCache} setColorCache={setColorCache} />)}
      </div>
      <style jsx>{`
        @media (min-width: 768px) { .le-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 1024px) { .le-grid { grid-template-columns: repeat(4, 1fr) !important; } }
      `}</style>
    </section>
  );
}

function Skeleton({ title }) {
  return (
    <section style={{ padding: '32px 0', background: '#1d1d1f' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: '#fff' }}>{title}</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ background: '#2d2d2f' }}>
            <div style={{ aspectRatio: '4/5', background: 'linear-gradient(90deg, #3a3a3c 0%, #4a4a4c 40%, #3a3a3c 80%)', backgroundSize: '800px 100%', animation: 'shimmer 1.8s infinite linear' }} />
            <div style={{ padding: '4px 6px' }}><div style={{ height: 13, background: 'rgba(255,255,255,0.1)', width: '85%', margin: '0 auto', borderRadius: 4 }} /></div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } }`}</style>
    </section>
  );
}

function Empty({ title, message }) {
  return (
    <section style={{ padding: '32px 0', background: '#1d1d1f' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: '#fff' }}>{title}</h2>
      </div>
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 400, margin: '0 auto' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" style={{ margin: '0 auto 16px', opacity: 0.4 }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#a1a1a6' }}>No limited edition items</p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#666', marginTop: 6 }}>{message}</p>
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
  const onTE = () => { setIsDragging(false); if (Math.abs(dragOffset) > 60) dragOffset < 0 && currentImage < total - 1 ? navigate(currentImage + 1) : dragOffset > 0 && currentImage > 0 ? navigate(currentImage - 1) : null; setDragOffset(0); };

  return (
    <div style={{ position: 'relative', background: '#2d2d2f', cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.3s' }}
      className="le-card"
      onTouchStart={total > 1 ? onTS : undefined} onTouchMove={total > 1 ? onTM : undefined} onTouchEnd={total > 1 ? onTE : undefined}
    >
      <Link href={`/product/${slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ position: 'relative', aspectRatio: '4/5', background: '#2d2d2f', overflow: 'hidden', marginBottom: 6 }}>
          {allImages.map((img, i) => (
            <img key={i} src={img} alt={product.title || ''} style={{
              position: 'absolute', top: 0,
              left: isDragging ? `calc(${(i - currentImage) * 100}% + ${dragOffset}px)` : `${(i - currentImage) * 100}%`,
              width: '100%', height: '100%', objectFit: 'cover',
              transition: isDragging ? 'none' : 'left 0.45s cubic-bezier(0.25,0.1,0.25,1)',
              zIndex: i === currentImage ? 2 : 1
            }} />
          ))}
          {!isOut && (
            <span style={{ position: 'absolute', top: 4, left: 4, zIndex: 5, padding: '2px 7px', fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 8, textTransform: 'uppercase', background: '#2d2d2f', color: '#ffffff', letterSpacing: '0.5px', borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>Limited</span>
          )}
          {isOut && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6 }}><span style={{ background: '#ffffff', color: '#1d1d1f', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 9, textTransform: 'uppercase', padding: '5px 14px' }}>Sold Out</span></div>}
          {total > 1 && (
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 4 }}>
              {allImages.map((_, i) => (
                <span key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(i); }} style={{ width: i === currentImage ? 8 : 6, height: i === currentImage ? 8 : 6, borderRadius: '50%', background: i === currentImage ? '#fff' : 'rgba(255,255,255,0.55)', cursor: 'pointer', transition: 'all 0.35s ease' }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '4px 6px 6px' }}>
          <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, color: '#ffffff', lineHeight: 1.35, textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>{product.title}</h3>
          {colors.length > 0 && (
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              {colors.map((c, i) => <span key={i} title={c.color_name} style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: c.color_code || '#ccc', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }} />)}
            </div>
          )}
        </div>
      </Link>
      <style jsx>{`
        .le-card:active { transform: scale(0.98); }
        @media (hover: hover) { .le-card:hover { transform: translateY(-2px); z-index: 2; box-shadow: 0 8px 25px rgba(0,0,0,0.4); } }
      `}</style>
    </div>
  );
}
