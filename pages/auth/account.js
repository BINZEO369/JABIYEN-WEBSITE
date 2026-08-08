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

export default function Account() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPanel, setCurrentPanel] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Card Generator states
  const [cardPassword, setCardPassword] = useState('');
  const [cardVerifying, setCardVerifying] = useState(false);
  const [cardVerified, setCardVerified] = useState(false);
  const [cardGenerated, setCardGenerated] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState(null);
  const [cardError, setCardError] = useState(null);
  const cardCanvasRef = useRef(null);
  const cardPreviewRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getToken = () => {
    try {
      const stored = localStorage.getItem('jayenware_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.access_token || null;
      }
      
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const expiresAt = params.get('expires_at');
          
          if (accessToken) {
            localStorage.setItem('jayenware_session', JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: expiresAt
            }));
            window.history.replaceState(null, '', window.location.pathname);
            return accessToken;
          }
        }
      }
    } catch (e) {}
    return null;
  };

  const fetchUserData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Please sign in to view your account.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/user/profile', {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('jayenware_session');
          setError('Session expired. Please sign in again.');
          setLoading(false);
          return;
        }
        throw new Error('Failed to load');
      }

      const result = await res.json();
      const profile = result.profile || {};
      const user = result.user || {};

      const metadata = user.user_metadata || {};
      const appMetadata = user.app_metadata || {};

      setUserData({
        email: user.email || profile.email || '',
        first_name: profile.first_name || metadata.first_name || metadata.full_name?.split(' ')[0] || '',
        last_name: profile.last_name || metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || '',
        phone: profile.phone || metadata.phone || '',
        avatar_url: metadata.avatar_url || metadata.picture || '',
        provider: profile.provider || appMetadata.provider || 'email',
        address_line1: profile.address_line1 || metadata.address_line1 || '',
        address_line2: profile.address_line2 || metadata.address_line2 || '',
        city: profile.city || metadata.city || '',
        state: profile.state || metadata.state || '',
        postal_code: profile.postal_code || metadata.postal_code || '',
        country: profile.country || metadata.country || '',
        created_at: profile.created_at || user.created_at || '',
        updated_at: profile.updated_at || user.updated_at || ''
      });
    } catch (e) {
      setError('Failed to load account data.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchUserData();
    // Load QR code library dynamically
    if (typeof window !== 'undefined' && !window.QRCode) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, [fetchUserData]);

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
    localStorage.removeItem('jayenware_session');
    router.push('/');
  };

  const saveProfile = async () => {
    setSaving(true);
    const token = getToken();
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone
        })
      });
      if (!res.ok) throw new Error();
      showToast('Profile updated successfully!');
      setIsEditingProfile(false);
    } catch (e) {
      showToast('Failed to update profile', 'error');
    }
    setSaving(false);
  };

  const saveAddress = async () => {
    setSaving(true);
    const token = getToken();
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          address_line1: userData.address_line1,
          address_line2: userData.address_line2,
          city: userData.city,
          state: userData.state,
          postal_code: userData.postal_code,
          country: userData.country
        })
      });
      if (!res.ok) throw new Error();
      showToast('Address updated successfully!');
      setIsEditingAddress(false);
    } catch (e) {
      showToast('Failed to update address', 'error');
    }
    setSaving(false);
  };

  const updateField = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  // Generate QR Code as image
  const generateQRImage = (data) => {
    return new Promise((resolve) => {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      const qrCode = new window.QRCode(tempDiv, {
        text: data,
        width: 180,
        height: 180,
        colorDark: '#1d1d1f',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.M : 2
      });

      setTimeout(() => {
        const img = tempDiv.querySelector('img');
        if (img) {
          resolve(img);
        } else {
          const canvas = tempDiv.querySelector('canvas');
          const newImg = new Image();
          newImg.src = canvas.toDataURL('image/png');
          resolve(newImg);
        }
        document.body.removeChild(tempDiv);
      }, 300);
    });
  };

  // Draw complete JABIYEN Auth Card
  const drawAuthCard = async () => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 600;
    const height = 380;
    
    canvas.width = width;
    canvas.height = height;

    // Card Background - Dark premium gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0a0a0a');
    bgGradient.addColorStop(0.5, '#1a1a2e');
    bgGradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 20);
    ctx.fill();

    // Subtle pattern overlay
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let i = 0; i < width; i += 40) {
      for (let j = 0; j < height; j += 40) {
        ctx.fillRect(i, j, 1, 1);
      }
    }

    // Border glow effect
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(4, 4, width - 8, height - 8, 18);
    ctx.stroke();

    // Inner border
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(16, 16, width - 32, height - 32, 14);
    ctx.stroke();

    // === LEFT SECTION - User Info ===
    
    // Logo/Icon area
    const logoGradient = ctx.createLinearGradient(0, 0, 80, 80);
    logoGradient.addColorStop(0, '#667eea');
    logoGradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = logoGradient;
    ctx.beginPath();
    ctx.roundRect(40, 40, 60, 60, 14);
    ctx.fill();
    
    // Logo text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Manrope", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('J', 70, 80);

    // Brand name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Manrope", "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('JABIYEN', 115, 68);
    
    ctx.fillStyle = '#86868b';
    ctx.font = '500 9px "Inter", sans-serif';
    ctx.fillText('AUTH CARD', 115, 84);

    // User full name
    const fullName = `${userData.first_name} ${userData.last_name}`.trim() || 'User';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Manrope", "Inter", sans-serif';
    ctx.fillText(fullName, 40, 150);
    
    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 168);
    ctx.lineTo(280, 168);
    ctx.stroke();

    // Email
    ctx.fillStyle = '#86868b';
    ctx.font = '500 11px "Inter", sans-serif';
    ctx.fillText('EMAIL', 40, 195);
    ctx.fillStyle = '#d1d1d6';
    ctx.font = '500 13px "Inter", sans-serif';
    ctx.fillText(userData.email || '—', 40, 215);

    // Phone
    ctx.fillStyle = '#86868b';
    ctx.font = '500 11px "Inter", sans-serif';
    ctx.fillText('PHONE', 40, 248);
    ctx.fillStyle = '#d1d1d6';
    ctx.font = '500 13px "Inter", sans-serif';
    ctx.fillText(userData.phone || '—', 40, 268);

    // Address
    const addressParts = [
      userData.address_line1,
      userData.address_line2,
      userData.city,
      userData.state,
      userData.postal_code,
      userData.country
    ].filter(Boolean);
    
    const addressStr = addressParts.length > 0 ? addressParts.join(', ') : 'No address saved';
    
    ctx.fillStyle = '#86868b';
    ctx.font = '500 11px "Inter", sans-serif';
    ctx.fillText('ADDRESS', 40, 301);
    ctx.fillStyle = '#d1d1d6';
    ctx.font = '500 12px "Inter", sans-serif';
    
    // Handle long address with line break
    const words = addressStr.split(' ');
    let line = '';
    let y = 321;
    for (let word of words) {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > 240) {
        ctx.fillText(line.trim(), 40, y);
        line = word + ' ';
        y += 18;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), 40, y);

    // === RIGHT SECTION - QR Code ===
    
    // QR Background container
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(370, 40, 200, 200, 14);
    ctx.fill();
    
    // QR Code border
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(370, 40, 200, 200, 14);
    ctx.stroke();

    // Generate QR Code
    const qrData = JSON.stringify({
      email: userData.email,
      password: cardPassword
    });

    try {
      const qrImage = await generateQRImage(qrData);
      ctx.drawImage(qrImage, 380, 50, 180, 180);
    } catch (e) {
      // Fallback text
      ctx.fillStyle = '#86868b';
      ctx.font = '13px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code', 470, 140);
    }
    
    ctx.textAlign = 'left';

    // QR Label
    ctx.fillStyle = '#86868b';
    ctx.font = '500 10px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan for instant login', 470, 260);
    ctx.textAlign = 'left';

    // === BOTTOM SECTION ===
    
    // Bottom separator
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 290);
    ctx.lineTo(560, 290);
    ctx.stroke();

    // Member since and card info
    ctx.fillStyle = '#86868b';
    ctx.font = '500 10px "Inter", sans-serif';
    ctx.fillText('MEMBER SINCE', 40, 320);
    ctx.fillStyle = '#d1d1d6';
    ctx.font = '500 11px "Inter", sans-serif';
    ctx.fillText(formatDate(userData.created_at), 40, 337);

    // Card ID
    ctx.fillStyle = '#86868b';
    ctx.font = '500 10px "Inter", sans-serif';
    ctx.fillText('CARD ID', 40, 358);
    ctx.fillStyle = '#d1d1d6';
    ctx.font = '500 11px "Inter", sans-serif';
    const cardId = `JAB-${userData.email?.split('@')[0]?.toUpperCase() || 'USER'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    ctx.fillText(cardId, 40, 375);

    // Powered by
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '500 8px "Inter", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('JAYENWARE', 560, 370);
    ctx.textAlign = 'left';

    // Set preview
    if (cardPreviewRef.current) {
      setCardDataUrl(canvas.toDataURL('image/png'));
      setCardGenerated(true);
    }
  };

  // Verify password and generate card
  const verifyPasswordForCard = async () => {
    if (!cardPassword) {
      setCardError('Please enter your password');
      showToast('Please enter your password', 'error');
      return;
    }

    setCardVerifying(true);
    setCardError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userData.email, 
          password: cardPassword 
        })
      });

      const result = await res.json();

      if (!res.ok) {
        setCardError('Invalid password. Please try again.');
        showToast('Password verification failed', 'error');
        setCardVerifying(false);
        return;
      }

      setCardVerified(true);
      await drawAuthCard();
      showToast('JABIYEN Auth Card generated!', 'success');
    } catch (err) {
      setCardError('Verification failed. Please try again.');
      showToast('Verification failed', 'error');
    } finally {
      setCardVerifying(false);
    }
  };

  // Download card
  const downloadCard = () => {
    if (!cardDataUrl) return;

    const username = userData.first_name 
      ? userData.first_name.toLowerCase().replace(/\s+/g, '-')
      : userData.email?.split('@')[0] || 'user';

    const link = document.createElement('a');
    link.download = `${username}-jabiyen-auth-card.png`;
    link.href = cardDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Card downloaded successfully!');
  };

  // Reset card states
  const handlePanelSwitch = (panel) => {
    setCurrentPanel(panel);
    if (panel !== 'card-auth') {
      setCardPassword('');
      setCardVerified(false);
      setCardGenerated(false);
      setCardDataUrl(null);
      setCardError(null);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 16px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ height: 40, width: 200, background: '#f0f0f0', borderRadius: 8, margin: '0 auto', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, height: 200, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 16px', textAlign: 'center' }}>
        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 48, color: '#ff3b30', marginBottom: 16 }}></i>
        <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Failed to load account</h3>
        <p style={{ fontSize: 14, color: '#86868b' }}>{error}</p>
        <button onClick={() => router.push('/auth/signin')} style={{ marginTop: 16, padding: '10px 24px', background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Go to Sign In</button>
      </div>
    );
  }

  const getInitials = () => {
    const f = userData.first_name?.charAt(0) || '';
    const l = userData.last_name?.charAt(0) || '';
    const initials = (f + l).toUpperCase();
    if (initials) return initials;
    return userData.email?.charAt(0).toUpperCase() || 'U';
  };

  const fullName = `${userData.first_name} ${userData.last_name}`.trim() || userData.email?.split('@')[0] || 'User';
  const isGoogleUser = userData.provider === 'google' || (userData.provider !== 'email' && userData.avatar_url);
  const loginMethod = userData.provider === 'google' ? 'Google' : userData.provider === 'azure' ? 'Microsoft' : userData.provider !== 'email' ? userData.provider?.charAt(0).toUpperCase() + userData.provider?.slice(1) : 'Email & Password';

  return (
    <>
      <Head>
        <title>My Account | JAYENWARE</title>
        <meta name="description" content="Manage your JAYENWARE account" />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 16px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: "var(--font-heading), 'Manrope', sans-serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#1d1d1f', margin: '0 0 6px' }}>My Account</h1>
          <p style={{ fontSize: 15, color: '#86868b', margin: 0 }}>Welcome back, {userData.first_name || 'User'}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {[
              { key: 'profile', icon: 'user', label: 'Profile' },
              { key: 'addresses', icon: 'location-dot', label: 'Location' },
              { key: 'card-auth', icon: 'id-card', label: 'JABIYEN Card Auth' }
            ].map(panel => (
              <button key={panel.key} onClick={() => handlePanelSwitch(panel.key)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '14px 20px', borderRadius: 12, cursor: 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                border: 'none', flex: 1, minWidth: 140,
                background: currentPanel === panel.key ? '#1d1d1f' : '#f5f5f7',
                color: currentPanel === panel.key ? '#fff' : '#1d1d1f',
                transition: 'all 0.25s ease'
              }}>
                <i className={`fa-solid fa-${panel.icon}`} style={{ fontSize: 15 }}></i>
                {panel.label}
              </button>
            ))}
            <button onClick={() => setShowLogoutModal(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '14px 20px', borderRadius: 12, cursor: 'pointer',
              fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif",
              border: 'none', flex: 1, minWidth: 140,
              background: '#fff0ef', color: '#ff3b30'
            }}>
              <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 15 }}></i> Sign Out
            </button>
          </div>

          <div style={{ minHeight: 400 }}>
            {currentPanel === 'profile' && (
              <div>
                <div style={{ background: '#fff', borderRadius: 16, padding: '32px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', textAlign: 'center', marginBottom: 20 }}>
                  {userData.avatar_url ? (
                    <img src={userData.avatar_url} alt={fullName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px', border: '3px solid #f0f0f0' }} />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #007aff, #005bb5)', color: '#fff', fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: "'Manrope', sans-serif" }}>{getInitials()}</div>
                  )}
                  <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>{fullName}</h3>
                  <p style={{ fontSize: 14, color: '#86868b', margin: 0 }}>{userData.email}</p>
                  <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: isGoogleUser ? '#e8f0fe' : '#f5f5f7', padding: '4px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600, color: '#86868b' }}>
                    {isGoogleUser ? (
                      <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    ) : (
                      <i className="fa-solid fa-envelope" style={{ fontSize: 11 }}></i>
                    )}
                    Signed in with {loginMethod}
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>Personal Information</h2>
                    {!isEditingProfile ? (
                      <button onClick={() => setIsEditingProfile(true)} style={{ fontSize: 13, color: '#007aff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}><i className="fa-solid fa-pen" style={{ marginRight: 4 }}></i> Edit</button>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setIsEditingProfile(false)} style={{ fontSize: 13, color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                        <button onClick={saveProfile} disabled={saving} style={{ fontSize: 13, color: '#fff', background: '#007aff', border: 'none', borderRadius: 50, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>{saving ? 'Saving...' : 'Save'}</button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                    {isEditingProfile ? (
                      <>
                        <InfoField label="First Name"><input style={inputStyle} value={userData.first_name} onChange={(e) => updateField('first_name', e.target.value)} /></InfoField>
                        <InfoField label="Last Name"><input style={inputStyle} value={userData.last_name} onChange={(e) => updateField('last_name', e.target.value)} /></InfoField>
                        <InfoField label="Phone"><input style={inputStyle} value={userData.phone} onChange={(e) => updateField('phone', e.target.value)} /></InfoField>
                        <InfoField label="Email"><input style={{ ...inputStyle, backgroundColor: '#f5f5f7', color: '#86868b' }} value={userData.email} disabled /></InfoField>
                      </>
                    ) : (
                      <>
                        <InfoField label="First Name"><span>{userData.first_name || '—'}</span></InfoField>
                        <InfoField label="Last Name"><span>{userData.last_name || '—'}</span></InfoField>
                        <InfoField label="Phone"><span>{userData.phone || '—'}</span></InfoField>
                        <InfoField label="Email"><span>{userData.email || '—'}</span></InfoField>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>Account Details</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                    <InfoField label="Member Since"><span>{formatDate(userData.created_at)}</span></InfoField>
                    <InfoField label="Last Updated"><span>{formatDate(userData.updated_at)}</span></InfoField>
                    <InfoField label="Login Method"><span>{loginMethod}</span></InfoField>
                  </div>
                </div>
              </div>
            )}

            {currentPanel === 'addresses' && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)', border: '1.5px solid #007aff', position: 'relative' }}>
                <span style={{ position: 'absolute', top: 12, right: 12, background: '#007aff', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 50, textTransform: 'uppercase' }}>Primary</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>Saved Location</h2>
                  {!isEditingAddress ? (
                    <button onClick={() => setIsEditingAddress(true)} style={{ fontSize: 13, color: '#007aff', background: 'none', border: '1.5px solid #e5e5ea', borderRadius: 50, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}><i className="fa-solid fa-pen" style={{ marginRight: 4 }}></i> Edit</button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setIsEditingAddress(false)} style={{ fontSize: 13, color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                      <button onClick={saveAddress} disabled={saving} style={{ fontSize: 13, color: '#fff', background: '#007aff', border: 'none', borderRadius: 50, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>{saving ? 'Saving...' : 'Save'}</button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                  {isEditingAddress ? (
                    <>
                      <InfoField label="Address Line 1"><input style={inputStyle} value={userData.address_line1} onChange={(e) => updateField('address_line1', e.target.value)} /></InfoField>
                      <InfoField label="Address Line 2"><input style={inputStyle} value={userData.address_line2} onChange={(e) => updateField('address_line2', e.target.value)} /></InfoField>
                      <InfoField label="City"><input style={inputStyle} value={userData.city} onChange={(e) => updateField('city', e.target.value)} /></InfoField>
                      <InfoField label="State / Province"><input style={inputStyle} value={userData.state} onChange={(e) => updateField('state', e.target.value)} /></InfoField>
                      <InfoField label="Postal Code"><input style={inputStyle} value={userData.postal_code} onChange={(e) => updateField('postal_code', e.target.value)} /></InfoField>
                      <InfoField label="Country"><input style={inputStyle} value={userData.country} onChange={(e) => updateField('country', e.target.value)} /></InfoField>
                    </>
                  ) : (
                    <>
                      <InfoField label="Address Line 1"><span>{userData.address_line1 || '—'}</span></InfoField>
                      <InfoField label="Address Line 2"><span>{userData.address_line2 || '—'}</span></InfoField>
                      <InfoField label="City"><span>{userData.city || '—'}</span></InfoField>
                      <InfoField label="State / Province"><span>{userData.state || '—'}</span></InfoField>
                      <InfoField label="Postal Code"><span>{userData.postal_code || '—'}</span></InfoField>
                      <InfoField label="Country"><span>{userData.country || '—'}</span></InfoField>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* JABIYEN Card Auth Section */}
            {currentPanel === 'card-auth' && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{ 
                    width: 64, height: 64, 
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', color: '#fff', fontSize: 28,
                    border: '2px solid rgba(102, 126, 234, 0.3)'
                  }}>
                    <i className="fa-solid fa-credit-card"></i>
                  </div>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>JABIYEN Card Auth</h2>
                  <p style={{ fontSize: 14, color: '#86868b', margin: 0, lineHeight: 1.5 }}>
                    Generate your premium JABIYEN Auth Card with QR login.<br />
                    Verify your password to create a personalized card.
                  </p>
                </div>

                {/* Password Input */}
                {!cardVerified && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ 
                      display: 'block', fontSize: 13, fontWeight: 600, 
                      color: '#1d1d1f', marginBottom: 8 
                    }}>
                      Verify Password <span style={{ color: '#ff3b30' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="password" 
                        value={cardPassword}
                        onChange={(e) => {
                          setCardPassword(e.target.value);
                          setCardError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') verifyPasswordForCard();
                        }}
                        placeholder="Enter your password to generate card"
                        style={{
                          ...inputStyle,
                          padding: '14px 16px',
                          paddingRight: 50,
                          borderColor: cardError ? '#ff3b30' : '#e5e5ea',
                          fontSize: 15,
                          borderRadius: 12
                        }}
                      />
                      <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b' }}>
                        <i className="fa-solid fa-lock" style={{ fontSize: 14 }}></i>
                      </div>
                    </div>
                    {cardError && (
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: 6, 
                        fontSize: 12, color: '#ff3b30', marginTop: 6 
                      }}>
                        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 11 }}></i>
                        <span>{cardError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Verify Button or Card Display */}
                {!cardVerified ? (
                  <button 
                    onClick={verifyPasswordForCard}
                    disabled={cardVerifying || !cardPassword}
                    style={{
                      width: '100%', padding: '14px 24px',
                      background: cardVerifying || !cardPassword ? '#a1a1a6' : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                      color: '#fff', fontFamily: "'Inter', sans-serif",
                      fontSize: 15, fontWeight: 600, border: 'none',
                      borderRadius: 12, cursor: cardVerifying || !cardPassword ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      transition: 'all 0.3s ease',
                      boxShadow: cardVerifying || !cardPassword ? 'none' : '0 4px 20px rgba(26, 26, 46, 0.4)'
                    }}
                  >
                    {cardVerifying ? (
                      <>
                        <span style={{ 
                          width: 20, height: 20, 
                          border: '2px solid rgba(255,255,255,0.3)', 
                          borderTopColor: '#fff', borderRadius: '50%', 
                          animation: 'spin 0.7s linear infinite' 
                        }} />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-shield-check"></i>
                        Verify & Generate Auth Card
                      </>
                    )}
                  </button>
                ) : (
                  <div style={{ animation: 'fadeInUp 0.5s ease' }}>
                    {/* Success Badge */}
                    <div style={{
                      background: '#e8f5e9', color: '#2e7d32',
                      padding: '10px 16px', borderRadius: 12,
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 13, fontWeight: 600, marginBottom: 24
                    }}>
                      <i className="fa-solid fa-circle-check" style={{ fontSize: 16 }}></i>
                      Card generated successfully!
                    </div>

                    {/* Card Preview */}
                    <div style={{
                      background: '#f0f0f5', borderRadius: 16,
                      padding: 16, textAlign: 'center',
                      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)',
                      marginBottom: 20
                    }}>
                      <img 
                        ref={cardPreviewRef}
                        src={cardDataUrl} 
                        alt="JABIYEN Auth Card"
                        style={{
                          width: '100%', maxWidth: 560,
                          borderRadius: 12,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                        }}
                      />
                      <canvas ref={cardCanvasRef} style={{ display: 'none' }} />
                    </div>

                    {/* Download & Reset Buttons */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={downloadCard}
                        disabled={!cardGenerated}
                        style={{
                          flex: 1, padding: '14px 20px',
                          background: cardGenerated ? '#1d1d1f' : '#a1a1a6',
                          color: '#fff', fontFamily: "'Inter', sans-serif",
                          fontSize: 15, fontWeight: 600, border: 'none',
                          borderRadius: 12, cursor: cardGenerated ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <i className="fa-solid fa-download"></i>
                        Download Auth Card
                      </button>
                      <button
                        onClick={() => {
                          setCardVerified(false);
                          setCardGenerated(false);
                          setCardPassword('');
                          setCardDataUrl(null);
                          setCardError(null);
                        }}
                        style={{
                          padding: '14px 20px',
                          background: '#f5f5f7', color: '#1d1d1f',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 15, fontWeight: 600, border: 'none',
                          borderRadius: 12, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <i className="fa-solid fa-rotate"></i>
                        Reset
                      </button>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div style={{
                  marginTop: 24, padding: '14px 16px',
                  background: '#fff8e1', borderRadius: 12,
                  border: '1px solid #ffe082',
                  display: 'flex', gap: 10
                }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ 
                    color: '#f57c00', fontSize: 16, marginTop: 1, flexShrink: 0 
                  }}></i>
                  <div style={{ fontSize: 12, color: '#795548', lineHeight: 1.5 }}>
                    <strong style={{ color: '#e65100' }}>Security Note:</strong> This card contains encrypted login credentials in the QR code. Keep it secure and do not share it with anyone. Download and store it safely.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#ff3b30' : '#1d1d1f', color: '#fff', padding: '14px 24px', borderRadius: 50, fontSize: 14, fontWeight: 500, zIndex: 9999, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className={`fa-solid fa-circle-${toast.type === 'error' ? 'exclamation' : 'check'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {showLogoutModal && (
        <div onClick={() => setShowLogoutModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: '40px 32px', textAlign: 'center', maxWidth: 420, width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 80, height: 80, background: '#fff0ef', color: '#ff3b30', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px' }}><i className="fa-solid fa-power-off"></i></div>
            <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Sign Out</h2>
            <p style={{ fontSize: 15, color: '#86868b', margin: '0 0 32px', lineHeight: 1.5 }}>Are you sure you want to sign out?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '14px 20px', borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer', border: 'none', background: '#f5f5f7', color: '#1d1d1f' }}>Cancel</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '14px 20px', borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer', border: 'none', background: '#ff3b30', color: '#fff' }}>Yes, Sign Out</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </>
  );
}

function InfoField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#86868b', marginBottom: 6 }}>{label}</label>
      <div style={{ fontSize: 15, color: '#1d1d1f', fontWeight: 500, minHeight: 22 }}>{children}</div>
    </div>
  );
}
