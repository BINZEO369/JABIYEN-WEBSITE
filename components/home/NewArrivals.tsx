'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function NewArrivals({ products = [] }) {
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);
  const scrollRef = useRef(null);

  const maxProducts = 12;

  useEffect(() => {
    async function fetchArrivals() {
      try {
        const res = await fetch('/api/products?filter=new_arrival&limit=12');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : data?.data || data?.products || [])
          .filter(p => p.is_new_arrival === true || p.is_new_arrival === 1 || p.is_new_arrival === 'true');
        setArrivals(filtered.slice(0, maxProducts));
      } catch (e) {
        const filtered = products.filter(p => p.is_new_arrival === true || p.is_new_arrival === 1);
        setArrivals(filtered.slice(0, maxProducts));
      }
      setLoading(false);
    }

    if (products.length > 0) {
      const filtered = products.filter(p => p.is_new_arrival === true || p.is_new_arrival === 1);
      setArrivals(filtered.slice(0, maxProducts));
      setLoading(false);
    } else {
      fetchArrivals();
    }
  }, [products]);

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
  }, [arrivals]);

  const scrollByCards = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('.na-card');
    const cardW = card ? card.offsetWidth : 500;
    const gap = 24;
    el.scrollBy({ left: (cardW + gap) * direction, behavior: 'smooth' });
  };

  const getImageUrl = (product) => {
    if (product.img?.trim()) return product.img;
    if (product.image?.trim()) return product.image;
    if (product.image_url?.trim()) return product.image_url;
    return '/placeholder.png';
  };

  const getSlug = (product) => (product.slug || product.title || 'product')
    .toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

  if (loading) {
    return (
      <section className="na-section">
        <div className="na-header">
          <img
            src="/homesection/Newarrival.png"
            alt="New Arrivals"
            className="na-header-img"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        <div className="na-scroll" ref={scrollRef}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="na-card">
              <div className="na-image-wrap na-shimmer" />
              <div style={{ padding: '18px 2px 0', textAlign: 'center' }}>
                <div className="na-shimmer" style={{ height: 12, width: '60%', margin: '0 auto', borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!arrivals.length) return null;

  return (
    <section className="na-section">
      {/* ✅ Full-width edge-to-edge header image with TOP & BOTTOM shadows */}
      <div className="na-header">
        <img
          src="/homesection/Newarrival.png"
          alt="New Arrivals"
          className="na-header-img"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      <div className="na-scroll-wrap">
        {canScrollLeft && (
          <button className="na-arrow na-arrow-left" onClick={() => scrollByCards(-1)} aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {canScrollRight && (
          <button className="na-arrow na-arrow-right" onClick={() => scrollByCards(1)} aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        <div className="na-scroll" ref={scrollRef}>
          {arrivals.map(product => (
            <NewArrivalCard
              key={product.id}
              product={product}
              getImageUrl={getImageUrl}
              getSlug={getSlug}
            />
          ))}
        </div>

        {isScrollable && (
          <div className="na-track-container">
            <div className="na-track-line">
              <div
                className="na-train-thumb"
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
        .na-section {
          padding: 0 0 50px;
          background: #fff;
          overflow: hidden;
        }

        /* ✅ ব্যানার হেডার: ডান-বামে ফুল স্প্যান */
        .na-header {
          width: 100%;
          height: 140px;
          margin: 20px 0 30px;
          background: #fff;
          display: block;
          position: relative;
        }

        /* ✅ উপরের দিকের সাদা শ্যাডো (Top Fade) */
        .na-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 40%; /* উপরের ৪০% জুড়ে ফেড হবে */
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 1) 0%,
            rgba(255, 255, 255, 0.8) 40%,
            rgba(255, 255, 255, 0) 100%
          );
          z-index: 2;
          pointer-events: none;
        }

        /* ✅ নিচের দিকের সাদা শ্যাডো (Bottom Fade) */
        .na-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40%; /* নিচের ৪০% জুড়ে ফেড হবে */
          background: linear-gradient(
            to top,
            rgba(255, 255, 255, 1) 0%,
            rgba(255, 255, 255, 0.8) 40%,
            rgba(255, 255, 255, 0) 100%
          );
          z-index: 2;
          pointer-events: none;
        }

        .na-header-img {
          width: 100%;
          height: 100%;
          object-fit: cover; /* ছবি পুরো স্ক্রিনে ছড়িয়ে যাবে */
          object-position: center;
          display: block;
        }

        .na-scroll-wrap {
          position: relative;
        }
        .na-scroll {
          display: flex;
          gap: 24px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-padding-left: 32px;
          padding: 0 32px 20px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .na-scroll::-webkit-scrollbar { display: none; }

        .na-card {
          flex: 0 0 92vw;
          max-width: 680px;
          scroll-snap-align: start;
        }

        .na-track-container {
          width: 100%;
          padding: 30px 20px 0;
        }
        .na-track-line {
          width: 100%;
          height: 1.5px;
          background-color: #e0e0e0;
          position: relative;
          overflow: hidden;
        }
        .na-train-thumb {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 80px;
          background-color: #1a1a1a;
          will-change: transform;
        }

        .na-arrow {
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
        .na-arrow:hover {
          background: #1a1a1a;
          color: #fff;
          border-color: #1a1a1a;
        }
        .na-arrow-left { left: 32px; }
        .na-arrow-right { right: 32px; }

        .na-shimmer {
          background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
          background-size: 800px 100%;
          animation: naShimmer 1.8s infinite linear;
        }
        @keyframes naShimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }

        @media (min-width: 640px) {
          .na-card { flex: 0 0 65vw; max-width: 580px; }
        }

        @media (min-width: 768px) {
          .na-section { padding: 0 0 60px; }
          .na-header {
            height: 200px;
            margin: 30px 0 40px;
          }
          .na-scroll { gap: 30px; scroll-padding-left: 60px; padding: 0 60px 24px; }
          .na-card { flex: 0 0 54vw; max-width: 640px; }
          .na-arrow { display: flex; }
          .na-track-container { padding: 35px 60px 0; }
        }

        @media (min-width: 1024px) {
          .na-header {
            height: 280px;
            margin: 40px 0 50px;
          }
          .na-card { flex: 0 0 45vw; max-width: 700px; }
        }
      `}</style>
    </section>
  );
}

function NewArrivalCard({ product, getImageUrl, getSlug }) {
  const isOut = product.is_out_of_stock || product.stock === 0 || product.stock === '0';
  const slug = getSlug(product);
  const imageUrl = getImageUrl(product);

  return (
    <Link href={`/product/${encodeURIComponent(slug)}`} className="na-card-link na-card">
      <div className="na-image-wrap">
        <img src={imageUrl} alt={product.title || 'Product'} className="na-image" loading="lazy" />

        {isOut && (
          <div className="na-soldout-overlay">
            <span className="na-soldout-label">Sold Out</span>
          </div>
        )}
      </div>

      <div className="na-info">
        <h3 className="na-title">{product.title}</h3>
      </div>

      <style jsx>{`
        .na-card-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        .na-image-wrap {
          position: relative;
          aspect-ratio: 4/5;
          background: #f7f7f7;
          overflow: hidden;
        }
        .na-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .na-soldout-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
        }
        .na-soldout-label {
          background: #1a1a1a;
          color: #fff;
          font-family: 'Sora', 'Inter', sans-serif;
          font-weight: 500;
          font-size: 11px;
          text-transform: uppercase;
          padding: 8px 16px;
          letter-spacing: 0.14em;
        }

        .na-info {
          padding: 20px 4px 4px;
          text-align: center;
        }
        .na-title {
          font-family: 'Sora', 'Manrope', 'Inter', sans-serif;
          font-weight: 400;
          font-size: 14px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #1a1a1a;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        @media (hover: hover) {
          .na-card-link:hover .na-image {
            transform: scale(1.03);
          }
        }

        @media (min-width: 768px) {
          .na-info { padding: 24px 4px 4px; }
          .na-title {
            font-size: 15px;
          }
        }
      `}</style>
    </Link>
  );
}
