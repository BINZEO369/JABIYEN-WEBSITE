// pages/product/[slug].js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

// ================================================================
// API Helper Functions
// ================================================================
const API_BASE = '/api';

async function apiFetch(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`API Error: ${response.status}`);
    }
    return await response.json();
  } catch (e) {
    console.error('API Fetch Error:', e);
    return null;
  }
}

function generateSlug(title) {
  if (!title) return 'product';
  return title
    .toLowerCase()
    .replace(/[^\w\u0980-\u09FF]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ================================================================
// Toast Component
// ================================================================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: type === 'error' ? '#ef4444' : '#1d1d1f',
        color: 'white',
        padding: '14px 28px',
        borderRadius: '9999px',
        fontWeight: 700,
        fontSize: '13px',
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        animation: 'fadeInUp 0.3s ease-out',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-body)',
      }}
    >
      {message}
    </div>
  );
};

// ================================================================
// Skeleton Loading Component
// ================================================================
const SkeletonLoader = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
    <div
      className="skeleton"
      style={{
        width: '100%',
        height: '60vh',
        minHeight: '400px',
        maxHeight: '600px',
        borderRadius: 0,
      }}
    />
    <div style={{ padding: '20px' }}>
      <div className="skeleton" style={{ height: '14px', width: '80px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '28px', width: '100%', marginBottom: '12px' }} />
      <div className="skeleton" style={{ height: '36px', width: '120px', marginBottom: '16px' }} />
      <div className="skeleton" style={{ height: '16px', width: '200px', marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <div className="skeleton" style={{ height: '40px', width: '100px', borderRadius: '12px' }} />
        <div className="skeleton" style={{ height: '40px', width: '100px', borderRadius: '12px' }} />
      </div>
      <div className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
    </div>
  </div>
);

// ================================================================
// Product Card Component
// ================================================================
const ProductCard = ({ product }) => {
  if (!product) return null;
  const slug = product.slug || generateSlug(product.title);

  return (
    <Link
      href={`/product/${slug}`}
      className="product-card"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.06)',
          transition: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        <div style={{ aspectRatio: '3/4', overflow: 'hidden' }}>
          <img
            src={product.img || '/logo.png'}
            alt={product.title || ''}
            className="product-image"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
            loading="lazy"
            onError={(e) => { e.target.src = '/logo.png'; }}
          />
        </div>
        <div style={{ padding: '14px 16px' }}>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#86868b',
              textTransform: 'uppercase',
              marginBottom: '4px',
              fontFamily: 'var(--font-accent)',
            }}
          >
            {product.category || ''}
          </p>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#1d1d1f',
              marginBottom: '6px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: 'var(--font-subtitle)',
            }}
          >
            {product.title || ''}
          </h3>
          <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'var(--font-body)' }}>৳ {product.price || 0}</span>
        </div>
      </div>
    </Link>
  );
};

