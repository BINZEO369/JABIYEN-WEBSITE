'use client';

import { useState, useEffect, useRef } from 'react';

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastScrollY = useRef(0);

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
          setIsVisible(true);
        }
      } catch (e) {}
    }
    fetchAnnouncement();
  }, []);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollingDown = currentScrollY > lastScrollY.current;
          const nearTop = currentScrollY <= 5;
          
          if (scrollingDown && currentScrollY > 60) {
            setIsVisible(false);
          } else if (nearTop) {
            setIsVisible(true);
          }
          
          lastScrollY.current = currentScrollY;
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
    setTimeout(() => setAnnouncement(null), 500);
  };

  if (!announcement || !announcement.message) return null;

  const bgColor = announcement.bg_color || '#000000';
  const textColor = announcement.text_color || '#ffffff';

  return (
    <>
      <div style={{
        background: bgColor,
        color: textColor,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 'clamp(8px, 1vw, 10px)',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 60,
        padding: '0 45px 0 16px',
        textAlign: 'center',
        overflow: 'hidden',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        willChange: 'transform, opacity',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}>
        <span style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 'calc(100% - 60px)'
        }}>
          {announcement.message}
          {announcement.link_url && announcement.link_title && (
            <a href={announcement.link_url} target="_blank" rel="noopener noreferrer" style={{
              color: textColor,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              fontWeight: 700,
              marginLeft: 6,
              opacity: 0.85,
              transition: 'opacity 0.2s ease'
            }}>
              {announcement.link_title}
            </a>
          )}
        </span>
        <button onClick={dismiss} style={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: textColor,
          cursor: 'pointer',
          padding: 4,
          opacity: 0.6,
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          flexShrink: 0
        }}
        onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(-50%) scale(1.1)'; }}
        onMouseLeave={(e) => { e.target.style.opacity = '0.6'; e.target.style.transform = 'translateY(-50%) scale(1)'; }}
        aria-label="Close Announcement">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Spacer */}
      <div style={{
        height: isVisible ? 36 : 0,
        flexShrink: 0,
        transition: 'height 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      }} />

      {/* Smooth scroll styles */}
      <style jsx global>{`
        @media (max-width: 480px) {
          .announcement-text {
            font-size: 8px !important;
            letter-spacing: 0.05em !important;
          }
        }
      `}</style>
    </>
  );
}
