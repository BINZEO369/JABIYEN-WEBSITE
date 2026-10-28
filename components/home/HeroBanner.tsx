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

  // Preload images
  useEffect(() => {
    if (!slides.length) return;
    slides.forEach((slide) => {
      const img = new Image();
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
      >
        {/* Slides — full bleed image with subtle fade */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <img
              src={slide.img}
              alt={slide.title || 'JABIYEN'}
              className="hero-image"
            />
          </div>
        ))}

        {/* Gradient overlay — subtle, bottom-anchored */}
        <div className="hero-overlay" />

        {/* Content — bottom center, editorial */}
        <div className="hero-content">
          {current?.subtitle && (
            <span className="hero-eyebrow">{current.subtitle}</span>
          )}

          <h1 className="hero-title">{current?.title}</h1>

          {current?.cta_text && current?.cta_link && (
            <Link href={current.cta_link} className="hero-cta">
              {current.cta_text}
            </Link>
          )}
        </div>

        {/* Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={() => { prevSlide(); pauseAutoSlide(); setTimeout(resumeAutoSlide, 5000); }}
              className="hero-arrow hero-arrow-left"
              aria-label="Previous slide"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => { nextSlide(); pauseAutoSlide(); setTimeout(resumeAutoSlide, 5000); }}
              className="hero-arrow hero-arrow-right"
              aria-label="Next slide"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Indicators — thin bars */}
        {totalSlides > 1 && (
          <div className="hero-indicators" role="tablist">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => { goToSlide(index); pauseAutoSlide(); setTimeout(resumeAutoSlide, 5000); }}
                className={`hero-indicator ${index === currentSlide ? 'active' : ''}`}
                aria-label={`Go to slide ${index + 1}`}
                aria-selected={index === currentSlide}
                role="tab"
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        /* ============================================
           HERO CONTAINER — Full bleed, luxury
           ============================================ */
        .hero-container {
          position: relative;
          width: 100%;
          height: 88vh;
          min-height: 560px;
          max-height: 900px;
          overflow: hidden;
          background: #000;
          user-select: none;
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }
        .hero-slide.active {
          opacity: 1;
          pointer-events: auto;
        }

        .hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .hero-slide.active .hero-image {
          animation: heroZoom 24s ease-in-out infinite alternate;
        }

        @keyframes heroZoom {
          from { transform: scale(1); }
          to { transform: scale(1.04); }
        }

        /* ============================================
           OVERLAY — Subtle bottom gradient only
           ============================================ */
        .hero-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0) 40%,
            rgba(0, 0, 0, 0.22) 68%,
            rgba(0, 0, 0, 0.55) 100%
          );
          pointer-events: none;
        }

        /* ============================================
           CONTENT — Bottom center, editorial
           ============================================ */
        .hero-content {
          position: absolute;
          left: 50%;
          bottom: clamp(80px, 12vh, 140px);
          transform: translateX(-50%);
          z-index: 2;
          text-align: center;
          width: 100%;
          max-width: 780px;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Eyebrow — small uppercase, wide tracking */
        .hero-eyebrow {
          font-family: var(--font-body, "Helvetica Neue", Helvetica, Arial, sans-serif);
          font-size: clamp(9px, 1vw, 11px);
          font-weight: 500;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.78);
          display: block;
          line-height: 1;
          margin-bottom: clamp(12px, 2vh, 18px);
        }

        /* Title — large but refined weight 300 */
        .hero-title {
          font-family: var(--font-heading, "Helvetica Neue", Helvetica, Arial, sans-serif);
          font-size: clamp(34px, 5.5vw, 72px);
          font-weight: 300;
          letter-spacing: -0.02em;
          line-height: 1.05;
          color: #ffffff;
          margin: 0;
          padding: 0;
          max-width: 100%;
          word-wrap: break-word;
        }

        /* CTA — thin border, sharp corners, no blur */
        .hero-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: clamp(20px, 3vh, 32px);
          padding: 14px 40px;
          background: transparent;
          color: #ffffff;
          font-family: var(--font-body, "Helvetica Neue", Helvetica, Arial, sans-serif);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.85);
          border-radius: 0;
          transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        .hero-cta:hover {
          background: #ffffff;
          color: #000000;
          border-color: #ffffff;
        }

        /* ============================================
           ARROWS — Minimal, hidden until hover
           ============================================ */
        .hero-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.32);
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease, background 0.3s ease, border-color 0.3s ease;
        }
        .hero-container:hover .hero-arrow {
          opacity: 1;
        }
        .hero-arrow:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.65);
        }
        .hero-arrow-left { left: 24px; }
        .hero-arrow-right { right: 24px; }

        /* ============================================
           INDICATORS — Thin bars at bottom
           ============================================ */
        .hero-indicators {
          position: absolute;
          bottom: clamp(24px, 4vh, 40px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hero-indicator {
          width: 24px;
          height: 1px;
          background: rgba(255, 255, 255, 0.32);
          border: none;
          cursor: pointer;
          padding: 0;
          border-radius: 0;
          transition: width 0.4s ease, background 0.4s ease;
        }
        .hero-indicator.active {
          width: 44px;
          background: #ffffff;
        }

        /* ============================================
           MOBILE
           ============================================ */
        @media (max-width: 768px) {
          .hero-container {
            height: 82vh;
            min-height: 500px;
            max-height: 720px;
          }
          .hero-arrow {
            width: 36px;
            height: 36px;
            opacity: 1;
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(255, 255, 255, 0.25);
          }
          .hero-arrow-left { left: 12px; }
          .hero-arrow-right { right: 12px; }
          .hero-cta {
            padding: 12px 30px;
            font-size: 10px;
            letter-spacing: 0.2em;
          }
          .hero-eyebrow {
            letter-spacing: 0.28em;
          }
          .hero-content {
            bottom: clamp(72px, 11vh, 110px);
            padding: 0 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-slide.active .hero-image { animation: none; }
          .hero-slide { transition: none; }
          .hero-cta, .hero-arrow, .hero-indicator { transition: none; }
        }
      `}</style>
    </>
  );
}
