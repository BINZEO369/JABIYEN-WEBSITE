'use client';

import { useState, useEffect, useRef } from 'react';

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastScrollY = useRef(0);
  const barRef = useRef(null);

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
          // Delay appearance for smooth entrance
          setTimeout(() => setIsVisible(true), 100);
        }
      } catch (e) {}
    }
    fetchAnnouncement();
  }, []);

  useEffect(() => {
    let ticking = false;
    let lastKnownScroll = window.scrollY;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastKnownScroll;
          const scrollingDown = delta > 2;
          const scrollingUp = delta < -2;
          const atTop = currentScrollY <= 3;
          
          if (scrollingDown && currentScrollY > 50) {
            setIsVisible(false);
          } else if ((scrollingUp || atTop) && currentScrollY < 100) {
            setIsVisible(true);
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

  const dismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('jabiyen_announcement_hidden', 'true');
    setTimeout(() => setAnnouncement(null), 600);
  };

  if (!announcement || !announcement.message) return null;

  const bgColor = announcement.bg_color || '#000000';
  const textColor = announcement.text_color || '#ffffff';

  return (
    <>
      <div
        ref={barRef}
        style={{
          background: bgColor,
          color: textColor,
          fontFamily: "var(--font-body), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 'clamp(11px, 1.2vw, 13px)',
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 60,
          padding: '0 45px',
          textAlign: 'center',
          overflow: 'hidden',
          transition: 'transform 0.6s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.5s cubic-bezier(0.33, 1, 0.68, 1)',
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
          willChange: 'transform, opacity',
          boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset'
        }}
      >
        {/* Left spacer */}
        <div style={{ width: 28, flexShrink: 0 }} />
        
        {/* Center content */}
        <span style={{
          flex: 1,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          <span style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.5s cubic-bezier(0.33, 1, 0.68, 1) 0.15s, transform 0.5s cubic-bezier(0.33, 1, 0.68, 1) 0.15s',
            display: 'inline-block'
          }}>
            {announcement.message}
            {announcement.link_url && announcement.link_title && (
              <a href={announcement.link_url} target="_blank" rel="noopener noreferrer" style={{
                color: textColor,
                textDecoration: 'none',
                fontWeight: 600,
                marginLeft: 8,
                opacity: 0.8,
                borderBottom: `1px solid ${textColor}`,
                borderBottomWidth: 1,
                paddingBottom: 1,
                transition: 'opacity 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={(e) => { e.target.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.target.style.opacity = '0.8'; }}
              >
                {announcement.link_title}
              </a>
            )}
          </span>
        </span>

        {/* Close button */}
        <button onClick={dismiss} style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          color: textColor,
          cursor: 'pointer',
          opacity: 0.5,
          transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.33, 1, 0.68, 1)',
          flexShrink: 0,
          borderRadius: '50%'
        }}
        onMouseEnter={(e) => { e.target.style.opacity = '0.9'; e.target.style.transform = 'scale(1.08)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
        onMouseLeave={(e) => { e.target.style.opacity = '0.5'; e.target.style.transform = 'scale(1)'; e.target.style.background = 'none'; }}
        aria-label="Close Announcement">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div style={{
        height: isVisible ? 38 : 0,
        flexShrink: 0,
        transition: 'height 0.6s cubic-bezier(0.33, 1, 0.68, 1)'
      }} />
    </>
  );
}
