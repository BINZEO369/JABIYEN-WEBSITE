'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function TrendingNow({ products = [] }) {
  const [items, setItems] = useState([]);
  const [colorCache, setColorCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);
  const scrollRef = useRef(null);

  const maxProducts = 8;

  // Fetch Data
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
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
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

  // Scroll Tracking Logic
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      setCanScrollLeft(el.scrollLeft > 2);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
      const maxScroll = el.scrollWidth - el.clientWidth;
      setIsScrollable(maxScroll > 2);
      if (maxScroll > 0) {
        const raw = el.scrollLeft / maxScroll;
        setScrollProgress(Math.min(1, Math.max(0, raw)));
      } else {
        setScrollProgress(0);
      }
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const raf = requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [items]);

  const scrollByCards = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('.trending-card');
    const cardW = card ? card.offsetWidth : 500;
    const gap = 24;
    el.scrollBy({ left: (cardW + gap) * direction, behavior: 'smooth' });
  };

  if (loading) return <Skeleton />;
  if (!items.length) return <Empty />;

  return (
    <section className="tn-section">
      {/* ✅ Full-width edge-to-edge header image */}
      <div className="tn-header">
        <img
          src="/homesection/TrendingNow.png"
          alt="Trending Now"
          className="tn-header-img"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      <div className="tn-scroll-wrap">
        {canScrollLeft && (
          <button className="tn-arrow tn-arrow-left" onClick={() => scrollByCards(-1)} aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {canScrollRight && (
          <button className="tn-arrow tn-arrow-right" onClick={() => scrollByCards(1)} aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        <div className="tn-scroll" ref={scrollRef}>
          {items.map(product => (
            <Card
              key={product.id}
              product={product}
              colorCache={colorCache}
              setColorCache={setColorCache}
            />
          ))}
        </div>

        {isScrollable && (
          <div className="tn-track-container">
            <div className="tn-track-line">
              <div
                className="tn-train-thumb"
                style={{
                  left: `${scrollProgress * 100}%`,
                  transform: `translateX(-${scrollProgress * 100}%)`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .tn-section {
          padding: 0 0 50px;
          background: #fff;
          overflow: hidden;
        }

        /* ✅ হেডার ইমেজ */
        .tn-header {
          width: 100%;
          height: 120px;
          margin: 20px 0 30px;
          background: #fff;
          display: block;
          position: relative;
        }

        /* ✅ শুধুমাত্র নিচের দিকের সাদা শ্যাডো (Bottom Fade) */
        .tn-header::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 40%;
          background: linear-gradient(
            to top, 
            rgba(255, 255, 255, 1) 0%, 
            rgba(255, 255, 255, 0.6) 40%,
            rgba(255, 255, 255, 0) 100%
          );
          z-index: 2;
          pointer-events: none;
        }

        .tn-header-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        /* ✅ স্লাইডার কন্টেইনার */
        .tn-scroll-wrap {
          position: relative;
        }
        .tn-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-padding-left: 24px;
          padding: 0 24px 20px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .tn-scroll::-webkit-scrollbar { display: none; }

        /* ✅ কার্ডের সাইজ (ফ্যাশন ব্র্যান্ডের মতো সরু ও লম্বা) */
        .trending-card {
          flex: 0 0 75vw;
          max-width: 480px;
          scroll-snap-align: start;
        }

        /* ✅ ট্রেন লাইন প্রগ্রেস বার */
        .tn-track-container {
          width: 100%;
          padding: 30px 20px 0;
        }
        .tn-track-line {
          width: 100%;
          height: 1.5px;
          background-color: #e0e0e0;
          position: relative;
          overflow: hidden;
        }
        .tn-train-thumb {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 80px;
          background-color: #1a1a1a;
          will-change: transform;
        }

        /* ✅ ডেস্কটপ অ্যারো */
        .tn-arrow {
          position: absolute;
          top: 45%;
          transform: translateY(-50%);
          z-index: 10;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          display: none;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1a1a1a;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .tn-arrow:hover {
          background: #1a1a1a;
          color: #fff;
          border-color: #1a1a1a;
        }
        .tn-arrow-left { left: 24px; }
        .tn-arrow-right { right: 24px; }

        @media (min-width: 640px) {
          .tn-scroll { gap: 20px; scroll-padding-left: 32px; padding: 0 32px 20px; }
          .trending-card { flex: 0 0 50vw; max-width: 420px; }
        }

        @media (min-width: 768px) {
          .tn-section { padding: 0 0 60px; }
          .tn-header { height: 180px; margin: 30px 0 40px; }
          .tn-scroll { gap: 24px; scroll-padding-left: 48px; padding: 0 48px 24px; }
          .trending-card { flex: 0 0 320px; max-width: none; }
          .tn-arrow { display: flex; }
          .tn-arrow-left { left: 32px; }
          .tn-arrow-right { right: 32px; }
          .tn-track-container { padding: 35px 48px 0; }
        }

        @media (min-width: 1024px) {
          .tn-header { height: 240px; }
          .trending-card { flex: 0 0 360px; }
        }
      `}</style>
    </section>
  );
}

function Skeleton() {
  return (
    <section className="tn-section" style={{ padding: '40px 0' }}>
      <div className="tn-header" style={{ background: '#f0f0f0', margin: '20px 0 30px' }} />
      <div style={{ display: 'flex', gap: 16, overflow: 'hidden', padding: '0 24px' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ flex: '0 0 75vw', maxWidth: 480 }}>
            <div style={{ aspectRatio: '3/4', background: 'linear-gradient(90deg, #e5e5ea 0%, #f0f0f5 40%, #e5e5ea 80%)', backgroundSize: '800px 100%', animation: 'shimmer 1.8s infinite linear' }} />
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <div style={{ height: 14, background: '#e5e5ea', width: '60%', margin: '0 auto', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } }`}</style>
    </section>
  );
}

function Empty() {
  return (
    <section className="tn-section" style={{ padding: '60px 0' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
        <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, color: '#86868b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No trending products</p>
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
  const didSwipe = useRef(false);

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
  const onTS = (e) => { startX.current = e.touches[0].clientX; didSwipe.current = false; setIsDragging(true); };
  const onTM = (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX.current;
    if (Math.abs(diff) > 8) { e.preventDefault(); didSwipe.current = true; }
    setDragOffset(diff);
  };
  const onTE = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) > 60) dragOffset < 0 && currentImage < total - 1 ? navigate(currentImage + 1) : dragOffset > 0 && currentImage > 0 ? navigate(currentImage - 1) : null;
    setDragOffset(0);
  };

  return (
    <div className="trending-card" style={{ position: 'relative', background: '#fff', cursor: 'pointer', overflow: 'hidden', touchAction: 'pan-y', userSelect: 'none' }}
      onTouchStart={total > 1 ? onTS : undefined}
      onTouchMove={total > 1 ? onTM : undefined}
      onTouchEnd={total > 1 ? onTE : undefined}
    >
      <Link href={`/product/${slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }} onClick={(e) => { if (didSwipe.current) { e.preventDefault(); e.stopPropagation(); didSwipe.current = false; } }}>
        
        {/* ✅ বড় এবং ফ্যাশন ব্র্যান্ডের মতো ইমেজ */}
        <div style={{ position: 'relative', aspectRatio: '3/4', background: '#f7f7f7', overflow: 'hidden' }}>
          {allImages.map((img, i) => (
            <img key={i} src={img} alt={product.title || ''} style={{
              position: 'absolute', top: 0,
              left: isDragging ? `calc(${(i - currentImage) * 100}% + ${dragOffset}px)` : `${(i - currentImage) * 100}%`,
              width: '100%', height: '100%', 
              objectFit: 'cover',
              objectPosition: 'center top', // ✅ ছবির উপরের অংশ (মাথা/পোশাক) কাটা যাবে না
              transition: isDragging ? 'none' : 'left 0.45s cubic-bezier(0.25,0.1,0.25,1)', willChange: 'left',
              zIndex: i === currentImage ? 2 : 1
            }} />
          ))}
          
          {isOut && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6 }}>
              <span style={{ background: '#1a1a1a', color: '#fff', fontFamily: "'Sora', 'Inter', sans-serif", fontWeight: 500, fontSize: 11, textTransform: 'uppercase', padding: '8px 16px', letterSpacing: '0.14em' }}>Sold Out</span>
            </div>
          )}
          
          {total > 1 && (
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 4 }}>
              {allImages.map((_, i) => (
                <span key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(i); }} style={{ width: i === currentImage ? 8 : 6, height: i === currentImage ? 8 : 6, borderRadius: '50%', background: i === currentImage ? '#fff' : 'rgba(255,255,255,0.55)', cursor: 'pointer', transition: 'all 0.35s ease', boxShadow: '0 0 4px rgba(0,0,0,0.1)' }} />
              ))}
            </div>
          )}
        </div>

        {/* ✅ বিশ্ব বিখ্যাত ফ্যাশন ব্র্যান্ডের মতো মিনিমাল টাইটেল */}
        <div style={{ padding: '16px 4px 4px', textAlign: 'center' }}>
          <h3 style={{ 
            fontFamily: "'Sora', 'Manrope', 'Inter', sans-serif", 
            fontWeight: 400, 
            fontSize: 13, 
            letterSpacing: '0.16em', 
            textTransform: 'uppercase', 
            color: '#1a1a1a', 
            margin: 0, 
            lineHeight: 1.4, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}>
            {product.title}
          </h3>
        </div>
      </Link>

      <style jsx>{`
        .trending-card:active { transform: scale(0.98); }
        @media (hover: hover) { 
          .trending-card:hover { transform: translateY(-4px); z-index: 2; box-shadow: 0 12px 30px rgba(0,0,0,0.1); } 
        }
        @media (min-width: 768px) {
          .trending-card div { padding-top: 20px !important; }
          .trending-card h3 { font-size: 14px !important; }
        }
      `}</style>
    </div>
  );
}
