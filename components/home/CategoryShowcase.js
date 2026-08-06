'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

export default function CategoryShowcase() {
  const [data, setData] = useState({ header: null, menCategories: [], womenCategories: [] });
  const [currentGender, setCurrentGender] = useState('women');
  const [previousGender, setPreviousGender] = useState('women');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);
  const [animationPhase, setAnimationPhase] = useState('idle'); // 'idle' | 'exiting' | 'entering'
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  const womenRef = useRef(null);
  const menRef = useRef(null);
  const tabContainerRef = useRef(null);

  const apiEndpoint = '/api/home-showcase/complete';

  const createSlug = (text) => {
    if (!text) return '';
    return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
  };

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(apiEndpoint);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        setData({
          header: result.header || null,
          menCategories: result.menCategories || [],
          womenCategories: result.womenCategories || []
        });
        setIsLoaded(true);
      } catch (error) {
        console.error('[CategoryShowcase] Fetch error:', error);
      }
    }
    fetchData();
  }, []);

  // Update underline position
  useEffect(() => {
    const activeRef = currentGender === 'women' ? womenRef.current : menRef.current;
    if (activeRef && tabContainerRef.current) {
      const tabRect = activeRef.getBoundingClientRect();
      const containerRect = tabContainerRef.current.getBoundingClientRect();
      setUnderlineStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width
      });
    }
  }, [currentGender]);

  const hasData = data.menCategories.length > 0 || data.womenCategories.length > 0;

  const switchGender = (gender) => {
    if (isAnimating || currentGender === gender) return;
    
    setPreviousGender(currentGender);
    setSlideDirection(gender === 'men' ? 'right' : 'left');
    setIsAnimating(true);
    setAnimationPhase('exiting');

    // Ultra-fast switch timing
    setTimeout(() => {
      setCurrentGender(gender);
      setAnimationPhase('entering');
      
      setTimeout(() => {
        setAnimationPhase('idle');
        setIsAnimating(false);
      }, 300);
    }, 250);
  };

  const getCategories = (gender) => {
    const cats = gender === 'men' ? data.menCategories : data.womenCategories;
    return [...cats].sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999));
  };

  const currentCategories = getCategories(currentGender);
  const previousCategories = getCategories(previousGender);

  if (!isLoaded) return null;
  if (!hasData) return null;

  return (
    <>
      {/* Header */}
      {data.header && (
        <div style={{
          textAlign: 'center', padding: '40px 20px 20px',
          maxWidth: 800, margin: '0 auto'
        }}>
          {data.header.title && (
            <h2 style={{
              fontSize: 'clamp(14px, 2vw, 16px)', fontWeight: 500,
              color: '#1d1d1f', margin: '0 0 6px 0',
              fontFamily: "'Manrope', sans-serif", letterSpacing: '-0.02em'
            }}>
              {data.header.title}
            </h2>
          )}
          {data.header.subtitle && (
            <p style={{
              fontSize: 'clamp(10px, 1.2vw, 11px)', color: '#86868b',
              margin: 0, lineHeight: 1.4, fontFamily: "'Inter', sans-serif"
            }}>
              {data.header.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Tabs with Sliding Underline */}
      <div 
        ref={tabContainerRef}
        style={{
          display: 'flex', justifyContent: 'center', gap: 40,
          padding: '10px 0 25px', borderBottom: '1px solid rgba(0,0,0,0.08)',
          margin: '0 20px', position: 'relative'
        }}
      >
        {['women', 'men'].map(gender => (
          <button
            key={gender}
            ref={gender === 'women' ? womenRef : menRef}
            onClick={() => switchGender(gender)}
            style={{
              background: 'none', border: 'none',
              fontSize: 15, fontWeight: currentGender === gender ? 500 : 400,
              color: currentGender === gender ? '#1d1d1f' : '#86868b',
              cursor: 'pointer', padding: '8px 4px', position: 'relative',
              fontFamily: "'Inter', -apple-system, sans-serif",
              letterSpacing: '-0.01em', outline: 'none',
              transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {gender.charAt(0).toUpperCase() + gender.slice(1)}
          </button>
        ))}
        
        {/* Sliding Underline */}
        <span style={{
          position: 'absolute',
          bottom: -1,
          left: `${underlineStyle.left}px`,
          width: `${underlineStyle.width}px`,
          height: 2,
          background: '#1d1d1f',
          borderRadius: 1,
          transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1), width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Grid Container with Animation */}
      <div style={{ 
        overflow: 'hidden', 
        position: 'relative', 
        background: '#fff',
        minHeight: '200px'
      }}>
        {/* Previous Grid (Exiting) */}
        {isAnimating && animationPhase === 'exiting' && (
          <div
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2, background: '#f5f5f7',
              position: 'absolute', top: 0, left: 0, right: 0,
              animation: `${slideDirection === 'right' ? 'slideOutLeft' : 'slideOutRight'} 0.25s cubic-bezier(0.4, 0, 0.6, 1) forwards`
            }}
          >
            {previousCategories.map((item, index) => {
              const cat = item.categories;
              if (!cat) return null;
              const catName = cat.name || 'Category';
              const catSlug = cat.slug || createSlug(catName);
              const imgSrc = cat.image_url || cat.image || '';

              return (
                <Link
                  key={`prev-${item.id || index}`}
                  href={`/${catSlug}`}
                  style={{
                    position: 'relative', display: 'flex', flexDirection: 'column',
                    textDecoration: 'none', background: '#fff', cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    position: 'relative', width: '100%', aspectRatio: '3/4',
                    overflow: 'hidden', background: '#f5f5f7'
                  }}>
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={catName}
                        loading="lazy"
                        style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 100%)'
                      }} />
                    )}
                  </div>
                  <div style={{
                    padding: '20px 16px 28px', textAlign: 'center', background: '#fff'
                  }}>
                    <h3 style={{
                      fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.2,
                      margin: 0, color: '#1d1d1f',
                      fontFamily: "'Sora', -apple-system, sans-serif",
                      fontWeight: 500, letterSpacing: '-0.01em'
                    }}>
                      {catName}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Current/New Grid */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2, background: '#f5f5f7',
            animation: isAnimating && animationPhase === 'entering'
              ? `${slideDirection === 'right' ? 'slideInRight' : 'slideInLeft'} 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`
              : 'none',
            opacity: isAnimating && animationPhase === 'exiting' ? 0 : 1
          }}
        >
          {currentCategories.map((item, index) => {
            const cat = item.categories;
            if (!cat) return null;
            const catName = cat.name || 'Category';
            const catSlug = cat.slug || createSlug(catName);
            const imgSrc = cat.image_url || cat.image || '';

            return (
              <Link
                key={item.id || index}
                href={`/${catSlug}`}
                style={{
                  position: 'relative', display: 'flex', flexDirection: 'column',
                  textDecoration: 'none', background: '#fff', cursor: 'pointer',
                  overflow: 'hidden'
                }}
                className="showcase-category-card"
              >
                {/* Image */}
                <div style={{
                  position: 'relative', width: '100%', aspectRatio: '3/4',
                  overflow: 'hidden', background: '#f5f5f7'
                }}>
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={catName}
                      loading={index < 4 ? 'eager' : 'lazy'}
                      style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover', transition: 'transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1)'
                      }}
                      className="card-image-hover"
                    />
                  ) : (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 100%)'
                    }} />
                  )}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0)', transition: 'background 0.5s ease'
                  }} className="card-overlay-hover" />
                </div>

                {/* Content */}
                <div style={{
                  padding: '20px 16px 28px', textAlign: 'center', background: '#fff'
                }}>
                  <h3 style={{
                    fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.2,
                    margin: 0, color: '#1d1d1f',
                    fontFamily: "'Sora', -apple-system, sans-serif",
                    fontWeight: 500, letterSpacing: '-0.01em'
                  }}>
                    {catName}
                  </h3>
                  <span style={{
                    display: 'inline-block', marginTop: 8, fontSize: 11,
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    color: '#86868b', letterSpacing: '0.02em',
                    textTransform: 'uppercase', opacity: 0,
                    transform: 'translateY(5px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease'
                  }} className="explore-hover">
                    Explore
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Hover Styles */}
      <style jsx>{`
        .showcase-category-card:hover .card-image-hover {
          transform: scale(1.03);
        }
        .showcase-category-card:hover .card-overlay-hover {
          background: rgba(0,0,0,0.03);
        }
        .showcase-category-card:hover .explore-hover {
          opacity: 1;
          transform: translateY(0);
        }
        .showcase-category-card:active .card-image-hover {
          transform: scale(0.98);
          transition: transform 0.2s ease;
        }

        @keyframes slideOutLeft {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }

        @keyframes slideOutRight {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes slideInLeft {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 767px) {
          .showcase-category-card h3 {
            font-size: 14px !important;
          }
        }
      `}</style>
    </>
  );
}
