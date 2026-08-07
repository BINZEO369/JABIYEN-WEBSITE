'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function SignUp() {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', address_line1: '', address_line2: '',
    city: '', state: '', postal_code: '', country: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
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

  const countries = [
    'Bangladesh', 'India', 'United States', 'United Kingdom',
    'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Other'
  ];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateField = (id, value) => {
    const field = fields.find(f => f.id === id);
    if (!field) return true;

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
      const err = validateField(id, value);
      setErrors(prev => ({ ...prev, [id]: err }));
    }
  };

  const handleBlur = (e) => {
    const { id, value } = e.target;
    setTouched(prev => ({ ...prev, [id]: true }));
    const err = validateField(id, value);
    setErrors(prev => ({ ...prev, [id]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Touch all fields
    const allTouched = {};
    fields.forEach(f => allTouched[f.id] = true);
    setTouched(allTouched);

    // Validate all
    let hasError = false;
    const newErrors = {};
    fields.forEach(f => {
      const err = validateField(f.id, formData[f.id]);
      if (err) {
        newErrors[f.id] = err;
        hasError = true;
      }
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
      setTimeout(() => window.location.href = '/signin', 1500);
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up | JAYENWARE</title>
        <meta name="description" content="Create your JAYENWARE account" />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <div style={{
        minHeight: 'calc(100vh - 180px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 16px', background: '#fff'
      }}>
        <div style={{
          width: '100%', maxWidth: 520, background: '#fff',
          borderRadius: 24, padding: '40px 36px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
          animation: 'cardSlideUp 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) forwards'
        }}>
          {/* Branding */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/logo.png" alt="JAYENWARE" style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px' }} />
            <h1 style={{ fontFamily: "var(--font-heading), 'Manrope', sans-serif", fontSize: 24, fontWeight: 800, color: '#1d1d1f', margin: '0 0 4px' }}>Create Account</h1>
            <p style={{ fontSize: 14, color: '#86868b', margin: 0 }}>Join us and start your journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* First Name + Last Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField id="first_name" label="First Name" required value={formData.first_name} error={errors.first_name} touched={touched.first_name} onChange={handleChange} onBlur={handleBlur} placeholder="John" />
              <FormField id="last_name" label="Last Name" required value={formData.last_name} error={errors.last_name} touched={touched.last_name} onChange={handleChange} onBlur={handleBlur} placeholder="Doe" />
            </div>

            {/* Email */}
            <FormField id="email" label="Email Address" required type="email" value={formData.email} error={errors.email} touched={touched.email} onChange={handleChange} onBlur={handleBlur} placeholder="you@example.com" />

            {/* Phone */}
            <FormField id="phone" label="Phone Number" required type="tel" value={formData.phone} error={errors.phone} touched={touched.phone} onChange={handleChange} onBlur={handleBlur} placeholder="+8801XXXXXXXXX" />

            {/* Password */}
            <FormField id="password" label="Password" required type="password" value={formData.password} error={errors.password} touched={touched.password} onChange={handleChange} onBlur={handleBlur} placeholder="Minimum 8 characters" />

            {/* Address Line 1 */}
            <FormField id="address_line1" label="Address Line 1" required value={formData.address_line1} error={errors.address_line1} touched={touched.address_line1} onChange={handleChange} onBlur={handleBlur} placeholder="House/Flat, Street" />

            {/* Address Line 2 */}
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }} htmlFor="address_line2">
                Address Line 2 <span style={{ color: '#86868b', fontWeight: 400 }}>(optional)</span>
              </label>
              <input id="address_line2" type="text" value={formData.address_line2} onChange={handleChange} placeholder="Landmark, Area" style={inputStyle} />
            </div>

            {/* City + State */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField id="city" label="City" required value={formData.city} error={errors.city} touched={touched.city} onChange={handleChange} onBlur={handleBlur} placeholder="Dhaka" />
              <FormField id="state" label="State / Division" required value={formData.state} error={errors.state} touched={touched.state} onChange={handleChange} onBlur={handleBlur} placeholder="Dhaka Division" />
            </div>

            {/* Postal Code + Country */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField id="postal_code" label="Postal Code" required value={formData.postal_code} error={errors.postal_code} touched={touched.postal_code} onChange={handleChange} onBlur={handleBlur} placeholder="1205" />
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }} htmlFor="country">
                  Country <span style={{ color: '#ff3b30', marginLeft: 2 }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select id="country" value={formData.country} onChange={handleChange} onBlur={handleBlur} style={{ ...inputStyle, paddingRight: 40, cursor: 'pointer', borderColor: errors.country && touched.country ? '#ff3b30' : touched.country && formData.country ? '#34c759' : '#e5e5ea' }}>
                    <option value="">Select country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none', fontSize: 14 }}></i>
                </div>
                {errors.country && touched.country && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ff3b30', marginTop: 4 }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 11 }}></i>
                    <span>{errors.country}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px 24px', background: loading ? '#a1a1a6' : '#1d1d1f',
              color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600,
              border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 8, transition: 'all 0.35s ease'
            }}>
              {loading ? (
                <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              ) : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
            <span style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
            <span style={{ fontSize: 12, color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Already have an account?</span>
            <span style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
          </div>

          {/* Footer Link */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <p style={{ fontSize: 14, color: '#86868b', margin: 0 }}>
              <Link href="/auth/signin" style={{ color: '#007aff', textDecoration: 'none', fontWeight: 600 }}>Sign in to your account</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#ff3b30' : '#1d1d1f',
          color: '#fff', padding: '14px 24px', borderRadius: 50,
          fontSize: 14, fontWeight: 500, zIndex: 999,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <i className={`fa-solid fa-circle-${toast.type === 'error' ? 'exclamation' : 'check'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 480px) {
          .form-group { margin-bottom: 18px; }
        }
      `}</style>
    </>
  );
}

// Reusable Form Field Component
function FormField({ id, label, required, type = 'text', value, error, touched, onChange, onBlur, placeholder }) {
  const inputStyle = {
    width: '100%', padding: '12px 16px',
    border: `1.5px solid ${error && touched ? '#ff3b30' : touched && value && !error ? '#34c759' : '#e5e5ea'}`,
    borderRadius: 12, fontSize: 15, fontFamily: "'Inter', sans-serif",
    color: '#1d1d1f', background: '#fff', outline: 'none',
    transition: 'all 0.25s ease',
    WebkitAppearance: type === 'password' ? 'none' : 'auto'
  };

  return (
    <div className="form-group" style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }} htmlFor={id}>
        {label} {required && <span style={{ color: '#ff3b30', marginLeft: 2 }}>*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        style={inputStyle}
        autoComplete={id === 'password' ? 'new-password' : id}
      />
      {error && touched && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ff3b30', marginTop: 4 }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 11 }}></i>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
