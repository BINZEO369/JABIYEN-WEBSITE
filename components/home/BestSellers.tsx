'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';

const MAX_PRODUCTS = 8;

/* 🔥 module-level cache — component unmount হলেও থাকে, in-flight request dedupe করে */
const colorCache = new Map();
const colorPromises = new Map();

async function fetchColorsCached(slug) {
  if (!slug) return [];
  if (colorCache.has(slug)) return colorCache.get(slug);
  if (colorPromises.has(slug)) return colorPromises.get(slug);

  const promise = fetch(`/api/product-colors?slug=${encodeURIComponent(slug)}`)
    .then((r) => (r.ok ? r.json() : []))
    .then((d) => {
      const arr = Array.isArray(d) ? d : [];
      colorCache.set(slug, arr);
      colorPromises.delete(slug);
      return arr;
    })
    .catch(() => {
      colorPromises.delete(slug);
      return [];
    });

  colorPromises.set(slug, promise);
  return promise;
}

function isBest(p) {
  const v = p?.is_best;
  return v === true || v === 1 || v === 'true' || v === '1';
}

function normalizeSlug(product) {
  return (product.slug || product.title || 'product')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getImageUrl(product) {
  if (product.img?.trim()) return product.img;
  if (product.image?.trim()) return product.image;
  if (product.image_url?.trim()) return product.image_url;
  return '/placeholder.png';
}

export default function BestSellers({ products = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        let all = [];
        if (Array.isArray(products) && products.length > 0) {
          all = products;
        } else {
          const res = await fetch('/api/products', { signal: controller.signal });
          if (!res.ok) throw new Error('API error');
          const data = await res.json();
          all = Array.isArray(data) ? data : data?.data || data?.products || [];
        }
        if (cancelled) return;

        const filtered = all
          .filter(isBest)
          .sort(
            (a, b) =>
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime()
          )
          .slice(0, MAX_PRODUCTS);

        setItems(filtered);
      } catch (err) {
        if (cancelled || err.name === 'AbortError') return;
        const fallback = (products || []).filter(isBest).slice(0, MAX_PRODUCTS);
        setItems(fallback);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [products]);

  if (loading) {
    return (
      <section style={{ padding: '32px 0', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: '#1d1d1f' }}>Best Sellers</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: '#fff' }}>
              <div style={{ aspectRatio: '4/5', background: 'linear-gradient(90deg, #e5e5ea 0%, #f0f0f5 40%, #e5e5ea 80%)', backgroundSize: '800px 100%', animation: 'shimmer 1.8s infinite linear' }} />
              <div style={{ padding: '4px 6px' }}><div style={{ height: 13, background: '#e5e5ea', width: '85%', margin: '0 auto', borderRadius: 4 }} /></div>
            </div>
          ))}
        </div>
        <style>{`@keyframes shimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } }`}</style>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section style={{ padding: '32px 0', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: '#1d1d1f' }}>Best Sellers</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 400, margin: '0 auto' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ margin: '0 auto 16px', opacity: 0.4 }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#86868b' }}>No best sellers right now</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#b0b0b5', marginTop: 6 }}>Top picks coming soon — stay tuned</p>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: '32px 0', maxWidth: 1400, margin: '0 auto', background: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: 20, padding: '0 8px' }}>
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: '#1d1d1f', letterSpacing: '-0.3px' }}>Best Sellers</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }} className="bs-grid">
        {items.map((product, idx) => (
          <ProductCard
            key={product.id || product.slug || idx}
            product={product}
          />
        ))}
      </div>
      <style jsx>{`
        @media (min-width: 768px) { .bs-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 1024px) { .bs-grid { grid-template-columns: repeat(4, 1fr) !important; } }
      `}</style>
    </section>
  );
}

