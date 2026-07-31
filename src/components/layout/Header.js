'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

export default function Header() {
  const { cart, wishlist, addToCart, removeFromCart, updateCartQuantity, toggleWishlist } = useApp();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Fetch announcement & menu
  useEffect(() => {
    const isDismissed = localStorage.getItem('jabiyen_announcement_hidden') === 'true';
    setAnnouncementDismissed(isDismissed);

    fetch('/api/announcement').then(r => r.json()).then(d => setAnnouncement(d)).catch(() => {});
    fetch('/api/menu-items').then(r => r.json()).then(d => setMenuItems(d || [])).catch(() => {});
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cart from localStorage
  const cartItems = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('jabiyen_cart') || '[]') : [];
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  const dismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    localStorage.setItem('jabiyen_announcement_hidden', 'true');
  };

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAddToCart = (product) => {
    const items = [...cartItems];
    const idx = items.findIndex(i => i.product_id === product.id);
    if (idx > -1) {
      items[idx].quantity += 1;
    } else {
      items.push({ product_id: product.id, title: product.title, price: product.price, img: product.img, quantity: 1 });
    }
    localStorage.setItem('jabiyen_cart', JSON.stringify(items));
    showToast('Added to bag!');
  };

  const handleRemoveFromCart = (idx) => {
    const items = [...cartItems];
    items.splice(idx, 1);
    localStorage.setItem('jabiyen_cart', JSON.stringify(items));
    setCartOpen(true); // re-render
  };

  const handleUpdateQuantity = (idx, qty) => {
    if (qty < 1) return handleRemoveFromCart(idx);
    const items = [...cartItems];
    items[idx].quantity = qty;
    localStorage.setItem('jabiyen_cart', JSON.stringify(items));
    setCartOpen(true);
  };

  return (
    <>
      {/* Announcement Bar */}
      {announcement && !announcementDismissed && (
        <div className="bg-black text-white text-center py-2 text-[10px] font-semibold uppercase tracking-wider relative">
          {announcement.message}
          {announcement.link_url && (
            <a href={announcement.link_url} className="text-white/70 underline ml-2 font-bold">{announcement.link_title || 'Learn More'}</a>
          )}
          <button onClick={dismissAnnouncement} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
            <i className="fa-solid fa-times text-xs"></i>
          </button>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm' : 'bg-white'} border-b border-gray-100`}>
        <div className="max-w-7xl mx-auto px-4 h-14 lg:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="JAYENWARE" className="w-10 h-10 lg:w-12 lg:h-12 rounded-md" />
            <span className="text-base lg:text-xl font-black tracking-widest text-[#1d1d1f]">JAYENWARE</span>
          </Link>

          {/* Icons */}
          <div className="flex items-center gap-1">
            <Link href="/wishlist" className="p-2 hover:opacity-60 transition relative">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <span className="absolute -top-0.5 -right-0.5 text-[7px] w-4 h-4 rounded-full bg-black text-white flex items-center justify-center font-bold">{wishlist?.length || 0}</span>
            </Link>

            <button onClick={() => setCartOpen(!cartOpen)} className="p-2 hover:opacity-60 transition relative">
              <svg width="17" height="19" viewBox="0 0 19 21" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 6H18V18C18 19.1046 17.1046 20 16 20H3C1.89543 20 1 19.1046 1 18V6Z"/><path d="M5 6C5 3.5 6.5 1 9.5 1C12.5 1 14 3.5 14 6"/></svg>
              <span className="absolute -top-0.5 -right-0.5 text-[7px] w-4 h-4 rounded-full bg-black text-white flex items-center justify-center font-bold">{cartCount}</span>
            </button>

            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:opacity-60 transition lg:hidden">
              <i className={`fa-solid ${menuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
            </button>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setCartOpen(false)}></div>
          <div className="absolute top-0 right-0 w-full max-w-[420px] h-full bg-[rgba(0,0,0,0.82)] backdrop-blur-xl border-l border-white/15 flex flex-col animate-slide-in">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-white">Shopping Vault</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-white"><i className="fa-solid fa-times"></i></button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="text-center py-10">
                  <i className="fa-regular fa-bag-shopping text-4xl text-white/5 mb-4 block"></i>
                  <h3 className="text-white/40 font-bold">Your Vault is Empty</h3>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={idx} className="bg-white/4 border border-white/6 rounded-2xl p-3 flex gap-3">
                    <img src={item.img || '/logo.png'} alt={item.title} className="w-16 h-16 object-cover rounded-xl" />
                    <div className="flex-grow min-w-0">
                      <h4 className="text-white font-bold text-xs">{item.title}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-white font-black text-sm">৳{(item.price * item.quantity).toFixed(2)}</span>
                        <div className="flex items-center gap-1 bg-white/6 rounded-lg px-1">
                          <button onClick={() => handleUpdateQuantity(idx, item.quantity - 1)} className="text-white/50 hover:text-white px-2">−</button>
                          <span className="text-white text-xs font-bold min-w-[20px] text-center">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(idx, item.quantity + 1)} className="text-white/50 hover:text-white px-2">+</button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveFromCart(idx)} className="text-white/10 hover:text-red-500"><i className="fa-solid fa-trash text-sm"></i></button>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-white/10">
              <div className="flex justify-between text-xs uppercase mb-1"><span className="text-white/35">Total</span><span className="text-white font-black text-lg">৳{cartTotal.toFixed(2)}</span></div>
              <Link href="/checkout" className="block w-full py-3.5 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-[10px] text-center mt-3">Execute Checkout</Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setMenuOpen(false)}></div>
          <div className="absolute top-0 right-0 w-full max-w-[400px] h-full bg-white/45 backdrop-blur-2xl border-l border-white/55 flex flex-col animate-slide-in">
            <div className="p-5 border-b border-black/5 flex justify-between items-center">
              <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
                <img src="/logo.png" alt="JAYENWARE" className="w-10 h-10 rounded-md" />
                <span className="font-black text-base tracking-widest">JAYENWARE</span>
              </Link>
              <button onClick={() => setMenuOpen(false)}><i className="fa-solid fa-times"></i></button>
            </div>
            <div className="flex-grow overflow-y-auto p-5 space-y-1">
              {menuItems.map((item, i) => (
                <Link key={i} href={item.link || '#'} className="block py-3 px-1 border-b border-black/4 font-bold text-sm hover:pl-2 transition-all" onClick={() => setMenuOpen(false)}>
                  {item.title || item.name}
                </Link>
              ))}
            </div>
            <div className="p-6 border-t border-black/5">
              <Link href="/login" className="block w-full py-3.5 bg-black text-white rounded-xl text-center font-bold uppercase tracking-widest text-[9px]" onClick={() => setMenuOpen(false)}>Account</Link>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-[110] animate-slide-in">
          <div className="bg-white/85 backdrop-blur-xl border border-white/55 shadow-2xl rounded-2xl p-3.5 flex items-center gap-3 min-w-[240px]">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white ${toast.type === 'success' ? 'bg-black' : 'bg-red-500'}`}>{toast.type === 'success' ? '✓' : '!'}</span>
            <p className="text-[10px] font-bold flex-grow">{toast.message}</p>
            <button onClick={() => setToast({ show: false })} className="text-gray-400"><i className="fa-solid fa-times text-xs"></i></button>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-slide-in { animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}
