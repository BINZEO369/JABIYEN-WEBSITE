import { useEffect, useState } from 'react';
import Head from 'next/head';

const CLIENT_ID = 'jabiyen:website';

export default function AuthCallback() {
  const [message, setMessage] = useState('Completing secure sign in…');

  useEffect(() => {
    const completeSignIn = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const returnedState = params.get('state');
      const expectedState = sessionStorage.getItem('jabiyen_auth_state');
      const verifier = sessionStorage.getItem('jabiyen_auth_verifier');
      const redirectUri = sessionStorage.getItem('jabiyen_auth_redirect_uri') || `${window.location.origin}/auth/callback`;

      if (!code || !returnedState || !expectedState || returnedState !== expectedState || !verifier) {
        setMessage('The sign-in response was invalid or expired. Please start again.');
        return;
      }

      try {
        const response = await fetch('/api/auth/token', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            redirect_uri: redirectUri,
            code,
            code_verifier: verifier,
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success || !result.data?.session?.access_token) {
          throw new Error(result.error?.message || 'Central token exchange failed');
        }

        const session = result.data.session;
        localStorage.setItem('jayenware_session', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token || null,
          expires_at: session.expires_at || null,
          user_id: session.user?.id || null,
        }));
        sessionStorage.removeItem('jabiyen_auth_state');
        sessionStorage.removeItem('jabiyen_auth_verifier');
        sessionStorage.removeItem('jabiyen_auth_redirect_uri');
        window.location.replace('/auth/account');
      } catch (err) {
        console.error('[JABIYEN_AUTH_CALLBACK_ERROR]', err);
        setMessage('Central authentication could not be completed. Please sign in again.');
      }
    };

    void completeSignIn();
  }, []);

  return (
    <>
      <Head>
        <title>Completing Sign In | JABIYEN</title>
      </Head>
      <main style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <section style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, padding: '40px 36px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1d1d1f', margin: '0 0 12px' }}>Central Auth</h1>
          <p style={{ fontSize: 15, color: '#68686d', lineHeight: 1.6, margin: 0 }}>{message}</p>
        </section>
      </main>
    </>
  );
}
