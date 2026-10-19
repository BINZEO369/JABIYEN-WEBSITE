import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const CENTRAL_AUTH_URL = 'https://auth-binzeo.vercel.app/oauth/authorize';
const CLIENT_ID = 'jabiyen';
const CALLBACK_PATH = '/auth/callback';
const PENDING_KEY = 'binzeo.central-auth.pkce.jabiyen.website';

const HERO_IMAGE = '/images/signin-hero1.jpg';
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
      // No method is specified: Central Auth presents and handles all supported methods.
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
      </Head>

      <main
        style={{
          minHeight: 'calc(100vh - 180px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px',
          position: 'relative',
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          overflow: 'hidden',
        }}
      >
        {/* Readability overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(145deg, rgba(12, 20, 32, 0.55) 0%, rgba(20, 30, 45, 0.30) 50%, rgba(8, 14, 24, 0.65) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Ambient light blobs */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-12%',
            left: '-10%',
            width: 460,
            height: 460,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0) 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-18%',
            right: '-12%',
            width: 520,
            height: 520,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 70% 70%, rgba(120, 180, 255, 0.38), rgba(120, 180, 255, 0) 70%)',
            filter: 'blur(48px)',
            pointerEvents: 'none',
          }}
        />

        {/* Liquid glass card */}
        <section
          className="glass-card"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            borderRadius: 26,
            padding: '36px 30px 30px',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow:
              '0 24px 70px rgba(8, 14, 24, 0.45), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(255,255,255,0.08)',
            color: '#fff',
            overflow: 'hidden',
          }}
        >
          {/* top glass highlight */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
            }}
          />

          {/* Connected logos cluster */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 24,
            }}
          >
            {/* JABIYEN logo */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.95)',
                display: 'grid',
                placeItems: 'center',
                boxShadow:
                  '0 10px 26px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.6)',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <img
                src="/logo.png"
                alt="JABIYEN"
                width="44"
                height="44"
                style={{
                  width: 44,
                  height: 44,
                  objectFit: 'cover',
                  borderRadius: 10,
                }}
              />
            </div>

            {/* Connector: line → link chip → line */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                flexShrink: 1,
              }}
              aria-hidden="true"
            >
              <div
                style={{
                  width: 22,
                  height: 1.5,
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.95))',
                }}
              />
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.55)',
                  display: 'grid',
                  placeItems: 'center',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow:
                    '0 6px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
                  margin: '0 2px',
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div
                style={{
                  width: 22,
                  height: 1.5,
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0.15))',
                }}
              />
            </div>

            {/* BINZEO Central Auth favicon */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(29, 40, 52, 0.85)',
                display: 'grid',
                placeItems: 'center',
                boxShadow:
                  '0 10px 26px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.20)',
                border: '1px solid rgba(255,255,255,0.28)',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <img
                src={BINZEO_FAVICON}
                alt="BINZEO Central Auth"
                width="44"
                height="44"
                style={{
                  width: 44,
                  height: 44,
                  objectFit: 'contain',
                  borderRadius: 10,
                }}
              />
            </div>
          </div>

          {/* Capability chip */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: -10,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 11px',
                borderRadius: 999,
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.92)',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.30)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#7ee0a8',
                  boxShadow: '0 0 6px rgba(126,224,168,0.9)',
                }}
              />
              Connected to Central Auth
            </span>
          </div>

          <header style={{ textAlign: 'center', marginBottom: 22 }}>
            <p
              style={{
                margin: '0 0 8px',
                color: 'rgba(255,255,255,0.72)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
              }}
            >
              JABIYEN · Secure Access
            </p>
            <h1
              style={{
                margin: 0,
                color: '#fff',
                fontSize: 28,
                lineHeight: 1.2,
                fontWeight: 750,
                textShadow: '0 2px 22px rgba(0,0,0,0.35)',
              }}
            >
              Sign in securely
            </h1>
            <p
              style={{
                margin: '10px 0 0',
                color: 'rgba(255,255,255,0.82)',
                fontSize: 13.5,
                lineHeight: 1.55,
              }}
            >
              Continue to BINZEO Central Auth. Choose your sign-in method and
              verify your identity there.
            </p>
          </header>

          {error && (
            <div
              role="alert"
              style={{
                marginBottom: 16,
                border: '1px solid rgba(255,180,180,0.6)',
                background: 'rgba(160, 30, 30, 0.35)',
                color: '#fff',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 13,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => void startCentralAuth()}
            disabled={connecting}
            aria-label="Sign in with BINZEO Central Auth"
            className="signin-btn"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '15px 18px',
              color: '#0f1620',
              background: connecting
                ? 'rgba(255,255,255,0.65)'
                : 'linear-gradient(180deg, #ffffff 0%, #eef2f6 100%)',
              border: '1px solid rgba(255,255,255,0.75)',
              borderRadius: 14,
              cursor: connecting ? 'wait' : 'pointer',
              opacity: connecting ? 0.85 : 1,
              fontSize: 14,
              fontWeight: 700,
              boxShadow:
                '0 12px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.95)',
              transition:
                'background .18s ease, transform .18s ease, box-shadow .18s ease',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 26,
                height: 26,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 8,
                color: '#fff',
                background: '#1d2834',
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              B
            </span>
            {connecting
              ? 'Connecting to Central Auth…'
              : 'Continue with BINZEO Central Auth'}
          </button>

          <div
            style={{
              marginTop: 20,
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.20)',
              color: 'rgba(255,255,255,0.82)',
              fontSize: 11.5,
              lineHeight: 1.55,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            Email, password, OTP, passkey, one-time token and QR sign-in are
            handled only by BINZEO Central Auth. JABIYEN never verifies these
            credentials; it receives a short-lived, single-use, PKCE-protected
            handoff ticket after sign-in.
          </div>

          <footer style={{ marginTop: 20, textAlign: 'center' }}>
            <Link
              href="/"
              style={{
                color: 'rgba(255,255,255,0.88)',
                fontSize: 12,
                textDecoration: 'none',
                borderBottom: '1px dotted rgba(255,255,255,0.45)',
                paddingBottom: 1,
              }}
            >
              Return to JABIYEN
            </Link>
            <p
              style={{
                margin: '10px 0 0',
                color: 'rgba(255,255,255,0.60)',
                fontSize: 10.5,
              }}
            >
              Protected by BINZEO Central Auth · PKCE protected sign-in
            </p>
          </footer>
        </section>

        <style jsx>{`
          .signin-btn:hover:not(:disabled) {
            background: linear-gradient(180deg, #ffffff 0%, #f5f8fb 100%);
            transform: translateY(-1px);
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.95);
          }
          .signin-btn:active:not(:disabled) {
            transform: translateY(0);
          }
          .signin-btn:focus-visible {
            outline: 2px solid rgba(255, 255, 255, 0.9);
            outline-offset: 3px;
          }
          @media (max-width: 380px) {
            .glass-card {
              padding: 28px 20px 24px !important;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .signin-btn {
              transition: none !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
