// pages/product/[slug].js
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useCartState } from '../../components/layout/CartDrawer';
import { useCurrency } from '../../components/currency/CurrencyProvider';

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
  return title.toLowerCase().replace(/[^\w\u0980-\u09FF]+/g, '-').replace(/^-+|-+$/g, '');
}

// ================================================================
// Toast
// ================================================================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: '100px', left: '50%',
      transform: 'translateX(-50%)',
      background: type === 'error' ? '#ef4444' : '#1d1d1f',
      color: 'white', padding: '12px 24px', borderRadius: '9999px',
      fontWeight: 600, fontSize: '11px', zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      whiteSpace: 'nowrap', letterSpacing: '0.02em',
    }}>
      {message}
    </div>
  );
};

// ================================================================
// Skeleton
// ================================================================
const SkeletonLoader = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
    <div className="skeleton" style={{ width: '100%', height: '60vh', minHeight: '400px', maxHeight: '600px', borderRadius: 0 }} />
    <div style={{ padding: '20px' }}>
      <div className="skeleton" style={{ height: '14px', width: '80px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '28px', width: '100%', marginBottom: '12px' }} />
      <div className="skeleton" style={{ height: '36px', width: '120px', marginBottom: '16px' }} />
      <div className="skeleton" style={{ height: '16px', width: '200px', marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <div className="skeleton" style={{ height: '40px', width: '100px', borderRadius: '12px' }} />
        <div className="skeleton" style={{ height: '40px', width: '100px', borderRadius: '12px' }} />
      </div>
    </div>
  </div>
);

// ================================================================
// Product Card (memoized — no re-renders on parent state change)
// ================================================================
const ProductCard = memo(function ProductCard({ product }) {
  const { formatMoney } = useCurrency();
  if (!product) return null;
  const slug = product.slug || generateSlug(product.title);

  return (
    <Link href={`/product/${slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div className="cl-product-card">
        <div className="cl-product-media">
          <img
            src={product.img || '/logo.png'}
            alt={product.title || ''}
            className="cl-product-image"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = '/logo.png'; }}
          />
        </div>
        <div className="cl-product-copy">
          <h3 className="cl-product-title">{product.title || ''}</h3>
          <span className="cl-product-price">{formatMoney(product.price || 0)}</span>
        </div>
      </div>
    </Link>
  );
});

// ================================================================
// Video Section
// ================================================================
const VideoSection = ({ videos }) => {
  const videoRefs = useRef([]);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [mutedStates, setMutedStates] = useState({});

  useEffect(() => {
    const init = {};
    videos.forEach((_, i) => { init[i] = true; });
    setMutedStates(init);
  }, [videos]);

  const initVideo = useCallback((index) => {
    const video = videoRefs.current[index];
    if (!video) return;
    video.muted = true;
    video.play().then(() => setPlayingIndex(index)).catch(() => {});
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
        if (i !== index && v && !v.paused) v.pause();
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
            return video.click_link.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          }
        })()
      : '';

    return (
      <div key={index} className={`video-section ${!isPlaying ? 'paused' : ''}`}>
        <video
          ref={(el) => { videoRefs.current[index] = el; }}
          src={video.video_url}
          playsInline muted loop preload="auto"
          onLoadedData={() => initVideo(index)}
          onPlay={() => setPlayingIndex(index)}
          onPause={() => setPlayingIndex(null)}
          onEnded={() => setPlayingIndex(null)}
        />

        <div className="video-text-center">
          {video.title && <h3 className="video-title-main">{video.title}</h3>}
          {video.subtitle && <p className="video-subtitle-main">{video.subtitle}</p>}
          {hasLink && (
            <a
              href={video.click_link}
              target="_blank"
              rel="noopener"
              className="video-link-clean"
              onClick={(e) => e.stopPropagation()}
            >
              {linkText} →
            </a>
          )}
        </div>

        <div className="video-play-indicator">
          <i className="fa-solid fa-play" />
        </div>

        <div className="video-sound-control">
          <button
            className={`sound-btn ${isMuted ? 'muted' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleSound(index); }}
            title="Toggle Sound"
          >
            <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`} />
          </button>
          <button
            className="play-btn"
            onClick={(e) => { e.stopPropagation(); togglePlay(index); }}
            title="Play/Pause"
          >
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`} />
          </button>
        </div>
      </div>
    );
  });
};

// ================================================================
// Banner Section
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
            return banner.click_link.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          }
        })()
      : '';

    return (
      <div
        key={index}
        className="product-banner-card"
        onClick={() => hasLink && window.open(banner.click_link, '_blank')}
        style={{ cursor: hasLink ? 'pointer' : 'default' }}
      >
        <img
          src={banner.banner_url}
          alt={banner.title || 'Product banner'}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="banner-overlay">
          {banner.title && <h3 className="banner-title">{banner.title}</h3>}
          {banner.subtitle && <p className="banner-subtitle">{banner.subtitle}</p>}
          {hasLink && <span className="banner-link">{linkText} ↗</span>}
        </div>
      </div>
    );
  });
};

