'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

export default function NewArrivals({ products = [] }) {
  const [arrivals, setArrivals] = useState([]);
  const [colorCache, setColorCache] = useState({});
  const [loading, setLoading] = useState(true);

  const maxProducts = 8;

  // Fetch products if not provided
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
        // Use props
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

  // Fetch product colors
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
    if (product.img && product.img.trim()) return product.img;
    if (product.image && product.image.trim()) return product.image;
    if (product.image_url && product.image_url.trim()) return product.image_url;
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
      <section style={{ padding: '32px 0', maxWidth: '100%', margin: '0 auto', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: '#1d1d1f' }}>New Arrivals</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: '#fff', overflow: 'hidden' }}>
              <div style={{ aspectRatio: '4/5', background: 'linear-gradient(90deg, #e5e5ea 0%, #f0f0f5 40%, #e5e5ea 80%)', backgroundSize: '800px 100%', animation: 'shimmer 1.8s infinite linear' }} />
              <div style={{ padding: '4px 6px 6px' }}>
                <div style={{ height: 13, background: '#e5e5ea', borderRadius: 4, width: '85%', margin: '0 auto' }} />
              </div>
              <style>{`@keyframes shimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } }`}</style>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!arrivals.length) {
    return (
      <section style={{ padding: '32px 0', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: '#1d1d1f' }}>New Arrivals</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 400, margin: '0 auto' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ margin: '0 auto 16px', opacity: 0.4 }}>
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#86868b' }}>No new arrivals at the moment</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#b0b0b5', marginTop: 6 }}>Check back soon for fresh styles</p>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: '32px 0', maxWidth: 1400, margin: '0 auto', background: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: 20, padding: '0 8px' }}>
        <h2 style={{
          fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: '#1d1d1f',
          letterSpacing: '-0.3px'
        }}>
          New Arrivals
        </h2>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, width: '100%'
      }}
        className="new-arrivals-grid"
      >
        {arrivals.map(product => (
          <NewArrivalCard
            key={product.id}
            product={product}
            colorCache={colorCache}
            fetchColors={fetchColors}
            getImageUrl={getImageUrl}
            getSlug={getSlug}
            getAllImages={getAllImages}
          />
        ))}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .new-arrivals-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .new-arrivals-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}

// Individual Product Card Component
function NewArrivalCard({ product, getImageUrl, getSlug, getAllImages, fetchColors, colorCache }) {
  const [colors, setColors] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const cardRef = useRef(null);
  const startX = useRef(0);

  const isOut = product.is_out_of_stock || product.stock === 0 || product.stock === '0';
  const slug = getSlug(product);
  const mainImg = getImageUrl(product);
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
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) > 60) {
      if (dragOffset < 0 && currentImage < totalImages - 1) navigate(currentImage + 1);
      else if (dragOffset > 0 && currentImage > 0) navigate(currentImage - 1);
    }
    setDragOffset(0);
  };

  return (
    <div
      ref={cardRef}
      style={{
        position: 'relative', background: '#fff', cursor: 'pointer', overflow: 'hidden',
        transition: 'transform 0.3s'
      }}
      className="new-arrival-card"
      onTouchStart={totalImages > 1 ? handleTouchStart : undefined}
      onTouchMove={totalImages > 1 ? handleTouchMove : undefined}
      onTouchEnd={totalImages > 1 ? handleTouchEnd : undefined}
    >
      <Link href={`/product/${encodeURIComponent(slug)}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '4/5', background: '#f5f5f7', overflow: 'hidden', marginBottom: 6 }}>
          {allImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={product.title || 'Product'}
              style={{
                position: 'absolute', top: 0,
                left: isDragging ? `calc(${(i - currentImage) * 100}% + ${dragOffset}px)` : `${(i - currentImage) * 100}%`,
                width: '100%', height: '100%', objectFit: 'cover',
                transition: isDragging ? 'none' : 'left 0.45s cubic-bezier(0.25,0.1,0.25,1)',
                opacity: 1, display: 'block', color: 'transparent', zIndex: i === currentImage ? 2 : 1
              }}
              loading="lazy"
            />
          ))}

          {/* Badge */}
          {!isOut && (product.is_new_arrival === true || product.is_new_arrival === 1) && (
            <span style={{
              position: 'absolute', top: 4, left: 4, zIndex: 5,
              padding: '2px 7px', fontFamily: "'Sora', sans-serif", fontWeight: 600,
              fontSize: 8, textTransform: 'uppercase', background: '#fff', color: '#1d1d1f',
              letterSpacing: '0.5px', borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              New
            </span>
          )}

          {!isOut && (product.is_on_sale === true || product.is_on_sale === 1) && (
            <span style={{
              position: 'absolute', top: 4, left: 4, zIndex: 5,
              padding: '2px 7px', fontFamily: "'Sora', sans-serif", fontWeight: 600,
              fontSize: 8, textTransform: 'uppercase', background: '#fff', color: '#d70015',
              letterSpacing: '0.5px', borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              Sale
            </span>
          )}

          {/* Sold Out */}
          {isOut && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6
            }}>
              <span style={{
                background: '#1d1d1f', color: '#fff', fontFamily: "'Inter', sans-serif",
                fontWeight: 700, fontSize: 9, textTransform: 'uppercase',
                padding: '5px 14px', letterSpacing: '1px'
              }}>
                Sold Out
              </span>
            </div>
          )}

          {/* Dots */}
          {totalImages > 1 && (
            <div style={{
              position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 6, zIndex: 4
            }}>
              {allImages.map((_, i) => (
                <span
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(i); }}
                  style={{
                    width: i === currentImage ? 8 : 6, height: i === currentImage ? 8 : 6,
                    borderRadius: '50%',
                    background: i === currentImage ? '#fff' : 'rgba(255,255,255,0.55)',
                    cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    transition: 'all 0.35s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{ padding: '4px 6px 6px' }}>
          <h3 style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 600,
            fontSize: 13, color: '#1d1d1f', lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', margin: 0, textAlign: 'center'
          }}>
            {product.title}
          </h3>

          {/* Color Dots */}
          {loaded && colors.length > 0 && (
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              {colors.map((c, i) => (
                <span
                  key={i}
                  title={c.color_name}
                  style={{
                    width: 11, height: 11, borderRadius: '50%',
                    backgroundColor: c.color_code || '#ccc',
                    border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      <style jsx>{`
        .new-arrival-card:active { transform: scale(0.98); }
        @media (hover: hover) {
          .new-arrival-card:hover { transform: translateY(-2px); z-index: 2; box-shadow: 0 8px 25px rgba(0,0,0,0.12); }
        }
      `}</style>
    </div>
  );
}
