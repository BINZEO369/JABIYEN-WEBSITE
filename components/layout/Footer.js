'use client';

import { useState, useEffect } from 'react';

export default function Footer() {
  const [footerData, setFooterData] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFooter() {
      try {
        const res = await fetch('/api/footer/complete');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFooterData(data);
      } catch (e) {
        console.error('Footer fetch error:', e);
      }
      setLoading(false);
    }
    fetchFooter();
  }, []);

  const toggleMenu = (id) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
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
    countries = [], trustBadges = [], settings = {}
  } = footerData;

  const bgColor = settings.background_color || '#0a0a0a';
  const textColor = settings.text_color || '#b0b0b0';

  let mergedContent = {};
  if (Array.isArray(content)) {
    content.forEach(item => { mergedContent = { ...mergedContent, ...item }; });
  }

  const logoUrl = mergedContent.logo_url || '';
  const brandTitle = mergedContent.title || '';
  const brandDesc = mergedContent.description || '';
  const address = mergedContent.address || '';
  const phone = mergedContent.phone || '';
  const email = mergedContent.email || '';
  const workingHours = mergedContent.working_hours || '';
  const copyright = settings.copyright_text || mergedContent.copyright_text || '© JayenWare. All Rights Reserved.';

  // Social Icons
  const getSocialIcon = (platform) => {
    const icons = {
      facebook: '<svg viewBox="0 0 24 24" fill="none"><path d="M18 2H15C13.67 2 12.4 2.53 11.46 3.46C10.53 4.4 10 5.67 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73 14.11 6.48 14.29 6.29C14.48 6.11 14.73 6 15 6H18V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>',
      instagram: '<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>',
      youtube: '<svg viewBox="0 0 24 24" fill="none"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-1.99C18.88 4 12 4 12 4s-6.88 0-9.14.46a2.78 2.78 0 00-1.94 1.99A29.94 29.94 0 001 11.68a29.94 29.94 0 00.46 5.23 2.78 2.78 0 001.94 1.99C5.12 19.36 12 19.36 12 19.36s6.88 0 9.14-.46a2.78 2.78 0 001.94-1.99A29.94 29.94 0 0023 11.68a29.94 29.94 0 00-.46-5.26z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.75 15.02L15.5 11.68L9.75 8.34V15.02Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>',
      x: '<svg viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25H21.552L14.325 10.51L22.827 21.75H16.17L10.956 14.933L4.99 21.75H1.68L9.41 12.915L1.254 2.25H8.08L12.793 8.481L18.244 2.25ZM17.083 19.77H18.916L7.084 4.126H5.117L17.083 19.77Z" fill="currentColor"/></svg>'
    };
    return icons[platform.toLowerCase()] || '';
  };

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
                {logoUrl && <img src={logoUrl} alt={brandTitle} style={{ maxWidth: 140, marginBottom: 16, filter: 'brightness(0.95)' }} className="footer-logo" />}
                {brandTitle && <h4 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', marginBottom: 8 }}>{brandTitle}</h4>}
                {brandDesc && <p style={{ fontSize: '0.75rem', opacity: 0.7, maxWidth: 320, lineHeight: 1.6 }}>{brandDesc}</p>}
              </div>

              {/* Social */}
              {socialLinks?.length > 0 && (
                <div>
                  <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 12 }}>Connect</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {socialLinks.sort((a, b) => a.sort_order - b.sort_order).map(link => (
                      <a key={link.id || link.platform_name} href={link.link_url} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: '#a0a0a0', transition: 'all 0.3s ease'
                        }}
                        className="social-icon"
                        dangerouslySetInnerHTML={{ __html: link.platform_icon ? `<img src="${link.platform_icon}" alt="${link.platform_name}" style="width:14px;height:14px"/>` : getSocialIcon(link.platform_name) }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* App Links */}
              {appLinks?.length > 0 && (
                <div>
                  <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 12 }}>Download App</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {appLinks.map(app => (
                      <div key={app.id}>
                        {app.app_store_url && <a href={app.app_store_url} target="_blank" style={{ color: '#b0b0b0', fontSize: '0.7rem', textDecoration: 'none' }}>App Store</a>}
                        {app.play_store_url && <a href={app.play_store_url} target="_blank" style={{ color: '#b0b0b0', fontSize: '0.7rem', textDecoration: 'none', marginLeft: 8 }}>Play Store</a>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Country Selector */}
              {countries?.length > 0 && (
                <div style={{ maxWidth: 240 }}>
                  <select style={{
                    width: '100%', background: 'none', color: '#b0b0b0',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    padding: '7px 0', fontSize: '0.7rem', outline: 'none', cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {countries.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(c => (
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
              {menus?.sort((a, b) => a.sort_order - b.sort_order).map((menu, idx) => {
                const menuId = `menu-${idx}`;
                const isOpen = openMenus[menuId];
                const links = menu.links || [];
                const parents = links.filter(l => !l.parent_id).sort((a, b) => a.sort_order - b.sort_order);

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
                        {parents.map(parent => {
                          const children = links.filter(l => l.parent_id === parent.id).sort((a, b) => a.sort_order - b.sort_order);
                          return (
                            <li key={parent.id} style={{ marginBottom: 8, fontSize: '0.75rem', opacity: 0.75 }}>
                              <a href={parent.link_url || '#'} style={{ color: 'inherit', textDecoration: 'none' }}>{parent.title}</a>
                              {children.length > 0 && (
                                <ul style={{ listStyle: 'none', paddingLeft: 12, marginTop: 6, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                                  {children.map(child => (
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

              {/* Trust Badges */}
              {trustBadges?.length > 0 && (
                <div>
                  <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 10 }}>Trust & Security</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {trustBadges.map(badge => (
                      <div key={badge.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: '#999', opacity: 0.6 }}>
                        {badge.badge_url && <img src={badge.badge_url} alt={badge.title} style={{ maxHeight: 18, filter: 'grayscale(100%) brightness(2)' }} />}
                        <strong>{badge.title}</strong>
                        {badge.subtitle && <span style={{ fontSize: '0.55rem', opacity: 0.5 }}>{badge.subtitle}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {certifications?.length > 0 && (
                <div>
                  <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 10 }}>Certifications</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {certifications.map(cert => (
                      <div key={cert.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: '#999', opacity: 0.6 }}>
                        {cert.badge_url && <img src={cert.badge_url} alt={cert.name} style={{ maxHeight: 18, filter: 'grayscale(100%) brightness(2)' }} />}
                        <span>{cert.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping Partners */}
              {shippingPartners?.length > 0 && (
                <div>
                  <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 10 }}>Shipping Partners</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {shippingPartners.map(ship => (
                      <div key={ship.id} title={ship.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: '#999', opacity: 0.6 }}>
                        {ship.icon_url && <img src={ship.icon_url} alt={ship.name} style={{ maxHeight: 18, filter: 'grayscale(100%) brightness(2)' }} />}
                        <span>{ship.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              {paymentMethods?.length > 0 && (
                <div>
                  <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 10 }}>Accepted Payments</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {paymentMethods.map(pm => (
                      <div key={pm.id} title={pm.name} style={{ opacity: 0.5 }}>
                        {pm.icon_url ? <img src={pm.icon_url} alt={pm.name} style={{ height: 18, filter: 'grayscale(100%) brightness(2)' }} /> : <span style={{ fontSize: '0.7rem' }}>{pm.name}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginTop: 8,
            display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            justifyContent: 'space-between', alignItems: 'center', gap: 8,
            fontSize: '0.7rem', opacity: 0.5
          }}>
            <p>Infrastructure by <a href="https://binzeo.vercel.app" target="_blank" style={{ color: '#ccc', fontWeight: 500 }}>BINZEO</a> v{settings.version || '2.8'}</p>
            <p>{copyright}</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @media (min-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 767px) {
          .footer-logo { max-width: 110px !important; }
        }
        .social-icon:hover { background: rgba(255,255,255,0.12) !important; transform: translateY(-2px); border-color: rgba(255,255,255,0.25) !important; color: #fff !important; }
      `}</style>
    </>
  );
}
