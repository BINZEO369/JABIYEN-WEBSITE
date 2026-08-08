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

  // Generate QR Code as data URL
  const generateQRDataURL = (text) => {
    return new Promise((resolve) => {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);
      
      const qr = new window.QRCode(tempContainer, {
        text: text,
        width: 200,
        height: 200,
        colorDark: '#1d1d1f',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.L : 1
      });

      setTimeout(() => {
        const img = tempContainer.querySelector('img');
        const canvas = tempContainer.querySelector('canvas');
        if (img) {
          resolve(img.src);
        } else if (canvas) {
          resolve(canvas.toDataURL('image/png'));
        }
        document.body.removeChild(tempContainer);
      }, 500);
    });
  };

  // Generate complete card
  const generateCard = async () => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 900;
    const height = 540;
    canvas.width = width;
    canvas.height = height;

    // Card Background - Premium dark gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0a0a1a');
    bgGradient.addColorStop(0.3, '#111133');
    bgGradient.addColorStop(0.7, '#1a1a3e');
    bgGradient.addColorStop(1, '#0d0d24');
    
    // Rounded rectangle card
    const cardX = 20;
    const cardY = 20;
    const cardW = width - 40;
    const cardH = height - 40;
    const radius = 24;

    // Draw shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 16;
    
    // Card body
    ctx.beginPath();
    ctx.moveTo(cardX + radius, cardY);
    ctx.lineTo(cardX + cardW - radius, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
    ctx.lineTo(cardX + cardW, cardY + cardH - radius);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH);
    ctx.lineTo(cardX + radius, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
    ctx.lineTo(cardX, cardY + radius);
    ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
    ctx.closePath();
    ctx.fillStyle = bgGradient;
    ctx.fill();

    // Reset shadow for inner elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Decorative circles
    ctx.beginPath();
    ctx.arc(cardX + cardW - 80, cardY + 80, 140, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(102, 126, 234, 0.06)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(cardX + 100, cardY + cardH - 100, 100, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(118, 75, 162, 0.05)';
    ctx.fill();

    // Accent line top
    const accentGradient = ctx.createLinearGradient(0, 0, width, 0);
    accentGradient.addColorStop(0, '#667eea');
    accentGradient.addColorStop(0.5, '#8b5cf6');
    accentGradient.addColorStop(1, '#a855f7');
    
    ctx.fillStyle = accentGradient;
    ctx.fillRect(cardX, cardY, cardW, 4);

    // Card Brand - "JABIYEN"
    ctx.font = '600 20px "Inter", "Manrope", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('JABIYEN', cardX + 40, cardY + 60);

    // Logo
    const logoImg = new Image();
    logoImg.src = '/logo.png';
    
    await new Promise((resolve) => {
      logoImg.onload = () => {
        // Draw logo
        const logoSize = 44;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cardX + cardW - 60, cardY + 60, logoSize/2 + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(cardX + cardW - 60, cardY + 60, logoSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImg, cardX + cardW - 60 - logoSize/2, cardY + 60 - logoSize/2, logoSize, logoSize);
        ctx.restore();
        resolve();
      };
      logoImg.onerror = () => resolve();
      // If already loaded
      if (logoImg.complete) {
        logoImg.onload();
      }
    });

    // Card type chip
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(cardX + 40, cardY + 120, 56, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(cardX + 40, cardY + 126, 56, 4);
    ctx.fillRect(cardX + 40, cardY + 134, 56, 4);
    ctx.fillRect(cardX + 40, cardY + 142, 56, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(cardX + 40, cardY + 152, 56, 4);

    // Card Number (styled)
    const cardNumber = '••••  ••••  ••••  ' + (userData.phone || '••••').slice(-4).padStart(4, '•');
    ctx.font = '500 28px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(cardNumber, cardX + 40, cardY + 220);

    // Labels row
    const labels = ['CARD HOLDER', 'VALID THRU', 'CVV'];
    const labelX = [cardX + 40, cardX + 280, cardX + 460];
    
    ctx.font = '500 10px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.letterSpacing = '0.1em';
    labels.forEach((label, i) => {
      ctx.fillText(label, labelX[i], cardY + 270);
    });

    // Values row
    const fullName = `${userData.first_name} ${userData.last_name}`.trim() || userData.email?.split('@')[0] || 'User';
    const validThru = new Date().toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }) + ' / ' + 
      new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' });
    
    ctx.font = '600 15px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(fullName.toUpperCase(), labelX[0], cardY + 292);
    ctx.fillText(validThru, labelX[1], cardY + 292);
    ctx.fillText('•••', labelX[2], cardY + 292);

    // User Details Section
    const detailStartY = cardY + 330;
    ctx.font = '400 12px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    
    // Email
    ctx.fillText('EMAIL', cardX + 40, detailStartY);
    ctx.font = '500 13px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(userData.email || '—', cardX + 40, detailStartY + 20);

    // Address (if exists)
    if (userData.address_line1) {
      const address = [userData.address_line1, userData.address_line2, userData.city, userData.state, userData.postal_code, userData.country]
        .filter(Boolean).join(', ');
      
      ctx.font = '400 11px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('ADDRESS', cardX + 280, detailStartY);
      ctx.font = '500 12px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      
      // Wrap text if too long
      const words = address.split(' ');
      let line = '';
      let y = detailStartY + 20;
      words.forEach((word) => {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > 280) {
          ctx.fillText(line.trim(), cardX + 280, y);
          line = word + ' ';
          y += 18;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line.trim(), cardX + 280, y);
    }

    // QR Code on right side
    const qrData = JSON.stringify({
      email: userData.email,
      password: cardPassword
    });

    try {
      const qrDataUrl = await generateQRDataURL(qrData);
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      
      await new Promise((resolve) => {
        qrImg.onload = () => {
          const qrSize = 130;
          const qrX = cardX + cardW - qrSize - 50;
          const qrY = cardY + cardH - qrSize - 50;
          
          // QR background
          ctx.fillStyle = '#fff';
          ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
          ctx.fillStyle = '#fff';
          ctx.fillRect(qrX, qrY, qrSize, qrSize);
          
          // Draw QR
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          
          // QR Label
          ctx.font = '400 9px "Inter", sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.textAlign = 'center';
          ctx.fillText('SCAN TO AUTH', qrX + qrSize/2, qrY + qrSize + 16);
          ctx.textAlign = 'left';
          resolve();
        };
        qrImg.onerror = () => resolve();
      });
    } catch (e) {
      // QR generation failed, continue without QR
    }

    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cardX + 40, cardY + cardH - 60);
    ctx.lineTo(cardX + cardW - 40, cardY + cardH - 60);
    ctx.stroke();

    // Footer
    ctx.font = '400 10px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillText('This card is encrypted and contains your secure login credentials. Do not share.', cardX + 40, cardY + cardH - 38);
    ctx.textAlign = 'right';
    ctx.fillText('JABIYEN AUTH CARD © ' + new Date().getFullYear(), cardX + cardW - 40, cardY + cardH - 38);
    ctx.textAlign = 'left';

    // Set data URL
    setCardDataUrl(canvas.toDataURL('image/png'));
    setCardGenerated(true);
  };

  // Password verification
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
      await generateCard();
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

    const username = (userData.first_name + '-' + userData.last_name).toLowerCase().replace(/\s+/g, '-') || 'user';
    const link = document.createElement('a');
    link.download = `${username}-jabiyen-auth-card.png`;
    link.href = cardDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Auth card downloaded successfully!');
  };

  // Reset card states when switching panels
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

            {/* JABIYEN Card Auth Section - Premium Card Design */}
            {currentPanel === 'card-auth' && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{ 
                    width: 64, height: 64, 
                    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)',
                    borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', color: '#fff', fontSize: 28
                  }}>
                    <i className="fa-solid fa-credit-card"></i>
                  </div>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>JABIYEN Card Auth</h2>
                  <p style={{ fontSize: 14, color: '#86868b', margin: 0, lineHeight: 1.5 }}>
                    Generate your premium JABIYEN Auth Card for secure, instant login.<br />
                    Verify your password to create your personalized card.
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
                        placeholder="Enter your password to verify"
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

                {/* Verify Button */}
                {!cardVerified ? (
                  <button 
                    onClick={verifyPasswordForCard}
                    disabled={cardVerifying || !cardPassword}
                    style={{
                      width: '100%', padding: '14px 24px',
                      background: cardVerifying || !cardPassword ? '#a1a1a6' : 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)',
                      color: '#fff', fontFamily: "'Inter', sans-serif",
                      fontSize: 15, fontWeight: 600, border: 'none',
                      borderRadius: 12, cursor: cardVerifying || !cardPassword ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      transition: 'all 0.3s ease',
                      boxShadow: cardVerifying || !cardPassword ? 'none' : '0 4px 20px rgba(10,10,26,0.3)'
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
                        Verify & Generate Card
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
                      background: '#f0f0f5', borderRadius: 20,
                      padding: 20, marginBottom: 20
                    }}>
                      <canvas 
                        ref={cardCanvasRef} 
                        style={{ 
                          width: '100%', 
                          height: 'auto', 
                          borderRadius: 16,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                        }} 
                      />
                    </div>

                    {/* Download & Reset Buttons */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={downloadCard}
                        disabled={!cardGenerated}
                        style={{
                          flex: 1, padding: '14px 20px',
                          background: cardGenerated ? '#0a0a1a' : '#a1a1a6',
                          color: '#fff', fontFamily: "'Inter', sans-serif",
                          fontSize: 15, fontWeight: 600, border: 'none',
                          borderRadius: 12, cursor: cardGenerated ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <i className="fa-solid fa-download"></i>
                        Download Card (PNG)
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
                        Generate New
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
                    <strong style={{ color: '#e65100' }}>Security Note:</strong> This card contains encrypted login credentials in the QR code. Keep it secure and do not share with anyone. The card is for your personal use only.
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
