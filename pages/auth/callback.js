import Head from 'next/head';
import { useEffect, useState } from 'react';

const CLIENT_ID = 'jabiyen';
const REDIRECT_URI = 'https://jabiyen-website.vercel.app/auth/callback';

export default function AuthCallback() {
  const [message, setMessage] = useState('Completing secure sign-in…');

  useEffect(() => {
    let cancelled = false;
    const complete = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const returnedState = params.get('state');
      const expectedState = sessionStorage.getItem('jabiyen_sso_state');
      const verifier = sessionStorage.getItem('jabiyen_sso_verifier');
      const redirectUri = sessionStorage.getItem('jabiyen_sso_redirect_uri') || REDIRECT_URI;
      if (!code || !returnedState || !expectedState || returnedState !== expectedState || !verifier || redirectUri !== REDIRECT_URI) {
        setMessage('This sign-in link is invalid or expired. Please start again.');
        return;
      }
      try {
        const res = await fetch('/api/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: CLIENT_ID, redirect_uri: redirectUri, code, code_verifier: verifier }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || !result.success) throw new Error(result.error?.message || 'Central token exchange failed');
        const session = result.data?.session;
        if (!session?.access_token) throw new Error('Central Auth did not return a valid session');
        localStorage.setItem('jayenware_session', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token || null,
          expires_at: session.expires_at || null,
          user_id: session.user?.id || null,
        }));
        sessionStorage.removeItem('jabiyen_sso_state');
        sessionStorage.removeItem('jabiyen_sso_verifier');
        sessionStorage.removeItem('jabiyen_sso_redirect_uri');
        if (!cancelled) window.location.replace('/auth/account');
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Secure sign-in could not be completed.');
      }
    };
    void complete();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Head><title>Completing Sign In | JAYENWARE</title></Head>
      <main style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <section style={{ maxWidth: 440, width: '100%', padding: 36, textAlign: 'center', borderRadius: 24, background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
          <img src="/logo.png" alt="JAYENWARE" style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 18px' }} />
          <p style={{ margin: 0, color: '#68686d', lineHeight: 1.6 }}>{message}</p>
          {message.includes('invalid') || message.includes('expired') || message.includes('could not') ? <a href="/auth/signin" style={{ display: 'inline-block', marginTop: 20, color: '#007aff', fontWeight: 600 }}>Return to sign in</a> : null}
        </section>
      </main>
    </>
  );
}