function ProductCard({ product }) {
  const slug = useMemo(() => normalizeSlug(product), [product]);
  const mainImg = useMemo(() => getImageUrl(product), [product]);

  const [colors, setColors] = useState(() => colorCache.get(slug) || []);
  const [currentImage, setCurrentImage] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const didSwipe = useRef(false);

  const isOut = product.is_out_of_stock || product.stock === 0 || product.stock === '0';

  /* ✅ কালার ফেচ — cache + cancelled-guard */
  useEffect(() => {
    let cancelled = false;
    setColors(colorCache.get(slug) || []);
    fetchColorsCached(slug).then((c) => {
      if (!cancelled) setColors(c);
    });
    return () => { cancelled = true; };
  }, [slug]);

  /* ✅ সব ইমেজ — memoized */
  const allImages = useMemo(() => {
    const imgs = [];
    if (mainImg !== '/placeholder.png') imgs.push(mainImg);
    colors.forEach((c) => {
      if (c.color_image?.trim() && !imgs.includes(c.color_image)) {
        imgs.push(c.color_image);
      }
    });
    return imgs.length > 0 ? imgs : ['/placeholder.png'];
  }, [mainImg, colors]);

  const totalImages = allImages.length;

  /* ✅ ইমেজ লিস্ট বদলালে index clamp */
  useEffect(() => {
    setCurrentImage((prev) => (prev >= totalImages ? 0 : prev));
  }, [totalImages]);

  const navigate = (i) => {
    if (i >= 0 && i < totalImages) {
      setCurrentImage(i);
      setDragOffset(0);
    }
  };

  const onTouchStart = (e) => {
    if (totalImages <= 1) return;
    startX.current = e.touches[0].clientX;
    didSwipe.current = false;
    setIsDragging(true);
  };

  const onTouchMove = (e) => {
    if (!isDragging || totalImages <= 1) return;
    const diff = e.touches[0].clientX - startX.current;
    if (Math.abs(diff) > 8) {
      e.preventDefault();
      didSwipe.current = true;
    }
    setDragOffset(diff);
  };

  const onTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragOffset) > 60) {
      if (dragOffset < 0 && currentImage < totalImages - 1) navigate(currentImage + 1);
      else if (dragOffset > 0 && currentImage > 0) navigate(currentImage - 1);
      else setDragOffset(0);
    } else {
      setDragOffset(0);
    }
  };

  return (
    <div
      style={{ position: 'relative', background: '#fff', cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.3s' }}
      className="bs-card"
      onTouchStart={totalImages > 1 ? onTouchStart : undefined}
      onTouchMove={totalImages > 1 ? onTouchMove : undefined}
      onTouchEnd={totalImages > 1 ? onTouchEnd : undefined}
    >
      <Link
        href={`/product/${encodeURIComponent(slug)}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}
        onClick={(e) => {
          if (didSwipe.current) {
            e.preventDefault();
            e.stopPropagation();
            didSwipe.current = false;
          }
        }}
      >
        <div
          style={{
            position: 'relative',
            aspectRatio: '4/5',
            background: '#f5f5f7',
            overflow: 'hidden',
            marginBottom: 6,
            touchAction: 'pan-y',
            userSelect: 'none',
          }}
        >
          {allImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${product.title || 'Product'} - Image ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              style={{
                position: 'absolute',
                top: 0,
                left: isDragging
                  ? `calc(${(i - currentImage) * 100}% + ${dragOffset}px)`
                  : `${(i - currentImage) * 100}%`,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: isDragging ? 'none' : 'left 0.45s cubic-bezier(0.25,0.1,0.25,1)',
                willChange: 'left',
                zIndex: i === currentImage ? 2 : 1,
              }}
            />
          ))}

          {isOut && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 6,
              }}
            >
              <span
                style={{
                  background: '#1d1d1f',
                  color: '#fff',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: 9,
                  textTransform: 'uppercase',
                  padding: '5px 14px',
                }}
              >
                Sold Out
              </span>
            </div>
          )}

          {totalImages > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 6,
                zIndex: 4,
              }}
            >
              {allImages.map((_, i) => (
                <span
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(i);
                  }}
                  style={{
                    width: i === currentImage ? 8 : 6,
                    height: i === currentImage ? 8 : 6,
                    borderRadius: '50%',
                    background: i === currentImage ? '#fff' : 'rgba(255,255,255,0.55)',
                    cursor: 'pointer',
                    transition: 'all 0.35s ease',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '4px 6px 6px' }}>
          <h3
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 12,
              color: '#1d1d1f',
              lineHeight: 1.35,
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
            }}
          >
            {product.title}
          </h3>
          {colors.length > 0 && (
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              {colors.map((c, i) => (
                <span
                  key={i}
                  title={c.color_name}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: '50%',
                    backgroundColor: c.color_code || '#ccc',
                    border: '1px solid rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      <style jsx>{`
        .bs-card:active { transform: scale(0.98); }
        @media (hover: hover) {
          .bs-card:hover {
            transform: translateY(-2px);
            z-index: 2;
            box-shadow: 0 8px 25px rgba(0,0,0,0.12);
          }
        }
      `}</style>
    </div>
  );
}
