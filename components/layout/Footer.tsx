'use client';

import { useState, useEffect } from 'react';
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

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
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

  // App badge builder — সব সম্ভাব্য ইমেজ ফিল্ড চেক করে, শুধু আইকন রেন্ডার করে
  type AppBadge = { id: string; icon: string; href: string; label: string };
  const appBadges: AppBadge[] = [];
  appLinks.forEach((app, i) => {
    const sharedIcon =
      app.icon_url ||
      app.badge_url ||
      app.image_url ||
      app.logo_url ||
      app.app_icon_url ||
      app.icon ||
      app.image ||
      '';

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

  return (
    <>
      <footer style={{
        background: bgColor, color: textColor, fontFamily: "'Inter', sans-serif",
        padding: '48px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
        lineHeight: 1.5, letterSpacing: '0.01em'
      }}>
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr', gap: 24, paddingBottom: 32
          }}
            className="footer-grid"
          >
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Brand */}
              <div>
                {logoUrl && <img src={logoUrl} alt={brandTitle} style={{ maxWidth: 152, marginBottom: 16 }} className="footer-logo" />}
                {brandTitle && <h4 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', marginBottom: 8 }}>{brandTitle}</h4>}
                {brandDesc && <p style={{ fontSize: '0.75rem', opacity: 0.7, maxWidth: 320, lineHeight: 1.6 }}>{brandDesc}</p>}
              </div>

              {/* Social */}
              {socialLinks?.length > 0 && (
                <div>
                  <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 12 }}>Connect</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {[...socialLinks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((link) => (
                      <a key={link.id || link.platform_name} href={link.link_url} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: '#fff', transition: 'all 0.3s ease'
                        }}
                        className="social-icon"
                        aria-label={link.platform_name}
                        dangerouslySetInnerHTML={{ __html: `<img src="${localIconPath('social', link.platform_name) || link.platform_icon || ''}" alt="${link.platform_name}" style="width:20px;height:20px;object-fit:contain"/>` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* App Links — শুধু আইকন, কোন নাম নেই */}
              {appBadges.length > 0 && (
                <div>
                  <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 12 }}>Download App</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    {appBadges.map((badge) => (
                      <a
                        key={badge.id}
                        href={badge.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={badge.label}
                        className="app-badge"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#141414',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease',
                          minHeight: 44,
                        }}
                      >
                        <img
                          src={badge.icon}
                          alt={badge.label}
                          style={{ height: 28, width: 'auto', maxWidth: 110, objectFit: 'contain', display: 'block' }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Country Selector */}
              {availableCountries?.length > 0 && (
                <div style={{ maxWidth: 240 }}>
                  <select value={selectedCountryCode} onChange={(event) => selectCountry(event.target.value)} aria-label="Select country and currency" style={{
                    width: '100%', background: 'none', color: '#b0b0b0',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    padding: '7px 0', fontSize: '0.7rem', outline: 'none', cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {[...availableCountries].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((c) => (
                      <option key={c.id} value={c.country_code} style={{ background: '#1a1a1a', color: '#ccc' }}>
                        {c.country_name} / {c.currency_code}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Contact */}
              <div>
                <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 12 }}>Contact</h5>
                <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                  {address && <div style={{ marginBottom: 8 }}>{address}</div>}
                  {phone && <div style={{ marginBottom: 8 }}><a href={`tel:${phone}`} style={{ color: 'inherit' }}>{phone}</a></div>}
                  {email && <div style={{ marginBottom: 8 }}><a href={`mailto:${email}`} style={{ color: 'inherit' }}>{email}</a></div>}
                  {workingHours && <div>{workingHours}</div>}
                </div>
              </div>

              {/* Menus */}
              {[...menus].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((menu, idx) => {
                const menuId = `menu-${idx}`;
                const isOpen = !!openMenus[menuId];
                const links = menu.links || [];
                const parents = links.filter((l) => !l.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

                return (
                  <div key={menuId}>
                    <button
                      onClick={() => toggleMenu(menuId)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', background: 'none', border: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        color: '#8a8a8a', padding: '8px 0', fontSize: '0.7rem',
                        fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                        cursor: 'pointer', fontFamily: "'Manrope', sans-serif"
                      }}
                    >
                      {menu.title}
                      <span style={{ fontSize: '0.6rem', opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>▼</span>
                    </button>
                    <div style={{
                      maxHeight: isOpen ? 600 : 0, overflow: 'hidden',
                      transition: 'max-height 0.4s ease, margin 0.4s ease',
                      marginTop: isOpen ? 10 : 0
                    }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {parents.map((parent) => {
                          const children = links.filter((l) => l.parent_id === parent.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                          return (
                            <li key={parent.id} style={{ marginBottom: 8, fontSize: '0.75rem', opacity: 0.75 }}>
                              <a href={parent.link_url || '#'} style={{ color: 'inherit', textDecoration: 'none' }}>{parent.title}</a>
                              {children.length > 0 && (
                                <ul style={{ listStyle: 'none', paddingLeft: 12, marginTop: 6, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                                  {children.map((child) => (
                                    <li key={child.id} style={{ marginBottom: 5, fontSize: '0.7rem', opacity: 0.65 }}>
                                      <a href={child.link_url || '#'} style={{ color: 'inherit', textDecoration: 'none' }}>{child.title}</a>
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

              {/* Payment Options */}
              {paymentMethods?.length > 0 && (
                <div>
                  <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 12 }}>Payment Options</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    {paymentMethods.map((pm) => (
                      pm.icon_url ? (
                        <div key={pm.id} style={{ background: '#141414', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={pm.icon_url} alt="Payment" style={{ height: 22, objectFit: 'contain', display: 'block' }} />
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}

              {/* Certified By */}
              {(trustBadges?.length > 0 || certifications?.length > 0) && (
                <div>
                  <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 12 }}>Certified By</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {trustBadges.map((badge) => (
                      badge.badge_url ? (
                        <div key={badge.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#141414', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', width: 'fit-content' }}>
                          <img src={badge.badge_url} alt="Trust Badge" style={{ height: 32, objectFit: 'contain', display: 'block' }} />
                        </div>
                      ) : null
                    ))}
                    {certifications.map((cert) => (
                      cert.badge_url ? (
                        <div key={cert.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#141414', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', width: 'fit-content' }}>
                          <img src={cert.badge_url} alt="Certification" style={{ height: 32, objectFit: 'contain', display: 'block' }} />
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping Partners */}
              {shippingPartners?.length > 0 && (
                <div>
                  <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 12 }}>Shipping Partners</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    {shippingPartners.map((ship) => (
                      ship.icon_url ? (
                        <div key={ship.id} style={{ background: '#141414', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={ship.icon_url} alt="Shipping" style={{ height: 24, objectFit: 'contain', display: 'block' }} />
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom" style={{
            borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginTop: 8,
            display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', gap: 8,
            fontSize: '0.7rem', opacity: 0.5
          }}>
            <p style={{ margin: 0 }}>Infrastructure by <a href="https://binzeo.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: '#ccc', fontWeight: 500 }}>BINZEO</a> v{settings.version || '2.8'}</p>
            <p style={{ margin: 0 }}>{copyright}</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @media (min-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 767px) {
          .footer-logo { max-width: 125px !important; }
          .footer-bottom { flex-direction: column !important; text-align: center; }
        }
        .social-icon:hover {
          background: rgba(255,255,255,0.12) !important;
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.25) !important;
          color: #fff !important;
        }
        .app-badge:hover {
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.2) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </>
  );
}
