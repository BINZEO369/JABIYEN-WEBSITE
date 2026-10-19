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
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ state, codeVerifier, redirectUri, createdAt: Date.now() }));
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
      <main className="auth-page">
        <div className="auth-backdrop" style={{ backgroundImage: `url(${HERO_IMAGE})` }} aria-hidden="true" />
        <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
        <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
        <header className="auth-topbar">
          <Link href="/" className="brand-mark"><img src="/logo.png" alt="JABIYEN" /><span>JABIYEN</span></Link>
          <span className="status-pill"><i /> SYSTEM ONLINE</span>
        </header>
        <section className="auth-shell" aria-labelledby="signin-title">
          <div className="auth-kicker"><span>01</span><span>IDENTITY GATEWAY</span></div>
          <div className="auth-logos">
            <img src="/logo.png" alt="JABIYEN" className="app-logo" />
            <span className="logo-link" aria-hidden="true">↗</span>
            <img src={BINZEO_FAVICON} alt="BINZEO Central Auth" className="auth-logo" />
          </div>
          <h1 id="signin-title">Welcome back.</h1>
          <p className="auth-lede">One secure identity for your JABIYEN experience.</p>
          {error && <div role="alert" className="auth-error">{error}</div>}
          <button type="button" onClick={() => void startCentralAuth()} disabled={connecting} className="auth-submit">
            <span>{connecting ? 'Establishing secure link' : 'Continue with BINZEO'}</span><b aria-hidden="true">→</b>
          </button>
          <div className="auth-assurance"><span className="lock-icon" aria-hidden="true">⌁</span><div><strong>Protected connection</strong><p>PKCE encryption keeps your credentials with BINZEO.</p></div></div>
          <div className="auth-footer"><span>BINZEO CENTRAL AUTH</span><Link href="/">Return to JABIYEN</Link></div>
        </section>
        <p className="auth-build">AUTH / JABIYEN <span>V2.0</span></p>
      </main>
      <style jsx>{`
        .auth-page { min-height: 100svh; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: center; padding: 32px clamp(20px, 5vw, 72px); background: var(--auth-bg); color: var(--auth-foreground); font-family: var(--font-sans); }
        .auth-backdrop { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: .16; filter: grayscale(1) contrast(1.25); }
        .auth-page::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 10% 45%, rgba(85,146,255,.17), transparent 34%), linear-gradient(110deg, rgba(5,8,16,.96), rgba(5,8,16,.78) 50%, rgba(5,8,16,.98)); }
        .auth-orbit { position: absolute; z-index: 1; border: 1px solid rgba(132,181,255,.18); border-radius: 50%; transform: rotate(-28deg); pointer-events: none; }
        .auth-orbit-one { width: 70vw; height: 28vw; left: -28vw; top: 18%; box-shadow: 0 0 90px rgba(71,132,255,.2); }
        .auth-orbit-two { width: 52vw; height: 20vw; left: -15vw; top: 30%; opacity: .55; }
        .auth-topbar, .auth-build { position: absolute; z-index: 3; left: clamp(20px, 5vw, 72px); right: clamp(20px, 5vw, 72px); }
        .auth-topbar { top: 28px; display: flex; justify-content: space-between; align-items: center; }
        .brand-mark { display: flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; font-size: 12px; letter-spacing: .2em; font-weight: 700; }
        .brand-mark img { width: 26px; height: 26px; border-radius: 8px; }
        .status-pill { color: #91a1b8; font-size: 9px; letter-spacing: .15em; } .status-pill i { display: inline-block; width: 6px; height: 6px; margin-right: 7px; border-radius: 50%; background: #76e0b1; box-shadow: 0 0 10px #76e0b1; }
        .auth-shell { position: relative; z-index: 2; align-self: flex-end; width: min(100%, 430px); padding: clamp(28px, 5vw, 48px); border: 1px solid rgba(255,255,255,.1); border-radius: 28px; background: rgba(10,14,24,.72); box-shadow: 0 24px 80px rgba(0,0,0,.42), inset 0 1px rgba(255,255,255,.08); backdrop-filter: blur(24px); }
        .auth-kicker, .auth-footer { display: flex; justify-content: space-between; color: #66748b; font-size: 9px; letter-spacing: .18em; } .auth-kicker span:first-child { color: #8fb8ff; }
        .auth-logos { display: flex; align-items: center; gap: 12px; margin: 36px 0 25px; } .app-logo, .auth-logo { width: 38px; height: 38px; border-radius: 12px; object-fit: cover; } .logo-link { color: #7295c5; font-size: 20px; }
        h1 { margin: 0; font-size: clamp(32px, 6vw, 46px); line-height: .98; letter-spacing: -.06em; font-weight: 600; } .auth-lede { margin: 16px 0 30px; color: #94a1b4; font-size: 14px; line-height: 1.6; }
        .auth-error { margin: -10px 0 18px; padding: 12px 14px; border: 1px solid rgba(255,112,112,.35); border-radius: 12px; background: rgba(170,44,55,.2); color: #ffb3b3; font-size: 12px; }
        .auth-submit { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 17px 19px 17px 21px; border: 0; border-radius: 14px; background: #f1f5fb; color: #101725; cursor: pointer; font: inherit; font-size: 13px; font-weight: 700; transition: transform .2s, box-shadow .2s; } .auth-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(133,177,255,.2); } .auth-submit:disabled { opacity: .58; cursor: wait; } .auth-submit b { font-size: 22px; font-weight: 400; }
        .auth-assurance { display: flex; gap: 12px; margin: 26px 0 34px; color: #a9b8cc; } .lock-icon { display: grid; place-items: center; width: 25px; height: 25px; border: 1px solid #38557f; border-radius: 8px; color: #8bb7ff; } .auth-assurance strong { display: block; margin-bottom: 4px; font-size: 11px; color: #d4deec; } .auth-assurance p { margin: 0; font-size: 11px; line-height: 1.45; }
        .auth-footer { padding-top: 18px; border-top: 1px solid rgba(255,255,255,.08); } .auth-footer a { color: #9abcf3; text-decoration: none; letter-spacing: .04em; } .auth-build { bottom: 28px; color: #4e5e76; font-size: 9px; letter-spacing: .2em; } .auth-build span { float: right; }
        @media (max-width: 700px) { .auth-shell { align-self: center; margin-top: 22px; } .auth-orbit-one { width: 130vw; height: 54vw; left: -70vw; top: 12%; } .auth-orbit-two { width: 100vw; height: 40vw; left: -50vw; top: 20%; } }
      `}</style>
    </>
  );
}
