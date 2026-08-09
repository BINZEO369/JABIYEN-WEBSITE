'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function ProductDetails() {
  const router = useRouter();
  
  // Product State
  const [currentProduct, setCurrentProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [productColors, setProductColors] = useState([]);
  const [colorSizes, setColorSizes] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [productVideos, setProductVideos] = useState([]);
  const [productBanners, setProductBanners] = useState([]);
  const [allImages, setAllImages] = useState([]);
  
  // Selection State
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [stickyBarActive, setStickyBarActive] = useState(false);
  const [barcodeGenerated, setBarcodeGenerated] = useState(false);
  const [currentVideoElement, setCurrentVideoElement] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Collapse States
  const [openSection, setOpenSection] = useState({
    specs: false,
    desc: false,
    barcode: false,
    variant: false
  });
  
  // Wishlist State
  const [wishlist, setWishlist] = useState([]);
  
  const buySectionRef = useRef(null);
  const productHeroRef = useRef(null);
  const videoRefs = useRef({});
  const barcodeSvgRef = useRef(null);
  
  const API_BASE = '/api';
  
  // API Functions
  const apiFetch = useCallback(async (endpoint) => {
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
  }, [API_BASE]);
  
  const apiPost = useCallback(async (endpoint, body) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      return await response.json();
    } catch (e) {
      console.error('API Post Error:', e);
      throw e;
    }
  }, [API_BASE]);
  
  // Get slug from URL
  const getSlugFromURL = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    let slug = path.replace(/^\/product\//, '').replace(/\/$/, '');
    slug = slug.split('?')[0].split('#')[0];
    return slug || null;
  }, []);
  
  // Generate slug
  const generateSlug = (title) => {
    if (!title) return 'product';
    return title.toLowerCase()
      .replace(/[^\w\u0980-\u09FF]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  // Get variant by color and size
  const getVariant = useCallback((colorId, sizeId) => {
    return productVariants.find(v => v.color_id == colorId && v.size_id == sizeId) || null;
  }, [productVariants]);
  
  // Select Color
  const selectColor = (colorId) => {
    setSelectedColorId(colorId);
    setSelectedSizeId(null);
    setSelectedVariant(null);
    
    const color = productColors.find(c => c.id == colorId);
    if (color && color.color_image) {
      updateMainImage(color.color_image);
    }
  };
  
  // Select Size
  const selectSize = (sizeId) => {
    setSelectedSizeId(sizeId);
    
    if (selectedColorId && sizeId) {
      const variant = getVariant(selectedColorId, sizeId);
      setSelectedVariant(variant);
    }
  };
  
  // Select Thumbnail
  const selectThumbnail = (imageSrc) => {
    updateMainImage(imageSrc);
    setIsZoomed(false);
  };
  
  // Update Main Image
  const updateMainImage = (imageSrc) => {
    const mainImg = document.getElementById('product-hero-image');
    if (mainImg) {
      mainImg.src = imageSrc;
    }
  };
  
  // Toggle Collapse
  const toggleCollapse = (sectionId) => {
    setOpenSection(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
    
    if (sectionId === 'barcode' && !barcodeGenerated && currentProduct?.barcode) {
      setTimeout(() => generateBarcode(currentProduct.barcode), 200);
    }
  };
  
  // Generate Barcode
  const generateBarcode = (barcodeText) => {
    if (!barcodeText || typeof window === 'undefined') return;
    
    const JsBarcode = window.JsBarcode;
    if (!JsBarcode) {
      const container = document.getElementById('barcode-svg-container');
      if (container) {
        container.innerHTML = '<p style="color:#9ca3af;font-size:13px;text-align:center;padding:24px;">Barcode library not available</p>';
      }
      return;
    }
    
    try {
      JsBarcode("#barcode-svg", barcodeText, {
        format: "CODE128",
        width: 1.5,
        height: 60,
        displayValue: true,
        fontSize: 12,
        margin: 8,
        background: "#ffffff",
        lineColor: "#1d1d1f"
      });
      setBarcodeGenerated(true);
    } catch(e) {
      const container = document.getElementById('barcode-svg-container');
      if (container) {
        container.innerHTML = '<p style="color:#ef4444;font-size:13px;text-align:center;padding:24px;">Failed to generate barcode</p>';
      }
    }
  };
  
  // Add to Cart Handler
  const addToCartHandler = (productId, buyNow = false) => {
    const product = allProducts.find(p => p.id == productId);
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
    
    const selectedColor = productColors.find(c => c.id == selectedColorId);
    const selectedSize = colorSizes.find(s => s.id == selectedSizeId);
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
      quantity: 1
    };
    
    // Add to cart (implement your cart logic)
    if (typeof window !== 'undefined' && window.addToCart) {
      window.addToCart(productId, productData);
    }
    
    showToast('Added to Bag! 🎉', 'success');
    
    if (buyNow) {
      router.push('/checkout');
    }
  };
  
  // Toggle Wishlist
  const toggleWishlist = (productId) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };
  
  // Show Toast
  const showToast = (message, type = 'success') => {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(message, type);
    } else {
      alert(message);
    }
  };
  
  // Zoom Handlers
  const handleZoomMove = (e) => {
    if (!productHeroRef.current) return;
    const img = productHeroRef.current.querySelector('img');
    if (!img) return;
    
    const rect = productHeroRef.current.getBoundingClientRect();
    const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) / rect.width;
    const y = ((e.clientY || e.touches?.[0]?.clientY) - rect.top) / rect.height;
    
    img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
    setIsZoomed(true);
  };
  
  const handleZoomEnd = () => {
    setIsZoomed(false);
  };
  
  // Video Handlers
  const toggleVideoSound = (videoId, event) => {
    event.stopPropagation();
    const video = document.getElementById(videoId);
    if (!video) return;
    
    video.muted = !video.muted;
    // Force re-render to update button state
    setCurrentVideoElement(prev => prev);
  };
  
  const toggleVideoPlay = (videoId, event) => {
    event.stopPropagation();
    const video = document.getElementById(videoId);
    if (!video) return;
    
    if (video.paused) {
      // Pause any other playing video
      if (currentVideoElement && currentVideoElement !== video) {
        currentVideoElement.pause();
      }
      video.play();
      setCurrentVideoElement(video);
    } else {
      video.pause();
      setCurrentVideoElement(null);
    }
  };
  
  // Get random products for "Complete the Look"
  const getRandomProducts = (currentId, count = 4) => {
    return [...allProducts.filter(p => p.id != currentId)]
      .sort(() => 0.5 - Math.random())
      .slice(0, count);
  };
  
  // Load Product Data
  const loadProductBySlug = useCallback(async (slug) => {
    try {
      const products = await apiFetch('/products');
      if (!products) throw new Error('Failed to load products');
      setAllProducts(products || []);
      
      const product = products.find(p => (p.slug || generateSlug(p.title)) === slug);
      if (!product) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }
      
      const [colors, variants, videos, banners] = await Promise.all([
        apiFetch(`/product-colors?slug=${encodeURIComponent(slug)}`),
        apiFetch(`/product-variants?slug=${encodeURIComponent(slug)}`),
        apiFetch(`/product-videos?slug=${encodeURIComponent(slug)}`),
        apiFetch(`/product-banners?slug=${encodeURIComponent(slug)}`)
      ]);
      
      setProductColors(colors || []);
      setProductVariants(variants || []);
      setProductVideos(videos || []);
      setProductBanners(banners || []);
      
      if (colors && colors.length > 0) {
        const colorIds = colors.map(c => c.id);
        const sizes = await apiFetch(`/color-sizes?ids=${colorIds.join(',')}`);
        setColorSizes(sizes || []);
      } else {
        setColorSizes([]);
      }
      
      // Update recent products
      if (typeof window !== 'undefined') {
        try {
          let recent = JSON.parse(localStorage.getItem('jayen_recent') || '[]');
          recent = [product.id.toString(), ...recent.filter(id => id != product.id)].slice(0, 8);
          localStorage.setItem('jayen_recent', JSON.stringify(recent));
        } catch(e) {}
      }
      
      setCurrentProduct(product);
      setAllImages(product.images ? product.images.split(',').filter(Boolean) : []);
      setIsLoading(false);
      
      // Update meta tags
      document.title = `${product.title || 'Product'} | JAYENWARE`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.content = (product.description || product.title || '').substring(0, 155) + '...';
      }
      
    } catch(e) {
      console.error('Error loading product:', e);
      setIsNotFound(true);
      setIsLoading(false);
    }
  }, [apiFetch]);
  
  // Initialize
  useEffect(() => {
    const slug = getSlugFromURL();
    if (!slug) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }
    loadProductBySlug(slug);
  }, [getSlugFromURL, loadProductBySlug]);
  
  // Sticky Bar Scroll Handler
  useEffect(() => {
    const handleScroll = () => {
      if (buySectionRef.current) {
        const rect = buySectionRef.current.getBoundingClientRect();
        setStickyBarActive(rect.bottom < 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Video Event Listeners
  useEffect(() => {
    if (productVideos.length === 0) return;
    
    const handleVideoEnded = (video) => {
      setCurrentVideoElement(null);
    };
    
    const videoElements = document.querySelectorAll('.video-section video');
    videoElements.forEach(video => {
      video.addEventListener('ended', () => handleVideoEnded(video));
    });
    
    return () => {
      videoElements.forEach(video => {
        video.removeEventListener('ended', () => handleVideoEnded(video));
      });
    };
  }, [productVideos, currentProduct]);
  
  // Clean duplicate footer
  useEffect(() => {
    const timer = setTimeout(() => {
      const allFooters = document.querySelectorAll('footer');
      if (allFooters.length > 1) {
        for (let i = 1; i < allFooters.length; i++) {
          allFooters[i].style.display = 'none';
        }
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentProduct]);
  
  // Render Functions
  const getStockStatus = () => {
    if (selectedVariant) {
      const isOut = selectedVariant.stock <= 0;
      return {
        color: isOut ? '#ef4444' : '#22c55e',
        text: isOut ? 'Out of Stock' : 'In Stock',
        textColor: isOut ? '#ef4444' : '#16a34a'
      };
    }
    return {
      color: '#f59e0b',
      text: 'Select options',
      textColor: '#d97706'
    };
  };
  
  const getPriceDisplay = () => {
    if (selectedVariant) {
      return {
        price: selectedVariant.price,
        oldPrice: selectedVariant.old_price
      };
    } else if (selectedColorId) {
      const variantsForColor = productVariants.filter(v => v.color_id == selectedColorId && v.is_active);
      if (variantsForColor.length > 0) {
        const minPrice = Math.min(...variantsForColor.map(v => v.price));
        const maxPrice = Math.max(...variantsForColor.map(v => v.price));
        return {
          price: minPrice === maxPrice ? minPrice : `${minPrice} - ${maxPrice}`,
          oldPrice: null
        };
      }
    }
    return {
      price: currentProduct?.price || 0,
      oldPrice: currentProduct?.old_price
    };
  };
  
  const getAvailableSizes = () => {
    if (!selectedColorId) return [];
    return colorSizes.filter(s => s.color_id == selectedColorId);
  };
  
  // Loading State
  if (isLoading) {
    return (
      <main style={{ flexGrow: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
          <div className="skeleton" style={{ width: '100%', height: '60vh', minHeight: 400, maxHeight: 600, borderRadius: 0 }} />
          <div style={{ padding: 20 }}>
            <div className="skeleton" style={{ height: 14, width: 80, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 28, width: '100%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 36, width: 120, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 16, width: 200, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <div className="skeleton" style={{ height: 40, width: 100, borderRadius: 12 }} />
              <div className="skeleton" style={{ height: 40, width: 100, borderRadius: 12 }} />
            </div>
            <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
          </div>
        </div>
      </main>
    );
  }
  
  // Not Found State
  if (isNotFound) {
    return (
      <main style={{ flexGrow: 1 }}>
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <i className="fa-solid fa-box-open" style={{ fontSize: 64, color: '#e5e5e5', marginBottom: 20, display: 'block' }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', marginBottom: 8 }}>Product Not Found</h2>
          <p style={{ color: '#6b7280', marginBottom: 28 }}>The product you're looking for doesn't exist or has been removed.</p>
          <Link href="/products" style={{
            display: 'inline-block',
            padding: '14px 36px',
            background: '#1d1d1f',
            color: 'white',
            borderRadius: 9999,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontSize: 12,
            textDecoration: 'none'
          }}>
            Browse Products
          </Link>
        </div>
      </main>
    );
  }
  
  // No Product Data
  if (!currentProduct) return null;
  
  const mainImage = allImages[0] || currentProduct.img || '/logo.png';
  const stockStatus = getStockStatus();
  const priceDisplay = getPriceDisplay();
  const availableSizes = getAvailableSizes();
  const relatedProducts = getRandomProducts(currentProduct.id, 4);
  
  return (
    <>
      <style jsx global>{`
        :root {
          --primary: #1d1d1f;
          --accent: #86868b;
          --soft: #f5f5f7;
          --blue: #007aff;
          --safe-bottom: env(safe-area-inset-bottom, 0px);
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        img { max-width: 100%; height: auto; display: block; }
        
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
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
        
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in { animation: fadeInUp 0.5s ease-out forwards; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <main style={{ flexGrow: 1 }}>
        <div className="desktop-layout" style={{ display: 'block' }}>
          {/* Left Column - Images */}
          <div className="desktop-image-col">
            <div className="main-image-wrapper">
              <div
                ref={productHeroRef}
                className={`product-hero${isZoomed ? ' zoomed' : ''}`}
                onMouseMove={handleZoomMove}
                onMouseLeave={handleZoomEnd}
                onTouchMove={(e) => { e.preventDefault(); handleZoomMove(e); }}
                onTouchEnd={handleZoomEnd}
                style={{
                  position: 'relative',
                  width: '100%',
                  background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                  height: '60vh',
                  minHeight: 400,
                  maxHeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'zoom-in',
                  transition: 'background 0.3s ease',
                  borderRadius: '24px'
                }}
              >
                <img
                  id="product-hero-image"
                  src={mainImage}
                  alt={currentProduct.title || ''}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transition: 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.08))'
                  }}
                  onError={(e) => { e.target.src = '/logo.png'; }}
                />
              </div>
            </div>
            
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="thumbnail-grid no-scrollbar" style={{
                display: 'flex',
                flexWrap: 'nowrap',
                gap: 10,
                marginTop: 12,
                overflowX: 'auto',
                padding: '4px 0 8px',
                WebkitOverflowScrolling: 'touch'
              }}>
                {allImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`thumb-${index}`}
                    className="thumbnail-item"
                    onClick={() => selectThumbnail(img)}
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: 'cover',
                      borderRadius: 14,
                      cursor: 'pointer',
                      border: `2px solid ${mainImage === img ? '#1d1d1f' : 'rgba(255,255,255,0.8)'}`,
                      flexShrink: 0,
                      transition: 'all 0.3s',
                      opacity: mainImage === img ? 1 : 0.7,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Right Column - Product Info */}
          <div className="desktop-info-col">
            <div className="product-info-card" style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(30px)',
              borderRadius: 24,
              padding: 20,
              marginBottom: 16,
              border: '1px solid rgba(0,0,0,0.04)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)'
            }}>
              <span style={{
                background: 'rgba(0,122,255,0.08)',
                color: '#007aff',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-block',
                marginBottom: 10
              }}>
                {currentProduct.category || 'Product'}
              </span>
              
              {currentProduct.subcategory && (
                <span style={{
                  background: 'rgba(134,135,139,0.08)',
                  color: '#86868b',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-block',
                  marginLeft: 8,
                  marginBottom: 10
                }}>
                  {currentProduct.subcategory}
                </span>
              )}
              
              <h1 className="title-text" style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#1d1d1f',
                marginBottom: 4,
                lineHeight: 1.2
              }}>
                {currentProduct.title || ''}
              </h1>
              
              {currentProduct.short_description && (
                <p style={{
                  fontSize: 14,
                  color: '#6b7280',
                  margin: '8px 0 0',
                  lineHeight: 1.6
                }}>
                  {currentProduct.short_description}
                </p>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginTop: 18
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: '#1d1d1f'
                  }}>
                    ৳ {priceDisplay.price}
                  </span>
                  {priceDisplay.oldPrice && (
                    <span style={{
                      fontSize: 16,
                      color: '#86868b',
                      textDecoration: 'line-through'
                    }}>
                      ৳ {priceDisplay.oldPrice}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleWishlist(currentProduct.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 16px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 9999,
                    fontSize: 10,
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    color: '#1d1d1f',
                    transition: 'all 0.3s'
                  }}
                >
                  <i
                    className={`fa-${wishlist.includes(currentProduct.id) ? 'solid' : 'regular'} fa-heart`}
                    style={{ color: wishlist.includes(currentProduct.id) ? '#ef4444' : '#86868b', fontSize: 14 }}
                  />
                  {wishlist.includes(currentProduct.id) ? 'Saved' : 'Save'}
                </button>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: stockStatus.color,
                  display: 'inline-block',
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: stockStatus.textColor
                }}>
                  {stockStatus.text}
                </span>
              </div>
              
              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '16px 0' }} />
              
              {/* Variant Options */}
              {productColors.length > 0 && (
                <>
                  <button
                    className="toggle-btn"
                    onClick={() => toggleCollapse('variant')}
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: 14,
                      padding: '18px 22px',
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      marginBottom: 10,
                      transition: 'all 0.3s',
                      textAlign: 'left'
                    }}
                  >
                    <span><i className="fa-solid fa-palette" /> &nbsp;Color & Size</span>
                    <i
                      className="fa-solid fa-chevron-down toggle-icon-right"
                      style={{
                        transition: 'transform 0.3s',
                        transform: openSection.variant ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    />
                  </button>
                  
                  <div style={{
                    maxHeight: openSection.variant ? '2000px' : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <div style={{ padding: '10px 0 16px' }}>
                      {/* Color Selection */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12
                        }}>
                          <span className="section-label" style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#86868b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3em'
                          }}>
                            Color
                          </span>
                          <span style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#1d1d1f'
                          }}>
                            {productColors.find(c => c.id == selectedColorId)?.color_name || 'Select'}
                          </span>
                        </div>
                        <div className="no-scrollbar" style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 10
                        }}>
                          {productColors.map(color => {
                            const hasStock = productVariants.filter(
                              v => v.color_id == color.id && v.is_active && v.stock > 0
                            ).length > 0;
                            
                            return (
                              <button
                                key={color.id}
                                className={`color-swatch-btn${selectedColorId === color.id ? ' selected' : ''}${!hasStock ? ' disabled' : ''}`}
                                onClick={() => hasStock && selectColor(color.id)}
                                disabled={!hasStock}
                                title={`${color.color_name}${!hasStock ? ' (Out of Stock)' : ''}`}
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  border: selectedColorId === color.id
                                    ? '2px solid #1d1d1f'
                                    : '2px solid rgba(0,0,0,0.12)',
                                  cursor: hasStock ? 'pointer' : 'not-allowed',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  position: 'relative',
                                  flexShrink: 0,
                                  background: 'rgba(255,255,255,0.6)',
                                  backdropFilter: 'blur(10px)',
                                  padding: 3,
                                  outline: 'none',
                                  boxShadow: selectedColorId === color.id
                                    ? '0 0 0 4px rgba(29,29,31,0.1), 0 4px 16px rgba(0,0,0,0.14)'
                                    : '0 2px 8px rgba(0,0,0,0.06)',
                                  opacity: hasStock ? 1 : 0.3,
                                  transform: selectedColorId === color.id ? 'scale(1.1)' : 'scale(1)'
                                }}
                              >
                                <span style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '50%',
                                  display: 'block',
                                  background: color.color_code || '#ccc',
                                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)'
                                }} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div style={{ height: 12 }} />
                      
                      {/* Size Selection */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12
                        }}>
                          <span className="section-label" style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#86868b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3em'
                          }}>
                            Size
                          </span>
                          <span style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#1d1d1f'
                          }}>
                            {colorSizes.find(s => s.id == selectedSizeId)?.size_name || 'Select'}
                          </span>
                        </div>
                        <div className="no-scrollbar" style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8
                        }}>
                          {!selectedColorId ? (
                            <p style={{
                              fontSize: 12,
                              color: '#9ca3af',
                              padding: '6px 0'
                            }}>
                              Choose a color first
                            </p>
                          ) : availableSizes.length === 0 ? (
                            <p style={{
                              fontSize: 12,
                              color: '#9ca3af',
                              padding: '6px 0'
                            }}>
                              No sizes available
                            </p>
                          ) : (
                            availableSizes.map(size => {
                              const variant = getVariant(selectedColorId, size.id);
                              const isAvailable = variant && variant.stock > 0 && variant.is_active;
                              
                              return (
                                <button
                                  key={size.id}
                                  className={`size-btn${selectedSizeId === size.id ? ' selected' : ''}${!isAvailable ? ' disabled' : ''}`}
                                  onClick={() => isAvailable && selectSize(size.id)}
                                  disabled={!isAvailable}
                                  style={{
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                                    border: selectedSizeId === size.id
                                      ? '1px solid #1d1d1f'
                                      : '1px solid rgba(0,0,0,0.08)',
                                    borderRadius: 12,
                                    padding: '10px 18px',
                                    fontWeight: 600,
                                    fontSize: 13,
                                    background: selectedSizeId === size.id
                                      ? '#1d1d1f'
                                      : 'rgba(255,255,255,0.6)',
                                    color: selectedSizeId === size.id ? 'white' : '#1d1d1f',
                                    minWidth: 48,
                                    textAlign: 'center',
                                    flexShrink: 0,
                                    boxShadow: selectedSizeId === size.id
                                      ? '0 4px 12px rgba(0,0,0,0.12)'
                                      : '0 1px 3px rgba(0,0,0,0.03)',
                                    opacity: isAvailable ? 1 : 0.3,
                                    textDecoration: !isAvailable ? 'line-through' : 'none'
                                  }}
                                >
                                  {size.size_name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                      
                      {/* Variant Info */}
                      {selectedVariant && (
                        <div style={{
                          background: 'rgba(0,0,0,0.03)',
                          borderRadius: 14,
                          padding: '14px 18px',
                          marginTop: 14,
                          fontSize: 12,
                          color: '#1d1d1f',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          flexWrap: 'wrap'
                        }}>
                          {selectedVariant.sku && (
                            <>
                              <span style={{ fontWeight: 700 }}>SKU</span>
                              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{selectedVariant.sku}</span>
                            </>
                          )}
                          {selectedVariant.barcode && (
                            <>
                              <span style={{ color: '#d1d5db', fontSize: 18, fontWeight: 300 }}>|</span>
                              <span style={{ fontWeight: 700 }}>Barcode</span>
                              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{selectedVariant.barcode}</span>
                            </>
                          )}
                          {selectedVariant.weight && (
                            <>
                              <span style={{ color: '#d1d5db', fontSize: 18, fontWeight: 300 }}>|</span>
                              <span style={{ fontWeight: 700 }}>Weight</span>
                              {selectedVariant.weight}g
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Buy Buttons */}
            <div
              id="buy-section"
              ref={buySectionRef}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                margin: '14px 0 24px'
              }}
            >
              <button
                onClick={() => addToCartHandler(currentProduct.id)}
                disabled={selectedVariant ? selectedVariant.stock <= 0 : false}
                style={{
                  padding: 18,
                  background: '#1d1d1f',
                  color: 'white',
                  border: 'none',
                  borderRadius: 16,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  letterSpacing: '0.3px',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  opacity: (selectedVariant && selectedVariant.stock <= 0) ? 0.5 : 1
                }}
              >
                Add to Bag
              </button>
              <button
                onClick={() => addToCartHandler(currentProduct.id, true)}
                disabled={selectedVariant ? selectedVariant.stock <= 0 : false}
                style={{
                  padding: 18,
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(0,0,0,0.1)',
                  borderRadius: 16,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  letterSpacing: '0.3px',
                  transition: 'all 0.3s',
                  color: '#1d1d1f',
                  opacity: (selectedVariant && selectedVariant.stock <= 0) ? 0.5 : 1
                }}
              >
                Buy Now
              </button>
            </div>
          </div>
          
          {/* Full Width Sections */}
          <div className="desktop-full-width-buttons">
            {/* Specifications */}
            <button
              className="toggle-btn"
              onClick={() => toggleCollapse('specs')}
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 14,
                padding: '18px 22px',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                textTransform: 'uppercase',
                cursor: 'pointer',
                marginBottom: 10,
                transition: 'all 0.3s',
                textAlign: 'left'
              }}
            >
              <span><i className="fa-solid fa-sliders" /> &nbsp;Specifications</span>
              <i
                className="fa-solid fa-chevron-down"
                style={{
                  transition: 'transform 0.3s',
                  transform: openSection.specs ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>
            
            <div style={{
              maxHeight: openSection.specs ? '2000px' : 0,
              overflow: 'hidden',
              transition: 'max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                margin: '4px 0 16px'
              }}>
                {currentProduct.fabric_type && (
                  <div className="detail-badge" style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <i className="fa-solid fa-shirt" style={{ fontSize: 20, color: '#1d1d1f', width: 28, textAlign: 'center' }} />
                    <div>
                      <span style={{ color: '#9ca3af', fontSize: 10 }}>Fabric</span><br />
                      <span style={{ fontWeight: 700 }}>{currentProduct.fabric_type}</span>
                    </div>
                  </div>
                )}
                
                {currentProduct.gsm_type && (
                  <div className="detail-badge" style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <i className="fa-solid fa-weight-scale" style={{ fontSize: 20, color: '#1d1d1f', width: 28, textAlign: 'center' }} />
                    <div>
                      <span style={{ color: '#9ca3af', fontSize: 10 }}>GSM</span><br />
                      <span style={{ fontWeight: 700 }}>{currentProduct.gsm_type}</span>
                    </div>
                  </div>
                )}
                
                {currentProduct.fit_type && (
                  <div className="detail-badge" style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <i className="fa-solid fa-ruler" style={{ fontSize: 20, color: '#1d1d1f', width: 28, textAlign: 'center' }} />
                    <div>
                      <span style={{ color: '#9ca3af', fontSize: 10 }}>Fit</span><br />
                      <span style={{ fontWeight: 700 }}>{currentProduct.fit_type}</span>
                    </div>
                  </div>
                )}
                
                {currentProduct.gender && (
                  <div className="detail-badge" style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <i className="fa-solid fa-venus-mars" style={{ fontSize: 20, color: '#1d1d1f', width: 28, textAlign: 'center' }} />
                    <div>
                      <span style={{ color: '#9ca3af', fontSize: 10 }}>Gender</span><br />
                      <span style={{ fontWeight: 700 }}>{currentProduct.gender}</span>
                    </div>
                  </div>
                )}
                
                {currentProduct.print_type && (
                  <div className="detail-badge" style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <i className="fa-solid fa-palette" style={{ fontSize: 20, color: '#1d1d1f', width: 28, textAlign: 'center' }} />
                    <div>
                      <span style={{ color: '#9ca3af', fontSize: 10 }}>Print</span><br />
                      <span style={{ fontWeight: 700 }}>{currentProduct.print_type}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Description */}
            {currentProduct.description && (
              <>
                <button
                  className="toggle-btn"
                  onClick={() => toggleCollapse('desc')}
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 14,
                    padding: '18px 22px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    marginBottom: 10,
                    transition: 'all 0.3s',
                    textAlign: 'left'
                  }}
                >
                  <span><i className="fa-solid fa-align-left" /> &nbsp;Description</span>
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{
                      transition: 'transform 0.3s',
                      transform: openSection.desc ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                </button>
                
                <div style={{
                  maxHeight: openSection.desc ? '2000px' : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div className="description-content" style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(10px)',
                    padding: 20,
                    borderRadius: 16,
                    marginTop: 4,
                    marginBottom: 16,
                    fontSize: 14,
                    color: '#4b5563',
                    border: '1px solid rgba(0,0,0,0.04)',
                    lineHeight: 1.8
                  }}
                    dangerouslySetInnerHTML={{ __html: currentProduct.description }}
                  />
                </div>
              </>
            )}
            
            {/* Barcode */}
            {currentProduct.barcode && (
              <>
                <button
                  className="toggle-btn"
                  onClick={() => toggleCollapse('barcode')}
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 14,
                    padding: '18px 22px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    marginBottom: 10,
                    transition: 'all 0.3s',
                    textAlign: 'left'
                  }}
                >
                  <span><i className="fa-solid fa-barcode" /> &nbsp;Barcode</span>
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{
                      transition: 'transform 0.3s',
                      transform: openSection.barcode ? 'rotate(180deg)' : 'rotate(0deg)',
                      marginLeft: 'auto'
                    }}
                  />
                </button>
                
                <div style={{
                  maxHeight: openSection.barcode ? '2000px' : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div className="barcode-wrapper" id="barcode-svg-container" style={{
                    background: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(15px)',
                    padding: '20px 12px 16px',
                    borderRadius: 18,
                    border: '1px solid rgba(0,0,0,0.06)',
                    marginTop: 4,
                    marginBottom: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 90,
                    maxWidth: '100%',
                    overflowX: 'auto'
                  }}>
                    <svg id="barcode-svg" ref={barcodeSvgRef} />
                  </div>
                </div>
              </>
            )}
            
            <div style={{ height: 16 }} />
          </div>
          
          {/* Banners */}
          {productBanners.length > 0 && (
            <div className="full-width-section" style={{ marginTop: 0 }}>
              {productBanners.map((banner, index) => {
                const hasLink = banner.click_link && banner.click_link.trim() !== '';
                const linkText = hasLink ? (() => {
                  try {
                    const url = new URL(banner.click_link);
                    return url.hostname.replace('www.', '');
                  } catch {
                    return banner.click_link.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
                  }
                })() : '';
                
                return (
                  <div
                    key={index}
                    className="product-banner-card"
                    onClick={() => hasLink && window.open(banner.click_link, '_blank')}
                    style={{
                      position: 'relative',
                      borderRadius: 24,
                      overflow: 'hidden',
                      marginBottom: 20,
                      background: '#000',
                      height: 260,
                      cursor: hasLink ? 'pointer' : 'default',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}
                  >
                    <img
                      src={banner.banner_url}
                      alt={banner.title || 'Product banner'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)'
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.02) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '32px 28px'
                    }}>
                      {banner.title && (
                        <h3 className="banner-title" style={{
                          color: 'white',
                          fontSize: 24,
                          marginBottom: 6,
                          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          fontWeight: 800
                        }}>
                          {banner.title}
                        </h3>
                      )}
                      {banner.subtitle && (
                        <p className="banner-subtitle" style={{
                          color: 'rgba(255,255,255,0.85)',
                          fontSize: 15,
                          textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          fontWeight: 400
                        }}>
                          {banner.subtitle}
                        </p>
                      )}
                      {hasLink && (
                        <span className="banner-link" style={{
                          color: 'white',
                          fontSize: 13,
                          textDecoration: 'none',
                          marginTop: 10,
                          borderBottom: '2px solid rgba(255,255,255,0.5)',
                          paddingBottom: 3,
                          transition: 'all 0.3s',
                          display: 'inline-block',
                          width: 'fit-content',
                          textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          fontWeight: 600,
                          letterSpacing: '0.1em'
                        }}>
                          {linkText} ↗
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Videos */}
          {productVideos.length > 0 && (
            <div className="full-width-section" style={{ marginTop: 40 }}>
              {productVideos.map((video, index) => {
                const videoId = `product-video-${index}`;
                const hasLink = video.click_link && video.click_link.trim() !== '';
                const linkText = hasLink ? (() => {
                  try {
                    const url = new URL(video.click_link);
                    return url.hostname.replace('www.', '');
                  } catch {
                    return video.click_link.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
                  }
                })() : '';
                
                return (
                  <div
                    key={index}
                    id={`video-section-${index}`}
                    className="video-section"
                    style={{
                      position: 'relative',
                      width: '100%',
                      margin: '20px 0',
                      borderRadius: 0,
                      overflow: 'hidden',
                      background: '#000',
                      aspectRatio: '16/9',
                      cursor: 'pointer',
                      minHeight: 360,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <video
                      id={videoId}
                      src={video.video_url}
                      playsInline
                      muted
                      loop
                      preload="auto"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onLoadedData={() => {
                        const videoElement = document.getElementById(videoId);
                        if (videoElement) {
                          videoElement.muted = true;
                          videoElement.play().catch(() => {});
                        }
                      }}
                    />
                    
                    <div className="video-text-center" style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      zIndex: 4,
                      pointerEvents: 'none',
                      width: '90%',
                      maxWidth: 600
                    }}>
                      {video.title && (
                        <h3 className="video-title-main" style={{
                          color: 'white',
                          fontSize: 28,
                          fontWeight: 700,
                          lineHeight: 1.2,
                          margin: 0,
                          textShadow: '0 2px 12px rgba(0,0,0,0.4)'
                        }}>
                          {video.title}
                        </h3>
                      )}
                      {video.subtitle && (
                        <p className="video-subtitle-main" style={{
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: 14,
                          fontWeight: 400,
                          marginTop: 8,
                          textShadow: '0 1px 6px rgba(0,0,0,0.4)'
                        }}>
                          {video.subtitle}
                        </p>
                      )}
                      {hasLink && (
                        <a
                          href={video.click_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="video-link-clean"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-block',
                            marginTop: 16,
                            color: 'white',
                            fontSize: 13,
                            fontWeight: 500,
                            textDecoration: 'none',
                            borderBottom: '1px solid rgba(255,255,255,0.6)',
                            paddingBottom: 2,
                            transition: 'all 0.3s',
                            pointerEvents: 'auto',
                            textShadow: '0 1px 6px rgba(0,0,0,0.3)'
                          }}
                        >
                          {linkText} →
                        </a>
                      )}
                    </div>
                    
                    <div className="video-sound-control" style={{
                      position: 'absolute',
                      bottom: 20,
                      right: 20,
                      zIndex: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <button
                        className="sound-btn"
                        onClick={(e) => toggleVideoSound(videoId, e)}
                        title="Toggle Sound"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.4)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}
                      >
                        <i className="fa-solid fa-volume-xmark" />
                      </button>
                      <button
                        className="sound-btn"
                        onClick={(e) => toggleVideoPlay(videoId, e)}
                        title="Play/Pause"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.4)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}
                      >
                        <i className="fa-solid fa-pause" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div style={{ height: 40 }} />
        </div>
        
        {/* Complete the Look */}
        {relatedProducts.length > 0 && (
          <div style={{
            padding: '40px 20px 60px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <h3 style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#1d1d1f',
              marginBottom: 28,
              textAlign: 'center'
            }}>
              Complete the Look
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
              maxWidth: 600,
              margin: '0 auto'
            }}>
              {relatedProducts.map(product => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug || generateSlug(product.title)}`}
                  className="product-card"
                  style={{
                    transition: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block'
                  }}
                >
                  <div style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}>
                    <div style={{ aspectRatio: '3/4', overflow: 'hidden' }}>
                      <img
                        src={product.img || '/logo.png'}
                        alt={product.title || ''}
                        className="product-image"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)'
                        }}
                        onError={(e) => { e.target.src = '/logo.png'; }}
                      />
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <p style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#86868b',
                        textTransform: 'uppercase',
                        marginBottom: 4
                      }}>
                        {product.category || ''}
                      </p>
                      <h3 style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#1d1d1f',
                        marginBottom: 6,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {product.title || ''}
                      </h3>
                      <span style={{ fontSize: 16, fontWeight: 900 }}>
                        ৳ {product.price || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Sticky Add Bar */}
        <div
          className={`sticky-add-bar${stickyBarActive ? ' active' : ''}`}
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
            display: stickyBarActive ? 'flex' : 'none',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ flexGrow: 1 }}>
            <span style={{ fontSize: 20, fontWeight: 900 }}>
              ৳ {priceDisplay.price}
            </span>
          </div>
          <button
            onClick={() => addToCartHandler(currentProduct.id)}
            disabled={selectedVariant ? selectedVariant.stock <= 0 : false}
            style={{
              padding: '14px 32px',
              background: 'rgba(29,29,31,0.9)',
              backdropFilter: 'blur(20px)',
              color: 'white',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 9999,
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              opacity: (selectedVariant && selectedVariant.stock <= 0) ? 0.5 : 1
            }}
          >
            Add to Bag
          </button>
        </div>
        
        {/* Responsive Styles */}
        <style jsx>{`
          @media (min-width: 1024px) {
            .product-hero { 
              height: auto;
              min-height: 500px;
              max-height: none;
              border-radius: 24px;
            }
            .product-hero img {
              max-height: 80vh;
            }
            
            .desktop-layout {
              display: grid !important;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              align-items: start;
              max-width: 1400px;
              margin: 0 auto;
              padding: 40px;
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
            
            .full-width-section {
              grid-column: 1 / -1;
              width: 100%;
              margin-top: 20px;
            }
            
            .desktop-full-width-buttons {
              grid-column: 1 / -1;
              width: 100%;
            }
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
