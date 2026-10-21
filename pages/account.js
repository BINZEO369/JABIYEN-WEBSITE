import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const CENTRAL_AUTH = 'https://auth-binzeo.vercel.app';

export default function AccountPage() {
  const [connection, setConnection] = useState('checking');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === '1') {
      window.localStorage.setItem('binzeo_jabiyen_connected', 'connected');
      window.history.replaceState({}, '', '/account');
    }
    const saved = window.localStorage.getItem('binzeo_jabiyen_connected');
    const pending = window.localStorage.getItem('binzeo_jabiyen_connection_pending');
    if (saved === 'connected' || pending === '1' || params.get('connected') === '1') {
      window.localStorage.setItem('binzeo_jabiyen_connected', 'connected');
      window.localStorage.removeItem('binzeo_jabiyen_connection_pending');
      setConnection('connected');
    } else {
      setConnection('not_connected');
    }
  }, []);

  const startConnection = () => {
    window.location.href = '/auth/signin';
  };

  return (
    <>
      <Head>
        <title>Account | JABIYEN</title>
        <meta name="description" content="Manage your JABIYEN account through BINZEO Central Auth." />
      </Head>
      <main style={styles.page}>
        <div style={styles.shell}>
          <Link href="/" style={styles.back}>← Back to JABIYEN</Link>
          <div style={styles.eyebrow}>JABIYEN × BINZEO</div>
          <h1 style={styles.title}>Account</h1>
          <p style={styles.lead}>Your JABIYEN account is managed securely through BINZEO Central Auth. No password is stored or shared by JABIYEN.</p>

          <section style={styles.card} aria-labelledby="account-summary">
            <div style={styles.cardHead}>
              <div>
                <div style={styles.label}>Account provider</div>
                <h2 id="account-summary" style={styles.cardTitle}>BINZEO Central Account</h2>
              </div>
              <span style={{ ...styles.badge, ...(connection === 'connected' ? styles.badgeGood : styles.badgeIdle) }}>
                {connection === 'checking' ? 'Checking…' : connection === 'connected' ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <div style={styles.details}>
              <div><span style={styles.detailLabel}>Website</span><strong>JABIYEN</strong></div>
              <div><span style={styles.detailLabel}>Identity</span><strong>BINZEO Central Auth</strong></div>
              <div><span style={styles.detailLabel}>Password sharing</span><strong>Never</strong></div>
            </div>
            <p style={styles.note}>After connecting, approved account information is shown and managed from your BINZEO Central Account. You can disconnect JABIYEN at any time.</p>
            <button type="button" onClick={startConnection} style={styles.primary}>Connect or view account information</button>
          </section>

          <section style={styles.infoCard}>
            <h2 style={styles.infoTitle}>What JABIYEN can access</h2>
            <p style={styles.infoText}>Only information approved through BINZEO Central Auth may be shared. Your password and Central Auth security credentials are never shared with JABIYEN.</p>
            <a href={`${CENTRAL_AUTH}/account`} style={styles.secondary}>Manage connected websites in BINZEO</a>
          </section>
        </div>
      </main>
    </>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f6f6f3', color: '#1d1d1f', padding: 'clamp(28px, 7vw, 80px) 20px', fontFamily: "'Manrope', Arial, sans-serif" },
  shell: { maxWidth: 760, margin: '0 auto' },
  back: { display: 'inline-block', marginBottom: 48, color: '#555', fontSize: 12, fontWeight: 700, textDecoration: 'none', letterSpacing: '.06em' },
  eyebrow: { color: '#777', fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase' },
  title: { margin: '10px 0 14px', fontSize: 'clamp(38px, 8vw, 68px)', lineHeight: 1, letterSpacing: '-.06em', fontWeight: 800 },
  lead: { maxWidth: 570, margin: 0, color: '#666', fontSize: 15, lineHeight: 1.8 },
  card: { marginTop: 38, padding: 'clamp(22px, 5vw, 38px)', borderRadius: 26, background: '#fff', border: '1px solid #e8e8e4', boxShadow: '0 20px 60px rgba(0,0,0,.06)' },
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 },
  label: { marginBottom: 8, color: '#999', fontSize: 10, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase' },
  cardTitle: { margin: 0, fontSize: 24, letterSpacing: '-.04em' },
  badge: { flexShrink: 0, borderRadius: 999, padding: '8px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' },
  badgeGood: { background: '#e8f7ee', color: '#167243' },
  badgeIdle: { background: '#f0f0ed', color: '#777' },
  details: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 18, margin: '30px 0 22px', padding: '20px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' },
  detailLabel: { display: 'block', marginBottom: 7, color: '#999', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' },
  detailsStrong: { fontSize: 13 },
  note: { margin: '0 0 24px', color: '#666', fontSize: 13, lineHeight: 1.7 },
  primary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '0 20px', borderRadius: 999, background: '#111', color: '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none' },
  infoCard: { marginTop: 16, padding: '24px 26px', borderRadius: 22, background: '#ecece8' },
  infoTitle: { margin: 0, fontSize: 16, letterSpacing: '-.02em' },
  infoText: { margin: '10px 0 16px', color: '#666', fontSize: 13, lineHeight: 1.7 },
  secondary: { color: '#222', fontSize: 12, fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 4 },
};
