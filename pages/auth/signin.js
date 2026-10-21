import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

const CENTRAL_AUTH_SIGNIN_URL = 'https://auth-binzeo.vercel.app/signin';
const CLIENT_ID = 'jabiyen';

function toBase64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomBase64Url(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

async function createPkceChallenge(verifier) {
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

export default function SignIn() {
  const started = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const beginCentralSignIn = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        const state = randomBase64Url();
        const verifier = randomBase64Url(48);
        const challenge = await createPkceChallenge(verifier);
        sessionStorage.setItem('jabiyen_auth_state', state);
        sessionStorage.setItem('jabiyen_auth_verifier', verifier);
        sessionStorage.setItem('jabiyen_auth_redirect_uri', redirectUri);

        const url = new URL(CENTRAL_AUTH_SIGNIN_URL);
        url.searchParams.set('client_id', CLIENT_ID);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('state', state);
        url.searchParams.set('code_challenge', challenge);
        url.searchParams.set('code_challenge_method', 'S256');
        window.location.replace(url.toString());
      } catch (err) {
        console.error('[JABIYEN_CENTRAL_AUTH_REDIRECT_ERROR]', err);
        setError('Central authentication could not be opened. Please try again.');
      }
    };

    void beginCentralSignIn();
  }, []);

  return (
    <>
      <Head>
        <title>Secure Sign In | JABIYEN</title>
        <meta name="description" content="Sign in securely through Central BINZEO Auth" />
      </Head>
      <main style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <section style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, padding: '40px 36px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}>
          <img src="/logo.png" alt="JABIYEN" style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px' }} />
          <h1 style={{ fontFamily: "var(--font-heading), 'Manrope', sans-serif", fontSize: 26, fontWeight: 800, color: '#1d1d1f', margin: '0 0 10px' }}>Secure Sign In</h1>
          <p style={{ fontSize: 15, color: '#68686d', lineHeight: 1.6, margin: '0 0 24px' }}>
            Opening Central BINZEO Auth. Email, OTP, temporary token, QR and passkey verification are handled there.
          </p>
          {error ? (
            <div style={{ color: '#c62828', fontSize: 14 }}>{error}</div>
          ) : (
            <div style={{ color: '#86868b', fontSize: 14 }}>Redirecting securely…</div>
          )}
        </section>
      </main>
    </>
  );
}
