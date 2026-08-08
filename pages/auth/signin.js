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

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
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

  // Direct login with credentials (for QR code)
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
          error: result.error || result.message || 'Invalid email or password',
          status: res.status
        };
      }

      if (result.session) saveSession(result.session);

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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const SUPABASE_URL = 'https://eiueitoxxqzkolsouuzy.supabase.co';
      window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin + '/auth/account')}`;
    } catch (err) {
      showToast('Failed to connect Google Sign-In', 'error');
      setGoogleLoading(false);
    }
  };

  // Parse QR code data for credentials
  const parseQRCredentials = (data) => {
    try {
      // Try JSON format: {"email":"user@example.com","password":"pass123"}
      const parsed = JSON.parse(data);
      if (parsed.email && parsed.password) {
        return { email: parsed.email, password: parsed.password };
      }
    } catch (e) {
      // Try URL format: email=user@example.com&password=pass123
      const params = new URLSearchParams(data);
      const email = params.get('email');
      const password = params.get('password');
      if (email && password) {
        return { email, password };
      }
      
      // Try basic format: email:password
      const parts = data.split(':');
      if (parts.length === 2 && parts[0].includes('@')) {
        return { email: parts[0], password: parts[1] };
      }
    }
    return null;
  };

  // Process scanned QR data - Direct login without filling form
  const processQRData = async (data) => {
    if (!data) return;
    
    const credentials = parseQRCredentials(data);
    if (!credentials) {
      setQrError('Invalid QR code. This QR doesn\'t contain valid login credentials.');
      showToast('Invalid QR code format', 'error');
      setTimeout(() => setQrError(null), 4000);
      return;
    }

    // Stop scanning and show loading
    stopCamera();
    setQrScanning(false);
    setQrLoginLoading(true);
    setQrError(null);

    // Attempt direct login
    const result = await loginWithCredentials(credentials.email, credentials.password);

    if (result.success) {
      // Login successful
      setQrSuccess(true);
      setQrLoginLoading(false);
      
      // Close scanner after a brief moment
      setTimeout(() => {
        setShowQRScanner(false);
        showToast('Signed in successfully! Redirecting...', 'success');
        // Redirect
        setTimeout(() => {
          window.location.href = result.redirect;
        }, 500);
      }, 1200);
    } else {
      // Login failed - show error in scanner modal
      setQrLoginLoading(false);
      
      const errorMessage = result.error || 'Invalid credentials';
      
      if (errorMessage.toLowerCase().includes('invalid') || 
          errorMessage.toLowerCase().includes('credentials') || 
          errorMessage.toLowerCase().includes('password') || 
          errorMessage.toLowerCase().includes('email')) {
        setQrError('The credentials in this QR code are incorrect or expired.');
      } else if (errorMessage.toLowerCase().includes('network')) {
        setQrError('Network error. Please check your connection and try again.');
      } else {
        setQrError(errorMessage);
      }
      
      showToast('QR login failed', 'error');
      
      // Restart camera after error
      setTimeout(() => {
        setQrError(null);
        startCamera();
      }, 3000);
    }
  };

  // Start camera for QR scanning
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

  // Stop camera
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

  // Scan QR code from video stream
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

  // Handle QR image upload from gallery
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
            // Process the QR data (same flow as camera scan)
            const credentials = parseQRCredentials(code.data);
            if (!credentials) {
              setQrLoginLoading(false);
              setQrError('No valid login credentials found in this QR code.');
              showToast('Invalid QR code', 'error');
              setTimeout(() => setQrError(null), 4000);
              return;
            }

            const result = await loginWithCredentials(credentials.email, credentials.password);
            
            if (result.success) {
              setQrSuccess(true);
              setQrLoginLoading(false);
              setTimeout(() => {
                setShowQRScanner(false);
                showToast('Signed in successfully! Redirecting...', 'success');
                setTimeout(() => {
                  window.location.href = result.redirect;
                }, 500);
              }, 1200);
            } else {
              setQrLoginLoading(false);
              const errorMessage = result.error || 'Invalid credentials';
              if (errorMessage.toLowerCase().includes('invalid') || 
                  errorMessage.toLowerCase().includes('credentials')) {
                setQrError('The credentials in this QR code are incorrect or expired.');
              } else {
                setQrError(errorMessage);
              }
              showToast('QR login failed', 'error');
              setTimeout(() => setQrError(null), 4000);
            }
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
    
    // Reset file input
    e.target.value = '';
  };

  // Open QR scanner
  const openQRScanner = () => {
    setShowQRScanner(true);
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  // Close QR scanner
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
          
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/logo.png" alt="JAYENWARE" style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px' }} />
            <h1 style={{ fontFamily: "var(--font-heading), 'Manrope', sans-serif", fontSize: 24, fontWeight: 800, color: '#1d1d1f', margin: '0 0 4px' }}>Welcome Back</h1>
            <p style={{ fontSize: 14, color: '#86868b', margin: 0 }}>Sign in to continue your journey</p>
          </div>

          {/* QR Code Login Button */}
          <button 
            onClick={openQRScanner}
            style={{
              width: '100%', padding: '12px 24px',
              background: 'linear-gradient(135deg, #007aff, #5856d6)',
              color: '#fff',
              border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: "'Inter', sans-serif", marginBottom: 20,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,122,255,0.3)'
            }}
          >
            <i className="fa-solid fa-qrcode" style={{ fontSize: 18 }}></i>
            Scan QR Code to Login
          </button>

          {/* Google Sign-In Button */}
          <button onClick={handleGoogleSignIn} disabled={googleLoading} style={{
            width: '100%', padding: '12px 24px',
            background: '#fff', color: '#1d1d1f',
            border: '1.5px solid #e5e5ea', borderRadius: 12,
            fontSize: 15, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: "'Inter', sans-serif", marginBottom: 24,
            transition: 'all 0.2s ease'
          }}>
            {googleLoading ? (
              <span style={{ width: 20, height: 20, border: '2px solid #e5e5ea', borderTopColor: '#1d1d1f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <span style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
            <span style={{ fontSize: 11, color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or sign in with email</span>
            <span style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, marginTop: -8 }}>
              <Link href="/forgot-password" style={{ fontSize: 13, color: '#007aff', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <input type="checkbox" id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#007aff', cursor: 'pointer' }} />
              <label htmlFor="remember" style={{ fontSize: 13, color: '#86868b', fontWeight: 500, cursor: 'pointer' }}>Remember me for 30 days</label>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px 24px', background: loading ? '#a1a1a6' : '#1d1d1f', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ fontSize: 14, color: '#86868b', margin: 0 }}>
              New to JAYENWARE? <Link href="/auth/signup" style={{ color: '#007aff', textDecoration: 'none', fontWeight: 600 }}>Create a new account</Link>
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
            {/* Close Button */}
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
              {qrSuccess ? 'Login Successful!' : qrLoginLoading ? 'Signing In...' : 'Scan QR Code'}
            </h3>
            <p style={{
              fontSize: 13, color: '#86868b', textAlign: 'center',
              margin: '0 0 20px'
            }}>
              {qrSuccess 
                ? 'Redirecting you to your account...' 
                : qrLoginLoading 
                  ? 'Verifying your credentials...' 
                  : 'Point your camera at a QR code to sign in instantly'}
            </p>

            {/* Camera View / Loading / Success */}
            <div style={{
              width: '100%', aspectRatio: '1/1',
              background: '#000', borderRadius: 16,
              overflow: 'hidden', position: 'relative',
              marginBottom: 16
            }}>
              {/* QR Success State */}
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

              {/* Loading State */}
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

              {/* Camera Feed */}
              {!qrLoginLoading && !qrSuccess && (
                <>
                  <video 
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  
                  {/* Scanning Overlay */}
                  {qrScanning && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {/* Corner Borders */}
                      <div style={{
                        width: '70%', height: '70%',
                        position: 'relative'
                      }}>
                        {/* Top Left */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderTop: '3px solid #007aff', borderLeft: '3px solid #007aff', borderRadius: '4px 0 0 0' }}></div>
                        {/* Top Right */}
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderTop: '3px solid #007aff', borderRight: '3px solid #007aff', borderRadius: '0 4px 0 0' }}></div>
                        {/* Bottom Left */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderBottom: '3px solid #007aff', borderLeft: '3px solid #007aff', borderRadius: '0 0 0 4px' }}></div>
                        {/* Bottom Right */}
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderBottom: '3px solid #007aff', borderRight: '3px solid #007aff', borderRadius: '0 0 4px 0' }}></div>
                      </div>
                      {/* Dimmed overlay */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        maskImage: 'radial-gradient(circle 35% at center, transparent 100%, black 100%)',
                        WebkitMaskImage: 'radial-gradient(circle 35% at center, transparent 100%, black 100%)'
                      }} />
                      {/* Scanning line */}
                      <div style={{
                        position: 'absolute',
                        width: '60%', height: 2,
                        background: 'linear-gradient(90deg, transparent, #007aff, transparent)',
                        animation: 'scanLine 2s ease-in-out infinite'
                      }} />
                    </div>
                  )}

                  {/* Camera Permission Denied */}
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

            {/* Error Message - Apple style */}
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

            {/* Upload QR from Gallery */}
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
                  Supports PNG, JPG, or any image with a QR code
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
      `}</style>
    </>
  );
}
