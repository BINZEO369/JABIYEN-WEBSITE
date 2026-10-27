'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const WISHLIST_KEY = 'jayen_wishlist';

function readWishlist() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
  } catch {
    return [];
  }
}

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
      } catch {
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
    const cardW = card ? card.offsetWidth : 280;
    el.scrollBy({ left: (cardW + 12) * 2 * direction, behavior: 'smooth' });
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
          {[...Array(4)].map((_, i) => (
            <div key={i} className="na-card">
              <div className="na-image-wrap na-shimmer" />
              <div className="na-underline-skeleton na-shimmer" />
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {canScrollRight && (
          <button className="na-arrow na-arrow-right" onClick={() => scrollByCards(1)} aria-label="Next">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
          margin-bottom: 24px;
          padding: 0 16px;
        }
        .na-scroll-wrap {
          position: relative;
        }
        .na-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-padding-left: 16px;
          padding: 0 16px 8px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .na-scroll::-webkit-scrollbar {
          display: none;
        }
        .na-card {
          flex: 0 0 78vw;
          scroll-snap-align: start;
        }
        .na-underline-skeleton {
          height: 1px;
          margin-top: 10px;
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

        .na-arrow {
          position: absolute;
          top: 45%;
          transform: translateY(-50%);
          z-index: 10;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          display: none;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1a1a1a;
          transition: all 0.2s ease;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
        }
        .na-arrow:hover {
          background: #1a1a1a;
          color: #fff;
          border-color: #1a1a1a;
        }
        .na-arrow-left { left: 20px; }
        .na-arrow-right { right: 20px; }

        @media (min-width: 640px) {
          .na-scroll {
            gap: 12px;
            scroll-padding-left: 24px;
            padding: 0 24px 8px;
          }
          .na-card { flex: 0 0 46vw; }
        }

        @media (min-width: 768px) {
          .na-section { padding: 56px 0 32px; }
          .na-header { margin-bottom: 32px; }
          .na-scroll {
            gap: 16px;
            scroll-padding-left: 32px;
            padding: 0 32px 12px;
          }
          .na-card { flex: 0 0 300px; }
          .na-arrow { display: flex; }
        }

        @media (min-width: 1024px) {
          .na-scroll {
            gap: 20px;
            scroll-padding-left: 48px;
            padding: 0 48px 16px;
          }
          .na-card { flex: 0 0 320px; }
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
  const [isLiked, setIsLiked] = useState(false);
  const isOut = product.is_out_of_stock || product.stock === 0 || product.stock === '0';
  const slug = getSlug(product);
  const imageUrl = getImageUrl(product);

  useEffect(() => {
    const list = readWishlist();
    setIsLiked(list.includes(product.id));
  }, [product.id]);

  const toggleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const list = readWishlist();
    let next;
    if (list.includes(product.id)) {
      next = list.filter((id) => id !== product.id);
      setIsLiked(false);
    } else {
      next = [...list, product.id];
      setIsLiked(true);
    }
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <Link href={`/product/${encodeURIComponent(slug)}`} className="na-card-link">
      <div className="na-image-wrap">
        <img
          src={imageUrl}
          alt={product.title || 'Product'}
          className="na-image"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.png';
          }}
        />

        {/* Shortcut like button — always visible */}
        <button
          className={`na-like ${isLiked ? 'liked' : ''}`}
          onClick={toggleLike}
          aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Sold out */}
        {isOut && (
          <div className="na-soldout">
            <span className="na-soldout-label">Sold Out</span>
          </div>
        )}

        {/* Title overlay — slides up over image */}
        <div className="na-title-overlay">
          <span className="na-title">{product.title}</span>
        </div>
      </div>

      {/* Underline below image */}
      <div className="na-underline" />

      <style jsx>{`
        .na-card-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        .na-image-wrap {
          position: relative;
          aspect-ratio: 3/4;
          background: #f5f5f7;
          overflow: hidden;
        }
        .na-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        /* Like shortcut */
        .na-like {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 6;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1a1a1a;
          transition: transform 0.2s ease, background 0.2s ease;
          padding: 0;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }
        .na-like:hover { transform: scale(1.08); }
        .na-like.liked { color: #ef4444; }

        /* Sold out overlay */
        .na-soldout {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 4;
        }
        .na-soldout-label {
          background: #1a1a1a;
          color: #fff;
          font-family: 'Sora', 'Inter', sans-serif;
          font-weight: 500;
          font-size: 8px;
          text-transform: uppercase;
          padding: 5px 12px;
          letter-spacing: 0.14em;
        }

        /* Title overlay — hidden below image, slides up on hover */
        .na-title-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 44px 12px 12px;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.6) 0%,
            rgba(0, 0, 0, 0.15) 60%,
            transparent 100%
          );
          z-index: 3;
          pointer-events: none;
          transform: translateY(100%) scale(0.94);
          transform-origin: bottom center;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .na-title {
          display: block;
          font-family: 'Sora', 'Inter', sans-serif;
          font-weight: 400;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #ffffff;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Underline below image */
        .na-underline {
          height: 1px;
          background: #e5e5e5;
          margin-top: 10px;
          transition: background 0.3s ease;
        }

        /* Hover: image zoom + title slide up + underline becomes black */
        @media (hover: hover) {
          .na-card-link:hover .na-image {
            transform: scale(1.04);
          }
          .na-card-link:hover .na-title-overlay {
            transform: translateY(0) scale(1);
          }
          .na-card-link:hover .na-underline {
            background: #1a1a1a;
          }
        }

        /* Touch devices — title always visible since no hover */
        @media (hover: none) {
          .na-title-overlay {
            transform: translateY(0) scale(1);
          }
        }

        @media (min-width: 768px) {
          .na-like {
            width: 34px;
            height: 34px;
            top: 12px;
            right: 12px;
          }
          .na-title {
            font-size: 11px;
            letter-spacing: 0.18em;
          }
          .na-title-overlay {
            padding: 52px 14px 14px;
          }
          .na-underline {
            margin-top: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .na-image,
          .na-title-overlay,
          .na-like,
          .na-underline {
            transition: none !important;
          }
        }
      `}</style>
    </Link>
  );
}
