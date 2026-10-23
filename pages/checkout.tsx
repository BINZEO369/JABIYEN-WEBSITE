import { useEffect, useMemo, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCartState } from '../components/layout/CartDrawer';
import { useCurrency } from '../components/currency/CurrencyProvider';

const AUTH_SESSION_KEY = 'jayenware_session';
const CHECKOUT_DRAFT_KEY = 'jabiyen_checkout_draft_v1';
const ACCOUNT_REQUEST_TIMEOUT_MS = 12000;
const CENTRAL_AUTH_ACCOUNT_URL = 'https://auth-binzeo.vercel.app/account';

function readCentralAccessToken() {
  try {
    const session = JSON.parse(window.localStorage.getItem(AUTH_SESSION_KEY) || 'null');
    return typeof session?.access_token === 'string' && session.access_token ? session.access_token : null;
  } catch {
    return null;
  }
}

function profileName(profile, user) {
  const name = [profile?.first_name, profile?.last_name]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ')
    .trim();
  return name || profile?.display_name || profile?.full_name || user?.user_metadata?.full_name || '';
}

function addressFields(address, profile: { country_code?: string } = {}) {
  const streets = [address?.address_line_1, address?.address_line_2, address?.address_line_3]
    .filter((part) => typeof part === 'string' && part.trim())
    .map((part) => part.trim());
  const rawCountryCode = String(address?.country_code || profile?.country_code || 'BD').trim().toUpperCase();
  return {
    line1: streets[0] || '',
    line2: [...streets.slice(1), address?.area].filter((part) => typeof part === 'string' && part.trim()).join(', '),
    state: address?.state_province || address?.state || address?.district || '',
    district: address?.district || address?.state_province || address?.city || address?.area || '',
    city: address?.city || address?.area || address?.district || address?.state_province || '',
    postal_code: address?.postal_code || '',
    country_code: /^[A-Z]{2}$/.test(rawCountryCode) ? rawCountryCode : 'BD',
  };
}

