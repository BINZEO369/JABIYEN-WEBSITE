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
      setTimeout(() => window.location.href = '/signin', 1500);
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getBorderColor = (id) => {
    if (errors[id] && touched[id]) return '#ff3b30';
    if (touched[id] && formData[id] && !errors[id]) return '#34c759';
    return '#e5e5ea';
  };

  return (
    <>
      <Head>
        <title>Sign Up | JAYENWARE</title>
        <meta name="description" content="Create your JAYENWARE account" />
      </Head>

      <div style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/logo.png" alt="JAYENWARE" style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px' }} />
            <h1 style={{ fontFamily: "var(--font-heading), 'Manrope', sans-serif", fontSize: 24, fontWeight: 800, color: '#1d1d1f', margin: '0 0 4px' }}>Create Account</h1>
            <p style={{ fontSize: 14, color: '#86868b', margin: 0 }}>Join us and start your journey</p>
          </div>

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

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
            <span style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
            <span style={{ fontSize: 12, color: '#86868b', fontWeight: 500, textTransform: 'uppercase' }}>Already have an account?</span>
            <span style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/auth/signin" style={{ fontSize: 14, color: '#007aff', textDecoration: 'none', fontWeight: 600 }}>Sign in to your account</Link>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#ff3b30' : '#1d1d1f', color: '#fff', padding: '14px 24px', borderRadius: 50, fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className={`fa-solid fa-circle-${toast.type === 'error' ? 'exclamation' : 'check'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
