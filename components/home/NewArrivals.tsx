'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
    const cardW = card ? card.offsetWidth : 400;
    const gap = 20;
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
          <Image src="/newarrivalicon.png" alt="New Arrivals" width={180} height={40} style={{ objectFit: 'contain' }} priority />
          <div className="na-header-divider"></div>
        </div>
        <div className="na-scroll" ref={scrollRef}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="na-card">
              <div className="na-image-wrap na-shimmer" />
              <div style={{ padding: '16px 2px 0', textAlign: 'center' }}>
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
      <div className="na-header">
        <Image src="/newarrivalicon.png" alt="New Arrivals" width={200} height={45} style={{ objectFit: 'contain' }} priority />
        {/* স্ক্রিনশটের মতো পুরো সেকশনের হেডার বা টাইটেলের নিচে কমন কালো চিকন লাইন */}
        <div className="na-header-divider"></div>
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
          padding: 60px 0 40px;
          background: #fff;
          overflow: hidden;
        }
        .na-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        /* আপনার দেওয়া স্ক্রিনশটের মতো লোগো/টাইটেলের নিচে কমন কালো চিকন লাইন */
        .na-header-divider {
          width: 60px;
          height: 1.5px;
          background-color: #1a1a1a;
          margin-top: 16px;
        }

        .na-scroll-wrap {
          position: relative;
        }
        .na-scroll {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-padding-left: 24px;
          padding: 0 24px 16px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .na-scroll::-webkit-scrollbar { display: none; }
        
        /* বড় ইমেজ কার্ড (Prada Style) */
        .na-card {
          flex: 0 0 88vw;
          max-width: 560px;
          scroll-snap-align: start;
        }

        /* Arrows */
        .na-arrow {
          position: absolute;
          top: 45%;
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
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .na-arrow:hover {
          background: #1a1a1a;
          color: #fff;
          border-color: #1a1a1a;
        }
        .na-arrow-left { left: 24px; }
        .na-arrow-right { right: 24px; }

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
          .na-card { flex: 0 0 55vw; max-width: 480px; }
        }

        @media (min-width: 768px) {
          .na-section { padding: 70px 0 50px; }
          .na-header { margin-bottom: 50px; }
          .na-header-divider { width: 80px; margin-top: 20px; }
          .na-scroll { gap: 24px; scroll-padding-left: 48px; padding: 0 48px 20px; }
          .na-card { flex: 0 0 46vw; max-width: 540px; }
          .na-arrow { display: flex; }
        }

        @media (min-width: 1024px) {
          .na-card { flex: 0 0 38vw; max-width: 580px; }
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

        {isOut && (
          <div className="na-soldout-overlay">
            <span className="na-soldout-label">Sold Out</span>
          </div>
        )}
      </div>

      {/* এখানে শুধু প্রোডাক্টের টাইটেল থাকবে */}
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
          aspect-ratio: 1/1; /* বড় ও প্রিমিয়াম লুকের জন্য */
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
          font-size: 10px;
          text-transform: uppercase;
          padding: 6px 14px;
          letter-spacing: 0.14em;
        }

        .na-info {
          padding: 18px 4px 4px;
          text-align: center;
        }
        .na-title {
          font-family: 'Sora', 'Manrope', 'Inter', sans-serif;
          font-weight: 400;
          font-size: 13px;
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
          .na-info { padding: 22px 4px 4px; }
          .na-title {
            font-size: 14px;
          }
        }
      `}</style>
    </Link>
  );
}
