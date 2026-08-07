'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const inputStyle = {
  width: '100%', padding: '16px 20px',
  border: '2px solid #e5e5ea',
  borderRadius: 16, fontSize: 17, fontFamily: "'Inter', sans-serif",
  color: '#1d1d1f', background: '#f9f9fb', outline: 'none',
  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
  letterSpacing: '-0.01em'
};

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to JABIYEN',
    subtitle: "Let's create something beautiful together",
    icon: 'fa-solid fa-sparkles',
    description: "We're thrilled to have you here. Let's set up your account in just a few moments."
  },
  {
    id: 'first_name',
    field: 'first_name',
    label: "First, what's your name?",
    subtitle: 'Start with your first name',
    icon: 'fa-solid fa-user',
    placeholder: 'Your first name',
    type: 'text',
    required: true,
    errorMsg: 'Please tell us your first name'
  },
  {
    id: 'last_name',
    field: 'last_name',
    label: 'And your last name?',
    subtitle: 'So we know who you are',
    icon: 'fa-solid fa-user-group',
    placeholder: 'Your last name',
    type: 'text',
    required: true,
    errorMsg: 'Last name is required'
  },
  {
    id: 'email',
    field: 'email',
    label: 'Where can we reach you?',
    subtitle: "We'll keep your email safe and secure",
    icon: 'fa-solid fa-envelope',
    placeholder: 'you@example.com',
    type: 'email',
    required: true,
    errorMsg: 'Please enter a valid email address'
  },
  {
    id: 'phone',
    field: 'phone',
    label: 'Your phone number?',
    subtitle: 'For account security and updates',
    icon: 'fa-solid fa-mobile-screen',
    placeholder: '+8801XXXXXXXXX',
    type: 'tel',
    required: true,
    errorMsg: 'Valid phone number is required'
  },
  {
    id: 'address_intro',
    title: "Where are you based?",
    subtitle: "We'll use this for shipping and localization",
    icon: 'fa-solid fa-map-pin',
    description: "Let's add your address details"
  },
  {
    id: 'address_line1',
    field: 'address_line1',
    label: 'Your street address',
    subtitle: 'House number and street name',
    icon: 'fa-solid fa-house',
    placeholder: 'House 42, Road 15',
    type: 'text',
    required: true,
    errorMsg: 'Address is required'
  },
  {
    id: 'address_line2',
    field: 'address_line2',
    label: 'Any additional details?',
    subtitle: 'Apartment, landmark, or area (optional)',
    icon: 'fa-solid fa-location-dot',
    placeholder: 'Near Gulshan Park',
    type: 'text',
    required: false
  },
  {
    id: 'city',
    field: 'city',
    label: 'Which city?',
    subtitle: 'Your primary city',
    icon: 'fa-solid fa-city',
    placeholder: 'Dhaka',
    type: 'text',
    required: true,
    errorMsg: 'City is required'
  },
  {
    id: 'state',
    field: 'state',
    label: 'State or division?',
    subtitle: 'Your region',
    icon: 'fa-solid fa-map',
    placeholder: 'Dhaka Division',
    type: 'text',
    required: true,
    errorMsg: 'State is required'
  },
  {
    id: 'postal_code',
    field: 'postal_code',
    label: 'Postal code?',
    subtitle: 'For accurate delivery',
    icon: 'fa-solid fa-hashtag',
    placeholder: '1205',
    type: 'text',
    required: true,
    errorMsg: 'Postal code is required'
  },
  {
    id: 'country',
    field: 'country',
    label: 'And your country?',
    subtitle: 'Almost done!',
    icon: 'fa-solid fa-earth-americas',
    type: 'select',
    required: true,
    errorMsg: 'Please select your country'
  },
  {
    id: 'password_intro',
    title: 'Create a password',
    subtitle: 'Your key to the kingdom',
    icon: 'fa-solid fa-shield-halved',
    description: 'Choose a strong password to keep your account secure'
  },
  {
    id: 'password',
    field: 'password',
    label: 'Set your password',
    subtitle: 'At least 8 characters with a mix of letters and numbers',
    icon: 'fa-solid fa-lock',
    placeholder: '••••••••',
    type: 'password',
    required: true,
    minLength: 8,
    errorMsg: 'Password must be at least 8 characters'
  },
  {
    id: 'complete',
    title: "You're all set!",
    subtitle: 'Review and create your account',
    icon: 'fa-solid fa-rocket',
    description: 'Your JABIYEN ID is ready to be created'
  }
];

const countries = ['Bangladesh', 'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Other'];

