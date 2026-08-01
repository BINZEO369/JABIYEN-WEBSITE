'use client';

import { useState, useEffect, useRef } from 'react';

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const lastScrollY = useRef(0);
  const barRef = useRef(null);
  const contentRef = useRef(null);

  // ============ FETCH ANNOUNCEMENT ============
  useEffect(() => {
    const dismissed = localStorage.getItem('jabiyen_announcement_hidden') === 'true';
    setIsDismissed(dismissed);

    async function fetchAnnouncement() {
      try {
        const res = await fetch('/api/announcement');
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data && data.message && !dismissed) {
          setAnnouncement(data);
          const timer = setTimeout(() => setIsVisible(true), 150);
          return () => clearTimeout(timer);
        }
      } catch (e) {}
    }
    fetchAnnouncement();
  }, []);

  // ============ SCROLL LOGIC (Apple/Gucci-style) ============
  useEffect(() => {
    let ticking = false;
    let lastKnownScroll = window.scrollY;
    let scrollAccumulator = 0;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const rawDelta = currentScrollY - lastKnownScroll;
          
          // Accumulate small scrolls for natural feel
          scrollAccumulator += rawDelta;
          
          if (Math.abs(scrollAccumulator) > 8) {
            const scrollingDown = scrollAccumulator > 0;
            
            if (scrollingDown && currentScrollY > 40) {
              setIsVisible(false);
            } else if (!scrollingDown && currentScrollY < 80) {
              setIsVisible(true);
            }
            
            scrollAccumulator = 0;
          }
          
          // Always show at absolute top
          if (currentScrollY <= 2) {
            setIsVisible(true);
            scrollAccumulator = 0;
          }
          
          lastKnownScroll = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [announcement, isDismissed]);

  // ============ DISMISS ============
  const dismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('jabiyen_announcement_hidden', 'true');
    setTimeout(() => setAnnouncement(null), 700);
  };

  if (!announcement || !announcement.message) return null;

  const bgColor = announcement.bg_color || '#0a0a0a';
  const textColor = announcement.text_color || '#f5f5f7';

  return (
    <>
      {/* ============ MAIN BAR ============ */}
      <div
        ref={barRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          // Background
          background: bgColor,
          color: textColor,
          
          // Typography
          fontFamily: "var(--font-body), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: '0.6875rem',
          fontWeight: 450,
          letterSpacing: '0.035em',
          textTransform: 'uppercase',
          
          // Layout
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 60,
          padding: '0 48px',
          textAlign: 'center',
          overflow: 'hidden',
          
          // Animation
          transition: 'transform 0.65s cubic-bezier(0.32, 0.94, 0.60, 1), opacity 0.45s cubic-bezier(0.32, 0.94, 0.60, 1)',
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
          willChange: 'transform',
          
          // Subtle styling
          borderBottom: isHovered ? `1px solid ${textColor}15` : '1px solid transparent',
          transition: 'transform 0.65s cubic-bezier(0.32, 0.94, 0.60, 1), opacity 0.45s cubic-bezier(0.32, 0.94, 0.60, 1), border-color 0.4s ease'
        }}
      >
        {/* ============ LEFT SPACER ============ */}
        <div style={{ width: 32, flexShrink: 0 }} />

        {/* ============ CENTER CONTENT ============ */}
        <div
          ref={contentRef}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            overflow: 'hidden'
          }}
        >
          <span style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.55s cubic-bezier(0.32, 0.94, 0.60, 1) 0.2s, transform 0.55s cubic-bezier(0.32, 0.94, 0.60, 1) 0.2s'
          }}>
            {announcement.message}
            
            {announcement.link_url && announcement.link_title && (
              <>
                <span style={{ margin: '0 6px', opacity: 0.3' }}>·</span>
                <a
                  href={announcement.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: textColor,
                    textDecoration: 'none',
                    fontWeight: 550,
                    opacity: 0.75,
                    position: 'relative',
                    paddingBottom: 2,
                    transition: 'opacity 0.25s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.target.style.opacity = '1'; }}
                  onMouseLeave={(e) => { e.target.style.opacity = '0.75'; }}
                >
                  {announcement.link_title}
                  {/* Underline effect */}
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: 1,
                    background: textColor,
                    transform: 'scaleX(0)',
                    transformOrigin: 'right',
                    transition: 'transform 0.35s cubic-bezier(0.32, 0.94, 0.60, 1)'
                  }}
                  className="link-underline"
                  />
                </a>
              </>
            )}
          </span>
        </div>

        {/* ============ CLOSE BUTTON ============ */}
        <button
          onClick={dismiss}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isHovered ? `${textColor}08` : 'transparent',
            border: 'none',
            color: textColor,
            cursor: 'pointer',
            opacity: isHovered ? 0.7 : 0.35,
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.35s cubic-bezier(0.32, 0.94, 0.60, 1)',
            flexShrink: 0,
            borderRadius: '50%',
            outline: 'none'
          }}
          aria-label="Close announcement"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ============ SPACER ============ */}
      <div style={{
        height: isVisible ? 40 : 0,
        flexShrink: 0,
        transition: 'height 0.65s cubic-bezier(0.32, 0.94, 0.60, 1)'
      }} />

      {/* ============ LINK UNDERLINE HOVER ============ */}
      <style jsx>{`
        a:hover .link-underline {
          transform: scaleX(1) !important;
          transform-origin: left !important;
        }
      `}</style>
    </>
  );
}
