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

      <main className="scene-container">
        {/* Deep Background with Hero Image */}
        <div className="bg-hero" aria-hidden="true" />
        
        {/* Rich Gradient Overlay for Depth */}
        <div className="bg-gradient-overlay" aria-hidden="true" />

        {/* Floating Ambient Light Orbs (Creates depth behind glass) */}
        <div className="ambient-orb orb-blue" aria-hidden="true" />
        <div className="ambient-orb orb-purple" aria-hidden="true" />

        {/* ======= THE 3D LIQUID GLASS CARD ======= */}
        <section className="glass-panel">
          
          {/* SVG Noise Texture for Frosted Glass Effect */}
          <svg className="glass-noise" aria-hidden="true">
            <filter id="noiseFilter">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilter)" />
          </svg>

          {/* 3D Glass Edge Highlights */}
          <div className="glass-edge-top" aria-hidden="true" />
          <div className="glass-edge-bottom" aria-hidden="true" />

          {/* --- LOGO CONNECTION ZONE --- */}
          <div className="brand-connection-zone">
            {/* Jabiyen Logo - Floating with realistic shadow */}
            <img 
              src="/logo.png" 
              alt="JABIYEN" 
              className="brand-logo jabiyen" 
            />

            {/* The Energy Bridge (No borders, pure connection) */}
            <div className="energy-bridge" aria-hidden="true">
              <div className="bridge-track" />
              <div className="bridge-particle" />
              <div className="bridge-core">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
            </div>

            {/* Binzeo Logo - Floating */}
            <img 
              src={BINZEO_FAVICON} 
              alt="BINZEO Central Auth" 
              className="brand-logo binzeo" 
            />
          </div>

          {/* --- TYPOGRAPHY --- */}
          <div className="text-content">
            <h1 className="main-title">Secure Sign In</h1>
            <p className="sub-text">
              Authenticate seamlessly to access your JABIYEN workspace. You will be redirected to BINZEO Central Auth.
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div role="alert" className="error-toast">
              {error}
            </div>
          )}

          {/* --- 3D GLASS BUTTON --- */}
          <button
            type="button"
            onClick={() => void startCentralAuth()}
            disabled={connecting}
            className="glass-action-btn"
          >
            {/* Light Sweep Effect on Hover */}
            <div className="light-sweep" aria-hidden="true" />
            
            <img src={BINZEO_FAVICON} alt="BINZEO" className="btn-icon" />
            <span className="btn-text">
              {connecting ? 'Securing Connection...' : 'Continue with BINZEO'}
            </span>
          </button>

          {/* --- FOOTER INFO --- */}
          <div className="security-footer">
            <div className="secure-badge">
              <span className="pulse-dot" />
              <span>End-to-End Encrypted (PKCE)</span>
            </div>
            <Link href="/" className="return-home">
              Cancel and return to home
            </Link>
          </div>

        </section>

        <style jsx>{`
          .scene-container {
            position: relative;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
            background-color: #05080f;
          }

          /* ================= BACKGROUND ================= */
          .bg-hero {
            position: absolute;
            inset: 0;
            background-image: url(${HERO_IMAGE});
            background-size: cover;
            background-position: center;
            z-index: 0;
            transform: scale(1.05);
            animation: slowPan 30s infinite alternate linear;
          }

          @keyframes slowPan {
            0% { transform: scale(1.05) translate(0, 0); }
            100% { transform: scale(1.05) translate(-2%, 2%); }
          }

          .bg-gradient-overlay {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 50% 50%, rgba(5, 10, 20, 0.2) 0%, rgba(5, 10, 20, 0.85) 100%);
            z-index: 1;
          }

          /* Ambient Lights (Makes the glass look 3D by reacting to light) */
          .ambient-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(90px);
            z-index: 1;
            opacity: 0.7;
          }
          .orb-blue {
            width: 400px; height: 400px;
            background: rgba(0, 150, 255, 0.5);
            top: -10%; left: -10%;
            animation: floatOrb 12s infinite alternate ease-in-out;
          }
          .orb-purple {
            width: 350px; height: 350px;
            background: rgba(150, 0, 255, 0.4);
            bottom: -10%; right: -10%;
            animation: floatOrb 15s infinite alternate-reverse ease-in-out;
          }

          @keyframes floatOrb {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(40px, 40px) scale(1.1); }
          }

          /* ================= THE LIQUID GLASS CARD ================= */
          .glass-panel {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 420px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.03) 100%);
            backdrop-filter: blur(40px) saturate(200%) contrast(110%);
            -webkit-backdrop-filter: blur(40px) saturate(200%) contrast(110%);
            border-radius: 44px;
            padding: 44px 32px 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            /* Advanced 3D Glass Shadows */
            box-shadow: 
              0 40px 80px -15px rgba(0, 0, 0, 0.8),
              0 15px 35px -5px rgba(0, 0, 0, 0.4),
              inset 0 1px 2px rgba(255, 255, 255, 0.5),
              inset 0 -1px 2px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.15);
          }

          /* Glass Noise Texture (Crucial for realism) */
          .glass-noise {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            opacity: 0.04; /* Very subtle */
            pointer-events: none;
            border-radius: 44px;
            mix-blend-mode: overlay;
          }

          /* Specular Edges */
          .glass-edge-top {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 40%;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
            border-radius: 44px 44px 0 0;
            pointer-events: none;
          }
          .glass-edge-bottom {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 20%;
            background: linear-gradient(0deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
            border-radius: 0 0 44px 44px;
            pointer-events: none;
          }

          /* ================= LOGO CONNECTION ================= */
          .brand-connection-zone {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin-bottom: 32px;
            z-index: 2;
          }

          .brand-logo {
            object-fit: contain;
            /* Deep realistic shadow to make them float above the glass */
            filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.5));
            transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          }

          .brand-logo:hover {
            transform: translateY(-4px) scale(1.05);
          }

          .jabiyen {
            width: 60px;
            height: 60px;
            border-radius: 18px;
          }

          .binzeo {
            width: 54px;
            height: 54px;
            border-radius: 14px;
          }

          /* The Energy Bridge (Fiber Optic Connection) */
          .energy-bridge {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 24px;
          }

          .bridge-track {
            position: absolute;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 20%, rgba(255,255,255,0.2) 80%, rgba(255,255,255,0) 100%);
            box-shadow: 0 0 10px rgba(100, 200, 255, 0.3);
          }

          .bridge-particle {
            position: absolute;
            width: 6px;
            height: 6px;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 0 12px #fff, 0 0 20px #00d2ff;
            animation: moveParticle 2s infinite linear;
          }

          @keyframes moveParticle {
            0% { left: 0; opacity: 0; transform: scale(0.5); }
            20% { opacity: 1; transform: scale(1); }
            80% { opacity: 1; transform: scale(1); }
            100% { left: 100%; opacity: 0; transform: scale(0.5); }
          }

          .bridge-core {
            position: relative;
            z-index: 2;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            box-shadow: 
              0 4px 12px rgba(0,0,0,0.3),
              inset 0 1px 2px rgba(255,255,255,0.8),
              0 0 15px rgba(100, 200, 255, 0.4);
            display: grid;
            place-items: center;
            animation: pulseCore 3s infinite alternate;
          }

          @keyframes pulseCore {
            0% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8), 0 0 10px rgba(100, 200, 255, 0.2); }
            100% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8), 0 0 25px rgba(100, 200, 255, 0.8); }
          }

          /* ================= TYPOGRAPHY ================= */
          .text-content {
            text-align: center;
            margin-bottom: 32px;
            z-index: 2;
          }

          .main-title {
            margin: 0 0 12px;
            font-size: 30px;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: -0.03em;
            text-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
          }

          .sub-text {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.75);
            font-weight: 400;
            padding: 0 10px;
          }

          /* ================= ERROR ================= */
          .error-toast {
            width: 100%;
            margin-bottom: 20px;
            background: rgba(255, 50, 50, 0.2);
            border: 1px solid rgba(255, 100, 100, 0.4);
            border-radius: 16px;
            padding: 12px;
            color: #ffcccc;
            font-size: 13px;
            text-align: center;
            backdrop-filter: blur(10px);
            z-index: 2;
          }

          /* ================= 3D GLASS BUTTON ================= */
          .glass-action-btn {
            position: relative;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 18px 24px;
            background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 100px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
            box-shadow: 
              0 15px 30px rgba(0, 0, 0, 0.3),
              inset 0 2px 4px rgba(255, 255, 255, 0.5),
              inset 0 -2px 4px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            z-index: 2;
          }

          /* Light Sweep Animation */
          .light-sweep {
            position: absolute;
            top: 0; left: -100%;
            width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transform: skewX(-20deg);
            transition: left 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
          }

          .glass-action-btn:hover .light-sweep {
            left: 150%;
          }

          .glass-action-btn:hover:not(:disabled) {
            background: linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%);
            transform: translateY(-3px);
            box-shadow: 
              0 20px 40px rgba(0, 0, 0, 0.4),
              inset 0 2px 5px rgba(255, 255, 255, 0.7),
              inset 0 -2px 5px rgba(0, 0, 0, 0.2);
          }

          .glass-action-btn:active:not(:disabled) {
            transform: translateY(1px) scale(0.98);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          }

          .glass-action-btn:disabled {
            opacity: 0.6;
            cursor: wait;
          }

          .btn-icon {
            width: 24px;
            height: 24px;
            object-fit: contain;
            filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
          }

          .btn-text {
            color: #ffffff;
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
          }

          /* ================= FOOTER ================= */
          .security-footer {
            margin-top: 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            z-index: 2;
          }

          .secure-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.8);
            letter-spacing: 0.5px;
          }

          .pulse-dot {
            width: 6px;
            height: 6px;
            background-color: #34c759; /* iOS Green */
            border-radius: 50%;
            box-shadow: 0 0 8px #34c759;
            animation: pulseGreen 2s infinite;
          }

          @keyframes pulseGreen {
            0% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(52, 199, 89, 0); }
            100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
          }

          .return-home {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            text-decoration: none;
            transition: color 0.2s;
          }

          .return-home:hover {
            color: rgba(255, 255, 255, 0.9);
          }

          /* Responsive */
          @media (max-width: 400px) {
            .glass-panel {
              padding: 32px 20px 24px;
              border-radius: 36px;
            }
            .main-title {
              font-size: 26px;
            }
          }
        `}</style>
      </main>
    </>
  );
}
