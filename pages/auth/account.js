import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const SESSION_KEY = 'jayenware_session';
const CENTRAL_AUTH_URL = 'https://auth-binzeo.vercel.app';

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

function asDate(value) {
  if (!value) return 'Not provided';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not provided'
    : date.toLocaleDateString('en-US', { year: 'long', month: 'long', day: 'numeric' });
}

function getAddressLine(address) {
  return [address.address_line_1, address.address_line_2].filter(Boolean).join(', ');
}

export default function AccountPage() {
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressLoadFailed, setAddressLoadFailed] = useState(false);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadAccount = useCallback(async ({ quiet = false } = {}) => {
    const token = readAccessToken();
    if (!token) {
      setProfile(null);
      setAddresses([]);
      setStatus('signed_out');
      setMessage('Sign in through BINZEO Central Auth to view your account information.');
      return;
    }

    if (quiet) setRefreshing(true);
    else setStatus('loading');
    setMessage('');

    const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
    try {
      const [profileResponse, addressesResponse] = await Promise.all([
        fetch('/api/user/profile', { headers, cache: 'no-store', credentials: 'same-origin' }),
        fetch('/api/user/addresses', { headers, cache: 'no-store', credentials: 'same-origin' }),
      ]);

      if (profileResponse.status === 401 || addressesResponse.status === 401) {
        window.localStorage.removeItem(SESSION_KEY);
        setProfile(null);
        setAddresses([]);
        setStatus('signed_out');
        setMessage('Your session has expired. Sign in again through BINZEO Central Auth.');
        return;
      }
      if (!profileResponse.ok) {
        throw new Error(profileResponse.status >= 500
          ? 'Central Auth is temporarily unavailable. Please try again shortly.'
          : 'We could not verify this session. Please sign in again.');
      }

      const profileResult = await profileResponse.json();
      if (profileResult?.success === false) {
        throw new Error('Central Auth could not verify this account session. Please sign in again.');
      }
      const payload = profileResult?.data || profileResult;
      const centralProfile = payload?.profile || {};
      const centralUser = payload?.user || {};
      const metadata = centralUser.user_metadata || {};
      const appMetadata = centralUser.app_metadata || {};
      setProfile({
        email: centralUser.email || centralProfile.email || '',
        firstName: centralProfile.first_name || metadata.first_name || metadata.full_name?.split(' ')[0] || '',
        lastName: centralProfile.last_name || metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || '',
        phone: centralUser.phone || metadata.phone || centralProfile.phone || '',
        photo: centralProfile.profile_photo_url || metadata.avatar_url || metadata.picture || '',
        provider: centralProfile.provider || appMetadata.provider || 'email',
        createdAt: centralProfile.created_at || centralUser.created_at || '',
      });

      if (addressesResponse.ok) {
        const addressResult = await addressesResponse.json();
        const rows = addressResult?.data?.addresses || addressResult?.addresses || [];
        setAddresses(Array.isArray(rows) ? rows : []);
        setAddressLoadFailed(false);
      } else {
        setAddresses([]);
        setAddressLoadFailed(true);
      }
      setStatus('connected');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Account information could not be loaded.');
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

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
    return `${profile.firstName} ${profile.lastName}`.trim() || profile.email?.split('@')[0] || 'Your account';
  }, [profile]);
  const initials = fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'J';
  const primaryAddress = addresses.find((address) => address.is_primary) || addresses[0];

  const signOut = () => {
    // This only clears JABIYEN's local session; it does not sign out of Central Auth or other apps.
    window.localStorage.removeItem(SESSION_KEY);
    setProfile(null);
    setAddresses([]);
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
          <Link href="/" className="back-link">← <span>Back to JABIYEN</span></Link>
          <header className="page-heading">
            <span className="eyebrow">JABIYEN · BINZEO CENTRAL AUTH</span>
            <h1>My account</h1>
            <p>Your account information is securely read from Central Auth. You can update personal details and addresses in your Central Auth account.</p>
          </header>

          {status === 'loading' && (
            <section className="state-card" aria-live="polite">
              <span className="spinner" aria-hidden="true" />
              <h2>Loading your account</h2>
              <p>Connecting securely to BINZEO Central Auth…</p>
            </section>
          )}

          {(status === 'error' || status === 'signed_out') && (
            <section className="state-card" aria-live="polite">
              <div className="state-icon" aria-hidden="true">{status === 'error' ? '!' : '↗'}</div>
              <h2>{status === 'error' ? 'Account information unavailable' : 'Connect your account'}</h2>
              <p>{message}</p>
              <div className="state-actions">
                {status === 'error' && <button className="button button-secondary" type="button" onClick={() => void loadAccount()}>Try again</button>}
                <Link className="button button-primary" href="/auth/signin">{status === 'error' ? 'Sign in again' : 'Sign in securely'}</Link>
              </div>
            </section>
          )}

          {status === 'connected' && profile && (
            <>
              <section className="identity-card">
                <div className="identity-main">
                  {profile.photo ? (
                    <img className="avatar" src={profile.photo} alt={`${fullName} profile`} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="avatar avatar-fallback" aria-hidden="true">{initials}</div>
                  )}
                  <div className="identity-copy">
                    <span className="eyebrow">CENTRAL ACCOUNT</span>
                    <h2>{fullName}</h2>
                    <p>{profile.email || 'Email not provided'}</p>
                  </div>
                </div>
                <div className="connected-badge"><span /> Connected</div>
              </section>

              <section className="content-card">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">YOUR IDENTITY</span>
                    <h2>Personal information</h2>
                  </div>
                  <span className="read-only">Read only</span>
                </div>
                <div className="detail-grid">
                  <Detail label="First name" value={profile.firstName} />
                  <Detail label="Last name" value={profile.lastName} />
                  <Detail label="Email" value={profile.email} />
                  <Detail label="Phone" value={profile.phone} />
                  <Detail label="Sign-in provider" value={profile.provider === 'email' ? 'Email and password' : profile.provider} />
                  <Detail label="Member since" value={asDate(profile.createdAt)} />
                </div>
              </section>

              <section className="content-card">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">DELIVERY DETAILS</span>
                    <h2>Saved addresses</h2>
                  </div>
                  <span className="read-only">Managed in Central Auth</span>
                </div>
                {addressLoadFailed ? (
                  <p className="empty-state">Your profile is connected, but address information could not be loaded right now.</p>
                ) : addresses.length === 0 ? (
                  <p className="empty-state">No saved addresses are available in your Central Auth account.</p>
                ) : (
                  <div className="address-list">
                    {addresses.map((address, index) => (
                      <article className="address-card" key={address.id || `${address.address_line_1 || 'address'}-${index}`}>
                        <div className="address-topline">
                          <h3>{address.label || address.address_type || `Address ${index + 1}`}</h3>
                          {address.is_primary && <span className="primary-label">Primary</span>}
                        </div>
                        <p>{getAddressLine(address) || 'Address not provided'}</p>
                        <p>{[address.city, address.state_province, address.postal_code].filter(Boolean).join(', ') || 'City and postal details not provided'}</p>
                        <p>{address.country_name || address.country_code || ''}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="manage-card">
                <div>
                  <span className="eyebrow">ACCOUNT CONTROL</span>
                  <h2>Manage your information securely</h2>
                  <p>JABIYEN does not edit or store a separate copy of these details. Changes are made in Central Auth and read here when you return.</p>
                </div>
                <a className="button button-secondary" href={`${CENTRAL_AUTH_URL}/account`} target="_blank" rel="noreferrer">Open Central Auth</a>
              </section>

              <footer className="account-footer">
                <span>{refreshing ? 'Refreshing from Central Auth…' : 'Information is read live from Central Auth'}</span>
                <button type="button" onClick={() => void loadAccount({ quiet: true })} disabled={refreshing}>Refresh</button>
                <button type="button" className="signout-button" onClick={signOut}>Sign out of JABIYEN</button>
              </footer>
            </>
          )}
        </div>
      </main>
      <style jsx>{`
        .account-page { min-height: calc(100vh - 180px); background: #f6f7f8; padding: clamp(34px, 7vw, 78px) 18px 64px; color: #18212b; }
        .account-shell { max-width: 900px; margin: 0 auto; }
        .back-link { display: inline-flex; gap: 8px; margin-bottom: 38px; color: #596575; font-size: 13px; font-weight: 650; text-decoration: none; }
        .page-heading { margin-bottom: 28px; }
        .eyebrow { display: block; color: #778391; font-size: 10px; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; }
        .page-heading h1 { margin: 10px 0 10px; color: #17212b; font-size: clamp(34px, 7vw, 52px); line-height: 1.05; letter-spacing: -.045em; }
        .page-heading > p { max-width: 650px; margin: 0; color: #677380; font-size: 14px; line-height: 1.75; }
        .identity-card, .content-card, .state-card { margin-top: 16px; border: 1px solid #e6eaee; border-radius: 20px; background: #fff; box-shadow: 0 8px 28px rgba(23, 35, 47, .045); }
        .identity-card { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: clamp(20px, 4vw, 30px); }
        .identity-main { display: flex; min-width: 0; align-items: center; gap: 18px; }
        .avatar { width: 68px; height: 68px; flex: 0 0 68px; border-radius: 18px; object-fit: cover; background: #e8eef4; }
        .avatar-fallback { display: grid; place-items: center; color: #fff; background: linear-gradient(145deg, #23394d, #647c8c); font-size: 22px; font-weight: 750; }
        .identity-copy { min-width: 0; }
        .identity-copy h2 { margin: 5px 0 3px; overflow-wrap: anywhere; font-size: clamp(19px, 4vw, 24px); letter-spacing: -.03em; }
        .identity-copy p { margin: 0; overflow-wrap: anywhere; color: #687582; font-size: 13px; }
        .connected-badge { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #cfeadd; border-radius: 999px; background: #f0faf4; color: #1f7549; font-size: 11px; font-weight: 750; }
        .connected-badge span { width: 7px; height: 7px; border-radius: 50%; background: #2a9b61; }
        .content-card { padding: clamp(20px, 4vw, 30px); }
        .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 24px; }
        .section-heading h2 { margin: 5px 0 0; font-size: 19px; letter-spacing: -.025em; }
        .read-only { padding: 7px 10px; border-radius: 999px; background: #f1f4f6; color: #64717d; font-size: 10px; font-weight: 700; white-space: nowrap; }
        .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 21px 26px; }
        :global(.detail-label) { display: block; margin-bottom: 6px; color: #85909b; font-size: 10px; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
        :global(.detail-value) { min-height: 20px; overflow-wrap: anywhere; color: #26323d; font-size: 14px; font-weight: 550; }
        .address-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; }
        .address-card { min-width: 0; padding: 18px; border: 1px solid #e8ecef; border-radius: 14px; background: #fbfcfd; }
        .address-topline { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .address-topline h3 { margin: 0; color: #293640; font-size: 14px; }
        .primary-label { padding: 5px 8px; border-radius: 999px; background: #e9f3fb; color: #335f82; font-size: 9px; font-weight: 800; text-transform: uppercase; }
        .address-card p { margin: 9px 0 0; color: #687582; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
        .empty-state { margin: 0; padding: 16px; border-radius: 12px; background: #f7f9fa; color: #687582; font-size: 13px; line-height: 1.6; }
        .manage-card { display: flex; align-items: center; justify-content: space-between; gap: 22px; margin-top: 16px; padding: clamp(20px, 4vw, 28px); border-radius: 20px; background: #eaf0f3; }
        .manage-card h2 { margin: 6px 0 6px; font-size: 17px; }
        .manage-card p { max-width: 590px; margin: 0; color: #5f6d78; font-size: 12px; line-height: 1.7; }
        .button { display: inline-flex; min-height: 42px; flex: 0 0 auto; align-items: center; justify-content: center; padding: 0 16px; border: 0; border-radius: 11px; font: inherit; font-size: 12px; font-weight: 750; text-decoration: none; cursor: pointer; }
        .button-primary { background: #1d2d39; color: #fff; }
        .button-secondary { border: 1px solid #d7dfe4; background: #fff; color: #283844; }
        .state-card { display: flex; min-height: 260px; flex-direction: column; align-items: center; justify-content: center; padding: 32px 22px; text-align: center; }
        .state-card h2 { margin: 16px 0 6px; font-size: 20px; }
        .state-card p { max-width: 460px; margin: 0; color: #687582; font-size: 13px; line-height: 1.7; }
        .state-icon { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 50%; background: #edf2f5; color: #3f586b; font-size: 18px; font-weight: 800; }
        .spinner { width: 25px; height: 25px; border: 3px solid #e4e9ed; border-top-color: #2d475a; border-radius: 50%; animation: spin .8s linear infinite; }
        .state-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 20px; }
        .account-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 16px; padding: 16px 4px; color: #7b8791; font-size: 11px; }
        .account-footer > span { margin-right: auto; }
        .account-footer button { padding: 0; border: 0; background: transparent; color: #516575; font: inherit; font-size: 11px; font-weight: 750; cursor: pointer; }
        .account-footer button:disabled { opacity: .55; cursor: wait; }
        .account-footer .signout-button { color: #9c4e4b; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) {
          .back-link { margin-bottom: 27px; }
          .identity-card { align-items: flex-start; flex-direction: column; }
          .avatar { width: 56px; height: 56px; flex-basis: 56px; border-radius: 15px; }
          .detail-grid { grid-template-columns: 1fr; gap: 17px; }
          .manage-card { align-items: flex-start; flex-direction: column; }
          .account-footer { justify-content: space-between; }
          .account-footer > span { width: 100%; }
        }
      `}</style>
    </>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <span className="detail-label">{label}</span>
      <div className="detail-value">{value || 'Not provided'}</div>
    </div>
  );
}
