'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function createSlug(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

function getMenuLinkUrl(item) {
  if (item.link && item.link.trim() !== '') return item.link;
  const slug = item.slug || '';
  switch (item.menu_type) {
    case 'home': return '/';
    case 'products': return '/products';
    case 'category': return item.category_slug ? `/category/${item.category_slug}` : '#';
    case 'subcategory': return (item.category_slug && item.subcategory_slug) ? `/category/${item.category_slug}/${item.subcategory_slug}` : '#';
    case 'contact': return '/contact';
    case 'about': return '/about';
    case 'journal': return '/journal';
    default: return slug ? `/${slug}` : '#';
  }
}

function buildMenuTree(items, parentId = null) {
  return items
    .filter(item => (item.parent_id || null) === (parentId || null))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(item => ({ ...item, children: buildMenuTree(items, item.id) }));
}

export default function MenuDrawer({ isOpen, onClose }) {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [openSubmenus, setOpenSubmenus] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [menuRes, catRes, subRes] = await Promise.all([
          fetch('/api/menu-items'),
          fetch('/api/categories'),
          fetch('/api/subcategories')
        ]);
        if (menuRes.ok) setMenuItems(await menuRes.json());
        if (catRes.ok) setCategories(await catRes.json());
        if (subRes.ok) setSubcategories(await subRes.json());
      } catch (e) {
        console.error('Menu fetch error:', e);
      }
    }
    if (isOpen) fetchData();
  }, [isOpen]);

  const toggleSubmenu = (id) => {
    setOpenSubmenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const menuTree = buildMenuTree(menuItems);

  // Render drawer sub items
  const renderSubItems = (item, parentId) => {
    if (item.menu_type === 'category' && item.show_categories_from_db) {
      return renderCategories(parentId);
    }
    if (item.children?.length > 0) {
      return item.children.map((child, idx) => {
        const uniqueId = `${parentId}-sub-${idx}`;
        const hasGrandChildren = child.children?.length > 0;
        
        if (hasGrandChildren) {
          return (
            <div key={uniqueId}>
              <div onClick={() => toggleSubmenu(uniqueId)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', fontFamily: "'Sora', sans-serif",
                  fontSize: 12, fontWeight: 700, color: '#3a3a3c',
                  cursor: 'pointer', textDecoration: 'none'
                }}>
                <span>{child.title || child.name || ''}</span>
                <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.4 }}>
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {openSubmenus[uniqueId] && (
                <div style={{ paddingLeft: 16, borderLeft: '1.5px solid #1d1d1f', margin: '4px 0 8px 4px' }}>
                  {child.children.map(gc => (
                    <Link key={gc.id} href={getMenuLinkUrl(gc)}
                      onClick={onClose}
                      style={{ display: 'block', padding: '10px 12px', fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: '#3a3a3c', textDecoration: 'none', transition: 'all 0.2s' }}>
                      {gc.title || gc.name || ''}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }
        
        return (
          <Link key={uniqueId} href={getMenuLinkUrl(child)} onClick={onClose}
            style={{ display: 'block', padding: '10px 12px', fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: '#3a3a3c', textDecoration: 'none', transition: 'all 0.2s' }}>
            {child.title || child.name || ''}
          </Link>
        );
      });
    }
    return renderCategories(parentId);
  };

  // Render database categories
  const renderCategories = (parentId) => {
    if (!categories.length) {
      return <div style={{ padding: '10px 12px', fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: '#3a3a3c', opacity: 0.4 }}>No configuration found</div>;
    }
    
    return categories.map((cat, idx) => {
      const catSlug = cat.slug || createSlug(cat.name);
      const uniqueId = `${parentId}-cat-${idx}`;
      const subs = subcategories.filter(sub => sub.category_id === cat.id);
      
      if (subs.length > 0) {
        return (
          <div key={uniqueId}>
            <div onClick={() => toggleSubmenu(uniqueId)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', fontFamily: "'Sora', sans-serif",
                fontSize: 12, fontWeight: 700, color: '#1d1d1f',
                cursor: 'pointer', textDecoration: 'none'
              }}>
              <span>{cat.name}</span>
              <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.4 }}>
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {openSubmenus[uniqueId] && (
              <div style={{ paddingLeft: 16, borderLeft: '1.5px solid #1d1d1f', margin: '4px 0 8px 4px' }}>
                <Link href={`/category/${catSlug}`} onClick={onClose}
                  style={{ display: 'block', padding: '10px 12px', fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 900, color: '#1d1d1f', textDecoration: 'underline', textUnderlineOffset: 4 }}>
                  All {cat.name}
                </Link>
                {subs.map(sub => (
                  <Link key={sub.id} href={`/category/${catSlug}/${sub.slug || createSlug(sub.name)}`} onClick={onClose}
                    style={{ display: 'block', padding: '10px 12px', fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: '#3a3a3c', textDecoration: 'none' }}>
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      }
      
      return (
        <Link key={uniqueId} href={`/category/${catSlug}`} onClick={onClose}
          style={{ display: 'block', padding: '10px 12px', fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: '#3a3a3c', textDecoration: 'none', transition: 'all 0.2s' }}>
          {cat.name}
        </Link>
      );
    });
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setOpenSubmenus({});
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 199,
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
      }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: '100%', maxWidth: 400,
        height: '100vh', height: '100dvh',
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(40px) saturate(250%)',
        WebkitBackdropFilter: 'blur(40px) saturate(250%)',
        borderLeft: '1px solid rgba(255,255,255,0.55)',
        zIndex: 200,
        transform: isOpen ? 'translateX(0)' : 'translateX(105%)',
        visibility: isOpen ? 'visible' : 'hidden',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.03)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
          <Link href="/" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img src="/logo.png" alt="Logo" style={{ width: 40, height: 40, borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', objectFit: 'cover' }} />
            <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 900, fontSize: 'clamp(14px, 2vw, 16px)', letterSpacing: '0.1em', color: '#1d1d1f' }}>JABIYEN</span>
          </Link>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#1d1d1f' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {menuTree.map((item, index) => {
            const hasChildren = item.children?.length > 0;
            const uniqueId = `drawer-node-${index}`;
            
            if (hasChildren) {
              return (
                <div key={uniqueId}>
                  <div onClick={() => toggleSubmenu(uniqueId)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 4px', borderBottom: '1px solid rgba(0,0,0,0.04)',
                      fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700,
                      letterSpacing: '0.03em', color: '#1d1d1f', cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}>
                    <span>{item.title || item.name || ''}</span>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.4 }}>
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {openSubmenus[uniqueId] && (
                    <div style={{ paddingLeft: 16, borderLeft: '1.5px solid #1d1d1f', margin: '4px 0 8px 4px' }}>
                      {renderSubItems(item, uniqueId)}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <Link key={uniqueId} href={getMenuLinkUrl(item)} onClick={onClose}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 4px', borderBottom: '1px solid rgba(0,0,0,0.04)',
                  fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700,
                  letterSpacing: '0.03em', color: '#1d1d1f', textDecoration: 'none',
                  cursor: 'pointer', transition: 'all 0.3s ease'
                }}>
                <span>{item.title || item.name || ''}</span>
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style={{ opacity: 0.3 }}>
                  <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: 24, borderTop: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
          <Link href="/login" onClick={onClose} style={{
            display: 'block', width: '100%', padding: '14px 0',
            background: '#000', color: '#fff',
            borderRadius: 12, textAlign: 'center',
            fontFamily: "'Manrope', sans-serif", fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            fontSize: 9, textDecoration: 'none',
            transition: 'background 0.3s ease'
          }}>
            Account Architecture
          </Link>
        </div>
      </div>
    </>
  );
}
