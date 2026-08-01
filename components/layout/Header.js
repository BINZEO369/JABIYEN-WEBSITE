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
      const headerTop = navRef.current?.getBoundingClientRect().top || 0;
      const elementAtHeader = document.elementFromPoint(window.innerWidth / 2, headerTop + 30);
      
      if (elementAtHeader) {
        const bgColor = window.getComputedStyle(elementAtHeader).backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          const rgb = bgColor.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
            
            if (brightness < 128) {
              setIconColor('#ffffff');
            } else {
              setIconColor('#1d1d1f');
            }
          }
        } else {
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
    handleScroll();
    window.addEventListener('load', detectBackgroundColor);
    window.addEventListener('resize', detectBackgroundColor);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('load', detectBackgroundColor);
      window.removeEventListener('resize', detectBackgroundColor);
    };
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
            {/* Luxury Brand Logo */}
            <Link href="/" className="brand-logo-link" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              flexShrink: 0, textDecoration: 'none',
              transition: 'all 0.3s ease'
            }}>
              <div className="logo-wrapper">
                <svg className="logo-monogram" viewBox="0 0 50 50" width="44" height="44">
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={iconColor} stopOpacity="1" />
                      <stop offset="100%" stopColor={iconColor} stopOpacity="0.7" />
                    </linearGradient>
                  </defs>
                  <circle cx="25" cy="25" r="24" fill="none" stroke="url(#logoGradient)" strokeWidth="1.5" />
                  <text x="25" y="32" textAnchor="middle" fill={iconColor} fontSize="22" fontWeight="900" fontFamily="'Manrope', 'Helvetica Neue', sans-serif" letterSpacing="2">J</text>
                </svg>
              </div>
              <div className="brand-text-container">
                <span className="brand-name" style={{
                  color: iconColor,
                  transition: 'color 0.3s ease'
                }}>
                  JABIYEN
                </span>
                <span className="brand-subtitle" style={{
                  color: iconColor,
                  opacity: 0.6,
                  transition: 'color 0.3s ease'
                }}>
                  HAUTE COUTURE
                </span>
              </div>
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

      {/* Luxury Brand Styles */}
      <style jsx>{`
        /* Brand Logo Styles */
        .brand-logo-link {
          position: relative;
        }
        
        .logo-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .logo-monogram {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .brand-logo-link:hover .logo-monogram {
          transform: scale(1.05);
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
        }
        
        .brand-text-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1;
        }
        
        .brand-name {
          font-family: 'Cormorant Garamond', 'Manrope', 'Didot', 'Bodoni MT', serif;
          font-size: clamp(18px, 2.5vw, 24px);
          font-weight: 700;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          line-height: 1;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .brand-subtitle {
          font-family: 'Manrope', 'Helvetica Neue', sans-serif;
          font-size: 7px;
          font-weight: 500;
          letter-spacing: 0.5em;
          text-transform: uppercase;
          margin-top: 2px;
          transition: all 0.3s ease;
        }
        
        .brand-logo-link:hover .brand-name {
          letter-spacing: 0.4em;
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
          .brand-name {
            font-size: clamp(22px, 3vw, 28px) !important;
          }
          .brand-subtitle {
            font-size: 8px !important;
            letter-spacing: 0.6em !important;
          }
          .logo-monogram {
            width: 50px;
            height: 50px;
          }
        }
        
        .header-icon-btn:hover { 
          opacity: 0.6; 
          transform: scale(0.95);
          transition: all 0.2s ease;
        }

        /* Animation for scroll */
        .nav-scrolled .brand-name {
          font-size: clamp(16px, 2vw, 22px) !important;
        }
        
        .nav-scrolled .brand-subtitle {
          opacity: 0 !important;
          max-height: 0 !important;
          margin-top: 0 !important;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
}
