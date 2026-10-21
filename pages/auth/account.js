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
const IconUser = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconPhone = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconMap = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconExternal = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IconLogout = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconRefresh = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IconChevron = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

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
        <title>Profile | JABIYEN</title>
        <meta name="description" content="Manage your JABIYEN profile and settings." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <main className="page-wrapper">
        <div className="app-container">
          
          {/* Header */}
          <header className="app-header">
            <Link href="/" className="nav-link">← Store</Link>
            <h1 className="header-title">Profile</h1>
            <div className="nav-spacer" />
          </header>

          {/* Loading State */}
          {status === 'loading' && (
            <div className="center-state">
              <div className="spinner" />
              <p>Verifying your profile...</p>
            </div>
          )}

          {/* Error / Signed Out State */}
          {(status === 'error' || status === 'signed_out') && (
            <div className="center-state">
              <div className="icon-circle">
                <IconUser />
              </div>
              <h2>{status === 'error' ? 'Connection Error' : 'Not Signed In'}</h2>
              <p className="state-msg">{message}</p>
              <div className="state-actions">
                {status === 'error' && (
                  <button className="btn btn-outline" onClick={() => void loadAccount()}>
                    Try Again
                  </button>
                )}
                <Link href="/auth/signin" className="btn btn-primary">
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Connected State */}
          {status === 'connected' && profile && (
            <div className="content-fade-in">
              
              {refreshMessage && (
                <div className="alert alert-error">
                  {refreshMessage}
                </div>
              )}

              {/* Profile Card (Like Reference Image) */}
              <div className="profile-card">
                {profile.photo ? (
                  <img className="avatar" src={profile.photo} alt={fullName} referrerPolicy="no-referrer" />
                ) : (
                  <div className="avatar avatar-initials">{initials}</div>
                )}
                <div className="profile-info">
                  <h2>{fullName}</h2>
                  <p>{profile.email || 'No email provided'}</p>
                </div>
              </div>

              {/* Section: Account Details */}
              <div className="section-label">Account</div>
              <div className="list-group">
                <div className="list-item">
                  <span className="item-icon"><IconPhone /></span>
                  <span className="item-text">Phone</span>
                  <span className="item-value">{profile.phone || 'Not added'}</span>
                </div>
                <div className="list-item">
                  <span className="item-icon"><IconUser /></span>
                  <span className="item-text">Username</span>
                  <span className="item-value">{profile.username || 'Not set'}</span>
                </div>
                <div className="list-item">
                  <span className="item-icon"><IconUser /></span>
                  <span className="item-text">Provider</span>
                  <span className="item-value text-capitalize">{profile.provider}</span>
                </div>
                <a href={`${CENTRAL_AUTH_URL}/account`} target="_blank" rel="noreferrer" className="list-item clickable">
                  <span className="item-icon"><IconExternal /></span>
                  <span className="item-text">Manage Profile</span>
                  <span className="item-chevron"><IconChevron /></span>
                </a>
              </div>

              {/* Section: Addresses */}
              <div className="section-label">Addresses</div>
              <div className="list-group">
                {addressLoading ? (
                  <div className="list-item loading-item">
                    <div className="small-spinner" /> Loading...
                  </div>
                ) : addressMessage ? (
                  <div className="list-item clickable" onClick={() => void loadAccount({ quiet: true })}>
                    <span className="item-icon text-red">!</span>
                    <span className="item-text text-red">{addressMessage}</span>
                    <span className="item-chevron"><IconRefresh /></span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="list-item">
                    <span className="item-icon"><IconMap /></span>
                    <span className="item-text text-muted">No saved addresses</span>
                  </div>
                ) : (
                  addresses.map((address, index) => (
                    <div className="list-item address-item" key={address.id || index}>
                      <div className="address-top">
                        <span className="item-icon"><IconMap /></span>
                        <span className="item-text font-bold">{address.label || address.address_type || 'Address'}</span>
                        {address.is_primary && <span className="badge-primary">Primary</span>}
                      </div>
                      <div className="address-details">
                        <p>{getAddressLine(address) || 'No street details'}</p>
                        <p>{[address.area, address.district, address.city, address.postal_code].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Section: Support / Preferences */}
              <div className="section-label">Support</div>
              <div className="list-group">
                <button className="list-item clickable" onClick={() => void loadAccount({ quiet: true })} disabled={refreshing}>
                  <span className="item-icon"><IconRefresh /></span>
                  <span className="item-text">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
                <button className="list-item clickable" onClick={signOut}>
                  <span className="item-icon text-red"><IconLogout /></span>
                  <span className="item-text text-red">Sign Out</span>
                </button>
              </div>

              <div className="footer-note">
                <p>Account securely managed by BINZEO Central Auth.</p>
              </div>
            </div>
          )}

        </div>
      </main>

      <style jsx>{`
        /* App Layout */
        .page-wrapper {
          min-height: 100vh;
          background: #f2f2f7;
          color: #1c1c1e;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 20px;
          display: flex;
          justify-content: center;
        }
        .app-container {
          width: 100%;
          max-width: 600px; /* Mobile app width */
          padding-top: 10px;
          padding-bottom: 40px;
        }

        /* Header */
        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding: 0 8px;
        }
        .header-title {
          font-size: 17px;
          font-weight: 600;
          margin: 0;
          color: #000;
        }
        .nav-link {
          font-size: 15px;
          color: #007aff;
          text-decoration: none;
          font-weight: 500;
        }
        .nav-spacer { width: 40px; }

        /* Loading & Error States */
        .center-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 400px;
          padding: 40px 20px;
        }
        .icon-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #e5e5ea;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8e8e93;
          margin-bottom: 16px;
        }
        .center-state h2 { font-size: 20px; font-weight: 600; margin: 0 0 8px; }
        .state-msg { font-size: 15px; color: #8e8e93; margin: 0 0 24px; max-width: 300px; }
        .state-actions { display: flex; gap: 12px; }
        
        .spinner {
          width: 28px; height: 28px;
          border: 3px solid #e5e5ea;
          border-top-color: #007aff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }
        .small-spinner {
          width: 16px; height: 16px;
          border: 2px solid #e5e5ea;
          border-top-color: #1c1c1e;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Buttons */
        .btn {
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: opacity 0.2s;
        }
        .btn:active { opacity: 0.7; }
        .btn-primary { background: #000; color: #fff; }
        .btn-outline { background: transparent; color: #1c1c1e; border: 1px solid #c7c7cc; }

        /* Profile Card */
        .profile-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          background: #f2f2f7;
        }
        .avatar-initials {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 600;
          color: #8e8e93;
        }
        .profile-info h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 4px;
          color: #000;
        }
        .profile-info p {
          font-size: 14px;
          color: #8e8e93;
          margin: 0;
        }

        /* Sections */
        .section-label {
          font-size: 13px;
          color: #8e8e93;
          font-weight: 500;
          text-transform: capitalize;
          padding: 0 16px;
          margin-bottom: 8px;
        }

        .list-group {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        /* List Items */
        .list-item {
          display: flex;
          align-items: center;
          padding: 16px;
          background: #fff;
          border-bottom: 1px solid #f2f2f7;
          width: 100%;
          text-align: left;
          border-top: none;
          border-left: none;
          border-right: none;
          font-family: inherit;
        }
        .list-item:last-child {
          border-bottom: none;
        }
        .list-item.clickable {
          cursor: pointer;
          transition: background 0.1s;
        }
        .list-item.clickable:active {
          background: #f9f9f9;
        }
        .item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1c1c1e;
          margin-right: 14px;
          width: 24px;
        }
        .item-text {
          flex: 1;
          font-size: 16px;
          color: #1c1c1e;
          font-weight: 500;
        }
        .item-value {
          font-size: 15px;
          color: #8e8e93;
          margin-right: 8px;
        }
        .item-chevron {
          display: flex;
          align-items: center;
          margin-left: 8px;
        }
        
        .font-bold { font-weight: 600; }
        .text-capitalize { text-transform: capitalize; }
        .text-muted { color: #8e8e93; }
        .text-red { color: #ff3b30; }
        
        .loading-item {
          font-size: 15px;
          color: #8e8e93;
          gap: 12px;
        }

        /* Address Specific */
        .address-item {
          flex-direction: column;
          align-items: flex-start;
          padding: 16px;
        }
        .address-top {
          display: flex;
          align-items: center;
          width: 100%;
          margin-bottom: 6px;
        }
        .address-details {
          padding-left: 38px; /* Align with text, not icon */
          font-size: 14px;
          color: #8e8e93;
          line-height: 1.5;
        }
        .address-details p {
          margin: 0 0 4px;
        }
        .address-details p:last-child {
          margin-bottom: 0;
        }
        .badge-primary {
          font-size: 11px;
          background: #e5e5ea;
          color: #1c1c1e;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 600;
          margin-left: auto;
        }

        /* Alerts */
        .alert {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .alert-error {
          background: #ffe5e5;
          color: #d70015;
        }

        /* Footer */
        .footer-note {
          text-align: center;
          padding: 20px 0;
        }
        .footer-note p {
          font-size: 12px;
          color: #8e8e93;
          margin: 0;
        }

        /* Animation */
        .content-fade-in {
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
