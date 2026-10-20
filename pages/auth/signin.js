import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const CENTRAL_AUTH_URL = 'https://auth-binzeo.vercel.app/oauth/authorize';
const CLIENT_ID = 'jabiyen';
const CALLBACK_PATH = '/auth/callback';
const PENDING_KEY = 'binzeo.central-auth.pkce.jabiyen.website';

const BINZEO_FAVICON = 'https://raw.githubusercontent.com/BINZEO369/auth.binzeo/main/public/favicon.png';

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
      
      window.location.assign(authUrl.toString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start secure sign-in. Please try again.');
      setConnecting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Connect | JABIYEN</title>
        <meta name="description" content="Connect JABIYEN with your BINZEO account." />
        <meta name="referrer" content="no-referrer" />
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main className="page-wrapper">
        {/* Ambient soft light accents */}
        <div className="ambient-glow ambient-1" aria-hidden="true" />
        <div className="ambient-glow ambient-2" aria-hidden="true" />

        <section className="auth-card">
          
          {/* Connected Logos */}
          <div className="logo-section">
            <img src="/logo.png" alt="JABIYEN" className="logo-img jabiyen" />
            
            <div className="connection-icon" aria-hidden="true">
              <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
                <path d="M1 6 H27" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="14" cy="6" r="2.5" fill="rgba(0,0,0,0.35)" />
              </svg>
            </div>

            <img src={BINZEO_FAVICON} alt="BINZEO Auth" className="logo-img binzeo" />
          </div>

          {/* Text */}
          <div className="text-content">
            <p className="eyebrow">BINZEO CENTRAL AUTH</p>
            <h1 className="title">Connect JABIYEN</h1>
            <p className="subtitle">
              If you are already signed in to BINZEO, connect in one step. If not, BINZEO will ask you to sign in first.
            </p>
          </div>

          {error && (
            <div role="alert" className="error-box">
              {error}
            </div>
          )}

          {/* Primary Button */}
          <button
            type="button"
            onClick={() => void startCentralAuth()}
            disabled={connecting}
            className="primary-button"
          >
            <span className="btn-label">
              {connecting ? 'Opening secure connection…' : 'Connect with BINZEO'}
            </span>
          </button>

          {/* Info */}
          <div className="info-section">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <div className="info-text">
              <p>PKCE Protected</p>
              <p>Credentials are handled securely by BINZEO.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="card-footer">
            <Link href="/" className="back-link">
              Back to JABIYEN
            </Link>
          </div>
        </section>

        <style jsx>{`
          .page-wrapper {
            position: relative;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%);
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          /* Soft monochrome ambient light */
          .ambient-glow {
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
            filter: blur(120px);
            z-index: 0;
          }

          .ambient-1 {
            top: -15%;
            left: -10%;
            width: 520px;
            height: 520px;
            background: radial-gradient(circle, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 70%);
          }

          .ambient-2 {
            bottom: -20%;
            right: -10%;
            width: 560px;
            height: 560px;
            background: radial-gradient(circle, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0) 70%);
          }

          /* THE AUTH CARD (Apple-style light glass) */
          .auth-card {
            position: relative;
            z-index: 2;
            width: 100%;
            max-width: 400px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.78) 100%);
            backdrop-filter: blur(30px) saturate(180%);
            -webkit-backdrop-filter: blur(30px) saturate(180%);
            border-radius: 32px;
            padding: 40px 28px 28px;
            box-shadow: 
              0 24px 48px rgba(0, 0, 0, 0.08),
              0 8px 16px rgba(0, 0, 0, 0.04),
              0 0 0 1px rgba(0, 0, 0, 0.04);
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          /* LOGOS & CONNECTION */
          .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            margin-bottom: 32px;
            z-index: 5;
          }

          .logo-img {
            object-fit: contain;
            filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.06));
          }

          .jabiyen {
            width: 58px;
            height: 58px;
            border-radius: 16px;
          }

          .binzeo {
            width: 52px;
            height: 52px;
            border-radius: 12px;
          }

          /* Simple static connection icon */
          .connection-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 12px;
          }

          /* TEXT */
          .text-content {
            text-align: center;
            margin-bottom: 28px;
            z-index: 5;
          }

          .eyebrow {
            margin: 0 0 8px;
            font-size: 10.5px;
            font-weight: 600;
            letter-spacing: 0.15em;
            color: #86868b;
            text-transform: uppercase;
          }

          .title {
            margin: 0 0 10px;
            font-size: 28px;
            font-weight: 700;
            color: #1d1d1f;
            letter-spacing: -0.6px;
            line-height: 1.2;
          }

          .subtitle {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
            color: #6e6e73;
            padding: 0 6px;
            letter-spacing: -0.1px;
          }

          /* ERROR */
          .error-box {
            width: 100%;
            margin-bottom: 16px;
            background: rgba(255, 59, 48, 0.08);
            border: 1px solid rgba(255, 59, 48, 0.2);
            border-radius: 14px;
            padding: 12px;
            color: #c4312b;
            font-size: 12.5px;
            text-align: center;
            z-index: 5;
          }

          /* PRIMARY BUTTON (Apple style black pill) */
          .primary-button {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px 24px;
            background: #1d1d1f;
            border: none;
            border-radius: 100px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 5;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          }

          .primary-button:hover:not(:disabled) {
            background: #000000;
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
          }

          .primary-button:active:not(:disabled) {
            transform: translateY(0);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
          }

          .primary-button:disabled {
            opacity: 0.6;
            cursor: wait;
          }

          .btn-label {
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: -0.1px;
          }

          /* INFO SECTION */
          .info-section {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-top: 24px;
            width: 100%;
            padding: 0 8px;
            z-index: 5;
          }

          .info-icon {
            flex-shrink: 0;
            margin-top: 2px;
          }

          .info-text p {
            margin: 0;
            font-size: 11.5px;
            line-height: 1.5;
            color: #86868b;
            text-align: left;
            letter-spacing: -0.05px;
          }

          .info-text p:first-child {
            font-weight: 600;
            color: #1d1d1f;
          }

          /* FOOTER */
          .card-footer {
            margin-top: 24px;
            padding-top: 20px;
            width: 100%;
            text-align: center;
            border-top: 1px solid rgba(0, 0, 0, 0.06);
            z-index: 5;
          }

          .back-link {
            color: #0071e3;
            font-size: 13px;
            text-decoration: none;
            font-weight: 500;
            transition: opacity 0.2s;
          }

          .back-link:hover {
            opacity: 0.7;
          }

          @media (max-width: 400px) {
            .auth-card {
              padding: 32px 22px 24px;
              border-radius: 28px;
            }
            .title {
              font-size: 24px;
            }
            .subtitle {
              font-size: 13px;
            }
          }
        `}</style>
      </main>
    </>
  );
}
