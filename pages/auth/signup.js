'use client';

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const inputStyle = {
  width: '100%', padding: '12px 16px',
  border: '1.5px solid #e5e5ea',
  borderRadius: 12, fontSize: 15, fontFamily: "'Inter', sans-serif",
  color: '#1d1d1f', background: '#fff', outline: 'none',
  transition: 'all 0.25s ease'
};

export default function SignUp() {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', address_line1: '', address_line2: '',
    city: '', state: '', postal_code: '', country: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [toast, setToast] = useState(null);

  const fields = [
    { id: 'first_name', label: 'First Name', required: true, errorMsg: 'First name is required' },
    { id: 'last_name', label: 'Last Name', required: true, errorMsg: 'Last name is required' },
    { id: 'email', label: 'Email Address', required: true, type: 'email', errorMsg: 'Valid email is required' },
    { id: 'phone', label: 'Phone Number', required: true, errorMsg: 'Valid phone number is required' },
    { id: 'password', label: 'Password', required: true, minLength: 8, errorMsg: 'Password must be at least 8 characters' },
    { id: 'address_line1', label: 'Address Line 1', required: true, errorMsg: 'Address is required' },
    { id: 'city', label: 'City', required: true, errorMsg: 'City is required' },
    { id: 'state', label: 'State / Division', required: true, errorMsg: 'State is required' },
    { id: 'postal_code', label: 'Postal Code', required: true, errorMsg: 'Postal code is required' },
    { id: 'country', label: 'Country', required: true, errorMsg: 'Please select a country' }
  ];

  const countries = ['Bangladesh', 'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Other'];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateField = (id, value) => {
    const field = fields.find(f => f.id === id);
    if (!field) return null;
    if (field.required && !value.trim()) return field.errorMsg;
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return field.errorMsg;
    if (field.minLength && value.length < field.minLength) return field.errorMsg;
    if (id === 'phone' && value && !/^\+?[\d\s\-()]{7,20}$/.test(value)) return field.errorMsg;
    return null;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (touched[id]) {
      setErrors(prev => ({ ...prev, [id]: validateField(id, value) }));
    }
  };

  const handleBlur = (e) => {
    const { id, value } = e.target;
    setTouched(prev => ({ ...prev, [id]: true }));
    setErrors(prev => ({ ...prev, [id]: validateField(id, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = {};
    fields.forEach(f => allTouched[f.id] = true);
    setTouched(allTouched);

    let hasError = false;
    const newErrors = {};
    fields.forEach(f => {
      const err = validateField(f.id, formData[f.id]);
      if (err) { newErrors[f.id] = err; hasError = true; }
    });
    setErrors(newErrors);

    if (hasError) { showToast('Please fill in all required fields correctly', 'error'); return; }

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
      setTimeout(() => window.location.href = '/auth/signin', 1500);
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

  const getBorderColor = (id) => {
    if (errors[id] && touched[id]) return '#ff3b30';
    if (touched[id] && formData[id] && !errors[id]) return '#34c759';
    return '#e5e5ea';
  };

  return (
    <>
      <Head>
        <title>Sign Up | JABIYEN</title>
        <meta name="description" content="Create your JAYENWARE account" />
      </Head>

      <div style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}>
          
          {/* Logo + Title */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <img src="/logo.png" alt="JAYENWARE" style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px' }} />
            <h1 style={{ fontFamily: "var(--font-heading), 'Manrope', sans-serif", fontSize: 26, fontWeight: 800, color: '#1d1d1f', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Create Your JABIYEN Account</h1>
            <p style={{ fontSize: 14, color: '#86868b', margin: 0, lineHeight: 1.5 }}>One account for everything JABIYEN</p>
          </div>

          {/* Social Sign-In Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {/* Google */}
            <button onClick={() => handleSocialSignIn('google')} style={{
              width: '100%', padding: '13px 20px',
              background: '#fff', color: '#1d1d1f',
              border: '1.5px solid #e0e0e0', borderRadius: 14,
              fontSize: 15, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Microsoft */}
            <button onClick={() => handleSocialSignIn('azure')} style={{
              width: '100%', padding: '13px 20px',
              background: '#fff', color: '#1d1d1f',
              border: '1.5px solid #e0e0e0', borderRadius: 14,
              fontSize: 15, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}>
              <svg width="20" height="20" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              <span>Continue with Microsoft</span>
            </button>

            {/* Continue with Email Button */}
            <button onClick={() => setShowEmailForm(!showEmailForm)} style={{
              width: '100%', padding: '13px 20px',
              background: showEmailForm ? '#1d1d1f' : '#fff',
              color: showEmailForm ? '#fff' : '#1d1d1f',
              border: showEmailForm ? '1.5px solid #1d1d1f' : '1.5px solid #e0e0e0',
              borderRadius: 14,
              fontSize: 15, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.25s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}>
              <i className="fa-regular fa-envelope" style={{ fontSize: 18 }}></i>
              <span>{showEmailForm ? 'Hide Sign Up Form' : 'Continue with Email'}</span>
            </button>
          </div>

          {/* Email Form - Toggle */}
          {showEmailForm && (
            <div style={{
              animation: 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              borderTop: '1px solid #e5e5ea',
              paddingTop: 24
            }}>
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <FormField id="first_name" label="First Name" required value={formData.first_name} error={errors.first_name} touched={touched.first_name} onChange={handleChange} onBlur={handleBlur} placeholder="John" borderColor={getBorderColor('first_name')} />
                  <FormField id="last_name" label="Last Name" required value={formData.last_name} error={errors.last_name} touched={touched.last_name} onChange={handleChange} onBlur={handleBlur} placeholder="Doe" borderColor={getBorderColor('last_name')} />
                </div>
                <FormField id="email" label="Email Address" required type="email" value={formData.email} error={errors.email} touched={touched.email} onChange={handleChange} onBlur={handleBlur} placeholder="you@example.com" borderColor={getBorderColor('email')} />
                <FormField id="phone" label="Phone Number" required type="tel" value={formData.phone} error={errors.phone} touched={touched.phone} onChange={handleChange} onBlur={handleBlur} placeholder="+8801XXXXXXXXX" borderColor={getBorderColor('phone')} />
                <FormField id="password" label="Password" required type="password" value={formData.password} error={errors.password} touched={touched.password} onChange={handleChange} onBlur={handleBlur} placeholder="Minimum 8 characters" borderColor={getBorderColor('password')} />
                <FormField id="address_line1" label="Address Line 1" required value={formData.address_line1} error={errors.address_line1} touched={touched.address_line1} onChange={handleChange} onBlur={handleBlur} placeholder="House/Flat, Street" borderColor={getBorderColor('address_line1')} />
                
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>Address Line 2 <span style={{ color: '#86868b', fontWeight: 400 }}>(optional)</span></label>
                  <input id="address_line2" type="text" value={formData.address_line2} onChange={handleChange} placeholder="Landmark, Area" style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <FormField id="city" label="City" required value={formData.city} error={errors.city} touched={touched.city} onChange={handleChange} onBlur={handleBlur} placeholder="Dhaka" borderColor={getBorderColor('city')} />
                  <FormField id="state" label="State / Division" required value={formData.state} error={errors.state} touched={touched.state} onChange={handleChange} onBlur={handleBlur} placeholder="Dhaka Division" borderColor={getBorderColor('state')} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <FormField id="postal_code" label="Postal Code" required value={formData.postal_code} error={errors.postal_code} touched={touched.postal_code} onChange={handleChange} onBlur={handleBlur} placeholder="1205" borderColor={getBorderColor('postal_code')} />
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>Country <span style={{ color: '#ff3b30' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <select id="country" value={formData.country} onChange={handleChange} onBlur={handleBlur} style={{ ...inputStyle, paddingRight: 40, cursor: 'pointer', borderColor: getBorderColor('country') }}>
                        <option value="">Select country</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none', fontSize: 14 }}></i>
                    </div>
                    {errors.country && touched.country && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ff3b30', marginTop: 4 }}><i className="fa-solid fa-circle-exclamation" style={{ fontSize: 11 }}></i><span>{errors.country}</span></div>}
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px 24px', background: loading ? '#a1a1a6' : '#1d1d1f', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                  {loading ? <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : 'Create Account'}
                </button>
              </form>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ fontSize: 14, color: '#86868b', margin: 0 }}>
              Already have an account? <Link href="/auth/signin" style={{ color: '#007aff', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#ff3b30' : '#1d1d1f', color: '#fff', padding: '14px 24px', borderRadius: 50, fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className={`fa-solid fa-circle-${toast.type === 'error' ? 'exclamation' : 'check'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

function FormField({ id, label, required, type = 'text', value, error, touched, onChange, onBlur, placeholder, borderColor }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }} htmlFor={id}>
        {label} {required && <span style={{ color: '#ff3b30', marginLeft: 2 }}>*</span>}
      </label>
      <input id={id} type={type} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} style={{ ...inputStyle, borderColor }} />
      {error && touched && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ff3b30', marginTop: 4 }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 11 }}></i>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

