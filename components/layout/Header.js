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
  const { cart, wishlist } = useCartState();
  const navRef = useRef(null);

  const totalCartItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalWishItems = wishlist.length;

  // Scroll handler
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
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          zIndex: 50,
          transition: 'all 0.4s ease'
        }}
      >
        {/* Liquid Blob Background */}
        <div className="liquid-background" style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          opacity: isScrolled ? 0.15 : 0.08,
          transition: 'opacity 0.6s ease'
        }}>
          <div className="blob-container" style={{
            position: 'absolute',
            inset: '-20px',
            filter: 'url(#liquid-filter)',
            WebkitFilter: 'url(#liquid-filter)'
          }}>
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
            <div className="blob blob-4" />
            <div className="blob blob-5" />
            <div className="blob blob-6" />
            <div className="blob blob-7" />
            <div className="blob blob-8" />
          </div>
        </div>

        {/* SVG Filter for Liquid Effect */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id="liquid-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
            <feColorMatrix 
              values="1 0 0 0 0  
                      0 1 0 0 0  
                      0 0 1 0 0  
                      0 0 0 18 -7" 
            />
          </filter>
        </svg>

        {/* Content Container */}
        <div style={{
          paddingLeft: 16, paddingRight: 12,
          maxWidth: '100%', width: '100%', margin: '0 auto',
          position: 'relative', zIndex: 1
        }}
          className="nav-container"
        >
          <div style={{
            height: 56, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center'
          }}
            className="nav-inner"
          >
            {/* Logo with Liquid Effect */}
            <Link href="/" className="logo-link" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              flexShrink: 0, textDecoration: 'none',
              position: 'relative'
            }}>
              {/* Logo Liquid Ring */}
              <div className="logo-liquid-ring" style={{
                position: 'absolute',
                left: '-4px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,191,72,0.3), rgba(190,74,29,0.2))',
                filter: 'blur(8px)',
                animation: 'logoPulse 3s ease-in-out infinite'
              }} />
              
              <img src="/logo.png" alt="JABIYEN" className="nav-logo" style={{
                width: 40, height: 40,
                borderRadius: 6, objectFit: 'cover',
                position: 'relative', zIndex: 1
              }} />
              
              <span className="brand-text" style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 'clamp(14px, 2vw, 20px)',
                fontWeight: 900,
                letterSpacing: '0.1em',
                color: '#1d1d1f',
                position: 'relative',
                background: 'linear-gradient(135deg, #1d1d1f 0%, #4a4a4a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                JABIYEN
              </span>
            </Link>

            {/* Right Icons */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 2, flexShrink: 0
            }}>
              {/* Wishlist with Liquid Animation */}
              <Link href="/wishlist" className="icon-btn-wrapper" style={{
                background: 'none', border: 'none',
                padding: 4, margin: '0 1px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#1d1d1f',
                position: 'relative', textDecoration: 'none'
              }}>
                {/* Liquid Effect Behind Icon */}
                <div className="icon-liquid-bg" style={{
                  position: 'absolute',
                  inset: '-2px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(255,191,72,0.2), rgba(190,74,29,0.15))',
                  filter: 'blur(4px)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }} />
                
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'relative', zIndex: 1 }}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                
                {totalWishItems > 0 && (
                  <span className="badge" style={{
                    position: 'absolute', top: -2, right: -2,
                    background: 'linear-gradient(135deg, #ffbf48, #be4a1d)',
                    color: '#fff',
                    fontSize: 7, fontWeight: 700,
                    minWidth: 16, height: 16,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                    border: '1px solid rgba(255,255,255,0.55)',
                    zIndex: 2
                  }}>
                    {totalWishItems}
                  </span>
                )}
              </Link>

              {/* Cart with Liquid Animation */}
              <button onClick={() => setCartOpen(!cartOpen)} className="icon-btn-wrapper" style={{
                background: 'none', border: 'none',
                padding: 4, margin: '0 1px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#1d1d1f',
                position: 'relative'
              }}>
                <div className="icon-liquid-bg" style={{
                  position: 'absolute',
                  inset: '-2px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(255,191,72,0.2), rgba(190,74,29,0.15))',
                  filter: 'blur(4px)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }} />
                
                <svg width="17" height="19" viewBox="0 0 19 21" fill="none" style={{ position: 'relative', zIndex: 1 }}>
                  <path d="M1 6H18V18C18 19.1046 17.1046 20 16 20H3C1.89543 20 1 19.1046 1 18V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  <path d="M5 6C5 3.5 6.5 1 9.5 1C12.5 1 14 3.5 14 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                
                {totalCartItems > 0 && (
                  <span className="badge" style={{
                    position: 'absolute', top: -2, right: -2,
                    background: 'linear-gradient(135deg, #ffbf48, #be4a1d)',
                    color: '#fff',
                    fontSize: 7, fontWeight: 700,
                    minWidth: 16, height: 16,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                    border: '1px solid rgba(255,255,255,0.55)',
                    zIndex: 2
                  }}>
                    {totalCartItems}
                  </span>
                )}
              </button>

              {/* Menu Toggle with Liquid Animation */}
              <button onClick={() => setMenuOpen(true)} className="icon-btn-wrapper" style={{
                background: 'none', border: 'none',
                padding: 4, margin: '0 1px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#1d1d1f',
                position: 'relative'
              }}>
                <div className="icon-liquid-bg" style={{
                  position: 'absolute',
                  inset: '-2px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(255,191,72,0.2), rgba(190,74,29,0.15))',
                  filter: 'blur(4px)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }} />
                
                <svg width="20" height="13" viewBox="0 0 22 15" fill="none" style={{ position: 'relative', zIndex: 1 }}>
                  <path d="M1 1H21M1 7.5H21M1 14H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrolled Background Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: isScrolled ? 'blur(25px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(25px) saturate(180%)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
          boxShadow: isScrolled ? '0 4px 30px rgba(0,0,0,0.03)' : 'none',
          transition: 'all 0.4s ease',
          zIndex: 0
        }} />
      </nav>

      {/* Drawers */}
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Styles */}
      <style jsx>{`
        /* Liquid Blob Animations */
        .blob {
          position: absolute;
          border-radius: 42%;
          background: linear-gradient(135deg, #ffbf48 30%, #be4a1d 70%);
          opacity: 0.6;
        }

        .blob-1 {
          width: 120px;
          height: 120px;
          top: -30px;
          left: 5%;
          animation: blobFloat1 8s ease-in-out infinite;
        }

        .blob-2 {
          width: 100px;
          height: 100px;
          top: -20px;
          left: 25%;
          animation: blobFloat2 10s ease-in-out infinite;
          animation-delay: -2s;
        }

        .blob-3 {
          width: 90px;
          height: 90px;
          top: -15px;
          left: 45%;
          animation: blobFloat3 7s ease-in-out infinite;
          animation-delay: -4s;
        }

        .blob-4 {
          width: 110px;
          height: 110px;
          top: -25px;
          left: 65%;
          animation: blobFloat1 9s ease-in-out infinite;
          animation-delay: -1s;
        }

        .blob-5 {
          width: 95px;
          height: 95px;
          top: -18px;
          left: 80%;
          animation: blobFloat2 11s ease-in-out infinite;
          animation-delay: -3s;
        }

        .blob-6 {
          width: 85px;
          height: 85px;
          top: -12px;
          left: 90%;
          animation: blobFloat3 8s ease-in-out infinite;
          animation-delay: -5s;
        }

        .blob-7 {
          width: 105px;
          height: 105px;
          top: -22px;
          left: 15%;
          animation: blobFloat2 12s ease-in-out infinite;
          animation-delay: -6s;
        }

        .blob-8 {
          width: 88px;
          height: 88px;
          top: -16px;
          left: 55%;
          animation: blobFloat1 9.5s ease-in-out infinite;
          animation-delay: -3.5s;
        }

        @keyframes blobFloat1 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(30px, -10px) scale(1.1) rotate(5deg);
          }
          50% {
            transform: translate(-20px, -5px) scale(0.95) rotate(-3deg);
          }
          75% {
            transform: translate(10px, -15px) scale(1.05) rotate(2deg);
          }
        }

        @keyframes blobFloat2 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(-25px, -8px) scale(1.08) rotate(-4deg);
          }
          66% {
            transform: translate(15px, -12px) scale(0.92) rotate(6deg);
          }
        }

        @keyframes blobFloat3 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          50% {
            transform: translate(20px, -6px) scale(1.12) rotate(3deg);
          }
        }

        @keyframes logoPulse {
          0%, 100% {
            transform: translateY(-50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-50%) scale(1.2);
            opacity: 0.3;
          }
        }

        /* Hover Effects */
        .icon-btn-wrapper:hover .icon-liquid-bg {
          opacity: 1 !important;
        }

        .icon-btn-wrapper:hover {
          transform: scale(1.1);
          transition: transform 0.3s ease;
        }

        .badge {
          animation: badgeGlow 2s ease-in-out infinite;
        }

        @keyframes badgeGlow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(255,191,72,0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(190,74,29,0.8);
          }
        }

        /* Responsive */
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
          .logo-liquid-ring {
            width: 56px !important;
            height: 56px !important;
            left: -4px !important;
          }
        }

        @media (max-width: 768px) {
          .blob-1 { width: 80px; height: 80px; }
          .blob-2 { width: 70px; height: 70px; }
          .blob-3 { width: 65px; height: 65px; }
          .blob-4 { width: 75px; height: 75px; }
          .blob-5 { width: 68px; height: 68px; }
          .blob-6 { width: 60px; height: 60px; }
          .blob-7 { width: 72px; height: 72px; }
          .blob-8 { width: 63px; height: 63px; }
        }
      `}</style>
    </>
  );
}
