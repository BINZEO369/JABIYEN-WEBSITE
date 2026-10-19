import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const CENTRAL_AUTH_URL = 'https://auth-binzeo.vercel.app/oauth/authorize';
const CLIENT_ID = 'jabiyen';
const CALLBACK_PATH = '/auth/callback';
const PENDING_KEY = 'binzeo.central-auth.pkce.jabiyen.website';

// Background Image Path
const HERO_IMAGE = '/images/signin-hero1.jpg';
// Binzeo Logo URL from GitHub
const BINZEO_FAVICON =
  'https://raw.githubusercontent.com/BINZEO369/auth.binzeo/main/public/favicon.png';

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
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(codeVerifier)
      );
      const codeChallenge = base64Url(new Uint8Array(digest));
      const redirectUri = `${window.location.origin}${CALLBACK_PATH}`;

      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify({
          state,
          codeVerifier,
          redirectUri,
          createdAt: Date.now(),
        })
      );

      const authUrl = new URL(CENTRAL_AUTH_URL);
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('handoff', 'one-time');
      
      window.location.assign(authUrl.toString());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not start secure sign-in. Please try again.'
      );
      setConnecting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Secure Sign In | JABIYEN</title>
        <meta
          name="description"
          content="Sign in to JABIYEN using BINZEO Central Auth."
        />
        <meta name="referrer" content="no-referrer" />
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main className="page-container">
        {/* Background Image Layer */}
        <div className="bg-image" />
        
        {/* Dark Overlay to enhance glass readability */}
        <div className="bg-overlay" />

        {/* Liquid Glass Card */}
        <section className="glass-card">
          
          {/* Logo Connection Area - No borders, pure sleek design */}
          <div className="logo-connection">
            <img
              src="/logo.png"
              alt="JABIYEN"
              className="logo-img jabiyen-logo"
            />
            <div className="connection-line">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <img
              src={BINZEO_FAVICON}
              alt="BINZEO Central Auth"
              className="logo-img binzeo-logo"
            />
          </div>

          <header className="text-header">
            <h1>Sign in securely</h1>
            <p>
              Continue to BINZEO Central Auth to securely access your JABIYEN account.
            </p>
          </header>

          {error && (
            <div role="alert" className="error-box">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => void startCentralAuth()}
            disabled={connecting}
            className="auth-button"
          >
            {/* Replaced B with actual Binzeo Logo */}
            <img
              src={BINZEO_FAVICON}
              alt=""
              className="button-icon"
              aria-hidden="true"
            />
            <span>
              {connecting ? 'Connecting securely…' : 'Continue with BINZEO'}
            </span>
          </button>

          <div className="info-box">
            <p>
              JABIYEN never stores or verifies your passwords. All authentication
              is handled securely by BINZEO Central Auth using PKCE protocols.
            </p>
          </div>

          <footer className="card-footer">
            <Link href="/" className="back-link">
              Return to JABIYEN
            </Link>
          </footer>
        </section>

        <style jsx>{`
          .page-container {
            position: relative;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              Helvetica, Arial, sans-serif;
          }

          .bg-image {
            position: absolute;
            inset: 0;
            background-image: url(${HERO_IMAGE});
            background-size: cover;
            background-position: center;
            z-index: 0;
            /* Slight scale to prevent blur edges */
            transform: scale(1.05); 
          }

          .bg-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              145deg,
              rgba(15, 25, 40, 0.45) 0%,
              rgba(10, 15, 25, 0.65) 100%
            );
            z-index: 1;
          }

          /* Liquid Glass Card styling inspired by the reference */
          .glass-card {
            position: relative;
            z-index: 2;
            width: 100%;
            max-width: 420px;
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(32px) saturate(180%);
            -webkit-backdrop-filter: blur(32px) saturate(180%);
            border-radius: 40px; /* High border radius like iOS */
            padding: 40px 32px 32px;
            box-shadow: 
              0 30px 60px -10px rgba(0, 0, 0, 0.5),
              inset 0 1px 1px rgba(255, 255, 255, 0.4), /* Top glass reflection */
              inset 0 -1px 1px rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          /* Logo Area */
          .logo-connection {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 28px;
            width: 100%;
          }

          .logo-img {
            object-fit: contain;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
          }

          .jabiyen-logo {
            width: 48px;
            height: 48px;
            border-radius: 12px; /* Soft round corners for jabiyen logo */
          }

          .binzeo-logo {
            width: 44px;
            height: 44px;
          }

          .connection-line {
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
            animation: pulse 3s infinite ease-in-out;
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
          }

          /* Text Header */
          .text-header {
            text-align: center;
            margin-bottom: 28px;
            width: 100%;
          }

          .text-header h1 {
            margin: 0 0 8px;
            font-size: 26px;
            font-weight: 600;
            letter-spacing: -0.5px;
            color: #ffffff;
          }

          .text-header p {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
            color: rgba(255, 255, 255, 0.7);
            padding: 0 10px;
          }

          /* Error Box */
          .error-box {
            width: 100%;
            margin-bottom: 20px;
            background: rgba(255, 60, 60, 0.15);
            border: 1px solid rgba(255, 60, 60, 0.3);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 12px 16px;
            color: #ffb3b3;
            font-size: 13px;
            text-align: center;
          }

          /* Primary Button */
          .auth-button {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.95);
            border: none;
            border-radius: 100px; /* Pill shape */
            color: #1a1f26;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          }

          .auth-button:hover:not(:disabled) {
            background: #ffffff;
            transform: translateY(-2px) scale(1.01);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
          }

          .auth-button:active:not(:disabled) {
            transform: translateY(0) scale(0.98);
          }

          .auth-button:disabled {
            opacity: 0.8;
            cursor: wait;
            background: rgba(255, 255, 255, 0.7);
          }

          .button-icon {
            width: 22px;
            height: 22px;
            object-fit: contain;
          }

          /* Info Box (Bottom Text) */
          .info-box {
            margin-top: 24px;
            padding: 14px 16px;
            background: rgba(0, 0, 0, 0.15);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }

          .info-box p {
            margin: 0;
            font-size: 11px;
            line-height: 1.5;
            color: rgba(255, 255, 255, 0.6);
            text-align: center;
          }

          /* Footer */
          .card-footer {
            margin-top: 20px;
            text-align: center;
          }

          .back-link {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            transition: color 0.2s ease;
          }

          .back-link:hover {
            color: #ffffff;
            text-decoration: underline;
          }

          /* Responsive adjustments */
          @media (max-width: 400px) {
            .glass-card {
              padding: 32px 20px 24px;
              border-radius: 32px;
            }
            .text-header h1 {
              font-size: 22px;
            }
          }
        `}</style>
      </main>
    </>
  );
}
