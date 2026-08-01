'use client';

import { useState, useEffect } from 'react';

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if previously dismissed
    const dismissed = localStorage.getItem('jabiyen_announcement_hidden') === 'true';
    if (dismissed) {
      setIsVisible(false);
      document.body.classList.add('announcement-dismissed');
    }

    // Fetch announcement
    async function fetchAnnouncement() {
      try {
        const res = await fetch('/api/announcement');
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data && data.message) {
          setAnnouncement(data);
          if (dismissed) setIsVisible(false);
        } else {
          setIsVisible(false);
          document.body.classList.add('announcement-dismissed');
        }
      } catch (e) {
        setIsVisible(false);
        document.body.classList.add('announcement-dismissed');
      }
    }
    fetchAnnouncement();
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem('jabiyen_announcement_hidden', 'true');
    document.body.classList.add('announcement-dismissed');
    
    // Update nav position
    const nav = document.getElementById('main-nav');
    if (nav && !nav.classList.contains('nav-scrolled')) {
      nav.style.top = '0px';
    }
  };

  if (!announcement || !announcement.message) return null;

  const bgColor = announcement.bg_color || '#000000';
  const textColor = announcement.text_color || '#ffffff';

  return (
    <>
      <div style={{
        background: bgColor,
        color: textColor,
        fontFamily: "'Inter', sans-serif",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        height: isVisible ? 36 : 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 60,
        padding: isVisible ? '0 45px 0 16px' : 0,
        textAlign: 'center',
        overflow: 'hidden',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, height 0.4s ease',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0
      }}>
        <span>
          {announcement.message}
          {announcement.link_url && announcement.link_title && (
            <a href={announcement.link_url} target="_blank" rel="noopener noreferrer" style={{
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'underline',
              fontWeight: 700,
              marginLeft: 6,
              transition: 'color 0.2s ease'
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
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          padding: 4,
          transition: 'color 0.2s ease, transform 0.2s ease'
        }}
        aria-label="Close Announcement">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Spacer div when bar is visible */}
      {isVisible && <div style={{ height: 36 }} />}
    </>
  );
}
