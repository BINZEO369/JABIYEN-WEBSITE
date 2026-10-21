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

// --- Minimalist Icons ---
const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconPhone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconMap = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconExternal = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IconLogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconRefresh = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IconChevron = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><polyline points="9 18 15 12 9 6"/></svg>;

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
          
          {/* Minimal Brand Tag */}
          <div className="brand-bar">
            <span>JABIYEN / ACCOUNT</span>
          </div>

          {/* Loading State */}
          {status === 'loading' && (
            <div className="center-state">
              <div className="spinner" />
              <p>AUTHENTICATING...</p>
            </div>
          )}

          {/* Error / Signed Out State */}
          {(status === 'error' || status === 'signed_out') && (
            <div className="center-state">
              <div className="icon-circle">
                <IconUser />
              </div>
              <h2>{status === 'error' ? 'CONNECTION ERROR' : 'NOT SIGNED IN'}</h2>
              <p className="state-msg">{message}</p>
              <div className="state-actions">
                {status === 'error' && (
                  <button className="btn btn-outline" onClick={() => void loadAccount()}>
                    TRY AGAIN
                  </button>
                )}
                <Link href="/auth/signin" className="btn btn-primary">
                  SIGN IN
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
                <div className="avatar-wrapper">
                  {profile.photo ? (
                    <img className="avatar" src={profile.photo} alt={fullName} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="avatar avatar-initials">{initials}</div>
                  )}
                </div>
                <div className="profile-info">
                  <h1>{fullName}</h1>
                  <p className="email-text">{profile.email || 'No email provided'}</p>
                  {profile.emailVerified && (
                    <span className="verified-tag">VERIFIED ACCOUNT</span>
                  )}
                </div>
              </div>

              {/* Section: Account Details */}
              <div className="section-title">01 / ACCOUNT DATA</div>
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
              <div className="section-title">02 / LOCATIONS</div>
              <div className="list-container">
                {addressLoading ? (
                  <div className="list-item loading-item">
                    <div className="small-spinner" /> FETCHING DATA...
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
                        <span className="address-label">
                          <span className="address-index">0{index + 1}</span>
                          {address.label || address.address_type || 'Address'}
                        </span>
                        {address.is_primary && <span className="badge-primary">PRIMARY</span>}
                      </div>
                      <div className="address-details">
                        <p>{getAddressLine(address) || 'No street details'}</p>
                        <p>{[address.area, address.district, address.city, address.postal_code].filter(Boolean).join(', ')}</p>
                        <p className="address-country">{[address.country_name, address.country_code].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Section: Actions */}
              <div className="section-title">03 / SYSTEM CONTROLS</div>
              <div className="list-container">
                <a href={`${CENTRAL_AUTH_URL}/account`} target="_blank" rel="noreferrer" className="list-item clickable">
                  <span className="item-icon"><IconExternal /></span>
                  <span className="item-text">Manage Profile (Central Auth)</span>
                  <span className="item-chevron"><IconChevron /></span>
                </a>
                <button className="list-item clickable" onClick={() => void loadAccount({ quiet: true })} disabled={refreshing}>
                  <span className="item-icon"><IconRefresh /></span>
                  <span className="item-text">{refreshing ? 'REFRESHING DATA...' : 'Refresh Account Data'}</span>
                </button>
                <button className="list-item clickable" onClick={signOut}>
                  <span className="item-icon"><IconLogout /></span>
                  <span className="item-text font-bold">Sign Out</span>
                </button>
              </div>

              <div className="footer-note">
                <p>SECURE CONNECTION // BINZEO CENTRAL AUTH</p>
              </div>
            </div>
          )}

        </div>
      </main>

      <style jsx>{`
        /* Pure Black & White Editorial Theme */
        .page-wrapper {
          min-height: 100vh;
          background: #ffffff;
          color: #000000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 0 0 60px 0;
          display: flex;
          justify-content: center;
        }
        .app-container {
          width: 100%;
          max-width: 680px;
          padding: 0 24px;
        }

        /* Brand Bar */
        .brand-bar {
          padding: 24px 0;
          border-bottom: 2px solid #000;
          margin-bottom: 40px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        /* Loading & Error States */
        .center-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 50vh;
        }
        .icon-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .center-state h2 { font-size: 24px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.5px; }
        .state-msg { font-size: 14px; color: #555; margin: 0 0 32px; max-width: 320px; line-height: 1.6; }
        .state-actions { display: flex; gap: 12px; }
        
        .spinner {
          width: 24px; height: 24px;
          border: 2px solid #e0e0e0;
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-bottom: 24px;
        }
        .small-spinner {
          width: 16px; height: 16px;
          border: 2px solid #e0e0e0;
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Buttons */
        .btn {
          padding: 16px 28px;
          border-radius: 0; /* Sharp edges for city vibe */
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          text-decoration: none;
          cursor: pointer;
          border: 2px solid #000;
          transition: all 0.2s ease;
          text-transform: uppercase;
        }
        .btn-primary { background: #000; color: #fff; }
        .btn-primary:hover { background: #fff; color: #000; }
        .btn-outline { background: #fff; color: #000; }
        .btn-outline:hover { background: #000; color: #fff; }

        /* Profile Header */
        .profile-header {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-bottom: 32px;
          border-bottom: 2px solid #000;
          margin-bottom: 32px;
        }
        .avatar-wrapper {
          position: relative;
        }
        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #000;
          background: #f5f5f5;
        }
        .avatar-initials {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 800;
          background: #000;
          color: #fff;
        }
        .profile-info h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 4px;
          letter-spacing: -1px;
          line-height: 1.1;
        }
        .email-text {
          font-size: 14px;
          color: #555;
          margin: 0 0 10px;
          font-weight: 500;
        }
        .verified-tag {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #000;
          border: 1px solid #000;
          padding: 3px 8px;
          border-radius: 0;
        }

        /* Section Titles */
        .section-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #000;
          margin: 40px 0 16px;
          display: flex;
          align-items: center;
        }
        .section-title::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #000;
          margin-left: 16px;
          opacity: 0.2;
        }

        /* Lists (Flat, White, Black text) */
        .list-container {
          display: flex;
          flex-direction: column;
          border-top: 1px solid #000;
        }
        .list-item {
          display: flex;
          align-items: center;
          padding: 20px 12px;
          border-bottom: 1px solid #000;
          width: 100%;
          text-align: left;
          background: transparent;
          font-family: inherit;
          color: #000;
          transition: all 0.2s ease;
        }
        .list-item.clickable {
          cursor: pointer;
        }
        .list-item.clickable:hover {
          background: #000;
          color: #fff;
          padding-left: 20px; /* Slight shift on hover */
        }
        .list-item.clickable:hover .item-icon,
        .list-item.clickable:hover .item-value,
        .list-item.clickable:hover .item-chevron {
          color: #fff;
        }
        
        .item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          margin-right: 16px;
          transition: color 0.2s ease;
        }
        .item-text {
          flex: 1;
          font-size: 15px;
          font-weight: 600;
        }
        .item-value {
          font-size: 14px;
          color: #555;
          font-weight: 500;
          text-align: right;
          max-width: 50%;
          word-break: break-word;
          transition: color 0.2s ease;
        }
        .item-chevron {
          display: flex;
          align-items: center;
          margin-left: 16px;
          color: #000;
          transition: color 0.2s ease;
        }
        
        .font-bold { font-weight: 800; }
        .text-capitalize { text-transform: capitalize; }
        .text-muted { color: #888; }
        .error-text { color: #d00; font-weight: 700; }
        
        .loading-item {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #000;
          gap: 16px;
        }

        /* Address Specific */
        .address-item {
          padding: 24px 12px;
          border-bottom: 1px solid #000;
        }
        .address-top {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
        .address-label {
          font-size: 15px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .address-index {
          color: #888;
          font-size: 12px;
        }
        .address-details {
          padding-left: 38px;
          font-size: 14px;
          color: #333;
          line-height: 1.6;
          font-weight: 500;
        }
        .address-details p {
          margin: 0 0 6px;
        }
        .address-details p:last-child {
          margin-bottom: 0;
        }
        .address-country {
          color: #000;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: 8px !important;
        }
        .badge-primary {
          font-size: 10px;
          background: #000;
          color: #fff;
          padding: 4px 10px;
          border-radius: 0;
          font-weight: 800;
          letter-spacing: 1px;
          margin-left: auto;
        }

        /* Alerts */
        .alert {
          padding: 16px;
          border: 2px solid #d00;
          color: #d00;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 24px;
        }

        /* Footer */
        .footer-note {
          text-align: center;
          padding: 60px 0 20px;
        }
        .footer-note p {
          font-size: 10px;
          color: #000;
          font-weight: 800;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        /* Animation */
        .content-fade-in {
          animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 600px) {
          .app-container { padding: 0 16px; }
          .profile-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .address-details { padding-left: 0; }
          .item-value { font-size: 12px; }
        }
      `}</style>
    </>
  );
}
