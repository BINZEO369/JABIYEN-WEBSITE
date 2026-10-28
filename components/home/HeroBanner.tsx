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
      >
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <img
              src={slide.img}
              alt={slide.title || 'JAYENWARE Hero'}
              className={`hero-image ${index === currentSlide ? 'zooming' : ''}`}
            />
          </div>
        ))}

        {/* Gradient Overlay */}
        <div className="hero-gradient" />

        {/* Content */}
        <div className="hero-content">
          <span className="hero-eyebrow">New Collection</span>
          <h1 className="hero-title">{current?.title}</h1>
          {current?.subtitle && (
            <p className="hero-subtitle">{current.subtitle}</p>
          )}
          {current?.cta_text && current?.cta_link && (
            <div className="hero-cta-wrap">
              <Link href={current.cta_link} className="hero-cta">
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
              className="hero-arrow hero-arrow-left"
              aria-label="Previous slide"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => { nextSlide(); pauseAutoSlide(); setTimeout(resumeAutoSlide, 5000); }}
              className="hero-arrow hero-arrow-right"
              aria-label="Next slide"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Indicators */}
        {totalSlides > 1 && (
          <div className="hero-indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => { goToSlide(index); pauseAutoSlide(); setTimeout(resumeAutoSlide, 5000); }}
                className={`hero-indicator ${index === currentSlide ? 'active' : ''}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        /* ============================================
           HERO CONTAINER
           ============================================ */
        .hero-container {
          position: relative;
          width: 100%;
          height: 62vh;
          min-height: 480px;
          max-height: 760px;
          overflow: hidden;
          background: #000;
        }

        /* Slides */
        .hero-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
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
        .hero-image.zooming {
          animation: heroZoom 22s ease-in-out infinite alternate;
        }
        @keyframes heroZoom {
          from { transform: scale(1); }
          to { transform: scale(1.06); }
        }

        /* Gradient */
        .hero-gradient {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.08) 35%,
            rgba(0, 0, 0, 0.28) 60%,
            rgba(0, 0, 0, 0.58) 85%,
            rgba(0, 0, 0, 0.78) 100%
          );
        }

        /* ============================================
           CONTENT — Matches checkout/payment typography
           ============================================ */
        .hero-content {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 24px 70px;
        }

        .hero-eyebrow {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 22px;
          line-height: 1;
        }

        .hero-title {
          font-family: var(--font-heading, 'Manrope', sans-serif);
          font-size: clamp(32px, 5.5vw, 76px);
          font-weight: 300;
          line-height: 1.02;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #ffffff;
          margin: 0;
          max-width: 900px;
        }

        .hero-subtitle {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.75);
          margin: 24px 0 0;
          line-height: 1.5;
          max-width: 560px;
        }

        /* CTA — Matches checkout btn-outline (white on dark) */
        .hero-cta-wrap {
          margin-top: 38px;
        }

        .hero-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 52px;
          padding: 0 40px;
          background: transparent;
          color: #ffffff;
          border: 1px solid #ffffff;
          border-radius: 0;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.3s ease, color 0.3s ease;
        }
        .hero-cta:hover {
          background: #ffffff;
          color: #000000;
        }

        /* ============================================
           ARROWS — Sharp, thin border
           ============================================ */
        .hero-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          width: 52px;
          height: 52px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.35);
          border-radius: 0;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease, background 0.3s ease, border-color 0.3s ease;
        }
        .hero-arrow:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: #ffffff;
        }
        .hero-arrow-left { left: 28px; }
        .hero-arrow-right { right: 28px; }
        .hero-container:hover .hero-arrow {
          opacity: 1;
        }

        /* ============================================
           INDICATORS — Thin lines
           ============================================ */
        .hero-indicators {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .hero-indicator {
          width: 32px;
          height: 1px;
          background: rgba(255, 255, 255, 0.28);
          border: none;
          border-radius: 0;
          cursor: pointer;
          padding: 0;
          transition: background 0.4s ease, width 0.4s ease;
        }
        .hero-indicator.active {
          width: 60px;
          background: #ffffff;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 767px) {
          .hero-container {
            height: 72vh;
            min-height: 540px;
          }

          .hero-content {
            padding: 0 20px 60px;
          }

          .hero-eyebrow {
            font-size: 9px;
            letter-spacing: 0.3em;
            margin-bottom: 16px;
          }

          .hero-title {
            font-size: clamp(28px, 9vw, 44px);
            letter-spacing: 1.5px;
            line-height: 1.05;
          }

          .hero-subtitle {
            font-size: 9px;
            letter-spacing: 3px;
            margin-top: 16px;
          }

          .hero-cta-wrap {
            margin-top: 28px;
          }

          .hero-cta {
            height: 46px;
            padding: 0 32px;
            font-size: 10px;
            letter-spacing: 1.6px;
          }

          .hero-arrow {
            display: none;
          }

          .hero-indicators {
            bottom: 22px;
            gap: 8px;
          }

          .hero-indicator {
            width: 24px;
          }
          .hero-indicator.active {
            width: 44px;
          }
        }

        @media (min-width: 1280px) {
          .hero-container {
            height: 88vh;
            max-height: 880px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-image.zooming {
            animation: none;
          }
          .hero-slide {
            transition: opacity 0.4s ease;
          }
        }
      `}</style>
    </>
  );
}
