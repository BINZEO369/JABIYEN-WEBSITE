import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

const CENTRAL_AUTH_SIGNIN_URL = 'https://auth-binzeo.vercel.app/signin';
const CLIENT_ID = 'jabiyen:website';
const SESSION_KEY = 'jayenware_session';

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
  // 'checking' | 'ready' | 'redirecting' | 'error'
  const [status, setStatus] = useState('checking'); 
  const [error, setError] = useState('');
  
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // ১. প্রথমে চেক করা হচ্ছে ইউজার আগে থেকে লগইন করা আছে কিনা
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session?.access_token) {
          // ইউজার অলরেডি লগইন করা আছে, সরাসরি অ্যাকাউন্ট পেজে পাঠিয়ে দেওয়া হবে
          window.location.replace('/auth/account');
          return;
        }
      }
    } catch (err) {
      console.warn('Could not read local session', err);
    }

    // লগইন করা না থাকলে বাটন দেখানোর জন্য ready স্টেট সেট হবে
    setStatus('ready');
  }, []);

  const handleConnect = async () => {
    setStatus('redirecting');
    setError('');

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
      
      // ইউজার ক্লিক করলে সেন্ট্রাল অথ-এ রিডাইরেক্ট হবে
      window.location.replace(url.toString());
    } catch (err) {
      console.error('[JABIYEN_CENTRAL_AUTH_REDIRECT_ERROR]', err);
      setStatus('error');
      setError('Central authentication could not be opened. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Secure Sign In | JABIYEN</title>
        <meta name="description" content="Sign in securely through Central BINZEO Auth" />
      </Head>

      <div className="auth-container">
        <div className="auth-content">
          
          {/* Checking State */}
          {status === 'checking' && (
            <>
              <div className="spinner" aria-hidden="true" />
              <p className="auth-message">Checking session...</p>
            </>
          )}

          {/* Ready State (Show Button) */}
          {status === 'ready' && (
            <>
              <div className="logo-wrapper">
                <img src="/logo.png" alt="JABIYEN" className="logo" />
              </div>
              <h1 className="auth-title">Connect your account</h1>
              <p className="auth-message">
                Sign in securely with BINZEO Central Auth to access your profile, orders, and saved addresses.
              </p>
              <button className="connect-btn" onClick={handleConnect}>
                Connect BINZEO ID
              </button>
            </>
          )}

          {/* Redirecting State */}
          {status === 'redirecting' && (
            <>
              <div className="spinner" aria-hidden="true" />
              <h1 className="auth-title">Connecting...</h1>
              <p className="auth-message">Opening Central BINZEO Auth securely...</p>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="error-icon" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h1 className="auth-title">Connection Failed</h1>
              <p className="auth-message">{error}</p>
              <button className="connect-btn" onClick={handleConnect}>
                Try Again
              </button>
            </>
          )}

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
          max-width: 420px;
          width: 100%;
        }

        .logo-wrapper {
          margin-bottom: 24px;
        }

        .logo {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          object-fit: cover;
        }

        .auth-title {
          font-size: 26px;
          font-weight: 600;
          color: #111;
          margin: 0 0 12px;
          letter-spacing: -0.5px;
        }

        .auth-message {
          font-size: 15px;
          color: #777;
          line-height: 1.6;
          margin: 0 0 32px;
          font-weight: 400;
        }

        /* Minimalist Dark Button */
        .connect-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 52px;
          padding: 0 24px;
          background-color: #111;
          color: #ffffff;
          border: none;
          border-radius: 100px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.1s ease;
        }

        .connect-btn:hover {
          background-color: #333;
        }

        .connect-btn:active {
          transform: scale(0.98);
        }

        /* Loader Spinner */
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
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
