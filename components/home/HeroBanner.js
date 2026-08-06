'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

export default function HeroBanner({ slides = [] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const slideIntervalRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);

  const totalSlides = slides.length;

  // Load fonts from window.JABIYEN_FONTS
  useEffect(() => {
    const loadFonts = () => {
      if (window.JABIYEN_FONTS) {
        const { families } = window.JABIYEN_FONTS;
        const root = document.documentElement;
        
        root.style.setProperty('--font-heading', families.heading);
        root.style.setProperty('--font-subtitle', families.subtitle);
        root.style.setProperty('--font-body', families.body);
        
        setFontsLoaded(true);
      } else {
        setTimeout(loadFonts, 100);
      }
    };
    
    loadFonts();
  }, []);

  // Get font families from global config
  const getFont = (type) => {
    if (typeof window !== 'undefined' && window.JABIYEN_FONTS?.families) {
      return window.JABIYEN_FONTS.families[type] || getFallbackFont(type);
    }
    return getFallbackFont(type);
  };

  const getFallbackFont = (type) => {
    const fallbacks = {
      heading: "'Manrope', sans-serif",
      subtitle: "'Sora', sans-serif",
      body: "'Inter', sans-serif"
    };
    return fallbacks[type] || fallbacks.body;
  };

  // Preload all images
  useEffect(() => {
    if (!slides.length) return;
    slides.forEach((slide, index) => {
      const img = new Image();
      img.onload = () => setLoadedImages(prev => new Set([...prev, index]));
      img.src = slide.img;
    });
  }, [slides]);

  // Auto slide
  useEffect(() => {
    if (totalSlides <= 1) return;
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 7000);
    return () => clearInterval(slideIntervalRef.current);
  }, [totalSlides]);

  const pauseAutoSlide = () => clearInterval(slideIntervalRef.current);
  const resumeAutoSlide = () => {
    if (totalSlides <= 1) return;
    clearInterval(slideIntervalRef.current);
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 7000);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentSlide) return;
    if (index < 0 || index >= totalSlides) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const nextSlide = () => goToSlide((currentSlide + 1) % totalSlides);
  const prevSlide = () => goToSlide((currentSlide - 1 + totalSlides) % totalSlides);

  // Touch events
  const handleTouchStart = (e) => { touchStartX.current = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextSlide() : prevSlide();
      pauseAutoSlide();
      setTimeout(resumeAutoSlide, 5000);
    }
  };

  // Keyboard events
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') { prevSlide(); pauseAutoSlide(); setTimeout(resumeAutoSlide, 5000); }
      if (e.key === 'ArrowRight') { nextSlide(); pauseAutoSlide(); setTimeout(resumeAutoSlide, 5000); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [currentSlide, totalSlides]);

  if (!slides.length) return null;

  const current = slides[currentSlide];

  return (
    <>
      <div
        ref={containerRef}
        className="hero-container"
        onMouseEnter={pauseAutoSlide}
        onMouseLeave={resumeAutoSlide}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative', width: '100%', overflow: 'hidden', background: '#000',
          height: typeof window !== 'undefined' && window.innerWidth <= 480 ? 750 :
                 typeof window !== 'undefined' && window.innerWidth <= 768 ? 850 :
                 typeof window !== 'undefined' && window.innerWidth <= 1024 ? 700 : 900
        }}
      >
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              position: 'absolute', inset: 0,
              opacity: index === currentSlide ? 1 : 0,
              transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
              visibility: 'visible',
              pointerEvents: index === currentSlide ? 'auto' : 'none'
            }}
          >
            <img
              src={slide.img}
              alt={slide.title || 'JAYENWARE Hero'}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                animation: index === currentSlide ? 'heroZoom 20s ease-in-out infinite alternate' : 'none',
                background: '#0a0a0a'
              }}
            />
          </div>
        ))}

        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.02) 30%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.7) 90%, rgba(0,0,0,0.85) 100%)'
        }} />

        {/* Content - Center Position for Title & Subtitle */}
        <div style={{
          position: 'absolute', top: '45%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 2, textAlign: 'center',
          width: '88%', maxWidth: 800, padding: '0 16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          {/* Title */}
          <h1 style={{
            fontFamily: getFont('heading'),
            fontSize: 'clamp(28px, 5vw, 64px)', fontWeight: 700,
            lineHeight: 1.1, color: '#fff', margin: 0,
            letterSpacing: '-0.5px'
          }}>
            {current?.title}
          </h1>

          {/* Subtitle */}
          {current?.subtitle && (
            <p style={{
              fontFamily: getFont('body'),
              fontSize: 'clamp(10px, 1.2vw, 14px)', fontWeight: 400,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)',
              marginTop: 'clamp(10px, 1.5vh, 16px)', marginBottom: 0,
              lineHeight: 1.2
            }}>
              {current.subtitle}
            </p>
          )}
        </div>

        {/* CTA - Bottom Position, Smaller */}
        {current?.cta_text && current?.cta_link && (
          <div style={{
            position: 'absolute', bottom: 'clamp(80px, 12vh, 120px)', left: '50%',
            transform: 'translateX(-50%)', zIndex: 2
          }}>
            <Link
              href={current.cta_link}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 'clamp(9px, 1vw, 11px)',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: 'clamp(8px, 1.2vw, 10px) clamp(22px, 3vw, 28px)',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: getFont('body')
              }}
              className="hero-cta-liquid"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'translateX(-50%) translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Liquid shine effect */}
              <span style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                transition: 'left 0.6s ease'
              }}
              className="liquid-shine"
              />
              {current.cta_text}
            </Link>
          </div>
        )}

        {/* Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={() => { prevSlide(); pauseAutoSlide(); setTimeout(resumeAutoSlide, 5000); }}
              style={{
                position: 'absolute', top: '50%', left: 20, transform: 'translateY(-50%)',
                zIndex: 3, width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.4s ease'
              }}
              className="hero-arrow"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button
              onClick={() => { nextSlide(); pauseAutoSlide(); setTimeout(resumeAutoSlide, 5000); }}
              style={{
                position: 'absolute', top: '50%', right: 20, transform: 'translateY(-50%)',
                zIndex: 3, width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.4s ease'
              }}
              className="hero-arrow"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </>
        )}

        {/* Indicators */}
        {totalSlides > 1 && (
          <div style={{
            position: 'absolute', bottom: 'clamp(18px, 3vh, 30px)', left: '50%',
            transform: 'translateX(-50%)', zIndex: 3,
            display: 'flex', gap: 5, alignItems: 'center'
          }}>
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => { goToSlide(index); pauseAutoSlide(); setTimeout(resumeAutoSlide, 5000); }}
                style={{
                  width: index === currentSlide ? 50 : 35, height: 1.5,
                  background: index === currentSlide ? '#fff' : 'rgba(255,255,255,0.2)',
                  cursor: 'pointer', border: 'none', outline: 'none',
                  borderRadius: 1, transition: 'all 0.4s ease'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .hero-container:hover .hero-arrow {
          opacity: 1 !important;
        }
        .hero-cta-liquid:hover .liquid-shine {
          left: 100% !important;
        }
        @keyframes heroZoom {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
        @media (max-width: 640px) {
          .hero-arrow {
            width: 36px !important;
            height: 36px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
    </>
  );
}
