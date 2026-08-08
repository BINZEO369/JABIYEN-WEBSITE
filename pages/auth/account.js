'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';

const inputStyle = {
  width: '100%', padding: '8px 12px',
  border: '1.5px solid #e5e5ea',
  borderRadius: 8, fontFamily: "'Inter', sans-serif",
  fontSize: 14, fontWeight: 500, color: '#1d1d1f',
  outline: 'none', transition: 'border-color 0.2s ease'
};

function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateString; }
}

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    function handleResize() { setSize({ width: window.innerWidth, height: window.innerHeight }); }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
}

// ===================== JABIYEN CARD COMPONENT =====================
function JABIYENCard({ userData, fullName, username, getInitials, qrContainerRef, qrGenerated, isMobile }) {
  const cardWidth = isMobile ? 360 : 560;
  const cardHeight = isMobile ? 190 : 320;
  const headerHeight = isMobile ? 44 : 76;
  const bodyPadding = isMobile ? '12px 16px' : '22px 30px';
  const bodyHeight = isMobile ? 116 : 200;
  const footerHeight = isMobile ? 24 : 32;
  const avatarSize = isMobile ? 30 : 48;
  const avatarFontSize = isMobile ? 12 : 17;
  const avatarRadius = isMobile ? 6 : 10;
  const nameFontSize = isMobile ? 12 : 16;
  const emailFontSize = isMobile ? 9 : 11;
  const logoSize = isMobile ? 20 : 32;
  const logoRadius = isMobile ? 4 : 6;
  const brandFontSize = isMobile ? 13 : 20;
  const badgeFontSize = isMobile ? 7 : 10;
  const qrSize = isMobile ? 60 : 100;
  const qrInnerSize = isMobile ? 52 : 92;
  const labelFontSize = isMobile ? 6 : 8;
  const valueFontSize = isMobile ? 9 : 12;
  const gridGap = isMobile ? '5px 10px' : '10px 22px';
  const sectionGap = isMobile ? 14 : 28;
  const scanFontSize = isMobile ? 6 : 8;
  const footerFontSize = isMobile ? 7 : 9;
  const cardMargin = isMobile ? '6px' : '12px';
  const borderRadius = isMobile ? 12 : 16;
  const qrBorderRadius = isMobile ? 6 : 10;
  const qrPadding = isMobile ? 3 : 4;

  return (
    <div style={{
      width: cardWidth,
      minWidth: cardWidth,
      maxWidth: cardWidth,
      height: cardHeight,
      minHeight: cardHeight,
      maxHeight: cardHeight,
      background: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: borderRadius,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      boxSizing: 'border-box',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
      margin: cardMargin
    }}>
      {/* ===== TOP DARK HEADER ===== */}
      <div style={{
        width: '100%',
        height: headerHeight,
        background: '#0f0f0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 14px' : '0 30px',
        boxSizing: 'border-box',
        borderRadius: `${borderRadius}px ${borderRadius}px 0 0`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 7 : 12 }}>
          <img 
            src="/logo.png" 
            alt="J" 
            style={{ width: logoSize, height: logoSize, borderRadius: logoRadius, flexShrink: 0 }}
            crossOrigin="anonymous"
          />
          <span style={{ 
            color: '#ffffff', fontWeight: 800, fontSize: brandFontSize, 
            fontFamily: "'Manrope', sans-serif", letterSpacing: '-0.5px', lineHeight: 1
          }}>JABIYEN</span>
        </div>
        <span style={{ 
          color: 'rgba(255,255,255,0.6)', fontSize: badgeFontSize, fontWeight: 600, 
          textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1
        }}>Digital Auth Card</span>
      </div>

      {/* ===== WHITE BODY ===== */}
      <div style={{ padding: bodyPadding, height: bodyHeight, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* User Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, paddingBottom: isMobile ? 10 : 18, borderBottom: '1px solid #e5e5ea' }}>
          <div style={{
            width: avatarSize, height: avatarSize, minWidth: avatarSize, minHeight: avatarSize,
            background: '#0f0f0f', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: avatarFontSize, fontWeight: 700, flexShrink: 0, fontFamily: "'Manrope', sans-serif", borderRadius: avatarRadius
          }}>{getInitials()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: nameFontSize, fontWeight: 700, color: '#0f0f0f', fontFamily: "'Manrope', sans-serif", lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</div>
            <div style={{ fontSize: emailFontSize, color: '#71717a', marginTop: 2, fontFamily: "'Inter', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userData?.email || '—'}</div>
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'flex', gap: sectionGap, alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: gridGap, flex: 1, minWidth: 0 }}>
            {userData?.phone && <div style={{ minWidth: 0 }}><div style={{ ...lbl, fontSize: labelFontSize }}>Phone</div><div style={{ ...val, fontSize: valueFontSize }}>{userData.phone}</div></div>}
            {(userData?.city || userData?.state) && <div style={{ minWidth: 0 }}><div style={{ ...lbl, fontSize: labelFontSize }}>Location</div><div style={{ ...val, fontSize: valueFontSize }}>{[userData.city, userData.state].filter(Boolean).join(', ')}</div></div>}
            {userData?.country && <div style={{ minWidth: 0 }}><div style={{ ...lbl, fontSize: labelFontSize }}>Country</div><div style={{ ...val, fontSize: valueFontSize }}>{userData.country}</div></div>}
            <div style={{ minWidth: 0 }}><div style={{ ...lbl, fontSize: labelFontSize }}>Member Since</div><div style={{ ...val, fontSize: valueFontSize }}>{formatDate(userData?.created_at)}</div></div>
          </div>
          {/* QR Code Container */}
          <div style={{
            width: qrSize, height: qrSize, minWidth: qrSize, minHeight: qrSize,
            background: '#ffffff', border: '1px solid #d4d4d8',
            borderRadius: qrBorderRadius, display: 'flex', alignItems: 'center', 
            justifyContent: 'center', flexShrink: 0, padding: qrPadding, boxSizing: 'border-box'
          }}>
            <div ref={qrContainerRef} style={{ 
              width: qrInnerSize, height: qrInnerSize,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {!qrGenerated && <div style={{ width: isMobile ? 16 : 22, height: isMobile ? 16 : 22, border: '2px solid #e5e5ea', borderTopColor: '#0f0f0f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: scanFontSize, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>Scan to Authenticate</span>
        </div>
      </div>

      {/* ===== BOTTOM STRIP ===== */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: footerHeight, background: '#fafafa', borderTop: '1px solid #e5e5ea', borderRadius: `0 0 ${borderRadius}px ${borderRadius}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 14px' : '0 30px', boxSizing: 'border-box' }}>
        <span style={{ fontSize: footerFontSize, color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.03em', lineHeight: 1 }}>JABIYEN CARD AUTH &copy; {new Date().getFullYear()}</span>
        <span style={{ fontSize: footerFontSize, color: '#a1a1aa', fontWeight: 600, fontFamily: 'monospace', lineHeight: 1 }}>@{username}</span>
      </div>
    </div>
  );
}

const lbl = { fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a1a1aa', marginBottom: 2, fontFamily: "'Inter', sans-serif", lineHeight: 1.2 };
const val = { fontWeight: 500, color: '#0f0f0f', fontFamily: "'Inter', sans-serif", lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

// ===================== MAIN ACCOUNT PAGE =====================
export default function Account() {
  const router = useRouter();
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth > 0 && windowWidth < 640;
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPanel, setCurrentPanel] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [qrPassword, setQrPassword] = useState('');
  const [qrVerifying, setQrVerifying] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [cardImageUrl, setCardImageUrl] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const qrContainerRef = useRef(null);
  const cardRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getToken = () => {
    try {
      const stored = localStorage.getItem('jayenware_session');
      if (stored) { const p = JSON.parse(stored); return p.access_token || null; }
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash?.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1));
          const at = params.get('access_token');
          if (at) { localStorage.setItem('jayenware_session', JSON.stringify({ access_token: at, refresh_token: params.get('refresh_token'), expires_at: params.get('expires_at') })); window.history.replaceState(null, '', window.location.pathname); return at; }
        }
      }
    } catch (e) {}
    return null;
  };

  const fetchUserData = useCallback(async () => {
    const token = getToken();
    if (!token) { setError('Please sign in to view your account.'); setLoading(false); return; }
    try {
      const res = await fetch('/api/user/profile', { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        if (res.status === 401) { localStorage.removeItem('jayenware_session'); setError('Session expired. Please sign in again.'); setLoading(false); return; }
        throw new Error('Failed to load');
      }
      const result = await res.json();
      const profile = result.profile || {}, user = result.user || {}, metadata = user.user_metadata || {}, appMetadata = user.app_metadata || {};
      setUserData({
        email: user.email || profile.email || '', first_name: profile.first_name || metadata.first_name || metadata.full_name?.split(' ')[0] || '',
        last_name: profile.last_name || metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || '',
        phone: profile.phone || metadata.phone || '', avatar_url: metadata.avatar_url || metadata.picture || '',
        provider: profile.provider || appMetadata.provider || 'email', address_line1: profile.address_line1 || metadata.address_line1 || '',
        address_line2: profile.address_line2 || metadata.address_line2 || '', city: profile.city || metadata.city || '',
        state: profile.state || metadata.state || '', postal_code: profile.postal_code || metadata.postal_code || '',
        country: profile.country || metadata.country || '', created_at: profile.created_at || user.created_at || '', updated_at: profile.updated_at || user.updated_at || ''
      });
    } catch (e) { setError('Failed to load account data.'); }
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchUserData();
    if (typeof window !== 'undefined') {
      if (!window.QRCode) { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'; s.async = true; document.head.appendChild(s); }
      if (!window.html2canvas) { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'; s.async = true; document.head.appendChild(s); }
    }
  }, [fetchUserData]);

  const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {} localStorage.removeItem('jayenware_session'); router.push('/'); };
  const saveProfile = async () => { setSaving(true); const token = getToken(); try { const res = await fetch('/api/user/profile', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ first_name: userData.first_name, last_name: userData.last_name, phone: userData.phone }) }); if (!res.ok) throw new Error(); showToast('Profile updated successfully!'); setIsEditingProfile(false); } catch (e) { showToast('Failed to update profile', 'error'); } setSaving(false); };
  const saveAddress = async () => { setSaving(true); const token = getToken(); try { const res = await fetch('/api/user/profile', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ address_line1: userData.address_line1, address_line2: userData.address_line2, city: userData.city, state: userData.state, postal_code: userData.postal_code, country: userData.country }) }); if (!res.ok) throw new Error(); showToast('Address updated successfully!'); setIsEditingAddress(false); } catch (e) { showToast('Failed to update address', 'error'); } setSaving(false); };
  const updateField = (f, v) => { setUserData(prev => ({ ...prev, [f]: v })); };
  const getInitials = () => { const f = userData?.first_name?.charAt(0) || '', l = userData?.last_name?.charAt(0) || ''; const i = (f + l).toUpperCase(); return i || userData?.email?.charAt(0).toUpperCase() || 'U'; };
  const fullName = `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || userData?.email?.split('@')[0] || 'User';
  const username = userData?.email?.split('@')[0] || 'user';

  const verifyPasswordForQR = async () => {
    if (!qrPassword) { setQrError('Please enter your password'); showToast('Please enter your password', 'error'); return; }
    setQrVerifying(true); setQrError(null);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userData.email, password: qrPassword }) });
      const result = await res.json();
      if (!res.ok) { setQrError('Invalid password. Please try again.'); showToast('Password verification failed', 'error'); setQrVerifying(false); return; }
      setQrVerified(true); generateQRCode(); showToast('Card generated successfully!', 'success');
    } catch (err) { setQrError('Verification failed. Please try again.'); showToast('Verification failed', 'error'); }
    finally { setQrVerifying(false); }
  };

  const generateQRCode = () => {
    const qrData = JSON.stringify({ email: userData.email, password: qrPassword });
    if (qrContainerRef.current) qrContainerRef.current.innerHTML = '';
    const qrInner = isMobile ? 52 : 92;
    setTimeout(() => {
      if (qrContainerRef.current && window.QRCode) {
        new window.QRCode(qrContainerRef.current, { text: qrData, width: qrInner, height: qrInner, colorDark: '#000000', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.H : 2 });
        setTimeout(() => { setQrGenerated(true); setTimeout(() => { captureCard(); }, 1200); }, 600);
      }
    }, 200);
  };

  const captureCard = async () => {
    if (!cardRef.current || !window.html2canvas) return;
    setCapturing(true);
    const cw = isMobile ? 372 : 584;
    const ch = isMobile ? 202 : 344;
    // Wait for fonts and images to load
    await new Promise(r => setTimeout(r, 500));
    try {
      const canvas = await window.html2canvas(cardRef.current, { 
        scale: 3, 
        backgroundColor: '#ffffff',
        useCORS: true, 
        allowTaint: true, 
        logging: false, 
        width: cw, 
        height: ch,
        windowWidth: cw,
        windowHeight: ch,
        onclone: (clonedDoc) => {
          // Ensure all elements in clone are visible
          const clonedElement = clonedDoc.querySelector('[data-card]');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.transition = 'none';
          }
        }
      });
      const imgUrl = canvas.toDataURL('image/png');
      setCardImageUrl(imgUrl);
      showToast('Card ready for download!', 'success');
    } catch (err) { 
      console.error('Capture error:', err); 
      showToast('Failed to capture card', 'error'); 
    }
    setCapturing(false);
  };

  const downloadCard = () => {
    if (!cardImageUrl) return;
    const link = document.createElement('a'); 
    link.download = `${username}-jabiyen-auth.png`; 
    link.href = cardImageUrl; 
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link);
    showToast('Card downloaded successfully!');
  };

  const handlePanelSwitch = (panel) => {
    setCurrentPanel(panel);
    if (panel !== 'card-auth') { setQrPassword(''); setQrVerified(false); setQrGenerated(false); setQrError(null); setCardImageUrl(null); setCapturing(false); if (qrContainerRef.current) qrContainerRef.current.innerHTML = ''; }
  };

  if (loading) return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '70px 10px 40px' : '100px 16px 48px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}><div style={{ height: 40, width: 200, background: '#f0f0f0', borderRadius: 8, margin: '0 auto', animation: 'shimmer 1.5s infinite' }} /></div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, height: 200, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '70px 10px' : '100px 16px', textAlign: 'center' }}>
      <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 48, color: '#dc2626', marginBottom: 16 }}></i>
      <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Failed to load account</h3>
      <p style={{ fontSize: 14, color: '#71717a' }}>{error}</p>
      <button onClick={() => router.push('/auth/signin')} style={{ marginTop: 16, padding: '10px 24px', background: '#0f0f0f', color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Go to Sign In</button>
    </div>
  );

  const isGoogleUser = userData.provider === 'google' || (userData.provider !== 'email' && userData.avatar_url);
  const loginMethod = userData.provider === 'google' ? 'Google' : userData.provider === 'azure' ? 'Microsoft' : userData.provider !== 'email' ? userData.provider?.charAt(0).toUpperCase() + userData.provider?.slice(1) : 'Email & Password';

  return (
    <>
      <Head><title>My Account | JAYENWARE</title><meta name="description" content="Manage your JAYENWARE account" /><meta name="robots" content="noindex, follow" /></Head>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '70px 10px 32px' : '100px 16px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 20 : 40 }}>
          <h1 style={{ fontFamily: "var(--font-heading), 'Manrope', sans-serif", fontSize: isMobile ? 22 : 'clamp(28px,4vw,40px)', fontWeight: 800, color: '#0f0f0f', margin: '0 0 4px' }}>My Account</h1>
          <p style={{ fontSize: isMobile ? 12 : 15, color: '#71717a', margin: 0 }}>Welcome back, {userData.first_name || 'User'}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 28 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: isMobile ? 8 : 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexWrap: 'wrap', gap: isMobile ? 5 : 12, justifyContent: 'center' }}>
            {[{ key: 'profile', icon: 'user', label: 'Profile' }, { key: 'addresses', icon: 'location-dot', label: 'Location' }, { key: 'card-auth', icon: 'id-card', label: isMobile ? 'Card Auth' : 'JABIYEN Card Auth' }].map(p => (
              <button key={p.key} onClick={() => handlePanelSwitch(p.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 5 : 10, padding: isMobile ? '9px 12px' : '14px 20px', borderRadius: 10, cursor: 'pointer', fontSize: isMobile ? 11 : 14, fontWeight: 600, fontFamily: "'Inter', sans-serif", border: 'none', flex: 1, minWidth: isMobile ? 70 : 140, background: currentPanel === p.key ? '#0f0f0f' : '#f5f5f7', color: currentPanel === p.key ? '#fff' : '#0f0f0f', transition: 'all 0.25s ease' }}>
                <i className={`fa-solid fa-${p.icon}`} style={{ fontSize: isMobile ? 12 : 15 }}></i>{p.label}
              </button>
            ))}
            <button onClick={() => setShowLogoutModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 5 : 10, padding: isMobile ? '9px 12px' : '14px 20px', borderRadius: 10, cursor: 'pointer', fontSize: isMobile ? 11 : 14, fontWeight: 600, fontFamily: "'Inter', sans-serif", border: 'none', flex: 1, minWidth: isMobile ? 60 : 140, background: '#fef2f2', color: '#dc2626' }}>
              <i className="fa-solid fa-right-from-bracket" style={{ fontSize: isMobile ? 12 : 15 }}></i>{isMobile ? 'Exit' : 'Sign Out'}
            </button>
          </div>

          <div style={{ minHeight: 300 }}>
            {/* ===== PROFILE & ADDRESSES PANELS (unchanged) ===== */}
            {currentPanel === 'profile' && (
              <div>
                <div style={{ background: '#fff', borderRadius: 14, padding: isMobile ? '16px 14px' : '32px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', textAlign: 'center', marginBottom: 14 }}>
                  {userData.avatar_url ? <img src={userData.avatar_url} alt={fullName} style={{ width: isMobile ? 50 : 80, height: isMobile ? 50 : 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', border: '3px solid #f0f0f0' }} /> : <div style={{ width: isMobile ? 50 : 80, height: isMobile ? 50 : 80, borderRadius: '50%', background: 'linear-gradient(135deg,#007aff,#5856d6)', color: '#fff', fontSize: isMobile ? 18 : 28, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontFamily: "'Manrope', sans-serif" }}>{getInitials()}</div>}
                  <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: isMobile ? 16 : 22, fontWeight: 700, margin: '0 0 4px' }}>{fullName}</h3>
                  <p style={{ fontSize: isMobile ? 11 : 14, color: '#71717a', margin: 0, wordBreak: 'break-all' }}>{userData.email}</p>
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, background: isGoogleUser ? '#e8f0fe' : '#f5f5f7', padding: '3px 8px', borderRadius: 50, fontSize: isMobile ? 9 : 11, fontWeight: 600, color: '#71717a' }}>
                    {isGoogleUser ? <svg width="12" height="12" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> : <i className="fa-solid fa-envelope" style={{ fontSize: 10 }}></i>}{loginMethod}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 14, padding: isMobile ? 14 : 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 12 : 20 }}><h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: isMobile ? 14 : 18, fontWeight: 700, margin: 0 }}>Personal Information</h2>{!isEditingProfile ? <button onClick={() => setIsEditingProfile(true)} style={{ fontSize: isMobile ? 10 : 13, color: '#007aff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}><i className="fa-solid fa-pen" style={{ marginRight: 3 }}></i> Edit</button> : <div style={{ display: 'flex', gap: 6 }}><button onClick={() => setIsEditingProfile(false)} style={{ fontSize: isMobile ? 10 : 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button><button onClick={saveProfile} disabled={saving} style={{ fontSize: isMobile ? 10 : 13, color: '#fff', background: '#007aff', border: 'none', borderRadius: 50, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>{saving ? '...' : 'Save'}</button></div>}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '10px 12px' : '16px 24px' }}>{isEditingProfile ? <><InfoField l="First Name"><input style={inputStyle} value={userData.first_name} onChange={e => updateField('first_name', e.target.value)} /></InfoField><InfoField l="Last Name"><input style={inputStyle} value={userData.last_name} onChange={e => updateField('last_name', e.target.value)} /></InfoField><InfoField l="Phone"><input style={inputStyle} value={userData.phone} onChange={e => updateField('phone', e.target.value)} /></InfoField><InfoField l="Email"><input style={{ ...inputStyle, backgroundColor: '#f5f5f7', color: '#71717a' }} value={userData.email} disabled /></InfoField></> : <><InfoField l="First Name"><span>{userData.first_name || '—'}</span></InfoField><InfoField l="Last Name"><span>{userData.last_name || '—'}</span></InfoField><InfoField l="Phone"><span>{userData.phone || '—'}</span></InfoField><InfoField l="Email"><span>{userData.email || '—'}</span></InfoField></>}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 14, padding: isMobile ? 14 : 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}><h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: isMobile ? 14 : 18, fontWeight: 700, margin: '0 0 14px' }}>Account Details</h2><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '10px 12px' : '16px 24px' }}><InfoField l="Member Since"><span>{formatDate(userData.created_at)}</span></InfoField><InfoField l="Last Updated"><span>{formatDate(userData.updated_at)}</span></InfoField><InfoField l="Login Method"><span>{loginMethod}</span></InfoField></div></div>
              </div>
            )}

            {currentPanel === 'addresses' && (
              <div style={{ background: '#fff', borderRadius: 14, padding: isMobile ? 14 : 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)', border: '1.5px solid #007aff', position: 'relative' }}>
                <span style={{ position: 'absolute', top: 8, right: 8, background: '#007aff', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 50, textTransform: 'uppercase' }}>Primary</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 12 : 24 }}><h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: isMobile ? 14 : 18, fontWeight: 700, margin: 0 }}>Saved Location</h2>{!isEditingAddress ? <button onClick={() => setIsEditingAddress(true)} style={{ fontSize: isMobile ? 10 : 13, color: '#007aff', background: 'none', border: '1.5px solid #e5e5ea', borderRadius: 50, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}><i className="fa-solid fa-pen" style={{ marginRight: 3 }}></i> Edit</button> : <div style={{ display: 'flex', gap: 6 }}><button onClick={() => setIsEditingAddress(false)} style={{ fontSize: isMobile ? 10 : 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button><button onClick={saveAddress} disabled={saving} style={{ fontSize: isMobile ? 10 : 13, color: '#fff', background: '#007aff', border: 'none', borderRadius: 50, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>{saving ? '...' : 'Save'}</button></div>}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '10px 12px' : '16px 24px' }}>{isEditingAddress ? <><InfoField l="Address Line 1"><input style={inputStyle} value={userData.address_line1} onChange={e => updateField('address_line1', e.target.value)} /></InfoField><InfoField l="Address Line 2"><input style={inputStyle} value={userData.address_line2} onChange={e => updateField('address_line2', e.target.value)} /></InfoField><InfoField l="City"><input style={inputStyle} value={userData.city} onChange={e => updateField('city', e.target.value)} /></InfoField><InfoField l="State"><input style={inputStyle} value={userData.state} onChange={e => updateField('state', e.target.value)} /></InfoField><InfoField l="Postal Code"><input style={inputStyle} value={userData.postal_code} onChange={e => updateField('postal_code', e.target.value)} /></InfoField><InfoField l="Country"><input style={inputStyle} value={userData.country} onChange={e => updateField('country', e.target.value)} /></InfoField></> : <><InfoField l="Address Line 1"><span>{userData.address_line1 || '—'}</span></InfoField><InfoField l="Address Line 2"><span>{userData.address_line2 || '—'}</span></InfoField><InfoField l="City"><span>{userData.city || '—'}</span></InfoField><InfoField l="State"><span>{userData.state || '—'}</span></InfoField><InfoField l="Postal Code"><span>{userData.postal_code || '—'}</span></InfoField><InfoField l="Country"><span>{userData.country || '—'}</span></InfoField></>}</div>
              </div>
            )}

            {/* ===== JABIYEN CARD AUTH PANEL ===== */}
            {currentPanel === 'card-auth' && (
              <div style={{ background: '#fff', borderRadius: 14, padding: isMobile ? 14 : 32, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ textAlign: 'center', marginBottom: isMobile ? 14 : 28 }}>
                  <div style={{ width: isMobile ? 36 : 56, height: isMobile ? 36 : 56, background: '#0f0f0f', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <img src="/logo.png" alt="J" style={{ width: isMobile ? 18 : 28, height: isMobile ? 18 : 28, borderRadius: 4 }} crossOrigin="anonymous" />
                  </div>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: isMobile ? 16 : 22, fontWeight: 700, margin: '0 0 3px', color: '#0f0f0f' }}>JABIYEN Card Auth</h2>
                  <p style={{ fontSize: isMobile ? 11 : 14, color: '#71717a', margin: 0 }}>Generate your digital card for instant QR login</p>
                </div>

                {!qrVerified && (
                  <div style={{ maxWidth: 400, margin: '0 auto' }}>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: isMobile ? 11 : 13, fontWeight: 600, color: '#0f0f0f', marginBottom: 5 }}>Verify Password <span style={{ color: '#dc2626' }}>*</span></label>
                      <div style={{ position: 'relative' }}>
                        <input type="password" value={qrPassword} onChange={e => { setQrPassword(e.target.value); setQrError(null); }} onKeyDown={e => { if (e.key === 'Enter') verifyPasswordForQR(); }} placeholder="Enter your password" style={{ ...inputStyle, padding: isMobile ? '9px 12px' : '14px 16px', paddingRight: 40, borderColor: qrError ? '#dc2626' : '#e5e5ea', fontSize: isMobile ? 13 : 15, borderRadius: 10 }} />
                        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#71717a' }}><i className="fa-solid fa-lock" style={{ fontSize: 13 }}></i></div>
                      </div>
                      {qrError && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#dc2626', marginTop: 4 }}><i className="fa-solid fa-circle-exclamation" style={{ fontSize: 9 }}></i><span>{qrError}</span></div>}
                    </div>
                    <button onClick={verifyPasswordForQR} disabled={qrVerifying || !qrPassword} style={{ width: '100%', padding: isMobile ? '11px 18px' : '14px 24px', background: qrVerifying || !qrPassword ? '#a1a1a6' : '#0f0f0f', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: isMobile ? 13 : 15, fontWeight: 600, border: 'none', borderRadius: 10, cursor: qrVerifying || !qrPassword ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                      {qrVerifying ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Verifying...</> : <><i className="fa-solid fa-shield-check" style={{ fontSize: isMobile ? 13 : 15 }}></i> Generate My Card</>}
                    </button>
                  </div>
                )}

                {qrVerified && (
                  <div style={{ animation: 'fadeInUp 0.6s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, padding: isMobile ? '8px' : '20px', background: '#fafafa', borderRadius: isMobile ? 12 : 20 }}>
                      <div ref={cardRef} data-card="true" style={{ display: 'inline-block' }}>
                        <JABIYENCard userData={userData} fullName={fullName} username={username} getInitials={getInitials} qrContainerRef={qrContainerRef} qrGenerated={qrGenerated} isMobile={isMobile} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 7 : 12 }}>
                      <button onClick={downloadCard} disabled={!qrGenerated || !cardImageUrl || capturing} style={{ padding: isMobile ? '11px 18px' : '14px 28px', background: (qrGenerated && cardImageUrl) ? '#0f0f0f' : '#a1a1a6', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: isMobile ? 12 : 15, fontWeight: 600, border: 'none', borderRadius: 10, cursor: (qrGenerated && cardImageUrl && !capturing) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 5, boxShadow: (qrGenerated && cardImageUrl) ? '0 4px 16px rgba(0,0,0,0.2)' : 'none' }}>
                        {capturing ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Processing...</> : <><i className="fa-solid fa-download" style={{ fontSize: isMobile ? 11 : 14 }}></i>{isMobile ? 'Download' : 'Download Card'}</>}
                      </button>
                      <button onClick={() => { setQrVerified(false); setQrGenerated(false); setQrPassword(''); setQrError(null); setCardImageUrl(null); setCapturing(false); if (qrContainerRef.current) qrContainerRef.current.innerHTML = ''; }} style={{ padding: isMobile ? '11px 14px' : '14px 20px', background: '#f4f4f5', color: '#0f0f0f', fontFamily: "'Inter', sans-serif", fontSize: isMobile ? 12 : 15, fontWeight: 600, border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className="fa-solid fa-rotate" style={{ fontSize: isMobile ? 11 : 14 }}></i>Reset
                      </button>
                    </div>
                    <p style={{ textAlign: 'center', fontSize: isMobile ? 9 : 12, color: '#71717a', marginTop: 8 }}>File: <strong style={{ color: '#0f0f0f' }}>{username}-jabiyen-auth.png</strong></p>
                  </div>
                )}

                <div style={{ marginTop: isMobile ? 16 : 32, padding: isMobile ? '8px 10px' : '14px 16px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fcd34d', display: 'flex', gap: 7, maxWidth: 520, margin: isMobile ? '16px auto 0' : '32px auto 0' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#d97706', fontSize: isMobile ? 12 : 16, marginTop: 1, flexShrink: 0 }}></i>
                  <div style={{ fontSize: isMobile ? 9 : 12, color: '#92400e', lineHeight: 1.5 }}><strong style={{ color: '#b45309' }}>Security Note:</strong> Your JABIYEN card contains encrypted login credentials. Keep it secure.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#dc2626' : '#0f0f0f', color: '#fff', padding: isMobile ? '8px 16px' : '14px 24px', borderRadius: 50, fontSize: isMobile ? 11 : 14, fontWeight: 500, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}><i className={`fa-solid fa-circle-${toast.type === 'error' ? 'exclamation' : 'check'}`}></i><span>{toast.message}</span></div>}
      
      {showLogoutModal && <div onClick={() => setShowLogoutModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}><div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: isMobile ? '22px 18px' : '40px 32px', textAlign: 'center', maxWidth: 380, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}><div style={{ width: isMobile ? 48 : 80, height: isMobile ? 48 : 80, background: '#fef2f2', color: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 22 : 36, margin: '0 auto 14px' }}><i className="fa-solid fa-power-off"></i></div><h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: isMobile ? 16 : 24, fontWeight: 800, margin: '0 0 6px' }}>Sign Out</h2><p style={{ fontSize: isMobile ? 12 : 15, color: '#71717a', margin: '0 0 20px' }}>Are you sure you want to sign out?</p><div style={{ display: 'flex', gap: 8 }}><button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: isMobile ? '10px 14px' : '14px 20px', borderRadius: 10, fontSize: isMobile ? 12 : 15, fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer', border: 'none', background: '#f4f4f5', color: '#0f0f0f' }}>Cancel</button><button onClick={handleLogout} style={{ flex: 1, padding: isMobile ? '10px 14px' : '14px 20px', borderRadius: 10, fontSize: isMobile ? 12 : 15, fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer', border: 'none', background: '#dc2626', color: '#fff' }}>Sign Out</button></div></div></div>}

      <style jsx>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </>
  );
}

function InfoField({ l, children }) {
  return <div><label style={{ display: 'block', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', marginBottom: 4 }}>{l}</label><div style={{ fontSize: 14, color: '#0f0f0f', fontWeight: 500, minHeight: 20 }}>{children}</div></div>;
}
