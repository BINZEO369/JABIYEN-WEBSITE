import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const SESSION_KEY = 'jayenware_session';
const CENTRAL_AUTH_URL = 'https://auth-binzeo.vercel.app';
const ACCOUNT_REQUEST_TIMEOUT_MS = 12000;

function readAccessToken() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return typeof session?.access_token === 'string' && session.access_token.length > 0
      ? session.access_token
      : null;
  } catch {
    return null;
  }
}

async function requestJson(path, options) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ACCOUNT_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(path, { ...options, signal: controller.signal });
    const payload = await response.json().catch(() => null);
    return { response, payload };
  } finally {
    window.clearTimeout(timer);
  }
}

function responseMessage(payload, fallback) {
  return payload?.error?.message || payload?.message || fallback;
}

function asDate(value) {
  if (!value) return 'Not added';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not added'
    : date.toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' });
}

function normalizeProfile(result) {
  const payload = result?.data ?? result ?? {};
  const user = payload?.user ?? {};
  const profile = payload?.profile ?? {};
  const displayName = profile.display_name || profile.full_name || '';
  const displayParts = displayName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: profile.first_name || displayParts[0] || '',
    lastName: profile.last_name || displayParts.slice(1).join(' ') || '',
    email: user.email || profile.email || '',
    phone: user.phone || profile.phone || '',
    photo: profile.profile_photo_url || profile.avatar_url || '',
    provider: user.app_metadata?.provider || user.provider || 'BINZEO Central Auth',
    createdAt: user.created_at || profile.created_at || '',
    username: profile.username || '',
    binzeoId: profile.binzeo_user_id || user.binzeo_user_id || '',
    emailVerified: Boolean(user.email_verified || user.email_confirmed_at),
  };
}

function getAddressLine(address) {
  if (!address || typeof address !== 'object') return '';
  return [address.address_line_1, address.address_line_2, address.address_line_3]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(', ');
}

// --- SVG Icons (Minimalist & Clean like the reference) ---
const Icons = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  MapPin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Shield: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>,
  LogOut: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Alert: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Copy: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
};

