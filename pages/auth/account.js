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

// নতুন ডিজাইনের জন্য DetailItem
function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || 'Not added'}</span>
    </div>
  );
}

// নতুন ডিজাইনের জন্য AddressCard
function AddressCard({ address, index }) {
  const title = address.label || address.address_type || `Address ${index + 1}`;
  const locality = [address.area, address.district, address.city, address.state_province, address.postal_code]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(', ');
  const country = address.country_name || address.country_code || '';

  return (
    <div className="address-card">
      <div className="address-header">
        <div className="address-title-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <h4>{title}</h4>
        </div>
        {address.is_primary && <span className="primary-badge">Primary</span>}
      </div>
      <div className="address-body">
        <p>{getAddressLine(address) || 'Address details not added'}</p>
        {locality && <p>{locality}</p>}
        {country && <p className="country-text">{country}</p>}
      </div>
    </div>
  );
}

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
          ? 'Your profile is connected, but the address request took too long.'
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
      
      <main className="account-layout">
        <div className="account-container">
          
          {/* Top Nav */}
          <nav className="top-nav">
            <Link href="/" className="back-btn" aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <span className="nav-title">My Account</span>
            <div className="nav-spacer"></div>
          </nav>

          {status === 'loading' && (
            <div className="state-container">
              <span className="spinner" aria-hidden="true" />
              <h2>Loading account</h2>
              <p>Verifying with Central Auth...</p>
            </div>
          )}

          {(status === 'error' || status === 'signed_out') && (
            <div className="state-container">
              <div className="state-icon" aria-hidden="true">
                {status === 'error' ? '!' : '↗'}
              </div>
              <h2>{status === 'error' ? 'Something went wrong' : 'Welcome back'}</h2>
              <p>{message}</p>
              <div className="state-actions">
                {status === 'error' && (
                  <button className="btn-primary" type="button" onClick={() => void loadAccount()}>
                    Try again
                  </button>
                )}
                <Link className="btn-primary" href="/auth/signin">
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {status === 'connected' && profile && (
            <div className="content-wrapper">
              
              {refreshMessage && <div className="alert-message">{refreshMessage}</div>}

              {/* Profile Header */}
              <header className="profile-header">
                <div className="avatar-container">
                  {profile.photo ? (
                    <img className="avatar" src={profile.photo} alt={fullName} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="avatar avatar-fallback" aria-hidden="true">{initials}</div>
                  )}
                </div>
                <h1>{fullName}</h1>
                <p>{profile.email || 'Email not added'}</p>
                {profile.emailVerified && (
                  <span className="verified-tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Verified Account
                  </span>
                )}
              </header>

              {/* Personal Info Grid */}
              <div className="section-group">
                <div className="section-title">Personal Information</div>
                <div className="detail-grid">
                  <DetailItem label="First name" value={profile.firstName} />
                  <DetailItem label="Last name" value={profile.lastName} />
                  <DetailItem label="Email address" value={profile.email} />
                  <DetailItem label="Phone number" value={profile.phone} />
                  {profile.username && <DetailItem label="Username" value={profile.username} />}
                  {profile.binzeoId && <DetailItem label="BINZEO ID" value={profile.binzeoId} />}
                  <DetailItem label="Identity provider" value={profile.provider} />
                  <DetailItem label="Member since" value={asDate(profile.createdAt)} />
                </div>
              </div>

              {/* Addresses List */}
              <div className="section-group">
                <div className="section-title">Saved Addresses</div>
                <div className="address-list">
                  {addressLoading ? (
                    <div className="list-item-empty">
                      <span className="small-spinner" /> Loading addresses...
                    </div>
                  ) : addressMessage ? (
                    <div className="list-item-empty error-text">
                      <p>{addressMessage}</p>
                      <button onClick={() => void loadAccount({ quiet: true })} disabled={refreshing}>
                        {refreshing ? 'Retrying...' : 'Retry'}
                      </button>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="list-item-empty empty-box">
                      <p>No saved addresses yet.</p>
                    </div>
                  ) : (
                    addresses.map((address, index) => (
                      <AddressCard key={address.id || index} address={address} index={index} />
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="action-group">
                <a className="btn-primary" href={`${CENTRAL_AUTH_URL}/account`} target="_blank" rel="noreferrer">
                  Manage in Central Auth
                </a>
                <div className="secondary-actions">
                  <button className="btn-secondary" type="button" onClick={() => void loadAccount({ quiet: true })} disabled={refreshing}>
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button className="btn-secondary danger" type="button" onClick={signOut}>
                    Sign out
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .account-layout {
          min-height: 100vh;
          background: #fafafa; /* হালকা অফ-হোয়াইট ব্যাকগ্রাউন্ড */
          color: #111111;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 0 16px 60px;
          display: flex;
          justify-content: center;
        }

        .account-container {
          width: 100%;
          max-width: 560px;
        }

        /* Top Nav */
        .top-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 0;
          position: sticky;
          top: 0;
          background: #fafafa;
          z-index: 10;
        }

        .back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #eaeaea;
          color: #111;
          text-decoration: none;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #f5f5f5;
        }

        .nav-title {
          font-size: 16px;
          font-weight: 600;
          color: #000;
        }

        .nav-spacer {
          width: 40px;
        }

        /* Profile Header */
        .profile-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px 0 40px;
        }

        .avatar-container {
          margin-bottom: 16px;
        }

        .avatar {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          object-fit: cover;
          background: #ffffff;
          border: 1px solid #eaeaea;
        }

        .avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          background: #000000;
          font-size: 30px;
          font-weight: 600;
        }

        .profile-header h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 6px;
          letter-spacing: -0.5px;
        }

        .profile-header p {
          margin: 0;
          font-size: 14px;
          color: #666666;
        }

        .verified-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 12px;
          padding: 4px 10px;
          background: #f0f0f0;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: #333;
        }

        /* Sections */
        .section-group {
          margin-bottom: 32px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: #888888;
          margin-bottom: 12px;
          padding-left: 8px;
        }

        /* Detail Grid (Personal Info) */
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .detail-item {
          background: #ffffff;
          border: 1px solid #eaeaea;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-label {
          font-size: 12px;
          color: #888888;
          font-weight: 500;
        }

        .detail-value {
          font-size: 14px;
          color: #111111;
          font-weight: 600;
          word-break: break-word;
          line-height: 1.4;
        }

        /* Address Cards */
        .address-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .address-card {
          background: #ffffff;
          border: 1px solid #eaeaea;
          border-radius: 16px;
          padding: 20px;
        }

        .address-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .address-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .address-title-wrap svg {
          color: #555;
        }

        .address-header h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #111;
          text-transform: capitalize;
        }

        .primary-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          background: #000000;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .address-body p {
          margin: 0 0 6px;
          font-size: 14px;
          color: #555555;
          line-height: 1.5;
        }

        .address-body p:last-child {
          margin-bottom: 0;
        }

        .country-text {
          font-weight: 600;
          color: #111 !important;
          margin-top: 8px !important;
        }

        /* Empty & Loading States */
        .list-item-empty {
          padding: 32px 20px;
          text-align: center;
          font-size: 14px;
          color: #666666;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #ffffff;
          border: 1px solid #eaeaea;
          border-radius: 16px;
        }

        .empty-box {
          border-style: dashed;
          background: transparent;
        }

        .error-text {
          color: #d32f2f;
          border-color: #ffcccc;
          background: #fffafa;
        }

        .list-item-empty button {
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 600;
          color: #111;
          text-decoration: underline;
          cursor: pointer;
        }

        /* Actions */
        .action-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 54px;
          background: #000000;
          color: #ffffff;
          border-radius: 27px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-primary:hover {
          opacity: 0.8;
        }

        .secondary-actions {
          display: flex;
          gap: 12px;
        }

        .btn-secondary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 50px;
          background: #ffffff;
          color: #111111;
          border: 1px solid #eaeaea;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-secondary:hover {
          background: #f5f5f5;
        }

        .btn-secondary.danger {
          color: #d32f2f;
          border-color: #ffcccc;
          background: #fffafa;
        }

        .btn-secondary.danger:hover {
          background: #ffeded;
        }

        .btn-secondary:disabled, .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* General States */
        .state-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
          padding: 20px;
        }

        .state-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #eaeaea;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 24px;
        }

        .state-container h2 {
          font-size: 22px;
          font-weight: 600;
          margin: 0 0 8px;
        }

        .state-container p {
          font-size: 14px;
          color: #666666;
          margin: 0 0 24px;
          max-width: 300px;
          line-height: 1.5;
        }

        .state-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 280px;
        }

        .alert-message {
          background: #fff4e5;
          border: 1px solid #ffd8a8;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 13px;
          color: #d9480f;
          margin-bottom: 24px;
          text-align: center;
          font-weight: 500;
        }

        /* Loaders */
        .spinner, .small-spinner {
          border: 2px solid #eaeaea;
          border-top-color: #000000;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner {
          width: 32px;
          height: 32px;
          margin-bottom: 16px;
        }

        .small-spinner {
          width: 18px;
          height: 18px;
          display: inline-block;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 520px) {
          .detail-grid {
            grid-template-columns: 1fr; /* মোবাইলে এক কলামে */
          }
          .profile-header h1 {
            font-size: 22px;
          }
          .btn-primary, .btn-secondary {
            height: 50px;
          }
        }
      `}</style>
    </>
  );
}
