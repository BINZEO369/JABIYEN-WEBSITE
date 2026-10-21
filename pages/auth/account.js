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

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || 'Not added'}</span>
    </div>
  );
}

function AddressCard({ address, index }) {
  const title = address.label || address.address_type || `Address ${index + 1}`;
  const locality = [address.area, address.district, address.city, address.state_province, address.postal_code]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(', ');
  const country = address.country_name || address.country_code || '';

  return (
    <article className="address-card">
      <div className="address-card-heading">
        <div>
          <span className="address-kicker">DELIVERY ADDRESS {String(index + 1).padStart(2, '0')}</span>
          <h3>{title}</h3>
        </div>
        {address.is_primary && <span className="primary-badge">Primary</span>}
      </div>
      <p>{getAddressLine(address) || 'Address details not added'}</p>
      {locality && <p>{locality}</p>}
      {country && <p className="address-country">{country}</p>}
    </article>
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
      // Load the essential profile first. Address latency must never block the identity card.
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

      // Address data is optional for the account overview and has its own error state.
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
  const initials = fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'J';

  const signOut = () => {
    // This only clears JABIYEN's local session; it does not sign out of Central Auth or other apps.
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
      <main className="account-page">
        <div className="account-shell">
          <nav className="account-nav" aria-label="Account navigation">
            <Link href="/" className="back-link"><span aria-hidden="true">←</span> Back to store</Link>
            <span className="private-label"><span className="lock-mark" aria-hidden="true">◆</span> PRIVATE ACCOUNT</span>
          </nav>

          <header className="page-heading">
            <div>
              <span className="eyebrow">JABIYEN · MEMBER SPACE</span>
              <h1>My account<span>.</span></h1>
              <p>Your identity and delivery details, together in one place.</p>
            </div>
            <div className="heading-mark" aria-hidden="true">J<span>.</span></div>
          </header>

          {status === 'loading' && (
            <section className="loading-card" aria-live="polite">
              <span className="spinner" aria-hidden="true" />
              <div>
                <span className="eyebrow">SECURE CONNECTION</span>
                <h2>Loading your account</h2>
                <p>Verifying your profile with BINZEO Central Auth…</p>
              </div>
            </section>
          )}

          {(status === 'error' || status === 'signed_out') && (
            <section className="signed-out-card" aria-live="polite">
              <div className="signed-out-icon" aria-hidden="true">{status === 'error' ? '!' : '↗'}</div>
              <div className="signed-out-copy">
                <span className="eyebrow">{status === 'error' ? 'ACCOUNT TEMPORARILY UNAVAILABLE' : 'YOUR MEMBER SPACE'}</span>
                <h2>{status === 'error' ? 'We couldn’t load your account' : 'Connect your account'}</h2>
                <p>{message}</p>
                <div className="state-actions">
                  {status === 'error' && (
                    <button className="button button-dark" type="button" onClick={() => void loadAccount()}>
                      Try again <span aria-hidden="true">↗</span>
                    </button>
                  )}
                  <Link className="button button-dark" href="/auth/signin">
                    Sign in securely <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
              <div className="signed-out-side-note">YOUR<br />IDENTITY<br />YOUR WAY</div>
            </section>
          )}

          {status === 'connected' && profile && (
            <>
              {refreshMessage && <div className="notice notice-warning" role="status">{refreshMessage}</div>}

              <section className="profile-hero" aria-label="Account identity">
                <div className="identity-main">
                  {profile.photo ? (
                    <img className="avatar" src={profile.photo} alt={`${fullName} profile`} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="avatar avatar-fallback" aria-hidden="true">{initials}</div>
                  )}
                  <div className="identity-copy">
                    <span className="eyebrow">CENTRAL AUTH ACCOUNT</span>
                    <h2>{fullName}</h2>
                    <p>{profile.email || 'Email not added'}</p>
                  </div>
                </div>
                <div className="connected-badges">
                  <span className="connected-badge"><span className="status-dot" /> Connected</span>
                  {profile.emailVerified && <span className="verified-badge">Email verified</span>}
                </div>
              </section>

              <div className="account-grid">
                <section className="content-card identity-card">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">YOUR DETAILS</span>
                      <h2>Personal information</h2>
                    </div>
                    <span className="read-only">Read only</span>
                  </div>
                  <div className="detail-grid">
                    <Detail label="First name" value={profile.firstName} />
                    <Detail label="Last name" value={profile.lastName} />
                    <Detail label="Email address" value={profile.email} />
                    <Detail label="Phone number" value={profile.phone} />
                    {profile.username && <Detail label="Username" value={profile.username} />}
                    {profile.binzeoId && <Detail label="BINZEO ID" value={profile.binzeoId} />}
                    <Detail label="Identity provider" value={profile.provider} />
                    <Detail label="Member since" value={asDate(profile.createdAt)} />
                  </div>
                  <p className="data-note"><span aria-hidden="true">i</span> Your details are read securely from BINZEO Central Auth and aren’t stored separately by JABIYEN.</p>
                </section>

                <section className="content-card addresses-card">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">DELIVERY DETAILS</span>
                      <h2>Saved addresses</h2>
                    </div>
                    <span className="address-count">{addresses.length.toString().padStart(2, '0')}</span>
                  </div>

                  {addressLoading ? (
                    <div className="address-loading" aria-live="polite"><span className="small-spinner" /> Loading saved addresses…</div>
                  ) : addressMessage ? (
                    <div className="address-empty address-error" role="status">
                      <span className="empty-icon" aria-hidden="true">!</span>
                      <p>{addressMessage}</p>
                      <button type="button" onClick={() => void loadAccount({ quiet: true })} disabled={refreshing}>
                        {refreshing ? 'Refreshing…' : 'Retry account data'}
                      </button>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="address-empty">
                      <span className="empty-icon" aria-hidden="true">⌂</span>
                      <h3>No saved address yet</h3>
                      <p>Add a delivery address in Central Auth and it will appear here.</p>
                    </div>
                  ) : (
                    <div className="address-list">
                      {addresses.map((address, index) => (
                        <AddressCard key={address.id || `${address.address_line_1 || 'address'}-${index}`} address={address} index={index} />
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <section className="manage-card">
                <div className="manage-copy">
                  <span className="eyebrow">ACCOUNT CONTROL</span>
                  <h2>Make changes securely</h2>
                  <p>Update your personal information and saved addresses in BINZEO Central Auth. Changes will appear here when you return.</p>
                </div>
                <a className="button button-light" href={`${CENTRAL_AUTH_URL}/account`} target="_blank" rel="noreferrer">
                  Manage in Central Auth <span aria-hidden="true">↗</span>
                </a>
              </section>

              <footer className="account-footer">
                <span>{refreshing ? 'Refreshing your account…' : 'Your account is securely connected'}</span>
                <div className="footer-actions">
                  <button type="button" onClick={() => void loadAccount({ quiet: true })} disabled={refreshing}>
                    {refreshing ? 'Refreshing…' : 'Refresh details'}
                  </button>
                  <button type="button" className="signout-button" onClick={signOut}>Sign out of JABIYEN</button>
                </div>
              </footer>
            </>
          )}
        </div>
      </main>
      <style jsx>{`
        .account-page { min-height: calc(100vh - 150px); padding: clamp(96px, 10vw, 120px) 18px 72px; background: #f4f2ee; color: #171715; }
        .account-shell { width: min(100%, 1060px); margin: 0 auto; }
        .account-nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 30px; border-bottom: 1px solid #ddd9d1; }
        .back-link { display: inline-flex; align-items: center; gap: 9px; color: #35342f; font-size: 12px; font-weight: 700; text-decoration: none; transition: opacity .2s ease; }
        .back-link:hover { opacity: .62; }
        .back-link span { font-size: 18px; line-height: 1; }
        .private-label { display: inline-flex; align-items: center; gap: 8px; color: #77736b; font-size: 9px; font-weight: 800; letter-spacing: .15em; }
        .lock-mark { display: inline-grid; width: 19px; height: 19px; place-items: center; border: 1px solid #cfcbc2; border-radius: 50%; color: #26251f; font-size: 7px; }
        .page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: clamp(34px, 7vw, 66px) 0 32px; }
        .eyebrow { display: block; color: #878277; font-size: 9px; font-weight: 850; letter-spacing: .17em; line-height: 1.5; }
        .page-heading h1 { margin: 10px 0 9px; color: #161613; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(39px, 7vw, 66px); font-weight: 400; letter-spacing: -.055em; line-height: .98; }
        .page-heading h1 span { color: #b07c45; }
        .page-heading p { margin: 0; color: #77736b; font-size: 13px; line-height: 1.7; }
        .heading-mark { color: #ded9d0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(55px, 10vw, 100px); font-style: italic; letter-spacing: -.1em; line-height: .8; user-select: none; }
        .heading-mark span { color: #b07c45; }
        .loading-card, .signed-out-card, .profile-hero, .content-card { border: 1px solid #e4e0d8; border-radius: 18px; background: #fff; box-shadow: 0 12px 36px rgba(30, 28, 23, .035); }
        .loading-card { display: flex; min-height: 210px; align-items: center; gap: 20px; padding: clamp(24px, 6vw, 52px); }
        .loading-card h2 { margin: 7px 0 5px; font-family: Georgia, 'Times New Roman', serif; font-size: 25px; font-weight: 400; }
        .loading-card p { margin: 0; color: #77736b; font-size: 13px; }
        .spinner, .small-spinner { flex: 0 0 auto; border: 2px solid #e8e3da; border-top-color: #1b1a17; border-radius: 50%; animation: spin .75s linear infinite; }
        .spinner { width: 26px; height: 26px; }
        .small-spinner { width: 16px; height: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .signed-out-card { position: relative; display: flex; min-height: 270px; align-items: center; gap: 22px; overflow: hidden; padding: clamp(24px, 6vw, 54px); }
        .signed-out-icon { display: grid; width: 48px; height: 48px; flex: 0 0 48px; place-items: center; border: 1px solid #e2ddd5; border-radius: 50%; color: #8e673e; font-size: 22px; }
        .signed-out-copy { position: relative; z-index: 1; max-width: 600px; }
        .signed-out-copy h2 { margin: 8px 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(25px, 4vw, 34px); font-weight: 400; letter-spacing: -.03em; }
        .signed-out-copy p { max-width: 470px; margin: 0; color: #77736b; font-size: 13px; line-height: 1.7; }
        .signed-out-side-note { position: absolute; right: 34px; bottom: 22px; color: #efede8; font-family: Georgia, 'Times New Roman', serif; font-size: 27px; font-style: italic; font-weight: 700; line-height: .9; text-align: right; }
        .state-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
        .button { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; gap: 16px; padding: 0 18px; border: 0; border-radius: 999px; font-size: 11px; font-weight: 750; text-decoration: none; cursor: pointer; transition: transform .18s ease, background .18s ease; }
        .button:hover { transform: translateY(-1px); }
        .button-dark { background: #191916; color: #fff; }
        .button-dark:hover { background: #37362f; }
        .notice { margin: 0 0 16px; padding: 12px 16px; border-radius: 10px; font-size: 12px; line-height: 1.6; }
        .notice-warning { border: 1px solid #ead9c7; background: #fcf7f0; color: #785b3e; }
        .profile-hero { display: flex; align-items: center; justify-content: space-between; gap: 22px; padding: clamp(22px, 4vw, 34px); }
        .identity-main { display: flex; min-width: 0; align-items: center; gap: 19px; }
        .avatar { width: 76px; height: 76px; flex: 0 0 76px; border: 1px solid #e7e2d9; border-radius: 50%; object-fit: cover; background: #f0ede7; }
        .avatar-fallback { display: grid; place-items: center; color: #fff; background: #25241f; font-family: Georgia, 'Times New Roman', serif; font-size: 25px; }
        .identity-copy { min-width: 0; }
        .identity-copy h2 { margin: 6px 0 4px; overflow-wrap: anywhere; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(23px, 4vw, 31px); font-weight: 400; letter-spacing: -.035em; }
        .identity-copy p { margin: 0; overflow-wrap: anywhere; color: #77736b; font-size: 12px; }
        .connected-badges { display: flex; flex: 0 0 auto; flex-direction: column; align-items: flex-end; gap: 8px; }
        .connected-badge, .verified-badge { display: inline-flex; align-items: center; gap: 7px; padding: 8px 11px; border: 1px solid #e3e0d9; border-radius: 999px; color: #45443e; font-size: 9px; font-weight: 750; white-space: nowrap; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #438563; }
        .verified-badge { border-color: #dbe8dc; background: #f5faf5; color: #4d7557; }
        .account-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(260px, .85fr); gap: 16px; margin-top: 16px; align-items: start; }
        .content-card { min-width: 0; padding: clamp(20px, 3.5vw, 30px); }
        .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 24px; }
        .section-heading h2 { margin: 5px 0 0; color: #22211e; font-family: Georgia, 'Times New Roman', serif; font-size: 23px; font-weight: 400; letter-spacing: -.025em; }
        .read-only { padding: 7px 10px; border: 1px solid #e8e4dd; border-radius: 999px; color: #77736b; font-size: 9px; font-weight: 750; white-space: nowrap; }
        .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 21px 18px; }
        .detail-item { min-width: 0; }
        .detail-label { display: block; margin-bottom: 6px; color: #969186; font-size: 9px; font-weight: 800; letter-spacing: .11em; text-transform: uppercase; }
        .detail-value { display: block; min-height: 18px; overflow-wrap: anywhere; color: #292823; font-size: 12px; font-weight: 600; line-height: 1.5; }
        .data-note { display: flex; align-items: flex-start; gap: 8px; margin: 25px 0 0; padding-top: 17px; border-top: 1px solid #efede8; color: #8a867e; font-size: 10px; line-height: 1.6; }
        .data-note span { display: grid; width: 15px; height: 15px; flex: 0 0 15px; place-items: center; border: 1px solid #d8d3ca; border-radius: 50%; font-family: Georgia, 'Times New Roman', serif; font-size: 10px; font-style: italic; }
        .address-count { color: #b0aa9f; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; }
        .address-list { display: grid; gap: 10px; }
        .address-card { padding: 17px; border: 1px solid #ebe8e1; border-radius: 12px; background: #fcfbf9; }
        .address-card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .address-kicker { color: #9a9488; font-size: 8px; font-weight: 800; letter-spacing: .13em; }
        .address-card h3 { margin: 5px 0 0; color: #292823; font-size: 12px; font-weight: 750; text-transform: capitalize; }
        .primary-badge { padding: 5px 8px; border-radius: 999px; background: #f0ece4; color: #705d43; font-size: 8px; font-weight: 800; text-transform: uppercase; }
        .address-card p { margin: 6px 0 0; color: #6f6b63; font-size: 11px; line-height: 1.55; overflow-wrap: anywhere; }
        .address-card .address-country { color: #999388; font-size: 10px; }
        .address-empty { display: flex; min-height: 178px; flex-direction: column; align-items: flex-start; justify-content: center; padding: 5px 0; }
        .empty-icon { display: grid; width: 35px; height: 35px; place-items: center; border: 1px solid #e8e3da; border-radius: 50%; color: #9b7a54; font-family: Georgia, 'Times New Roman', serif; font-size: 19px; }
        .address-empty h3 { margin: 13px 0 4px; color: #33322d; font-family: Georgia, 'Times New Roman', serif; font-size: 17px; font-weight: 400; }
        .address-empty p { max-width: 300px; margin: 12px 0; color: #817d74; font-size: 11px; line-height: 1.65; }
        .address-error p { margin: 12px 0 8px; }
        .address-empty button { padding: 0; border: 0; background: transparent; color: #423c32; font-size: 10px; font-weight: 800; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
        .address-empty button:disabled { opacity: .55; cursor: wait; }
        .address-loading { display: flex; min-height: 178px; align-items: center; gap: 10px; color: #77736b; font-size: 11px; }
        .manage-card { display: flex; align-items: center; justify-content: space-between; gap: 22px; margin-top: 16px; padding: clamp(22px, 4vw, 32px); border-radius: 16px; background: #1d1c18; color: #fff; }
        .manage-copy { max-width: 600px; }
        .manage-copy .eyebrow { color: #b8ad99; }
        .manage-copy h2 { margin: 7px 0 5px; font-family: Georgia, 'Times New Roman', serif; font-size: 23px; font-weight: 400; }
        .manage-copy p { margin: 0; color: #c6c1b8; font-size: 11px; line-height: 1.7; }
        .button-light { flex: 0 0 auto; background: #f2eee6; color: #1f1e1a; }
        .button-light:hover { background: #fff; }
        .account-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; padding: 17px 3px; color: #928d83; font-size: 10px; }
        .footer-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 18px; }
        .footer-actions button { padding: 0; border: 0; background: transparent; color: #56534c; font: inherit; font-size: 10px; font-weight: 800; cursor: pointer; }
        .footer-actions button:disabled { opacity: .55; cursor: wait; }
        .footer-actions .signout-button { color: #9b5751; }
        @media (max-width: 760px) {
          .account-page { padding-right: 14px; padding-left: 14px; }
          .account-grid { grid-template-columns: 1fr; }
          .addresses-card { order: 2; }
          .identity-card { order: 1; }
        }
        @media (max-width: 520px) {
          .account-nav { padding-bottom: 22px; }
          .private-label { font-size: 8px; letter-spacing: .1em; }
          .page-heading { padding: 35px 0 25px; }
          .heading-mark { font-size: 57px; }
          .signed-out-card { min-height: 0; align-items: flex-start; gap: 14px; padding: 24px 18px; }
          .signed-out-icon { width: 38px; height: 38px; flex-basis: 38px; font-size: 18px; }
          .signed-out-side-note { right: 14px; bottom: 11px; font-size: 19px; }
          .signed-out-copy h2 { font-size: 25px; }
          .state-actions { gap: 8px; }
          .button { min-height: 42px; gap: 10px; padding: 0 14px; font-size: 10px; }
          .profile-hero { align-items: flex-start; flex-direction: column; gap: 18px; padding: 21px 17px; }
          .identity-main { gap: 13px; }
          .avatar { width: 62px; height: 62px; flex-basis: 62px; }
          .connected-badges { flex-direction: row; align-items: center; }
          .content-card { padding: 20px 17px; }
          .detail-grid { gap: 18px 12px; }
          .manage-card { align-items: flex-start; flex-direction: column; }
          .button-light { width: 100%; }
          .account-footer { align-items: flex-start; flex-direction: column; }
          .footer-actions { width: 100%; justify-content: space-between; gap: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .spinner, .small-spinner { animation-duration: 2s; }
          .button, .back-link { transition: none; }
        }
      `}</style>
    </>
  );
}
