import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  
  const autoplayRef = useRef(null);
  const progressRef = useRef(null);
  const touchStartX = useRef(0);
  const slideDuration = 6000;

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/about-us/all');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEntries(data || []);
      } catch (e) {
        setError(true);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Header slides
  const headerEntries = entries.filter(e => e.header_image);
  const totalSlides = headerEntries.length;

  const goToSlide = useCallback((index) => {
    if (isTransitioning || index === currentSlide || totalSlides <= 1) return;
    if (index < 0 || index >= totalSlides) return;
    setIsTransitioning(true);
    setTextVisible(false);
    setTimeout(() => {
      setCurrentSlide(index);
      setTextVisible(true);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, currentSlide, totalSlides]);

  // Autoplay
  useEffect(() => {
    if (totalSlides <= 1) return;
    autoplayRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
      setTextVisible(true);
    }, slideDuration);
    return () => clearInterval(autoplayRef.current);
  }, [totalSlides]);

  // Progress bar
  useEffect(() => {
    if (totalSlides <= 1) return;
    setProgress(0);
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / slideDuration) * 100, 100));
    }, 50);
    return () => clearInterval(progressRef.current);
  }, [currentSlide, totalSlides]);

  // Touch swipe
  const handleTouchStart = (e) => { touchStartX.current = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goToSlide((currentSlide + 1) % totalSlides) : goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
    }
  };

  // Scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [entries]);

  // Back to top
  useEffect(() => {
    const btn = document.getElementById('back-to-top');
    const handleScroll = () => {
      if (btn) btn.classList.toggle('visible', window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <>
      <Head>
        <title>About Us | JAYENWARE</title>
        <meta name="description" content="Learn more about Jayenware, our mission, vision and what drives us forward." />
        <link rel="canonical" href="https://www.jayenware.shop/about" />
      </Head>

      {/* Loading Skeleton */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ marginBottom: 80 }}>
              <div className="skeleton" style={{ width: '100%', height: '70vh', minHeight: 400, marginBottom: 48 }} />
              <div style={{ display: 'flex', gap: 48 }}>
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 10, width: '25%', marginBottom: 16 }} />
                  <div className="skeleton" style={{ height: 32, width: '60%', marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 20 }} />
                  <div className="skeleton" style={{ height: 14, width: '100%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '100%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '75%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 64, color: '#d1d1d6', marginBottom: 24 }}></i>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, fontFamily: "'Manrope', sans-serif" }}>Something went wrong</h2>
          <p style={{ fontSize: 15, color: '#86868b', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}>Failed to load about us content. Please try again.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '14px 28px', background: '#1d1d1f', color: '#fff', borderRadius: 50, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <i className="fa-solid fa-rotate"></i> Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-info-circle" style={{ fontSize: 56, color: '#d1d1d6', marginBottom: 24 }}></i>
          <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, fontFamily: "'Manrope', sans-serif" }}>No content found</h3>
          <p style={{ fontSize: 15, color: '#86868b', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.6 }}>About us information has not been published yet.</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && entries.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6" style={{ paddingTop: 0 }}>
          {/* Header Slider */}
          {headerEntries.length > 0 && (
            <div
              style={{
                position: 'relative', width: '100vw', height: '100vh', minHeight: '100vh',
                overflow: 'hidden', background: '#000', marginBottom: 48,
                marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)'
              }}
              onMouseEnter={() => clearInterval(autoplayRef.current)}
              onMouseLeave={() => {
                if (totalSlides > 1) autoplayRef.current = setInterval(() => setCurrentSlide(prev => (prev + 1) % totalSlides), slideDuration);
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {headerEntries.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute', inset: 0, opacity: i === currentSlide ? 1 : 0,
                    transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: i === currentSlide ? 1 : 0
                  }}
                >
                  <img src={entry.header_image} alt={entry.header_title || ''}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      animation: i === currentSlide ? 'headerZoom 20s ease-in-out infinite alternate' : 'none'
                    }}
                  />
                </div>
              ))}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 2,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.6) 85%, rgba(0,0,0,0.75) 100%)'
              }} />
              <div style={{
                position: 'absolute', bottom: 'clamp(40px, 10vh, 80px)', left: '50%', transform: 'translateX(-50%)',
                zIndex: 3, textAlign: 'center', width: '88%', maxWidth: 680
              }}>
                <h1 style={{
                  fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(28px, 5vw, 56px)',
                  fontWeight: 900, color: '#fff', margin: 0,
                  opacity: textVisible ? 1 : 0, transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 0.6s ease, transform 0.6s ease'
                }}>
                  {headerEntries[currentSlide]?.header_title}
                </h1>
                {headerEntries[currentSlide]?.header_subtitle && (
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 'clamp(14px, 2vw, 20px)',
                    color: 'rgba(255,255,255,0.9)', marginTop: 8,
                    opacity: textVisible ? 1 : 0, transform: textVisible ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.6s ease, transform 0.6s ease'
                  }}>
                    {headerEntries[currentSlide].header_subtitle}
                  </p>
                )}
              </div>

              {/* Dots */}
              {totalSlides > 1 && (
                <div style={{ position: 'absolute', bottom: 'clamp(16px, 3vh, 28px)', left: '50%', transform: 'translateX(-50%)', zIndex: 4, display: 'flex', gap: 8 }}>
                  {headerEntries.map((_, i) => (
                    <button key={i} onClick={() => goToSlide(i)}
                      style={{
                        width: i === currentSlide ? 24 : 8, height: 8,
                        borderRadius: i === currentSlide ? 5 : '50%',
                        background: i === currentSlide ? '#fff' : 'rgba(255,255,255,0.35)',
                        border: 'none', cursor: 'pointer', transition: 'all 0.4s ease'
                      }} />
                  ))}
                </div>
              )}

              {/* Progress Bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, height: 2,
                background: 'rgba(255,255,255,0.6)', zIndex: 4,
                width: `${progress}%`, transition: 'width 0.1s linear'
              }} />

              {/* Arrows */}
              {totalSlides > 1 && (
                <>
                  <button onClick={() => goToSlide((currentSlide - 1 + totalSlides) % totalSlides)}
                    style={{ position: 'absolute', top: '50%', left: 'clamp(12px, 2vw, 24px)', transform: 'translateY(-50%)', zIndex: 4, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity 0.35s ease' }}
                    className="header-arrow-hover">
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  <button onClick={() => goToSlide((currentSlide + 1) % totalSlides)}
                    style={{ position: 'absolute', top: '50%', right: 'clamp(12px, 2vw, 24px)', transform: 'translateY(-50%)', zIndex: 4, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity 0.35s ease' }}
                    className="header-arrow-hover">
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </>
              )}
            </div>
          )}

          {/* About Cards */}
          {entries.map((entry, index) => (
            <div key={entry.id || index} style={{ marginBottom: index === entries.length - 1 ? 0 : 80 }}>
              <div
                data-animate="true"
                style={{
                  opacity: 0, transform: 'translateY(40px)',
                  transition: `all 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) ${index * 0.08}s`,
                  marginBottom: 0
                }}
              >
                {/* Section Image */}
                {entry.section_image && (
                  <div style={{
                    width: '100vw', height: '90vh', minHeight: 500, maxHeight: 900,
                    overflow: 'hidden', background: '#f0f0f0', marginBottom: 48,
                    marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)'
                  }}
                    className="about-image-wrap"
                  >
                    <img src={entry.section_image} alt={entry.section_title || ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading={index < 2 ? 'eager' : 'lazy'}
                    />
                  </div>
                )}

                {/* Content */}
                <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }} className="about-content-wrap">
                  <div style={{ flex: 1 }}>
                    {entry.created_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#86868b', fontWeight: 500, marginBottom: 20 }}>
                        <i className="fa-regular fa-calendar"></i>
                        <span>{formatDate(entry.created_at)}</span>
                      </div>
                    )}
                    {entry.section_title && (
                      <h2 style={{
                        fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(24px, 3.5vw, 40px)',
                        fontWeight: 800, lineHeight: 1.15, color: '#1d1d1f', margin: '0 0 8px'
                      }}>
                        {entry.section_title}
                      </h2>
                    )}
                    {entry.section_subtitle && (
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 500, color: '#666', margin: '0 0 24px', lineHeight: 1.5 }}>
                        {entry.section_subtitle}
                      </p>
                    )}
                    {entry.section_description && (
                      <div style={{ fontSize: 15, lineHeight: 1.85, color: '#4a4a4f' }}>
                        {entry.section_description.split('\n').filter(p => p.trim()).map((p, i) => (
                          <p key={i} style={{ marginBottom: 16 }}>{p.trim()}</p>
                        ))}
                      </div>
                    )}
                    {entry.cta_text && entry.cta_link && (
                      <Link href={entry.cta_link}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28,
                          padding: '12px 28px', background: '#1d1d1f', color: '#fff',
                          fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                          textDecoration: 'none', borderRadius: 50, transition: 'all 0.35s ease'
                        }}
                        className="about-cta-link"
                      >
                        {entry.cta_text}
                        <span className="cta-arrow"><i className="fa-solid fa-arrow-right"></i></span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {index < entries.length - 1 && (
                <div style={{ width: '100%', height: 1, background: '#e5e5ea', margin: '64px 0 0' }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Back to Top */}
      <button
        id="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'fixed', bottom: 28, right: 28, width: 48, height: 48,
          borderRadius: '50%', background: '#1d1d1f', color: '#fff', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 50, opacity: 0, transform: 'translateY(20px)',
          transition: 'all 0.35s ease', boxShadow: '0 6px 24px rgba(0,0,0,0.2)'
        }}
      />

      <style jsx global>{`
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes headerZoom { from { transform: scale(1); } to { transform: scale(1.03); } }
        
        [data-animate].visible { opacity: 1 !important; transform: translateY(0) !important; }
        
        .header-arrow-hover:hover { opacity: 1 !important; background: rgba(255,255,255,0.25) !important; }
        @media (max-width: 768px) { .header-arrow-hover { opacity: 1 !important; } }
        
        .about-cta-link:hover { background: #333 !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .about-cta-link:hover .cta-arrow { transform: translateX(4px); }
        .cta-arrow { transition: transform 0.35s ease; }
        
        .about-image-wrap:hover img { transform: scale(1.02); }
        .about-image-wrap img { transition: transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1); }
        
        #back-to-top.visible { opacity: 1 !important; transform: translateY(0) !important; }
        #back-to-top:hover { background: #333 !important; transform: translateY(-3px) !important; }
        
        @media (max-width: 768px) {
          .about-content-wrap { flex-direction: column !important; gap: 24px !important; }
          .about-image-wrap { height: 80vh !important; min-height: 400px !important; max-height: 700px !important; margin-bottom: 36px !important; }
        }
        @media (max-width: 480px) {
          .about-image-wrap { height: 70vh !important; min-height: 350px !important; max-height: 600px !important; margin-bottom: 28px !important; }
          #back-to-top { bottom: 20px !important; right: 20px !important; width: 44px !important; height: 44px !important; }
        }
      `}</style>
    </>
  );
}
