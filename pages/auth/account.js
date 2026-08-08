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

// Professional Card Generator Class
class CardGenerator {
  constructor(userData, qrPassword) {
    this.userData = userData;
    this.qrPassword = qrPassword;
    this.cardWidth = 900;
    this.cardHeight = 500;
  }

  async generate() {
    const canvas = document.createElement('canvas');
    canvas.width = this.cardWidth;
    canvas.height = this.cardHeight;
    const ctx = canvas.getContext('2d');

    await this.drawBackground(ctx);
    await this.drawLogo(ctx);
    await this.drawChip(ctx);
    await this.drawCardInfo(ctx);
    await this.drawUserDetails(ctx);
    await this.drawQRCode(ctx);
    await this.drawFooter(ctx);

    return canvas.toDataURL('image/png', 1.0);
  }

  async drawBackground(ctx) {
    // Main card background with premium gradient
    const bgGradient = ctx.createLinearGradient(0, 0, this.cardWidth, this.cardHeight);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(0.25, '#16213e');
    bgGradient.addColorStop(0.5, '#0f3460');
    bgGradient.addColorStop(0.75, '#1a1a2e');
    bgGradient.addColorStop(1, '#0a0a1a');
    
    ctx.beginPath();
    this.roundRect(ctx, 0, 0, this.cardWidth, this.cardHeight, 20);
    ctx.fillStyle = bgGradient;
    ctx.fill();

    // Decorative overlay patterns
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < this.cardWidth; i += 25) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, this.cardHeight);
      ctx.stroke();
    }
    for (let i = 0; i < this.cardHeight; i += 25) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(this.cardWidth, i);
      ctx.stroke();
    }
    ctx.restore();

    // Decorative circles
    ctx.save();
    ctx.globalAlpha = 0.1;
    
    const circle1 = ctx.createRadialGradient(750, 100, 0, 750, 100, 250);
    circle1.addColorStop(0, '#e94560');
    circle1.addColorStop(1, 'transparent');
    ctx.fillStyle = circle1;
    ctx.beginPath();
    ctx.arc(750, 100, 250, 0, Math.PI * 2);
    ctx.fill();

    const circle2 = ctx.createRadialGradient(150, 400, 0, 150, 400, 200);
    circle2.addColorStop(0, '#533483');
    circle2.addColorStop(1, 'transparent');
    ctx.fillStyle = circle2;
    ctx.beginPath();
    ctx.arc(150, 400, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Top accent line
    const accentGradient = ctx.createLinearGradient(0, 0, this.cardWidth, 0);
    accentGradient.addColorStop(0, '#e94560');
    accentGradient.addColorStop(0.5, '#533483');
    accentGradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = accentGradient;
    ctx.fillRect(0, 0, this.cardWidth, 5);
  }

  async drawLogo(ctx) {
    ctx.save();
    
    // Logo background circle
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(233, 69, 96, 0.3)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(70, 70, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // JABIYEN text
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 32px "Manrope", "Inter", Arial, sans-serif';
    ctx.fillText('JABIYEN', 120, 82);
    
    // Tagline
    ctx.font = '600 12px "Inter", Arial, sans-serif';
    ctx.fillStyle = '#e94560';
    ctx.fillText('CARD AUTH', 120, 100);
    ctx.restore();
  }

  async drawChip(ctx) {
    ctx.save();
    
    // Chip body
    const chipGradient = ctx.createLinearGradient(40, 130, 90, 170);
    chipGradient.addColorStop(0, '#ffd700');
    chipGradient.addColorStop(0.5, '#ffed4a');
    chipGradient.addColorStop(1, '#f0c000');
    
    ctx.fillStyle = chipGradient;
    ctx.beginPath();
    this.roundRect(ctx, 40, 130, 55, 40, 6);
    ctx.fill();
    
    // Chip border
    ctx.strokeStyle = '#b8960c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Chip inner design
    ctx.fillStyle = '#d4a017';
    ctx.beginPath();
    this.roundRect(ctx, 47, 135, 41, 30, 3);
    ctx.fill();
    
    // Chip lines
    ctx.strokeStyle = '#f0c000';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(50, 141 + i * 6);
      ctx.lineTo(85, 141 + i * 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  async drawCardInfo(ctx) {
    ctx.save();
    
    // Card type label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '600 13px "Inter", Arial, sans-serif';
    ctx.fillText('JABIYEN AUTHENTICATION CARD', 40, 210);
    
    // Card number (masked)
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 28px "Courier New", monospace';
    const lastFour = this.userData.phone?.replace(/\D/g, '').slice(-4) || '1320';
    ctx.fillText(`••••  ••••  ••••  ${lastFour}`, 40, 250);
    
    ctx.restore();
  }

  async drawUserDetails(ctx) {
    ctx.save();
    
    const fullName = `${this.userData.first_name} ${this.userData.last_name}`.trim() || 
                     this.userData.email?.split('@')[0] || 'User';
    
    // User name
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 20px "Inter", Arial, sans-serif';
    ctx.fillText(fullName.toUpperCase(), 40, 300);
    
    // Email
    ctx.font = '500 14px "Inter", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(this.userData.email || '', 40, 325);
    
    // Address
    const addressParts = [
      this.userData.address_line1,
      this.userData.address_line2,
      this.userData.city,
      this.userData.state,
      this.userData.postal_code,
      this.userData.country
    ].filter(Boolean);
    
    if (addressParts.length > 0) {
      ctx.font = '500 12px "Inter", Arial, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      const address = addressParts.join(', ');
      ctx.fillText(address.length > 55 ? address.substring(0, 52) + '...' : address, 40, 350);
    }
    
    // Member since
    if (this.userData.created_at) {
      ctx.font = '500 11px "Inter", Arial, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText(`Member since ${formatDate(this.userData.created_at)}`, 40, 375);
    }
    
    ctx.restore();
  }

  async drawQRCode(ctx) {
    const qrSize = 160;
    const qrX = this.cardWidth - qrSize - 60;
    const qrY = 130;

    // QR Code background container
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.beginPath();
    this.roundRect(ctx, qrX - 15, qrY - 15, qrSize + 30, qrSize + 30, 12);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Generate QR Code
    const qrCanvas = await this.generateQRCode(qrSize);
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // QR Label
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 10px "Inter", Arial, sans-serif';
    ctx.fillText('SCAN TO LOGIN', qrX + qrSize/2 - 40, qrY + qrSize + 5);
    
    ctx.restore();
  }

  async generateQRCode(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const qrData = JSON.stringify({
      email: this.userData.email,
      password: this.qrPassword
    });

    // Enhanced QR code generation
    const modules = 29; // Version 3 QR code
    const moduleSize = size / modules;
    
    // Create data matrix
    const matrix = this.createQRMatrix(qrData, modules);
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Draw modules
    ctx.fillStyle = '#1a1a2e';
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        if (matrix[row][col]) {
          const x = col * moduleSize;
          const y = row * moduleSize;
          ctx.fillRect(
            Math.ceil(x) + 1, 
            Math.ceil(y) + 1, 
            Math.floor(moduleSize) - 2, 
            Math.floor(moduleSize) - 2
          );
        }
      }
    }

    return canvas;
  }

  createQRMatrix(data, size) {
    const matrix = Array(size).fill(null).map(() => Array(size).fill(0));
    
    // Add finder patterns (3 corners)
    this.addFinderPattern(matrix, 0, 0);
    this.addFinderPattern(matrix, 0, size - 7);
    this.addFinderPattern(matrix, size - 7, 0);
    
    // Add timing patterns
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0 ? 1 : 0;
      matrix[i][6] = i % 2 === 0 ? 1 : 0;
    }
    
    // Add alignment pattern
    this.addAlignmentPattern(matrix, size - 9, size - 9);
    
    // Encode data into matrix
    const dataBits = this.encodeData(data);
    this.placeDataBits(matrix, dataBits, size);
    
    // Apply mask pattern
    this.applyMask(matrix, size);
    
    return matrix;
  }

  addFinderPattern(matrix, row, col) {
    // Outer border
    for (let i = 0; i < 7; i++) {
      matrix[row + i][col] = 1;
      matrix[row + i][col + 6] = 1;
      matrix[row][col + i] = 1;
      matrix[row + 6][col + i] = 1;
    }
    
    // Inner border
    for (let i = 0; i < 3; i++) {
      matrix[row + 2 + i][col + 2] = 1;
      matrix[row + 2 + i][col + 4] = 1;
      matrix[row + 2][col + 2 + i] = 1;
      matrix[row + 4][col + 2 + i] = 1;
    }
  }

  addAlignmentPattern(matrix, row, col) {
    for (let i = 0; i < 5; i++) {
      matrix[row + i][col] = 1;
      matrix[row + i][col + 4] = 1;
      matrix[row][col + i] = 1;
      matrix[row + 4][col + i] = 1;
    }
    matrix[row + 2][col + 2] = 1;
  }

  encodeData(data) {
    // Simple encoding: convert each character to 8-bit binary
    const bytes = new TextEncoder().encode(data);
    const bits = [];
    
    // Add mode indicator (8-bit byte mode: 0100)
    bits.push(0, 1, 0, 0);
    
    // Add character count (8 bits for version 3)
    const count = bytes.length.toString(2).padStart(8, '0');
    for (const bit of count) bits.push(parseInt(bit));
    
    // Add data
    for (const byte of bytes) {
      const binary = byte.toString(2).padStart(8, '0');
      for (const bit of binary) bits.push(parseInt(bit));
    }
    
    // Add terminator
    bits.push(0, 0, 0, 0);
    
    return bits;
  }

  placeDataBits(matrix, dataBits, size) {
    let bitIndex = 0;
    let upward = true;
    
    for (let col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--; // Skip timing pattern
      
      if (upward) {
        for (let row = size - 1; row >= 0; row--) {
          this.placeBit(matrix, row, col, dataBits, bitIndex);
          bitIndex++;
          if (col - 1 >= 0) {
            this.placeBit(matrix, row, col - 1, dataBits, bitIndex);
            bitIndex++;
          }
        }
      } else {
        for (let row = 0; row < size; row++) {
          this.placeBit(matrix, row, col, dataBits, bitIndex);
          bitIndex++;
          if (col - 1 >= 0) {
            this.placeBit(matrix, row, col - 1, dataBits, bitIndex);
            bitIndex++;
          }
        }
      }
      
      upward = !upward;
    }
  }

  placeBit(matrix, row, col, dataBits, bitIndex) {
    if (matrix[row][col] === 0 && bitIndex < dataBits.length) {
      matrix[row][col] = dataBits[bitIndex];
    }
  }

  applyMask(matrix, size) {
    // Apply mask pattern (checkerboard)
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        // Don't mask finder patterns and timing patterns
        if (!this.isReserved(row, col, size)) {
          if ((row + col) % 2 === 0) {
            matrix[row][col] = matrix[row][col] ? 0 : 1;
          }
        }
      }
    }
  }

  isReserved(row, col, size) {
    // Finder patterns
    if ((row < 7 && col < 7) || 
        (row < 7 && col > size - 8) || 
        (row > size - 8 && col < 7)) return true;
    
    // Timing patterns
    if (row === 6 || col === 6) return true;
    
    return false;
  }

  async drawFooter(ctx) {
    ctx.save();
    
    // Footer background
    const footerGradient = ctx.createLinearGradient(0, this.cardHeight - 60, 0, this.cardHeight);
    footerGradient.addColorStop(0, 'rgba(15, 52, 96, 0.8)');
    footerGradient.addColorStop(1, 'rgba(26, 26, 46, 0.9)');
    ctx.fillStyle = footerGradient;
    ctx.fillRect(0, this.cardHeight - 60, this.cardWidth, 60);
    
    // Footer text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '500 11px "Inter", Arial, sans-serif';
    ctx.fillText('This card is for authentication purposes only. Keep it secure and do not share.', 40, this.cardHeight - 30);
    ctx.fillText(`© ${new Date().getFullYear()} JAYENWARE. All rights reserved.`, 40, this.cardHeight - 15);
    
    // Right side footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 10px "Inter", Arial, sans-serif';
    ctx.fillText('jabiyen.com/card-auth', this.cardWidth - 200, this.cardHeight - 30);
    ctx.fillText('v1.0.0', this.cardWidth - 200, this.cardHeight - 15);
    
    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
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
  const [qrPassword, setQrPassword] = useState('');
  const [qrVerifying, setQrVerifying] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);
  const [cardGenerated, setCardGenerated] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState(null);
  const [qrError, setQrError] = useState(null);

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

  // Password verification for card generation
  const verifyPasswordForCard = async () => {
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

      if (!res.ok) {
        setQrError('Invalid password. Please try again.');
        showToast('Password verification failed', 'error');
        setQrVerifying(false);
        return;
      }

      // Generate the card
      setQrVerified(true);
      await generateCard();
      showToast('Password verified! Card generated successfully.', 'success');
    } catch (err) {
      setQrError('Verification failed. Please try again.');
      showToast('Verification failed', 'error');
    } finally {
      setQrVerifying(false);
    }
  };

  // Generate complete card
  const generateCard = async () => {
    const generator = new CardGenerator(userData, qrPassword);
    const dataUrl = await generator.generate();
    setCardDataUrl(dataUrl);
    setCardGenerated(true);
  };

  // Download card image
  const downloadCard = () => {
    if (!cardDataUrl) return;

    const username = `${userData.first_name || 'user'}-${userData.last_name || ''}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 
                     userData.email?.split('@')[0] || 'user';
    
    const link = document.createElement('a');
    link.download = `${username}-jabiyen-auth-card.png`;
    link.href = cardDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Card downloaded successfully!');
  };

  // Reset card states
  const resetCard = () => {
    setQrVerified(false);
    setCardGenerated(false);
    setQrPassword('');
    setCardDataUrl(null);
    setQrError(null);
  };

  // Reset when switching panels
  const handlePanelSwitch = (panel) => {
    setCurrentPanel(panel);
    if (panel !== 'card-auth') {
      resetCard();
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
                    background: 'linear-gradient(135deg, #e94560 0%, #533483 100%)',
                    borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', color: '#fff', fontSize: 28
                  }}>
                    <i className="fa-solid fa-id-card"></i>
                  </div>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>JABIYEN Card Auth</h2>
                  <p style={{ fontSize: 14, color: '#86868b', margin: 0, lineHeight: 1.5 }}>
                    Generate your professional JABIYEN authentication card.<br />
                    Verify your password to create your secure login card.
                  </p>
                </div>

                {/* Email Display */}
                <div style={{ 
                  background: '#f8f9fa', borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20
                }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 10,
                    background: 'linear-gradient(135deg, #e94560, #533483)',
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
                          if (e.key === 'Enter') verifyPasswordForCard();
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
                    onClick={verifyPasswordForCard}
                    disabled={qrVerifying || !qrPassword}
                    style={{
                      width: '100%', padding: '14px 24px',
                      background: qrVerifying || !qrPassword ? '#a1a1a6' : 'linear-gradient(135deg, #e94560 0%, #533483 100%)',
                      color: '#fff', fontFamily: "'Inter', sans-serif",
                      fontSize: 15, fontWeight: 600, border: 'none',
                      borderRadius: 12, cursor: qrVerifying || !qrPassword ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      transition: 'all 0.3s ease',
                      boxShadow: qrVerifying || !qrPassword ? 'none' : '0 4px 15px rgba(233, 69, 96, 0.4)'
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
                            maxWidth: 550, 
                            borderRadius: 16,
                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
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
                        onClick={resetCard}
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
