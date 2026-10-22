import { useEffect, useMemo, useState } from 'react';
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

function addressFields(address, profile = {}) {
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

  return (
    <>
      <Head>
        <title>Checkout | JABIYEN</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="checkout-page">
        <div className="checkout-shell">
          
          {/* 1. Return Button (Above Image, with gap from header) */}
          <div className="top-actions">
            <Link href="/" className="back-btn">← Return to Store</Link>
          </div>

          {/* 2. Banner Image */}
          <div className="banner-wrapper">
            <img 
              src="https://raw.githubusercontent.com/BINZEO369/auth.binzeo/main/public/images/connected-accounts-checkout.jpg" 
              alt="Secure Checkout" 
              className="checkout-banner"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* 3. Checkout Text (Centered below image) */}
          <h1 className="checkout-title">Checkout</h1>

          {mounted && cart.length === 0 ? (
            <section className="empty-state">
              <h2>Your shopping bag is empty</h2>
              <p>Discover our latest collection.</p>
              <Link href="/" className="btn-primary">Explore Collection</Link>
            </section>
          ) : (
            <form className="checkout-form" onSubmit={continueToPayment}>
              
              {/* 4. Product Details (Left aligned below Checkout) */}
              <section className="form-block">
                <h2 className="section-heading">Your Bag</h2>
                <div className="summary-list">
                  {cart.map((item, index) => (
                    <div className="summary-item" key={`${item.product_id}-${index}`}>
                      <div className="item-img-wrap">
                        <img src={item.img || '/logo.png'} alt="" className="item-img" />
                      </div>
                      
                      <div className="item-details">
                        <h3>{item.title || 'JABIYEN Item'}</h3>
                        <p className="item-variant">{[item.color_name, item.size_name].filter(Boolean).join(' · ')}</p>
                        <div className="qty-controls">
                          <button type="button" onClick={() => handleQuantityChange(index, -1)} disabled={item.quantity <= 1}>−</button>
                          <span>{item.quantity || 1}</span>
                          <button type="button" onClick={() => handleQuantityChange(index, 1)}>+</button>
                        </div>
                      </div>

                      <span className="item-price">{formatMoney(Number(item.price || 0) * Number(item.quantity || 1))}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5. Account & Delivery (Profile Left, Name/Email Right) */}
              <section className="form-block profile-block">
                <h2 className="section-heading">Account & Delivery</h2>
                
                {accountLoading ? (
                  <p className="text-muted">Verifying secure session...</p>
                ) : accountStatus === 'signed_out' ? (
                  <div className="minimal-box">
                    <p>Please sign in through BINZEO Central Auth to load your delivery details.</p>
                    <Link href="/auth/signin" className="btn-outline">Sign In Securely</Link>
                  </div>
                ) : profile ? (
                  <div className="profile-summary">
                    <div className="profile-header">
                      <div className="avatar">{initials}</div>
                      <div className="profile-info">
                        <span className="profile-name">{profile.name}</span>
                        <span className="profile-email">{profile.email || 'No email provided'}</span>
                      </div>
                    </div>

                    <div className="profile-details-bottom">
                      <div className="info-row">
                        <span className="label">Phone</span>
                        <span className="value">{profile.phone || '—'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Address</span>
                        <span className="value">
                          {address 
                            ? [address.line1, address.line2, address.city, address.state, address.postal_code, countryName(address.country_code)].filter(Boolean).join(', ') 
                            : 'No address saved in Central Auth.'}
                        </span>
                      </div>
                      {!address && (
                        <div style={{ marginTop: '16px' }}>
                          <a href={CENTRAL_AUTH_ACCOUNT_URL} target="_blank" rel="noreferrer" className="text-link">Manage Address in Central Auth →</a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                   <p className="text-red">Unable to load account information.</p>
                )}
              </section>

              {/* 6. Delivery Method & Notes */}
              <section className="form-block">
                <h2 className="section-heading">Delivery Method</h2>
                <div className="select-wrapper">
                  <select 
                    value={deliveryType} 
                    onChange={(e) => setDeliveryType(e.target.value)}
                    className="luxury-select"
                  >
                    <option value="Standard">Standard Delivery</option>
                    <option value="Express">Express Delivery</option>
                  </select>
                  <svg className="select-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                </div>
                <div className="shipping-info">
                  {shippingStatus === 'loading' && <span className="text-muted">Calculating...</span>}
                  {shippingStatus === 'ready' && shippingQuote && (
                    <span>
                      {shippingQuote.delivery_fee == null
                        ? 'Fee informed upon delivery'
                        : `${formatMoney(shippingQuote.delivery_fee)} · ${shippingQuote.estimated_days_min}–${shippingQuote.estimated_days_max} days`}
                    </span>
                  )}
                  {shippingStatus === 'unavailable' && <span className="text-red">{shippingMessage}</span>}
                </div>
              </section>

              <section className="form-block">
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

              {/* 7. Order Total & Payment Button at Bottom */}
              <div className="final-totals">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="totals-row">
                  <span>Shipping</span>
                  <span>
                    {shippingStatus === 'ready' 
                      ? (shippingQuote.delivery_fee == null ? 'TBD' : formatMoney(shippingQuote.delivery_fee)) 
                      : '—'}
                  </span>
                </div>
                <div className="totals-row grand-total">
                  <span>Total</span>
                  <strong>
                    {shippingQuote?.delivery_fee == null 
                      ? 'TBD' 
                      : formatMoney(subtotal + Number(shippingQuote.delivery_fee))}
                  </strong>
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button 
                type="submit" 
                className="btn-primary full-width" 
                disabled={submitting || accountLoading || shippingStatus !== 'ready' || !address}
              >
                {submitting ? 'Processing...' : `Pay ${shippingQuote?.delivery_fee != null ? formatMoney(subtotal + Number(shippingQuote.delivery_fee)) : ''}`}
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
        .checkout-page {
          min-height: 100vh;
          background: #ffffff;
          /* Increased padding-top so it doesn't stick to the main header */
          padding: 120px 20px 60px;
        }

        .checkout-shell {
          width: 100%;
          max-width: 600px; /* Single column layout for better flow */
          margin: 0 auto;
        }

        /* --- Header & Banner --- */
        .top-actions {
          margin-bottom: 16px;
        }

        .back-btn {
          font-size: 11px;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .back-btn:hover { opacity: 0.5; }

        .banner-wrapper {
          width: 100%;
          height: 120px;
          overflow: hidden;
          background: #f5f5f5;
        }

        .checkout-banner {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .checkout-title {
          font-size: 28px;
          font-weight: 300;
          margin: 32px 0 40px 0;
          letter-spacing: 2px;
          text-transform: uppercase;
          text-align: center;
        }

        /* --- Typography & Forms --- */
        .section-heading {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin: 0 0 24px 0;
          color: #000;
        }
        
        .section-heading .optional {
          color: #888;
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
        }

        .form-block {
          margin-bottom: 40px;
        }

        .select-wrapper {
          position: relative;
          width: 100%;
        }

        .luxury-select {
          width: 100%;
          padding: 12px 0;
          border: none;
          border-bottom: 1px solid #000;
          border-radius: 0;
          font-size: 14px;
          color: #000;
          background: transparent;
          font-family: inherit;
          appearance: none;
          outline: none;
          cursor: pointer;
        }

        .select-icon {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .luxury-textarea {
          width: 100%;
          padding: 12px 0;
          border: none;
          border-bottom: 1px solid #000;
          border-radius: 0;
          font-size: 14px;
          color: #000;
          background: transparent;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
          outline: none;
        }
        .luxury-textarea::placeholder {
          color: #aaa;
        }

        .shipping-info {
          margin-top: 12px;
          font-size: 12px;
          color: #555;
          letter-spacing: 0.5px;
        }

        .text-muted { color: #888; font-size: 13px; }
        .text-red { color: #d93025; font-size: 13px; }

        /* --- Profile Section --- */
        .profile-block {
          border-top: 1px solid #e5e5e5;
          padding-top: 40px;
        }

        .profile-summary {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #000;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 500;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .profile-name {
          font-size: 16px;
          font-weight: 500;
          color: #000;
        }

        .profile-email {
          font-size: 13px;
          color: #777;
        }

        .profile-details-bottom {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-left: 64px;
        }

        .info-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-row .label {
          font-size: 10px;
          color: #777;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .info-row .value {
          font-size: 14px;
          color: #000;
          line-height: 1.5;
        }

        .minimal-box {
          padding: 24px;
          background: #fafafa;
          text-align: center;
        }
        .minimal-box p {
          margin: 0 0 16px;
          font-size: 13px;
          color: #555;
        }

        /* --- Product List --- */
        .summary-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .summary-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .item-img-wrap {
          width: 50px;
          height: 65px;
          flex-shrink: 0;
          background: #f5f5f5;
        }

        .item-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .item-details h3 {
          font-size: 12px;
          font-weight: 500;
          margin: 0 0 4px;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .item-variant {
          font-size: 11px;
          color: #777;
          margin: 0 0 12px;
        }

        .qty-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .qty-controls button {
          background: none;
          border: none;
          padding: 0;
          font-size: 15px;
          color: #000;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .qty-controls button:hover:not(:disabled) { opacity: 0.4; }
        .qty-controls button:disabled { color: #ccc; cursor: not-allowed; }
        
        .qty-controls span {
          font-size: 12px;
          font-weight: 500;
          min-width: 14px;
          text-align: center;
        }

        .item-price {
          font-size: 12px;
          font-weight: 500;
          color: #000;
        }

        /* --- Totals & Button --- */
        .final-totals {
          margin: 40px 0;
          padding-top: 24px;
          border-top: 1px solid #e5e5e5;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .totals-row span:last-child { color: #000; }

        .grand-total {
          margin-top: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #000;
        }
        .grand-total strong { font-size: 20px; font-weight: 500; }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 56px;
          padding: 0 32px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 0;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .btn-primary:hover:not(:disabled) { background: #333; }
        .btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }
        .full-width { width: 100%; }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 48px;
          padding: 0 24px;
          background: transparent;
          color: #000;
          border: 1px solid #000;
          border-radius: 0;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-outline:hover { background: #000; color: #fff; }

        .text-link {
          font-size: 11px;
          color: #000;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .error-msg {
          color: #d93025;
          font-size: 12px;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .empty-state {
          text-align: center;
          padding: 80px 0;
        }
        .empty-state h2 { font-size: 18px; font-weight: 400; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1.5px; }
        .empty-state p { color: #777; margin: 0 0 32px; font-size: 13px; }

        /* --- Desktop Responsive --- */
        @media (min-width: 768px) {
          .checkout-page { padding: 140px 40px 80px; }
          .checkout-title { font-size: 36px; }
          
          .banner-wrapper { height: 180px; }
          
          .item-img-wrap { width: 60px; height: 75px; }
          .item-details h3 { font-size: 13px; }
          .item-price { font-size: 13px; }
        }
      `}</style>
    </>
  );
}
