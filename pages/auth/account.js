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

  // QR Generator states
  const [qrPassword, setQrPassword] = useState('');
  const [qrVerifying, setQrVerifying] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState(null);
  const [qrError, setQrError] = useState(null);
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

  // Password verification for QR generation
  const verifyPasswordForQR = async () => {
    if (!qrPassword) {
      setQrError('Please enter your password');
      showToast('Please enter your password', 'error');
      return;
    }

    setQrVerifying(true);
    setQrError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userData.email, 
          password: qrPassword 
        })
      });

      const result = await res.json();

      if (!res.ok) {
        setQrError('Invalid password. Please try again.');
        showToast('Password verification failed', 'error');
        setQrVerifying(false);
        return;
      }

      // Password verified successfully
      setQrVerified(true);
      generateCardImage();
      showToast('Password verified! Card generated.', 'success');
    } catch (err) {
      setQrError('Verification failed. Please try again.');
      showToast('Verification failed', 'error');
    } finally {
      setQrVerifying(false);
    }
  };

  // Generate QR Code on canvas helper
  const generateQRCodeOnCanvas = (canvas, data, size) => {
    return new Promise((resolve) => {
      // Simple QR code generator using canvas
      const qr = [];
      const qrSize = 25; // QR matrix size (25x25 for medium data)
      
      // Simple hash function to generate QR-like pattern from data
      let hash = 0;
      const str = JSON.stringify(data);
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      // Seed random with hash
      let seed = Math.abs(hash);
      const seededRandom = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      
      // Generate QR matrix pattern
      const matrix = [];
      for (let y = 0; y < qrSize; y++) {
        matrix[y] = [];
        for (let x = 0; x < qrSize; x++) {
          // Finder patterns (top-left, top-right, bottom-left)
          const isFinder = (x < 7 && y < 7) || (x > qrSize - 8 && y < 7) || (x < 7 && y > qrSize - 8);
          if (isFinder) {
            const outerFinder = (x === 0 || x === 6 || y === 0 || y === 6) && x < 7 && y < 7;
            const innerFinder = x >= 2 && x <= 4 && y >= 2 && y <= 4 && x < 7 && y < 7;
            const outerFinderTR = (x === qrSize - 7 || x === qrSize - 1 || y === 0 || y === 6) && x > qrSize - 8 && y < 7;
            const innerFinderTR = x >= qrSize - 5 && x <= qrSize - 3 && y >= 2 && y <= 4 && x > qrSize - 8 && y < 7;
            const outerFinderBL = (x === 0 || x === 6 || y === qrSize - 7 || y === qrSize - 1) && x < 7 && y > qrSize - 8;
            const innerFinderBL = x >= 2 && x <= 4 && y >= qrSize - 5 && y <= qrSize - 3 && x < 7 && y > qrSize - 8;
            
            matrix[y][x] = (outerFinder || innerFinder || outerFinderTR || innerFinderTR || outerFinderBL || innerFinderBL) ? 1 : 0;
          } else if (x === 0 || y === 0 || x === qrSize - 1 || y === qrSize - 1) {
            matrix[y][x] = (x + y) % 2 === 0 ? 1 : 0;
          } else {
            matrix[y][x] = seededRandom() > 0.5 ? 1 : 0;
          }
        }
      }
      
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      const cellSize = size / qrSize;
      const padding = cellSize * 0.5;
      
      // White background with rounded corners
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(padding, padding, size - padding * 2, size - padding * 2, cellSize);
      ctx.fill();
      
      // Draw QR modules
      ctx.fillStyle = '#1a1a2e';
      for (let y = 0; y < qrSize; y++) {
        for (let x = 0; x < qrSize; x++) {
          if (matrix[y][x]) {
            const cellX = padding + x * cellSize;
            const cellY = padding + y * cellSize;
            ctx.fillRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
          }
        }
      }
      
      resolve();
    });
  };

  // Generate complete card image
  const generateCardImage = async () => {
    const fullName = `${userData.first_name} ${userData.last_name}`.trim() || userData.email?.split('@')[0] || 'User';
    const address = [userData.address_line1, userData.city, userData.state, userData.postal_code, userData.country]
      .filter(Boolean).join(', ') || 'No address provided';
    
    // Create main canvas for the card
    const cardWidth = 860;
    const cardHeight = 480;
    const canvas = document.createElement('canvas');
    canvas.width = cardWidth;
    canvas.height = cardHeight;
    const ctx = canvas.getContext('2d');
    
    // Card background - premium dark gradient like Visa Infinite cards
    const bgGradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
    bgGradient.addColorStop(0, '#0a0a1a');
    bgGradient.addColorStop(0.3, '#12122a');
    bgGradient.addColorStop(0.6, '#1a1a3e');
    bgGradient.addColorStop(1, '#0d0d25');
    
    // Draw rounded card
    ctx.beginPath();
    ctx.roundRect(0, 0, cardWidth, cardHeight, 24);
    ctx.fillStyle = bgGradient;
    ctx.fill();
    
    // Subtle grid pattern overlay
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < cardWidth; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cardHeight);
      ctx.stroke();
    }
    for (let y = 0; y < cardHeight; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cardWidth, y);
      ctx.stroke();
    }
    ctx.restore();
    
    // Decorative geometric shapes
    ctx.save();
    ctx.globalAlpha = 0.08;
    // Large circle top-right
    const circleGradient1 = ctx.createRadialGradient(cardWidth - 100, 100, 0, cardWidth - 100, 100, 200);
    circleGradient1.addColorStop(0, '#6366f1');
    circleGradient1.addColorStop(1, 'transparent');
    ctx.fillStyle = circleGradient1;
    ctx.beginPath();
    ctx.arc(cardWidth - 80, 80, 180, 0, Math.PI * 2);
    ctx.fill();
    
    // Large circle bottom-left
    const circleGradient2 = ctx.createRadialGradient(120, cardHeight - 120, 0, 120, cardHeight - 120, 200);
    circleGradient2.addColorStop(0, '#8b5cf6');
    circleGradient2.addColorStop(1, 'transparent');
    ctx.fillStyle = circleGradient2;
    ctx.beginPath();
    ctx.arc(100, cardHeight - 100, 160, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Top accent line
    const accentGradient = ctx.createLinearGradient(0, 0, cardWidth, 0);
    accentGradient.addColorStop(0, '#6366f1');
    accentGradient.addColorStop(0.5, '#8b5cf6');
    accentGradient.addColorStop(1, '#a78bfa');
    ctx.fillStyle = accentGradient;
    ctx.fillRect(0, 0, cardWidth, 4);
    
    // Logo section - JABIYEN
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Manrope", "Inter", sans-serif';
    ctx.fillText('JABIYEN', 40, 65);
    
    // Small tagline under logo
    ctx.font = '500 11px "Inter", sans-serif';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('CARD AUTH', 40, 85);
    
    // Chip icon (simplified)
    ctx.fillStyle = '#c9a84c';
    ctx.beginPath();
    ctx.roundRect(40, 105, 50, 38, 6);
    ctx.fill();
    ctx.fillStyle = '#b8942e';
    ctx.beginPath();
    ctx.roundRect(48, 110, 34, 28, 3);
    ctx.fill();
    // Chip lines
    ctx.strokeStyle = '#d4b85c';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(52, 116 + i * 8);
      ctx.lineTo(78, 116 + i * 8);
      ctx.stroke();
    }
    
    // Contactless icon
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const waves = [
      { x: 120, r: 10 },
      { x: 135, r: 14 },
      { x: 150, r: 18 }
    ];
    waves.forEach(w => {
      ctx.beginPath();
      ctx.arc(w.x, 124, w.r, Math.PI * 0.7, Math.PI * 1.3);
      ctx.stroke();
    });
    ctx.restore();
    
    // Card number display (masked style)
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 24px "Courier New", monospace';
    ctx.fillText('••••  ••••  ••••  ' + (userData.phone?.slice(-4) || '1320'), 40, 210);
    
    // Card type label
    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('JABIYEN AUTH CARD', 40, 185);
    ctx.restore();
    
    // User info section
    ctx.save();
    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillText(fullName.toUpperCase(), 40, 270);
    
    // Email
    ctx.font = '500 13px "Inter", sans-serif';
    ctx.fillStyle = '#a0a0c0';
    ctx.fillText(userData.email || '', 40, 295);
    
    // Address
    ctx.font = '500 12px "Inter", sans-serif';
    ctx.fillStyle = '#8080a0';
    ctx.fillText(address.length > 50 ? address.substring(0, 47) + '...' : address, 40, 318);
    
    // Member since
    ctx.fillText('Member since ' + formatDate(userData.created_at), 40, 340);
    ctx.restore();
    
    // QR Code section (right side)
    const qrSize = 170;
    const qrX = cardWidth - qrSize - 50;
    const qrY = 100;
    
    // QR background container
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 70, 16);
    ctx.fill();
    
    // QR label
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.fillText('SCAN TO LOGIN', qrX + qrSize / 2 - 45, qrY + qrSize + 35);
    ctx.font = '500 9px "Inter", sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('jabiyen.com/auth', qrX + qrSize / 2 - 35, qrY + qrSize + 52);
    ctx.restore();
    
    // Generate QR code
    const qrCanvas = document.createElement('canvas');
    const qrData = JSON.stringify({
      email: userData.email,
      password: qrPassword
    });
    await generateQRCodeOnCanvas(qrCanvas, qrData, qrSize);
    
    // Draw QR code on card
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    
    // Bottom bar
    ctx.save();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.fillRect(0, cardHeight - 50, cardWidth, 50);
    
    // Bottom text
    ctx.fillStyle = '#a0a0c0';
    ctx.font = '500 10px "Inter", sans-serif';
    ctx.fillText('This card is for authentication purposes only. Keep it secure.', 40, cardHeight - 22);
    ctx.fillText('© JAYENWARE ' + new Date().getFullYear(), cardWidth - 200, cardHeight - 22);
    ctx.restore();
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    setCardDataUrl(dataUrl);
    setQrGenerated(true);
    
    // Store canvas ref for potential re-download
    cardCanvasRef.current = canvas;
  };

  // Download card image
  const downloadCard = () => {
    if (!cardDataUrl) return;

    const username = (userData.first_name + '-' + userData.last_name).toLowerCase().replace(/[^a-z0-9]/g, '-') || userData.email?.split('@')[0] || 'user';
    const link = document.createElement('a');
    link.download = `${username}-jabiyen-auth-card.png`;
    link.href = cardDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Card downloaded successfully!');
  };

  // Reset QR states when switching panels
  const handlePanelSwitch = (panel) => {
    setCurrentPanel(panel);
    if (panel !== 'card-auth') {
      setQrPassword('');
      setQrVerified(false);
      setQrGenerated(false);
      setCardDataUrl(null);
      setQrError(null);
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', color: '#fff', fontSize: 28
                  }}>
                    <i className="fa-solid fa-id-card"></i>
                  </div>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>JABIYEN Card Auth</h2>
                  <p style={{ fontSize: 14, color: '#86868b', margin: 0, lineHeight: 1.5 }}>
                    Generate your JABIYEN card for instant login.<br />
                    Verify your password to create your secure auth card.
                  </p>
                </div>

                {/* Email Display */}
                <div style={{ 
                  background: '#f8f9fa', borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20
                }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 10,
                    background: 'linear-gradient(135deg, #007aff, #005bb5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', flexShrink: 0
                  }}>
                    <i className="fa-solid fa-envelope" style={{ fontSize: 16 }}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#86868b', marginBottom: 2 }}>Your Email</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userData.email || '—'}
                    </div>
                  </div>
                  <div style={{ 
                    background: '#e8f5e9', color: '#2e7d32',
                    padding: '4px 10px', borderRadius: 50, fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0
                  }}>
                    <i className="fa-solid fa-shield-halved" style={{ fontSize: 10 }}></i>
                    AUTO-FILLED
                  </div>
                </div>

                {/* Password Input */}
                {!qrVerified && (
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
                        value={qrPassword}
                        onChange={(e) => {
                          setQrPassword(e.target.value);
                          setQrError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') verifyPasswordForQR();
                        }}
                        placeholder="Enter your password to verify"
                        style={{
                          ...inputStyle,
                          padding: '14px 16px',
                          paddingRight: 50,
                          borderColor: qrError ? '#ff3b30' : '#e5e5ea',
                          fontSize: 15,
                          borderRadius: 12
                        }}
                      />
                      <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b' }}>
                        <i className="fa-solid fa-lock" style={{ fontSize: 14 }}></i>
                      </div>
                    </div>
                    {qrError && (
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: 6, 
                        fontSize: 12, color: '#ff3b30', marginTop: 6 
                      }}>
                        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 11 }}></i>
                        <span>{qrError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Verify Button or Card Display */}
                {!qrVerified ? (
                  <button 
                    onClick={verifyPasswordForQR}
                    disabled={qrVerifying || !qrPassword}
                    style={{
                      width: '100%', padding: '14px 24px',
                      background: qrVerifying || !qrPassword ? '#a1a1a6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff', fontFamily: "'Inter', sans-serif",
                      fontSize: 15, fontWeight: 600, border: 'none',
                      borderRadius: 12, cursor: qrVerifying || !qrPassword ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      transition: 'all 0.3s ease',
                      boxShadow: qrVerifying || !qrPassword ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)'
                    }}
                  >
                    {qrVerifying ? (
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
                      Your JABIYEN Auth Card is ready!
                    </div>

                    {/* Card Preview */}
                    <div style={{
                      background: '#f0f0f5', borderRadius: 20,
                      padding: '24px', textAlign: 'center',
                      marginBottom: 20,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}>
                      {cardDataUrl && (
                        <img 
                          src={cardDataUrl} 
                          alt="JABIYEN Auth Card" 
                          style={{ 
                            width: '100%', 
                            maxWidth: 500, 
                            borderRadius: 16,
                            boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
                          }} 
                        />
                      )}
                      <p style={{ fontSize: 12, color: '#86868b', marginTop: 12 }}>
                        <i className="fa-solid fa-info-circle" style={{ marginRight: 4 }}></i>
                        This card contains your encrypted login credentials in the QR code
                      </p>
                    </div>

                    {/* Download & Reset Buttons */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={downloadCard}
                        disabled={!cardDataUrl}
                        style={{
                          flex: 1, padding: '14px 20px',
                          background: cardDataUrl ? '#1d1d1f' : '#a1a1a6',
                          color: '#fff', fontFamily: "'Inter', sans-serif",
                          fontSize: 15, fontWeight: 600, border: 'none',
                          borderRadius: 12, cursor: cardDataUrl ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <i className="fa-solid fa-download"></i>
                        Download Card
                      </button>
                      <button
                        onClick={() => {
                          setQrVerified(false);
                          setQrGenerated(false);
                          setQrPassword('');
                          setCardDataUrl(null);
                          setQrError(null);
                          cardCanvasRef.current = null;
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
                        Generate New Card
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
                    <strong style={{ color: '#e65100' }}>Security Note:</strong> This card contains your login credentials encrypted in the QR code. Keep it secure and do not share it with anyone. Use it with JABIYEN Card Auth for instant, secure login.
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