function countryName(countryCode) {
  return ({ BD: 'Bangladesh', US: 'United States' })[countryCode] || countryCode || 'Unknown country';
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart: storedCart } = useCartState(); 
  const { formatMoney, selectedCurrency } = useCurrency();
  
  const [cart, setCart] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [primaryAddress, setPrimaryAddress] = useState(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryType, setDeliveryType] = useState('Standard');
  const [shippingQuote, setShippingQuote] = useState(null);
  const [shippingStatus, setShippingStatus] = useState('idle');
  const [shippingMessage, setShippingMessage] = useState('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);
    setCart(Array.isArray(storedCart) ? storedCart : []);
  }, [storedCart]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), ACCOUNT_REQUEST_TIMEOUT_MS);

    const loadCentralAccount = async () => {
      const token = readCentralAccessToken();
      if (!token) {
        if (active) {
          setAccountStatus('signed_out');
          setAccountLoading(false);
        }
        window.clearTimeout(timeout);
        return;
      }

      const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
      try {
        const profileResponse = await fetch('/api/me', {
          headers, cache: 'no-store', credentials: 'same-origin', signal: controller.signal,
        });
        const profileResult = await profileResponse.json().catch(() => null);
        
        if (profileResponse.status === 401) throw new Error('session_expired');
        if (!profileResponse.ok || profileResult?.success === false) throw new Error('profile_unavailable');

        const payload = profileResult?.data ?? profileResult ?? {};
        const user = payload.user || {};
        const sourceProfile = payload.profile || {};
        const loadedProfile = {
          name: profileName(sourceProfile, user),
          phone: user.phone || sourceProfile.phone || '',
          email: user.email || sourceProfile.email || '',
          country_code: sourceProfile.country_code || '',
        };
        if (active) {
          setProfile(loadedProfile);
          setAccountStatus('connected');
        }

        const addressResponse = await fetch('/api/me/addresses', {
          headers, cache: 'no-store', credentials: 'same-origin', signal: controller.signal,
        });
        const addressResult = await addressResponse.json().catch(() => null);
        if (!addressResponse.ok || addressResult?.success === false) throw new Error('address_unavailable');
        
        const rows = addressResult?.data?.addresses ?? addressResult?.addresses ?? [];
        const addresses = Array.isArray(rows) ? rows.filter((address) => address && typeof address === 'object') : [];
        const selected = addresses.find((address) => address.is_primary) || addresses[0] || null;
        if (active) {
          setPrimaryAddress(selected);
        }
      } catch (loadError) {
        if (active) {
          setAccountStatus(loadError?.message === 'session_expired' ? 'signed_out' : 'unavailable');
          if (loadError?.message === 'session_expired') setError('Your session expired. Please sign in again.');
        }
      } finally {
        window.clearTimeout(timeout);
        if (active) setAccountLoading(false);
      }
    };

    void loadCentralAccount();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0), [cart]);
  const address = useMemo(() => primaryAddress ? addressFields(primaryAddress, profile) : null, [primaryAddress, profile]);

  useEffect(() => {
    if (!address || subtotal <= 0) {
      setShippingQuote(null);
      setShippingStatus('idle');
      return undefined;
    }

    let active = true;
    const controller = new AbortController();
    const query = new URLSearchParams({
      country_code: address.country_code || 'BD',
      state: address.state || address.district || '',
      city: address.city || '',
      postal_code: address.postal_code || '',
      delivery_type: deliveryType,
      subtotal: String(subtotal),
    });
    setShippingStatus('loading');
    setShippingQuote(null);
    
    fetch(`/api/shipping/quote?${query.toString()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    }).then(async (response) => {
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.quote) {
        throw new Error(result?.error || 'Delivery is not available.');
      }
      if (active) {
        setShippingQuote(result.quote);
        setShippingStatus('ready');
      }
    }).catch((quoteError) => {
      if (!active || quoteError?.name === 'AbortError') return;
      setShippingQuote(null);
      setShippingStatus('unavailable');
      setShippingMessage(quoteError instanceof Error ? quoteError.message : 'Shipping temporarily unavailable.');
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [address, deliveryType, subtotal]);

  const handleQuantityChange = (index, delta) => {
    const newCart = [...cart];
    const newQty = Math.max(1, Number(newCart[index].quantity || 1) + delta);
    if (newQty === newCart[index].quantity) return;
    
    newCart[index].quantity = newQty;
    setCart(newCart);
  };

  const handleSelectDeliveryType = (option) => {
    setDeliveryType(option);
    setIsDropdownOpen(false);
  };

  const continueToPayment = async (event) => {
    event.preventDefault();
    setError('');
    
    if (!cart.length) return setError('Your bag is empty.');
    if (accountStatus === 'signed_out') return setError('Please sign in to continue.');
    if (!profile) return setError('Profile could not be verified.');
    if (!primaryAddress) return setError('No delivery address found. Please add one in Central Auth.');
    if (shippingStatus !== 'ready' || !shippingQuote) return setError('Delivery quote is still calculating.');

    setSubmitting(true);
    try {
      const checkoutDraft = {
        version: 1,
        created_at: Date.now(),
        customer: {
          name: profile.name,
          phone: profile.phone,
          email: profile.email,
          address,
          delivery_notes: deliveryNote.trim(),
        },
        delivery_type: deliveryType,
        shipping_quote: shippingQuote,
        items: cart.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: Number(item.quantity || 1),
        })),
        display_items: cart.map((item) => ({
          title: String(item.title || 'JABIYEN item').slice(0, 160),
          color_name: String(item.color_name || '').slice(0, 60),
          size_name: String(item.size_name || '').slice(0, 60),
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          img: item.img || null,
        })),
        website: '',
      };
      window.sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(checkoutDraft));
      await router.push('/payment');
    } catch {
      setError('Checkout could not continue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const initials = profile?.name ? profile.name.charAt(0).toUpperCase() : 'U';
  const fullAddressLine = address 
    ? [address.line1, address.line2, address.city, address.state, address.postal_code, countryName(address.country_code)].filter(Boolean).join(', ') 
    : '';

  return (
    <>
      <Head>
        <title>Checkout | JABIYEN</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="checkout-page">
        
        <div className="banner-wrapper">
          <img 
            src="https://raw.githubusercontent.com/BINZEO369/auth.binzeo/main/public/images/connected-accounts-checkout.jpg" 
            alt="Secure Checkout" 
            className="checkout-banner"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        <div className="checkout-shell">
          
          <h1 className="checkout-title animate-fade-up">Checkout</h1>

          {mounted && cart.length === 0 ? (
            <section className="empty-state animate-fade-up">
              <h2>Your shopping bag is empty</h2>
              <p>Discover our latest collection.</p>
              <Link href="/" className="btn-primary">Explore Collection</Link>
            </section>
          ) : (
            <form className="checkout-form" onSubmit={continueToPayment}>
              
              <section className="form-block animate-fade-up">
                <h2 className="section-heading">Your Bag</h2>
                <div className="summary-list">
                  {cart.map((item, index) => (
                    <div 
                      className="summary-item animate-fade-up" 
                      key={`${item.product_id}-${index}`}
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      <div className="item-img-wrap">
                        <img src={item.img || '/logo.png'} alt="" className="item-img" />
                      </div>
                      
                      <div className="item-details">
                        <h3>{item.title || 'JABIYEN Item'}</h3>
                        <p className="item-variant">{[item.color_name, item.size_name].filter(Boolean).join(' · ')}</p>
                        <div className="qty-controls">
                          <button type="button" onClick={() => handleQuantityChange(index, -1)} disabled={item.quantity <= 1}>−</button>
                          <span key={item.quantity} className="qty-value">{item.quantity || 1}</span>
                          <button type="button" onClick={() => handleQuantityChange(index, 1)}>+</button>
                        </div>
                      </div>

                      <span className="item-price" key={item.quantity}>
                        {formatMoney(Number(item.price || 0) * Number(item.quantity || 1))}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="form-block profile-block">
                <h2 className="section-heading">Account & Delivery</h2>
                
                {accountLoading ? (
                  <div className="skeleton-profile">
                    <div className="skeleton-avatar shimmer" />
                    <div className="skeleton-lines">
                      <div className="skeleton-line shimmer" style={{ width: '60%' }} />
                      <div className="skeleton-line shimmer" style={{ width: '80%' }} />
                    </div>
                  </div>
                ) : accountStatus === 'signed_out' ? (
                  <div className="minimal-box animate-fade-up">
                    <p>Please sign in to load your delivery details.</p>
                    <Link href="/auth/signin" className="btn-outline">Sign In</Link>
                  </div>
                ) : profile ? (
                  <div className="compact-profile animate-fade-up">
                    <div className="profile-top-row">
                      <div className="avatar">{initials}</div>
                      <div className="profile-text">
                        <strong className="profile-name">{profile.name}</strong>
                        <span className="profile-meta">
                          {[profile.email, profile.phone].filter(Boolean).join(' · ') || 'No contact info'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="profile-address">
                      <span className="address-label">Delivering to</span>
                      <span className="address-value">{fullAddressLine || 'No address saved in Central Auth'}</span>
                      {!address && (
                        <a href={CENTRAL_AUTH_ACCOUNT_URL} target="_blank" rel="noreferrer" className="address-link">
                          Add address in Central Auth →
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                   <p className="text-red animate-fade-up">Unable to load account information.</p>
                )}
              </section>

              {/* ✅ Delivery Method: dropdown-section ক্লাস যোগ, z-index elevated */}
              <section className="form-block dropdown-section animate-fade-up">
                <h2 className="section-heading">Delivery Method</h2>
                
                <div className="custom-select-wrapper" ref={dropdownRef}>
                  <div 
                    className={`custom-select-trigger ${isDropdownOpen ? 'open' : ''}`} 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span>{deliveryType} Delivery</span>
                    <svg 
                      className={`chevron ${isDropdownOpen ? 'open' : ''}`} 
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="custom-options animate-scale-in">
                      {['Standard', 'Express'].map((option) => (
                        <div
                          key={option}
                          className={`custom-option ${deliveryType === option ? 'selected' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectDeliveryType(option);
                          }}
                        >
                          {option} Delivery
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shipping-info" key={shippingStatus}>
                  {shippingStatus === 'loading' && <span className="text-muted">Calculating delivery...</span>}
                  {shippingStatus === 'ready' && shippingQuote && (
                    <span className="animate-fade-in">
                      {shippingQuote.delivery_fee == null
                        ? 'Fee informed upon delivery'
                        : `${formatMoney(shippingQuote.delivery_fee)} · ${shippingQuote.estimated_days_min}–${shippingQuote.estimated_days_max} days`}
                    </span>
                  )}
                  {shippingStatus === 'unavailable' && <span className="text-red animate-fade-in">{shippingMessage}</span>}
                </div>
              </section>

              <section className="form-block animate-fade-up">
                <h2 className="section-heading">Order Notes <span className="optional">(Optional)</span></h2>
                <textarea 
                  value={deliveryNote} 
                  onChange={(e) => setDeliveryNote(e.target.value.slice(0, 500))} 
                  maxLength={500} 
                  rows={3} 
                  placeholder="Add any special instructions for delivery..." 
                  className="luxury-textarea"
                />
              </section>

              <div className="final-totals animate-fade-up">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span key={`sub-${subtotal}`} className="animate-fade-in">{formatMoney(subtotal)}</span>
                </div>
                <div className="totals-row">
                  <span>Shipping</span>
                  <span key={`ship-${shippingStatus}-${shippingQuote?.delivery_fee}`} className="animate-fade-in">
                    {shippingStatus === 'ready' 
                      ? (shippingQuote.delivery_fee == null ? 'TBD' : formatMoney(shippingQuote.delivery_fee)) 
                      : '—'}
                  </span>
                </div>
                <div className="totals-row grand-total">
                  <span>Total</span>
                  <strong key={`total-${subtotal}-${shippingQuote?.delivery_fee}`} className="animate-fade-in">
                    {shippingQuote?.delivery_fee == null 
                      ? 'TBD' 
                      : formatMoney(subtotal + Number(shippingQuote.delivery_fee))}
                  </strong>
                </div>
              </div>

              {error && <div className="error-msg animate-shake">{error}</div>}

              <button 
                type="submit" 
                className="btn-primary full-width" 
                disabled={submitting || accountLoading || shippingStatus !== 'ready' || !address}
              >
                {submitting ? (
                  <span className="btn-loading"><span className="btn-spinner" /> Processing...</span>
                ) : (
                  `Pay ${shippingQuote?.delivery_fee != null ? formatMoney(subtotal + Number(shippingQuote.delivery_fee)) : ''}`
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #ffffff;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          color: #000;
        }
      `}</style>

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* ✅ উপরের দিকে খোলার জন্য scaleIn আপডেট */
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-fade-in { animation: fadeIn 0.4s ease both; }
        .animate-scale-in { 
          animation: scaleIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: bottom center; /* ✅ নিচ থেকে উপরে grow */
        }
        .animate-shake { animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }

        .checkout-page { min-height: 100vh; background: #ffffff; padding-top: 80px; }
        .banner-wrapper { width: 100%; height: 140px; overflow: hidden; background: #f5f5f5; }
        .checkout-banner { width: 100%; height: 100%; object-fit: cover; display: block; animation: fadeIn 1s ease both; }
        .checkout-shell { width: 100%; max-width: 600px; margin: 0 auto; padding: 0 20px 60px; }
        .checkout-title { font-size: 28px; font-weight: 300; margin: 32px 0 40px 0; letter-spacing: 2px; text-transform: uppercase; text-align: center; }
        .section-heading { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 20px 0; color: #000; }
        .section-heading .optional { color: #888; font-weight: 400; text-transform: none; letter-spacing: 0; }
        .form-block { margin-bottom: 32px; }

        /* ============================================
           ✅ CRITICAL FIX: Delivery Method section stacking
           ============================================ */
        .dropdown-section {
          position: relative;
          z-index: 20;
        }

        .custom-select-wrapper { 
          position: relative; 
          width: 100%; 
        }
        
        .custom-select-trigger { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 12px 0; 
          border-bottom: 1px solid #000; 
          cursor: pointer; 
          font-size: 14px; 
          color: #000; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
          transition: opacity 0.2s; 
          user-select: none; 
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .custom-select-trigger:hover { opacity: 0.7; }
        
        .chevron { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
        .chevron.open { transform: rotate(180deg); }

        /* ✅ উপরে খুলবে */
        .custom-options { 
          position: absolute; 
          bottom: calc(100% + 4px); 
          left: 0; 
          width: 100%; 
          background: #fff; 
          border: 1px solid #e5e5e5; 
          z-index: 50; 
          box-shadow: 0 -8px 20px rgba(0,0,0,0.06);
          display: flex; 
          flex-direction: column; 
        }
        
        .custom-option { 
          padding: 14px 16px; 
          cursor: pointer; 
          font-size: 13px; 
          color: #000; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
          transition: background 0.15s;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          background: #fff;
        }
        .custom-option:hover { background: #fafafa; }
        .custom-option:active { background: #f0f0f0; }
        .custom-option.selected { background: #f5f5f5; font-weight: 500; }

        .luxury-textarea { width: 100%; padding: 12px 0; border: none; border-bottom: 1px solid #000; border-radius: 0; font-size: 14px; color: #000; background: transparent; font-family: inherit; resize: vertical; min-height: 80px; outline: none; transition: border-color 0.2s; }
        .luxury-textarea::placeholder { color: #aaa; }
        .luxury-textarea:focus { border-bottom-color: #555; }

        .shipping-info { margin-top: 10px; font-size: 12px; color: #555; letter-spacing: 0.5px; min-height: 18px; }
        .text-muted { color: #888; font-size: 13px; }
        .text-red { color: #d93025; font-size: 13px; }

        .skeleton-profile { display: flex; align-items: center; gap: 12px; }
        .skeleton-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
        .skeleton-lines { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .skeleton-line { height: 12px; border-radius: 4px; }
        .shimmer { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite linear; }

        .profile-block { border-top: 1px solid #e5e5e5; padding-top: 32px; }
        .compact-profile { display: flex; flex-direction: column; gap: 14px; }
        .profile-top-row { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 500; flex-shrink: 0; transition: transform 0.2s; }
        .avatar:hover { transform: scale(1.05); }
        .profile-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .profile-name { font-size: 14px; font-weight: 600; color: #000; line-height: 1.3; }
        .profile-meta { font-size: 12px; color: #777; line-height: 1.4; overflow-wrap: anywhere; }
        .profile-address { display: flex; flex-direction: column; gap: 4px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
        .address-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; font-weight: 500; }
        .address-value { font-size: 12px; color: #333; line-height: 1.5; overflow-wrap: anywhere; }
        .address-link { font-size: 11px; color: #000; font-weight: 500; text-decoration: underline; text-underline-offset: 3px; margin-top: 2px; width: fit-content; transition: opacity 0.2s; }
        .address-link:hover { opacity: 0.6; }
        .minimal-box { padding: 20px; background: #fafafa; text-align: center; }
        .minimal-box p { margin: 0 0 12px; font-size: 13px; color: #555; }

        .summary-list { display: flex; flex-direction: column; gap: 20px; }
        .summary-item { display: flex; align-items: flex-start; gap: 16px; }
        .item-img-wrap { width: 50px; height: 65px; flex-shrink: 0; background: #f5f5f5; overflow: hidden; }
        .item-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
        .summary-item:hover .item-img { transform: scale(1.06); }
        .item-details { flex: 1; display: flex; flex-direction: column; }
        .item-details h3 { font-size: 12px; font-weight: 500; margin: 0 0 4px; color: #000; text-transform: uppercase; letter-spacing: 0.5px; }
        .item-variant { font-size: 11px; color: #777; margin: 0 0 12px; }
        .qty-controls { display: flex; align-items: center; gap: 12px; }
        .qty-controls button { background: none; border: none; padding: 0; font-size: 15px; color: #000; cursor: pointer; transition: opacity 0.2s, transform 0.15s; }
        .qty-controls button:hover:not(:disabled) { opacity: 0.4; }
        .qty-controls button:active:not(:disabled) { transform: scale(0.85); }
        .qty-controls button:disabled { color: #ccc; cursor: not-allowed; }
        .qty-controls span { font-size: 12px; font-weight: 500; min-width: 14px; text-align: center; display: inline-block; }
        .qty-value { animation: fadeIn 0.2s ease both; }
        .item-price { font-size: 12px; font-weight: 500; color: #000; display: inline-block; }

        .final-totals { margin: 32px 0; padding-top: 24px; border-top: 1px solid #e5e5e5; display: flex; flex-direction: column; gap: 12px; }
        .totals-row { display: flex; justify-content: space-between; font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .totals-row span:last-child { color: #000; }
        .grand-total { margin-top: 8px; font-size: 14px; font-weight: 500; color: #000; }
        .grand-total strong { font-size: 20px; font-weight: 500; display: inline-block; }

        .btn-primary { display: inline-flex; align-items: center; justify-content: center; height: 56px; padding: 0 32px; background: #000; color: #fff; border: none; border-radius: 0; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px; cursor: pointer; transition: background 0.3s, transform 0.15s, opacity 0.3s; }
        .btn-primary:hover:not(:disabled) { background: #333; transform: translateY(-1px); }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }
        .full-width { width: 100%; }
        .btn-loading { display: inline-flex; align-items: center; gap: 10px; }
        .btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }

        .btn-outline { display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 20px; background: transparent; color: #000; border: 1px solid #000; border-radius: 0; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; transition: all 0.2s; }
        .btn-outline:hover { background: #000; color: #fff; }

        .error-msg { color: #d93025; font-size: 12px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }

        .empty-state { text-align: center; padding: 80px 0; }
        .empty-state h2 { font-size: 18px; font-weight: 400; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1.5px; }
        .empty-state p { color: #777; margin: 0 0 32px; font-size: 13px; }

        @media (min-width: 768px) {
          .checkout-page { padding-top: 120px; }
          .checkout-shell { max-width: 800px; padding: 0 40px 80px; }
          .banner-wrapper { height: 320px; }
          .checkout-title { font-size: 42px; margin: 48px 0 56px 0; }
          .section-heading { font-size: 13px; margin-bottom: 28px; }
          .summary-item { gap: 24px; }
          .item-img-wrap { width: 80px; height: 100px; }
          .item-details h3 { font-size: 16px; }
          .item-variant { font-size: 14px; margin-bottom: 16px; }
          .qty-controls button { font-size: 20px; }
          .qty-controls span { font-size: 15px; }
          .item-price { font-size: 16px; }
          .skeleton-avatar { width: 56px; height: 56px; }
          .avatar { width: 56px; height: 56px; font-size: 22px; }
          .profile-name { font-size: 18px; }
          .profile-meta { font-size: 14px; }
          .address-label { font-size: 12px; }
          .address-value { font-size: 14px; }
          .custom-select-trigger { font-size: 16px; padding: 16px 0; }
          .custom-option { font-size: 15px; padding: 16px; }
          .luxury-textarea { font-size: 16px; padding: 16px 0; }
          .shipping-info { font-size: 14px; }
          .totals-row { font-size: 14px; margin-bottom: 8px; }
          .grand-total { font-size: 18px; margin-top: 16px; }
          .grand-total strong { font-size: 32px; }
          .btn-primary { height: 72px; font-size: 14px; letter-spacing: 3px; }
          .final-totals { padding-top: 32px; margin: 48px 0; gap: 16px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up, .animate-fade-in, .animate-scale-in, .animate-shake, .shimmer, .btn-spinner, .checkout-banner, .qty-value { animation: none !important; }
          .item-img, .avatar, .btn-primary, .custom-select-trigger, .chevron, .qty-controls button { transition: none !important; }
        }
      `}</style>
    </>
  );
}
