'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const inputStyle = {
  width: '100%', padding: '12px 16px',
  border: '1.5px solid #e5e5ea',
  borderRadius: 12, fontSize: 15, fontFamily: "'Inter', sans-serif",
  color: '#1d1d1f', background: '#fff', outline: 'none',
  transition: 'all 0.25s ease'
};

// Central Auth button design
const socialButtonStyle = {
  width: '100%', padding: '12px 24px',
  background: '#fff', color: '#1d1d1f',
  border: '1.5px solid #dadce0', borderRadius: 12,
  fontSize: 14, fontWeight: 500, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
  fontFamily: "'Inter', -apple-system, sans-serif",
  marginBottom: 16,
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  position: 'relative'
};

const apiErrorMessage = (payload, fallback) => {
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.error?.message === 'string') return payload.error.message;
  if (typeof payload?.message === 'string') return payload.message;
  return fallback;
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
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  // QR Scanner states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [qrSuccess, setQrSuccess] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [qrLoginLoading, setQrLoginLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const msg = urlParams.get('message');
    if (msg === 'signup_success') showToast('Account created successfully! Please sign in.', 'success');
    else if (msg === 'password_reset') showToast('Password reset successfully! Please sign in.', 'success');
    else if (msg === 'session_expired') showToast('Your session has expired. Please sign in again.', 'error');
    
    // Load QR library dynamically
    if (!window.jsQR) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
    
    return () => {
      stopCamera();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
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

  const loginWithCredentials = async (emailVal, passwordVal) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal.trim(), password: passwordVal })
      });

      const result = await res.json();

      if (!res.ok) {
        return { 
          success: false, 
          error: apiErrorMessage(result, 'Invalid email or password'),
          status: res.status
        };
      }

      const payload = result.data || result;
      if (payload.session) saveSession(payload.session);

      return { 
        success: true, 
        redirect: result.redirect || '/auth/account',
        data: result
      };
    } catch (err) {
      return { 
        success: false, 
        error: err.message || 'Network error. Please check your connection.'
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    setTouched({ email: true, password: true });
    setErrors({ email: emailErr, password: passErr });

    if (emailErr || passErr) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);

    const result = await loginWithCredentials(email, password);

    if (!result.success) {
      const msg = result.error;
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('email')) {
        setAlert(msg);
        setErrors({ email: ' ', password: ' ' });
      } else {
        showToast(msg, 'error');
      }
    } else {
      showToast('Signed in successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = result.redirect;
      }, 800);
    }

    setLoading(false);
  };

  // QR codes contain a one-time Central Auth token, never an email/password pair.
  const parseQRToken = (data) => {
    const raw = String(data || '').trim();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const token = parsed.token || parsed.login_token || parsed.temporary_token || parsed.access_token;
      return token && token.length >= 20 ? token : null;
    } catch {
      try {
        const params = new URLSearchParams(raw);
        const token = params.get('token') || params.get('login_token') || params.get('temporary_token');
        if (token && token.length >= 20) return token;
      } catch { /* fall through to raw token */ }
      return raw.length >= 20 && !raw.includes(':') ? raw : null;
    }
  };

  const loginWithToken = async (token) => {
    try {
      const res = await fetch('/api/auth/temporary-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, error: apiErrorMessage(result, 'Invalid or expired login token') };
      const payload = result.data || result;
      if (payload.session) saveSession(payload.session);
      return { success: true, redirect: result.redirect || '/auth/account', data: result };
    } catch (err) {
      return { success: false, error: err.message || 'Network error. Please check your connection.' };
    }
  };

  const processQRData = async (data) => {
    if (!data) return;
    const token = parseQRToken(data);
    if (!token) {
      setQrError('Invalid QR code. Scan a valid Central Auth login token.');
      showToast('Invalid QR token format', 'error');
      setTimeout(() => setQrError(null), 4000);
      return;
    }

    stopCamera();
    setQrScanning(false);
    setQrLoginLoading(true);
    setQrError(null);
    const result = await loginWithToken(token);

    if (result.success) {
      setQrSuccess(true);
      setQrLoginLoading(false);
      setTimeout(() => {
        setShowQRScanner(false);
        showToast('Signed in successfully! Redirecting...', 'success');
        setTimeout(() => { window.location.href = result.redirect; }, 500);
      }, 1200);
    } else {
      setQrLoginLoading(false);
      setQrError(apiErrorMessage(result, 'This login token is invalid, expired, or already used.'));
      showToast('Token login failed', 'error');
      setTimeout(() => { setQrError(null); startCamera(); }, 3000);
    }
  };

  const startCamera = async () => {
    setQrError(null);
    setQrSuccess(false);
    setQrLoginLoading(false);
    setQrScanning(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      
      streamRef.current = stream;
      setCameraPermission('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanQRCode();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraPermission('denied');
      setQrScanning(false);
      
      if (err.name === 'NotAllowedError') {
        setQrError('Camera access denied. Please allow camera access in your browser settings or upload a QR image.');
      } else if (err.name === 'NotFoundError') {
        setQrError('No camera found on your device. Please upload a QR image instead.');
      } else {
        setQrError('Failed to access camera. Please upload a QR image or sign in manually.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setQrScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        
        if (code) {
          processQRData(code.data);
          return;
        }
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  };

  const handleQRImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setQrError(null);
    setQrSuccess(false);
    stopCamera();
    setQrScanning(false);
    setQrLoginLoading(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if (window.jsQR) {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          
          if (code) {
            await processQRData(code.data);
          } else {
            setQrLoginLoading(false);
            setQrError('No QR code detected in the image. Please try another image.');
            showToast('No QR code detected', 'error');
            setTimeout(() => setQrError(null), 4000);
          }
        } else {
          setQrLoginLoading(false);
          setQrError('QR scanner is still loading. Please try again in a moment.');
          setTimeout(() => setQrError(null), 3000);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  const openQRScanner = () => {
    setShowQRScanner(true);
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  const closeQRScanner = () => {
    stopCamera();
    setShowQRScanner(false);
    setQrError(null);
    setQrSuccess(false);
    setQrLoginLoading(false);
    setCameraPermission(null);
  };

  return (
    <>
      <Head>
        <title>Sign In | JAYENWARE</title>
        <meta name="description" content="Sign in to your JAYENWARE account" />
      </Head>

      <div style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)', animation: 'cardSlideUp 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) forwards' }}>
          
          {/* Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/logo.png" alt="JAYENWARE" style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px' }} />
            <h1 style={{ fontFamily: "var(--font-heading), 'Manrope', sans-serif", fontSize: 24, fontWeight: 800, color: '#1d1d1f', margin: '0 0 4px' }}>Welcome Back</h1>
            <p style={{ fontSize: 14, color: '#86868b', margin: 0 }}>Sign in to continue your journey</p>
          </div>

          {/* ===== JABIYEN CARD AUTH (QR Scanner) ===== */}
          <button 
            onClick={openQRScanner}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.borderColor = '#c4c7cc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#dadce0'; }}
            style={socialButtonStyle}
          >
            <img 
              src="/logo.png" 
              alt="JABIYEN" 
              style={{ 
                width: 20, height: 20, 
                borderRadius: 4,
                flexShrink: 0,
                objectFit: 'contain'
              }} 
            />
            <span style={{ flex: 1, textAlign: 'center' }}>JABIYEN Card Auth</span>
          </button>

          {/* ===== CONTINUE WITH EMAIL ===== */}
          {!showEmailForm ? (
            <button 
              onClick={() => setShowEmailForm(true)}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.borderColor = '#c4c7cc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#dadce0'; }}
              style={{
                ...socialButtonStyle,
                marginBottom: 0
              }}
            >
              <div style={{ 
                width: 20, height: 20, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <i className="fa-solid fa-envelope" style={{ fontSize: 14, color: '#5f6368' }}></i>
              </div>
              <span style={{ flex: 1, textAlign: 'center' }}>Continue with Email</span>
            </button>
          ) : (
            /* ===== EMAIL FORM (Expanded) ===== */
            <div style={{ 
              animation: 'expandForm 0.35s ease',
              border: '1.5px solid #dadce0', 
              borderRadius: 16, 
              padding: '24px 20px 20px',
              marginTop: 4,
              background: '#fafafa'
            }}>
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 20
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f' }}>
                  Sign in with Email
                </span>
                <button 
                  onClick={() => setShowEmailForm(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#86868b', fontSize: 14, padding: '4px 8px',
                    borderRadius: 6, transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#eee'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Alert Error */}
              {alert && (
                <div style={{ background: '#fff0ef', border: '1.5px solid #ffd1cf', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#cc1a14', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 16, flexShrink: 0 }}></i>
                  <span>{alert}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }} htmlFor="email">
                    Email Address <span style={{ color: '#ff3b30' }}>*</span>
                  </label>
                  <input 
                    id="email" type="email" value={email} 
                    onChange={(e) => handleChange('email', e.target.value)} 
                    onBlur={() => handleBlur('email', email)} 
                    placeholder="you@example.com" 
                    style={{ ...inputStyle, borderColor: getBorderColor('email'), background: '#fff' }} 
                  />
                  {errors.email && touched.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ff3b30', marginTop: 4 }}>
                      <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 11 }}></i>
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }} htmlFor="password">
                    Password <span style={{ color: '#ff3b30' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      id="password" type={showPassword ? 'text' : 'password'} 
                      value={password} 
                      onChange={(e) => handleChange('password', e.target.value)} 
                      onBlur={() => handleBlur('password', password)} 
                      placeholder="Enter your password" 
                      style={{ ...inputStyle, paddingRight: 48, borderColor: getBorderColor('password'), background: '#fff' }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: 16, padding: 6 }} 
                      tabIndex={-1}
                    >
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="checkbox" id="remember" checked={remember} 
                      onChange={(e) => setRemember(e.target.checked)} 
                      style={{ width: 16, height: 16, accentColor: '#007aff', cursor: 'pointer' }} 
                    />
                    <label htmlFor="remember" style={{ fontSize: 12, color: '#86868b', fontWeight: 500, cursor: 'pointer' }}>
                      Remember me
                    </label>
                  </div>
                  <Link href="/forgot-password" style={{ fontSize: 12, color: '#007aff', textDecoration: 'none', fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  style={{ 
                    width: '100%', padding: '12px 24px', 
                    background: loading ? '#a1a1a6' : '#1d1d1f', 
                    color: '#fff', fontFamily: "'Inter', sans-serif", 
                    fontSize: 15, fontWeight: 600, border: 'none', 
                    borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 
                  }}
                >
                  {loading ? (
                    <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  ) : 'Sign In'}
                </button>
              </form>
            </div>
          )}

          {/* Sign Up Link */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ fontSize: 13, color: '#86868b', margin: 0 }}>
              New to JAYENWARE?{' '}
              <Link href="/auth/signup" style={{ color: '#007aff', textDecoration: 'none', fontWeight: 600 }}>
                Create a new account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '28px 24px',
            maxWidth: 400, width: '100%', position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <button onClick={closeQRScanner} style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(0,0,0,0.05)', border: 'none',
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#1d1d1f', fontSize: 16,
              transition: 'all 0.2s ease', zIndex: 10
            }}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <h3 style={{ 
              fontFamily: "var(--font-heading), 'Manrope', sans-serif",
              fontSize: 18, fontWeight: 700, color: '#1d1d1f',
              margin: '0 0 6px', textAlign: 'center'
            }}>
              {qrSuccess ? 'Login Successful!' : qrLoginLoading ? 'Signing In...' : 'JABIYEN Card Auth'}
            </h3>
            <p style={{
              fontSize: 13, color: '#86868b', textAlign: 'center',
              margin: '0 0 20px'
            }}>
              {qrSuccess 
                ? 'Redirecting you to your account...' 
                : qrLoginLoading 
                  ? 'Verifying your credentials...' 
                  : 'Scan a Central Auth login token to sign in instantly'}
            </p>

            <div style={{
              width: '100%', aspectRatio: '1/1',
              background: '#000', borderRadius: 16,
              overflow: 'hidden', position: 'relative',
              marginBottom: 16
            }}>
              {qrSuccess && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(52, 199, 89, 0.95)',
                  flexDirection: 'column', gap: 16
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: '#fff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}>
                    <i className="fa-solid fa-check" style={{ fontSize: 36, color: '#34c759' }}></i>
                  </div>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Verified!</span>
                </div>
              )}

              {qrLoginLoading && !qrSuccess && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.9)',
                  flexDirection: 'column', gap: 20
                }}>
                  <div style={{
                    width: 60, height: 60,
                    border: '3px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#007aff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>
                    Authenticating...
                  </span>
                </div>
              )}

              {!qrLoginLoading && !qrSuccess && (
                <>
                  <video 
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  
                  {qrScanning && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div style={{ width: '70%', height: '70%', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderTop: '3px solid #007aff', borderLeft: '3px solid #007aff', borderRadius: '4px 0 0 0' }}></div>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderTop: '3px solid #007aff', borderRight: '3px solid #007aff', borderRadius: '0 4px 0 0' }}></div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderBottom: '3px solid #007aff', borderLeft: '3px solid #007aff', borderRadius: '0 0 0 4px' }}></div>
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderBottom: '3px solid #007aff', borderRight: '3px solid #007aff', borderRadius: '0 0 4px 0' }}></div>
                      </div>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        maskImage: 'radial-gradient(circle 35% at center, transparent 100%, black 100%)',
                        WebkitMaskImage: 'radial-gradient(circle 35% at center, transparent 100%, black 100%)'
                      }} />
                      <div style={{
                        position: 'absolute',
                        width: '60%', height: 2,
                        background: 'linear-gradient(90deg, transparent, #007aff, transparent)',
                        animation: 'scanLine 2s ease-in-out infinite'
                      }} />
                    </div>
                  )}

                  {cameraPermission === 'denied' && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.85)', padding: 20
                    }}>
                      <div style={{ textAlign: 'center', color: '#fff' }}>
                        <i className="fa-solid fa-camera-slash" style={{ fontSize: 40, marginBottom: 12, opacity: 0.7 }}></i>
                        <p style={{ fontSize: 14, margin: '0 0 8px', opacity: 0.9 }}>Camera access denied</p>
                        <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Use the upload option below</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {qrError && (
              <div style={{
                background: '#fff0ef', 
                border: '1px solid rgba(255,59,48,0.2)', 
                borderRadius: 14, 
                padding: '14px 16px',
                marginBottom: 16,
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 12,
                animation: 'shakeError 0.5s ease'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#ff3b30', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-exclamation" style={{ color: '#fff', fontSize: 12 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 2 }}>
                    Login Failed
                  </div>
                  <div style={{ fontSize: 12, color: '#86868b', lineHeight: 1.4 }}>
                    {qrError}
                  </div>
                </div>
              </div>
            )}

            {!qrSuccess && (
              <div style={{ textAlign: 'center' }}>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 20px', borderRadius: 12,
                  background: qrLoginLoading ? '#f5f5f7' : '#f5f5f7', 
                  color: qrLoginLoading ? '#a1a1a6' : '#1d1d1f',
                  fontSize: 14, fontWeight: 500, 
                  cursor: qrLoginLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s ease',
                  pointerEvents: qrLoginLoading ? 'none' : 'auto'
                }}>
                  <i className="fa-solid fa-image"></i>
                  Upload QR from Gallery
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleQRImageUpload}
                    disabled={qrLoginLoading}
                    style={{ display: 'none' }}
                  />
                </label>
                <p style={{
                  fontSize: 11, color: '#86868b', marginTop: 8
                }}>
                  Supports PNG, JPG, or any image containing a Central Auth token
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ 
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', 
          background: toast.type === 'error' ? '#ff3b30' : '#1d1d1f', 
          color: '#fff', padding: '14px 24px', borderRadius: 50, 
          fontSize: 14, fontWeight: 500, zIndex: 9999, 
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)', 
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'toastSlideDown 0.4s ease'
        }}>
          <i className={`fa-solid fa-circle-${toast.type === 'error' ? 'exclamation' : 'check'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes cardSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scanLine { 0% { top: 15%; } 50% { top: 85%; } 100% { top: 15%; } }
        @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
        @keyframes shakeError { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        @keyframes toastSlideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes expandForm { from { opacity: 0; max-height: 0; transform: translateY(-8px); } to { opacity: 1; max-height: 500px; transform: translateY(0); } }
      `}</style>
    </>
  );
}
