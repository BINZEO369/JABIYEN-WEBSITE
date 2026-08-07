'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const inputStyle = {
  width: '100%', padding: '12px 16px',
  border: '1.5px solid #e5e5ea',
  borderRadius: 12, fontSize: 15, fontFamily: "'Inter', sans-serif",
  color: '#1d1d1f', background: '#fff', outline: 'none',
  transition: 'all 0.25s ease'
};

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    // Check URL params for messages
    const urlParams = new URLSearchParams(window.location.search);
    const msg = urlParams.get('message');
    if (msg === 'signup_success') showToast('Account created successfully! Please sign in.', 'success');
    else if (msg === 'password_reset') showToast('Password reset successfully! Please sign in.', 'success');
    else if (msg === 'session_expired') showToast('Your session has expired. Please sign in again.', 'error');
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateEmail = (val) => {
    if (!val.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address';
    return null;
  };

  const validatePassword = (val) => {
    if (!val) return 'Password is required';
    if (val.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const handleBlur = (field, value) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = field === 'email' ? validateEmail(value) : validatePassword(value);
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleChange = (field, value) => {
    if (field === 'email') setEmail(value);
    else setPassword(value);
    setAlert(null);
    if (touched[field]) {
      const err = field === 'email' ? validateEmail(value) : validatePassword(value);
      setErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const getBorderColor = (field) => {
    if (errors[field] && touched[field]) return '#ff3b30';
    if (touched[field] && !errors[field]) return '#34c759';
    return '#e5e5ea';
  };

  const saveSession = (session) => {
    if (session?.access_token) {
      localStorage.setItem('jayenware_session', JSON.stringify({
        access_token: session.access_token,
        expires_at: session.expires_at || null,
        user_id: session.user?.id || null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    // Validate
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    setTouched({ email: true, password: true });
    setErrors({ email: emailErr, password: passErr });

    if (emailErr || passErr) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || result.message || 'Invalid email or password');
      }

      if (result.session) saveSession(result.session);

      showToast('Signed in successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = result.redirect || '/account';
      }, 1000);
    } catch (err) {
      const msg = err.message || 'Something went wrong';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('email')) {
        setAlert(msg);
        setErrors({ email: ' ', password: ' ' });
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In | JAYENWARE</title>
        <meta name="description" content="Sign in to your JAYENWARE account" />
      </Head>

      <div style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)', animation: 'cardSlideUp 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) forwards' }}>
          
          {/* Branding */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/logo.png" alt="JAYENWARE" style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px' }} />
            <h1 style={{ fontFamily: "var(--font-heading), 'Manrope', sans-serif", fontSize: 24, fontWeight: 800, color: '#1d1d1f', margin: '0 0 4px' }}>Welcome Back</h1>
            <p style={{ fontSize: 14, color: '#86868b', margin: 0 }}>Sign in to continue your journey</p>
          </div>

          {/* Alert Error */}
          {alert && (
            <div style={{ background: '#fff0ef', border: '1.5px solid #ffd1cf', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#cc1a14', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 16, flexShrink: 0 }}></i>
              <span>{alert}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }} htmlFor="email">
                Email Address <span style={{ color: '#ff3b30' }}>*</span>
              </label>
              <input id="email" type="email" value={email} onChange={(e) => handleChange('email', e.target.value)} onBlur={() => handleBlur('email', email)} placeholder="you@example.com" style={{ ...inputStyle, borderColor: getBorderColor('email') }} />
              {errors.email && touched.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ff3b30', marginTop: 4 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 11 }}></i>
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }} htmlFor="password">
                Password <span style={{ color: '#ff3b30' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => handleChange('password', e.target.value)} onBlur={() => handleBlur('password', password)} placeholder="Enter your password" style={{ ...inputStyle, paddingRight: 48, borderColor: getBorderColor('password') }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: 16, padding: 6 }} tabIndex={-1}>
                  <i className={`fa-solid fa-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
              {errors.password && touched.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ff3b30', marginTop: 4 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 11 }}></i>
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Forgot Password */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, marginTop: -8 }}>
              <Link href="/forgot-password" style={{ fontSize: 13, color: '#007aff', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <input type="checkbox" id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#007aff', cursor: 'pointer' }} />
              <label htmlFor="remember" style={{ fontSize: 13, color: '#86868b', fontWeight: 500, cursor: 'pointer' }}>Remember me for 30 days</label>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px 24px', background: loading ? '#a1a1a6' : '#1d1d1f', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
            <span style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
            <span style={{ fontSize: 12, color: '#86868b', fontWeight: 500, textTransform: 'uppercase' }}>New to JAYENWARE?</span>
            <span style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
          </div>

          {/* Footer Link */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/auth/signup" style={{ fontSize: 14, color: '#007aff', textDecoration: 'none', fontWeight: 600 }}>Create a new account</Link>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#ff3b30' : '#1d1d1f', color: '#fff', padding: '14px 24px', borderRadius: 50, fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className={`fa-solid fa-circle-${toast.type === 'error' ? 'exclamation' : 'check'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes cardSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
