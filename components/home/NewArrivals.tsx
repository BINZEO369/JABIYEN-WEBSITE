'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '../currency/CurrencyProvider';

export default function NewArrivals({ products = [] }) {
  const [arrivals, setArrivals] = useState([]);
  const [colorCache, setColorCache] = useState({});
  const [loading, setLoading] = useState(true);

  const maxProducts = 8;

  useEffect(() => {
    async function fetchArrivals() {
      try {
        const res = await fetch('/api/products?filter=new_arrival&limit=8');
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

  const fetchColors = async (slug) => {
    if (colorCache[slug]) return colorCache[slug];
    try {
      const res = await fetch(`/api/product-colors?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) return [];
      const data = await res.json();
      setColorCache(prev => ({ ...prev, [slug]: data || [] }));
      return data || [];
    } catch { return []; }
  };

  const getImageUrl = (product) => {
    if (product.img?.trim()) return product.img;
    if (product.image?.trim()) return product.image;
    if (product.image_url?.trim()) return product.image_url;
    return '/placeholder.png';
  };

  const getSlug = (product) => (product.slug || product.title || 'product')
    .toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

  const getAllImages = (product, colors) => {
    const images = [];
    const main = getImageUrl(product);
    if (main !== '/placeholder.png') images.push(main);
    if (colors) {
      colors.forEach(c => {
        if (c.color_image?.trim() && !images.includes(c.color_image)) {
          images.push(c.color_image);
        }
      });
    }
    return images;
  };

  if (loading) {
    return (
      <section className="na-section">
        <div className="na-header">
          <Image 
            src="/newarrivalicon.png" 
            alt="New Arrivals" 
            width={180} 
            height={40}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <div className="na-scroll-container">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="na-card">
              <div className="na-image-wrap na-shimmer" />
              <div style={{ padding: '12px 2px' }}>
                <div className="na-shimmer" style={{ height: 11, width: '50%', borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!arrivals.length) {
    return (
      <section className="na-section">
        <div className="na-header">
          <Image 
            src="/newarrivalicon.png" 
            alt="New Arrivals" 
            width={180} 
            height={40}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 400, margin: '0 auto' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#86868b' }}>
            No new arrivals at the moment
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#b0b0b5', marginTop: 6 }}>
            Check back soon
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="na-section">
      <div className="na-header">
        <Image 
          src="/newarrivalicon.png" 
          alt="New Arrivals" 
          width={200} 
          height={45}
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>

      <div className="na-scroll-container">
        {arrivals.map(product => (
          <NewArrivalCard
            key={product.id}
            product={product}
            fetchColors={fetchColors}
            getImageUrl={getImageUrl}
            getSlug={getSlug}
            getAllImages={getAllImages}
          />
        ))}
      </div>

      <style jsx>{`
        .na-section {
          padding: 40px 0 20px;
          background: #fff;
          overflow: hidden;
        }
        .na-header {
          text-align: center;
          margin-bottom: 24px;
          padding: 0 16px;
        }
        .na-scroll-container {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-padding-left: 16px;
          padding: 0 16px 16px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .na-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .na-card {
          flex: 0 0 78vw;
          max-width: 340px;
          scroll-snap-align: start;
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

        @media (min-width: 768px) {
          .na-section { padding: 56px 0 30px; }
          .na-header { margin-bottom: 32px; }
          .na-scroll-container {
            gap: 16px;
            padding: 0 32px 20px;
            scroll-padding-left: 32px;
            scrollbar-width: thin;
            scrollbar-color: #e5e5e5 transparent;
          }
          .na-scroll-container::-webkit-scrollbar {
            display: block;
            height: 4px;
          }
          .na-scroll-container::-webkit-scrollbar-track {
            background: transparent;
          }
          .na-scroll-container::-webkit-scrollbar-thumb {
            background: #e5e5e5;
            border-radius: 2px;
          }
          .na-card { flex: 0 0 300px; }
        }

        @media (min-width: 1024px) {
          .na-scroll-container {
            gap: 20px;
            padding: 0 48px 24px;
            scroll-padding-left: 48px;
          }
          .na-card { flex: 0 0 320px; }
        }
      `}</style>
    </section>
  );
}

function NewArrivalCard({ product, getImageUrl, getSlug, getAllImages, fetchColors }) {
  const { formatMoney } = useCurrency();
  const [colors, setColors] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const startX = useRef(0);
  const didSwipe = useRef(false);

  const isOut = product.is_out_of_stock || product.stock === 0 || product.stock === '0';
  const slug = getSlug(product);
  const allImages = getAllImages(product, colors);
  const totalImages = allImages.length;

  useEffect(() => {
    fetchColors(slug).then(c => {
      setColors(c);
      setLoaded(true);
    });
  }, [slug, fetchColors]);

  const navigate = (index) => {
    if (index < 0 || index >= totalImages) return;
    setCurrentImage(index);
    setDragOffset(0);
  };

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    didSwipe.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX.current;
    if (Math.abs(diff) > 8) {
      e.preventDefault();
      didSwipe.current = true;
    }
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) > 50) {
      if (dragOffset < 0 && currentImage < totalImages - 1) navigate(currentImage + 1);
      else if (dragOffset > 0 && currentImage > 0) navigate(currentImage - 1);
    }
    setDragOffset(0);
  };

  return (
    <Link
      href={`/product/${encodeURIComponent(slug)}`}
      className="na-card-link"
      onTouchStart={totalImages > 1 ? handleTouchStart : undefined}
      onTouchMove={totalImages > 1 ? handleTouchMove : undefined}
      onTouchEnd={totalImages > 1 ? handleTouchEnd : undefined}
      onClick={(e) => {
        if (didSwipe.current) {
          e.preventDefault();
          e.stopPropagation();
          didSwipe.current = false;
        }
      }}
    >
      {/* Image — big, edge to edge, title overlay */}
      <div className="na-image-wrap">
        {allImages.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={product.title || 'Product'}
            className="na-image"
            style={{
              left: isDragging
                ? `calc(${(i - currentImage) * 100}% + ${dragOffset}px)`
                : `${(i - currentImage) * 100}%`,
              transition: isDragging ? 'none' : 'left 0.45s cubic-bezier(0.25,0.1,0.25,1)',
              zIndex: i === currentImage ? 2 : 1,
            }}
            loading="lazy"
          />
        ))}

        {/* ✅ Title overlay — small, luxury, on image */}
        <div className="na-title-overlay">
          <h3 className="na-title">{product.title}</h3>
        </div>

        {/* Image dots — top-right corner */}
        {totalImages > 1 && (
          <div className="na-dots">
            {allImages.map((_, i) => (
              <span
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(i);
                }}
                className={`na-dot ${i === currentImage ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        {/* Sold out */}
        {isOut && (
          <div className="na-soldout-overlay">
            <span className="na-soldout-label">Sold Out</span>
          </div>
        )}
      </div>

      {/* Info below — price + colors, luxury compact */}
      <div className="na-info">
        <span className="na-price">{formatMoney(product.price || 0)}</span>
        {loaded && colors.length > 0 && (
          <div className="na-colors">
            {colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                title={c.color_name}
                className="na-color-dot"
                style={{ backgroundColor: c.color_code || '#ccc' }}
              />
            ))}
          </div>
        )}
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
          background: #f5f5f7;
          overflow: hidden;
        }
        .na-image {
          position: absolute;
          top: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          will-change: left;
        }

        /* ✅ Title overlay — luxury fashion brand style */
        .na-title-overlay {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 32px 14px 14px;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.5) 0%,
            rgba(0, 0, 0, 0.2) 60%,
            transparent 100%
          );
          z-index: 3;
          pointer-events: none;
        }
        .na-title {
          font-family: 'Sora', 'Manrope', 'Inter', sans-serif;
          font-weight: 400;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #ffffff;
          margin: 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
        }

        /* Image dots */
        .na-dots {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 4px;
          z-index: 4;
        }
        .na-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          transition: all 0.3s ease;
          cursor: pointer;
          box-shadow: 0 0 3px rgba(0, 0, 0, 0.25);
        }
        .na-dot.active {
          width: 14px;
          border-radius: 2px;
          background: #ffffff;
        }

        /* Sold out */
        .na-soldout-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }
        .na-soldout-label {
          background: #1a1a1a;
          color: #fff;
          font-family: 'Sora', 'Inter', sans-serif;
          font-weight: 500;
          font-size: 9px;
          text-transform: uppercase;
          padding: 6px 14px;
          letter-spacing: 0.14em;
        }

        /* Info below — compact luxury */
        .na-info {
          padding: 12px 2px 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .na-price {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 12px;
          color: #1a1a1a;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .na-colors {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        .na-color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.08);
          flex-shrink: 0;
        }

        @media (hover: hover) {
          .na-card-link:hover .na-image {
            transform: scale(1.03);
          }
          .na-image {
            transition: transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1);
          }
        }

        @media (min-width: 768px) {
          .na-title-overlay {
            padding: 36px 16px 16px;
          }
          .na-title {
            font-size: 11px;
            letter-spacing: 0.2em;
          }
          .na-price {
            font-size: 13px;
          }
          .na-color-dot {
            width: 11px;
            height: 11px;
          }
          .na-info {
            padding: 14px 2px 6px;
          }
        }
      `}</style>
    </Link>
  );
}
