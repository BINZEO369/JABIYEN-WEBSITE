'use client';

import { useState, useEffect, useCallback } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import Head from 'next/head';
import { useRouter } from 'next/navigation';

function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateString; }
}

// ===================== MAIN ACCOUNT PAGE =====================
export default function Account() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPanel, setCurrentPanel] = useState('profile');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [passkeyWorking, setPasskeyWorking] = useState(false);
  const [passkeyMessage, setPasskeyMessage] = useState(null);

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
          if (accessToken) {
            localStorage.setItem('jayenware_session', JSON.stringify({
              access_token: accessToken,
              refresh_token: params.get('refresh_token'),
              expires_at: params.get('expires_at')
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
      const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
      const [profileRes, addressesRes] = await Promise.all([
        fetch('/api/user/profile', { headers }),
        fetch('/api/user/addresses', { headers })
      ]);
      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          localStorage.removeItem('jayenware_session');
          setError('Session expired. Please sign in again.');
          setLoading(false);
          return;
        }
        throw new Error('Failed to load');
      }
      if (!addressesRes.ok) throw new Error('Central Auth address service is unavailable');
      const result = await profileRes.json();
      const payload = result.data || result;
      const profile = payload.profile || {};
      const user = payload.user || {};
      const addressPayload = await addressesRes.json();
      const addresses = addressPayload.data?.addresses || addressPayload.addresses || [];
      const address = addresses.find(item => item.is_primary) || addresses[0] || {};
      void fetch('/api/project-access/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ project_key: 'jabiyen', client_key: 'website', event_type: 'profile_synced', outcome: 'success', metadata: { source: 'jabiyen-website-account' } })
      }).catch(() => {});
      const metadata = user.user_metadata || {};
      const appMetadata = user.app_metadata || {};
      setUserData({
        email: user.email || profile.email || '',
        first_name: profile.first_name || metadata.first_name || metadata.full_name?.split(' ')[0] || '',
        last_name: profile.last_name || metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || '',
        phone: user.phone || metadata.phone || '',
        avatar_url: profile.profile_photo_url || metadata.avatar_url || metadata.picture || '',
        provider: profile.provider || appMetadata.provider || 'email',
        address_line1: address.address_line_1 || '',
        address_line2: address.address_line_2 || '',
        city: address.city || '',
        state: address.state_province || '',
        postal_code: address.postal_code || '',
        country: address.country_code || '',
        created_at: profile.created_at || user.created_at || '',
        updated_at: profile.updated_at || user.updated_at || ''
      });
    } catch (e) {
      setError('Failed to load account data.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchUserData();
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void fetchUserData();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [fetchUserData]);

  const handleLogout = async () => {
    try {
      const token = getToken();
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (e) {}
    localStorage.removeItem('jayenware_session');
    router.push('/');
  };

  const registerPasskey = async () => {
    const token = getToken();
    if (!token) {
      setPasskeyMessage({ type: 'error', text: 'Your session has expired. Sign in again before adding a passkey.' });
      return;
    }
    setPasskeyWorking(true);
    setPasskeyMessage(null);
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    try {
      const optionsResponse = await fetch('/api/user/passkeys', { method: 'POST', headers, body: JSON.stringify({}) });
      const optionsResult = await optionsResponse.json();
      if (!optionsResponse.ok) throw new Error(optionsResult.error?.message || 'Passkey setup could not start.');
      const options = optionsResult.data || optionsResult;
      const response = await startRegistration({ optionsJSON: options.options });
      const verifyResponse = await fetch('/api/user/passkeys/register', {
        method: 'POST', headers,
        body: JSON.stringify({ challenge_id: options.challenge_id, challenge: options.options.challenge, response, device_name: 'JABIYEN on this device' })
      });
      const verifyResult = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verifyResult.error?.message || 'Passkey could not be saved.');
      setPasskeyMessage({ type: 'success', text: 'Biometric sign-in is enabled for this JABIYEN website on this device.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Passkey setup was cancelled.';
      setPasskeyMessage({ type: 'error', text: message.includes('NotAllowedError') ? 'The biometric prompt was cancelled or not approved.' : message });
    } finally {
      setPasskeyWorking(false);
    }
  };

  const getInitials = () => {
    const f = userData?.first_name?.charAt(0) || '';
    const l = userData?.last_name?.charAt(0) || '';
    const initials = (f + l).toUpperCase();
    if (initials) return initials;
    return userData?.email?.charAt(0).toUpperCase() || 'U';
  };

  const fullName = `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || userData?.email?.split('@')[0] || 'User';
  const handlePanelSwitch = (panel) => setCurrentPanel(panel);

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
        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 48, color: '#dc2626', marginBottom: 16 }}></i>
        <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Failed to load account</h3>
        <p style={{ fontSize: 14, color: '#71717a' }}>{error}</p>
        <button onClick={() => router.push('/auth/signin')} style={{ marginTop: 16, padding: '10px 24px', background: '#0f0f0f', color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Go to Sign In</button>
      </div>
    );
  }

  const isGoogleUser = userData.provider === 'google' || (userData.provider !== 'email' && userData.avatar_url);
  const loginMethod = userData.provider === 'google' ? 'Google' : userData.provider === 'azure' ? 'Microsoft' : userData.provider !== 'email' ? userData.provider?.charAt(0).toUpperCase() + userData.provider?.slice(1) : 'Email & Password';

  return (
    <>
      <Head>
        <title>My Account | JAYENWARE</title>
        <meta name="description" content="Manage your JAYENWARE account" />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <div style={{ 
        maxWidth: 900, 
        margin: '0 auto', 
        padding: 'clamp(60px, 10vw, 100px) 16px 48px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 5vw, 40px)' }}>
          <h1 style={{ 
            fontFamily: "var(--font-heading), 'Manrope', sans-serif", 
            fontSize: 'clamp(24px, 5vw, 40px)', 
            fontWeight: 800, 
            color: '#0f0f0f', 
            margin: '0 0 6px',
            wordBreak: 'break-word'
          }}>My Account</h1>
          <p style={{ fontSize: 'clamp(13px, 2vw, 15px)', color: '#71717a', margin: 0 }}>Welcome back, {userData.first_name || 'User'}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Navigation Buttons */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 16, 
            padding: 'clamp(12px, 3vw, 16px)', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)', 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 8, 
            justifyContent: 'center' 
          }}>
            {[
              { key: 'profile', icon: 'user', label: 'Profile' },
              { key: 'addresses', icon: 'location-dot', label: 'Location' },
              { key: 'security', icon: 'fingerprint', label: 'Biometric Sign-In' }
            ].map(panel => (
              <button key={panel.key} onClick={() => handlePanelSwitch(panel.key)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 600, fontFamily: "'Inter', sans-serif",
                border: 'none', flex: '1 1 auto', minWidth: 100,
                background: currentPanel === panel.key ? '#0f0f0f' : '#f5f5f7',
                color: currentPanel === panel.key ? '#fff' : '#0f0f0f',
                transition: 'all 0.25s ease'
              }}>
                <i className={`fa-solid fa-${panel.icon}`} style={{ fontSize: 'clamp(13px, 2vw, 15px)' }}></i>
                {panel.label}
              </button>
            ))}
            <button onClick={() => setShowLogoutModal(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
              fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 600, fontFamily: "'Inter', sans-serif",
              border: 'none', flex: '1 1 auto', minWidth: 100,
              background: '#fef2f2', color: '#dc2626'
            }}>
              <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 'clamp(13px, 2vw, 15px)' }}></i> Sign Out
            </button>
          </div>

          <div style={{ minHeight: 400 }}>
            {/* Profile Panel */}
            {currentPanel === 'profile' && (
              <div>
                <div style={{ 
                  background: '#fff', 
                  borderRadius: 16, 
                  padding: 'clamp(20px, 4vw, 32px) clamp(16px, 3vw, 24px)', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)', 
                  textAlign: 'center', 
                  marginBottom: 20 
                }}>
                  {userData.avatar_url ? (
                    <img src={userData.avatar_url} alt={fullName} style={{ 
                      width: 'clamp(60px, 10vw, 80px)', 
                      height: 'clamp(60px, 10vw, 80px)', 
                      borderRadius: '50%', 
                      objectFit: 'cover', 
                      margin: '0 auto clamp(12px, 2vw, 16px)', 
                      border: '3px solid #f0f0f0' 
                    }} />
                  ) : (
                    <div style={{ 
                      width: 'clamp(60px, 10vw, 80px)', 
                      height: 'clamp(60px, 10vw, 80px)', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #007aff, #5856d6)', 
                      color: '#fff', 
                      fontSize: 'clamp(22px, 4vw, 28px)', 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto clamp(12px, 2vw, 16px)', 
                      fontFamily: "'Manrope', sans-serif" 
                    }}>{getInitials()}</div>
                  )}
                  <h3 style={{ 
                    fontFamily: "'Manrope', sans-serif", 
                    fontSize: 'clamp(18px, 3vw, 22px)', 
                    fontWeight: 700, 
                    margin: '0 0 4px',
                    wordBreak: 'break-word' 
                  }}>{fullName}</h3>
                  <p style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: '#71717a', margin: 0, wordBreak: 'break-word' }}>{userData.email}</p>
                  <div style={{ 
                    marginTop: 12, 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    background: isGoogleUser ? '#e8f0fe' : '#f5f5f7', 
                    padding: '4px 12px', 
                    borderRadius: 50, 
                    fontSize: 'clamp(10px, 1.5vw, 11px)', 
                    fontWeight: 600, 
                    color: '#71717a' 
                  }}>
                    {isGoogleUser ? (
                      <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    ) : (
                      <i className="fa-solid fa-envelope" style={{ fontSize: 11 }}></i>
                    )}
                    Signed in with {loginMethod}
                  </div>
                </div>

                <div style={{ 
                  background: '#fff', 
                  borderRadius: 16, 
                  padding: 'clamp(16px, 3vw, 24px)', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)', 
                  marginBottom: 20 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 20,
                    flexWrap: 'wrap',
                    gap: 10 
                  }}>
                    <h2 style={{ 
                      fontFamily: "'Manrope', sans-serif", 
                      fontSize: 'clamp(16px, 2.5vw, 18px)', 
                      fontWeight: 700, 
                      margin: 0 
                    }}>Personal Information</h2>
                    <span style={{ fontSize: 12, color: '#71717a' }}>Managed by Central Auth</span>
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '16px 24px' 
                  }}>
                    <>
                      <InfoField label="First Name"><span>{userData.first_name || '—'}</span></InfoField>
                      <InfoField label="Last Name"><span>{userData.last_name || '—'}</span></InfoField>
                      <InfoField label="Phone"><span>{userData.phone || '—'}</span></InfoField>
                      <InfoField label="Email"><span>{userData.email || '—'}</span></InfoField>
                    </>
                  </div>
                </div>

                <div style={{ 
                  background: '#fff', 
                  borderRadius: 16, 
                  padding: 'clamp(16px, 3vw, 24px)', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)' 
                }}>
                  <h2 style={{ 
                    fontFamily: "'Manrope', sans-serif", 
                    fontSize: 'clamp(16px, 2.5vw, 18px)', 
                    fontWeight: 700, 
                    margin: '0 0 20px' 
                  }}>Account Details</h2>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '16px 24px' 
                  }}>
                    <InfoField label="Member Since"><span>{formatDate(userData.created_at)}</span></InfoField>
                    <InfoField label="Last Updated"><span>{formatDate(userData.updated_at)}</span></InfoField>
                    <InfoField label="Login Method"><span>{loginMethod}</span></InfoField>
                  </div>
                </div>
              </div>
            )}

            {/* Address Panel */}
            {currentPanel === 'addresses' && (
              <div style={{ 
                background: '#fff', 
                borderRadius: 16, 
                padding: 'clamp(16px, 3vw, 24px)', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)', 
                border: '1.5px solid #007aff', 
                position: 'relative' 
              }}>
                <span style={{ 
                  position: 'absolute', 
                  top: 12, 
                  right: 12, 
                  background: '#007aff', 
                  color: '#fff', 
                  fontSize: 'clamp(8px, 1.5vw, 10px)', 
                  fontWeight: 700, 
                  padding: '3px 10px', 
                  borderRadius: 50, 
                  textTransform: 'uppercase' 
                }}>Primary</span>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 24,
                  flexWrap: 'wrap',
                  gap: 10 
                }}>
                  <h2 style={{ 
                    fontFamily: "'Manrope', sans-serif", 
                    fontSize: 'clamp(16px, 2.5vw, 18px)', 
                    fontWeight: 700, 
                    margin: 0 
                  }}>Saved Location</h2>
                    <span style={{ fontSize: 12, color: '#71717a' }}>Managed by Central Auth</span>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '16px 24px' 
                }}>
                    <>
                      <InfoField label="Address Line 1"><span>{userData.address_line1 || '—'}</span></InfoField>
                      <InfoField label="Address Line 2"><span>{userData.address_line2 || '—'}</span></InfoField>
                      <InfoField label="City"><span>{userData.city || '—'}</span></InfoField>
                      <InfoField label="State / Province"><span>{userData.state || '—'}</span></InfoField>
                      <InfoField label="Postal Code"><span>{userData.postal_code || '—'}</span></InfoField>
                      <InfoField label="Country"><span>{userData.country || '—'}</span></InfoField>
                    </>
                    <p style={{ gridColumn: '1 / -1', margin: '4px 0 0', fontSize: 12, color: '#71717a' }}>
                      Location details are read directly from Central Auth. Update them only in your Central Auth account.
                    </p>
                </div>
              </div>
            )}

            {/* Biometric Sign-In Panel */}
            {currentPanel === 'security' && (
              <section style={{ background: '#fff', borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Biometric sign-in</h2>
                <p style={{ fontSize: 14, color: '#71717a', lineHeight: 1.6, margin: '0 0 18px' }}>
                  Add a device passkey for this JABIYEN website using fingerprint, Face ID, Windows Hello, or your device screen lock. Your biometric data stays on your device.
                </p>
                <div style={{ borderRadius: 12, background: '#f5f5f7', padding: 14, fontSize: 12, color: '#555', lineHeight: 1.55, marginBottom: 18 }}>
                  Passkeys are scoped to a website by browser security. A passkey registered on Central Auth may need a separate enrollment for JABIYEN.
                </div>
                <button type="button" onClick={registerPasskey} disabled={passkeyWorking} style={{ border: 0, borderRadius: 12, padding: '13px 18px', background: passkeyWorking ? '#888' : '#0f0f0f', color: '#fff', fontWeight: 600, cursor: passkeyWorking ? 'wait' : 'pointer' }}>
                  {passkeyWorking ? 'Waiting for device verification…' : 'Enable biometric sign-in on this device'}
                </button>
                {passkeyMessage && <p role="status" style={{ margin: '14px 0 0', fontSize: 13, color: passkeyMessage.type === 'success' ? '#047857' : '#b91c1c' }}>{passkeyMessage.text}</p>}
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div onClick={() => setShowLogoutModal(false)} style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.4)', 
          backdropFilter: 'blur(4px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999,
          padding: 16
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ 
            background: '#fff', 
            borderRadius: 24, 
            padding: 'clamp(28px, 5vw, 40px) clamp(20px, 4vw, 32px)', 
            textAlign: 'center', 
            maxWidth: 420, 
            width: '100%', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)' 
          }}>
            <div style={{ 
              width: 'clamp(60px, 10vw, 80px)', 
              height: 'clamp(60px, 10vw, 80px)', 
              background: '#fef2f2', 
              color: '#dc2626', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: 'clamp(28px, 5vw, 36px)', 
              margin: '0 auto clamp(16px, 3vw, 24px)' 
            }}><i className="fa-solid fa-power-off"></i></div>
            <h2 style={{ 
              fontFamily: "'Manrope', sans-serif", 
              fontSize: 'clamp(20px, 3vw, 24px)', 
              fontWeight: 800, 
              margin: '0 0 12px' 
            }}>Sign Out</h2>
            <p style={{ 
              fontSize: 'clamp(13px, 2vw, 15px)', 
              color: '#71717a', 
              margin: '0 0 clamp(24px, 4vw, 32px)' 
            }}>Are you sure you want to sign out?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ 
                flex: 1, 
                padding: '14px 20px', 
                borderRadius: 12, 
                fontSize: 'clamp(13px, 2vw, 15px)', 
                fontWeight: 600, 
                fontFamily: "'Inter', sans-serif", 
                cursor: 'pointer', 
                border: 'none', 
                background: '#f4f4f5', 
                color: '#0f0f0f' 
              }}>Cancel</button>
              <button onClick={handleLogout} style={{ 
                flex: 1, 
                padding: '14px 20px', 
                borderRadius: 12, 
                fontSize: 'clamp(13px, 2vw, 15px)', 
                fontWeight: 600, 
                fontFamily: "'Inter', sans-serif", 
                cursor: 'pointer', 
                border: 'none', 
                background: '#dc2626', 
                color: '#fff' 
              }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes shimmer { 
          0% { background-position: -200% 0; } 
          100% { background-position: 200% 0; } 
        }
        
      `}</style>
    </>
  );
}

function InfoField({ label, children }) {
  return (
    <div>
      <label style={{ 
        display: 'block', 
        fontSize: 'clamp(10px, 1.5vw, 11px)', 
        fontWeight: 600, 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em', 
        color: '#71717a', 
        marginBottom: 6 
      }}>{label}</label>
      <div style={{ 
        fontSize: 'clamp(13px, 2vw, 15px)', 
        color: '#0f0f0f', 
        fontWeight: 500, 
        minHeight: 22,
        wordBreak: 'break-word' 
      }}>{children}</div>
    </div>
  );
}
