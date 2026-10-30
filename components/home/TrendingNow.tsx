'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function TrendingNow({ products = [] }) {
  const [items, setItems] = useState([]);
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
    const gap = 16; 
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

        {/* ✅ স্লাইডার কন্টেইনার */}
        <div className="tn-scroll" ref={scrollRef}>
          {items.map((product) => (
            <Card key={product.id} product={product} />
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
          align-items: stretch;
        }
        .tn-scroll::-webkit-scrollbar { display: none; }

        /* ✅ কার্ডের সাইজ */
        .trending-card {
          flex: 0 0 72vw; 
          max-width: 360px;
          scroll-snap-align: start;
          display: flex; 
          flex-direction: column;
          flex-shrink: 0;
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
          .trending-card { flex: 0 0 45vw; max-width: 320px; }
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
      <div style={{ display: 'flex', gap: 16, overflow: 'hidden', padding: '0 24px', alignItems: 'stretch' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ flex: '0 0 72vw', maxWidth: 360, display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', width: '100%', paddingBottom: '133.3333%', background: 'linear-gradient(90deg, #e5e5ea 0%, #f0f0f5 40%, #e5e5ea 80%)', backgroundSize: '800px 100%', animation: 'shimmer 1.8s infinite linear' }} />
            <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
              <div style={{ height: 14, background: '#e5e5ea', width: '60%', borderRadius: 4 }} />
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

function Card({ product }) {
  const isOut = product.is_out_of_stock || product.stock === 0 || product.stock === '0';
  const slug = (product.slug || product.title || 'product').toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
  const mainImg = product.img || product.image || product.image_url || '/placeholder.png';

  return (
    <div className="trending-card">
      <Link href={`/product/${slug}`} className="card-link">
        
        {/* ✅ ইমেজ বক্স: padding-bottom ট্রিক দিয়ে সাইজ ১০০% লক করা হয়েছে */}
        <div className="image-wrap">
          <img 
            src={mainImg} 
            alt={product.title || 'Product'} 
            className="product-image" 
          />
          
          <div className="hover-overlay">
            <span className="explore-text">Explore</span>
          </div>

          {isOut && (
            <div className="soldout-overlay">
              <span className="soldout-badge">Sold Out</span>
            </div>
          )}
        </div>

        {/* ✅ ইনফো (শুধুমাত্র টাইটেল) */}
        <div className="info-wrap">
          <h3 className="product-title">{product.title}</h3>
        </div>
      </Link>

      <style jsx>{`
        .trending-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        
        .card-link {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          width: 100%;
        }

        /* ✅ ইমেজ বক্স: padding-bottom ট্রিক (100% নির্ভুল সাইজ) */
        .image-wrap {
          position: relative;
          width: 100%;
          padding-bottom: 133.3333%; /* ✅ 3:4 Aspect Ratio */
          background: #f7f7f7;
          overflow: hidden;
          border: 1px solid #f0f0f0; 
          flex-shrink: 0;
          box-sizing: border-box;
        }

        /* ✅ ইমেজ: একদম নিখুঁত ফিট */
        .product-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top; 
          display: block;
          transition: transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        /* ✅ Hover Overlay */
        .hover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 1;
        }

        .explore-text {
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          transform: translateY(10px);
          transition: transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        @media (hover: hover) {
          .card-link:hover .product-image {
            transform: scale(1.03);
          }
          .card-link:hover .hover-overlay {
            opacity: 1;
          }
          .card-link:hover .explore-text {
            transform: translateY(0);
          }
        }

        .soldout-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .soldout-badge {
          background: #1a1a1a;
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 8px 16px;
        }

        /* ✅ ইনফো স্টাইল (Fixed Height, Centered) */
        .info-wrap {
          height: 56px;
          padding: 0 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .product-title {
          font-family: 'Sora', 'Manrope', 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #1a1a1a;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
          width: 100%;
        }

        @media (min-width: 768px) {
          .info-wrap { height: 64px; }
          .product-title { font-size: 12px; }
        }
      `}</style>
    </div>
  );
}
