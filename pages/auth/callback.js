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
      
      <div className="auth-container">
        <div className="auth-content">
          {/* Loader Spinner */}
          <div className="spinner" aria-hidden="true" />
          
          <h1 className="auth-title">Central Auth</h1>
          <p className="auth-message">{message}</p>
        </div>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #ffffff; /* Pure White Background */
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <style jsx>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100%;
          background-color: #ffffff;
          padding: 20px;
        }

        .auth-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 400px;
        }

        /* Minimalist CSS Spinner */
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f0f0f0;
          border-top: 3px solid #111;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 24px;
        }

        .auth-title {
          font-size: 24px;
          font-weight: 600;
          color: #111;
          margin: 0 0 12px;
          letter-spacing: -0.5px;
        }

        .auth-message {
          font-size: 15px;
          color: #777;
          line-height: 1.6;
          margin: 0;
          font-weight: 400;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
