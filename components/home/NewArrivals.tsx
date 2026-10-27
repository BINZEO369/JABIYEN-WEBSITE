'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '../currency/CurrencyProvider';

export default function NewArrivals({ products = [] }) {
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
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

  // Track scroll state for arrows
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      setCanScrollLeft(el.scrollLeft > 2);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [arrivals]);

  const scrollByCards = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('.na-card');
    const cardW = card ? card.offsetWidth : 260;
    const gap = 12;
    el.scrollBy({ left: (cardW + gap) * 2 * direction, behavior: 'smooth' });
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
          <Image src="/newarrivalicon.png" alt="New Arrivals" width={180} height={40} style={{ objectFit: 'contain' }} priority />
        </div>
        <div className="na-scroll">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="na-card">
              <div className="na-image-wrap na-shimmer" />
              <div className="na-underline" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!arrivals.length) return null;

  return (
    <section className="na-section">
      <div className="na-header">
        <Image src="/newarrivalicon.png" alt="New Arrivals" width={200} height={45} style={{ objectFit: 'contain' }} priority />
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
      </div>

      <style jsx>{`
        .na-section {
          padding: 40px 0 24px;
          background: #fff;
          overflow: hidden;
        }
        .na-header {
          text-align: center;
          margin-bottom: 28px;
          padding: 0 16px;
        }
        .na-scroll-wrap {
          position: relative;
        }
        .na-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-padding-left: 12px;
          padding: 0 12px 8px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          align-items: flex-start;
        }
        .na-scroll::-webkit-scrollbar { display: none; }

        /* ✅ Fixed card size — same aspect ratio for all */
        .na-card {
          flex: 0 0 72vw;
          max-width: 340px;
          scroll-snap-align: start;
        }

        .na-arrow {
          position: absolute;
          top: 40%;
          transform: translateY(-50%);
          z-index: 10;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          display: none;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1a1a1a;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
        }
        .na-arrow:hover {
          background: #1a1a1a;
          color: #fff;
          border-color: #1a1a1a;
        }
        .na-arrow-left { left: 20px; }
        .na-arrow-right { right: 20px; }

        .na-underline {
          height: 1px;
          background: #e0e0e0;
          margin-top: 14px;
          width: 100%;
        }

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
          .na-scroll { gap: 10px; scroll-padding-left: 20px; padding: 0 20px 8px; }
          .na-card { flex: 0 0 45vw; max-width: 320px; }
        }

        @media (min-width: 768px) {
          .na-section { padding: 56px 0 32px; }
          .na-header { margin-bottom: 36px; }
          .na-scroll { gap: 12px; scroll-padding-left: 32px; padding: 0 32px 12px; }
          .na-card { flex: 0 0 260px; max-width: none; }
          .na-arrow { display: flex; }
        }

        @media (min-width: 1024px) {
          .na-scroll { gap: 14px; scroll-padding-left: 48px; padding: 0 48px 16px; }
          .na-card { flex: 0 0 300px; }
          .na-arrow-left { left: 28px; }
          .na-arrow-right { right: 28px; }
        }

        @media (min-width: 1280px) {
          .na-card { flex: 0 0 340px; }
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
    <Link href={`/product/${encodeURIComponent(slug)}`} className="na-card-link">
      <div className="na-image-wrap">
        <img src={imageUrl} alt={product.title || 'Product'} className="na-image" loading="lazy" />

        {/* ✅ Dark overlay for title readability */}
        <div className="na-dark-overlay" />

        {/* ✅ Title on image — luxury fashion style */}
        <div className="na-title-on-image">
          <h3 className="na-title">{product.title}</h3>
        </div>

        {isOut && (
          <div className="na-soldout-overlay">
            <span className="na-soldout-label">Sold Out</span>
          </div>
        )}
      </div>

      {/* ✅ Underline below each image */}
      <div className="na-underline" />

      <style jsx>{`
        .na-card-link {
          display: block;
          flex: 0 0 72vw;
          max-width: 340px;
          scroll-snap-align: start;
          text-decoration: none;
          color: inherit;
        }

        /* ✅ Fixed aspect ratio — every card is identical size */
        .na-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4/5;
          background: #f5f5f7;
          overflow: hidden;
        }
        .na-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        /* ✅ Dark gradient overlay — bottom for title */
        .na-dark-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.72) 0%,
            rgba(0, 0, 0, 0.45) 30%,
            rgba(0, 0, 0, 0.15) 55%,
            transparent 75%
          );
          z-index: 2;
          pointer-events: none;
          transition: opacity 0.4s ease;
        }

        /* ✅ Title overlay — bottom-left of image */
        .na-title-on-image {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 20px 16px 16px;
          z-index: 3;
          pointer-events: none;
        }
        .na-title {
          font-family: 'Sora', 'Manrope', 'Inter', sans-serif;
          font-weight: 400;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #ffffff;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
        }

        /* Sold out */
        .na-soldout-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 4;
        }
        .na-soldout-label {
          background: #ffffff;
          color: #1a1a1a;
          font-family: 'Sora', 'Inter', sans-serif;
          font-weight: 500;
          font-size: 9px;
          text-transform: uppercase;
          padding: 6px 14px;
          letter-spacing: 0.14em;
        }

        /* ✅ Underline below image */
        .na-underline {
          height: 1px;
          background: #e0e0e0;
          margin-top: 14px;
          width: 100%;
          transition: background 0.3s ease;
        }

        @media (hover: hover) {
          .na-card-link:hover .na-image {
            transform: scale(1.04);
          }
          .na-card-link:hover .na-underline {
            background: #1a1a1a;
          }
        }

        @media (min-width: 640px) {
          .na-card-link { flex: 0 0 45vw; max-width: 320px; }
        }

        @media (min-width: 768px) {
          .na-card-link { flex: 0 0 260px; max-width: none; }
        }

        @media (min-width: 1024px) {
          .na-card-link { flex: 0 0 300px; }
        }

        @media (min-width: 1280px) {
          .na-card-link { flex: 0 0 340px; }
        }

        @media (min-width: 768px) {
          .na-title-on-image {
            padding: 24px 18px 18px;
          }
          .na-title {
            font-size: 12px;
            letter-spacing: 0.18em;
          }
          .na-underline {
            margin-top: 16px;
          }
        }
      `}</style>
    </Link>
  );
}
