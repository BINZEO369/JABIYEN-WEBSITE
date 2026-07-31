'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// Cart state (localStorage synced)
let cart = [];
let wishlist = [];
if (typeof window !== 'undefined') {
  cart = JSON.parse(localStorage.getItem('jabiyen_cart') || '[]');
  wishlist = JSON.parse(localStorage.getItem('jabiyen_wish') || '[]');
}

function saveCart(c) {
  cart = c;
  if (typeof window !== 'undefined') {
    localStorage.setItem('jabiyen_cart', JSON.stringify(c));
  }
}

function saveWishlist(w) {
  wishlist = w;
  if (typeof window !== 'undefined') {
    localStorage.setItem('jabiyen_wish', JSON.stringify(w));
  }
}

export default function Header() {
  const [announcement, setAnnouncement] = useState(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(cart);
  const [wishlistItems, setWishlistItems] = useState(wishlist);
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const [menuRes, catRes, subRes, announcementRes] = await Promise.all([
          fetch('/api/menu-items'),
          fetch('/api/categories'),
          fetch('/api/subcategories'),
          fetch('/api/announcement')
        ]);
        if (menuRes.ok) setMenuItems(await menuRes.json());
        if (catRes.ok) setCategories(await catRes.json());
        if (subRes.ok) setSubcategories(await subRes.json());
        if (announcementRes.ok) {
          const ad = await announcementRes.json();
          setAnnouncement(ad);
          if (localStorage.getItem('jabiyen_announcement_hidden') === 'true') {
            setAnnouncementDismissed(true);
          }
        }
      } catch (e) {
        console.error('Header fetch error:', e);
      }
    }
    fetchData();
  }, []);

  // Scroll listener
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cart functions
  const addToCart = (productId, options = {}) => {
    const existing = cartItems.findIndex(item => item.product_id === productId);
    let newCart;
    if (existing > -1) {
      newCart = [...cartItems];
      newCart[existing].quantity += (options.quantity || 1);
    } else {
      newCart = [...cartItems, {
        id: Date.now(),
        product_id: productId,
        title: options.title,
        price: options.price || 0,
        img: options.img || '/logo.png',
        quantity: options.quantity || 1,
        color_name: options.color_name || null,
        size_name: options.size_name || null
      }];
    }
    setCartItems(newCart);
    saveCart(newCart);
    showToast('Added to cart');
  };

  const removeFromCart = (idx) => {
    const newCart = cartItems.filter((_, i) => i !== idx);
    setCartItems(newCart);
    saveCart(newCart);
  };

  const updateQuantity = (idx, qty) => {
    if (qty < 1) { removeFromCart(idx); return; }
    const newCart = [...cartItems];
    newCart[idx].quantity = qty;
    setCartItems(newCart);
    saveCart(newCart);
  };

  const toggleWishlist = (id) => {
    let newWishlist;
    if (wishlistItems.includes(id)) {
      newWishlist = wishlistItems.filter(x => x !== id);
    } else {
      newWishlist = [...wishlistItems, id];
    }
    setWishlistItems(newWishlist);
    saveWishlist(newWishlist);
  };

  const dismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    localStorage.setItem('jabiyen_announcement_hidden', 'true');
  };

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Build menu tree
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => (item.parent_id || null) === parentId)
      .map(item => ({ ...item, children: buildTree(items, item.id) }));
  };
  const menuTree = buildTree(menuItems);

  const getLinkUrl = (item) => {
    if (item.link) return item.link;
    const slug = item.slug || '';
    switch (item.menu_type) {
      case 'home': return '/';
      case 'products': return '/products';
      case 'category': return item.category_slug ? `/category/${item.category_slug}` : '#';
      default: return slug ? `/${slug}` : '#';
    }
  };

  return (
    <>
      {/* Announcement Bar */}
      {announcement && !announcementDismissed && (
        <div style={{
          background: announcement.bg_color || '#000',
          color: announcement.text_color || '#fff',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          top: 0, left: 0, right: 0,
          zIndex: 60,
          padding: '0 45px 0 16px'
        }}>
          {announcement.message}
          {announcement.link_url && (
            <a href={announcement.link_url} style={{ color: 'rgba(255,255,255,0.7)', marginLeft: 6 }}>{announcement.link_title}</a>
          )}
          <button onClick={dismissAnnouncement} style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5"/></svg>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: (announcement && !announcementDismissed) ? '36px' : '0',
        left: 0, right: 0,
        zIndex: 50,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(25px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
        transition: 'all 0.4s ease',
        padding: '0 16px'
      }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center h-14 lg:h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="JABIYEN" className="w-10 h-10 rounded-md" />
            <span className="font-black text-lg tracking-widest">JABIYEN</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/wishlist" className="p-2 relative">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="1.8"/></svg>
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[7px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{wishlistItems.length}</span>
              )}
            </Link>

            <button onClick={() => setCartOpen(!cartOpen)} className="p-2 relative">
              <svg width="17" height="19" viewBox="0 0 19 21" fill="none"><path d="M1 6H18V18C18 19.1046 17.1046 20 16 20H3C1.89543 20 1 19.1046 1 18V6Z" stroke="currentColor" strokeWidth="1.8"/><path d="M5 6C5 3.5 6.5 1 9.5 1C12.5 1 14 3.5 14 6" stroke="currentColor" strokeWidth="1.8"/></svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[7px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cartCount}</span>
              )}
            </button>

            <button onClick={() => setSideMenuOpen(true)} className="p-2">
              <svg width="20" height="13" viewBox="0 0 22 15" fill="none"><path d="M1 1H21M1 7.5H21M1 14H21" stroke="currentColor" strokeWidth="1.8"/></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Side Menu Overlay */}
      {sideMenuOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(12px)', zIndex: 199
        }} onClick={() => setSideMenuOpen(false)} />
      )}

      {/* Side Menu Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '400px',
        height: '100vh', background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(40px)', zIndex: 200,
        transform: sideMenuOpen ? 'translateX(0)' : 'translateX(105%)',
        transition: 'transform 0.5s ease',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <Link href="/" className="flex items-center gap-3" onClick={() => setSideMenuOpen(false)}>
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-md" />
            <span className="font-black text-base tracking-widest">JABIYEN</span>
          </Link>
          <button onClick={() => setSideMenuOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2"/></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {menuTree.map((item, i) => (
            <div key={i}>
              <Link href={getLinkUrl(item)} onClick={() => setSideMenuOpen(false)}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 4px',
                  borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '14px', fontWeight: 700 }}>
                {item.title || item.name}
              </Link>
            </div>
          ))}
          {categories.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug || cat.name.toLowerCase()}`}
              onClick={() => setSideMenuOpen(false)}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 4px',
                borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '14px', fontWeight: 700 }}>
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '420px',
          height: '100vh', background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(25px)', zIndex: 210,
          display: 'flex', flexDirection: 'column', color: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Shopping Vault</h2>
            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2"/></svg>
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Your vault is empty</p>
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: 12, marginBottom: 12
                }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <img src={item.img} alt={item.title} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: 700, fontSize: 12 }}>{item.title}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontWeight: 900, fontSize: 14 }}>৳{item.price * item.quantity}</span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button onClick={() => updateQuantity(idx, item.quantity - 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '2px 8px', cursor: 'pointer' }}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(idx, item.quantity + 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '2px 8px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(idx)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2"/></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Total</span>
              <span style={{ fontWeight: 900, fontSize: 18 }}>৳{cartTotal}</span>
            </div>
            <Link href="/checkout" style={{
              display: 'block', width: '100%', padding: 14,
              background: '#fff', color: '#000', textAlign: 'center',
              borderRadius: 14, fontWeight: 700, textTransform: 'uppercase',
              fontSize: '10px', letterSpacing: '0.08em', textDecoration: 'none'
            }}>Execute Checkout</Link>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 300,
          background: 'rgba(0,0,0,0.9)', color: '#fff',
          padding: '12px 24px', borderRadius: 20,
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase'
        }}>
          {toast}
        </div>
      )}

      {/* Expose globals */}
      <script dangerouslySetInnerHTML={{
        __html: `
          window.addToCart = (id, opts) => {
            const cart = JSON.parse(localStorage.getItem('jabiyen_cart') || '[]');
            const existing = cart.findIndex(i => i.product_id === id);
            if (existing > -1) cart[existing].quantity += (opts?.quantity || 1);
            else cart.push({ id: Date.now(), product_id: id, title: opts?.title, price: opts?.price || 0, img: opts?.img || '/logo.png', quantity: opts?.quantity || 1 });
            localStorage.setItem('jabiyen_cart', JSON.stringify(cart));
          };
        `
      }} />
    </>
  );
}
