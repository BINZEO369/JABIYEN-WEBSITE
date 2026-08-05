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
  const [iconColor, setIconColor] = useState('#1d1d1f');
  const { cart, wishlist } = useCartState();
  const navRef = useRef(null);

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
            setIconColor(brightness < 128 ? '#ffffff' : '#1d1d1f');
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

  // Filter for icon images based on background
  const iconFilter = iconColor === '#ffffff' ? 'brightness(0) invert(1)' : 'none';

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
            {/* Logo Section */}
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              flexShrink: 0, textDecoration: 'none'
            }}>
              <img 
                src="/logo.png" 
                alt="JABIYEN Logo" 
                style={{
                  width: 40, 
                  height: 40,
                  borderRadius: 6, 
                  objectFit: 'cover'
                }}
                className="nav-logo"
              />
              <img 
                src="/jabiyen.png" 
                alt="JABIYEN" 
                style={{
                  height: 24,
                  width: 'auto',
                  filter: iconFilter,
                  transition: 'filter 0.3s ease'
                }}
                className="brand-name-img"
              />
            </Link>

            {/* Right Icons Section */}
            <div style={{
              display: 'flex', 
              alignItems: 'center',
              gap: 2, 
              flexShrink: 0
            }}>
              {/* Wishlist Icon */}
              <Link 
                href="/wishlist" 
                style={{
                  background: 'none', 
                  border: 'none',
                  padding: 4, 
                  margin: '0 1px',
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative', 
                  textDecoration: 'none'
                }}
                className="header-icon-btn"
              >
                <img 
                  src="/wishlisticon.png" 
                  alt="Wishlist" 
                  style={{
                    width: 18,
                    height: 18,
                    filter: iconFilter,
                    transition: 'filter 0.3s ease'
                  }}
                />
                {totalWishItems > 0 && (
                  <span style={{
                    position: 'absolute', 
                    top: -2, 
                    right: -2,
                    background: iconColor === '#ffffff' ? '#ffffff' : '#1d1d1f', 
                    color: iconColor === '#ffffff' ? '#000000' : '#ffffff',
                    fontSize: 7, 
                    fontWeight: 700,
                    minWidth: 16, 
                    height: 16,
                    borderRadius: '50%',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '0 4px',
                    border: `1px solid ${iconColor === '#ffffff' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.55)'}`,
                    transition: 'all 0.3s ease'
                  }}>
                    {totalWishItems}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <button 
                onClick={() => setCartOpen(!cartOpen)} 
                style={{
                  background: 'none', 
                  border: 'none',
                  padding: 4, 
                  margin: '0 1px',
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                className="header-icon-btn"
              >
                <img 
                  src="/carticon.png" 
                  alt="Cart" 
                  style={{
                    width: 17,
                    height: 19,
                    filter: iconFilter,
                    transition: 'filter 0.3s ease'
                  }}
                />
                {totalCartItems > 0 && (
                  <span style={{
                    position: 'absolute', 
                    top: -2, 
                    right: -2,
                    background: iconColor === '#ffffff' ? '#ffffff' : '#1d1d1f', 
                    color: iconColor === '#ffffff' ? '#000000' : '#ffffff',
                    fontSize: 7, 
                    fontWeight: 700,
                    minWidth: 16, 
                    height: 16,
                    borderRadius: '50%',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '0 4px',
                    border: `1px solid ${iconColor === '#ffffff' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.55)'}`,
                    transition: 'all 0.3s ease'
                  }}>
                    {totalCartItems}
                  </span>
                )}
              </button>

              {/* Menu Toggle Icon */}
              <button 
                onClick={() => setMenuOpen(true)} 
                style={{
                  background: 'none', 
                  border: 'none',
                  padding: 4, 
                  margin: '0 1px',
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                className="header-icon-btn"
              >
                <img 
                  src="/menuicon.png" 
                  alt="Menu" 
                  style={{
                    width: 20,
                    height: 13,
                    filter: iconFilter,
                    transition: 'filter 0.3s ease'
                  }}
                />
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
          .header-icon-btn img {
            width: auto !important;
            height: auto !important;
          }
        }
        .header-icon-btn:hover { 
          opacity: 0.6; 
        }
        .header-icon-btn img {
          object-fit: contain;
        }
      `}</style>
    </>
  );
}
