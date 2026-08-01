'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

export default function HeroBanner({ slides = [] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const slideIntervalRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);

  const totalSlides = slides.length;

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

        {/* Content */}
        <div style={{
          position: 'absolute', bottom: 'clamp(30px, 8vh, 70px)', left: '50%',
          transform: 'translateX(-50%)', zIndex: 2, textAlign: 'center',
          width: '88%', maxWidth: 680, padding: '0 16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          {/* Title */}
          <h1 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(18px, 3.5vw, 48px)', fontWeight: 700,
            lineHeight: 1.1, color: '#fff', margin: 0,
            letterSpacing: '-0.3px', order: 1
          }}>
            {current?.title}
          </h1>

          {/* Subtitle */}
          {current?.subtitle && (
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(6px, 0.85vw, 8px)', fontWeight: 400,
              letterSpacing: '0.35em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              marginTop: 'clamp(6px, 1vh, 10px)', marginBottom: 0,
              lineHeight: 1, order: 2
            }}>
              {current.subtitle}
            </p>
          )}

          {/* CTA */}
          {current?.cta_text && current?.cta_link && (
            <div style={{
              marginTop: 'clamp(8px, 1.5vh, 16px)', order: 3
            }}>
              <Link
                href={current.cta_link}
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(7px, 0.85vw, 9px)', fontWeight: 500,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
                  padding: '0 0 3px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.25)',
                  transition: 'all 0.4s ease'
                }}
                className="hero-cta-link"
              >
                {current.cta_text}
              </Link>
            </div>
          )}
        </div>

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
        .hero-cta-link:hover {
          color: #fff !important;
          border-bottom-color: rgba(255,255,255,0.8) !important;
          padding-right: 16px !important;
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
