'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const inputStyle = {
  width: '100%', padding: '16px 20px',
  border: '2px solid rgba(255,255,255,0.2)',
  borderRadius: 16, fontSize: 17, fontFamily: "'Inter', sans-serif",
  color: '#fff', background: 'rgba(255,255,255,0.08)',
  outline: 'none', backdropFilter: 'blur(10px)',
  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
};

const steps = [
  { key: 'greeting', title: 'Welcome to JABIYEN', subtitle: "Let's create something beautiful together" },
  { key: 'first_name', field: 'first_name', label: 'First, what should we call you?', placeholder: 'Your first name', type: 'text', subtitle: 'Your journey begins with your name' },
  { key: 'last_name', field: 'last_name', label: 'And your family name?', placeholder: 'Your last name', type: 'text', subtitle: 'Almost there, just a few more details' },
  { key: 'email', field: 'email', label: 'Where can we reach you?', placeholder: 'you@example.com', type: 'email', subtitle: "We'll send you a warm welcome" },
  { key: 'phone', field: 'phone', label: 'Your phone number?', placeholder: '+8801XXXXXXXXX', type: 'tel', subtitle: 'For account security and updates' },
  { key: 'password', field: 'password', label: 'Create a strong password', placeholder: 'At least 8 characters', type: 'password', subtitle: 'Mix letters, numbers, and symbols for strength', guide: true },
  { key: 'address_line1', field: 'address_line1', label: 'Where do you live?', placeholder: 'House/Flat, Street', type: 'text', subtitle: "We'll use this for shipping" },
  { key: 'address_line2', field: 'address_line2', label: 'Any landmarks nearby?', placeholder: 'Landmark, Area (optional)', type: 'text', subtitle: 'Help us find you easier', optional: true },
  { key: 'city', field: 'city', label: 'Which city do you call home?', placeholder: 'Dhaka', type: 'text', subtitle: 'Your vibrant city awaits' },
  { key: 'state', field: 'state', label: 'Your state or division?', placeholder: 'Dhaka Division', type: 'text', subtitle: 'Almost at the finish line' },
  { key: 'postal_code', field: 'postal_code', label: 'What\'s your postal code?', placeholder: '1205', type: 'text', subtitle: 'Just two more steps' },
  { key: 'country', field: 'country', label: 'And your country?', placeholder: 'Select your country', type: 'select', subtitle: 'The final piece of the puzzle', options: ['Bangladesh', 'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Other'] },
];

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', address_line1: '', address_line2: '',
    city: '', state: '', postal_code: '', country: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [animState, setAnimState] = useState('entering');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return Math.min(score, 5);
  };

  const handleStartForm = () => {
    setShowForm(true);
    setCurrentStep(1);
    setAnimState('entering');
  };

  const handleNext = () => {
    const step = steps[currentStep];
    
    // Validate current step if it has a field
    if (step.field) {
      const value = formData[step.field];
      if (!step.optional && !value.trim()) {
        setError('This field is required');
        return;
      }
      if (step.field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setError('Please enter a valid email address');
        return;
      }
      if (step.field === 'phone' && value && !/^\+?[\d\s\-()]{7,20}$/.test(value)) {
        setError('Please enter a valid phone number');
        return;
      }
      if (step.field === 'password' && value && value.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }

    setError(null);
    setAnimState('exiting');
    
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        setAnimState('entering');
      }
    }, 400);
  };

  const handlePrev = () => {
    setError(null);
    setAnimState('exiting');
    
    setTimeout(() => {
      if (currentStep > 1) {
        setCurrentStep(prev => prev - 1);
        setAnimState('entering');
      }
    }, 400);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setError(null);
    
    if (id === 'password') {
      setPasswordStrength(getPasswordStrength(value));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || 'Signup failed');
      
      // Final animation before redirect
      setCurrentStep('complete');
      setTimeout(() => {
        showToast('Account created successfully! Redirecting...', 'success');
        setTimeout(() => window.location.href = '/auth/signin', 2000);
      }, 1500);
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = (provider) => {
    const SUPABASE_URL = 'https://eiueitoxxqzkolsouuzy.supabase.co';
    const redirectTo = encodeURIComponent(window.location.origin + '/auth/account');
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${redirectTo}`;
  };

  const getStrengthColor = () => {
    const colors = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#30d158'];
    return colors[passwordStrength - 1] || '#ff3b30';
  };

  const getStrengthLabel = () => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    return labels[passwordStrength - 1] || 'Very Weak';
  };

  const renderStep = () => {
    // Greeting step
    if (currentStep === 0) {
      return (
        <div className={`step-content ${animState}`} style={{ textAlign: 'center' }}>
          <div className="greeting-icon">
            <div className="icon-circle">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="url(#gradient1)"/>
                <path d="M16 32V20L24 14L32 20V32H16Z" fill="white" fillOpacity="0.9"/>
                <circle cx="24" cy="22" r="4" fill="white"/>
                <defs>
                  <linearGradient id="gradient1" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#007aff"/>
                    <stop offset="100%" stopColor="#5856d6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <h1 className="step-title">Welcome to <span className="brand">JABIYEN</span></h1>
          <p className="step-subtitle">Your journey to premium tech starts here</p>
          <p className="step-description">One account unlocks everything — exclusive deals, faster checkout, and personalized recommendations.</p>
          
          <div className="social-buttons" style={{ marginTop: 32 }}>
            <button onClick={() => handleSocialSignIn('google')} className="social-btn">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button onClick={() => handleSocialSignIn('azure')} className="social-btn">
              <svg width="22" height="22" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              Continue with Microsoft
            </button>
          </div>

          <div className="divider" style={{ margin: '28px 0' }}>
            <span>or</span>
          </div>

          <button onClick={handleStartForm} className="email-start-btn">
            <span className="btn-icon">✨</span>
            Create account with email
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginLeft: 8 }}>
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <p className="signin-footer">
            Already have an account? <Link href="/auth/signin" className="link">Sign in</Link>
          </p>
        </div>
      );
    }

    // Completion step
    if (currentStep === 'complete') {
      return (
        <div className="step-content entering" style={{ textAlign: 'center' }}>
          <div className="complete-animation">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="url(#gradient2)" strokeWidth="3" className="circle-draw"/>
              <path d="M24 40L35 51L56 29" stroke="url(#gradient2)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="check-draw"/>
              <defs>
                <linearGradient id="gradient2" x1="0" y1="0" x2="80" y2="80">
                  <stop offset="0%" stopColor="#34c759"/>
                  <stop offset="100%" stopColor="#30d158"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="complete-title">You're all set, {formData.first_name}! 🎉</h2>
          <p className="complete-subtitle">Welcome to the JABIYEN family. Redirecting you to sign in...</p>
        </div>
      );
    }

    // Form steps
    const step = steps[currentStep];
    return (
      <div className={`step-content ${animState}`}>
        {/* Progress indicator */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((currentStep) / (steps.length - 1)) * 100}%` }} />
        </div>

        <div className="form-step-inner">
          <span className="step-number">Step {currentStep} of {steps.length - 1}</span>
          <h2 className="step-question">{step.label}</h2>
          <p className="step-hint">{step.subtitle}</p>

          {step.field === 'password' && step.guide && (
            <div className="password-guide">
              <div className="strength-bar">
                <div className="strength-fill" style={{ width: `${(passwordStrength / 5) * 100}%`, background: getStrengthColor() }} />
              </div>
              <span className="strength-label" style={{ color: getStrengthColor() }}>{getStrengthLabel()}</span>
            </div>
          )}

          <div className="input-container">
            {step.type === 'select' ? (
              <div className="select-wrapper">
                <select
                  id={step.field}
                  value={formData[step.field]}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  style={inputStyle}
                  autoFocus
                >
                  <option value="">{step.placeholder}</option>
                  {step.options.map(opt => (
                    <option key={opt} value={opt} style={{ color: '#1d1d1f' }}>{opt}</option>
                  ))}
                </select>
                <svg className="select-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ) : (
              <input
                id={step.field}
                type={step.type}
                value={formData[step.field]}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={step.placeholder}
                style={inputStyle}
                autoFocus
                autoComplete={step.field === 'password' ? 'new-password' : 'on'}
              />
            )}
            {error && <p className="field-error">{error}</p>}
          </div>

          <div className="step-actions">
            {currentStep > 1 && (
              <button onClick={handlePrev} className="back-btn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
            )}
            <button 
              onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext} 
              className="next-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : currentStep === steps.length - 1 ? (
                'Create Account'
              ) : (
                <>
                  Continue
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Sign Up | JAYENWARE</title>
        <meta name="description" content="Create your JAYENWARE account" />
      </Head>

      <div className="page-wrapper">
        {/* Animated background */}
        <div className="bg-gradient" />
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />

        <div className="card-container">
          {/* Logo */}
          <div className="logo-area">
            <img src="/logo.png" alt="JAYENWARE" className="logo-img" />
          </div>

          {renderStep()}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.type}`}>
            <span className="toast-icon">{toast.type === 'error' ? '⚠️' : '✅'}</span>
            {toast.message}
          </div>
        )}
      </div>

      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
          background: #0a0a0a;
        }

        .bg-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(0,122,255,0.15) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 100%, rgba(88,86,214,0.1) 0%, transparent 50%);
        }

        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: float 20s ease-in-out infinite;
        }

        .orb-1 {
          width: 400px;
          height: 400px;
          background: #007aff;
          top: -100px;
          right: -100px;
        }

        .orb-2 {
          width: 300px;
          height: 300px;
          background: #5856d6;
          bottom: -80px;
          left: -80px;
          animation-delay: -10s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .card-container {
          width: 100%;
          max-width: 460px;
          background: rgba(28, 28, 30, 0.85);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          padding: 40px 32px;
          position: relative;
          z-index: 1;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4), 
                      0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }

        .logo-area {
          text-align: center;
          margin-bottom: 8px;
        }

        .logo-img {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
        }

        /* Step Content */
        .step-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          animation-duration: 0.5s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          animation-fill-mode: both;
        }

        .step-content.entering {
          animation-name: slideUpIn;
        }

        .step-content.exiting {
          animation-name: slideDownOut;
        }

        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes slideDownOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-24px) scale(0.97); }
        }

        /* Greeting */
        .greeting-icon {
          margin-bottom: 20px;
        }

        .icon-circle {
          display: inline-block;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .step-title {
          font-family: 'Manrope', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 8px;
          letter-spacing: -0.03em;
        }

        .brand {
          background: linear-gradient(135deg, #007aff, #5856d6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .step-subtitle {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 8px;
        }

        .step-description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
          line-height: 1.6;
        }

        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .social-btn {
          width: 100%;
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
        }

        .social-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          color: rgba(255, 255, 255, 0.2);
          font-size: 13px;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .email-start-btn {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: #fff;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
          box-shadow: 0 8px 32px rgba(0, 122, 255, 0.3);
        }

        .email-start-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 122, 255, 0.4);
        }

        .btn-icon {
          font-size: 20px;
        }

        .signin-footer {
          margin-top: 24px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
        }

        .link {
          color: #007aff;
          text-decoration: none;
          font-weight: 600;
        }

        .link:hover {
          text-decoration: underline;
        }

        /* Progress */
        .progress-bar {
          width: 100%;
          height: 3px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          margin-bottom: 32px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #007aff, #5856d6);
          border-radius: 2px;
          transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .form-step-inner {
          flex: 1;
        }

        .step-number {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .step-question {
          font-family: 'Manrope', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin: 8px 0 6px;
          letter-spacing: -0.02em;
        }

        .step-hint {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.45);
          margin: 0 0 24px;
        }

        .password-guide {
          margin-bottom: 16px;
        }

        .strength-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: all 0.4s ease;
        }

        .strength-label {
          font-size: 12px;
          font-weight: 600;
        }

        .input-container {
          margin-bottom: 28px;
        }

        .select-wrapper {
          position: relative;
        }

        .select-wrapper select {
          appearance: none;
          -webkit-appearance: none;
          padding-right: 48px;
        }

        .select-wrapper select option {
          background: #1c1c1e;
          color: #fff;
        }

        .select-arrow {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        input:focus, select:focus {
          border-color: rgba(0, 122, 255, 0.6) !important;
          background: rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
        }

        .field-error {
          font-size: 13px;
          color: #ff453a;
          margin: 8px 0 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .step-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .back-btn {
          padding: 12px 20px;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .next-btn {
          flex: 1;
          padding: 14px 24px;
          background: #fff;
          color: #0a0a0a;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
        }

        .next-btn:hover {
          background: #f0f0f0;
          transform: translateY(-1px);
        }

        .next-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #0a0a0a;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Completion */
        .complete-animation {
          margin-bottom: 24px;
        }

        .circle-draw {
          stroke-dasharray: 240;
          stroke-dashoffset: 240;
          animation: drawCircle 0.8s 0.2s ease forwards;
        }

        .check-draw {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: drawCheck 0.4s 0.7s ease forwards;
        }

        @keyframes drawCircle {
          to { stroke-dashoffset: 0; }
        }

        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }

        .complete-title {
          font-family: 'Manrope', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 8px;
        }

        .complete-subtitle {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        /* Toast */
        .toast {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          padding: 14px 24px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 500;
          z-index: 999;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
          animation: toastIn 0.4s ease;
          font-family: 'Inter', sans-serif;
        }

        .toast.success {
          background: #30d158;
          color: #fff;
        }

        .toast.error {
          background: #ff453a;
          color: #fff;
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @media (max-width: 480px) {
          .card-container {
            padding: 32px 20px;
            border-radius: 24px;
          }
          .step-title {
            font-size: 24px;
          }
          .step-question {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
}
