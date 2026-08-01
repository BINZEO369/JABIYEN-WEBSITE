'use client';

import { useState, useEffect, useRef } from 'react';

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const lastScrollY = useRef(0);
  const hideTimer = useRef(null);
  const showTimer = useRef(null);

  // Fetch with entrance animation sequencing
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
          // Staggered animation: bar → text
          requestAnimationFrame(() => {
            setIsVisible(true);
            setTimeout(() => setTextVisible(true), 350);
          });
        }
      } catch (e) {}
    }
    fetchAnnouncement();
  }, []);

  // Scroll: hide on scroll down, reveal on scroll up (Apple-style)
  useEffect(() => {
    let ticking = false;
    let lastKnownScroll = window.scrollY;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastKnownScroll;
          
          // Hide when scrolling down past threshold
          if (delta > 3 && currentScrollY > 55) {
            setTextVisible(false);
            clearTimeout(hideTimer.current);
            hideTimer.current = setTimeout(() => setIsVisible(false), 80);
          } 
          // Show when scrolling up or near top
          else if (delta < -2 && currentScrollY < 200) {
            clearTimeout(showTimer.current);
            setIsVisible(true);
            showTimer.current = setTimeout(() => setTextVisible(true), 200);
          }
          // Always show at very top
          else if (currentScrollY <= 2) {
            clearTimeout(showTimer.current);
            setIsVisible(true);
            showTimer.current = setTimeout(() => setTextVisible(true), 100);
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
    setTextVisible(false);
    setTimeout(() => {
      setIsVisible(false);
      setIsDismissed(true);
      localStorage.setItem('jabiyen_announcement_hidden', 'true');
    }, 200);
    setTimeout(() => setAnnouncement(null), 700);
  };

  if (!announcement || !announcement.message) return null;

  const bgColor = announcement.bg_color || '#000000';
  const textColor = announcement.text_color || '#ffffff';
  const hasLink = announcement.link_url && announcement.link_title;

  return (
    <>
      <div style={{
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
        transition: 'transform 0.65s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.45s cubic-bezier(0.33, 1, 0.68, 1)',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        willChange: 'transform, opacity',
        boxShadow: isVisible ? '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 20px rgba(0,0,0,0.06)' : 'none',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)'
      }}>
        {/* Left spacer for balance */}
        <div style={{ width: 32, flexShrink: 0 }} />
        
        {/* Center content with staggered animation */}
        <span style={{
          flex: 1,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: hasLink ? 10 : 0,
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.55s cubic-bezier(0.33, 1, 0.68, 1) 0.05s, transform 0.55s cubic-bezier(0.33, 1, 0.68, 1) 0.05s'
          }}>
            <span>{announcement.message}</span>
            {hasLink && (
              <>
                <span style={{
                  width: 1,
                  height: 12,
                  background: textColor,
                  opacity: 0.2,
                  display: 'inline-block'
                }} />
                <a href={announcement.link_url} target="_blank" rel="noopener noreferrer" style={{
                  color: textColor,
                  textDecoration: 'none',
                  fontWeight: 600,
                  opacity: 0.8,
                  paddingBottom: 2,
                  borderBottom: `1.5px solid ${textColor}`,
                  transition: 'opacity 0.25s ease, border-color 0.25s ease, transform 0.25s ease',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.target.style.opacity = '0.8'; e.target.style.transform = 'translateY(0)'; }}
                >
                  {announcement.link_title}
                </a>
              </>
            )}
          </span>
        </span>

        {/* Close button */}
        <button onClick={dismiss} style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          color: textColor,
          cursor: 'pointer',
          opacity: 0.45,
          transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.33, 1, 0.68, 1), background 0.25s ease',
          flexShrink: 0,
          borderRadius: '50%'
        }}
        onMouseEnter={(e) => { e.target.style.opacity = '0.9'; e.target.style.transform = 'scale(1.1)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={(e) => { e.target.style.opacity = '0.45'; e.target.style.transform = 'scale(1)'; e.target.style.background = 'none'; }}
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
        transition: 'height 0.65s cubic-bezier(0.33, 1, 0.68, 1)'
      }} />
    </>
  );
}