// ================================================================
// Video Section Component
// ================================================================
const VideoSection = ({ videos }) => {
  const videoRefs = useRef([]);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [mutedStates, setMutedStates] = useState({});

  useEffect(() => {
    const initialMuted = {};
    videos.forEach((_, index) => {
      initialMuted[index] = true;
    });
    setMutedStates(initialMuted);
  }, [videos]);

  const initVideo = useCallback((index) => {
    const video = videoRefs.current[index];
    if (!video) return;
    video.muted = true;
    video.play().then(() => {
      setPlayingIndex(index);
    }).catch(() => {});
  }, []);

  const toggleSound = useCallback((index) => {
    const video = videoRefs.current[index];
    if (!video) return;
    video.muted = !video.muted;
    setMutedStates((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const togglePlay = useCallback((index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      videoRefs.current.forEach((v, i) => {
        if (i !== index && v && !v.paused) {
          v.pause();
        }
      });
      video.play();
      setPlayingIndex(index);
    } else {
      video.pause();
      setPlayingIndex(null);
    }
  }, []);

  if (!videos || videos.length === 0) return null;

  return videos.map((video, index) => {
    const isPlaying = playingIndex === index;
    const isMuted = mutedStates[index] !== false;
    const hasLink = video.click_link && video.click_link.trim() !== '';
    const linkText = hasLink
      ? (() => {
          try {
            const url = new URL(video.click_link);
            return url.hostname.replace('www.', '');
          } catch {
            return video.click_link
              .replace(/^https?:\/\//, '')
              .replace(/^www\./, '')
              .split('/')[0];
          }
        })()
      : '';

    return (
      <div
        key={index}
        className={`video-section ${!isPlaying ? 'paused' : ''}`}
        style={{
          position: 'relative',
          width: '100%',
          margin: '20px 0',
          borderRadius: 0,
          overflow: 'hidden',
          background: '#000',
          aspectRatio: '16/9',
          cursor: 'pointer',
          minHeight: '360px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video
          ref={(el) => (videoRefs.current[index] = el)}
          src={video.video_url}
          playsInline
          muted
          loop
          preload="auto"
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          onLoadedData={() => initVideo(index)}
          onPlay={() => setPlayingIndex(index)}
          onPause={() => setPlayingIndex(null)}
          onEnded={() => setPlayingIndex(null)}
        />

        <div
          className="video-text-center"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 4,
            pointerEvents: 'none',
            width: '90%',
            maxWidth: '600px',
          }}
        >
          {video.title && (
            <h3
              className="video-title-main"
              style={{
                color: 'white',
                fontSize: '28px',
                fontWeight: 700,
                lineHeight: 1.2,
                margin: 0,
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {video.title}
            </h3>
          )}
          {video.subtitle && (
            <p
              className="video-subtitle-main"
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '14px',
                fontWeight: 400,
                marginTop: '8px',
                textShadow: '0 1px 6px rgba(0,0,0,0.4)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {video.subtitle}
            </p>
          )}
          {hasLink && (
            <a
              href={video.click_link}
              target="_blank"
              rel="noopener"
              className="video-link-clean"
              style={{
                display: 'inline-block',
                marginTop: '16px',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.6)',
                paddingBottom: '2px',
                transition: 'all 0.3s',
                pointerEvents: 'auto',
                textShadow: '0 1px 6px rgba(0,0,0,0.3)',
                fontFamily: 'var(--font-body)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {linkText} →
            </a>
          )}
        </div>

        <div
          className="video-play-indicator"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            opacity: isPlaying ? 0 : 1,
            transition: 'opacity 0.3s',
          }}
        >
          <i className="fa-solid fa-play" style={{ fontSize: '20px', color: 'white', marginLeft: '2px' }} />
        </div>

        <div
          className="video-sound-control"
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 6,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            className={`sound-btn ${isMuted ? 'muted' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleSound(index);
            }}
            title="Toggle Sound"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: isMuted ? 'rgba(239,68,68,0.25)' : 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: isMuted
                ? '1px solid rgba(239,68,68,0.3)'
                : '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay(index);
            }}
            title="Play/Pause"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`} />
          </button>
        </div>
      </div>
    );
  });
};

// ================================================================
// Banner Card Component
// ================================================================
const BannerSection = ({ banners }) => {
  if (!banners || banners.length === 0) return null;

  return banners.map((banner, index) => {
    const hasLink = banner.click_link && banner.click_link.trim() !== '';
    const linkText = hasLink
      ? (() => {
          try {
            const url = new URL(banner.click_link);
            return url.hostname.replace('www.', '');
          } catch {
            return banner.click_link
              .replace(/^https?:\/\//, '')
              .replace(/^www\./, '')
              .split('/')[0];
          }
        })()
      : '';

    return (
      <div
        key={index}
        className="product-banner-card"
        onClick={() => hasLink && window.open(banner.click_link, '_blank')}
        style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          marginBottom: '20px',
          background: '#000',
          height: '260px',
          cursor: hasLink ? 'pointer' : 'default',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
        }}
      >
        <img
          src={banner.banner_url}
          alt={banner.title || 'Product banner'}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
          onError={(e) => { e.target.style.display = 'none'; }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        />
        <div
          className="banner-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.02) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '32px 28px',
          }}
        >
          {banner.title && (
            <h3
              className="banner-title"
              style={{
                color: 'white',
                fontSize: '24px',
                marginBottom: '6px',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
              }}
            >
              {banner.title}
            </h3>
          )}
          {banner.subtitle && (
            <p
              className="banner-subtitle"
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '15px',
                textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
              }}
            >
              {banner.subtitle}
            </p>
          )}
          {hasLink && (
            <span
              className="banner-link"
              style={{
                color: 'white',
                fontSize: '13px',
                textDecoration: 'none',
                marginTop: '10px',
                borderBottom: '2px solid rgba(255,255,255,0.5)',
                paddingBottom: '3px',
                transition: 'all 0.3s',
                display: 'inline-block',
                width: 'fit-content',
                textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                fontFamily: 'var(--font-accent)',
                fontWeight: 600,
              }}
            >
              {linkText} ↗
            </span>
          )}
        </div>
      </div>
    );
  });
};

// ================================================================
// Collapsible Section Component
// ================================================================
const CollapsibleSection = ({ icon, title, children, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    setIsOpen(!isOpen);
    if (onToggle) onToggle(!isOpen);
  };

  return (
    <>
      <button
        className="toggle-btn"
        onClick={toggle}
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: '14px',
          padding: '18px 22px',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          marginBottom: '10px',
          transition: 'all 0.3s',
          textAlign: 'left',
          color: '#1d1d1f',
          fontWeight: 600,
          fontFamily: 'var(--font-subtitle)',
          letterSpacing: '0.05em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span>
          <i className={`fa-solid ${icon}`} /> &nbsp;{title}
        </span>
        <i
          className="fa-solid fa-chevron-down toggle-icon-right"
          style={{
            transition: 'transform 0.3s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div
        className="collapse-section"
        style={{
          maxHeight: isOpen ? '2000px' : 0,
          overflow: 'hidden',
          transition: 'max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </>
  );
};

// ================================================================
// MAIN PRODUCT PAGE COMPONENT (Next.js Pages Router)
// ================================================================
export default function ProductPage() {
  const router = useRouter();
  const { slug } = router.query;

  // State
  const [currentProduct, setCurrentProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [productColors, setProductColors] = useState([]);
  const [colorSizes, setColorSizes] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [productVideos, setProductVideos] = useState([]);
  const [productBanners, setProductBanners] = useState([]);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [barcodeGenerated, setBarcodeGenerated] = useState(false);
  const [allImages, setAllImages] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [wishlist, setWishlist] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [barcodeSvg, setBarcodeSvg] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const buySectionRef = useRef(null);
  const heroRef = useRef(null);

  // Show Toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Load wishlist from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem('jayen_wishlist') || '[]');
      setWishlist(saved);
    } catch {
      setWishlist([]);
    }
  }, []);

  // Toggle Wishlist
  const toggleWishlist = useCallback(
    (productId) => {
      let updated;
      if (wishlist.includes(productId)) {
        updated = wishlist.filter((id) => id !== productId);
        showToast('Removed from wishlist');
      } else {
        updated = [...wishlist, productId];
        showToast('Added to wishlist! ❤️');
      }
      setWishlist(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('jayen_wishlist', JSON.stringify(updated));
      }
    },
    [wishlist, showToast]
  );

  // Get variant by color and size
  const getVariant = useCallback(
    (colorId, sizeId) => {
      return productVariants.find((v) => v.color_id == colorId && v.size_id == sizeId) || null;
    },
    [productVariants]
  );

  // 🔥 FIXED: Select Color - এখন সঠিকভাবে ইমেজ পরিবর্তন হবে
  const selectColor = useCallback(
    (colorId) => {
      setSelectedColorId(colorId);
      setSelectedSizeId(null);
      setSelectedVariant(null);

      const color = productColors.find((c) => c.id == colorId);
      if (color && color.color_image) {
        setActiveImage(color.color_image);
        setIsZoomed(false); // জুম রিসেট
      }
    },
    [productColors]
  );

  // Select Size
  const selectSize = useCallback(
    (sizeId) => {
      setSelectedSizeId(sizeId);
      if (selectedColorId && sizeId) {
        setSelectedVariant(getVariant(selectedColorId, sizeId));
      }
    },
    [selectedColorId, getVariant]
  );

  // 🔥 FIXED: Select Thumbnail - জুম রিসেট হবে
  const selectThumbnail = useCallback((imageSrc) => {
    setActiveImage(imageSrc);
    setIsZoomed(false);
  }, []);

  // Add to Cart Handler
  const addToCartHandler = useCallback(
    (productId, buyNow = false) => {
      const product = allProducts.find((p) => p.id == productId);
      if (!product) {
        showToast('Product not found', 'error');
        return;
      }

      if (productColors.length > 0 && !selectedVariant) {
        if (!selectedColorId) {
          showToast('Please select a color', 'error');
          return;
        }
        if (!selectedSizeId) {
          showToast('Please select a size', 'error');
          return;
        }
      }

      if (selectedVariant && selectedVariant.stock <= 0) {
        showToast('Out of stock', 'error');
        return;
      }

      const selectedColor = productColors.find((c) => c.id == selectedColorId);
      const selectedSize = colorSizes.find((s) => s.id == selectedSizeId);
      const displayImage = selectedColor?.color_image || product.img || '/logo.png';

      const productData = {
        title: product.title,
        price: selectedVariant?.price || product.price,
        old_price: selectedVariant?.old_price || product.old_price || null,
        img: displayImage,
        variant_id: selectedVariant?.id || null,
        variant_name: selectedVariant?.name || null,
        color_id: selectedColorId || null,
        color_name: selectedColor?.color_name || null,
        color_code: selectedColor?.color_code || null,
        color_image: selectedColor?.color_image || null,
        size_id: selectedSizeId || null,
        size_name: selectedSize?.size_name || null,
        main_barcode: product.barcode || null,
        variant_barcode: selectedVariant?.barcode || null,
        sku: selectedVariant?.sku || product.sku || null,
        category: product.category || null,
        subcategory: product.subcategory || null,
        stock: selectedVariant?.stock || product.stock || null,
        weight: selectedVariant?.weight || null,
        fabric_type: product.fabric_type || null,
        gsm_type: product.gsm_type || null,
        fit_type: product.fit_type || null,
        gender: product.gender || null,
        print_type: product.print_type || null,
        quantity: 1,
      };

      if (typeof window !== 'undefined' && window.addToCart) {
        window.addToCart(productId, productData);
      }
      showToast('Added to Bag! 🎉', 'success');

      if (buyNow) {
        router.push('/checkout');
      }
    },
    [
      allProducts,
      productColors,
      colorSizes,
      selectedVariant,
      selectedColorId,
      selectedSizeId,
      showToast,
      router,
    ]
  );

  // Generate Barcode
  const generateBarcode = useCallback((barcodeText) => {
    if (!barcodeText || typeof window === 'undefined' || !window.JsBarcode) {
      return;
    }
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      window.JsBarcode(svg, barcodeText, {
        format: 'CODE128',
        width: 1.5,
        height: 60,
        displayValue: true,
        fontSize: 12,
        margin: 8,
        background: '#ffffff',
        lineColor: '#1d1d1f',
      });
      setBarcodeSvg(svg.outerHTML);
      setBarcodeGenerated(true);
    } catch (e) {
      console.error('Barcode generation failed:', e);
    }
  }, []);

  // 🔥 FIXED: Zoom handlers - ওয়েবসাইট নড়াচড়া করবে না
  const handleMouseMove = useCallback((e) => {
    if (!heroRef.current || isDragging) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
    setIsZoomed(true);
  }, [isDragging]);

  const handleMouseLeave = useCallback(() => {
    setIsZoomed(false);
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    const y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
    setIsZoomed(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsZoomed(false);
  }, []);

  // Scroll handler for sticky bar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      if (buySectionRef.current) {
        const rect = buySectionRef.current.getBoundingClientRect();
        setStickyVisible(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load Product Data
  useEffect(() => {
    if (!slug || !router.isReady) return;

    const loadProduct = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const products = await apiFetch('/products');
        if (!products) throw new Error('Failed to load products');

        setAllProducts(products);

        const product = products.find(
          (p) => (p.slug || generateSlug(p.title)) === slug
        );

        if (!product) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setCurrentProduct(product);

        const images = product.images ? product.images.split(',').filter(Boolean) : [];
        if (images.length === 0 && product.img) images.push(product.img);
        setAllImages(images);
        setActiveImage(images[0] || '/logo.png');

        const [colors, variants, videos, banners] = await Promise.all([
          apiFetch(`/product-colors?slug=${encodeURIComponent(slug)}`),
          apiFetch(`/product-variants?slug=${encodeURIComponent(slug)}`),
          apiFetch(`/product-videos?slug=${encodeURIComponent(slug)}`),
          apiFetch(`/product-banners?slug=${encodeURIComponent(slug)}`),
        ]);

        setProductColors(colors || []);
        setProductVariants(variants || []);
        setProductVideos(videos || []);
        setProductBanners(banners || []);

        if (colors && colors.length > 0) {
          const colorIds = colors.map((c) => c.id);
          const sizes = await apiFetch(`/color-sizes?ids=${colorIds.join(',')}`);
          setColorSizes(sizes || []);
        } else {
          setColorSizes([]);
        }

        // Update recent products
        if (typeof window !== 'undefined') {
          try {
            let recent = JSON.parse(localStorage.getItem('jayen_recent') || '[]');
            recent = [product.id.toString(), ...recent.filter((id) => id != product.id)].slice(0, 8);
            localStorage.setItem('jayen_recent', JSON.stringify(recent));
          } catch {}
        }

        setLoading(false);
      } catch (e) {
        console.error('Error loading product:', e);
        setNotFound(true);
        setLoading(false);
      }
    };

    loadProduct();
  }, [slug, router.isReady]);

  // Fix duplicate footer
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading && !notFound) {
      setTimeout(() => {
        const allFooters = document.querySelectorAll('footer');
        if (allFooters.length > 1) {
          for (let i = 1; i < allFooters.length; i++) {
            allFooters[i].style.display = 'none';
          }
        }
      }, 500);
    }
  }, [loading, notFound]);

  // Computed values
  const selectedColor = productColors.find((c) => c.id == selectedColorId);
  const selectedSize = colorSizes.find((s) => s.id == selectedSizeId);

  const colorImagesData = productColors
    .map((color) => ({
      src: color.color_image,
      colorCode: color.color_code,
      colorName: color.color_name,
    }))
    .filter((item) => item.src);

  const thumbnails = (() => {
    const combined = [];
    if (allImages.length) {
      allImages.forEach((img) => {
        if (img && !combined.find((item) => item.src === img)) {
          combined.push({ src: img, type: 'product' });
        }
      });
    }
    if (colorImagesData.length) {
      colorImagesData.forEach((colorImg) => {
        if (colorImg.src && !combined.find((item) => item.src === colorImg.src)) {
          combined.push({ src: colorImg.src, type: 'color', colorName: colorImg.colorName });
        }
      });
    }
    return combined;
  })();

  const availableSizesForColor = colorSizes.filter((s) => s.color_id == selectedColorId);

  const displayPrice = (() => {
    if (selectedVariant) return selectedVariant.price;
    if (selectedColorId) {
      const variantsForColor = productVariants.filter(
        (v) => v.color_id == selectedColorId && v.is_active
      );
      if (variantsForColor.length > 0) {
        const minPrice = Math.min(...variantsForColor.map((v) => v.price));
        const maxPrice = Math.max(...variantsForColor.map((v) => v.price));
        return minPrice === maxPrice ? minPrice : `${minPrice} - ${maxPrice}`;
      }
    }
    return currentProduct?.price || 0;
  })();

  const displayOldPrice = selectedVariant?.old_price || currentProduct?.old_price || null;
  const isOutOfStock = selectedVariant ? selectedVariant.stock <= 0 : false;

  const relatedProducts = [...allProducts.filter((p) => p.id !== currentProduct?.id)]
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  // Loading state
  if (loading || !router.isReady) {
    return (
      <>
        <Head>
          <title>Loading... | JAYENWARE</title>
          <meta name="description" content="Discover detailed product specifications, fabric, fit, and more at JAYENWARE." />
          <meta name="theme-color" content="#1d1d1f" />
          <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
          <link rel="apple-touch-icon" href="/logo.png" />
          <link rel="canonical" href="https://www.jayenware.shop/product/" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
          <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js" />
        </Head>
        <main style={{ flexGrow: 1 }}>
          <SkeletonLoader />
        </main>
      </>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <>
        <Head>
          <title>Product Not Found | JAYENWARE</title>
          <meta name="description" content="Product not found at JAYENWARE." />
          <meta name="theme-color" content="#1d1d1f" />
          <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
          <link rel="apple-touch-icon" href="/logo.png" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        </Head>
        <main style={{ flexGrow: 1 }}>
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <i
              className="fa-solid fa-box-open"
              style={{ fontSize: '64px', color: '#e5e5e5', marginBottom: '20px' }}
            />
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1d1d1f', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
              Product Not Found
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '28px', fontFamily: 'var(--font-body)' }}>
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/products"
              style={{
                display: 'inline-block',
                padding: '14px 36px',
                background: '#1d1d1f',
                color: 'white',
                borderRadius: '9999px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontSize: '12px',
                textDecoration: 'none',
                fontFamily: 'var(--font-body)',
              }}
            >
              Browse Products
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (!currentProduct) return null;

  return (
    <>
      <Head>
        <title>{currentProduct.title || 'Product'} | JAYENWARE</title>
        <meta
          name="description"
          content={(currentProduct.description || currentProduct.title || '').substring(0, 155) + '...'}
        />
        <meta name="theme-color" content="#1d1d1f" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="canonical" href={`https://www.jayenware.shop/product/${slug}`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js" />
      </Head>

      <main style={{ flexGrow: 1 }}>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <div className="desktop-layout" style={{ display: 'block' }}>
          {/* Left Column - Images */}
          <div className="desktop-image-col">
            <div className="main-image-wrapper">
              <div
                ref={heroRef}
                className={`product-hero${isZoomed ? ' zoomed' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  position: 'relative',
                  width: '100%',
                  background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                  height: '60vh',
                  minHeight: '400px',
                  maxHeight: '600px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                  transition: 'background 0.3s ease',
                  touchAction: 'none',
                }}
              >
                <img
                  src={activeImage}
                  alt={currentProduct.title || ''}
                  draggable="false"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transition: isZoomed ? 'none' : 'transform 0.3s ease',
                    transform: isZoomed ? `scale(2.5)` : 'scale(1)',
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.08))',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                  onError={(e) => {
                    e.target.src = '/logo.png';
                  }}
                />
              </div>
            </div>

            {/* Thumbnails */}
            {thumbnails.length > 1 && (
              <div
                className="thumbnail-grid no-scrollbar"
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: '10px',
                  marginTop: '12px',
                  overflowX: 'auto',
                  padding: '4px 0 8px',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {thumbnails.map((thumb, index) => (
                  <img
                    key={index}
                    src={thumb.src}
                    onClick={() => selectThumbnail(thumb.src)}
                    className={`thumbnail-item${activeImage === thumb.src ? ' active' : ''}`}
                    alt="thumb"
                    loading="lazy"
                    draggable="false"
                    style={{
                      width: '72px',
                      height: '72px',
                      objectFit: 'cover',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      border: activeImage === thumb.src
                        ? '2px solid #1d1d1f'
                        : '2px solid rgba(255,255,255,0.8)',
                      flexShrink: 0,
                      transition: 'all 0.3s',
                      opacity: activeImage === thumb.src ? 1 : 0.7,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                    onMouseEnter={(e) => {
                      if (activeImage !== thumb.src) {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeImage !== thumb.src) {
                        e.currentTarget.style.opacity = '0.7';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="desktop-info-col">
            <div
              className="product-info-card"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                borderRadius: '24px',
                padding: '20px',
                marginBottom: '16px',
                border: '1px solid rgba(0,0,0,0.04)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <span
                className="variant-pill"
                style={{
                  background: 'rgba(0,122,255,0.08)',
                  color: '#007aff',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'inline-block',
                  marginBottom: '10px',
                  fontFamily: 'var(--font-accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {currentProduct.category || 'Product'}
              </span>
              {currentProduct.subcategory && (
                <span
                  className="variant-pill"
                  style={{
                    background: 'rgba(134,135,139,0.08)',
                    color: '#86868b',
                    marginLeft: '8px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'inline-block',
                    marginBottom: '10px',
                    fontFamily: 'var(--font-accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {currentProduct.subcategory}
                </span>
              )}

              <h1
                className="title-text"
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#1d1d1f',
                  marginBottom: '4px',
                  lineHeight: 1.2,
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {currentProduct.title || ''}
              </h1>

              {currentProduct.short_description && (
                <p
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '8px 0 0',
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {currentProduct.short_description}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginTop: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span
                    id="variant-price-display"
                    style={{
                      fontSize: '30px',
                      fontWeight: 900,
                      color: '#1d1d1f',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    ৳ {displayPrice}
                  </span>
                  {displayOldPrice && (
                    <span
                      id="variant-old-price-display"
                      style={{
                        fontSize: '16px',
                        color: '#86868b',
                        textDecoration: 'line-through',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      ৳ {displayOldPrice}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleWishlist(currentProduct.id)}
                  data-wishlist-btn
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    color: '#1d1d1f',
                    transition: 'all 0.3s',
                    fontFamily: 'var(--font-accent)',
                  }}
                >
                  <i
                    className={`fa-${wishlist.includes(currentProduct.id) ? 'solid' : 'regular'} fa-heart`}
                    style={{
                      color: wishlist.includes(currentProduct.id) ? '#ef4444' : '#86868b',
                      fontSize: '14px',
                    }}
                  />{' '}
                  {wishlist.includes(currentProduct.id) ? 'Saved' : 'Save'}
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '12px',
                }}
              >
                <span
                  id="stock-status-dot"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: selectedVariant
                      ? isOutOfStock
                        ? '#ef4444'
                        : '#22c55e'
                      : '#f59e0b',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span
                  id="stock-status-text"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-subtitle)',
                    color: selectedVariant
                      ? isOutOfStock
                        ? '#ef4444'
                        : '#16a34a'
                      : '#d97706',
                  }}
                >
                  {selectedVariant
                    ? isOutOfStock
                      ? 'Out of Stock'
                      : 'In Stock'
                    : 'Select options'}
                </span>
              </div>

              <div
                className="divider"
                style={{
                  height: '1px',
                  background: 'rgba(0,0,0,0.06)',
                  margin: '16px 0',
                }}
              />

              {/* Variant Options */}
              {productColors.length > 0 && (
                <CollapsibleSection icon="fa-palette" title="Color & Size">
                  <div style={{ padding: '10px 0 16px' }}>
                    {/* Colors */}
                    <div style={{ marginBottom: '8px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <span
                          className="section-label"
                          style={{
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontSize: '10px',
                            color: '#86868b',
                            fontFamily: 'var(--font-accent)',
                          }}
                        >
                          Color
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f', fontFamily: 'var(--font-subtitle)' }}>
                          {selectedColor?.color_name || 'Select'}
                        </span>
                      </div>
                      <div className="no-scrollbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {productColors.map((color) => {
                          const hasStock =
                            productVariants.filter(
                              (v) => v.color_id == color.id && v.is_active && v.stock > 0
                            ).length > 0;
                          const isSelected = selectedColorId === color.id;
                          return (
                            <button
                              key={color.id}
                              className={`color-swatch-btn${isSelected ? ' selected' : ''}${!hasStock ? ' disabled' : ''}`}
                              onClick={() => hasStock && selectColor(color.id)}
                              title={`${color.color_name}${!hasStock ? ' (Out of Stock)' : ''}`}
                              disabled={!hasStock}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: isSelected
                                  ? '2px solid #1d1d1f'
                                  : '2px solid rgba(0,0,0,0.12)',
                                cursor: hasStock ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                flexShrink: 0,
                                background: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                                backdropFilter: isSelected ? 'blur(20px)' : 'blur(10px)',
                                WebkitBackdropFilter: isSelected ? 'blur(20px)' : 'blur(10px)',
                                padding: '3px',
                                outline: 'none',
                                boxShadow: isSelected
                                  ? '0 0 0 4px rgba(29,29,31,0.1), 0 4px 16px rgba(0,0,0,0.14), inset 0 0 0 1px rgba(0,0,0,0.1)'
                                  : '0 2px 8px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.08)',
                                opacity: !hasStock ? 0.3 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                              }}
                              onMouseEnter={(e) => {
                                if (hasStock && !isSelected) {
                                  e.currentTarget.style.transform = 'scale(1.12)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.12)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (hasStock && !isSelected) {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.08)';
                                }
                              }}
                            >
                              <span
                                className="swatch-color"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '50%',
                                  display: 'block',
                                  background: color.color_code || '#ccc',
                                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
                                }}
                              />
                              {!hasStock && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '-5%',
                                    width: '110%',
                                    height: '2px',
                                    background: '#ef4444',
                                    transform: 'rotate(-45deg)',
                                  }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sizes */}
                    <div style={{ height: '12px' }} />
                    <div style={{ marginBottom: '8px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <span
                          className="section-label"
                          style={{
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontSize: '10px',
                            color: '#86868b',
                            fontFamily: 'var(--font-accent)',
                          }}
                        >
                          Size
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f', fontFamily: 'var(--font-subtitle)' }}>
                          {selectedSize?.size_name || 'Select'}
                        </span>
                      </div>
                      <div className="no-scrollbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {!selectedColorId ? (
                          <p style={{ fontSize: '12px', color: '#9ca3af', padding: '6px 0', fontFamily: 'var(--font-body)' }}>
                            Choose a color first
                          </p>
                        ) : availableSizesForColor.length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#9ca3af', padding: '8px 0', fontFamily: 'var(--font-body)' }}>
                            No sizes available
                          </p>
                        ) : (
                          availableSizesForColor.map((size) => {
                            const variant = getVariant(selectedColorId, size.id);
                            const isAvailable = variant && variant.stock > 0 && variant.is_active;
                            const isSelected = selectedSizeId === size.id;
                            return (
                              <button
                                key={size.id}
                                className={`size-btn${isSelected ? ' selected' : ''}${!isAvailable ? ' disabled' : ''}`}
                                onClick={() => isAvailable && selectSize(size.id)}
                                disabled={!isAvailable}
                                style={{
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                                  border: isSelected
                                    ? '1px solid #1d1d1f'
                                    : '1px solid rgba(0,0,0,0.08)',
                                  borderRadius: '12px',
                                  padding: '10px 18px',
                                  fontWeight: 600,
                                  fontSize: '13px',
                                  fontFamily: 'var(--font-subtitle)',
                                  background: isSelected
                                    ? '#1d1d1f'
                                    : isAvailable
                                    ? 'rgba(255,255,255,0.6)'
                                    : 'rgba(245,245,247,0.5)',
                                  backdropFilter: 'blur(10px)',
                                  WebkitBackdropFilter: 'blur(10px)',
                                  color: isSelected ? 'white' : '#1d1d1f',
                                  minWidth: '48px',
                                  textAlign: 'center',
                                  flexShrink: 0,
                                  boxShadow: isSelected
                                    ? '0 4px 12px rgba(0,0,0,0.12)'
                                    : '0 1px 3px rgba(0,0,0,0.03)',
                                  opacity: !isAvailable ? 0.3 : 1,
                                  textDecoration: !isAvailable ? 'line-through' : 'none',
                                  transform: isSelected ? 'translateY(-1px)' : 'none',
                                }}
                                onMouseEnter={(e) => {
                                  if (isAvailable && !isSelected) {
                                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.85)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (isAvailable && !isSelected) {
                                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }
                                }}
                              >
                                {size.size_name}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Variant Info Pill */}
                    {selectedVariant && (
                      <div
                        className="variant-info-pill"
                        style={{
                          background: 'rgba(0,0,0,0.03)',
                          borderRadius: '14px',
                          padding: '14px 18px',
                          marginTop: '14px',
                          fontSize: '12px',
                          color: '#1d1d1f',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap',
                          fontFamily: 'var(--font-subtitle)',
                          fontWeight: 500,
                        }}
                      >
                        {selectedVariant.sku && (
                          <>
                            <span style={{ fontWeight: 700 }}>SKU</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                              {selectedVariant.sku}
                            </span>
                          </>
                        )}
                        {selectedVariant.barcode && (
                          <>
                            <span className="separator" style={{ color: '#d1d5db', fontSize: '18px', fontWeight: 300 }}>|</span>
                            <span style={{ fontWeight: 700 }}>Barcode</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                              {selectedVariant.barcode}
                            </span>
                          </>
                        )}
                        {selectedVariant.weight && (
                          <>
                            <span className="separator" style={{ color: '#d1d5db', fontSize: '18px', fontWeight: 300 }}>|</span>
                            <span style={{ fontWeight: 700 }}>Weight</span>
                            {selectedVariant.weight}g
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}
            </div>

            {/* Buy Buttons */}
            <div
              id="buy-section"
              ref={buySectionRef}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                margin: '14px 0 24px',
              }}
            >
              <button
                id="add-to-bag-btn"
                onClick={() => addToCartHandler(currentProduct.id)}
                disabled={isOutOfStock && selectedVariant}
                style={{
                  padding: '18px',
                  background: '#1d1d1f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontWeight: 700,
                  fontSize: '13px',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.05em',
                  cursor: isOutOfStock && selectedVariant ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  opacity: isOutOfStock && selectedVariant ? 0.5 : 1,
                }}
              >
                Add to Bag
              </button>
              <button
                id="buy-now-btn"
                onClick={() => addToCartHandler(currentProduct.id, true)}
                disabled={isOutOfStock && selectedVariant}
                style={{
                  padding: '18px',
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(0,0,0,0.1)',
                  borderRadius: '16px',
                  fontWeight: 700,
                  fontSize: '13px',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.05em',
                  cursor: isOutOfStock && selectedVariant ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  color: '#1d1d1f',
                  opacity: isOutOfStock && selectedVariant ? 0.5 : 1,
                }}
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* DESKTOP: Full Width Sections */}
          <div className="desktop-full-width-buttons">
            {/* Specifications */}
            <CollapsibleSection icon="fa-sliders" title="Specifications">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '4px 0 16px' }}>
                {currentProduct.fabric_type && (
                  <div className="detail-badge" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', borderRadius: '14px', padding: '14px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: 'var(--font-subtitle)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <i className="fa-solid fa-shirt" style={{ fontSize: '20px', color: '#1d1d1f', width: '28px', textAlign: 'center' }} />
                    <div>
                      <span style={{ color: '#9ca3af', fontSize: '10px', fontFamily: 'var(--font-accent)' }}>Fabric</span><br />
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-body)' }}>{currentProduct.fabric_type}</span>
                    </div>
                  </div>
                )}
                {currentProduct.gsm_type && (
                  <div className="detail-badge" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', borderRadius: '14px', padding: '14px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: 'var(--font-subtitle)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <i className="fa-solid fa-weight-scale" style={{ fontSize: '20px', color: '#1d1d1f', width: '28px', textAlign: 'center' }} />
                    <div>
                      <span style={{ color: '#9ca3af', fontSize: '10px', fontFamily: 'var(--font-accent)' }}>GSM</span><br />
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-body)' }}>{currentProduct.gsm_type}</span>
                    </div>
                  </div>
                )}
                {currentProduct.fit_type && (
                  <div className="detail-badge" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', borderRadius: '14px', padding: '14px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: 'var(--font-subtitle)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <i className="fa-solid fa-ruler" style={{ fontSize: '20px', color: '#1d1d1f', width: '28px', textAlign: 'center' }} />
                    <div>
                      <span style={{ color: '#9ca3af', fontSize: '10px', fontFamily: 'var(--font-accent)' }}>Fit</span><br />
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-body)' }}>{currentProduct.fit_type}</span>
                    </div>
                  </div>
                )}
                {currentProduct.gender && (
                  <div className="detail-badge" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', borderRadius: '14px', padding: '14px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: 'var(--font-subtitle)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <i className="fa-solid fa-venus-mars" style={{ fontSize: '20px', color: '#1d1d1f', width: '28px', textAlign: 'center' }} />
                    <div>
                      <span style={{ color: '#9ca3af', fontSize: '10px', fontFamily: 'var(--font-accent)' }}>Gender</span><br />
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-body)' }}>{currentProduct.gender}</span>
                    </div>
                  </div>
                )}
                {currentProduct.print_type && (
                  <div className="detail-badge" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', borderRadius: '14px', padding: '14px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: 'var(--font-subtitle)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <i className="fa-solid fa-palette" style={{ fontSize: '20px', color: '#1d1d1f', width: '28px', textAlign: 'center' }} />
                    <div>
                      <span style={{ color: '#9ca3af', fontSize: '10px', fontFamily: 'var(--font-accent)' }}>Print</span><br />
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-body)' }}>{currentProduct.print_type}</span>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Description */}
            {currentProduct.description && (
              <CollapsibleSection icon="fa-align-left" title="Description">
                <div
                  className="description-content"
                  style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    padding: '20px',
                    borderRadius: '16px',
                    marginTop: '4px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: '#4b5563',
                    border: '1px solid rgba(0,0,0,0.04)',
                    lineHeight: 1.8,
                    fontFamily: 'var(--font-body)',
                  }}
                  dangerouslySetInnerHTML={{ __html: currentProduct.description }}
                />
              </CollapsibleSection>
            )}

            {/* Barcode */}
            {(currentProduct.barcode) && (
              <CollapsibleSection
                icon="fa-barcode"
                title="Barcode"
                onToggle={(open) => {
                  if (open && !barcodeGenerated && currentProduct.barcode) {
                    generateBarcode(currentProduct.barcode);
                  }
                }}
              >
                <div
                  className="barcode-wrapper"
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                    padding: '20px 12px 16px',
                    borderRadius: '18px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    marginTop: '4px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '90px',
                    maxWidth: '100%',
                    overflowX: 'auto',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {barcodeSvg ? (
                    <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '24px' }}>
                      Click to generate barcode
                    </p>
                  )}
                </div>
              </CollapsibleSection>
            )}

            <div style={{ height: '16px' }} />
          </div>

          {/* Banner Section */}
          {productBanners.length > 0 && (
            <div className="mobile-banner-section full-width-section" style={{ marginTop: 0 }}>
              <BannerSection banners={productBanners} />
            </div>
          )}

          {/* Video Section */}
          {productVideos.length > 0 && (
            <div className="mobile-video-section full-width-section" style={{ marginTop: '40px' }}>
              <VideoSection videos={productVideos} />
            </div>
          )}

          <div style={{ height: '40px' }} />
        </div>

        {/* Complete the Look */}
        {relatedProducts.length > 0 && (
          <div style={{ padding: '40px 20px 60px', borderTop: '1px solid #f0f0f0' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#1d1d1f', marginBottom: '28px', textAlign: 'center', fontFamily: 'var(--font-heading)' }}>
              Complete the Look
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Sticky Add Bar */}
        <div
          className={`sticky-add-bar${stickyVisible ? ' active' : ''}`}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderTop: '0.5px solid rgba(0,0,0,0.06)',
            padding: '14px 20px calc(14px + env(safe-area-inset-bottom, 0px))',
            zIndex: 49,
            display: stickyVisible ? 'flex' : 'none',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ flexGrow: 1 }}>
            <span style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'var(--font-body)' }}>
              ৳ {selectedVariant?.price || currentProduct?.price || 0}
            </span>
          </div>
          <button
            onClick={() => addToCartHandler(currentProduct.id)}
            disabled={isOutOfStock && selectedVariant}
            style={{
              padding: '14px 32px',
              background: 'rgba(29,29,31,0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color: 'white',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '9999px',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.05em',
              cursor: isOutOfStock && selectedVariant ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              opacity: isOutOfStock && selectedVariant ? 0.5 : 1,
            }}
          >
            Add to Bag
          </button>
        </div>

        {/* Styles */}
        <style jsx global>{`
          :root {
            --primary: #1d1d1f;
            --accent: #86868b;
            --soft: #f5f5f7;
            --blue: #007aff;
            --safe-bottom: env(safe-area-inset-bottom, 0px);
            --font-body: 'Inter', sans-serif;
            --font-heading: 'Manrope', sans-serif;
            --font-subtitle: 'Sora', sans-serif;
            --font-accent: 'Manrope', sans-serif;
          }

          * {
            -webkit-tap-highlight-color: transparent;
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          img { max-width: 100%; height: auto; display: block; }

          body {
            font-family: var(--font-body);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-heading);
          }

          .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 8px;
          }

          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .product-card:hover .product-image {
            transform: scale(1.04);
          }

          .product-hero {
            position: relative;
            width: 100%;
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            height: 60vh;
            min-height: 400px;
            max-height: 600px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            cursor: zoom-in;
            transition: background 0.3s ease;
            -webkit-overflow-scrolling: touch;
          }

          .product-hero img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            transition: transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
            filter: drop-shadow(0 10px 30px rgba(0,0,0,0.08));
          }

          .product-hero.zoomed img { 
            transform: scale(2.5) !important;
            transition: none !important;
          }

          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

          .thumbnail-grid::-webkit-scrollbar { height: 3px; }
          .thumbnail-grid::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.1);
            border-radius: 10px;
          }

          .video-section.paused .video-play-indicator {
            opacity: 1;
          }

          .video-link-clean:hover {
            border-bottom-color: white;
            padding-bottom: 4px;
          }

          .sound-btn:hover {
            background: rgba(0,0,0,0.6);
            border-color: rgba(255,255,255,0.35);
            transform: scale(1.05);
          }

          .product-banner-card:hover img {
            transform: scale(1.05);
          }

          .banner-link:hover {
            border-bottom-color: white;
            padding-bottom: 5px;
          }

          #components-footer + footer,
          #components-footer ~ footer:not(#components-footer) {
            display: none !important;
          }

          @media (min-width: 768px) {
            .product-hero {
              height: 70vh;
              min-height: 500px;
              max-height: 800px;
            }
            .main-image-wrapper {
              width: 100%;
              margin-left: 0;
              margin-right: 0;
            }
            .video-section {
              min-height: 480px;
            }
            .product-banner-card {
              height: 320px;
              border-radius: 28px;
            }
            .product-banner-card .banner-title {
              font-size: 28px;
            }
            .product-banner-card .banner-subtitle {
              font-size: 16px;
            }
            .product-banner-card .banner-overlay {
              padding: 44px 40px;
            }
          }

          @media (min-width: 1024px) {
            .desktop-layout {
              display: grid !important;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              align-items: start;
              max-width: 1400px;
              margin: 0 auto;
              padding: 40px;
            }
            .product-hero {
              height: auto;
              min-height: 500px;
              max-height: none;
              border-radius: 24px;
            }
            .product-hero img {
              max-height: 80vh;
            }
            .desktop-image-col {
              position: relative;
            }
            .desktop-info-col {
              max-width: 600px;
            }
            .main-image-wrapper {
              width: 100% !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
            .product-info-card {
              padding: 32px;
            }
            .product-info-card .title-text {
              font-size: 30px;
            }
            #variant-price-display {
              font-size: 36px !important;
            }
            #variant-old-price-display {
              font-size: 18px !important;
            }
            .color-swatch-btn {
              width: 44px;
              height: 44px;
            }
            .size-btn {
              padding: 12px 22px;
              font-size: 14px;
              min-width: 52px;
              border-radius: 14px;
            }
            #buy-section button {
              padding: 20px !important;
              font-size: 14px !important;
              border-radius: 16px !important;
            }
            .thumbnail-item {
              width: 80px;
              height: 80px;
            }
            .detail-badge {
              padding: 18px 22px;
              font-size: 14px;
            }
            .detail-badge i {
              font-size: 22px;
            }
            .toggle-btn {
              padding: 20px 28px;
              font-size: 13px;
            }
            .full-width-section {
              grid-column: 1 / -1;
              width: 100%;
              margin-top: 20px;
            }
            .mobile-video-section, .mobile-banner-section, .desktop-full-width-buttons {
              grid-column: 1 / -1;
              width: 100%;
            }
            .video-section {
              min-height: 560px;
            }
            .product-banner-card {
              height: 550px;
            }
            .product-banner-card .banner-title {
              font-size: 32px;
            }
            .product-banner-card .banner-subtitle {
              font-size: 18px;
            }
            .product-banner-card .banner-overlay {
              padding: 60px 56px;
            }
            .product-banner-card .banner-link {
              font-size: 15px;
            }
          }
        `}</style>
      </main>
    </>
  );
}
