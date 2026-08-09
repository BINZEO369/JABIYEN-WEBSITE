// Product.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';

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

async function apiPost(endpoint, body) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
  } catch (e) {
    console.error('API Post Error:', e);
    throw e;
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
      to={`/product/${slug}`}
      className="product-card"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
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
            }}
          >
            {product.category || ''}
          </p>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#1d1d1f',
              marginBottom: '6px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {product.title || ''}
          </h3>
          <span style={{ fontSize: '16px', fontWeight: 900 }}>৳ {product.price || 0}</span>
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
      // Pause all other videos
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
    const videoId = `product-video-${index}`;
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
    const isPlaying = playingIndex === index;
    const isMuted = mutedStates[index] !== false;

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
          id={videoId}
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

        {/* Text Overlay */}
        <div
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
              style={{
                color: 'white',
                fontSize: '28px',
                fontWeight: 700,
                lineHeight: 1.2,
                margin: 0,
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}
            >
              {video.title}
            </h3>
          )}
          {video.subtitle && (
            <p
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '14px',
                fontWeight: 400,
                marginTop: '8px',
                textShadow: '0 1px 6px rgba(0,0,0,0.4)',
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
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {linkText} →
            </a>
          )}
        </div>

        {/* Play Indicator */}
        <div
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

        {/* Sound Controls */}
        <div
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
        />
        <div
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
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '15px',
                textShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}
            >
              {banner.subtitle}
            </p>
          )}
          {hasLink && (
            <span
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
const CollapsibleSection = ({ id, icon, title, children, defaultOpen = false, onToggle }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);

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
        ref={contentRef}
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
// MAIN PRODUCT COMPONENT
// ================================================================
const Product = () => {
  const { slug } = useParams();

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

  const stickyBarRef = useRef(null);
  const buySectionRef = useRef(null);
  const heroRef = useRef(null);

  // ================================================================
  // Show Toast
  // ================================================================
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // ================================================================
  // Load wishlist from localStorage
  // ================================================================
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('jayen_wishlist') || '[]');
      setWishlist(saved);
    } catch {
      setWishlist([]);
    }
  }, []);

  // ================================================================
  // Toggle Wishlist
  // ================================================================
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
      localStorage.setItem('jayen_wishlist', JSON.stringify(updated));
    },
    [wishlist, showToast]
  );

  // ================================================================
  // Get variant by color and size
  // ================================================================
  const getVariant = useCallback(
    (colorId, sizeId) => {
      return productVariants.find((v) => v.color_id == colorId && v.size_id == sizeId) || null;
    },
    [productVariants]
  );

  // ================================================================
  // Select Color
  // ================================================================
  const selectColor = useCallback(
    (colorId) => {
      setSelectedColorId(colorId);
      setSelectedSizeId(null);
      setSelectedVariant(null);

      const color = productColors.find((c) => c.id == colorId);
      if (color && color.color_image) {
        setActiveImage(color.color_image);
      }
    },
    [productColors]
  );

  // ================================================================
  // Select Size
  // ================================================================
  const selectSize = useCallback(
    (sizeId) => {
      setSelectedSizeId(sizeId);
      if (selectedColorId && sizeId) {
        setSelectedVariant(getVariant(selectedColorId, sizeId));
      }
    },
    [selectedColorId, getVariant]
  );

  // ================================================================
  // Select Thumbnail
  // ================================================================
  const selectThumbnail = useCallback((imageSrc) => {
    setActiveImage(imageSrc);
    setIsZoomed(false);
  }, []);

  // ================================================================
  // Add to Cart Handler
  // ================================================================
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

      // Dispatch to global cart
      if (window.addToCart) {
        window.addToCart(productId, productData);
      }
      showToast('Added to Bag! 🎉', 'success');

      if (buyNow) {
        window.location.href = '/checkout';
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
    ]
  );

  // ================================================================
  // Generate Barcode SVG
  // ================================================================
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

  // ================================================================
  // Zoom handlers
  // ================================================================
  const handleMouseMove = useCallback((e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
    setIsZoomed(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsZoomed(false);
  }, []);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
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

  // ================================================================
  // Scroll handler for sticky bar
  // ================================================================
  useEffect(() => {
    const handleScroll = () => {
      if (buySectionRef.current) {
        const rect = buySectionRef.current.getBoundingClientRect();
        setStickyVisible(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ================================================================
  // Load Product Data
  // ================================================================
  useEffect(() => {
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

        // Set images
        const images = product.images ? product.images.split(',').filter(Boolean) : [];
        if (images.length === 0 && product.img) images.push(product.img);
        setAllImages(images);
        setActiveImage(images[0] || '/logo.png');

        // Fetch related data
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
        try {
          let recent = JSON.parse(localStorage.getItem('jayen_recent') || '[]');
          recent = [product.id.toString(), ...recent.filter((id) => id != product.id)].slice(0, 8);
          localStorage.setItem('jayen_recent', JSON.stringify(recent));
        } catch {}

        // Update meta
        document.title = `${product.title || 'Product'} | JAYENWARE`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.content =
            (product.description || product.title || '').substring(0, 155) + '...';
        }

        setLoading(false);
      } catch (e) {
        console.error('Error loading product:', e);
        setNotFound(true);
        setLoading(false);
      }
    };

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  // ================================================================
  // Fix duplicate footer
  // ================================================================
  useEffect(() => {
    if (!loading && !notFound) {
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

  // ================================================================
  // Computed values
  // ================================================================
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

  // ================================================================
  // Render
  // ================================================================
  if (loading) {
    return (
      <main style={{ flexGrow: 1 }}>
        <SkeletonLoader />
      </main>
    );
  }

  if (notFound) {
    return (
      <main style={{ flexGrow: 1 }}>
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <i
            className="fa-solid fa-box-open"
            style={{ fontSize: '64px', color: '#e5e5e5', marginBottom: '20px' }}
          />
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1d1d1f', marginBottom: '8px' }}>
            Product Not Found
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '28px' }}>
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/products"
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
            }}
          >
            Browse Products
          </Link>
        </div>
      </main>
    );
  }

  if (!currentProduct) return null;

  return (
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
              className={`product-hero ${isZoomed ? 'zoomed' : ''}`}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
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
                cursor: 'zoom-in',
                transition: 'background 0.3s ease',
              }}
            >
              <img
                id="product-hero-image"
                src={activeImage}
                alt={currentProduct.title || ''}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transition: 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  transform: isZoomed
                    ? `scale(2.5)`
                    : 'scale(1)',
                  transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                  filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.08))',
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
              }}
            >
              {thumbnails.map((thumb, index) => (
                <img
                  key={index}
                  src={thumb.src}
                  onClick={() => selectThumbnail(thumb.src)}
                  className={`thumbnail-item ${activeImage === thumb.src ? 'active' : ''}`}
                  alt="thumb"
                  loading="lazy"
                  style={{
                    width: '72px',
                    height: '72px',
                    objectFit: 'cover',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    border:
                      activeImage === thumb.src
                        ? '2px solid #1d1d1f'
                        : '2px solid rgba(255,255,255,0.8)',
                    flexShrink: 0,
                    transition: 'all 0.3s',
                    opacity: activeImage === thumb.src ? 1 : 0.7,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
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
                  cursor: 'pointer',
                  color: '#1d1d1f',
                  transition: 'all 0.3s',
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
              <CollapsibleSection
                id="variant-collapse"
                icon="fa-palette"
                title="Color & Size"
              >
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
                        }}
                      >
                        Color
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#1d1d1f',
                        }}
                      >
                        {selectedColor?.color_name || 'Select'}
                      </span>
                    </div>
                    <div
                      className="no-scrollbar"
                      style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}
                    >
                      {productColors.map((color) => {
                        const hasStock =
                          productVariants.filter(
                            (v) =>
                              v.color_id == color.id && v.is_active && v.stock > 0
                          ).length > 0;
                        return (
                          <button
                            key={color.id}
                            className={`color-swatch-btn ${selectedColorId === color.id ? 'selected' : ''} ${!hasStock ? 'disabled' : ''}`}
                            data-color-id={color.id}
                            onClick={() => selectColor(color.id)}
                            title={`${color.color_name}${!hasStock ? ' (Out of Stock)' : ''}`}
                            disabled={!hasStock}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              border:
                                selectedColorId === color.id
                                  ? '2px solid #1d1d1f'
                                  : '2px solid rgba(0,0,0,0.12)',
                              cursor: hasStock ? 'pointer' : 'not-allowed',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              position: 'relative',
                              flexShrink: 0,
                              background: 'rgba(255,255,255,0.6)',
                              backdropFilter: 'blur(10px)',
                              padding: '3px',
                              outline: 'none',
                              boxShadow:
                                selectedColorId === color.id
                                  ? '0 0 0 4px rgba(29,29,31,0.1), 0 4px 16px rgba(0,0,0,0.14)'
                                  : '0 2px 8px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.08)',
                              opacity: !hasStock ? 0.3 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
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
                        }}
                      >
                        Size
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#1d1d1f',
                        }}
                      >
                        {selectedSize?.size_name || 'Select'}
                      </span>
                    </div>
                    <div
                      id="size-buttons-container"
                      className="no-scrollbar"
                      style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                    >
                      {!selectedColorId ? (
                        <p style={{ fontSize: '12px', color: '#9ca3af', padding: '6px 0' }}>
                          Choose a color first
                        </p>
                      ) : availableSizesForColor.length === 0 ? (
                        <p style={{ fontSize: '12px', color: '#9ca3af', padding: '8px 0' }}>
                          No sizes available
                        </p>
                      ) : (
                        availableSizesForColor.map((size) => {
                          const variant = getVariant(selectedColorId, size.id);
                          const isAvailable = variant && variant.stock > 0 && variant.is_active;
                          return (
                            <button
                              key={size.id}
                              data-size-id={size.id}
                              className={`size-btn ${selectedSizeId === size.id ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                              onClick={() => isAvailable && selectSize(size.id)}
                              disabled={!isAvailable}
                              style={{
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                border:
                                  selectedSizeId === size.id
                                    ? '1px solid #1d1d1f'
                                    : '1px solid rgba(0,0,0,0.08)',
                                borderRadius: '12px',
                                padding: '10px 18px',
                                fontWeight: 600,
                                fontSize: '13px',
                                background:
                                  selectedSizeId === size.id
                                    ? '#1d1d1f'
                                    : isAvailable
                                    ? 'rgba(255,255,255,0.6)'
                                    : 'rgba(245,245,247,0.5)',
                                color:
                                  selectedSizeId === size.id ? 'white' : '#1d1d1f',
                                minWidth: '48px',
                                textAlign: 'center',
                                flexShrink: 0,
                                boxShadow:
                                  selectedSizeId === size.id
                                    ? '0 4px 12px rgba(0,0,0,0.12)'
                                    : '0 1px 3px rgba(0,0,0,0.03)',
                                opacity: !isAvailable ? 0.3 : 1,
                                textDecoration: !isAvailable ? 'line-through' : 'none',
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
                      id="variant-info-pill"
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
                          <span className="separator" style={{ color: '#d1d5db', fontSize: '18px', fontWeight: 300 }}>
                            |
                          </span>
                          <span style={{ fontWeight: 700 }}>Barcode</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                            {selectedVariant.barcode}
                          </span>
                        </>
                      )}
                      {selectedVariant.weight && (
                        <>
                          <span className="separator" style={{ color: '#d1d5db', fontSize: '18px', fontWeight: 300 }}>
                            |
                          </span>
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
                cursor: isOutOfStock && selectedVariant ? 'not-allowed' : 'pointer',
                letterSpacing: '0.3px',
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
                border: '1.5px solid rgba(0,0,0,0.1)',
                borderRadius: '16px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isOutOfStock && selectedVariant ? 'not-allowed' : 'pointer',
                letterSpacing: '0.3px',
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
          <CollapsibleSection id="specs-collapse" icon="fa-sliders" title="Specifications">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                margin: '4px 0 16px',
              }}
            >
              {currentProduct.fabric_type && (
                <div
                  className="detail-badge"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <i className="fa-solid fa-shirt" style={{ fontSize: '20px', color: '#1d1d1f', width: '28px', textAlign: 'center' }} />
                  <div>
                    <span style={{ color: '#9ca3af', fontSize: '10px' }}>Fabric</span>
                    <br />
                    <span style={{ fontWeight: 700 }}>{currentProduct.fabric_type}</span>
                  </div>
                </div>
              )}
              {currentProduct.gsm_type && (
                <div
                  className="detail-badge"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <i className="fa-solid fa-weight-scale" style={{ fontSize: '20px', color: '#1d1d1f', width: '28px', textAlign: 'center' }} />
                  <div>
                    <span style={{ color: '#9ca3af', fontSize: '10px' }}>GSM</span>
                    <br />
                    <span style={{ fontWeight: 700 }}>{currentProduct.gsm_type}</span>
                  </div>
                </div>
              )}
              {currentProduct.fit_type && (
                <div
                  className="detail-badge"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <i className="fa-solid fa-ruler" style={{ fontSize: '20px', color: '#1d1d1f', width: '28px', textAlign: 'center' }} />
                  <div>
                    <span style={{ color: '#9ca3af', fontSize: '10px' }}>Fit</span>
                    <br />
                    <span style={{ fontWeight: 700 }}>{currentProduct.fit_type}</span>
                  </div>
                </div>
              )}
              {currentProduct.gender && (
                <div
                  className="detail-badge"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <i className="fa-solid fa-venus-mars" style={{ fontSize: '20px', color: '#1d1d1f', width: '28px', textAlign: 'center' }} />
                  <div>
                    <span style={{ color: '#9ca3af', fontSize: '10px' }}>Gender</span>
                    <br />
                    <span style={{ fontWeight: 700 }}>{currentProduct.gender}</span>
                  </div>
                </div>
              )}
              {currentProduct.print_type && (
                <div
                  className="detail-badge"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <i className="fa-solid fa-palette" style={{ fontSize: '20px', color: '#1d1d1f', width: '28px', textAlign: 'center' }} />
                  <div>
                    <span style={{ color: '#9ca3af', fontSize: '10px' }}>Print</span>
                    <br />
                    <span style={{ fontWeight: 700 }}>{currentProduct.print_type}</span>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Description */}
          {currentProduct.description && (
            <CollapsibleSection id="desc-collapse" icon="fa-align-left" title="Description">
              <div
                className="description-content"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(10px)',
                  padding: '20px',
                  borderRadius: '16px',
                  marginTop: '4px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: '#4b5563',
                  border: '1px solid rgba(0,0,0,0.04)',
                  lineHeight: 1.8,
                }}
                dangerouslySetInnerHTML={{ __html: currentProduct.description }}
              />
            </CollapsibleSection>
          )}

          {/* Barcode */}
          {(currentProduct.barcode) && (
            <CollapsibleSection
              id="barcode-collapse"
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
        <div
          style={{
            padding: '40px 20px 60px',
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <h3
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1d1d1f',
              marginBottom: '28px',
              textAlign: 'center',
            }}
          >
            Complete the Look
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2,1fr)',
              gap: '16px',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky Add Bar */}
      <div
        ref={stickyBarRef}
        className={`sticky-add-bar ${stickyVisible ? 'active' : ''}`}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(40px)',
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
          <span style={{ fontSize: '20px', fontWeight: 900 }}>
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
            color: 'white',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '9999px',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: '13px',
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
      <style>{`
        :root {
          --font-body: 'Inter', sans-serif;
          --font-heading: 'Manrope', sans-serif;
          --font-subtitle: 'Sora', sans-serif;
          --font-accent: 'Manrope', sans-serif;
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

        .toggle-btn:hover {
          background: rgba(255,255,255,0.9);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }

        .detail-badge:hover {
          background: rgba(255,255,255,0.9);
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }

        .size-btn:hover:not(.disabled):not(.selected) {
          border-color: rgba(0,0,0,0.2);
          background: rgba(255,255,255,0.85);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transform: translateY(-1px);
        }

        .color-swatch-btn:hover:not(.disabled) {
          transform: scale(1.12);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.12);
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .thumbnail-grid::-webkit-scrollbar { height: 3px; }
        .thumbnail-grid::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }

        @media (min-width: 768px) {
          .product-hero {
            height: 70vh;
            min-height: 500px;
            max-height: 800px;
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

          .color-swatch-btn {
            width: 44px !important;
            height: 44px !important;
          }

          .size-btn {
            padding: 12px 22px !important;
            font-size: 14px !important;
            min-width: 52px !important;
            border-radius: 14px !important;
          }

          #buy-section button {
            padding: 20px !important;
            font-size: 14px !important;
            border-radius: 16px !important;
          }

          .thumbnail-item {
            width: 80px !important;
            height: 80px !important;
          }

          .detail-badge {
            padding: 18px 22px !important;
            font-size: 14px !important;
          }

          .detail-badge i {
            font-size: 22px !important;
          }

          .toggle-btn {
            padding: 20px 28px !important;
            font-size: 13px !important;
          }

          .full-width-section {
            grid-column: 1 / -1;
            width: 100%;
            margin-top: 20px;
          }

          .mobile-video-section {
            grid-column: 1 / -1;
            width: 100%;
          }

          .mobile-banner-section {
            grid-column: 1 / -1;
            width: 100%;
          }

          .desktop-full-width-buttons {
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
  );
};

export default Product;
