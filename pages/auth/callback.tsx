import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const CLIENT_ID = 'jabiyen:website';

export default function AuthCallback() {
  const [message, setMessage] = useState('Completing secure sign in…');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  // useRef ব্যবহার করা হয়েছে যাতে React Strict Mode-এ useEffect দুইবার রান হলেও 
  // একবারই API কল হয়।
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const completeSignIn = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const returnedState = params.get('state');
      const expectedState = sessionStorage.getItem('jabiyen_auth_state');
      const verifier = sessionStorage.getItem('jabiyen_auth_verifier');
      const redirectUri = sessionStorage.getItem('jabiyen_auth_redirect_uri') || `${window.location.origin}/auth/callback`;

      // যদি URL-এ code বা state না থাকে, অথবা sessionStorage খালি থাকে
      if (!code || !returnedState) {
        setIsLoading(false);
        setIsError(true);
        setMessage('No authorization code found. Please start the sign-in process again.');
        return;
      }

      if (!expectedState || returnedState !== expectedState || !verifier) {
        setIsLoading(false);
        setIsError(true);
        setMessage('Your sign-in session expired or was invalid. Please try signing in again.');
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

        // সফলভাবে টোকেন সেভ হওয়ার পর সেশন স্টোরেজ ক্লিয়ার করা
        sessionStorage.removeItem('jabiyen_auth_state');
        sessionStorage.removeItem('jabiyen_auth_verifier');
        sessionStorage.removeItem('jabiyen_auth_redirect_uri');
        
        // অ্যাকাউন্ট পেজে রিডাইরেক্ট
        window.location.replace('/auth/account');
        
      } catch (err) {
        console.error('[JABIYEN_AUTH_CALLBACK_ERROR]', err);
        setIsLoading(false);
        setIsError(true);
        setMessage(
          err.message === 'Central token exchange failed' || err.message.includes('invalid')
            ? 'The sign-in link has already been used or expired. Please sign in again.'
            : 'Central authentication could not be completed. Please sign in again.'
        );
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
          
          {isLoading ? (
            /* লোডিং অবস্থা */
            <>
              <div className="spinner" aria-hidden="true" />
              <h1 className="auth-title">Central Auth</h1>
              <p className="auth-message">{message}</p>
            </>
          ) : isError ? (
            /* এরর অবস্থা */
            <>
              <div className="error-icon" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h1 className="auth-title">Sign In Failed</h1>
              <p className="auth-message">{message}</p>
              
              {/* পুনরায় সাইন ইন করার বাটন */}
              <div className="auth-actions">
                <Link href="/auth/signin" className="btn btn-primary">
                  Sign In Again
                </Link>
              </div>
            </>
          ) : null}

        </div>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #ffffff;
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

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f0f0f0;
          border-top: 3px solid #111;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 24px;
        }

        .error-icon {
          margin-bottom: 20px;
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
          margin: 0 0 24px;
          font-weight: 400;
        }

        .auth-actions {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 24px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .btn-primary {
          background: #111;
          color: #fff;
          border: none;
        }

        .btn-primary:hover {
          opacity: 0.8;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
