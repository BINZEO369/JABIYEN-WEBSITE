'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';

export default function FeaturedProducts({ products = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const maxProducts = 8;

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const all = Array.isArray(data) ? data : data?.data || data?.products || [];
        const filtered = all.filter(p => p.is_featured === true || p.is_featured === 1 || p.is_featured === 'true');
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setItems(filtered.slice(0, maxProducts));
      } catch (e) {
        const filtered = products.filter(p => p.is_featured === true || p.is_featured === 1);
        setItems(filtered.slice(0, maxProducts));
      }
      setLoading(false);
    }
    if (products.length > 0) {
      const filtered = products.filter(p => p.is_featured === true || p.is_featured === 1);
      setItems(filtered.slice(0, maxProducts));
      setLoading(false);
    } else fetchItems();
  }, [products]);

  if (loading) return <SectionSkeleton />;
  if (!items.length) return <EmptyState />;

  return (
    <section className="fp-section">
      {/* ✅ Full-width edge-to-edge header image */}
      <div className="fp-header">
        <img
          src="/homesection/Featured.png"
          alt="Featured Products"
          className="fp-header-img"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      <div className="fp-grid-wrap">
        {/* ✅ Flexbox ব্যবহার করা হয়েছে যাতে অসম সংখ্যক প্রোডাক্ট হলেও মাঝখানে থাকে */}
        <div className="fp-grid">
          {items.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .fp-section {
          padding: 0 0 50px;
          background: #fff;
          overflow: hidden;
        }

        /* ✅ হেডার ইমেজ */
        .fp-header {
          width: 100%;
          height: 120px;
          margin: 20px 0 30px;
          background: #fff;
          display: block;
          position: relative;
        }

        .fp-header::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
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

        .fp-header-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        /* ✅ কন্টেইনার */
        .fp-grid-wrap {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          box-sizing: border-box;
        }

        /* ✅ Flexbox গ্রিড (মাঝখানে রাখার জন্য) */
        .fp-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center; /* এটি শেষ লাইনের প্রোডাক্টগুলোকে মাঝখানে রাখবে */
          gap: 16px;
        }

        /* মোবাইলে ২টি করে */
        .fp-grid > :global(.fp-card) {
          flex: 0 0 calc(50% - 8px);
          max-width: calc(50% - 8px);
        }

        @media (min-width: 640px) {
          .fp-grid { gap: 20px; }
          .fp-grid-wrap { padding: 0 32px; }
          .fp-grid > :global(.fp-card) {
            flex: 0 0 calc(50% - 10px);
            max-width: calc(50% - 10px);
          }
        }

        @media (min-width: 768px) {
          .fp-section { padding: 0 0 60px; }
          .fp-header { height: 180px; margin: 30px 0 40px; }
          .fp-grid-wrap { padding: 0 48px; }
          .fp-grid { gap: 24px; }
          /* ট্যাবে ৩টি করে */
          .fp-grid > :global(.fp-card) {
            flex: 0 0 calc(33.333% - 16px);
            max-width: calc(33.333% - 16px);
          }
        }

        @media (min-width: 1024px) {
          .fp-header { height: 240px; }
          /* ডেক্সটপে ৪টি করে */
          .fp-grid > :global(.fp-card) {
            flex: 0 0 calc(25% - 18px);
            max-width: calc(25% - 18px);
          }
        }
      `}</style>
    </section>
  );
}

function SectionSkeleton() {
  return (
    <section className="fp-section" style={{ padding: '40px 0' }}>
      <div className="fp-header" style={{ background: '#f0f0f0', margin: '20px 0 30px' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, padding: '0 24px' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ flex: '0 0 calc(50% - 8px)', maxWidth: 'calc(50% - 8px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', width: '100%', paddingBottom: '133.3333%', background: 'linear-gradient(90deg, #e5e5ea 0%, #f0f0f5 40%, #e5e5ea 80%)', backgroundSize: '800px 100%', animation: 'shimmer 1.8s infinite linear' }} />
            <div style={{ padding: '16px 4px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ height: 14, background: '#e5e5ea', width: '60%', borderRadius: 4 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ height: 10, background: '#e5e5ea', width: 10, borderRadius: 0 }} />
                <div style={{ height: 10, background: '#e5e5ea', width: 10, borderRadius: 0 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } }`}</style>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="fp-section" style={{ padding: '60px 0' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
        <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, color: '#86868b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No featured products</p>
      </div>
    </section>
  );
}

function ProductCard({ product }) {
  const [colors, setColors] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef(null);

  const isOut = product.is_out_of_stock || product.stock === 0 || product.stock === '0';
  const slug = (product.slug || product.title || 'product').toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

  // ✅ কালার ফেচ
  useEffect(() => {
    fetch(`/api/product-colors?slug=${slug}`)
      .then(r => r.json())
      .then(d => setColors(d || []))
      .catch(() => {});
  }, [slug]);

  // ✅ সব ইমেজ
  const allImages = useMemo(() => {
    const imgs = [];
    const main = product.img || product.image || product.image_url;
    if (main) imgs.push(main);
    colors.forEach(c => {
      if (c.color_image && !imgs.includes(c.color_image)) imgs.push(c.color_image);
    });
    return imgs.length > 0 ? imgs : ['/placeholder.png'];
  }, [product, colors]);

  // ✅ স্ক্রিনে দৃশ্যমান কিনা
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.5 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // ✅ অটো ইমেজ চেঞ্জ (প্রতি ২ সেকেন্ড)
  useEffect(() => {
    let interval;
    if (isInView && allImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % allImages.length);
      }, 2000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isInView, allImages.length]);

  return (
    <div className="fp-card" ref={cardRef}>
      <Link href={`/product/${slug}`} className="fp-card-link">
        
        <div className="fp-image-wrap">
          {allImages.map((img, idx) => (
            <img 
              key={idx}
              src={img} 
              alt={`${product.title || 'Product'} - Image ${idx + 1}`} 
              className="fp-image"
              style={{ opacity: idx === currentImageIndex ? 1 : 0 }}
            />
          ))}
          
          <div className="hover-overlay">
            <span className="explore-text">Explore</span>
          </div>

          {isOut && (
            <div className="fp-soldout-overlay">
              <span className="fp-soldout-label">Sold Out</span>
            </div>
          )}
        </div>

        <div className="fp-info">
          <h3 className="fp-title">{product.title}</h3>
          
          {/* ✅ কালার বক্স (বর্গাকার) */}
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
        .fp-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        
        .fp-card-link {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          width: 100%;
        }

        .fp-image-wrap {
          position: relative;
          width: 100%;
          padding-bottom: 133.3333%;
          background: #f7f7f7;
          overflow: hidden;
          border: 1px solid #f0f0f0; 
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .fp-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top; 
          display: block;
          transition: opacity 0.8s ease-in-out, transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        @media (hover: hover) {
          .fp-card-link:hover .fp-image {
            transform: scale(1.03);
          }
          .fp-card-link:hover .hover-overlay {
            opacity: 1;
          }
          .fp-card-link:hover .explore-text {
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

        .fp-soldout-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 4;
        }

        .fp-soldout-label {
          background: #1a1a1a;
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 8px 16px;
        }

        .fp-info {
          padding: 16px 4px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-sizing: border-box;
          gap: 8px; 
        }

        .fp-title {
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
          .fp-info { padding: 20px 4px 24px; }
          .fp-title { font-size: 12px; }
          .color-swatch-box { width: 12px; height: 12px; }
        }
      `}</style>
    </div>
  );
}
