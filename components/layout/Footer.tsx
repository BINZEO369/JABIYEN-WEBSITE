'use client';

import { useState, useEffect, useRef } from 'react';
type FooterContent = { [key: string]: any; logo_url?: string; title?: string; description?: string; address?: string; phone?: string; email?: string; working_hours?: string; copyright_text?: string };
type FooterSocial = { id?: number | string; platform_name: string; link_url: string; platform_icon?: string; sort_order?: number };
type FooterLink = { id?: number | string; title?: string; url?: string; link_url?: string; parent_id?: number | string | null; sort_order?: number };
type FooterData = { content?: FooterContent[]; socialLinks?: FooterSocial[]; menus?: { id?: number | string; title?: string; sort_order?: number; links?: FooterLink[] }[]; paymentMethods?: FooterContent[]; shippingPartners?: FooterContent[]; certifications?: FooterContent[]; appLinks?: FooterContent[]; trustBadges?: FooterContent[]; settings?: FooterContent };
import { useCurrency } from '../currency/CurrencyProvider';

export default function Footer() {
  const { countries: availableCountries, selectedCountryCode, selectCountry, setAvailableCurrencies } = useCurrency();
  const [footerData, setFooterData] = useState<FooterData | null>(null);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchFooter() {
      try {
        const [res, currenciesRes] = await Promise.all([
          fetch('/api/footer/complete'),
          fetch('/api/footer/currencies').catch(() => null),
        ]);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const currencyRows = currenciesRes?.ok ? await currenciesRes.json() : [];
        setAvailableCurrencies(data.countries || [], currencyRows);
        setFooterData(data);
      } catch (e) {
        console.error('Footer fetch error:', e);
      }
      setLoading(false);
    }
    fetchFooter();
  }, [setAvailableCurrencies]);

  // Click outside + Escape to close country dropdown
  useEffect(() => {
    if (!countryOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCountryOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [countryOpen]);

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const flagEmoji = (code?: string) => {
    if (!code || code.length !== 2) return '🌐';
    try {
      return code.toUpperCase().replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
    } catch {
      return '🌐';
    }
  };

  if (loading || !footerData) {
    return (
      <footer style={{ background: '#0a0a0a', padding: '48px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#b0b0b0', fontFamily: "'Inter', sans-serif", fontSize: '0.75rem' }}>Loading...</p>
        </div>
      </footer>
    );
  }

  const {
    content = [], socialLinks = [], menus = [], paymentMethods = [],
    shippingPartners = [], certifications = [], appLinks = [],
    trustBadges = [], settings = {}
  } = footerData;

  const bgColor = settings.background_color || '#0a0a0a';
  const textColor = settings.text_color || '#b0b0b0';

  let mergedContent: FooterContent = {};
  if (Array.isArray(content)) {
    content.forEach((item) => { mergedContent = { ...mergedContent, ...item }; });
  }

  const logoUrl = mergedContent.logo_url || '';
  const brandTitle = mergedContent.title || '';
  const brandDesc = mergedContent.description || '';
  const address = mergedContent.address || '';
  const phone = mergedContent.phone || '';
  const email = mergedContent.email || '';
  const workingHours = mergedContent.working_hours || '';
  const copyright = settings.copyright_text || mergedContent.copyright_text || '© JayenWare. All Rights Reserved.';

  const localIconPath = (folder: string, name: string) => {
    const slug = String(name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
    const available = folder === 'social' ? ['facebook', 'instagram', 'youtube', 'x', 'tiktok', 'whatsapp', 'telegram', 'pinterest', 'snapchat'] : [];
    return available.includes(slug) ? `/icons/${folder}/${slug}.svg` : '';
  };

  // App badges
  type AppBadge = { id: string; icon: string; href: string; label: string };
  const appBadges: AppBadge[] = [];
  appLinks.forEach((app, i) => {
    const sharedIcon =
      app.icon_url || app.badge_url || app.image_url || app.logo_url ||
      app.app_icon_url || app.icon || app.image || app.thumbnail || app.asset_url || '';

    if (app.app_store_url || app.play_store_url) {
      if (app.app_store_url) {
        const icon = app.app_store_icon || sharedIcon;
        if (icon) appBadges.push({ id: `${app.id || i}-ios`, icon, href: app.app_store_url, label: 'App Store' });
      }
      if (app.play_store_url) {
        const icon = app.play_store_icon || sharedIcon;
        if (icon) appBadges.push({ id: `${app.id || i}-android`, icon, href: app.play_store_url, label: 'Google Play' });
      }
    } else {
      const href = app.url || app.link_url || app.store_url || app.href || '';
      if (sharedIcon && href) {
        appBadges.push({ id: String(app.id || href), icon: sharedIcon, href, label: app.title || 'Download App' });
      }
    }
  });

  // Country dropdown data
  const sortedCountries = [...(availableCountries || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const selectedCountry = sortedCountries.find((c) => c.country_code === selectedCountryCode);
  const filteredCountries = sortedCountries.filter((c) => {
    if (!countrySearch) return true;
    const q = countrySearch.toLowerCase();
    return (
      c.country_name?.toLowerCase().includes(q) ||
      c.currency_code?.toLowerCase().includes(q) ||
      c.country_code?.toLowerCase().includes(q)
    );
  });

  const hasTrustSection =
    paymentMethods.length > 0 || shippingPartners.length > 0 ||
    certifications.length > 0 || trustBadges.length > 0;

  return (
    <>
      <footer style={{
        background: `radial-gradient(ellipse 80% 200px at 50% 0%, rgba(255,255,255,0.035) 0%, transparent 70%), ${bgColor}`,
        color: textColor,
        fontFamily: "'Inter', sans-serif",
        padding: '56px 24px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        lineHeight: 1.6,
        letterSpacing: '0.01em',
      }}>
        <div style={{ width: '100%', maxWidth: 1240, margin: '0 auto' }}>

          {/* ============ MAIN GRID ============ */}
          <div className="footer-main">

            {/* ---- Brand Column ---- */}
            <div className="footer-brand">
              {logoUrl && (
                <img src={logoUrl} alt={brandTitle} className="footer-logo" style={{ maxWidth: 152, marginBottom: 18, display: 'block' }} />
              )}
              {brandTitle && (
                <h4 style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  margin: '0 0 10px',
                }}>
                  {brandTitle}
                </h4>
              )}
              {brandDesc && (
                <p style={{ fontSize: '0.78rem', opacity: 0.68, maxWidth: 340, lineHeight: 1.7, margin: '0 0 20px' }}>
                  {brandDesc}
                </p>
              )}

              {/* Social */}
              {socialLinks.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {socialLinks
                      .slice()
                      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                      .map((link) => {
                        const iconSrc = localIconPath('social', link.platform_name) || link.platform_icon || '';
                        if (!iconSrc || !link.link_url) return null;
                        return (
                          <a
                            key={link.id || link.platform_name}
                            href={link.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-icon"
                            aria-label={link.platform_name}
                            title={link.platform_name}
                          >
                            <img src={iconSrc} alt={link.platform_name} style={{ width: 18, height: 18, objectFit: 'contain' }} />
                          </a>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* App Badges */}
              {appBadges.length > 0 && (
                <div>
                  <h5 style={{
                    fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600,
                    letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8a8a8a',
                    margin: '0 0 12px',
                  }}>Download App</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {appBadges.map((badge) => (
                      <a
                        key={badge.id}
                        href={badge.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={badge.label}
                        className="app-badge"
                      >
                        <img src={badge.icon} alt={badge.label} style={{ height: 28, width: 'auto', maxWidth: 110, objectFit: 'contain', display: 'block' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ---- Menu Columns ---- */}
            {menus
              .slice()
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              .map((menu, idx) => {
                const menuId = `menu-${idx}`;
                const isOpen = !!openMenus[menuId];
                const links = menu.links || [];
                const parents = links
                  .filter((l) => !l.parent_id)
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

                return (
                  <div key={menuId} className="footer-menu-col">
                    <button
                      onClick={() => toggleMenu(menuId)}
                      className="menu-header"
                      aria-expanded={isOpen}
                    >
                      <span>{menu.title}</span>
                      <span className="menu-toggle-arrow" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                    </button>
                    <div
                      className="menu-content"
                      style={{
                        maxHeight: isOpen ? 600 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.35s ease, margin 0.35s ease',
                        marginTop: isOpen ? 10 : 0,
                      }}
                    >
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {parents.map((parent) => {
                          const children = links
                            .filter((l) => l.parent_id === parent.id)
                            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                          return (
                            <li key={parent.id} style={{ marginBottom: 10 }}>
                              <a href={parent.link_url || '#'} className="footer-link">
                                {parent.title}
                              </a>
                              {children.length > 0 && (
                                <ul style={{
                                  listStyle: 'none', paddingLeft: 10, marginTop: 8,
                                  borderLeft: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                  {children.map((child) => (
                                    <li key={child.id} style={{ marginBottom: 6 }}>
                                      <a href={child.link_url || '#'} className="footer-link footer-link-sub">
                                        {child.title}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                );
              })}

            {/* ---- Contact Column ---- */}
            <div className="footer-contact-col">
              <h5 style={{
                fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8a8a8a',
                margin: '0 0 14px',
              }}>Contact</h5>
              <div style={{ fontSize: '0.78rem', opacity: 0.78, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {address && <div style={{ lineHeight: 1.6 }}>{address}</div>}
                {phone && (
                  <div>
                    <a href={`tel:${phone}`} className="footer-link">{phone}</a>
                  </div>
                )}
                {email && (
                  <div>
                    <a href={`mailto:${email}`} className="footer-link">{email}</a>
                  </div>
                )}
                {workingHours && (
                  <div style={{ opacity: 0.7, fontSize: '0.72rem' }}>{workingHours}</div>
                )}
              </div>

              {/* Country / Currency Selector */}
              {availableCountries && availableCountries.length > 0 && (
                <div ref={countryRef} style={{ position: 'relative', marginTop: 20 }}>
                  <h5 style={{
                    fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600,
                    letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8a8a8a',
                    margin: '0 0 10px',
                  }}>Country & Currency</h5>
                  <button
                    type="button"
                    className="country-trigger"
                    onClick={() => setCountryOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={countryOpen}
                  >
                    <span style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}>
                      {flagEmoji(selectedCountry?.country_code)}
                    </span>
                    <span style={{
                      flex: 1, minWidth: 0, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontSize: '0.75rem', color: '#ddd',
                    }}>
                      {selectedCountry?.country_name || 'Select Country'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: 600 }}>
                      {selectedCountry?.currency_code || ''}
                    </span>
                    <svg
                      width="10" height="10" viewBox="0 0 24 24" fill="none"
                      style={{ flexShrink: 0, transition: 'transform 0.25s', transform: countryOpen ? 'rotate(180deg)' : 'none', opacity: 0.6 }}
                    >
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {countryOpen && (
                    <div className="country-dropdown" role="listbox">
                      <input
                        type="text"
                        className="country-search"
                        placeholder="Search country or currency…"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        autoFocus
                      />
                      <div className="country-list">
                        {filteredCountries.length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.72rem', opacity: 0.5 }}>
                            No results
                          </div>
                        ) : (
                          filteredCountries.map((c) => {
                            const isSel = c.country_code === selectedCountryCode;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                role="option"
                                aria-selected={isSel}
                                className={`country-item${isSel ? ' is-selected' : ''}`}
                                onClick={() => {
                                  selectCountry(c.country_code);
                                  setCountryOpen(false);
                                  setCountrySearch('');
                                }}
                              >
                                <span style={{ fontSize: '1rem', lineHeight: 1 }}>{flagEmoji(c.country_code)}</span>
                                <span style={{
                                  flex: 1, textAlign: 'left', overflow: 'hidden',
                                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {c.country_name}
                                </span>
                                <span style={{ fontSize: '0.65rem', opacity: 0.55, fontWeight: 600 }}>
                                  {c.currency_code}
                                </span>
                                {isSel && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: '#4ade80' }}>
                                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ============ TRUST STRIP ============ */}
          {hasTrustSection && (
            <div className="footer-trust">
              {paymentMethods.length > 0 && (
                <div className="trust-group">
                  <h5 className="trust-heading">Payment Options</h5>
                  <div className="trust-badges">
                    {paymentMethods.map((pm) =>
                      pm.icon_url ? (
                        <div key={pm.id} className="trust-badge">
                          <img src={pm.icon_url} alt="Payment" style={{ height: 22, objectFit: 'contain', display: 'block' }} />
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {shippingPartners.length > 0 && (
                <div className="trust-group">
                  <h5 className="trust-heading">Shipping Partners</h5>
                  <div className="trust-badges">
                    {shippingPartners.map((ship) =>
                      ship.icon_url ? (
                        <div key={ship.id} className="trust-badge">
                          <img src={ship.icon_url} alt="Shipping" style={{ height: 24, objectFit: 'contain', display: 'block' }} />
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {(trustBadges.length > 0 || certifications.length > 0) && (
                <div className="trust-group">
                  <h5 className="trust-heading">Certified By</h5>
                  <div className="trust-badges">
                    {trustBadges.map((badge) =>
                      badge.badge_url ? (
                        <div key={badge.id} className="trust-badge">
                          <img src={badge.badge_url} alt="Trust Badge" style={{ height: 30, objectFit: 'contain', display: 'block' }} />
                        </div>
                      ) : null
                    )}
                    {certifications.map((cert) =>
                      cert.badge_url ? (
                        <div key={cert.id} className="trust-badge">
                          <img src={cert.badge_url} alt="Certification" style={{ height: 30, objectFit: 'contain', display: 'block' }} />
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ BOTTOM BAR ============ */}
          <div className="footer-bottom">
            <p style={{ margin: 0 }}>
              Infrastructure by{' '}
              <a href="https://binzeo.vercel.app" target="_blank" rel="noopener noreferrer"
                style={{ color: '#ccc', fontWeight: 500, textDecoration: 'none' }}>
                BINZEO
              </a>{' '}
              v{settings.version || '2.8'}
            </p>
            <p style={{ margin: 0 }}>{copyright}</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* ---- Main layout ---- */
        .footer-main {
          display: flex;
          flex-wrap: wrap;
          gap: 40px;
          padding-bottom: 40px;
        }
        .footer-brand { flex: 2 1 260px; min-width: 0; }
        .footer-menu-col { flex: 1 1 150px; min-width: 0; }
        .footer-contact-col { flex: 1.5 1 240px; min-width: 0; }

        /* ---- Menu headers/links ---- */
        .menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: none;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          color: #8a8a8a;
          padding: 8px 0;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: 'Manrope', sans-serif;
          transition: color 0.2s ease;
        }
        .menu-toggle-arrow {
          font-size: 0.55rem;
          opacity: 0.5;
          transition: transform 0.3s ease;
        }
        .footer-link {
          color: inherit;
          text-decoration: none;
          font-size: 0.78rem;
          opacity: 0.78;
          transition: color 0.2s ease, opacity 0.2s ease;
          display: inline-block;
        }
        .footer-link:hover { color: #fff; opacity: 1; }
        .footer-link-sub { font-size: 0.72rem; opacity: 0.65; }
        .footer-link-sub:hover { opacity: 1; }

        /* ---- Social ---- */
        .social-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.3s ease;
        }
        .social-icon:hover {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(255,255,255,0.25) !important;
          transform: translateY(-2px);
        }

        /* ---- App badges ---- */
        .app-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #141414;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          text-decoration: none;
          transition: all 0.3s ease;
          min-height: 44px;
        }
        .app-badge:hover {
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.2) !important;
          transform: translateY(-1px);
        }

        /* ---- Country selector ---- */
        .country-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 260px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 9px 12px;
          color: #ccc;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }
        .country-trigger:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.2);
        }
        .country-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 300px;
          max-width: calc(100vw - 48px);
          background: #141414;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.7);
          overflow: hidden;
          z-index: 100;
          animation: countryIn 0.18s ease;
        }
        @keyframes countryIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .country-search {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 11px 14px;
          color: #fff;
          font-size: 0.75rem;
          outline: none;
          font-family: 'Inter', sans-serif;
        }
        .country-search::placeholder { color: rgba(255,255,255,0.35); }
        .country-list {
          max-height: 280px;
          overflow-y: auto;
          padding: 4px 0;
        }
        .country-list::-webkit-scrollbar { width: 6px; }
        .country-list::-webkit-scrollbar-track { background: transparent; }
        .country-list::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 3px;
        }
        .country-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          background: transparent;
          border: none;
          padding: 9px 14px;
          color: #ccc;
          cursor: pointer;
          font-size: 0.75rem;
          font-family: 'Inter', sans-serif;
          text-align: left;
          transition: background 0.15s ease;
        }
        .country-item:hover { background: rgba(255,255,255,0.05); }
        .country-item.is-selected {
          background: rgba(74, 222, 128, 0.08);
          color: #fff;
        }

        /* ---- Trust strip ---- */
        .footer-trust {
          display: flex;
          flex-wrap: wrap;
          gap: 36px;
          align-items: flex-start;
          padding: 26px 0;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .trust-group { min-width: 0; }
        .trust-heading {
          font-family: 'Manrope', sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8a8a8a;
          margin: 0 0 12px;
        }
        .trust-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .trust-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #141414;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        /* ---- Bottom bar ---- */
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding-top: 22px;
          margin-top: 8px;
          font-size: 0.72rem;
          opacity: 0.55;
        }

        /* ---- Desktop: menu accordion auto-open ---- */
        @media (min-width: 768px) {
          .menu-content {
            max-height: none !important;
            overflow: visible !important;
            margin-top: 14px !important;
          }
          .menu-toggle-arrow { display: none !important; }
          .menu-header {
            cursor: default !important;
            border-bottom: none !important;
            padding-bottom: 0 !important;
          }
          .menu-header:hover { color: #8a8a8a !important; }
        }

        /* ---- Responsive ---- */
        @media (max-width: 767px) {
          .footer-main { gap: 28px; }
          .footer-logo { max-width: 125px !important; }
          .footer-bottom {
            flex-direction: column !important;
            text-align: center;
            gap: 6px !important;
          }
          .country-trigger { max-width: 100%; }
          .country-dropdown {
            width: 100%;
            max-width: 100%;
            right: 0;
            left: auto;
          }
        }
      `}</style>
    </>
  );
}
