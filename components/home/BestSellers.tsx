'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';

const MAX_PRODUCTS = 8;

/* 🔥 Module-level cache — unmount হলেও থাকে, কখনো রি-ফেচ হয় না */
const colorCache = new Map();

async function fetchColors(slug, signal) {
  if (colorCache.has(slug)) return colorCache.get(slug);
  const res = await fetch(
    `/api/product-colors?slug=${encodeURIComponent(slug)}`,
    { signal }
  );
  if (!res.ok) throw new Error(`Colors API failed: ${res.status}`);
  const data = await res.json();
  const colors = Array.isArray(data) ? data : [];
  colorCache.set(slug, colors);
  return colors;
}

/* ✅ সব জায়গায় একই লজিক */
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

export default function BestSellers({
  products = [],
  bannerSrc = '/homesection/Bestsellers.png', // ✅ কাস্টম ব্যানার path
}) {
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

  if (loading) return <SectionSkeleton bannerSrc={bannerSrc} />;
  if (!items.length) return <EmptyState bannerSrc={bannerSrc} />;

  return (
    <section className="bs-section">
      {/* ✅ Full-width edge-to-edge banner */}
      <div className="bs-header">
        <img
          src={bannerSrc}
          alt="Best Sellers"
          className="bs-header-img"
          loading="eager"
          onError={(e) => {
            e.currentTarget.style.opacity = '0';
          }}
        />
      </div>

      <div className="bs-grid-wrap">
        <div className="bs-grid">
          {items.map((p, i) => (
            <ProductCard key={p.id || p.slug || i} product={p} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .bs-section {
          padding: 0 0 50px;
          background: #fff;
          overflow: hidden;
        }
        /* ✅ ব্যানার */
        .bs-header {
          width: 100%;
          height: 120px;
          margin: 20px 0 30px;
          background: #fff;
          display: block;
          position: relative;
        }
        .bs-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
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
        .bs-header-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: opacity 0.3s ease;
        }
        /* ✅ কন্টেইনার */
        .bs-grid-wrap {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 16px;
          box-sizing: border-box;
        }
        /* ✅ Flexbox — অসম সংখ্যায় শেষ লাইন সেন্টার হবে */
        .bs-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
        .bs-grid > :global(.bs-card) {
          flex: 0 0 calc(50% - 4px);
          max-width: calc(50% - 4px);
        }
        @media (min-width: 640px) {
          .bs-grid { gap: 10px; }
          .bs-grid-wrap { padding: 0 24px; }
          .bs-grid > :global(.bs-card) {
            flex: 0 0 calc(50% - 5px);
            max-width: calc(50% - 5px);
          }
        }
        @media (min-width: 768px) {
          .bs-section { padding: 0 0 60px; }
          .bs-header { height: 180px; margin: 30px 0 40px; }
          .bs-grid-wrap { padding: 0 32px; }
          .bs-grid { gap: 12px; }
          .bs-grid > :global(.bs-card) {
            flex: 0 0 calc(33.333% - 8px);
            max-width: calc(33.333% - 8px);
          }
        }
        @media (min-width: 1024px) {
          .bs-header { height: 240px; }
          .bs-grid-wrap { padding: 0 48px; }
          .bs-grid { gap: 16px; }
          .bs-grid > :global(.bs-card) {
            flex: 0 0 calc(25% - 12px);
            max-width: calc(25% - 12px);
          }
        }
      `}</style>
    </section>
  );
}

function SectionSkeleton({ bannerSrc }) {
  return (
    <section className="bs-section" style={{ padding: '40px 0' }}>
      <div
        className="bs-header"
        style={{
          height: 120,
          margin: '20px 0 30px',
          background: '#f0f0f0',
          width: '100%',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
          padding: '0 16px',
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              flex: '0 0 calc(50% - 4px)',
              maxWidth: 'calc(50% - 4px)',
              background: '#fff',
            }}
          >
            <div
              style={{
                aspectRatio: '4 / 5',
                background:
                  'linear-gradient(90deg,#e5e5ea 0%,#f0f0f5 40%,#e5e5ea 80%)',
                backgroundSize: '800px 100%',
                animation: 'shimmer 1.8s infinite linear',
              }}
            />
            <div style={{ padding: '4px 6px' }}>
              <div
                style={{
                  height: 13,
                  background: '#e5e5ea',
                  width: '85%',
                  margin: '0 auto',
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer{0%{background-position:-468px 0}100%{background-position:468px 0}}`}</style>
    </section>
  );
}

function EmptyState({ bannerSrc }) {
  return (
    <section className="bs-section" style={{ padding: '40px 0' }}>
      <div
        className="bs-header"
        style={{ height: 120, margin: '20px 0 30px', background: '#f0f0f0' }}
      >
        {bannerSrc && (
          <img
            src={bannerSrc}
            alt="Best Sellers"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0,
            }}
          />
        )}
      </div>
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          maxWidth: 400,
          margin: '0 auto',
        }}
      >
        <p
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 14,
            color: '#86868b',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          No best sellers right now
        </p>
      </div>
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
  const [isInView, setIsInView] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // ✅ hover এ pause

  const startX = useRef(0);
  const didSwipe = useRef(false);
  const cardRef = useRef(null);

  const isOut =
    product.is_out_of_stock || product.stock === 0 || product.stock === '0';

  /* ✅ কালার ফেচ (cached + abortable) */
  useEffect(() => {
    const controller = new AbortController();
    fetchColors(slug, controller.signal)
      .then((c) => setColors(c))
      .catch((err) => {
        if (err.name !== 'AbortError') setColors([]);
      });
    return () => controller.abort();
  }, [slug]);

  /* ✅ সব ইমেজ */
  const allImages = useMemo(() => {
    const imgs = [];
    if (mainImg !== '/placeholder.png') imgs.push(mainImg);
    colors.forEach((c) => {
      if (c.color_image?.trim() && !imgs.includes(c.color_image))
        imgs.push(c.color_image);
    });
    return imgs.length > 0 ? imgs : ['/placeholder.png'];
  }, [mainImg, colors]);

  const totalImages = allImages.length;

  /* ✅ ইমেজ লিস্ট বদলালে index reset */
  useEffect(() => {
    setCurrentImage(0);
  }, [totalImages]);

  /* ✅ IntersectionObserver (threshold 0.3) */
  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* ✅ অটো-স্লাইড (hover/drag এ pause) */
  useEffect(() => {
    if (!isInView || totalImages <= 1 || isPaused || isDragging) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % totalImages);
    }, 2000);
    return () => clearInterval(interval);
  }, [isInView, totalImages, isPaused, isDragging]);

  const navigate = (i) => {
    if (i >= 0 && i < totalImages) {
      setCurrentImage(i);
      setDragOffset(0);
    }
  };

  /* Swipe handlers */
  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    didSwipe.current = false;
    setIsDragging(true);
  };
  const onTouchMove = (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX.current;
    if (Math.abs(diff) > 8) {
      e.preventDefault();
      didSwipe.current = true;
    }
    setDragOffset(diff);
  };
  const onTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) > 60) {
      if (dragOffset < 0 && currentImage < totalImages - 1)
        navigate(currentImage + 1);
      else if (dragOffset > 0 && currentImage > 0)
        navigate(currentImage - 1);
    }
    setDragOffset(0);
  };

  return (
    <div
      ref={cardRef}
      className="bs-card"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={totalImages > 1 ? onTouchStart : undefined}
      onTouchMove={totalImages > 1 ? onTouchMove : undefined}
      onTouchEnd={totalImages > 1 ? onTouchEnd : undefined}
    >
      <Link
        href={`/product/${encodeURIComponent(slug)}`}
        className="bs-link"
        onClick={(e) => {
          if (didSwipe.current) {
            e.preventDefault();
            e.stopPropagation();
            didSwipe.current = false;
          }
        }}
      >
        <div className="bs-image-wrap">
          {allImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${product.title || 'Product'} - Image ${i + 1}`}
              className="bs-image"
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              style={{
                left: isDragging
                  ? `calc(${(i - currentImage) * 100}% + ${dragOffset}px)`
                  : `${(i - currentImage) * 100}%`,
                transition: isDragging
                  ? 'none'
                  : 'left 0.45s cubic-bezier(0.25,0.1,0.25,1)',
                zIndex: i === currentImage ? 2 : 1,
              }}
            />
          ))}

          {isOut && (
            <div className="bs-soldout-overlay">
              <span className="bs-soldout-label">Sold Out</span>
            </div>
          )}

          {totalImages > 1 && (
            <div className="bs-dots">
              {allImages.map((_, i) => (
                <span
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(i);
                  }}
                  className={`bs-dot ${i === currentImage ? 'is-active' : ''}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bs-info">
          <h3 className="bs-title">{product.title}</h3>

          {/* ✅ কালার swatch — বর্গ (border-radius:0) */}
          {colors.length > 0 && (
            <div className="bs-swatches">
              {colors.map((c, i) => (
                <span
                  key={i}
                  title={c.color_name}
                  className="bs-swatch-box"
                  style={{ backgroundColor: c.color_code || '#ccc' }}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      <style jsx>{`
        .bs-card {
          position: relative;
          background: #fff;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.3s;
          display: flex;
          flex-direction: column;
        }
        .bs-card:active {
          transform: scale(0.98);
        }
        @media (hover: hover) {
          .bs-card:hover {
            transform: translateY(-2px);
            z-index: 2;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          }
        }
        .bs-link {
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .bs-image-wrap {
          position: relative;
          aspect-ratio: 4 / 5;
          background: #f5f5f7;
          overflow: hidden;
          margin-bottom: 6px;
          touch-action: pan-y;
          user-select: none;
        }
        .bs-image {
          position: absolute;
          top: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          will-change: left;
          display: block;
        }
        .bs-soldout-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 6;
        }
        .bs-soldout-label {
          background: #1d1d1f;
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 5px 14px;
        }
        .bs-dots {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          z-index: 4;
        }
        .bs-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.55);
          cursor: pointer;
          transition: all 0.35s ease;
          display: block;
        }
        .bs-dot.is-active {
          width: 8px;
          height: 8px;
          background: #fff;
        }
        .bs-info {
          padding: 4px 6px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .bs-title {
          font-family: 'Sora', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 12px;
          color: #1d1d1f;
          line-height: 1.35;
          text-align: center;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin: 0;
          width: 100%;
        }
        .bs-swatches {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 5px;
        }
        /* ✅ বর্গাকার কালার swatch */
        .bs-swatch-box {
          width: 10px;
          height: 10px;
          border-radius: 0;
          border: 1px solid rgba(0, 0, 0, 0.15);
          display: block;
        }
        @media (min-width: 768px) {
          .bs-title { font-size: 13px; }
          .bs-swatch-box { width: 12px; height: 12px; }
        }
      `}</style>
    </div>
  );
}
