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

// --- SVG Icons ---
const Icons = {
  ChevronRight: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Phone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Alert: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
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
          <main className="content-scroll">

            {/* Loading State */}
            {status === 'loading' && (
              <div className="state-container">
                <div className="spinner" />
                <h2 className="state-title">Loading...</h2>
              </div>
            )}

            {/* Error / Signed Out State */}
            {(status === 'error' || status === 'signed_out') && (
              <div className="state-container">
                <div className="state-icon"><Icons.Alert /></div>
                <h2 className="state-title">{status === 'error' ? 'Error' : 'Welcome'}</h2>
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

                {/* Banner Image */}
                <div className="banner-wrapper">
                  <img 
                    src="https://raw.githubusercontent.com/BINZEO369/auth.binzeo/main/public/images/connected-accounts-banner.jpg" 
                    alt="Connected Accounts" 
                    className="banner-img"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>

                {refreshMessage && <div className="alert-text">{refreshMessage}</div>}

                {/* --- FLAT LIST SECTION (NO DIVIDERS, NO CARDS, PURE WHITE) --- */}
                <div className="list-section">
                  
                  <div className="list-item">
                    <div className="item-left">
                      <Icons.User />
                      <span>Name</span>
                    </div>
                    <span className="item-value">{profile.firstName} {profile.lastName}</span>
                  </div>

                  <div className="list-item">
                    <div className="item-left">
                      <Icons.Phone />
                      <span>Phone</span>
                    </div>
                    <span className="item-value">{profile.phone || 'Not added'}</span>
                  </div>

                  <div className="list-item">
                    <div className="item-left">
                      <Icons.Calendar />
                      <span>Member Since</span>
                    </div>
                    <span className="item-value">{asDate(profile.createdAt)}</span>
                  </div>

                  {/* Address Section */}
                  <div className="list-item">
                    <div className="item-left">
                      <Icons.MapPin />
                      <span>Addresses</span>
                    </div>
                    <span className="item-value">
                      {addressLoading ? 'Loading...' : `${addresses.length} saved`}
                    </span>
                  </div>

                  {addressLoading ? (
                    <div className="address-loading">
                      <div className="mini-spinner" /> Loading...
                    </div>
                  ) : addressMessage ? (
                    <div className="address-error">
                      <p>{addressMessage}</p>
                      <button className="text-btn" onClick={() => void loadAccount({ quiet: true })}>Try Again</button>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="empty-state">No addresses saved yet.</div>
                  ) : (
                    <div className="address-list">
                      {addresses.map((addr, idx) => (
                        <div key={idx} className="address-item">
                          <div className="address-top">
                            <span className="address-title">{addr.label || addr.address_type || 'Address'}</span>
                            {addr.is_primary && <span className="badge">Primary</span>}
                          </div>
                          <p className="address-line">{getAddressLine(addr)}</p>
                          <p className="address-line">{addr.city}, {addr.state_province} {addr.postal_code}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Manage Profile Action */}
                  <a href={`${CENTRAL_AUTH_URL}/account`} target="_blank" rel="noreferrer" className="list-item clickable">
                    <div className="item-left">
                      <Icons.Settings />
                      <span>Manage Profile</span>
                    </div>
                    <Icons.ChevronRight />
                  </a>

                  {/* Sign Out Action */}
                  <button onClick={signOut} className="list-item clickable text-red">
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
          background-color: #ffffff; /* 100% Pure White Body */
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <style jsx>{`
        .app-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          background: #ffffff;
          padding: 0;
        }

        .mobile-frame {
          width: 100%;
          max-width: 420px;
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* Scrollable Content */
        .content-scroll {
          flex: 1;
          overflow-y: auto;
          /* Padding Top increased to 80px for a professional gap from the main header */
          padding: 80px 20px 40px 20px; 
          scrollbar-width: none;
        }
        .content-scroll::-webkit-scrollbar { display: none; }

        /* Profile Section */
        .profile-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 0 24px; /* Top padding removed since content-scroll already has 80px */
        }

        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          background: transparent;
          margin-bottom: 16px;
        }

        .avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 500;
          color: #111;
          background: transparent;
          border: 1px solid #e0e0e0;
        }

        .profile-name {
          font-size: 26px;
          font-weight: 500;
          margin: 0 0 4px;
          color: #111;
        }

        .profile-email {
          font-size: 14px;
          color: #888;
          margin: 0;
        }

        /* Banner */
        .banner-wrapper {
          width: 100%;
          height: 80px;
          margin-bottom: 24px;
          border-radius: 16px;
          overflow: hidden;
          background: transparent;
        }

        .banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* List Section - FLAT & CLEAN */
        .list-section {
          display: flex;
          flex-direction: column;
        }

        .list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0;
          text-decoration: none;
          color: #111;
          font-size: 15px;
          font-weight: 500;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
        }
        
        .list-item.clickable {
          cursor: pointer;
        }
        .list-item.clickable:hover {
          opacity: 0.6;
        }

        .item-left {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #333;
        }

        .item-value {
          font-size: 14px;
          color: #777;
          font-weight: 400;
        }

        .text-red { color: #d93025; }
        .text-red svg { stroke: #d93025; }

        /* Address */
        .address-item {
          padding: 0 0 16px 36px;
          background: transparent;
          border: none;
        }

        .address-top {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .address-title {
          font-size: 14px;
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
          font-size: 13px;
          color: #666;
        }

        .address-loading {
          padding: 0 0 16px 36px;
          font-size: 13px;
          color: #888;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .address-error {
          padding: 0 0 16px 36px;
          font-size: 13px;
          color: #d93025;
        }

        .empty-state {
          padding: 0 0 16px 36px;
          font-size: 14px;
          color: #888;
        }

        /* States */
        .state-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding-top: 40px;
        }

        .state-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          color: #111;
          border: 1px solid #e0e0e0;
        }

        .state-title {
          font-size: 22px;
          font-weight: 500;
          margin: 0 0 8px;
          color: #111;
        }

        .state-desc {
          font-size: 14px;
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
        }

        .btn-primary {
          background: #111;
          color: #fff;
          border: none;
        }

        .btn-outline {
          background: transparent;
          color: #111;
          border: 1px solid #ddd;
        }

        .alert-text {
          color: #d93025;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }

        .text-btn {
          background: none;
          border: none;
          color: #111;
          font-weight: 600;
          font-size: 13px;
          text-decoration: underline;
          margin-top: 8px;
          padding: 0;
          cursor: pointer;
        }

        .footer-note {
          text-align: center;
          font-size: 12px;
          color: #aaa;
          margin-top: 30px;
        }

        /* Spinners */
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #eee;
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
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