export default function AccountPage() {
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [refreshMessage, setRefreshMessage] = useState('');
  const [addressMessage, setAddressMessage] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const requestInFlight = useRef(false);

  const loadAccount = useCallback(async ({ quiet = false } = {}) => {
    if (requestInFlight.current) return;

    const token = readAccessToken();
    if (!token) {
      setProfile(null);
      setAddresses([]);
      setAddressMessage('');
      setStatus('signed_out');
      setMessage('Sign in through BINZEO Central Auth to view your account information.');
      return;
    }

    requestInFlight.current = true;
    if (quiet) {
      setRefreshing(true);
      setRefreshMessage('');
    } else if (!profile) {
      setStatus('loading');
      setMessage('');
    }

    const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
    try {
      const { response: profileResponse, payload: profileResult } = await requestJson('/api/me', {
        headers,
        cache: 'no-store',
        credentials: 'same-origin',
      });

      if (profileResponse.status === 401) {
        window.localStorage.removeItem(SESSION_KEY);
        setProfile(null);
        setAddresses([]);
        setStatus('signed_out');
        setMessage('Your session has expired. Sign in again through BINZEO Central Auth.');
        return;
      }
      if (!profileResponse.ok || profileResult?.success === false) {
        throw new Error(responseMessage(profileResult, profileResponse.status >= 500
          ? 'Central Auth is temporarily unavailable. Please try again shortly.'
          : 'We could not verify this session. Please sign in again.'));
      }

      const nextProfile = normalizeProfile(profileResult);
      setProfile(nextProfile);
      setStatus('connected');
      setMessage('');
      setRefreshMessage('');
      setAddressLoading(true);
      setAddressMessage('');

      try {
        const { response: addressesResponse, payload: addressResult } = await requestJson('/api/me/addresses', {
          headers,
          cache: 'no-store',
          credentials: 'same-origin',
        });

        if (!addressesResponse.ok || addressResult?.success === false) {
          const fallback = addressesResponse.status >= 500
            ? 'Your profile is connected, but saved addresses are temporarily unavailable.'
            : 'Your profile is connected, but saved addresses could not be verified.';
          throw new Error(responseMessage(addressResult, fallback));
        }

        const rows = addressResult?.data?.addresses ?? addressResult?.addresses ?? [];
        if (!Array.isArray(rows)) throw new Error('Saved address data was returned in an unexpected format.');
        setAddresses(rows.filter((address) => address && typeof address === 'object'));
      } catch (error) {
        setAddresses([]);
        setAddressMessage(error?.name === 'AbortError'
          ? 'Your profile is connected, but the address request took too long. You can retry below.'
          : (error instanceof Error ? error.message : 'Saved addresses could not be loaded right now.'));
      } finally {
        setAddressLoading(false);
      }
    } catch (error) {
      const errorMessage = error?.name === 'AbortError'
        ? 'The account request took too long. Check your connection and try again.'
        : (error instanceof Error ? error.message : 'Account information could not be loaded.');
      if (profile) {
        setStatus('connected');
        setRefreshMessage(errorMessage);
      } else {
        setMessage(errorMessage);
        setStatus('error');
      }
    } finally {
      setAddressLoading(false);
      setRefreshing(false);
      requestInFlight.current = false;
    }
  }, [profile]);

  useEffect(() => {
    void loadAccount();
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void loadAccount({ quiet: true });
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [loadAccount]);

  const fullName = useMemo(() => {
    if (!profile) return 'Your account';
    return `${profile.firstName} ${profile.lastName}`.trim()
      || profile.email?.split('@')[0]
      || profile.username
      || 'Your account';
  }, [profile]);
  
  const initials = fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';

  const signOut = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setProfile(null);
    setAddresses([]);
    setAddressMessage('');
    setStatus('signed_out');
    setMessage('You have signed out of JABIYEN on this browser.');
  };

  return (
    <>
      <Head>
        <title>My Account | JABIYEN</title>
        <meta name="description" content="View your JABIYEN account information provided by BINZEO Central Auth." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="app-container">
        <div className="mobile-frame">
          
          {/* Header */}
          <header className="top-nav">
            <Link href="/" className="icon-btn" aria-label="Back">
              <Icons.Back />
            </Link>
            <h1 className="nav-title">Settings</h1>
            <div className="nav-spacer" />
          </header>

          <main className="content-scroll">
            
            {/* Loading State */}
            {status === 'loading' && (
              <div className="state-container">
                <div className="spinner" />
                <h2 className="state-title">Loading account...</h2>
              </div>
            )}

            {/* Error / Signed Out State */}
            {(status === 'error' || status === 'signed_out') && (
              <div className="state-container">
                <div className="state-icon"><Icons.Alert /></div>
                <h2 className="state-title">{status === 'error' ? 'Something went wrong' : 'Welcome back'}</h2>
                <p className="state-desc">{message}</p>
                <div className="state-actions">
                  {status === 'error' && (
                    <button className="btn btn-outline" onClick={() => void loadAccount()}>Retry</button>
                  )}
                  <Link href="/auth/signin" className="btn btn-primary">Sign In</Link>
                </div>
              </div>
            )}

            {/* Connected State */}
            {status === 'connected' && profile && (
              <>
                {/* Profile Section */}
                <div className="profile-section">
                  {profile.photo ? (
                    <img className="avatar" src={profile.photo} alt={fullName} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="avatar avatar-fallback">{initials}</div>
                  )}
                  <h2 className="profile-name">{fullName}</h2>
                  <p className="profile-email">{profile.email || 'No email provided'}</p>
                </div>

                {refreshMessage && <div className="alert-box">{refreshMessage}</div>}

                {/* Personal Info Card */}
                <div className="card">
                  <div className="card-header">
                    <Icons.User />
                    <span>Personal Information</span>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="info-label">Name</span>
                      <span className="info-value">{profile.firstName} {profile.lastName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Email</span>
                      <span className="info-value">{profile.email || 'Not added'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Phone</span>
                      <span className="info-value">{profile.phone || 'Not added'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Member Since</span>
                      <span className="info-value">{asDate(profile.createdAt)}</span>
                    </div>
                    {profile.username && (
                      <div className="info-row">
                        <span className="info-label">Username</span>
                        <span className="info-value">{profile.username}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Saved Addresses Card */}
                <div className="card">
                  <div className="card-header">
                    <Icons.MapPin />
                    <span>Saved Addresses</span>
                  </div>
                  <div className="card-body">
                    {addressLoading ? (
                      <div className="info-row justify-center"><div className="mini-spinner" /> Loading...</div>
                    ) : addressMessage ? (
                      <div className="empty-state text-red">
                        <p>{addressMessage}</p>
                        <button className="text-btn" onClick={() => void loadAccount({ quiet: true })}>Try Again</button>
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="empty-state">No addresses saved.</div>
                    ) : (
                      addresses.map((addr, idx) => (
                        <div key={idx} className="address-item">
                          <div className="address-top">
                            <span className="address-title">{addr.label || addr.address_type || 'Address'}</span>
                            {addr.is_primary && <span className="badge">Primary</span>}
                          </div>
                          <p className="address-line">{getAddressLine(addr)}</p>
                          <p className="address-line">{addr.city}, {addr.state_province} {addr.postal_code}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Manage & Actions Card */}
                <div className="card">
                  <a href={`${CENTRAL_AUTH_URL}/account`} target="_blank" rel="noreferrer" className="list-item">
                    <div className="item-left">
                      <Icons.Settings />
                      <span>Manage Profile</span>
                    </div>
                    <Icons.ChevronRight />
                  </a>
                  <div className="divider" />
                  <button onClick={signOut} className="list-item text-red">
                    <div className="item-left">
                      <Icons.LogOut />
                      <span>Sign Out</span>
                    </div>
                  </button>
                </div>

                <div className="footer-note">
                  <span>Securely connected via BINZEO</span>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #f0f0f2; /* Light gray bg to make the mobile frame pop */
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
      
      <style jsx>{`
        .app-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }

        .mobile-frame {
          width: 100%;
          max-width: 390px;
          height: 844px; /* iPhone 14 Pro height */
          max-height: 90vh;
          background: #ffffff;
          border-radius: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* Top Navigation */
        .top-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 20px;
          background: #ffffff;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111;
          text-decoration: none;
          transition: background 0.2s;
        }
        .icon-btn:hover { background: #e5e5e5; }

        .nav-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: #111;
        }
        
        .nav-spacer { width: 36px; }

        /* Scrollable Content */
        .content-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 0 20px 40px 20px;
          scrollbar-width: none;
        }
        .content-scroll::-webkit-scrollbar { display: none; }

        /* Profile Section */
        .profile-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 0 30px;
        }

        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          background: #eaeaea;
          margin-bottom: 16px;
        }

        .avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 500;
          color: #555;
          background: #f5f5f5;
          border: 1px solid #eee;
        }

        .profile-name {
          font-size: 24px;
          font-weight: 500;
          margin: 0 0 4px;
          color: #111;
        }

        .profile-email {
          font-size: 13px;
          color: #888;
          margin: 0;
        }

        /* Cards */
        .card {
          background: #fafafa;
          border: 1px solid #f0f0f0;
          border-radius: 20px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px;
          font-size: 14px;
          font-weight: 600;
          color: #111;
          border-bottom: 1px solid #f0f0f0;
        }

        .card-body {
          padding: 16px;
        }

        /* Info Rows */
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 13px;
        }
        .info-row:last-child { margin-bottom: 0; }
        
        .info-label { color: #888; }
        .info-value { color: #111; font-weight: 500; text-align: right; }

        /* List Items (Like the image) */
        .list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          text-decoration: none;
          color: #111;
          font-size: 14px;
          font-weight: 500;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
        }
        .list-item:hover { background: #f0f0f0; }
        
        .item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .divider {
          height: 1px;
          background: #f0f0f0;
          margin: 0 16px;
        }

        .text-red { color: #d93025; }
        .text-red svg { stroke: #d93025; }

        /* Address */
        .address-item {
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .address-item:last-child { border-bottom: none; padding-bottom: 0; }
        
        .address-top {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        
        .address-title {
          font-size: 13px;
          font-weight: 600;
          color: #111;
          text-transform: capitalize;
        }
        
        .badge {
          font-size: 10px;
          background: #111;
          color: #fff;
          padding: 2px 6px;
          border-radius: 6px;
          font-weight: 600;
        }

        .address-line {
          margin: 2px 0;
          font-size: 12px;
          color: #666;
        }

        /* States */
        .state-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding-top: 60px;
        }

        .state-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          color: #111;
        }

        .state-title {
          font-size: 20px;
          font-weight: 500;
          margin: 0 0 8px;
          color: #111;
        }

        .state-desc {
          font-size: 13px;
          color: #888;
          max-width: 250px;
          line-height: 1.5;
          margin: 0 0 24px;
        }

        .state-actions {
          display: flex;
          gap: 10px;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .btn-primary {
          background: #111;
          color: #fff;
          border: none;
        }
        .btn-primary:hover { opacity: 0.8; }

        .btn-outline {
          background: transparent;
          color: #111;
          border: 1px solid #ddd;
        }
        .btn-outline:hover { background: #f5f5f5; }

        .alert-box {
          background: #fff3f3;
          color: #d93025;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 12px;
          margin-bottom: 16px;
          border: 1px solid #ffe0e0;
        }

        .empty-state {
          text-align: center;
          padding: 20px 0;
          font-size: 13px;
          color: #888;
        }

        .text-btn {
          background: none;
          border: none;
          color: #111;
          font-weight: 600;
          font-size: 12px;
          text-decoration: underline;
          margin-top: 8px;
          cursor: pointer;
        }

        .footer-note {
          text-align: center;
          font-size: 11px;
          color: #aaa;
          margin-top: 10px;
        }

        /* Spinners */
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #f0f0f0;
          border-top-color: #111;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        .mini-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #eee;
          border-top-color: #111;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
