'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AnnouncementBar from './AnnouncementBar';
import MenuDrawer from './MenuDrawer';
import CartDrawer, { useCartState } from './CartDrawer';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [iconColor, setIconColor] = useState('#1d1d1f'); // Default dark color
  const { cart, wishlist } = useCartState();
  const navRef = useRef(null);
  const headerRef = useRef(null);

  const totalCartItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalWishItems = wishlist.length;

  // Scroll handler with background detection
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
      
      const nav = navRef.current;
      if (!nav) return;
      
      if (scrolled) {
        nav.classList.add('nav-scrolled');
        nav.style.top = '0px';
      } else {
        nav.classList.remove('nav-scrolled');
        const isDismissed = localStorage.getItem('jabiyen_announcement_hidden') === 'true';
        nav.style.top = isDismissed ? '0px' : '36px';
      }

      // Detect background color under header
      detectBackgroundColor();
    };

    const detectBackgroundColor = () => {
      // Create a canvas to sample pixels
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = 1;
      
      // Sample multiple points across the header
      const samplePoints = [
        window.innerWidth * 0.1,  // Left area (logo)
        window.innerWidth * 0.5,  // Center
        window.innerWidth * 0.85, // Right area (icons)
        window.innerWidth * 0.9,  // Far right
      ];
      
      let totalBrightness = 0;
      
      // Use html2canvas or simple DOM inspection
      // For simplicity, we'll check elements at header position
      const headerTop = navRef.current?.getBoundingClientRect().top || 0;
      const elementAtHeader = document.elementFromPoint(window.innerWidth / 2, headerTop + 30);
      
      if (elementAtHeader) {
        const bgColor = window.getComputedStyle(elementAtHeader).backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          const rgb = bgColor.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            // Calculate brightness (0-255)
            const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
            
            if (brightness < 128) {
              // Dark background - use white icons
              setIconColor('#ffffff');
            } else {
              // Light background - use dark icons
              setIconColor('#1d1d1f');
            }
          }
        } else {
          // Check parent elements
          let parent = elementAtHeader.parentElement;
          let found = false;
          while (parent && !found) {
            const parentBg = window.getComputedStyle(parent).backgroundColor;
            if (parentBg && parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
              const rgb = parentBg.match(/\d+/g);
              if (rgb && rgb.length >= 3) {
                const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
                setIconColor(brightness < 128 ? '#ffffff' : '#1d1d1f');
                found = true;
              }
            }
            parent = parent.parentElement;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    // Also detect on load and resize
    window.addEventListener('load', detectBackgroundColor);
    window.addEventListener('resize', detectBackgroundColor);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('load', detectBackgroundColor);
      window.removeEventListener('resize', detectBackgroundColor);
    };
  }, []);

  // Filter effect for logo image based on icon color
  const logoFilter = iconColor === '#ffffff' ? 'brightness(0) invert(1)' : 'none';

  return (
    <>
      <AnnouncementBar />

      {/* Main Navigation */}
      <nav
        ref={navRef}
        className="glass-nav"
        id="main-nav"
        style={{
          position: 'fixed',
          top: localStorage.getItem('jabiyen_announcement_hidden') === 'true' ? '0px' : '36px',
          left: 0,
          right: 0,
          width: '100%',
          background: isScrolled ? 'rgba(255,255,255,0.10)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(10px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(5px) saturate(180%)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
          boxShadow: isScrolled ? '0 4px 30px rgba(0,0,0,0.03)' : 'none',
          zIndex: 50,
          transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease, top 0.4s ease'
        }}
      >
        <div style={{
          paddingLeft: 16, paddingRight: 12,
          maxWidth: '100%', width: '100%', margin: '0 auto'
        }}
          className="nav-container"
        >
          <div style={{
            height: 56, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center'
          }}
            className="nav-inner"
          >
            {/* Logo */}
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              flexShrink: 0, textDecoration: 'none',
              transition: 'color 0.3s ease'
            }}>
              <img src="/logo.png" alt="JABIYEN Logo" style={{
                width: 40, height: 40,
                borderRadius: 6, objectFit: 'cover'
              }}
                className="nav-logo"
              />
              <img 
                src="/jabiyen.png" 
                alt="JABIYEN" 
                style={{
                  height: 24,
                  width: 'auto',
                  filter: logoFilter,
                  transition: 'filter 0.3s ease'
                }}
                className="brand-name-img"
              />
            </Link>

            {/* Right Icons */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 2, flexShrink: 0
            }}>
              {/* Wishlist */}
              <Link href="/wishlist" style={{
                background: 'none', border: 'none',
                padding: 4, margin: '0 1px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: iconColor,
                position: 'relative', textDecoration: 'none',
                transition: 'color 0.3s ease'
              }}
                className="header-icon-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {totalWishItems > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    background: iconColor, color: iconColor === '#ffffff' ? '#000' : '#fff',
                    fontSize: 7, fontWeight: 700,
                    minWidth: 16, height: 16,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                    border: '1px solid rgba(255,255,255,0.55)',
                    transition: 'all 0.3s ease'
                  }}>
                    {totalWishItems}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button onClick={() => setCartOpen(!cartOpen)} style={{
                background: 'none', border: 'none',
                padding: 4, margin: '0 1px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: iconColor,
                position: 'relative',
                transition: 'color 0.3s ease'
              }}
                className="header-icon-btn"
              >
                <svg width="17" height="19" viewBox="0 0 19 21" fill="none">
                  <path d="M1 6H18V18C18 19.1046 17.1046 20 16 20H3C1.89543 20 1 19.1046 1 18V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  <path d="M5 6C5 3.5 6.5 1 9.5 1C12.5 1 14 3.5 14 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                {totalCartItems > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    background: iconColor, color: iconColor === '#ffffff' ? '#000' : '#fff',
                    fontSize: 7, fontWeight: 700,
                    minWidth: 16, height: 16,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                    border: '1px solid rgba(255,255,255,0.55)',
                    transition: 'all 0.3s ease'
                  }}>
                    {totalCartItems}
                  </span>
                )}
              </button>

              {/* Menu Toggle */}
              <button onClick={() => setMenuOpen(true)} style={{
                background: 'none', border: 'none',
                padding: 4, margin: '0 1px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: iconColor,
                transition: 'color 0.3s ease'
              }}
                className="header-icon-btn"
              >
                <svg width="20" height="13" viewBox="0 0 22 15" fill="none">
                  <path d="M1 1H21M1 7.5H21M1 14H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Drawers */}
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Responsive Styles */}
      <style jsx>{`
        @media (min-width: 1024px) {
          .nav-container {
            padding-left: 40px !important;
            padding-right: 28px !important;
          }
          .nav-inner {
            height: 64px !important;
          }
          .nav-logo {
            width: 48px !important;
            height: 48px !important;
          }
          .brand-name-img {
            height: 32px !important;
          }
        }
        .header-icon-btn:hover { opacity: 0.6; }
      `}</style>
    </>
  );
}
