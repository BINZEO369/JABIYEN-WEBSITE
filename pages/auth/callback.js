import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const CLIENT_ID = 'jabiyen';
const CALLBACK_PATH = '/auth/callback';
const PENDING_KEY = 'binzeo.central-auth.pkce.jabiyen.website';

export default function CentralAuthCallback() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Completing your secure connection…');

  useEffect(() => {
    let active = true;
    const run = async () => {
      const callbackUrl = new URL(window.location.href);
      const code = callbackUrl.searchParams.get('code') || '';
      const queryState = callbackUrl.searchParams.get('state') || '';
      const fragment = new URLSearchParams(callbackUrl.hash.replace(/^#/, ''));
      const handoffToken = fragment.get('handoff_token') || '';
      const returnedState = handoffToken ? fragment.get('state') || '' : queryState;
      const centralError = callbackUrl.searchParams.get('error_description') || callbackUrl.searchParams.get('error') || '';
      // Handoff tickets/codes are short-lived. Remove all callback secrets from the URL immediately.
      window.history.replaceState(null, document.title, CALLBACK_PATH);

      if (centralError) throw new Error('Central Auth could not complete this sign-in. Return to JABIYEN and try again.');
      if (handoffToken && code) throw new Error('This sign-in response is ambiguous. Please start again.');
      if (
        (!handoffToken && !/^[A-Za-z0-9_-]{43}$/.test(code)) ||
        (handoffToken && !/^h1\.[A-Za-z0-9_-]{43}\.\d{13}\.[A-Za-z0-9_-]{43}$/.test(handoffToken)) ||
        !/^[A-Za-z0-9_-]{32,128}$/.test(returnedState)
      ) {
        throw new Error('This sign-in response is incomplete or expired. Please start again.');
      }

      const pendingRaw = window.sessionStorage.getItem(PENDING_KEY);
      window.sessionStorage.removeItem(PENDING_KEY);
      if (!pendingRaw) throw new Error('The secure sign-in session was not found in this browser tab. Please start again.');

      let pending;
      try { pending = JSON.parse(pendingRaw); }
      catch { throw new Error('The secure sign-in session is invalid. Please start again.'); }
      const expectedRedirect = `${window.location.origin}${CALLBACK_PATH}`;
      if (
        pending.state !== returnedState ||
        pending.redirectUri !== expectedRedirect ||
        typeof pending.codeVerifier !== 'string' ||
        !/^[A-Za-z0-9._~-]{43,128}$/.test(pending.codeVerifier) ||
        !Number.isFinite(pending.createdAt) ||
        Date.now() - pending.createdAt > 120_000 ||
        pending.createdAt > Date.now() + 5_000
      ) {
        throw new Error('The sign-in response did not match this browser session or has expired. Please start again.');
      }

      const useHandoff = Boolean(handoffToken);
      const response = await fetch(useHandoff ? '/api/auth/handoff/redeem' : '/api/auth/token', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(useHandoff ? {
          client_id: CLIENT_ID,
          redirect_uri: expectedRedirect,
          state: returnedState,
          token: handoffToken,
          code_verifier: pending.codeVerifier,
        } : {
          client_id: CLIENT_ID,
          redirect_uri: expectedRedirect,
          code,
          code_verifier: pending.codeVerifier,
        }),
      });
      const result = await response.json().catch(() => ({}));
      const session = result?.data?.session;
      if (!response.ok || result?.success !== true || typeof session?.access_token !== 'string' || !session.user?.id) {
        const apiMessage = typeof result?.error?.message === 'string' ? result.error.message : '';
        throw new Error(apiMessage || 'Central Auth could not complete this sign-in. Please try again.');
      }

      // Preserve JABIYEN's current session contract; do not persist the refresh token in browser storage.
      window.localStorage.setItem('jayenware_session', JSON.stringify({
        access_token: session.access_token,
        expires_at: session.expires_at || null,
        user_id: session.user.id,
      }));
      if (!active) return;
      setStatus('success');
      setMessage('Connected. Opening your JABIYEN account…');
      window.location.replace('/auth/account');
    };

    void run().catch((error) => {
      if (!active) return;
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Sign-in could not be completed. Please try again.');
    });
    return () => { active = false; };
  }, []);

  return (
    <>
      <Head>
        <title>Completing Secure Sign In | JABIYEN</title>
        <meta name="referrer" content="no-referrer" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main style={{ minHeight: 'calc(100vh - 180px)', display: 'grid', placeItems: 'center', padding: 24, background: '#f7f8fa' }}>
        <section aria-live="polite" style={{ width: '100%', maxWidth: 440, padding: '36px 30px', textAlign: 'center', background: '#fff', border: '1px solid #eceef1', borderRadius: 22, boxShadow: '0 18px 55px rgba(18, 27, 39, .08)' }}>
          <img src="/logo.png" alt="JABIYEN" width="48" height="48" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 13, margin: '0 auto 18px' }} />
          <h1 style={{ margin: 0, color: '#171a20', fontSize: 22, fontWeight: 700 }}>{status === 'error' ? 'Connection not completed' : status === 'success' ? 'Connected' : 'Secure connection'}</h1>
          <p style={{ margin: '10px 0 0', color: '#69727e', fontSize: 14, lineHeight: 1.55 }}>{message}</p>
          {status === 'loading' && <div aria-hidden="true" style={{ width: 26, height: 26, margin: '24px auto 0', border: '3px solid #e2e6eb', borderTopColor: '#293746', borderRadius: '50%', animation: 'jabi-auth-spin .8s linear infinite' }} />}
          {status === 'error' && <Link href="/auth/signin" style={{ display: 'inline-block', marginTop: 24, padding: '11px 18px', borderRadius: 10, background: '#1d2834', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 650 }}>Return to sign in</Link>}
        </section>
      </main>
      <style jsx>{`@keyframes jabi-auth-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