// ================================================================
// Collapsible Section
// ================================================================
const CollapsibleSection = ({ icon, title, children, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => {
    setIsOpen(!isOpen);
    if (onToggle) onToggle(!isOpen);
  };

  return (
    <>
      <button className="toggle-btn" onClick={toggle}>
        <span><i className={`fa-solid ${icon}`} /> &nbsp;{title}</span>
        <i className="fa-solid fa-chevron-down toggle-icon-right" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      <div className="collapse-section" style={{ maxHeight: isOpen ? '2000px' : 0 }}>
        {children}
      </div>
    </>
  );
};

// ================================================================
// MAIN PAGE
// ================================================================
export default function ProductPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart } = useCartState();
  const { formatMoney } = useCurrency();

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
  const [wishlist, setWishlist] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [barcodeSvg, setBarcodeSvg] = useState(null);

  const buySectionRef = useRef(null);
  const heroRef = useRef(null);
  const heroImgRef = useRef(null);  // ✅ ref-based zoom — no re-render

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem('jayen_wishlist') || '[]');
      setWishlist(saved);
    } catch { setWishlist([]); }
  }, []);

  const toggleWishlist = useCallback((productId) => {
    let updated;
    if (wishlist.includes(productId)) {
      updated = wishlist.filter((id) => id !== productId);
      showToast('Removed from wishlist');
    } else {
      updated = [...wishlist, productId];
      showToast('Added to wishlist');
    }
    setWishlist(updated);
    if (typeof window !== 'undefined') localStorage.setItem('jayen_wishlist', JSON.stringify(updated));
  }, [wishlist, showToast]);

  const getVariant = useCallback((colorId, sizeId) => {
    return productVariants.find((v) => v.color_id == colorId && v.size_id == sizeId) || null;
  }, [productVariants]);

  // Helper — reset zoom when image changes
  const resetZoom = () => {
    if (heroImgRef.current) {
      heroImgRef.current.style.transform = 'scale(1)';
      heroImgRef.current.style.transformOrigin = '50% 50%';
    }
    if (heroRef.current) {
      heroRef.current.style.cursor = 'zoom-in';
    }
  };

  const selectColor = useCallback((colorId) => {
    setSelectedColorId(colorId);
    setSelectedSizeId(null);
    setSelectedVariant(null);
    const color = productColors.find((c) => c.id == colorId);
    if (color && color.color_image) {
      resetZoom();
      setActiveImage(color.color_image);
    }
  }, [productColors]);

  const selectSize = useCallback((sizeId) => {
    setSelectedSizeId(sizeId);
    if (selectedColorId && sizeId) setSelectedVariant(getVariant(selectedColorId, sizeId));
  }, [selectedColorId, getVariant]);

  const selectThumbnail = useCallback((imageSrc) => {
    if (imageSrc && imageSrc !== activeImage) {
      resetZoom();
      setActiveImage(imageSrc);
    }
  }, [activeImage]);

  const addToCartHandler = useCallback((productId, buyNow = false) => {
    const product = allProducts.find((p) => p.id == productId);
    if (!product) { showToast('Product not found', 'error'); return; }

    if (productColors.length > 0 && !selectedVariant) {
      if (!selectedColorId) { showToast('Please select a color', 'error'); return; }
      if (!selectedSizeId) { showToast('Please select a size', 'error'); return; }
    }
    if (selectedVariant && selectedVariant.stock <= 0) { showToast('Out of stock', 'error'); return; }

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

    addToCart(productId, productData);
    showToast('Added to Bag', 'success');
    if (buyNow) router.push('/checkout');
  }, [allProducts, productColors, colorSizes, selectedVariant, selectedColorId, selectedSizeId, showToast, router, addToCart]);

  const generateBarcode = useCallback((barcodeText) => {
    if (!barcodeText || typeof window === 'undefined' || !window.JsBarcode) return;
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      window.JsBarcode(svg, barcodeText, {
        format: 'CODE128', width: 1.5, height: 60,
        displayValue: true, fontSize: 12, margin: 8,
        background: '#ffffff', lineColor: '#1d1d1f',
      });
      setBarcodeSvg(svg.outerHTML);
      setBarcodeGenerated(true);
    } catch (e) { console.error('Barcode failed:', e); }
  }, []);

  // ✅ Zoom — direct DOM manipulation, zero state updates
  const handleMouseMove = useCallback((e) => {
    if (!heroRef.current || !heroImgRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    heroImgRef.current.style.transformOrigin = `${x}% ${y}%`;
    heroImgRef.current.style.transform = 'scale(2.5)';
    heroRef.current.style.cursor = 'zoom-out';
  }, []);

  const handleMouseLeave = useCallback(() => {
    resetZoom();
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!heroRef.current || !heroImgRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    const y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
    heroImgRef.current.style.transformOrigin = `${x}% ${y}%`;
    heroImgRef.current.style.transform = 'scale(2.5)';
  }, []);

  const handleTouchEnd = useCallback(() => {
    resetZoom();
  }, []);

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

  useEffect(() => {
    if (!slug || !router.isReady) return;

    const loadProduct = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const products = await apiFetch('/products');
        if (!products) throw new Error('Failed to load products');

        setAllProducts(products);
        const product = products.find((p) => (p.slug || generateSlug(p.title)) === slug);

        if (!product) { setNotFound(true); setLoading(false); return; }

        setCurrentProduct(product);

        const images = product.images ? product.images.split(',').filter(Boolean) : [];
        if (images.length === 0 && product.img) images.push(product.img);
        setAllImages(images);
        setActiveImage(images[0] || '/logo.png');

        const [colors, variants, videos, banners] = await Promise.all([
          apiFetch(`/product-colors?slug=${encodeURIComponent(Array.isArray(slug) ? slug[0] : slug)}`),
          apiFetch(`/product-variants?slug=${encodeURIComponent(Array.isArray(slug) ? slug[0] : slug)}`),
          apiFetch(`/product-videos?slug=${encodeURIComponent(Array.isArray(slug) ? slug[0] : slug)}`),
          apiFetch(`/product-banners?slug=${encodeURIComponent(Array.isArray(slug) ? slug[0] : slug)}`),
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

  const selectedColor = productColors.find((c) => c.id == selectedColorId);
  const selectedSize = colorSizes.find((s) => s.id == selectedSizeId);

  const colorImagesData = productColors
    .map((color) => ({ src: color.color_image, colorCode: color.color_code, colorName: color.color_name }))
    .filter((item) => item.src);

  const thumbnails = (() => {
    const combined = [];
    if (allImages.length) allImages.forEach((img) => {
      if (img && !combined.find((item) => item.src === img)) combined.push({ src: img, type: 'product' });
    });
    if (colorImagesData.length) colorImagesData.forEach((colorImg) => {
      if (colorImg.src && !combined.find((item) => item.src === colorImg.src)) {
        combined.push({ src: colorImg.src, type: 'color', colorName: colorImg.colorName });
      }
    });
    return combined;
  })();

  const availableSizesForColor = colorSizes.filter((s) => s.color_id == selectedColorId);

  const displayPrice = (() => {
    if (selectedVariant) return selectedVariant.price;
    if (selectedColorId) {
      const variantsForColor = productVariants.filter((v) => v.color_id == selectedColorId && v.is_active);
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

  // ✅ MEMOIZED — fixes "products change when zooming" bug
  const relatedProducts = useMemo(() => {
    if (!currentProduct || allProducts.length === 0) return [];
    return [...allProducts.filter((p) => p.id !== currentProduct.id)]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
  }, [currentProduct?.id, allProducts]);

  if (loading || !router.isReady) {
    return (
      <>
        <Head>
          <title>Loading... | JAYENWARE</title>
          <meta name="theme-color" content="#1d1d1f" />
          <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js" />
        </Head>
        <main style={{ flexGrow: 1 }}>
          <SkeletonLoader />
        </main>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <Head>
          <title>Product Not Found | JAYENWARE</title>
          <meta name="theme-color" content="#1d1d1f" />
          <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        </Head>
        <main style={{ flexGrow: 1 }}>
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <i className="fa-solid fa-box-open" style={{ fontSize: '64px', color: '#e5e5e5', marginBottom: '20px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1d1d1f', marginBottom: '8px' }}>Product Not Found</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '13px' }}>The product you're looking for doesn't exist or has been removed.</p>
            <Link href="/products" style={{
              display: 'inline-block', padding: '12px 28px', background: '#1d1d1f',
              color: 'white', borderRadius: '9999px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px', textDecoration: 'none',
            }}>
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
        <meta name="description" content={(currentProduct.description || currentProduct.title || '').substring(0, 155) + '...'} />
        <meta name="theme-color" content="#1d1d1f" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="canonical" href={`https://jabiyen-website.vercel.app/product/${slug}`} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js" />
      </Head>

      <main style={{ flexGrow: 1 }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <div className="desktop-layout">
          {/* Left — Images */}
          <div className="desktop-image-col">
            <div className="main-image-wrapper">
              <div
                ref={heroRef}
                className="product-hero"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  ref={heroImgRef}
                  src={activeImage}
                  alt={currentProduct.title || ''}
                  draggable="false"
                  className="hero-image"
                  onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                />
              </div>
            </div>

            {thumbnails.length > 1 && (
              <div className="thumbnail-grid no-scrollbar">
                {thumbnails.map((thumb, index) => (
                  <img
                    key={index}
                    src={thumb.src}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); selectThumbnail(thumb.src); }}
                    className={`thumbnail-item${activeImage === thumb.src ? ' active' : ''}`}
                    alt={thumb.colorName || `Image ${index + 1}`}
                    loading="lazy"
                    draggable="false"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right — Info */}
          <div className="desktop-info-col">
            <div className="product-info-card">
              <div className="pills-row">
                <span className="category-pill">{currentProduct.category || 'Product'}</span>
                {currentProduct.subcategory && <span className="subcategory-pill">{currentProduct.subcategory}</span>}
              </div>

              <h1 className="title-text">{currentProduct.title || ''}</h1>

              {currentProduct.short_description && (
                <p className="short-description">{currentProduct.short_description}</p>
              )}

              <div className="price-row">
                <div className="price-group">
                  <span className="price-current">
                    {typeof displayPrice === 'string' && displayPrice.includes(' - ')
                      ? displayPrice.split(' - ').map((p) => formatMoney(p)).join(' – ')
                      : formatMoney(displayPrice)}
                  </span>
                  {displayOldPrice && <span className="price-old">{formatMoney(displayOldPrice)}</span>}
                </div>
                <button className="wishlist-btn" onClick={() => toggleWishlist(currentProduct.id)}>
                  <i className={`fa-${wishlist.includes(currentProduct.id) ? 'solid' : 'regular'} fa-heart`} />
                  <span>{wishlist.includes(currentProduct.id) ? 'Saved' : 'Save'}</span>
                </button>
              </div>

              <div className="stock-row">
                <span className="stock-dot" style={{
                  background: selectedVariant ? (isOutOfStock ? '#ef4444' : '#22c55e') : '#f59e0b',
                }} />
                <span className="stock-text" style={{
                  color: selectedVariant ? (isOutOfStock ? '#ef4444' : '#16a34a') : '#d97706',
                }}>
                  {selectedVariant ? (isOutOfStock ? 'Out of Stock' : 'In Stock') : 'Select options'}
                </span>
              </div>

              <div className="divider" />

              {productColors.length > 0 && (
                <CollapsibleSection icon="fa-palette" title="Color & Size">
                  <div style={{ padding: '10px 0 16px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <div className="section-label-row">
                        <span className="section-label">Color</span>
                        <span className="section-value">{selectedColor?.color_name || 'Select'}</span>
                      </div>
                      <div className="swatches-grid">
                        {productColors.map((color) => {
                          const hasStock = productVariants.filter((v) => v.color_id == color.id && v.is_active && v.stock > 0).length > 0;
                          const isSelected = selectedColorId === color.id;
                          return (
                            <button
                              key={color.id}
                              className={`color-swatch-btn${isSelected ? ' selected' : ''}${!hasStock ? ' disabled' : ''}`}
                              onClick={() => hasStock && selectColor(color.id)}
                              title={`${color.color_name}${!hasStock ? ' (Out of Stock)' : ''}`}
                              disabled={!hasStock}
                            >
                              <span className="swatch-color" style={{ background: color.color_code || '#ccc' }} />
                              {!hasStock && <span className="swatch-strike" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ height: '12px' }} />
                    <div style={{ marginBottom: '8px' }}>
                      <div className="section-label-row">
                        <span className="section-label">Size</span>
                        <span className="section-value">{selectedSize?.size_name || 'Select'}</span>
                      </div>
                      <div className="sizes-grid">
                        {!selectedColorId ? (
                          <p className="hint-text">Choose a color first</p>
                        ) : availableSizesForColor.length === 0 ? (
                          <p className="hint-text">No sizes available</p>
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
                              >
                                {size.size_name}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {selectedVariant && (
                      <div className="variant-info-pill">
                        {selectedVariant.sku && <><span className="pill-strong">SKU</span> <span className="pill-mono">{selectedVariant.sku}</span></>}
                        {selectedVariant.barcode && <><span className="pill-sep">|</span> <span className="pill-strong">Barcode</span> <span className="pill-mono">{selectedVariant.barcode}</span></>}
                        {selectedVariant.weight && <><span className="pill-sep">|</span> <span className="pill-strong">Weight</span> {selectedVariant.weight}g</>}
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}
            </div>

            <div id="buy-section" ref={buySectionRef} className="buy-buttons">
              <button className="btn-add" onClick={() => addToCartHandler(currentProduct.id)} disabled={isOutOfStock && selectedVariant}>
                Add to Bag
              </button>
              <button className="btn-buy" onClick={() => addToCartHandler(currentProduct.id, true)} disabled={isOutOfStock && selectedVariant}>
                Buy Now
              </button>
            </div>
          </div>

          <div className="desktop-full-width-buttons">
            {/* Specifications */}
            <CollapsibleSection icon="fa-sliders" title="Specifications">
              <div className="specs-grid">
                {currentProduct.fabric_type && (
                  <div className="detail-badge"><i className="fa-solid fa-shirt" /><div><span>Fabric</span><strong>{currentProduct.fabric_type}</strong></div></div>
                )}
                {currentProduct.gsm_type && (
                  <div className="detail-badge"><i className="fa-solid fa-weight-scale" /><div><span>GSM</span><strong>{currentProduct.gsm_type}</strong></div></div>
                )}
                {currentProduct.fit_type && (
                  <div className="detail-badge"><i className="fa-solid fa-ruler" /><div><span>Fit</span><strong>{currentProduct.fit_type}</strong></div></div>
                )}
                {currentProduct.gender && (
                  <div className="detail-badge"><i className="fa-solid fa-venus-mars" /><div><span>Gender</span><strong>{currentProduct.gender}</strong></div></div>
                )}
                {currentProduct.print_type && (
                  <div className="detail-badge"><i className="fa-solid fa-palette" /><div><span>Print</span><strong>{currentProduct.print_type}</strong></div></div>
                )}
              </div>
            </CollapsibleSection>

            {/* Description */}
            {currentProduct.description && (
              <CollapsibleSection icon="fa-align-left" title="Description">
                <div className="description-content" dangerouslySetInnerHTML={{ __html: currentProduct.description }} />
              </CollapsibleSection>
            )}

            {/* Barcode */}
            {currentProduct.barcode && (
              <CollapsibleSection icon="fa-barcode" title="Barcode"
                onToggle={(open) => { if (open && !barcodeGenerated && currentProduct.barcode) generateBarcode(currentProduct.barcode); }}
              >
                <div className="barcode-wrapper">
                  {barcodeSvg ? <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} /> : <p className="hint-text">Click to generate</p>}
                </div>
              </CollapsibleSection>
            )}

            <div style={{ height: '16px' }} />
          </div>

          {productBanners.length > 0 && (
            <div className="mobile-banner-section full-width-section">
              <BannerSection banners={productBanners} />
            </div>
          )}

          {productVideos.length > 0 && (
            <div className="mobile-video-section full-width-section">
              <VideoSection videos={productVideos} />
            </div>
          )}

          <div style={{ height: '40px' }} />
        </div>

        {/* Complete the Look — mobile-friendly */}
        {relatedProducts.length > 0 && (
          <section className="complete-look-section">
            <div className="complete-look-inner">
              <h3 className="complete-look-title">Complete the Look</h3>
              <div className="complete-look-grid">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Sticky Add Bar */}
        <div className={`sticky-add-bar${stickyVisible ? ' active' : ''}`}>
          <span className="sticky-price">{formatMoney(selectedVariant?.price || currentProduct?.price || 0)}</span>
          <button className="sticky-add-btn" onClick={() => addToCartHandler(currentProduct.id)} disabled={isOutOfStock && selectedVariant}>
            Add to Bag
          </button>
        </div>

        <style jsx global>{`
          :root {
            --primary: #1d1d1f;
            --accent: #86868b;
            --soft: #f5f5f7;
            --safe-bottom: env(safe-area-inset-bottom, 0px);
          }

          * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; margin: 0; padding: 0; }
          img { max-width: 100%; height: auto; display: block; }
          body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

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

          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

          /* Hero image — white bg */
          .product-hero {
            position: relative;
            width: 100%;
            background: #ffffff;
            height: 60vh;
            min-height: 400px;
            max-height: 600px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            cursor: zoom-in;
            touch-action: none;
          }

          .hero-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 10px 30px rgba(0,0,0,0.06));
            pointer-events: none;
            user-select: none;
            -webkit-user-select: none;
            will-change: transform;
            transform-origin: 50% 50%;
            transform: scale(1);
            transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          }

          /* Thumbnails */
          .thumbnail-grid {
            display: flex;
            flex-wrap: nowrap;
            gap: 8px;
            margin-top: 10px;
            overflow-x: auto;
            padding: 4px 0 6px;
            -webkit-overflow-scrolling: touch;
          }

          .thumbnail-item {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 8px;
            cursor: pointer;
            border: 1.5px solid transparent;
            flex-shrink: 0;
            transition: all 0.2s;
            opacity: 0.65;
            background: #ffffff;
          }

          .thumbnail-item.active {
            border-color: #1d1d1f;
            opacity: 1;
          }

          .thumbnail-item:hover {
            opacity: 1;
          }

          /* Product Info Card */
          .product-info-card {
            background: #ffffff;
            border-radius: 16px;
            padding: 18px;
            margin-bottom: 14px;
            border: 1px solid #f0f0f0;
          }

          .pills-row {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 10px;
          }

          .category-pill {
            background: #f5f5f7;
            color: #1d1d1f;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .subcategory-pill {
            background: transparent;
            color: #86868b;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 9px;
            font-weight: 500;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            border: 1px solid #e8e8e8;
          }

          .title-text {
            font-size: 20px;
            font-weight: 500;
            color: #1d1d1f;
            margin: 4px 0 6px;
            line-height: 1.3;
            letter-spacing: -0.02em;
          }

          .short-description {
            font-size: 12px;
            color: #6b7280;
            margin: 6px 0 0;
            line-height: 1.6;
          }

          .price-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-top: 14px;
          }

          .price-group {
            display: flex;
            align-items: baseline;
            gap: 8px;
            flex-wrap: nowrap;
            min-width: 0;
          }

          .price-current {
            font-size: 22px;
            font-weight: 600;
            color: #1d1d1f;
            letter-spacing: -0.02em;
            font-variant-numeric: tabular-nums;
          }

          .price-old {
            font-size: 12px;
            color: #a0a0a0;
            text-decoration: line-through;
            text-decoration-thickness: 1px;
            text-decoration-color: #c8c8c8;
            font-variant-numeric: tabular-nums;
          }

          .wishlist-btn {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 7px 12px;
            border: 1px solid #e8e8e8;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 600;
            background: #ffffff;
            cursor: pointer;
            color: #1d1d1f;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            transition: all 0.2s;
          }

          .wishlist-btn:hover { border-color: #1d1d1f; }
          .wishlist-btn i { font-size: 12px; color: #86868b; }
          .wishlist-btn i.fa-solid { color: #ef4444; }

          .stock-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 10px;
          }

          .stock-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            flex-shrink: 0;
          }

          .stock-text {
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .divider {
            height: 1px;
            background: #f0f0f0;
            margin: 14px 0;
          }

          /* Collapsible section */
          .toggle-btn {
            background: #ffffff;
            border: 1px solid #f0f0f0;
            border-radius: 10px;
            padding: 14px 16px;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            text-transform: uppercase;
            cursor: pointer;
            margin-bottom: 8px;
            transition: all 0.2s;
            text-align: left;
            color: #1d1d1f;
            font-weight: 600;
            letter-spacing: 0.08em;
          }

          .toggle-btn:hover { border-color: #d0d0d0; }
          .toggle-icon-right { transition: transform 0.3s; font-size: 11px; }

          .collapse-section {
            overflow: hidden;
            transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Section labels */
          .section-label-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .section-label {
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-size: 9px;
            color: #86868b;
          }

          .section-value {
            font-size: 11px;
            font-weight: 500;
            color: #1d1d1f;
          }

          .hint-text {
            font-size: 11px;
            color: #9ca3af;
            padding: 6px 0;
          }

          /* Color swatches */
          .swatches-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .color-swatch-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 1.5px solid #e0e0e0;
            cursor: pointer;
            transition: all 0.2s;
            padding: 3px;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            position: relative;
            outline: none;
          }

          .color-swatch-btn:hover:not(.disabled) { border-color: #1d1d1f; }

          .color-swatch-btn.selected {
            border-color: #1d1d1f;
            border-width: 2px;
          }

          .color-swatch-btn.disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          .swatch-color {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            display: block;
            box-shadow: inset 0 0 0 1px rgba(0,0,0,0.04);
          }

          .swatch-strike {
            position: absolute;
            top: 50%;
            left: -4%;
            width: 108%;
            height: 1.5px;
            background: #ef4444;
            transform: rotate(-45deg);
          }

          /* Size buttons */
          .sizes-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .size-btn {
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            padding: 8px 14px;
            font-weight: 500;
            font-size: 11px;
            background: #ffffff;
            color: #1d1d1f;
            min-width: 42px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            letter-spacing: 0.02em;
          }

          .size-btn:hover:not(.disabled) { border-color: #1d1d1f; }

          .size-btn.selected {
            background: #1d1d1f;
            color: #ffffff;
            border-color: #1d1d1f;
          }

          .size-btn.disabled {
            opacity: 0.3;
            cursor: not-allowed;
            text-decoration: line-through;
          }

          /* Variant info pill */
          .variant-info-pill {
            background: #f5f5f7;
            border-radius: 10px;
            padding: 12px 14px;
            margin-top: 14px;
            font-size: 10px;
            color: #1d1d1f;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .pill-strong { font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 9px; }
          .pill-mono { font-family: monospace; font-size: 10px; }
          .pill-sep { color: #d1d5db; }

          /* Buy buttons */
          .buy-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 14px 0 24px;
          }

          .btn-add {
            padding: 15px;
            background: #1d1d1f;
            color: #ffffff;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-add:hover:not(:disabled) { background: #333; }
          .btn-add:disabled { opacity: 0.4; cursor: not-allowed; }

          .btn-buy {
            padding: 15px;
            background: #ffffff;
            border: 1px solid #1d1d1f;
            border-radius: 10px;
            font-weight: 600;
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            cursor: pointer;
            color: #1d1d1f;
            transition: all 0.2s;
          }

          .btn-buy:hover:not(:disabled) { background: #f5f5f7; }
          .btn-buy:disabled { opacity: 0.4; cursor: not-allowed; }

          /* Specs */
          .specs-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 4px 0 16px;
          }

          .detail-badge {
            background: #ffffff;
            border: 1px solid #f0f0f0;
            border-radius: 10px;
            padding: 12px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .detail-badge i {
            font-size: 16px;
            color: #1d1d1f;
            width: 22px;
            text-align: center;
          }

          .detail-badge span {
            display: block;
            font-size: 9px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }

          .detail-badge strong {
            display: block;
            font-size: 11px;
            font-weight: 600;
            color: #1d1d1f;
            margin-top: 2px;
          }

          /* Description */
          .description-content {
            background: #ffffff;
            padding: 18px;
            border-radius: 10px;
            margin-top: 4px;
            margin-bottom: 16px;
            font-size: 12px;
            color: #4b5563;
            border: 1px solid #f0f0f0;
            line-height: 1.8;
          }

          /* Barcode */
          .barcode-wrapper {
            background: #ffffff;
            padding: 20px 12px 16px;
            border-radius: 10px;
            border: 1px solid #f0f0f0;
            margin-top: 4px;
            margin-bottom: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 90px;
            overflow-x: auto;
          }

          /* Video */
          .video-section {
            position: relative;
            width: 100%;
            margin: 20px 0;
            overflow: hidden;
            background: #000;
            aspect-ratio: 16/9;
            cursor: pointer;
            min-height: 360px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .video-section video {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .video-text-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 4;
            pointer-events: none;
            width: 90%;
            max-width: 600px;
          }

          .video-title-main {
            color: white;
            font-size: 22px;
            font-weight: 600;
            line-height: 1.2;
            margin: 0;
            text-shadow: 0 2px 12px rgba(0,0,0,0.4);
          }

          .video-subtitle-main {
            color: rgba(255,255,255,0.9);
            font-size: 12px;
            margin-top: 6px;
            text-shadow: 0 1px 6px rgba(0,0,0,0.4);
          }

          .video-link-clean {
            display: inline-block;
            margin-top: 14px;
            color: white;
            font-size: 11px;
            font-weight: 500;
            text-decoration: none;
            border-bottom: 1px solid rgba(255,255,255,0.6);
            padding-bottom: 2px;
            pointer-events: auto;
          }

          .video-play-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(0,0,0,0.3);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            opacity: 1;
            transition: opacity 0.3s;
            color: white;
            font-size: 16px;
          }

          .video-section:not(.paused) .video-play-indicator { opacity: 0; }

          .video-sound-control {
            position: absolute;
            bottom: 16px;
            right: 16px;
            z-index: 6;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .sound-btn, .play-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.2s;
          }

          .sound-btn.muted {
            background: rgba(239,68,68,0.25);
            border-color: rgba(239,68,68,0.3);
          }

          /* Banner */
          .product-banner-card {
            position: relative;
            border-radius: 14px;
            overflow: hidden;
            margin-bottom: 16px;
            background: #000;
            height: 220px;
            cursor: pointer;
          }

          .product-banner-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s;
          }

          .product-banner-card:hover img { transform: scale(1.03); }

          .banner-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.02) 100%);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 24px 22px;
          }

          .banner-title {
            color: white;
            font-size: 18px;
            margin-bottom: 4px;
            text-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-weight: 600;
          }

          .banner-subtitle {
            color: rgba(255,255,255,0.85);
            font-size: 12px;
            text-shadow: 0 1px 4px rgba(0,0,0,0.2);
          }

          .banner-link {
            color: white;
            font-size: 10px;
            margin-top: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.5);
            padding-bottom: 2px;
            width: fit-content;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          /* ============================================
             COMPLETE THE LOOK — mobile-friendly
             ============================================ */
          .complete-look-section {
            padding: 32px 16px 48px;
            border-top: 1px solid #f0f0f0;
            background: #ffffff;
          }

          .complete-look-inner {
            max-width: 1400px;
            margin: 0 auto;
          }

          .complete-look-title {
            font-size: 16px;
            font-weight: 500;
            color: #1d1d1f;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 20px;
            text-align: left;
          }

          .complete-look-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .cl-product-card {
            background: #ffffff;
            overflow: hidden;
            transition: transform 0.3s;
          }

          .cl-product-card:hover { transform: translateY(-2px); }

          .cl-product-media {
            position: relative;
            width: 100%;
            aspect-ratio: 4/5;
            background: #ffffff;
            overflow: hidden;
            border: 1px solid #f0f0f0;
          }

          .cl-product-image {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
          }

          .cl-product-card:hover .cl-product-image { transform: scale(1.04); }

          .cl-product-copy {
            padding: 10px 2px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .cl-product-title {
            font-size: 10px;
            font-weight: 500;
            color: #1d1d1f;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            line-height: 1.4;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 0;
          }

          .cl-product-price {
            font-size: 12px;
            font-weight: 600;
            color: #1d1d1f;
            font-variant-numeric: tabular-nums;
          }

          /* Sticky bar */
          .sticky-add-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(20px);
            border-top: 0.5px solid #e5e5e5;
            padding: 12px 16px calc(12px + var(--safe-bottom));
            z-index: 49;
            display: none;
            align-items: center;
            gap: 14px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
          }

          .sticky-add-bar.active { display: flex; }

          .sticky-price {
            font-size: 16px;
            font-weight: 600;
            flex-grow: 1;
            color: #1d1d1f;
          }

          .sticky-add-btn {
            padding: 12px 26px;
            background: #1d1d1f;
            color: white;
            border: none;
            border-radius: 999px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.08em;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
          }

          .sticky-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

          /* Responsive */
          @media (min-width: 640px) {
            .complete-look-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
            .cl-product-title { font-size: 11px; }
            .cl-product-price { font-size: 13px; }
          }

          @media (min-width: 768px) {
            .product-hero { height: 70vh; min-height: 500px; max-height: 800px; }
            .video-section { min-height: 480px; }
            .product-banner-card { height: 320px; }
            .title-text { font-size: 24px; }
            .price-current { font-size: 26px; }
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
              border-radius: 12px;
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
            .video-section { min-height: 560px; }
            .product-banner-card { height: 550px; }
            .complete-look-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
            .complete-look-title { font-size: 18px; margin-bottom: 24px; }
            .cl-product-title { font-size: 12px; }
            .cl-product-price { font-size: 14px; }
            .title-text { font-size: 26px; }
            .price-current { font-size: 28px; }
            .product-info-card { padding: 24px; }
            .btn-add, .btn-buy { padding: 16px; font-size: 12px; }
          }

          @media (min-width: 1280px) {
            .desktop-layout { max-width: 1400px; gap: 60px; }
          }
        `}</style>
      </main>
    </>
  );
}
