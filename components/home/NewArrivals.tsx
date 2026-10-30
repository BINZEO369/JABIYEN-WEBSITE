'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';

export default function NewArrivals({ products = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);
  const [colorCache, setColorCache] = useState({});

  const scrollRef = useRef(null);
  const autoScrollRef = useRef(null);
  const userInteractedRef = useRef(false);

  const maxProducts = 12;

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch('/api/products?filter=new_arrival&limit=12');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const all = Array.isArray(data) ? data : data?.data || data?.products || [];
        const filtered = all.filter(
          (p) =>
            p.is_new_arrival === true ||
            p.is_new_arrival === 1 ||
            p.is_new_arrival === 'true'
        );
        filtered.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );
        setItems(filtered.slice(0, maxProducts));
      } catch (e) {
        const filtered = products.filter(
          (p) => p.is_new_arrival === true || p.is_new_arrival === 1
        );
        setItems(filtered.slice(0, maxProducts));
      }
      setLoading(false);
    }
    if (products.length > 0) {
      const filtered = products.filter(
        (p) => p.is_new_arrival === true || p.is_new_arrival === 1
      );
      setItems(filtered.slice(0, maxProducts));
      setLoading(false);
    } else fetchItems();
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
  }, [items]);

  useEffect(() => {
    if (loading || items.length === 0 || userInteractedRef.current) return;

    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;

    autoScrollRef.current = setInterval(() => {
      if (el.scrollLeft >= maxScroll - 1) {
        clearInterval(autoScrollRef.current);
        return;
      }
      el.scrollLeft += 1.5;
    }, 20);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [loading, items]);

  const stopAutoScroll = () => {
    userInteractedRef.current = true;
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };

  const scrollByCards = (direction) => {
    stopAutoScroll();
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('.na-card');
    const cardW = card ? card.offsetWidth : 500;
    const gap = 16;
    el.scrollBy({ left: (cardW + gap) * direction, behavior: 'smooth' });
  };

  if (loading) return <Skeleton />;
  if (!items.length) return null;

  return (
    <section className="na-section">
      <div className="na-header">
        <img
          src="/homesection/Newarrival.png"
          alt="New Arrivals"
          className="na-header-img"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      <div className="na-scroll-wrap">
        {canScrollLeft && (
          <button
            className="na-arrow na-arrow-left"
            onClick={() => scrollByCards(-1)}
            aria-label="Previous"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {canScrollRight && (
          <button
            className="na-arrow na-arrow-right"
            onClick={() => scrollByCards(1)}
            aria-label="Next"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        <div
          className="na-scroll"
          ref={scrollRef}
          onTouchStart={stopAutoScroll}
          onMouseDown={stopAutoScroll}
          onWheel={stopAutoScroll}
        >
          {items.map((product) => (
            <NewArrivalCard
              key={product.id}
              product={product}
              colorCache={colorCache}
              setColorCache={setColorCache}
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

        .na-header {
          width: 100%;
          height: 260px;
          margin: 30px 0 40px;
          background: #fff;
          display: block;
          position: relative;
        }

        .na-header::after {
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

        .na-header-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .na-scroll-wrap {
          position: relative;
        }

        .na-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: none;
          scroll-padding-left: 24px;
          padding: 0 24px 20px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          align-items: stretch;
        }

        .na-scroll::-webkit-scrollbar {
          display: none;
        }

        .na-card {
          flex: 0 0 72vw;
          max-width: 360px;
          scroll-snap-align: start;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
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

        .na-arrow-left {
          left: 24px;
        }

        .na-arrow-right {
          right: 24px;
        }

        @media (min-width: 640px) {
          .na-scroll {
            gap: 20px;
            scroll-padding-left: 32px;
            padding: 0 32px 20px;
          }
          .na-card {
            flex: 0 0 45vw;
            max-width: 320px;
          }
        }

        @media (min-width: 768px) {
          .na-section {
            padding: 0 0 60px;
          }
          .na-header {
            height: 420px;
            margin: 40px 0 60px;
          }
          .na-scroll {
            gap: 24px;
            scroll-padding-left: 48px;
            padding: 0 48px 24px;
          }
          .na-card {
            flex: 0 0 320px;
            max-width: none;
          }
          .na-arrow {
            display: flex;
          }
          .na-arrow-left {
            left: 32px;
          }
          .na-arrow-right {
            right: 32px;
          }
          .na-track-container {
            padding: 35px 48px 0;
          }
        }

        @media (min-width: 1024px) {
          .na-header {
            height: 720px;
            margin: 60px 0 80px;
          }
          .na-card {
            flex: 0 0 360px;
          }
        }

        @media (min-width: 1440px) {
          .na-header {
            height: 850px;
            margin: 70px 0 90px;
          }
        }
      `}</style>
    </section>
  );
}

function Skeleton() {
  return (
    <section className="na-section" style={{ padding: '40px 0' }}>
      <div
        className="na-header"
        style={{ background: '#f0f0f0', margin: '20px 0 30px' }}
      />
      <div
        style={{
          display: 'flex',
          gap: 16,
          overflow: 'hidden',
          padding: '0 24px',
          alignItems: 'stretch',
        }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              flex: '0 0 72vw',
              maxWidth: 360,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '133.3333%',
                background:
                  'linear-gradient(90deg, #e5e5ea 0%, #f0f0f5 40%, #e5e5ea 80%)',
                backgroundSize: '800px 100%',
                animation: 'shimmer 1.8s infinite linear',
              }}
            />
            <div
              style={{
                padding: '16px 4px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  height: 14,
                  background: '#e5e5ea',
                  width: '60%',
                  borderRadius: 4,
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <div
                  style={{
                    height: 10,
                    background: '#e5e5ea',
                    width: 10,
                    borderRadius: 0,
                  }}
                />
                <div
                  style={{
                    height: 10,
                    background: '#e5e5ea',
                    width: 10,
                    borderRadius: 0,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } }`}</style>
    </section>
  );
}

function NewArrivalCard({ product, colorCache, setColorCache }) {
  const [colors, setColors] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef(null);

  const isOut =
    product.is_out_of_stock || product.stock === 0 || product.stock === '0';
  const slug = (product.slug || product.title || 'product')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

  useEffect(() => {
    if (colorCache[slug]) {
      setColors(colorCache[slug]);
      return;
    }
    fetch(`/api/product-colors?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setColors(d || []);
        setColorCache((prev) => ({ ...prev, [slug]: d || [] }));
      })
      .catch(() => {});
  }, [slug, colorCache, setColorCache]);

  const allImages = useMemo(() => {
    const imgs = [];
    const main = product.img || product.image || product.image_url;
    if (main) imgs.push(main);

    colors.forEach((c) => {
      if (c.color_image && !imgs.includes(c.color_image)) {
        imgs.push(c.color_image);
      }
    });

    return imgs.length > 0 ? imgs : ['/placeholder.png'];
  }, [product, colors]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.5 }
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let interval;

    if (isInView && allImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex(
          (prevIndex) => (prevIndex + 1) % allImages.length
        );
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInView, allImages.length]);

  return (
    <div className="na-card" ref={cardRef}>
      <Link href={`/product/${slug}`} className="na-card-link">
        <div className="na-image-wrap">
          {allImages.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${product.title || 'Product'} - Image ${idx + 1}`}
              className="na-image"
              style={{ opacity: idx === currentImageIndex ? 1 : 0 }}
            />
          ))}

          <div className="hover-overlay">
            <span className="explore-text">Explore</span>
          </div>

          {isOut && (
            <div className="na-soldout-overlay">
              <span className="na-soldout-label">Sold Out</span>
            </div>
          )}
        </div>

        <div className="na-info">
          <h3 className="na-title">{product.title}</h3>

          {colors.length > 1 && (
            <div className="color-swatches">
              {colors.map((c, i) => (
                <span
                  key={i}
                  className="color-swatch-box"
                  style={{ backgroundColor: c.color_code || '#ccc' }}
                  title={c.color_name}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      <style jsx>{`
        .na-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .na-card-link {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          width: 100%;
        }

        .na-image-wrap {
          position: relative;
          width: 100%;
          padding-bottom: 133.3333%;
          background: #f7f7f7;
          overflow: hidden;
          border: 1px solid #f0f0f0;
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .na-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
          transition:
            opacity 0.8s ease-in-out,
            transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        @media (hover: hover) {
          .na-card-link:hover .na-image {
            transform: scale(1.03);
          }
          .na-card-link:hover .hover-overlay {
            opacity: 1;
          }
          .na-card-link:hover .explore-text {
            transform: translateY(0);
          }
        }

        .hover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 3;
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

        .na-soldout-overlay {
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
          font-family: 'Sora', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 8px 16px;
        }

        .na-info {
          padding: 16px 4px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-sizing: border-box;
          gap: 8px;
        }

        .na-title {
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

        .color-swatches {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 5px;
        }

        .color-swatch-box {
          width: 10px;
          height: 10px;
          border-radius: 0;
          border: 1px solid rgba(0, 0, 0, 0.15);
          display: block;
        }

        @media (min-width: 768px) {
          .na-info {
            padding: 20px 4px 24px;
          }
          .na-title {
            font-size: 12px;
          }
          .color-swatch-box {
            width: 12px;
            height: 12px;
          }
        }
      `}</style>
    </div>
  );
}
