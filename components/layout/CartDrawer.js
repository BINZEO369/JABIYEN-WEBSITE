'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './Toast';
import Link from 'next/link';

// Cart state (module-level singleton - SSR safe)
let cartData = [];
let wishlistData = [];

if (typeof window !== 'undefined') {
  try {
    cartData = JSON.parse(localStorage.getItem('jabiyen_cart') || '[]');
    wishlistData = JSON.parse(localStorage.getItem('jabiyen_wish') || '[]');
  } catch (e) {
    cartData = [];
    wishlistData = [];
  }
}

export function getCart() { return cartData; }
export function getWishlist() { return wishlistData; }

export function saveCart() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('jabiyen_cart', JSON.stringify(cartData));
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartData }));
  } catch (e) {}
}

export function saveWishlist() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('jabiyen_wish', JSON.stringify(wishlistData));
    window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: wishlistData }));
  } catch (e) {}
}

export function useCartState() {
  const [cart, setCart] = useState(cartData);
  
  useEffect(() => {
    const handler = (e) => setCart([...e.detail]);
    window.addEventListener('cartUpdated', handler);
    return () => window.removeEventListener('cartUpdated', handler);
  }, []);

  const addToCart = (productId, options = {}) => {
    const existingIndex = cartData.findIndex(item => {
      if (item.product_id !== productId) return false;
      if (options.variant_id && item.variant_id === options.variant_id) return true;
      if (!options.variant_id && !item.variant_id) {
        return item.color_id === (options.color_id || null) && 
               item.size_id === (options.size_id || null);
      }
      return false;
    });

    if (existingIndex > -1) {
      cartData[existingIndex].quantity += (options.quantity || 1);
    } else {
      cartData.push({
        id: Date.now(),
        product_id: productId,
        title: options.title,
        price: options.price || 0,
        old_price: options.old_price || null,
        img: options.color_image || options.img || '/logo.png',
        variant_id: options.variant_id || null,
        color_id: options.color_id || null,
        color_name: options.color_name || null,
        color_code: options.color_code || null,
        size_id: options.size_id || null,
        size_name: options.size_name || null,
        sku: options.sku || null,
        category: options.category || null,
        subcategory: options.subcategory || null,
        fabric_type: options.fabric_type || null,
        gsm_type: options.gsm_type || null,
        fit_type: options.fit_type || null,
        weight: options.weight || null,
        gender: options.gender || null,
        print_type: options.print_type || null,
        main_barcode: options.main_barcode || null,
        variant_barcode: options.variant_barcode || null,
        quantity: options.quantity || 1
      });
    }
    saveCart();
  };

  const removeFromCart = (index) => {
    cartData.splice(index, 1);
    saveCart();
  };

  const updateQuantity = (index, qty) => {
    if (qty < 1) {
      removeFromCart(index);
      return;
    }
    cartData[index].quantity = qty;
    saveCart();
  };

  const clearCart = () => {
    cartData = [];
    saveCart();
  };

  const toggleWishlist = (id) => {
    if (wishlistData.includes(id)) {
      wishlistData = wishlistData.filter(x => x !== id);
    } else {
      wishlistData.push(id);
    }
    saveWishlist();
  };

  const getCartSummary = () => ({
    items: cartData.map(item => ({
      ...item,
      total: item.price * (item.quantity || 1)
    })),
    subtotal: cartData.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
    total_items: cartData.reduce((sum, item) => sum + (item.quantity || 1), 0),
    item_count: cartData.length
  });

  return {
    cart,
    wishlist: wishlistData,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleWishlist,
    getCartSummary
  };
}

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, removeFromCart, updateQuantity } = useCartState();
  const { showToast } = useToast();
  const [expandedItems, setExpandedItems] = useState({});

  const toggleDetails = (idx) => {
    setExpandedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const sub = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleRemove = (idx) => {
    removeFromCart(idx);
    showToast('Removed from Bag', 'info');
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 209, opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s ease'
        }}
      />

      <div style={{
        position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: 420,
        height: '100vh', height: '100dvh',
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(25px) saturate(200%)',
        WebkitBackdropFilter: 'blur(25px) saturate(200%)',
        borderLeft: '1px solid rgba(255,255,255,0.15)',
        zIndex: 210, color: '#fff',
        transform: isOpen ? 'translateX(0)' : 'translateX(105%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: 16, borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.06)'
        }}>
          <h2 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0, fontFamily: "'Inter', sans-serif" }}>
            Shopping Vault
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Items */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <i className="fa-regular fa-bag-shopping" style={{ fontSize: 44, color: 'rgba(255,255,255,0.05)', marginBottom: 16, display: 'block' }}></i>
              <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Your Vault is Empty</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.15)', margin: 0 }}>Start shopping to fill your collection</p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const itemTotal = item.price * (item.quantity || 1);
              const hasDetails = item.fabric_type || item.fit_type || item.gsm_type || item.weight || item.gender || item.print_type || item.category || item.main_barcode;

              return (
                <div key={item.id} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: 16, padding: 12,
                  position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <img src={item.img} alt={item.title} style={{
                      width: 64, height: 64, objectFit: 'cover',
                      borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
                      flexShrink: 0, background: 'rgba(255,255,255,0.03)'
                    }} onError={(e) => e.target.src = '/logo.png'} />

                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <h4 style={{
                        fontFamily: "'Manrope', sans-serif", fontWeight: 700,
                        fontSize: 12, color: '#fff', lineHeight: 1.3,
                        letterSpacing: '-0.01em', margin: 0
                      }}>{item.title}</h4>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {item.color_name && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: 'rgba(255,255,255,0.06)', padding: '1px 10px 1px 6px',
                            borderRadius: 14, fontSize: 7, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                            color: 'rgba(255,255,255,0.65)', fontFamily: "'Sora', sans-serif",
                            border: '1px solid rgba(255,255,255,0.03)'
                          }}>
                            {item.color_code && <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color_code, border: '1px solid rgba(255,255,255,0.12)' }} />}
                            {item.color_name}
                          </span>
                        )}
                        {item.size_name && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: 'rgba(255,255,255,0.06)', padding: '1px 10px',
                            borderRadius: 14, fontSize: 7, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                            color: 'rgba(255,255,255,0.65)', fontFamily: "'Sora', sans-serif",
                            border: '1px solid rgba(255,255,255,0.03)'
                          }}>{item.size_name}</span>
                        )}
                        {item.sku && (
                          <span style={{
                            fontSize: 7, fontWeight: 600, color: 'rgba(255,255,255,0.2)',
                            letterSpacing: '0.04em', textTransform: 'uppercase',
                            background: 'rgba(255,255,255,0.02)', padding: '1px 8px',
                            borderRadius: 10, fontFamily: "'Sora', sans-serif",
                            border: '1px solid rgba(255,255,255,0.02)'
                          }}>SKU: {item.sku}</span>
                        )}
                      </div>

                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginTop: 8, flexWrap: 'wrap', gap: 4
                      }}>
                        <div>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 14, color: '#fff' }}>
                            ৳{itemTotal.toFixed(2)}
                          </span>
                          {item.old_price && (
                            <span style={{ fontSize: 9, textDecoration: 'line-through', color: 'rgba(255,255,255,0.25)', marginLeft: 6 }}>
                              ৳{(item.old_price * (item.quantity || 1)).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 2,
                          background: 'rgba(255,255,255,0.06)', borderRadius: 10,
                          padding: '1px 2px', border: '1px solid rgba(255,255,255,0.04)'
                        }}>
                          <button onClick={() => updateQuantity(idx, (item.quantity || 1) - 1)}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '2px 8px', fontSize: 13, fontWeight: 700, minWidth: 28 }}>−</button>
                          <span style={{ fontSize: 11, fontWeight: 700, minWidth: 20, textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontFamily: "'Inter', sans-serif" }}>{item.quantity || 1}</span>
                          <button onClick={() => updateQuantity(idx, (item.quantity || 1) + 1)}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '2px 8px', fontSize: 13, fontWeight: 700, minWidth: 28 }}>+</button>
                        </div>
                      </div>

                      {hasDetails && (
                        <>
                          <button onClick={() => toggleDetails(idx)} style={{
                            background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
                            cursor: 'pointer', padding: '2px 6px', fontSize: 7, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            fontFamily: "'Sora', sans-serif", marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4
                          }}>
                            Details <span style={{ fontSize: 6, transform: expandedItems[idx] ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>▼</span>
                          </button>
                          {expandedItems[idx] && (
                            <div style={{
                              display: 'flex', flexWrap: 'wrap', gap: '3px 8px',
                              padding: '6px 8px', background: 'rgba(255,255,255,0.03)',
                              borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)', marginTop: 4
                            }}>
                              {item.category && <span style={{ fontSize: 6, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.3)', fontFamily: "'Sora', sans-serif" }}>{item.category}{item.subcategory ? ` / ${item.subcategory}` : ''}</span>}
                              {item.main_barcode && <span style={{ fontSize: 6, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.3)', fontFamily: "'Sora', sans-serif" }}>Main: {item.main_barcode}</span>}
                              {item.fabric_type && <span style={{ fontSize: 6, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.3)', fontFamily: "'Sora', sans-serif" }}>Fabric: {item.fabric_type}</span>}
                              {item.fit_type && <span style={{ fontSize: 6, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.3)', fontFamily: "'Sora', sans-serif" }}>Fit: {item.fit_type}</span>}
                              {item.gsm_type && <span style={{ fontSize: 6, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.3)', fontFamily: "'Sora', sans-serif" }}>GSM: {item.gsm_type}</span>}
                              {item.weight && <span style={{ fontSize: 6, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.3)', fontFamily: "'Sora', sans-serif" }}>Weight: {item.weight}g</span>}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <button onClick={() => handleRemove(idx)} style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.12)',
                      cursor: 'pointer', padding: 4, flexShrink: 0, alignSelf: 'flex-start'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 0' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Inter', sans-serif" }}>Subtotal</span>
              <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: "'Inter', sans-serif" }}>৳{sub.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 0' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Inter', sans-serif" }}>Items</span>
              <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: "'Inter', sans-serif" }}>{totalItems}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif" }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' }}>৳{sub.toFixed(2)}</span>
            </div>
          </div>
          <Link href="/checkout" onClick={onClose} style={{
            display: 'block', width: '100%', padding: 14,
            background: '#fff', color: '#000',
            borderRadius: 14, fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            textAlign: 'center', textDecoration: 'none',
            fontFamily: "'Inter', sans-serif"
          }}>
            Execute Checkout
          </Link>
        </div>
      </div>
    </>
  );
}