export default function SignUp() {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', address_line1: '', address_line2: '',
    city: '', state: '', postal_code: '', country: ''
  });
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [direction, setDirection] = useState('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef(null);

  // Filter steps that are actual form fields (skip intro/complete steps)
  const fieldSteps = steps.filter(s => s.field);
  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [currentStep]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateField = (id, value) => {
    const step = steps.find(s => s.field === id);
    if (!step) return null;
    if (step.required && !value.trim()) return step.errorMsg;
    if (step.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return step.errorMsg;
    if (step.minLength && value.length < step.minLength) return step.errorMsg;
    if (id === 'phone' && value && !/^\+?[\d\s\-()]{7,20}$/.test(value)) return step.errorMsg;
    return null;
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setErrors(prev => ({ ...prev, [id]: null }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goToNextStep();
    }
  };

  const goToNextStep = () => {
    if (isAnimating) return;

    // If current step has a field, validate it
    if (currentStepData.field) {
      const error = validateField(currentStepData.field, formData[currentStepData.field]);
      if (error) {
        setErrors(prev => ({ ...prev, [currentStepData.field]: error }));
        showToast(error, 'error');
        // Shake animation
        if (inputRef.current) {
          inputRef.current.style.animation = 'none';
          inputRef.current.offsetHeight;
          inputRef.current.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97)';
        }
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setDirection('forward');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const goToPrevStep = () => {
    if (isAnimating || currentStep === 0) return;
    setDirection('backward');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setIsAnimating(false);
    }, 150);
  };

  const handleSubmit = async () => {
    // Validate all required fields
    let hasError = false;
    const newErrors = {};
    fieldSteps.forEach(step => {
      const err = validateField(step.field, formData[step.field]);
      if (err) { newErrors[step.field] = err; hasError = true; }
    });
    setErrors(newErrors);

    if (hasError) {
      showToast('Please fill in all required fields correctly', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || 'Signup failed');
      showToast('Account created successfully! Redirecting...', 'success');
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

  const progressPercentage = Math.round((currentStep / (steps.length - 1)) * 100);

  const renderFieldInput = () => {
    if (!currentStepData.field) return null;

    if (currentStepData.field === 'country') {
      return (
        <div style={{ position: 'relative' }}>
          <select
            id="country"
            value={formData.country}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            style={{
              ...inputStyle,
              paddingRight: 48,
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              borderColor: errors.country ? '#ff3b30' : '#e5e5ea',
              background: errors.country ? '#fff5f5' : '#f9f9fb'
            }}
          >
            <option value="">Select your country</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <i className="fa-solid fa-chevron-down" style={{
            position: 'absolute', right: 18, top: '50%',
            transform: 'translateY(-50%)', color: '#86868b',
            pointerEvents: 'none', fontSize: 15
          }}></i>
        </div>
      );
    }

    return (
      <input
        id={currentStepData.field}
        type={currentStepData.type || 'text'}
        value={formData[currentStepData.field] || ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        placeholder={currentStepData.placeholder}
        autoComplete="off"
        style={{
          ...inputStyle,
          borderColor: errors[currentStepData.field] ? '#ff3b30' : '#e5e5ea',
          background: errors[currentStepData.field] ? '#fff5f5' : '#f9f9fb',
          fontSize: currentStepData.type === 'password' ? 22 : 17,
          letterSpacing: currentStepData.type === 'password' ? '0.15em' : '-0.01em'
        }}
      />
    );
  };

  // Intro/outro steps render
  if (!currentStepData.field) {
    // Welcome or complete or intro steps
  }

  return (
    <>
      <Head>
        <title>Sign Up | JAYENWARE</title>
        <meta name="description" content="Create your JAYENWARE account" />
      </Head>

      <div style={{
        minHeight: 'calc(100vh - 180px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        background: 'linear-gradient(180deg, #f9f9fb 0%, #ffffff 100%)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: 520,
          background: '#fff',
          borderRadius: 28,
          padding: '48px 40px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 12px 48px rgba(0,0,0,0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}>

          {/* Background glow */}
          <div style={{
            position: 'absolute',
            top: -100, left: '50%',
            transform: 'translateX(-50%)',
            width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(0,122,255,0.06) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Progress Bar */}
          {showEmailForm && (
            <div style={{ marginBottom: 40, position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10
              }}>
                <button
                  onClick={goToPrevStep}
                  disabled={currentStep === 0 || isAnimating}
                  style={{
                    background: 'none', border: 'none',
                    cursor: currentStep === 0 ? 'default' : 'pointer',
                    color: currentStep === 0 ? '#d1d1d6' : '#007aff',
                    fontSize: 14, fontWeight: 500,
                    padding: '8px 12px', borderRadius: 8,
                    transition: 'all 0.2s ease',
                    fontFamily: "'Inter', sans-serif",
                    opacity: currentStep === 0 ? 0.5 : 1
                  }}
                >
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }}></i>
                  Back
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#86868b', letterSpacing: '0.02em' }}>
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <div style={{
                width: '100%', height: 4,
                background: '#f0f0f5',
                borderRadius: 10,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progressPercentage}%`,
                  height: '100%',
                  background: 'linear-gradient(135deg, #007aff, #5856d6)',
                  borderRadius: 10,
                  transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
              </div>
            </div>
          )}

          {/* Logo */}
          <div style={{
            textAlign: 'center',
            marginBottom: showEmailForm ? 0 : 36,
            position: 'relative',
            zIndex: 1,
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <img
              src="/logo.png"
              alt="JAYENWARE"
              style={{
                width: showEmailForm ? 40 : 56,
                height: showEmailForm ? 40 : 56,
                borderRadius: 14,
                margin: '0 auto 14px',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
            {!showEmailForm && (
              <>
                <h1 style={{
                  fontFamily: "var(--font-heading), 'Manrope', sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#1d1d1f',
                  margin: '0 0 6px',
                  letterSpacing: '-0.03em'
                }}>
                  Create your JABIYEN ID
                </h1>
                <p style={{ fontSize: 15, color: '#86868b', margin: 0, lineHeight: 1.5 }}>
                  One account for everything JABIYEN
                </p>
              </>
            )}
          </div>

          {/* Social Sign-In Buttons */}
          {!showEmailForm && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24,
              position: 'relative', zIndex: 1
            }}>
              {/* Google */}
              <SocialButton
                onClick={() => handleSocialSignIn('google')}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                }
                label="Continue with Google"
              />

              {/* Microsoft */}
              <SocialButton
                onClick={() => handleSocialSignIn('azure')}
                icon={
                  <svg width="20" height="20" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                }
                label="Continue with Microsoft"
              />

              {/* Email Button */}
              <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                style={{
                  width: '100%', padding: '14px 20px',
                  background: showEmailForm ? '#1d1d1f' : '#fff',
                  color: showEmailForm ? '#fff' : '#1d1d1f',
                  border: showEmailForm ? '2px solid #1d1d1f' : '2px solid #e0e0e0',
                  borderRadius: 16,
                  fontSize: 16, fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={(e) => {
                  if (!showEmailForm) {
                    e.target.style.borderColor = '#1d1d1f';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showEmailForm) {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                  }
                }}
              >
                <i className="fa-regular fa-envelope" style={{ fontSize: 18 }}></i>
                <span>{showEmailForm ? 'Hide Sign Up Form' : 'Continue with Email'}</span>
              </button>
            </div>
          )}

          {/* Cinematic Step-by-Step Form */}
          {showEmailForm && (
            <div style={{ position: 'relative', zIndex: 1, minHeight: 320 }}>
              <div
                key={currentStep}
                style={{
                  animation: direction === 'forward'
                    ? 'slideInRight 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
                    : 'slideInLeft 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: isAnimating ? 0 : 1
                }}
              >
                {/* Step Icon */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 20
                }}>
                  <div style={{
                    width: 72, height: 72,
                    borderRadius: 24,
                    background: 'linear-gradient(135deg, #007aff15, #5856d615)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    color: '#007aff',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}>
                    <i className={currentStepData.icon}></i>
                  </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <h2 style={{
                    fontFamily: "var(--font-heading), 'Manrope', sans-serif",
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#1d1d1f',
                    margin: '0 0 6px',
                    letterSpacing: '-0.02em'
                  }}>
                    {currentStepData.title || currentStepData.label}
                  </h2>
                  {currentStepData.subtitle && (
                    <p style={{
                      fontSize: 15,
                      color: '#86868b',
                      margin: 0,
                      lineHeight: 1.5
                    }}>
                      {currentStepData.subtitle}
                    </p>
                  )}
                </div>

                {/* Description for intro/outro steps */}
                {currentStepData.description && !currentStepData.field && (
                  <p style={{
                    textAlign: 'center',
                    fontSize: 15,
                    color: '#515154',
                    lineHeight: 1.6,
                    margin: '16px 0 24px'
                  }}>
                    {currentStepData.description}
                  </p>
                )}

                {/* Input Field */}
                {currentStepData.field && (
                  <div style={{ marginTop: 28, marginBottom: 24 }}>
                    <div style={{
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      {currentStepData.required && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#ff3b30',
                          background: '#ff3b3010',
                          padding: '3px 8px',
                          borderRadius: 20,
                          letterSpacing: '0.02em'
                        }}>
                          REQUIRED
                        </span>
                      )}
                      {!currentStepData.required && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: '#86868b',
                          background: '#f5f5f7',
                          padding: '3px 8px',
                          borderRadius: 20,
                          letterSpacing: '0.02em'
                        }}>
                          OPTIONAL
                        </span>
                      )}
                    </div>
                    {renderFieldInput()}
                    {errors[currentStepData.field] && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 13, color: '#ff3b30', marginTop: 8,
                        fontWeight: 500
                      }}>
                        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 12 }}></i>
                        <span>{errors[currentStepData.field]}</span>
                      </div>
                    )}

                    {/* Password strength indicator */}
                    {currentStepData.field === 'password' && formData.password && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                          {[1, 2, 3, 4].map(i => {
                            let strength = 0;
                            const pwd = formData.password;
                            if (pwd.length >= 8) strength++;
                            if (/[A-Z]/.test(pwd)) strength++;
                            if (/[0-9]/.test(pwd)) strength++;
                            if (/[^A-Za-z0-9]/.test(pwd)) strength++;
                            const active = i <= strength;
                            return (
                              <div key={i} style={{
                                flex: 1, height: 4,
                                borderRadius: 10,
                                background: active
                                  ? strength <= 2 ? '#ff9500' : strength === 3 ? '#ffcc00' : '#34c759'
                                  : '#e5e5ea',
                                transition: 'all 0.3s ease'
                              }} />
                            );
                          })}
                        </div>
                        <p style={{ fontSize: 12, color: '#86868b', margin: 0 }}>
                          <i className="fa-solid fa-lightbulb" style={{ marginRight: 4 }}></i>
                          Mix uppercase, numbers, and symbols for a stronger password
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: currentStepData.field ? 8 : 24
                }}>
                  {currentStep > 0 && (
                    <button
                      onClick={goToPrevStep}
                      disabled={isAnimating}
                      style={{
                        flex: 1,
                        padding: '14px 24px',
                        background: '#f5f5f7',
                        color: '#1d1d1f',
                        border: '2px solid transparent',
                        borderRadius: 16,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }}></i>
                      Back
                    </button>
                  )}
                  {currentStep < steps.length - 1 ? (
                    <button
                      onClick={goToNextStep}
                      disabled={isAnimating}
                      style={{
                        flex: 2,
                        padding: '14px 24px',
                        background: '#007aff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 16,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'all 0.25s ease',
                        boxShadow: '0 4px 16px rgba(0,122,255,0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(0,122,255,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 16px rgba(0,122,255,0.3)';
                      }}
                    >
                      {currentStep === 0 ? "Let's go" : 'Continue'}
                      <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }}></i>
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      style={{
                        flex: 2,
                        padding: '14px 24px',
                        background: loading ? '#a1a1a6' : 'linear-gradient(135deg, #007aff, #5856d6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 16,
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'all 0.25s ease',
                        boxShadow: '0 4px 20px rgba(88,86,214,0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 8px 28px rgba(88,86,214,0.45)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 20px rgba(88,86,214,0.35)';
                        }
                      }}
                    >
                      {loading ? (
                        <>
                          <span style={{
                            width: 20, height: 20,
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#fff',
                            borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite'
                          }} />
                          Creating...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-rocket"></i>
                          Create Account
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Skip button for optional fields */}
                {!currentStepData.required && currentStepData.field && currentStep < steps.length - 1 && (
                  <button
                    onClick={goToNextStep}
                    style={{
                      width: '100%', marginTop: 12,
                      background: 'none', border: 'none',
                      color: '#86868b', fontSize: 14,
                      cursor: 'pointer', padding: '8px',
                      fontFamily: "'Inter', sans-serif",
                      textDecoration: 'underline',
                      textUnderlineOffset: 3
                    }}
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: showEmailForm ? 32 : 24,
            position: 'relative',
            zIndex: 1
          }}>
            <p style={{ fontSize: 14, color: '#86868b', margin: 0 }}>
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                style={{
                  color: '#007aff',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Decorative subtle pattern */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #007aff, #5856d6, #af52de, #ff2d55, #ff9500, #ffcc00, #34c759)',
            opacity: 0.15
          }} />
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#ff3b30' : '#1d1d1f',
          color: '#fff',
          padding: '14px 24px',
          borderRadius: 50,
          fontSize: 14,
          fontWeight: 500,
          zIndex: 999,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'toastSlideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <i className={`fa-solid fa-circle-${toast.type === 'error' ? 'exclamation' : 'check'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        @keyframes toastSlideDown {
          from { opacity:
