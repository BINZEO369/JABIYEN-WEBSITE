import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const CENTRAL_AUTH_URL = 'https://auth-binzeo.vercel.app/oauth/authorize';
const CLIENT_ID = 'jabiyen';
const CALLBACK_PATH = '/auth/callback';
const PENDING_KEY = 'binzeo.central-auth.pkce.jabiyen.website';

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export default function SignIn() {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const startCentralAuth = async () => {
    if (connecting) return;
    setConnecting(true);
    setError('');
    try {
      if (!window.crypto?.subtle || !window.crypto?.getRandomValues) {
        throw new Error('Secure sign-in requires a modern browser on HTTPS.');
      }

      const state = base64Url(crypto.getRandomValues(new Uint8Array(32)));
      const codeVerifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
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
      authUrl.searchParams.set('handoff', 'one-time');
      // No method is specified: Central Auth presents and handles all supported methods.
      window.location.assign(authUrl.toString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start secure sign-in. Please try again.');
      setConnecting(false);
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
            <h1 style={{ margin: 0, color: '#171a20', fontSize: 27, lineHeight: 1.2, fontWeight: 750 }}>Sign in securely</h1>
            <p style={{ margin: '10px 0 0', color: '#737b87', fontSize: 14, lineHeight: 1.55 }}>Continue to BINZEO Central Auth. Choose your sign-in method and verify your identity there.</p>
          </header>

          {error && <div role="alert" style={{ marginBottom: 16, border: '1px solid #f2c3c3', background: '#fff6f6', color: '#9f2525', borderRadius: 12, padding: '12px 14px', fontSize: 13 }}>{error}</div>}

          <button
            type="button"
            onClick={() => void startCentralAuth()}
            disabled={connecting}
            aria-label="Sign in with BINZEO Central Auth"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '15px 18px', color: '#fff', background: connecting ? '#455361' : '#1d2834', border: '1px solid #1d2834', borderRadius: 14, cursor: connecting ? 'wait' : 'pointer', opacity: connecting ? .85 : 1, fontSize: 14, fontWeight: 700, transition: 'background .18s ease, transform .18s ease' }}
          >
            <span aria-hidden="true" style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', borderRadius: 8, color: '#1d2834', background: '#fff', fontSize: 17, fontWeight: 800 }}>B</span>
            {connecting ? 'Connecting to Central Auth…' : 'Continue with BINZEO Central Auth'}
          </button>

          <div style={{ marginTop: 22, padding: '13px 14px', borderRadius: 12, background: '#f7f9fb', color: '#69727e', fontSize: 11.5, lineHeight: 1.55 }}>
            Email, password, OTP, passkey, one-time token and QR sign-in are handled only by BINZEO Central Auth. JABIYEN never verifies these credentials; it receives a short-lived, single-use, PKCE-protected handoff ticket after sign-in.
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
