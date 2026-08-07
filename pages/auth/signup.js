'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const inputStyle = {
  width: '100%',
  padding: '16px 20px',
  border: '2px solid rgba(255,255,255,0.15)',
  borderRadius: 16,
  fontSize: 17,
  fontFamily: "'Inter', sans-serif",
  color: '#fff',
  background: 'rgba(255,255,255,0.06)',
  outline: 'none',
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(10px)'
};

export default function SignUp() {
  const [step, setStep] = useState(0);
  const [animationState, setAnimationState] = useState('entering');
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', address_line1: '', address_line2: '',
    city: '', state: '', postal_code: '', country: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [typedText, setTypedText] = useState('');
  const inputRef = useRef(null);

  const fullGreeting = "Let's create your JABIYEN ID";
  const steps = [
    { id: 'greeting', title: '', field: null, subtitle: 'A beautiful journey begins' },
    { id: 'first_name', title: 'Hello! What should we call you?', field: 'first_name', placeholder: 'Your first name', type: 'text', icon: 'fa-user' },
    { id: 'last_name', title: 'And your last name?', field: 'last_name', placeholder: 'Your last name', type: 'text', icon: 'fa-user' },
    { id: 'email', title: 'Where can we reach you?', field: 'email', placeholder: 'you@example.com', type: 'email', icon: 'fa-envelope' },
    { id: 'phone', title: 'Your phone number?', field: 'phone', placeholder: '+8801XXXXXXXXX', type: 'tel', icon: 'fa-phone' },
    { id: 'password', title: 'Create a secure password', field: 'password', placeholder: 'At least 8 characters', type: 'password', icon: 'fa-lock', hint: 'Use 8+ characters with letters, numbers & symbols' },
    { id: 'address_line1', title: 'What\'s your address?', field: 'address_line1', placeholder: 'House/Flat, Street', type: 'text', icon: 'fa-location-dot' },
    { id: 'city', title: 'Which city do you live in?', field: 'city', placeholder: 'Dhaka', type: 'text', icon: 'fa-city' },
    { id: 'state', title: 'State or Division?', field: 'state', placeholder: 'Dhaka Division', type: 'text', icon: 'fa-map' },
    { id: 'postal_code', title: 'What\'s your postal code?', field: 'postal_code', placeholder: '1205', type: 'text', icon: 'fa-hashtag' },
    { id: 'country', title: 'And finally, your country?', field: 'country', placeholder: 'Select country', type: 'select', icon: 'fa-globe' },
    { id: 'complete', title: 'You\'re all set!', field: null, subtitle: 'Review and create your account' }
  ];

  const countries = ['Bangladesh', 'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Other'];

  useEffect(() => {
    if (step === 0) {
      let i = 0;
      setTypedText('');
      const interval = setInterval(() => {
        if (i <= fullGreeting.length) {
          setTypedText(fullGreeting.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => setStep(1), 800);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step === 0]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setAnimationState('entering');
    const timer = setTimeout(() => setAnimationState('active'), 50);
    return () => clearTimeout(timer);
  }, [step]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateField = (field, value) => {
    if (!value.trim()) return 'This field is required';
    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
    if (field === 'password' && value.length < 8) return 'Password must be at least 8 characters';
    if (field === 'phone' && !/^\+?[\d\s\-()]{7,20}$/.test(value)) return 'Enter a valid phone number';
    return null;
  };

  const handleNext = () => {
    const currentStep = steps[step];
    if (currentStep.field) {
      const error = validateField(currentStep.field, formData[currentStep.field]);
      if (error) {
        setErrors({ [currentStep.field]: error });
        return;
      }
      setErrors({});
    }

    if (step < steps.length - 1) {
      setAnimationState('exiting');
      setTimeout(() => setStep(prev => prev + 1), 400);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
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
      if (!res.ok) throw new Error(result.message || 'Signup failed');
      showToast('Welcome to JABIYEN! 🎉', 'success');
      setTimeout(() => window.location.href = '/auth/signin', 2000);
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

  const currentStepData = steps[step];
  const progress = ((step) / (steps.length - 1)) * 100;

  return (
    <>
      <Head>
        <title>Sign Up | JABIYEN</title>
        <meta name="description" content="Create your JABIYEN account" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 40%, #16213e 70%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient Background Effects */}
        <div style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          top: '10%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'pulse 8s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
          bottom: '10%',
          right: '20%',
          animation: 'pulse 10s ease-in-out infinite alternate'
        }} />

        {/* Main Card */}
        <div style={{
          width: '100%',
          maxWidth: 520,
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: 32,
          padding: '48px 40px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <i className="fa-solid fa-crown" style={{ fontSize: 24, color: '#fff' }}></i>
            </div>
            
            {/* Animated Title */}
            <div style={{
              minHeight: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {step === 0 ? (
                <h1 style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#fff',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  textAlign: 'center'
                }}>
                  {typedText}
                  <span style={{
                    animation: 'blink 0.8s infinite',
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 300
                  }}>|</span>
                </h1>
              ) : (
                <div style={{
                  opacity: animationState === 'entering' ? 0 : 1,
                  transform: animationState === 'entering' ? 'translateY(10px)' : 'translateY(0)',
                  transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  <h2 style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#fff',
                    margin: '0 0 6px',
                    letterSpacing: '-0.02em'
                  }}>
                    {currentStepData.title}
                  </h2>
                  {currentStepData.subtitle && (
                    <p style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.4)',
                      margin: 0,
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {currentStepData.subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step Content */}
          {step > 0 && step < steps.length - 1 && (
            <div style={{
              opacity: animationState === 'exiting' ? 0 : 1,
              transform: animationState === 'exiting' ? 'translateY(-10px)' : 'translateY(0)',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              <div style={{ position: 'relative', marginBottom: 24 }}>
                <div style={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: 16
                }}>
                  <i className={`fa-solid ${currentStepData.icon}`}></i>
                </div>
                
                {currentStepData.type === 'select' ? (
                  <div style={{ position: 'relative' }}>
                    <select
                      id={currentStepData.field}
                      value={formData[currentStepData.field]}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      ref={inputRef}
                      style={{
                        ...inputStyle,
                        paddingLeft: 52,
                        paddingRight: 48,
                        cursor: 'pointer',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        borderColor: errors[currentStepData.field] ? 'rgba(255,59,48,0.5)' : 'rgba(255,255,255,0.15)'
                      }}
                    >
                      <option value="" style={{ background: '#1a1a2e', color: '#fff' }}>{currentStepData.placeholder}</option>
                      {countries.map(c => (
                        <option key={c} value={c} style={{ background: '#1a1a2e', color: '#fff' }}>{c}</option>
                      ))}
                    </select>
                    <i className="fa-solid fa-chevron-down" style={{
                      position: 'absolute',
                      right: 20,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.3)',
                      pointerEvents: 'none'
                    }}></i>
                  </div>
                ) : (
                  <input
                    ref={inputRef}
                    id={currentStepData.field}
                    type={currentStepData.type || 'text'}
                    value={formData[currentStepData.field]}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={currentStepData.placeholder}
                    style={{
                      ...inputStyle,
                      paddingLeft: 52,
                      borderColor: errors[currentStepData.field] ? 'rgba(255,59,48,0.5)' : 'rgba(255,255,255,0.15)'
                    }}
                  />
                )}
              </div>

              {currentStepData.hint && (
                <p style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: -16,
                  marginBottom: 20,
                  paddingLeft: 4,
                  fontFamily: "'Inter', sans-serif"
                }}>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }}></i>
                  {currentStepData.hint}
                </p>
              )}

              {errors[currentStepData.field] && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: '#ff6b6b',
                  marginTop: -16,
                  marginBottom: 16,
                  paddingLeft: 4,
                  fontFamily: "'Inter', sans-serif"
                }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{errors[currentStepData.field]}</span>
                </div>
              )}

              <button
                onClick={handleNext}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
                  color: '#fff',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 16,
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Continue
                <i className="fa-solid fa-arrow-right" style={{ fontSize: 14 }}></i>
              </button>
            </div>
          )}

          {/* Complete Step */}
          {step === steps.length - 1 && (
            <div style={{
              opacity: animationState === 'entering' ? 0 : 1,
              transform: animationState === 'entering' ? 'translateY(10px)' : 'translateY(0)',
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 20,
                padding: '24px',
                marginBottom: 24,
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                {[
                  { label: 'Name', value: `${formData.first_name} ${formData.last_name}`, icon: 'fa-user' },
                  { label: 'Email', value: formData.email, icon: 'fa-envelope' },
                  { label: 'Phone', value: formData.phone, icon: 'fa-phone' },
                  { label: 'Address', value: `${formData.address_line1}, ${formData.city}, ${formData.state} ${formData.postal_code}, ${formData.country}`, icon: 'fa-location-dot' }
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                  }}>
                    <i className={`fa-solid ${item.icon}`} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginTop: 2 }}></i>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 14, color: '#fff', fontFamily: "'Inter', sans-serif" }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 16,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 10px 40px rgba(99,102,241,0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 15px 50px rgba(99,102,241,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(99,102,241,0.3)';
                  }
                }}
              >
                {loading ? (
                  <span style={{
                    width: 22,
                    height: 22,
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                ) : (
                  <>
                    <i className="fa-solid fa-sparkles" style={{ fontSize: 16 }}></i>
                    Create Account
                  </>
                )}
              </button>

              <button
                onClick={() => setStep(prev => prev - 1)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: 12,
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >
                <i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }}></i>
                Go back and edit
              </button>
            </div>
          )}

          {/* Progress Bar */}
          <div style={{
            marginTop: 32,
            height: 3,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
              borderRadius: 2,
              width: `${progress}%`,
              transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>
          <div style={{
            textAlign: 'center',
            fontSize: 11,
            color: 'rgba(255,255,255,0.2)',
            marginTop: 8,
            fontFamily: "'Inter', sans-serif"
          }}>
            Step {step} of {steps.length - 1}
          </div>

          {/* Social Sign-In (Only on first step) */}
          {step === 0 && (
            <div style={{
              marginTop: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 4
              }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or continue with</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={() => handleSocialSignIn('google')} style={{
                  padding: '13px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity="0.7"/>
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity="0.5"/>
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity="0.3"/>
                  </svg>
                  Google
                </button>
                <button onClick={() => handleSocialSignIn('azure')} style={{
                  padding: '13px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                >
                  <i className="fa-brands fa-microsoft" style={{ fontSize: 18 }}></i>
                  Microsoft
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', margin: 0, fontFamily: "'Inter', sans-serif" }}>
              Already have an account?{' '}
              <Link href="/auth/signin" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'error' ? 'rgba(255,59,48,0.9)' : 'rgba(34,197,94,0.9)',
          backdropFilter: 'blur(20px)',
          color: '#fff',
          padding: '14px 24px',
          borderRadius: 50,
          fontSize: 14,
          fontWeight: 500,
          zIndex: 999,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: "'Inter', sans-serif",
          animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <i className={`fa-solid fa-${toast.type === 'error' ? 'circle-exclamation' : 'circle-check'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
