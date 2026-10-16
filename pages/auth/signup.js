import Head from 'next/head';
import Link from 'next/link';

const AUTH_SIGNUP_URL = 'https://auth-binzeo.vercel.app/signup';

export default function SignUpRedirect() {
  const redirectToAuthSignup = () => {
    if (typeof window === 'undefined') return;
    const returnUrl = `${window.location.origin}/auth/account`;
    window.location.replace(`${AUTH_SIGNUP_URL}?redirect=${encodeURIComponent(returnUrl)}`);
  };

  return (
    <>
      <Head>
        <title>Create Account | JABIYEN</title>
        <meta name="description" content="Create your account through Central BINZEO Auth" />
      </Head>
      <main style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <section style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, padding: '40px 36px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}>
          <img src="/logo.png" alt="JABIYEN" style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px' }} />
          <h1 style={{ fontFamily: "var(--font-heading), 'Manrope', sans-serif", fontSize: 26, fontWeight: 800, color: '#1d1d1f', margin: '0 0 10px' }}>Create Your Account</h1>
          <p style={{ fontSize: 15, color: '#68686d', lineHeight: 1.6, margin: '0 0 26px' }}>
            Account registration is managed securely by Central BINZEO Auth. You will be redirected to complete signup.
          </p>
          <button type="button" onClick={redirectToAuthSignup} style={{ width: '100%', padding: '14px 24px', background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Continue to Central Signup
          </button>
          <p style={{ fontSize: 14, color: '#86868b', margin: '24px 0 0' }}>
            Already have an account? <Link href="/auth/signin" style={{ color: '#007aff', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </section>
      </main>
    </>
  );
}
