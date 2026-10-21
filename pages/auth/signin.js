import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const CENTRAL_AUTH_URL = 'https://auth-binzeo.vercel.app/signin';
const CLIENT_ID = 'jabiyen';
const REDIRECT_URI = 'https://jabiyen-website.vercel.app/auth/callback';

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

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get('error');
    if (message) setError(message.replace(/_/g, ' '));
  }, []);

  const continueToCentralAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const state = randomValue(32);
      const verifier = randomValue(48);
      const challenge = await createCodeChallenge(verifier);
      sessionStorage.setItem('jabiyen_sso_state', state);
      sessionStorage.setItem('jabiyen_sso_verifier', verifier);
      sessionStorage.setItem('jabiyen_sso_redirect_uri', REDIRECT_URI);
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      });
      window.location.assign(`${CENTRAL_AUTH_URL}?${params.toString()}`);
    } catch {
      setLoading(false);
      setError('Central authentication could not be started. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Sign In | JAYENWARE</title>
        <meta name="description" content="Secure sign in through Central BINZEO Auth" />
      </Head>
      <main style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <section style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, padding: '40px 36px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}>
          <img src="/logo.png" alt="JAYENWARE" style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px' }} />
          <h1 style={{ fontFamily: "var(--font-heading), 'Manrope', sans-serif", fontSize: 26, fontWeight: 800, color: '#1d1d1f', margin: '0 0 10px' }}>Welcome Back</h1>
          <p style={{ fontSize: 15, color: '#68686d', lineHeight: 1.6, margin: '0 0 26px' }}>
            Sign in securely through Central BINZEO Auth. Your password, OTP, token, QR and passkey are verified there—not on JABIYEN.
          </p>
          {error && <div role="alert" style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 12, background: '#fff2f2', color: '#b42318', fontSize: 13 }}>{error}</div>}
          <button type="button" onClick={continueToCentralAuth} disabled={loading} style={{ width: '100%', padding: '14px 24px', background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Opening Central Auth…' : 'Continue with BINZEO Auth'}
          </button>
          <p style={{ fontSize: 14, color: '#86868b', margin: '24px 0 0' }}>
            Need an account? <Link href="/auth/signup" style={{ color: '#007aff', textDecoration: 'none', fontWeight: 600 }}>Create one through Central Auth</Link>
          </p>
        </section>
      </main>
    </>
  );
}
