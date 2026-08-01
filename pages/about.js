'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Loader from '../components/layout/Loader';

export default function About() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [titleVisible, setTitleVisible] = useState(true);
  
  const autoplayRef = useRef(null);
  const progressRef = useRef(null);
  const slideDuration = 6000;

  const headerEntries = entries.filter(e => e.header_image);

  useEffect(() => {
    async function fetchAboutUs() {
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
    fetchAboutUs();
  }, []);

  useEffect(() => {
    if (headerEntries.length <= 1) return;
    startAutoplay();
    return () => {
      clearInterval(autoplayRef.current);
      clearInterval(progressRef.current);
    };
  }, [currentSlide, headerEntries.length]);

  const startAutoplay = () => {
    clearInterval(autoplayRef.current);
    clearInterval(progressRef.current);
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / slideDuration) * 100, 100));
    }, 50);
    autoplayRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % headerEntries.length);
    }, slideDuration);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentSlide) return;
    if (index < 0 || index >= headerEntries.length) return;
    setIsTransitioning(true);
    setTitleVisible(false);
    setTimeout(() => {
      setCurrentSlide(index);
      setTitleVisible(true);
      setProgress(0);
      clearInterval(autoplayRef.current);
      clearInterval(progressRef.current);
      const startTime = Date.now();
      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress(Math.min((elapsed / slideDuration) * 100, 100));
      }, 50);
      autoplayRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % headerEntries.length);
      }, slideDuration);
      setIsTransitioning(false);
    }, 300);
  };

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('[data-animate="true"]').forEach((card, i) => {
      card.style.transitionDelay = `${i * 0.08}s`;
      observer.observe(card);
    });
    return () => observer.disconnect();
  }, [loading, entries]);

  useEffect(() => {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    const handleScroll = () => {
      if (window.scrollY > 500) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 64, color: '#d1d1d6', marginBottom: 24 }}></i>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', marginBottom: 12, fontFamily: "'Manrope', sans-serif" }}>Something went wrong</h2>
        <p style={{ fontSize: 15, color: '#86868b', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}>Failed to load about us content. Please try again.</p>
        <button onClick={() => window.location.reload()} style={{ padding: '14px 28px', background: '#1d1d1f', color: '#fff', borderRadius: '50px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-rotate"></i> Try Again
        </button>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fa-solid fa-info-circle" style={{ fontSize: 56, color: '#d1d1d6', marginBottom: 24 }}></i>
        <h3 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', marginBottom: 12, fontFamily: "'Manrope', sans-serif" }}>No content found</h3>
        <p style={{ fontSize: 15, color: '#86868b', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.6 }}>About us information has not been published yet.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>About Us | JAYENWARE</title>
        <meta name="description" content="Learn more about Jayenware, our mission, vision and what drives us forward." />
        <link rel="canonical" href="https://www.jayenware.shop/about" />
      </Head>

      {headerEntries.length > 0 && (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', minHeight: '100vh', overflow: 'hidden', background: '#000', marginBottom: 48, marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            {headerEntries.map((entry, i) => (
              <div key={i} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: i === currentSlide ? 1 : 0, transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: i === currentSlide ? 1 : 0 }}>
                {entry.header_image && <img src={entry.header_image} alt={entry.header_title || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', animation: i === currentSlide ? 'headerZoom 20s ease-in-out infinite alternate' : 'none' }} />}
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.6) 85%, rgba(0,0,0,0.75) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 'clamp(40px, 10vh, 80px)', left: '50%', transform: 'translateX(-50%)', zIndex: 3, textAlign: 'center', width: '88%', maxWidth: 680, padding: '0 16px' }}>
            <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 900, lineHeight: 1.1, color: '#fff', margin: 0, letterSpacing: '-0.01em', opacity: titleVisible ? 1 : 0, transform: titleVisible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>{headerEntries[currentSlide]?.header_title || ''}</h1>
            {headerEntries[currentSlide]?.header_subtitle && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(14px, 2vw, 20px)', fontWeight: 500, color: 'rgba(255,255,255,0.9)', marginTop: 8, marginBottom: 0, letterSpacing: '0.02em', opacity: titleVisible ? 1 : 0, transform: titleVisible ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>{headerEntries[currentSlide].header_subtitle}</p>}
          </div>
          {headerEntries.length > 1 && (
            <div style={{ position: 'absolute', bottom: 'clamp(16px, 3vh, 28px)', left: '50%', transform: 'translateX(-50%)', zIndex: 4, display: 'flex', gap: 8 }}>
              {headerEntries.map((_, i) => <button key={i} onClick={() => goToSlide(i)} style={{ width: i === currentSlide ? 24 : 8, height: 8, borderRadius: i === currentSlide ? 5 : '50%', background: i === currentSlide ? '#fff' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', transition: 'all 0.4s ease' }} />)}
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, background: 'rgba(255,255,255,0.6)', zIndex: 4, width: `${progress}%`, transition: 'width 0.1s linear' }} />
          {headerEntries.length > 1 && (
            <>
              <button onClick={() => goToSlide((currentSlide - 1 + headerEntries.length) % headerEntries.length)} style={{ position: 'absolute', top: '50%', left: 'clamp(12px, 2vw, 24px)', transform: 'translateY(-50%)', zIndex: 4, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }} className="header-arrow-hover"><i className="fa-solid fa-chevron-left"></i></button>
              <button onClick={() => goToSlide((currentSlide + 1) % headerEntries.length)} style={{ position: 'absolute', top: '50%', right: 'clamp(12px, 2vw, 24px)', transform: 'translateY(-50%)', zIndex: 4, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }} className="header-arrow-hover"><i className="fa-solid fa-chevron-right"></i></button>
            </>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        {entries.map((entry, index) => (
          <div key={entry.id || index}>
            <div className="about-card" data-animate="true" style={{ opacity: 0, transform: 'translateY(40px)', marginBottom: 80, transition: 'all 0.8s cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
              {entry.section_image && (
                <div style={{ width: '100vw', height: '90vh', minHeight: 500, maxHeight: 900, overflow: 'hidden', background: '#f0f0f0', marginBottom: 48, marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
                  <img src={entry.section_image} alt={entry.section_title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', gap: 48, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {entry.created_at && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#86868b', fontWeight: 500, marginBottom: 20 }}>
                      <i className="fa-regular fa-calendar" style={{ fontSize: 13 }}></i>
                      <span>{formatDate(entry.created_at)}</span>
                    </div>
                  )}
                  {entry.section_title && <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 800, lineHeight: 1.15, color: '#1d1d1f', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>{entry.section_title}</h2>}
                  {entry.section_subtitle && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 500, color: '#666', margin: '0 0 24px 0', lineHeight: 1.5 }}>{entry.section_subtitle}</p>}
                  {entry.section_description && (
                    <div style={{ fontSize: 15, lineHeight: 1.85, color: '#4a4a4f', fontWeight: 400 }}>
                      {entry.section_description.split('\n').filter(p => p.trim()).map((p, i) => <p key={i} style={{ marginBottom: 16 }}>{p.trim()}</p>)}
                    </div>
                  )}
                  {entry.cta_text && entry.cta_link && (
                    <Link href={entry.cta_link} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28, padding: '12px 28px', background: '#1d1d1f', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, textDecoration: 'none', borderRadius: '50px', transition: 'all 0.35s ease' }} className="about-cta">
                      {entry.cta_text}<span><i className="fa-solid fa-arrow-right"></i></span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
            {index < entries.length - 1 && <div style={{ width: '100%', height: 1, background: '#e5e5ea', marginBottom: 64 }} />}
          </div>
        ))}
      </div>

      <button id="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', bottom: 28, right: 28, width: 48, height: 48, borderRadius: '50%', background: '#1d1d1f', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 50, opacity: 0, transform: 'translateY(20px)', transition: 'all 0.35s ease', boxShadow: '0 6px 24px rgba(0,0,0,0.2)', pointerEvents: 'none' }} className="back-to-top-btn">
        <i className="fa-solid fa-arrow-up"></i>
      </button>

      <style jsx>{`
        .about-card.visible { opacity: 1 !important; transform: translateY(0) !important; }
        .header-arrow-hover { opacity: 0; pointer-events: none; }
        .page-header:hover .header-arrow-hover { opacity: 1; pointer-events: auto; }
        .header-arrow-hover:hover { background: rgba(255,255,255,0.25) !important; }
        .about-cta:hover { background: #333 !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); gap: 12px; }
        .back-to-top-btn.visible { opacity: 1 !important; transform: translateY(0) !important; pointer-events: auto !important; }
        .back-to-top-btn:hover { background: #333; transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,0.25); }
        @keyframes headerZoom { from { transform: scale(1); } to { transform: scale(1.03); } }
        @media (max-width: 768px) { .header-arrow-hover { opacity: 1 !important; pointer-events: auto !important; width: 36px !important; height: 36px !important; font-size: 12px !important; } .about-card { margin-bottom: 48px !important; } }
        @media (max-width: 480px) { .about-card { margin-bottom: 36px !important; } }
      `}</style>
    </>
  );
}
