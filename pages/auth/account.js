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
const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconPhone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconMap = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconExternal = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IconLogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconRefresh = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IconChevron = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

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
        <meta name="description" content="Manage your JABIYEN profile and settings." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <main className="page-wrapper">
        <div className="app-container">
          
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

              {/* Profile Info (Top) */}
              <div className="profile-header">
                {profile.photo ? (
                  <img className="avatar" src={profile.photo} alt={fullName} referrerPolicy="no-referrer" />
                ) : (
                  <div className="avatar avatar-initials">{initials}</div>
                )}
                <div className="profile-info">
                  <h1>{fullName}</h1>
                  <p>{profile.email || 'No email provided'}</p>
                  {profile.emailVerified && (
                    <span className="verified-tag">✓ Verified Account</span>
                  )}
                </div>
              </div>

              {/* Section: Account Details */}
              <div className="section-title">Account Information</div>
              <div className="list-container">
                <div className="list-item">
                  <span className="item-icon"><IconPhone /></span>
                  <span className="item-text">Phone</span>
                  <span className="item-value">{profile.phone || 'Not added'}</span>
                </div>
                {profile.username && (
                  <div className="list-item">
                    <span className="item-icon"><IconUser /></span>
                    <span className="item-text">Username</span>
                    <span className="item-value">{profile.username}</span>
                  </div>
                )}
                {profile.binzeoId && (
                  <div className="list-item">
                    <span className="item-icon"><IconUser /></span>
                    <span className="item-text">BINZEO ID</span>
                    <span className="item-value">{profile.binzeoId}</span>
                  </div>
                )}
                <div className="list-item">
                  <span className="item-icon"><IconUser /></span>
                  <span className="item-text">Provider</span>
                  <span className="item-value text-capitalize">{profile.provider}</span>
                </div>
                <div className="list-item">
                  <span className="item-icon"><IconUser /></span>
                  <span className="item-text">Member Since</span>
                  <span className="item-value">{asDate(profile.createdAt)}</span>
                </div>
              </div>

              {/* Section: Addresses */}
              <div className="section-title">Saved Addresses</div>
              <div className="list-container">
                {addressLoading ? (
                  <div className="list-item loading-item">
                    <div className="small-spinner" /> Loading addresses...
                  </div>
                ) : addressMessage ? (
                  <div className="list-item clickable" onClick={() => void loadAccount({ quiet: true })}>
                    <span className="item-icon">!</span>
                    <span className="item-text error-text">{addressMessage}</span>
                    <span className="item-chevron"><IconRefresh /></span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="list-item">
                    <span className="item-icon"><IconMap /></span>
                    <span className="item-text text-muted">No saved addresses found</span>
                  </div>
                ) : (
                  addresses.map((address, index) => (
                    <div className="address-item" key={address.id || index}>
                      <div className="address-top">
                        <span className="item-icon"><IconMap /></span>
                        <span className="address-label">{address.label || address.address_type || `Address ${index + 1}`}</span>
                        {address.is_primary && <span className="badge-primary">Primary</span>}
                      </div>
                      <div className="address-details">
                        <p>{getAddressLine(address) || 'No street details'}</p>
                        <p>{[address.area, address.district, address.city, address.postal_code].filter(Boolean).join(', ')}</p>
                        <p>{[address.country_name, address.country_code].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Section: Actions */}
              <div className="section-title">Settings & Actions</div>
              <div className="list-container">
                <a href={`${CENTRAL_AUTH_URL}/account`} target="_blank" rel="noreferrer" className="list-item clickable">
                  <span className="item-icon"><IconExternal /></span>
                  <span className="item-text">Manage Profile in Central Auth</span>
                  <span className="item-chevron"><IconChevron /></span>
                </a>
                <button className="list-item clickable" onClick={() => void loadAccount({ quiet: true })} disabled={refreshing}>
                  <span className="item-icon"><IconRefresh /></span>
                  <span className="item-text">{refreshing ? 'Refreshing Data...' : 'Refresh Account Data'}</span>
                </button>
                <button className="list-item clickable" onClick={signOut}>
                  <span className="item-icon"><IconLogout /></span>
                  <span className="item-text font-bold">Sign Out</span>
                </button>
              </div>

              <div className="footer-note">
                <p>Securely managed by BINZEO Central Auth</p>
              </div>
            </div>
          )}

        </div>
      </main>

      <style jsx>{`
        /* Pure Black & White Theme */
        .page-wrapper {
          min-height: 100vh;
          background: #ffffff; /* Pure White Background */
          color: #000000; /* Pure Black Text */
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 40px 20px;
          display: flex;
          justify-content: center;
        }
        .app-container {
          width: 100%;
          max-width: 600px;
        }

        /* Loading & Error States */
        .center-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 60vh;
        }
        .icon-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 1px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .center-state h2 { font-size: 22px; font-weight: 700; margin: 0 0 10px; }
        .state-msg { font-size: 15px; color: #666; margin: 0 0 24px; max-width: 320px; line-height: 1.5; }
        .state-actions { display: flex; gap: 12px; }
        
        .spinner {
          width: 24px; height: 24px;
          border: 2px solid #e0e0e0;
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }
        .small-spinner {
          width: 16px; height: 16px;
          border: 2px solid #e0e0e0;
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Buttons */
        .btn {
          padding: 14px 24px;
          border-radius: 4px; /* Sharp, city vibe */
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn-primary { background: #000; color: #fff; }
        .btn-primary:hover { background: #333; }
        .btn-outline { background: #fff; color: #000; border: 1px solid #000; }
        .btn-outline:hover { background: #f5f5f5; }

        /* Profile Header */
        .profile-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding-bottom: 30px;
          border-bottom: 2px solid #000; /* Strong black divider */
          margin-bottom: 30px;
        }
        .avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #000;
        }
        .avatar-initials {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 600;
          background: #000;
          color: #fff;
        }
        .profile-info h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 6px;
          letter-spacing: -0.5px;
        }
        .profile-info p {
          font-size: 15px;
          color: #666;
          margin: 0 0 8px;
        }
        .verified-tag {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          color: #000;
          border: 1px solid #000;
          padding: 4px 8px;
          border-radius: 4px;
        }

        /* Section Titles */
        .section-title {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #000;
          margin: 32px 0 16px;
        }

        /* Lists (Flat, White, Black text) */
        .list-container {
          display: flex;
          flex-direction: column;
        }
        .list-item {
          display: flex;
          align-items: center;
          padding: 18px 0;
          border-bottom: 1px solid #e5e5e5; /* Minimal light divider */
          width: 100%;
          text-align: left;
          background: transparent;
          border-top: none;
          border-left: none;
          border-right: none;
          font-family: inherit;
          color: #000;
        }
        .list-item:last-child {
          border-bottom: 1px solid #e5e5e5;
        }
        .list-item.clickable {
          cursor: pointer;
        }
        .list-item.clickable:hover .item-text {
          text-decoration: underline;
        }
        
        .item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          margin-right: 16px;
          width: 20px;
        }
        .item-text {
          flex: 1;
          font-size: 16px;
          font-weight: 500;
        }
        .item-value {
          font-size: 15px;
          color: #666;
          font-weight: 400;
          text-align: right;
          max-width: 50%;
          word-break: break-word;
        }
        .item-chevron {
          display: flex;
          align-items: center;
          margin-left: 12px;
          color: #000;
        }
        
        .font-bold { font-weight: 700; }
        .text-capitalize { text-transform: capitalize; }
        .text-muted { color: #888; }
        .error-text { color: #d00; font-weight: 600; }
        
        .loading-item {
          font-size: 15px;
          color: #666;
          gap: 12px;
          border-bottom: none;
        }

        /* Address Specific */
        .address-item {
          padding: 18px 0;
          border-bottom: 1px solid #e5e5e5;
        }
        .address-top {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        .address-label {
          font-size: 16px;
          font-weight: 700;
        }
        .address-details {
          padding-left: 36px;
          font-size: 15px;
          color: #666;
          line-height: 1.6;
        }
        .address-details p {
          margin: 0 0 4px;
        }
        .address-details p:last-child {
          margin-bottom: 0;
        }
        .badge-primary {
          font-size: 11px;
          background: #000;
          color: #fff;
          padding: 4px 10px;
          border-radius: 4px;
          font-weight: 600;
          margin-left: auto;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Alerts */
        .alert {
          padding: 14px 16px;
          border: 1px solid #d00;
          color: #d00;
          font-size: 14px;
          margin-bottom: 24px;
          font-weight: 500;
        }

        /* Footer */
        .footer-note {
          text-align: center;
          padding: 40px 0 20px;
          border-top: 2px solid #000;
          margin-top: 40px;
        }
        .footer-note p {
          font-size: 13px;
          color: #000;
          font-weight: 600;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Animation */
        .content-fade-in {
          animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
