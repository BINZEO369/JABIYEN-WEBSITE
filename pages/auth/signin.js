import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const CENTRAL_AUTH_URL = 'https://auth-binzeo.vercel.app/oauth/authorize';
const CLIENT_ID = 'jabiyen';
const CALLBACK_PATH = '/auth/callback';
const PENDING_KEY = 'binzeo.central-auth.pkce.jabiyen.website';

const HERO_IMAGE = '/images/signin-hero1.jpg';
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
      authUrl.searchParams.set('handoff', 'one-time');
      
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main className="page-wrapper">
        {/* Background Image with Soft Overlay */}
        <div className="bg-image" aria-hidden="true" />
        <div className="bg-overlay" aria-hidden="true" />

        {/* Liquid Glass Card - Dark Neutral */}
        <section className="liquid-glass-container">
          
          {/* Inner subtle dark reflection (no white glare) */}
          <div className="glass-inner-glow" aria-hidden="true" />

          {/* Connected Logos Area */}
          <div className="logo-section">
            <img src="/logo.png" alt="JABIYEN" className="logo-img jabiyen" />
            
            {/* Liquid Connection Line */}
            <div className="liquid-connection" aria-hidden="true">
              <div className="liquid-line" />
              <div className="liquid-dot" />
            </div>

            <img src={BINZEO_FAVICON} alt="BINZEO Auth" className="logo-img binzeo" />
          </div>

          {/* Text Content */}
          <div className="text-content">
            <p className="eyebrow">JABIYEN ACCESS</p>
            <h1 className="title">Secure Sign In</h1>
            <p className="subtitle">
              Continue to BINZEO Central Auth. Choose your preferred method to securely verify your identity.
            </p>
          </div>

          {error && (
            <div role="alert" className="error-box">
              {error}
            </div>
          )}

          {/* Pill-Shaped Dark Glass Button */}
          <button
            type="button"
            onClick={() => void startCentralAuth()}
            disabled={connecting}
            className="glass-button"
          >
            <span className="btn-label">
              {connecting ? 'Connecting...' : 'Continue with BINZEO'}
            </span>
          </button>

          {/* Bottom Info Box */}
          <div className="info-section">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
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
              &larr; Back to JABIYEN
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
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
          }

          /* Background Setup */
          .bg-image {
            position: absolute;
            inset: 0;
            background-image: url(${HERO_IMAGE});
            background-size: cover;
            background-position: center;
            z-index: 0;
          }

          .bg-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 100%);
            z-index: 1;
            backdrop-filter: blur(2px);
          }

          /* THE LIQUID GLASS CARD (DARK NEUTRAL) */
          .liquid-glass-container {
            position: relative;
            z-index: 2;
            width: 100%;
            max-width: 400px;
            background: linear-gradient(135deg, rgba(25, 25, 35, 0.45) 0%, rgba(10, 10, 20, 0.25) 100%);
            backdrop-filter: blur(35px) saturate(160%);
            -webkit-backdrop-filter: blur(35px) saturate(160%);
            border-radius: 44px;
            padding: 36px 28px 28px;
            box-shadow: 
              0 30px 60px rgba(0, 0, 0, 0.45),
              0 10px 20px rgba(0, 0, 0, 0.25),
              inset 0 1px 1px rgba(255, 255, 255, 0.08),
              inset 0 -1px 1px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.08);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          /* Subtle dark inner glow (no white glare) */
          .glass-inner-glow {
            position: absolute;
            top: -20%;
            left: -20%;
            width: 80%;
            height: 80%;
            background: radial-gradient(circle, rgba(80, 90, 120, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
            pointer-events: none;
            filter: blur(40px);
          }

          /* LOGOS & CONNECTION */
          .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 26px;
            z-index: 5;
          }

          .logo-img {
            object-fit: contain;
            filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
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

          .liquid-connection {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 20px;
          }

          .liquid-line {
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(200, 210, 230, 0.7) 50%, rgba(255,255,255,0.05) 100%);
            border-radius: 2px;
          }

          .liquid-dot {
            position: absolute;
            width: 10px;
            height: 10px;
            background: #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(180, 200, 255, 0.8), 0 0 20px rgba(120, 160, 255, 0.6);
            animation: pulseDot 2s infinite alternate ease-in-out;
          }

          @keyframes pulseDot {
            0% { transform: scale(0.8); opacity: 0.8; }
            100% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 16px rgba(200, 220, 255, 1), 0 0 30px rgba(140, 180, 255, 0.9); }
          }

          /* TEXT */
          .text-content {
            text-align: center;
            margin-bottom: 28px;
            z-index: 5;
          }

          .eyebrow {
            margin: 0 0 6px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.15em;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
          }

          .title {
            margin: 0 0 10px;
            font-size: 26px;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
          }

          .subtitle {
            margin: 0;
            font-size: 13.5px;
            line-height: 1.5;
            color: rgba(255, 255, 255, 0.75);
            padding: 0 8px;
          }

          /* ERROR */
          .error-box {
            width: 100%;
            margin-bottom: 16px;
            background: rgba(255, 60, 60, 0.2);
            border: 1px solid rgba(255, 100, 100, 0.4);
            backdrop-filter: blur(10px);
            border-radius: 14px;
            padding: 12px;
            color: #ffffff;
            font-size: 12.5px;
            text-align: center;
            z-index: 5;
          }

          /* DARK GLASS BUTTON */
          .glass-button {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 16px 24px;
            background: rgba(15, 15, 25, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 100px;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 5;
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.08);
          }

          .glass-button:hover:not(:disabled) {
            background: rgba(25, 25, 40, 0.65);
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.12);
            transform: translateY(-1px);
          }

          .glass-button:active:not(:disabled) {
            transform: translateY(1px);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          }

          .glass-button:disabled {
            opacity: 0.55;
            cursor: wait;
          }

          .btn-label {
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: 0.3px;
          }

          /* INFO SECTION */
          .info-section {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-top: 24px;
            width: 100%;
            padding: 0 10px;
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
            color: rgba(255, 255, 255, 0.65);
            text-align: left;
          }

          .info-text p:first-child {
            font-weight: 600;
            color: rgba(255, 255, 255, 0.85);
          }

          /* FOOTER */
          .card-footer {
            margin-top: 24px;
            width: 100%;
            text-align: center;
            z-index: 5;
          }

          .back-link {
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
          }

          .back-link:hover {
            color: #ffffff;
          }

          @media (max-width: 400px) {
            .liquid-glass-container {
              padding: 30px 20px 24px;
              border-radius: 36px;
            }
            .title {
              font-size: 22px;
            }
          }
        `}</style>
      </main>
    </>
  );
}
