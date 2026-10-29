'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HeroBanner({ slides = [] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const slideIntervalRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);

  const totalSlides = slides.length;

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

  const handleTouchStart = (e) => { touchStartX.current = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextSlide() : prevSlide();
      pauseAutoSlide();
      setTimeout(resumeAutoSlide, 5000);
    }
  };

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
          position: 'relative', width: '100%', overflow: 'hidden', background: '#fff',
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
              }}
            />
          </div>
        ))}

        {/* Dark Gradient Overlay for Text Readability */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.02) 30%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.7) 90%, rgba(0,0,0,0.85) 100%)'
        }} />

        {/* Content */}
        <div style={{
          position: 'absolute', top: '45%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center',
          width: '88%', maxWidth: 800, padding: '0 16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          {/* Title from Database */}
          <h1 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(28px, 5vw, 64px)', fontWeight: 300,
            lineHeight: 1.1, color: '#fff', margin: 0,
            letterSpacing: '2px', textTransform: 'uppercase'
          }}>
            {current?.title}
          </h1>

          {/* Subtitle from Database */}
          {current?.subtitle && (
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 1.2vw, 14px)', fontWeight: 500,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.75)',
              marginTop: 'clamp(10px, 1.5vh, 16px)', marginBottom: 0,
              lineHeight: 1.2
            }}>
              {current.subtitle}
            </p>
          )}
        </div>

        {/* CTA - Button Text & Link from Database */}
        {current?.cta_text && current?.cta_link && (
          <div style={{
            position: 'absolute', bottom: 'clamp(80px, 12vh, 120px)', left: '50%',
            transform: 'translateX(-50%)', zIndex: 10
          }}>
            <Link
              href={current.cta_link}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '11px', fontWeight: 500,
                letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none',
                padding: '14px 32px', borderRadius: '0',
                background: 'transparent', border: '1px solid #fff',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#fff';
              }}
            >
              {current.cta_text}
            </Link>
          </div>
        )}

        {/* Indicators */}
        {totalSlides > 1 && (
          <div style={{
            position: 'absolute', bottom: 'clamp(18px, 3vh, 30px)', left: '50%',
            transform: 'translateX(-50%)', zIndex: 11,
            display: 'flex', gap: 8, alignItems: 'center'
          }}>
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => { goToSlide(index); pauseAutoSlide(); setTimeout(resumeAutoSlide, 5000); }}
                style={{
                  width: index === currentSlide ? 60 : 32, height: 1.5,
                  background: index === currentSlide ? '#fff' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', border: 'none', outline: 'none',
                  borderRadius: 0, transition: 'all 0.4s ease'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        /* ✅ উপরের দিকের সাদা শ্যাডো (Top Fade) */
        .hero-container::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 20%;
          background: linear-gradient(
            to bottom, 
            rgba(255, 255, 255, 1) 0%, 
            rgba(255, 255, 255, 0.8) 30%, 
            rgba(255, 255, 255, 0) 100%
          );
          z-index: 2;
          pointer-events: none;
        }

        /* ✅ নিচের দিকের সাদা শ্যাডো (Bottom Fade) */
        .hero-container::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 20%;
          background: linear-gradient(
            to top, 
            rgba(255, 255, 255, 1) 0%, 
            rgba(255, 255, 255, 0.8) 30%, 
            rgba(255, 255, 255, 0) 100%
          );
          z-index: 2;
          pointer-events: none;
        }

        @keyframes heroZoom {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
        
        @media (max-width: 640px) {
          .hero-container::before, .hero-container::after {
            height: 15%; /* মোবাইলে একটু কম জায়গা নেবে */
          }
        }
      `}</style>
    </>
  );
}
