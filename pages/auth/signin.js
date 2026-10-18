import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const CENTRAL_AUTH_URL = 'https://auth-binzeo.vercel.app/signin';
const CLIENT_ID = 'jabiyen:website';
const CALLBACK_PATH = '/auth/callback';
const PENDING_KEY = 'binzeo.central-auth.pkce.jabiyen.website';

const methods = [
  { id: 'passkey', title: 'Passkey', description: 'Fingerprint, Face ID, or security key', icon: '⌑' },
  { id: 'email', title: 'Email and password', description: 'Verify your account with Central Auth', icon: '✉' },
  { id: 'token', title: 'One-time token', description: 'Use a secure token from Central Auth', icon: '⌘' },
  { id: 'qr', title: 'Scan QR code', description: 'Scan a Central Auth sign-in QR code', icon: '▦' },
];

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export default function SignIn() {
  const [loadingMethod, setLoadingMethod] = useState('');
  const [error, setError] = useState('');

  const startCentralAuth = async (method) => {
    if (loadingMethod) return;
    setLoadingMethod(method);
    setError('');
    try {
      if (!window.crypto?.subtle || !window.crypto?.getRandomValues) {
        throw new Error('Secure sign-in requires a modern browser on HTTPS.');
      }
      const stateBytes = crypto.getRandomValues(new Uint8Array(32));
      const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
      const state = base64Url(stateBytes);
      const codeVerifier = base64Url(verifierBytes);
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
      const codeChallenge = base64Url(new Uint8Array(digest));
      const redirectUri = `${window.location.origin}${CALLBACK_PATH}`;

      sessionStorage.setItem(PENDING_KEY, JSON.stringify({
        state,
        codeVerifier,
        redirectUri,
        createdAt: Date.now(),
      }));

      const authUrl = new URL(CENTRAL_AUTH_URL);
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('method', method);
      window.location.assign(authUrl.toString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start secure sign-in. Please try again.');
      setLoadingMethod('');
    }
  };

  return (
    <>
      <Head>
        <title>Secure Sign In | JABIYEN</title>
        <meta name="description" content="Sign in to JABIYEN using BINZEO Central Auth." />
        <meta name="referrer" content="no-referrer" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', background: 'linear-gradient(145deg, #f7f8fa 0%, #ffffff 54%, #f4f6f8 100%)' }}>
        <section style={{ width: '100%', maxWidth: 480, background: '#fff', border: '1px solid #eceef1', borderRadius: 24, padding: '36px 30px', boxShadow: '0 18px 55px rgba(18, 27, 39, .09)' }}>
          <header style={{ textAlign: 'center', marginBottom: 28 }}>
            <img src="/logo.png" alt="JABIYEN" width="52" height="52" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 14, margin: '0 auto 14px' }} />
            <p style={{ margin: '0 0 8px', color: '#737b87', fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase' }}>JABIYEN · Secure Access</p>
            <h1 style={{ margin: 0, color: '#171a20', fontSize: 27, lineHeight: 1.2, fontWeight: 750 }}>Welcome back</h1>
            <p style={{ margin: '10px 0 0', color: '#737b87', fontSize: 14, lineHeight: 1.55 }}>Choose how you want to sign in. BINZEO Central Auth verifies your identity and returns you here securely.</p>
          </header>

          {error && <div role="alert" style={{ marginBottom: 16, border: '1px solid #f2c3c3', background: '#fff6f6', color: '#9f2525', borderRadius: 12, padding: '12px 14px', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'grid', gap: 10 }}>
            {methods.map((method) => {
              const active = loadingMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => void startCentralAuth(method.id)}
                  disabled={Boolean(loadingMethod)}
                  aria-label={`Continue with ${method.title}`}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 15px', textAlign: 'left', color: '#20242b', background: active ? '#f2f5f8' : '#fff', border: '1px solid #e1e5ea', borderRadius: 14, cursor: loadingMethod ? 'wait' : 'pointer', opacity: loadingMethod && !active ? .55 : 1, transition: 'background .18s ease, border-color .18s ease, transform .18s ease' }}
                  onMouseEnter={(event) => { if (!loadingMethod) event.currentTarget.style.borderColor = '#aab4c0'; }}
                  onMouseLeave={(event) => { event.currentTarget.style.borderColor = '#e1e5ea'; }}
                >
                  <span aria-hidden="true" style={{ width: 42, height: 42, flex: '0 0 42px', display: 'grid', placeItems: 'center', borderRadius: 12, color: '#1d2834', background: '#f2f5f7', fontSize: 21, fontWeight: 600 }}>{active ? '…' : method.icon}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 650 }}>{active ? 'Connecting to Central Auth…' : method.title}</span>
                    <span style={{ display: 'block', marginTop: 4, color: '#737b87', fontSize: 12, lineHeight: 1.35 }}>{method.description}</span>
                  </span>
                  <span aria-hidden="true" style={{ color: '#9aa2ad', fontSize: 18 }}>›</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 22, padding: '13px 14px', borderRadius: 12, background: '#f7f9fb', color: '#69727e', fontSize: 11.5, lineHeight: 1.55 }}>
            Your password, passkey, and any 2FA code are entered only on BINZEO Central Auth. JABIYEN receives a short-lived, single-use authorization code—not your credentials.
          </div>
          <footer style={{ marginTop: 22, textAlign: 'center' }}>
            <Link href="/" style={{ color: '#5e6875', fontSize: 12, textDecoration: 'none' }}>Return to JABIYEN</Link>
            <p style={{ margin: '10px 0 0', color: '#a0a6af', fontSize: 10.5 }}>Protected by BINZEO Central Auth · PKCE protected sign-in</p>
          </footer>
        </section>
      </main>
    </>
  );
}
