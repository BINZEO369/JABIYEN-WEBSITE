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
  const [accountMessage, setAccountMessage] = useState('');
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
          setAccountMessage('Sign in through BINZEO Central Auth to load the profile used for this order.');
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
        if (profileResponse.status === 401) throw new Error('Your Central Auth session expired. Sign in again to continue.');
        if (!profileResponse.ok || profileResult?.success === false) throw new Error('Your Central Auth profile could not be loaded right now.');

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
        if (addressResponse.status === 401) throw new Error('Your Central Auth session expired. Sign in again to continue.');
        if (!addressResponse.ok || addressResult?.success === false) throw new Error('Saved Central Auth delivery address is temporarily unavailable.');
        const rows = addressResult?.data?.addresses ?? addressResult?.addresses ?? [];
        if (!Array.isArray(rows)) throw new Error('Saved Central Auth delivery address could not be read.');
        const addresses = rows.filter((address) => address && typeof address === 'object');
        const selected = addresses.find((address) => address.is_primary) || addresses[0] || null;
        if (active) {
          setPrimaryAddress(selected);
          setAccountMessage(selected
            ? 'Your Central Auth account and saved delivery address are ready.'
            : 'No saved delivery address was found. Add one in Central Management to continue.');
        }
      } catch (loadError) {
        if (active) {
          setAccountStatus(loadError?.message?.includes('session expired') ? 'signed_out' : 'unavailable');
          setAccountMessage(loadError?.name === 'AbortError'
            ? 'Loading your Central Auth details timed out. Refresh this page to retry.'
            : (loadError instanceof Error ? loadError.message : 'Saved account details could not be loaded.'));
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
      setShippingMessage('');
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
    setShippingMessage('');
    fetch(`/api/shipping/quote?${query.toString()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    }).then(async (response) => {
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.quote) {
        throw new Error(result?.error || 'Delivery is not available for this address.');
      }
      if (active) {
        setShippingQuote(result.quote);
        setShippingStatus('ready');
      }
    }).catch((quoteError) => {
      if (!active || quoteError?.name === 'AbortError') return;
      setShippingQuote(null);
      setShippingStatus('unavailable');
      setShippingMessage(quoteError instanceof Error ? quoteError.message : 'Shipping prices are temporarily unavailable.');
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [address, deliveryType, subtotal]);

  const continueToPayment = async (event) => {
    event.preventDefault();
    setError('');
    if (!cart.length) {
      setError('Your shopping bag is empty. Add an item before checking out.');
      return;
    }
    if (accountStatus === 'signed_out') {
      setError('You are not signed in. Sign in through BINZEO Central Auth before continuing.');
      return;
    }
    if (!profile) {
      setError('Your Central Auth session could not be verified. Refresh the page and sign in again if needed.');
      return;
    }
    if (!primaryAddress) {
      setError(accountStatus === 'connected'
        ? 'No saved delivery address was found. Add or correct it in BINZEO Central Management, then return here.'
        : 'Your saved address could not be verified. Check it in BINZEO Central Management or refresh this page.');
      return;
    }
    if (shippingStatus !== 'ready' || !shippingQuote) {
      setError(shippingMessage || 'A delivery quote is required before continuing. Please wait for the BDT delivery fee to load.');
      return;
    }

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
      setError('Checkout could not continue on this device. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Checkout | JABIYEN</title>
        <meta name="description" content="Confirm your Central Auth profile and review your JABIYEN order." />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>

      <div className="checkout-page">
        <div className="checkout-shell">
          
          <div className="checkout-topline">
            <Link href="/" className="back-link">← Continue shopping</Link>
          </div>

          <header className="checkout-heading">
            <h1>Checkout.</h1>
            <p>Confirm your profile and delivery details to proceed.</p>
          </header>

          {mounted && cart.length === 0 ? (
            <section className="empty-state">
              <h2>Your bag is empty.</h2>
              <p>Choose something from the collection and it will be waiting here at checkout.</p>
              <Link href="/" className="btn-primary">Explore the collection</Link>
            </section>
          ) : (
            <div className="checkout-layout">
              <form className="checkout-form" onSubmit={continueToPayment}>
                
                {/* Section 01: Profile */}
                <section className="form-section">
                  <h2 className="section-title">01. Profile</h2>
                  
                  <div className="account-notice">
                    {accountLoading ? (
                      <p>Loading your Central Auth profile...</p>
                    ) : accountStatus === 'connected' ? (
                      <p className="success-text">✓ BINZEO Central Auth connected</p>
                    ) : (
                      <p className="error-text">! Central Auth profile required</p>
                    )}
                    <p className="notice-desc">{accountMessage}</p>
                    {accountStatus === 'signed_out' && <Link href="/auth/signin" className="text-link">Sign in securely</Link>}
                    {accountStatus === 'unavailable' && <a href={CENTRAL_AUTH_ACCOUNT_URL} className="text-link">Open Central Management</a>}
                    {accountStatus === 'connected' && !primaryAddress && !accountLoading && (
                      <a href={CENTRAL_AUTH_ACCOUNT_URL} target="_blank" rel="noreferrer" className="text-link">Manage saved address</a>
                    )}
                  </div>

                  {profile && (
                    <div className="profile-details">
                      <div className="profile-row">
                        <span>Name</span>
                        <strong>{profile.name || 'Not available'}</strong>
                      </div>
                      <div className="profile-row">
                        <span>Phone</span>
                        <strong>{profile.phone || 'Not available'}</strong>
                      </div>
                      <div className="profile-row">
                        <span>Email</span>
                        <strong>{profile.email || 'Not provided'}</strong>
                      </div>
                      <div className="profile-row">
                        <span>Address</span>
                        <strong>
                          {address 
                            ? [address.line1, address.line2, address.city, address.state, address.postal_code, countryName(address.country_code)].filter(Boolean).join(', ') 
                            : 'No saved address'}
                        </strong>
                      </div>
                    </div>
                  )}
                </section>

                {/* Section 02: Delivery */}
                <section className="form-section">
                  <h2 className="section-title">02. Delivery Speed</h2>
                  
                  <div className="input-group">
                    <label htmlFor="delivery-type">Delivery type</label>
                    <select 
                      id="delivery-type" 
                      value={deliveryType} 
                      onChange={(event) => setDeliveryType(event.target.value)}
                    >
                      <option value="Standard">Standard Delivery</option>
                      <option value="Express">Express Delivery</option>
                    </select>
                  </div>

                  <div className="shipping-status">
                    {shippingStatus === 'loading' && <p>Calculating delivery fee...</p>}
                    {shippingStatus === 'ready' && shippingQuote && (
                      <p>
                        {shippingQuote.delivery_fee == null
                          ? 'Delivery charge will be informed later · BDT'
                          : `${formatMoney(shippingQuote.delivery_fee)} · ${shippingQuote.estimated_days_min}–${shippingQuote.estimated_days_max} days`}
                      </p>
                    )}
                    {shippingStatus === 'unavailable' && <p className="error-text">{shippingMessage}</p>}
                  </div>
                </section>

                {/* Section 03: Note */}
                <section className="form-section">
                  <h2 className="section-title">03. Order Note (Optional)</h2>
                  <div className="input-group">
                    <textarea 
                      id="delivery-note" 
                      value={deliveryNote} 
                      onChange={(event) => setDeliveryNote(event.target.value.slice(0, 500))} 
                      maxLength={500} 
                      rows={3} 
                      placeholder="Add a delivery instruction..." 
                    />
                  </div>
                </section>

                {error && <div className="error-alert">{error}</div>}

                <button 
                  className="btn-primary full-width" 
                  type="submit" 
                  disabled={submitting || accountLoading || shippingStatus !== 'ready' || (mounted && !cart.length)}
                >
                  {submitting ? 'Preparing payment...' : 'Continue to Payment'}
                </button>
              </form>

              {/* Order Summary */}
              <aside className="order-summary">
                <h2 className="section-title">Order Summary</h2>
                
                <div className="summary-items">
                  {cart.map((item, index) => (
                    <div className="summary-item" key={`${item.product_id}-${item.variant_id || index}-${item.id || index}`}>
                      <div className="item-img-wrap">
                        <img src={item.img || '/logo.png'} alt="" onError={(e) => { e.currentTarget.src = '/logo.png'; }} />
                        <span className="qty">{item.quantity || 1}</span>
                      </div>
                      <div className="item-info">
                        <strong>{item.title || 'JABIYEN item'}</strong>
                        <span>{[item.color_name, item.size_name].filter(Boolean).join(' · ') || 'Selected item'}</span>
                      </div>
                      <span className="item-price">{formatMoney(Number(item.price || 0) * Number(item.quantity || 1))}</span>
                    </div>
                  ))}
                </div>

                <div className="summary-totals">
                  <div className="totals-row">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <div className="totals-row">
                    <span>Delivery</span>
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
                
                <p className="summary-note">Total shown in {selectedCurrency.currency_code}. Final verification occurs securely on the server.</p>
              </aside>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <style jsx>{`
        /* --- Base Layout --- */
        .checkout-page {
          min-height: 100vh;
          background: #ffffff;
          padding: 80px 20px 60px;
          color: #111;
        }

        .checkout-shell {
          width: 100%;
          max-width: 1000px; /* Desktop width */
          margin: 0 auto;
        }

        /* --- Header --- */
        .checkout-topline {
          margin-bottom: 40px;
        }

        .back-link {
          font-size: 14px;
          font-weight: 500;
          color: #777;
          text-decoration: none;
        }
        .back-link:hover {
          color: #111;
        }

        .checkout-heading {
          margin-bottom: 40px;
        }

        .checkout-heading h1 {
          font-size: 32px;
          font-weight: 600;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .checkout-heading p {
          font-size: 15px;
          color: #777;
          margin: 0;
        }

        /* --- Grid Layout --- */
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
        }

        /* --- Sections --- */
        .form-section {
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 20px;
          color: #111;
        }

        /* --- Account Info --- */
        .account-notice {
          margin-bottom: 24px;
        }

        .account-notice p {
          font-size: 14px;
          margin: 0 0 4px;
          color: #777;
        }
        .account-notice .success-text {
          color: #111;
          font-weight: 600;
        }
        .account-notice .error-text {
          color: #d93025;
          font-weight: 600;
        }
        .notice-desc {
          color: #888 !important;
          font-size: 13px !important;
        }

        .text-link {
          display: inline-block;
          font-size: 13px;
          color: #111;
          font-weight: 500;
          text-decoration: underline;
          margin-top: 8px;
        }

        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .profile-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }
        .profile-row:last-child {
          border-bottom: none;
        }

        .profile-row span {
          font-size: 14px;
          color: #888;
          min-width: 80px;
        }

        .profile-row strong {
          font-size: 14px;
          font-weight: 500;
          color: #111;
          text-align: right;
          max-width: 70%;
        }

        /* --- Forms --- */
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 500;
          color: #777;
        }

        .input-group select,
        .input-group textarea {
          width: 100%;
          padding: 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          color: #111;
          background: #fff;
          font-family: inherit;
          outline: none;
        }

        .input-group select:focus,
        .input-group textarea:focus {
          border-color: #111;
        }

        .input-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .shipping-status {
          margin-top: 12px;
          font-size: 13px;
          color: #777;
        }
        .shipping-status p {
          margin: 0;
        }

        /* --- Buttons & Alerts --- */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 52px;
          padding: 0 32px;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 100px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .full-width {
          width: 100%;
          margin-top: 10px;
        }

        .error-alert {
          padding: 16px;
          background: #fff;
          border: 1px solid #d93025;
          color: #d93025;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 20px;
        }

        /* --- Order Summary --- */
        .order-summary {
          background: #ffffff;
        }

        .summary-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .item-img-wrap {
          position: relative;
          width: 60px;
          height: 70px;
          flex-shrink: 0;
        }

        .item-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #f0f0f0;
        }

        .qty {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #111;
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .item-info strong {
          font-size: 14px;
          font-weight: 500;
          color: #111;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-info span {
          font-size: 13px;
          color: #888;
        }

        .item-price {
          font-size: 14px;
          font-weight: 500;
          color: #111;
        }

        .summary-totals {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid #f0f0f0;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #777;
        }

        .totals-row span:last-child {
          color: #111;
        }

        .grand-total {
          font-size: 18px;
          font-weight: 600;
          color: #111;
          margin-top: 8px;
        }

        .grand-total strong {
          font-size: 20px;
        }

        .summary-note {
          margin-top: 20px;
          font-size: 12px;
          color: #aaa;
          line-height: 1.5;
        }

        .empty-state {
          text-align: center;
          padding: 60px 0;
        }
        .empty-state h2 {
          font-size: 24px;
          font-weight: 500;
          margin: 0 0 12px;
        }
        .empty-state p {
          color: #777;
          margin-bottom: 24px;
        }

        /* --- Desktop Responsive --- */
        @media (min-width: 768px) {
          .checkout-page {
            padding: 120px 40px 80px;
          }

          .checkout-heading h1 {
            font-size: 42px;
          }

          .checkout-heading p {
            font-size: 17px;
          }

          .checkout-layout {
            grid-template-columns: 1.2fr 0.8fr; /* Two columns for desktop */
            gap: 60px;
          }

          .section-title {
            font-size: 22px;
            margin-bottom: 24px;
          }

          .profile-row span, .profile-row strong {
            font-size: 16px;
          }

          .input-group select, .input-group textarea {
            font-size: 16px;
            padding: 16px;
          }

          .btn-primary {
            height: 60px;
            font-size: 17px;
          }

          .order-summary {
            position: sticky;
            top: 120px; /* Sticky summary on desktop */
          }

          .item-img-wrap {
            width: 70px;
            height: 85px;
          }

          .item-info strong {
            font-size: 16px;
          }
          
          .item-price, .totals-row {
            font-size: 16px;
          }

          .grand-total strong {
            font-size: 24px;
          }
        }
      `}</style>
    </>
  );
}
