import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const CENTRAL_AUTH = 'https://auth-binzeo.vercel.app';
const CLIENT_ID = 'jabiyen';
const REDIRECT_URI = 'https://jabiyen-website.vercel.app/account';
const SESSION_KEY = 'jabiyen_central_session';

function base64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomValue(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function createCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getStoredSession() {
  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function Detail({ label, children }) {
  return <div><span style={styles.detailLabel}>{label}</span><strong style={styles.detailValue}>{children || '—'}</strong></div>;
}

export default function AccountPage() {
  const [connection, setConnection] = useState('checking');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async (session) => {
    if (!session?.access_token) {
      setConnection('not_connected');
      setProfile(null);
      return;
    }
    const response = await fetch('/api/me', {
      headers: { Accept: 'application/json', Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      window.localStorage.removeItem(SESSION_KEY);
      setConnection('not_connected');
      setProfile(null);
      throw new Error(result.error?.message || 'Central Auth session expired. Please connect again.');
    }
    setProfile(result.data || {});
    setConnection('connected');
  }, []);

  const exchangeCode = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    if (!code && !returnedState) return false;

    const expectedState = window.sessionStorage.getItem('jabiyen_sso_state');
    const verifier = window.sessionStorage.getItem('jabiyen_sso_verifier');
    if (!code || !returnedState || !expectedState || returnedState !== expectedState || !verifier) {
      throw new Error('This Central Auth response is invalid or expired. Please connect again.');
    }

    setLoading(true);
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, code, code_verifier: verifier }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success || !result.data?.session?.access_token) {
      throw new Error(result.error?.message || 'Central Auth token exchange failed.');
    }

    const session = result.data.session;
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token || null,
      expires_at: session.expires_at || null,
      user_id: session.user?.id || null,
    }));
    window.sessionStorage.removeItem('jabiyen_sso_state');
    window.sessionStorage.removeItem('jabiyen_sso_verifier');
    window.history.replaceState({}, '', '/account');
    await loadProfile(session);
    return true;
  }, [loadProfile]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const handled = await exchangeCode();
        if (!handled) await loadProfile(getStoredSession());
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'Unable to load Central Auth account.');
          setConnection('not_connected');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [exchangeCode, loadProfile]);

  const startConnection = async () => {
    setError('');
    setLoading(true);
    try {
      const state = randomValue(32);
      const verifier = randomValue(48);
      const challenge = await createCodeChallenge(verifier);
      window.sessionStorage.setItem('jabiyen_sso_state', state);
      window.sessionStorage.setItem('jabiyen_sso_verifier', verifier);
      const query = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      });
      window.location.assign(`${CENTRAL_AUTH}/signin?${query.toString()}`);
    } catch {
      setLoading(false);
      setError('Central Auth could not be opened. Please try again.');
    }
  };

  const signOut = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setProfile(null);
    setConnection('not_connected');
    setError('');
  };

  const user = profile?.user || {};
  const central = profile?.profile || {};
  const address = profile?.address || {};
  const name = central.display_name || [central.first_name, central.last_name].filter(Boolean).join(' ') || user.email || 'Central Account';
  const image = central.profile_photo_url;

  return (
    <>
      <Head>
        <title>Account | JABIYEN</title>
        <meta name="description" content="View your JABIYEN account information from BINZEO Central Auth." />
      </Head>
      <main style={styles.page}>
        <div style={styles.shell}>
          <Link href="/" style={styles.back}>← Back to JABIYEN</Link>
          <div style={styles.eyebrow}>JABIYEN × BINZEO</div>
          <h1 style={styles.title}>Account</h1>
          <p style={styles.lead}>Your identity is managed by BINZEO Central Auth. JABIYEN never stores your password or performs its own authentication.</p>

          {error && <div role="alert" style={styles.error}>{error}</div>}

          <section style={styles.card} aria-labelledby="account-summary">
            <div style={styles.cardHead}>
              <div>
                <div style={styles.label}>Account provider</div>
                <h2 id="account-summary" style={styles.cardTitle}>BINZEO Central Account</h2>
              </div>
              <span style={{ ...styles.badge, ...(connection === 'connected' ? styles.badgeGood : styles.badgeIdle) }}>
                {connection === 'checking' ? 'Checking…' : connection === 'connected' ? 'Connected' : 'Not connected'}
              </span>
            </div>

            <div style={styles.details}>
              <Detail label="Website">JABIYEN</Detail>
              <Detail label="Identity">BINZEO Central Auth</Detail>
              <Detail label="Password sharing">Never</Detail>
            </div>

            {connection === 'connected' && profile ? (
              <div style={styles.profilePanel}>
                <div style={styles.profileHeader}>
                  {image ? <img src={image} alt={name} style={styles.avatar} /> : <div style={styles.avatarFallback}>{name.charAt(0).toUpperCase()}</div>}
                  <div style={{ minWidth: 0 }}>
                    <h3 style={styles.profileName}>{name}</h3>
                    <p style={styles.profileEmail}>{user.email || '—'}</p>
                  </div>
                </div>
                <div style={styles.profileGrid}>
                  <Detail label="First name">{central.first_name}</Detail>
                  <Detail label="Last name">{central.last_name}</Detail>
                  <Detail label="Username">{central.username ? `@${central.username}` : '—'}</Detail>
                  <Detail label="Country">{central.country_code}</Detail>
                  <Detail label="Language">{central.preferred_language}</Detail>
                  <Detail label="Timezone">{central.timezone}</Detail>
                  <Detail label="Account status">{central.account_status}</Detail>
                  <Detail label="Email verified">{user.email_verified ? 'Verified' : 'Not verified'}</Detail>
                </div>
                <div style={styles.addressBox}>
                  <h3 style={styles.sectionTitle}>Address</h3>
                  <div style={styles.profileGrid}>
                    <Detail label="Address line 1">{address.address_line_1}</Detail>
                    <Detail label="Address line 2">{address.address_line_2}</Detail>
                    <Detail label="Area">{address.area}</Detail>
                    <Detail label="City">{address.city}</Detail>
                    <Detail label="District">{address.district}</Detail>
                    <Detail label="State / province">{address.state_province}</Detail>
                    <Detail label="Postal code">{address.postal_code}</Detail>
                    <Detail label="Country">{address.country_code}</Detail>
                  </div>
                </div>
                <button type="button" onClick={signOut} style={styles.secondaryButton}>Disconnect this browser session</button>
              </div>
            ) : (
              <>
                <p style={styles.note}>Connect through BINZEO Central Auth to securely view the account details approved for JABIYEN.</p>
                <button type="button" onClick={startConnection} disabled={loading} style={{ ...styles.primary, opacity: loading ? 0.65 : 1 }}>
                  {loading ? 'Opening Central Auth…' : 'Connect Central Account'}
                </button>
              </>
            )}
          </section>

        </div>
      </main>
    </>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f6f6f3', color: '#1d1d1f', padding: 'clamp(28px, 7vw, 80px) 20px', fontFamily: "'Manrope', Arial, sans-serif" },
  shell: { maxWidth: 760, margin: '0 auto' },
  back: { display: 'inline-block', marginBottom: 48, color: '#555', fontSize: 12, fontWeight: 700, textDecoration: 'none', letterSpacing: '.06em' },
  eyebrow: { color: '#777', fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase' },
  title: { margin: '10px 0 14px', fontSize: 'clamp(38px, 8vw, 68px)', lineHeight: 1, letterSpacing: '-.06em', fontWeight: 800 },
  lead: { maxWidth: 570, margin: 0, color: '#666', fontSize: 15, lineHeight: 1.8 },
  error: { marginTop: 24, padding: '13px 16px', borderRadius: 14, background: '#fff0f0', color: '#a32929', fontSize: 13, lineHeight: 1.5 },
  card: { marginTop: 38, padding: 'clamp(22px, 5vw, 38px)', borderRadius: 26, background: '#fff', border: '1px solid #e8e8e4', boxShadow: '0 20px 60px rgba(0,0,0,.06)' },
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 },
  label: { marginBottom: 8, color: '#999', fontSize: 10, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase' },
  cardTitle: { margin: 0, fontSize: 24, letterSpacing: '-.04em' },
  badge: { flexShrink: 0, borderRadius: 999, padding: '8px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' },
  badgeGood: { background: '#e8f7ee', color: '#167243' },
  badgeIdle: { background: '#f0f0ed', color: '#777' },
  details: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 18, margin: '30px 0 22px', padding: '20px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' },
  detailLabel: { display: 'block', marginBottom: 7, color: '#999', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' },
  detailValue: { display: 'block', fontSize: 13, lineHeight: 1.45, overflowWrap: 'anywhere' },
  profilePanel: { paddingTop: 4 },
  profileHeader: { display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 24, borderBottom: '1px solid #eee' },
  avatar: { width: 68, height: 68, borderRadius: 20, objectFit: 'cover', border: '1px solid #e5e5e5' },
  avatarFallback: { width: 68, height: 68, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff', fontSize: 28, fontWeight: 800 },
  profileName: { margin: 0, fontSize: 22, letterSpacing: '-.03em', overflowWrap: 'anywhere' },
  profileEmail: { margin: '6px 0 0', color: '#777', fontSize: 13, overflowWrap: 'anywhere' },
  profileGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginTop: 24 },
  addressBox: { margin: '28px 0 22px', paddingTop: 22, borderTop: '1px solid #eee' },
  sectionTitle: { margin: '0 0 18px', fontSize: 16, letterSpacing: '-.02em' },
  note: { margin: '0 0 24px', color: '#666', fontSize: 13, lineHeight: 1.7 },
  primary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '0 20px', border: 0, borderRadius: 999, background: '#111', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' },
  secondaryButton: { minHeight: 40, padding: '0 16px', border: '1px solid #ddd', borderRadius: 999, background: '#fff', color: '#333', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
};
