'use client';

import { useState, useEffect, useCallback } from 'react';
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
        provider: appMetadata.provider || profile.provider || 'email',
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

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

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
  const isGoogleUser = userData.provider === 'google' || userData.avatar_url;
  const loginMethod = isGoogleUser ? 'Google' : 'Email & Password';

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
            {['profile', 'addresses'].map(panel => (
              <button key={panel} onClick={() => setCurrentPanel(panel)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                padding: '14px 24px', borderRadius: 12, cursor: 'pointer',
                fontSize: 15, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                border: 'none', flex: 1, minWidth: 180,
                background: currentPanel === panel ? '#1d1d1f' : '#f5f5f7',
                color: currentPanel === panel ? '#fff' : '#1d1d1f',
                transition: 'all 0.25s ease'
              }}>
                <i className={`fa-solid fa-${panel === 'profile' ? 'user' : 'location-dot'}`}></i>
                {panel === 'profile' ? 'Profile' : 'Location'}
              </button>
            ))}
            <button onClick={() => setShowLogoutModal(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              padding: '14px 24px', borderRadius: 12, cursor: 'pointer',
              fontSize: 15, fontWeight: 600, fontFamily: "'Inter', sans-serif",
              border: 'none', flex: 1, minWidth: 180,
              background: '#fff0ef', color: '#ff3b30'
            }}>
              <i className="fa-solid fa-right-from-bracket"></i> Sign Out
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
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#ff3b30' : '#1d1d1f', color: '#fff', padding: '14px 24px', borderRadius: 50, fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
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
    </>
  );
}

function InfoField({ label, children }) {
  return (
    <div>
      <
