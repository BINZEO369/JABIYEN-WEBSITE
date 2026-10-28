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
    const cardW = card ? card.offsetWidth : 300;
    const gap = 16;
    el.scrollBy({ left: (cardW + gap) * 1 * direction, behavior: 'smooth' });
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
        <div className="na-scroll" ref={scrollRef}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="na-card">
              <div className="na-image-wrap na-shimmer" />
              <div style={{ padding: '16px 0' }}>
                <div className="na-shimmer" style={{ height: 12, width: '50%', borderRadius: 2, margin: '0 auto' }} />
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
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-padding-left: 16px;
          padding: 0 16px 8px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .na-scroll::-webkit-scrollbar { display: none; }
        
        /* ইমেজ অনেক বড় করার জন্য flex বাড়ানো হয়েছে */
        .na-card {
          flex: 0 0 85vw; /* মোবাইলে ৮৫% জায়গা নিবে */
          max-width: 450px; /* ম্যাক্সিমাম সাইজ */
          scroll-snap-align: center; /* সেন্টারে স্ন্যাপ করবে */
        }

        /* Arrows — desktop only */
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
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
        }
        .na-arrow:hover {
          background: #1a1a1a;
          color: #fff;
          border-color: #1a1a1a;
        }
        .na-arrow-left { left: 20px; }
        .na-arrow-right { right: 20px; }

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
          .na-scroll { gap: 20px; scroll-padding-left: 24px; padding: 0 24px 8px; }
          .na-card { flex: 0 0 50vw; max-width: 350px; }
        }

        @media (min-width: 768px) {
          .na-section { padding: 56px 0 32px; }
          .na-header { margin-bottom: 36px; }
          .na-scroll { gap: 24px; scroll-padding-left: 32px; padding: 0 32px 12px; }
          .na-card { flex: 0 0 35vw; max-width: 380px; }
          .na-arrow { display: flex; }
          .na-arrow-left { left: 20px; }
          .na-arrow-right { right: 20px; }
        }

        @media (min-width: 1024px) {
          .na-scroll { gap: 32px; scroll-padding-left: 48px; padding: 0 48px 16px; }
          .na-card { flex: 0 0 30vw; max-width: 420px; }
          .na-arrow-left { left: 28px; }
          .na-arrow-right { right: 28px; }
        }

        @media (min-width: 1280px) {
          .na-card { flex: 0 0 25vw; max-width: 450px; }
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
      {/* ইমেজ কন্টেইনার - সাইজ ফিক্সড করা হয়েছে যাতে সব সমান দেখায় */}
      <div className="na-image-wrap">
        <img src={imageUrl} alt={product.title || 'Product'} className="na-image" loading="lazy" />

        {isOut && (
          <div className="na-soldout-overlay">
            <span className="na-soldout-label">Sold Out</span>
          </div>
        )}
      </div>

      {/* শুধুমাত্র টাইটেল - দাম বা কালার ডট নেই */}
      <div className="na-info">
        <h3 className="na-title">{product.title}</h3>
      </div>

      <style jsx>{`
        .na-card-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        
        /* 4/5 অ্যাসপেক্ট রেশিও দেওয়া হয়েছে যাতে সব ছবি একই সাইজের হয় */
        .na-image-wrap {
          position: relative;
          aspect-ratio: 4 / 5; 
          background: #f5f5f7;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .na-image {
          width: 100%;
          height: 100%;
          object-fit: cover; /* ছবি পুরো বক্স জুড়ে থাকবে, কোনো ছোট-বড় গ্যাপ থাকবে না */
          display: block;
          transition: transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .na-soldout-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.55);
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
          padding: 6px 16px;
          letter-spacing: 0.14em;
        }

        /* টাইটেল সেন্টারে থাকবে */
        .na-info {
          padding: 16px 10px 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        
        .na-title {
          font-family: 'Sora', 'Manrope', 'Inter', sans-serif;
          font-weight: 500;
          font-size: 13px; /* টাইটেল ফন্ট সাইজ বড় করা হয়েছে */
          letter-spacing: 0.05em;
          color: #1a1a1a;
          margin: 0;
          line-height: 1.4;
          text-transform: capitalize; /* Prada স্টাইলের জন্য */
          display: -webkit-box;
          -webkit-line-clamp: 2; /* সর্বোচ্চ ২ লাইন দেখাবে */
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @media (hover: hover) {
          .na-card-link:hover .na-image {
            transform: scale(1.03);
          }
        }

        @media (min-width: 768px) {
          .na-info { padding: 20px 10px 10px; }
          .na-title {
            font-size: 14px;
            letter-spacing: 0.08em;
          }
        }
      `}</style>
    </Link>
  );
}
