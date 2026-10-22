import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCartState } from '../components/layout/CartDrawer';
import { useCurrency } from '../components/currency/CurrencyProvider';

const CHECKOUT_DRAFT_KEY = 'jabiyen_checkout_draft_v1';
const CHECKOUT_KEYS_KEY = 'jabiyen_pending_checkout_v1';
const DRAFT_TTL_MS = 60 * 60 * 1000;

function money(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getCheckoutKeys() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(CHECKOUT_KEYS_KEY) || 'null');
    if (saved?.idempotency_key && saved?.access_token) return saved;
  } catch {}
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const accessToken = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const idempotencyKey = window.crypto?.randomUUID?.()
    || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.random() * 16 | 0;
      return (char === 'x' ? random : (random & 0x3 | 0x8)).toString(16);
    });
  const saved = { idempotency_key: idempotencyKey, access_token: accessToken };
  window.sessionStorage.setItem(CHECKOUT_KEYS_KEY, JSON.stringify(saved));
  return saved;
}

export default function PaymentPage() {
  const router = useRouter();
  const { clearCart } = useCartState();
  const { formatMoney, selectedCurrency } = useCurrency();
  const [draft, setDraft] = useState(null);
  const [draftStatus, setDraftStatus] = useState('loading');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.sessionStorage.getItem(CHECKOUT_DRAFT_KEY) || 'null');
      const age = Date.now() - Number(parsed?.created_at || 0);
      if (parsed?.version === 1 && age >= 0 && age <= DRAFT_TTL_MS && Array.isArray(parsed.items) && parsed.items.length > 0 && parsed.customer?.address && ['Standard', 'Express'].includes(parsed.delivery_type) && parsed.shipping_quote) {
        setDraft(parsed);
        setDraftStatus('ready');
      } else {
        window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
        setDraftStatus('missing');
      }
    } catch {
      setDraftStatus('missing');
    }
  }, []);

  const items = draft?.display_items || [];
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0), [items]);
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity || 1), 0), [items]);
  const deliveryFee = draft?.shipping_quote?.delivery_fee == null ? null : Number(draft.shipping_quote.delivery_fee);
  const totalAmount = deliveryFee == null ? null : subtotal + deliveryFee;

  const placeOrder = async (event) => {
    event.preventDefault();
    setError('');
    if (!draft?.items?.length || !draft.customer?.address || typeof draft.customer.address !== 'object') {
      setError('Your saved delivery address is missing. Return to checkout and confirm the address again.');
      return;
    }

    setSubmitting(true);
    try {
      const keys = getCheckoutKeys();
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin',
        body: JSON.stringify({
          ...keys,
          customer: draft.customer,
          items: draft.items,
          delivery_type: draft.delivery_type,
          quoted_delivery_fee: deliveryFee,
          website: draft.website || '',
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.order?.order_number) {
        throw new Error(result?.error || 'We could not place your order. Please check your connection and try again.');
      }

      clearCart();
      window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
      window.sessionStorage.removeItem(CHECKOUT_KEYS_KEY);
      await router.push(`/order-confirmation?order=${encodeURIComponent(result.order.order_number)}#token=${encodeURIComponent(result.access_token || keys.access_token)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Order submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Customer address line for display
  const customerAddress = draft?.customer?.address;
  const fullAddressLine = customerAddress
    ? [customerAddress.line1, customerAddress.line2, customerAddress.city, customerAddress.state, customerAddress.district, customerAddress.postal_code, customerAddress.country_code].filter(Boolean).join(', ')
    : '';

  const customerInitials = draft?.customer?.name ? draft.customer.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <Head>
        <title>Payment | JABIYEN</title>
        <meta name="description" content="Choose how to pay for your JABIYEN order." />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>

      <div className="checkout-page">
        
        {/* Full Width Banner Image (Edge-to-Edge) */}
        <div className="banner-wrapper">
          <img 
            src="https://raw.githubusercontent.com/BINZEO369/auth.binzeo/main/public/images/connected-accounts-checkout.jpg" 
            alt="Secure Payment" 
            className="checkout-banner"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        <div className="checkout-shell">
          
          <h1 className="checkout-title animate-fade-up">Payment</h1>

          {draftStatus === 'loading' && (
            <section className="form-block animate-fade-up">
              <div className="skeleton-profile">
                <div className="skeleton-avatar shimmer" />
                <div className="skeleton-lines">
                  <div className="skeleton-line shimmer" style={{ width: '60%' }} />
                  <div className="skeleton-line shimmer" style={{ width: '80%' }} />
                </div>
              </div>
            </section>
          )}

          {draftStatus === 'missing' && (
            <section className="form-block animate-fade-up">
              <div className="minimal-box">
                <p>Your secure checkout details are unavailable or expired. Return to checkout to review your profile.</p>
                <Link href="/checkout" className="btn-outline">Return to Checkout</Link>
              </div>
            </section>
          )}

          {draftStatus === 'ready' && (
            <form className="checkout-form" onSubmit={placeOrder}>
              
              {/* 1. Product Details */}
              <section className="form-block animate-fade-up">
                <h2 className="section-heading">Your Bag</h2>
                <div className="summary-list">
                  {items.map((item, index) => (
                    <div 
                      className="summary-item animate-fade-up" 
                      key={`${item.title}-${index}`}
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      <div className="item-img-wrap">
                        <div className="item-qty-badge">{item.quantity || 1}</div>
                      </div>
                      
                      <div className="item-details">
                        <h3>{item.title || 'JABIYEN Item'}</h3>
                        <p className="item-variant">{[item.color_name, item.size_name].filter(Boolean).join(' · ') || 'Selected item'}</p>
                      </div>

                      <span className="item-price">
                        {formatMoney(Number(item.price || 0) * Number(item.quantity || 1))}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2. Account & Delivery (From Draft) */}
              <section className="form-block profile-block">
                <h2 className="section-heading">Account & Delivery</h2>
                
                {draft.customer && (
                  <div className="compact-profile animate-fade-up">
                    <div className="profile-top-row">
                      <div className="avatar">{customerInitials}</div>
                      <div className="profile-text">
                        <strong className="profile-name">{draft.customer.name}</strong>
                        <span className="profile-meta">
                          {[draft.customer.email, draft.customer.phone].filter(Boolean).join(' · ') || 'No contact info'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="profile-address">
                      <span className="address-label">Delivering to</span>
                      <span className="address-value">{fullAddressLine || 'No address saved'}</span>
                    </div>
                  </div>
                )}
              </section>

              {/* 3. Payment Method */}
              <section className="form-block animate-fade-up">
                <h2 className="section-heading">Payment Method</h2>
                
                <div className="payment-method-selected">
                  <span className="method-icon">৳</span>
                  <div className="method-info">
                    <strong>Cash on Delivery</strong>
                    <span>No online payment is taken. Pay when your order arrives.</span>
                  </div>
                  <span className="method-check">✓</span>
                </div>
              </section>

              {/* 4. Order Notes (if any) */}
              {draft.customer?.delivery_notes && (
                <section className="form-block animate-fade-up">
                  <h2 className="section-heading">Order Notes</h2>
                  <div className="order-note-display">
                    {draft.customer.delivery_notes}
                  </div>
                </section>
              )}

              {/* 5. Order Total & Place Order Button */}
              <div className="final-totals animate-fade-up">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="totals-row">
                  <span>{draft.delivery_type} Delivery</span>
                  <span>
                    {deliveryFee == null 
                      ? 'TBD' 
                      : deliveryFee === 0 ? 'Free' : formatMoney(deliveryFee)}
                  </span>
                </div>
                {draft.shipping_quote.estimated_days_min && draft.shipping_quote.estimated_days_max && (
                  <div className="totals-row">
                    <span>Estimated Delivery</span>
                    <span>{draft.shipping_quote.estimated_days_min}–{draft.shipping_quote.estimated_days_max} days</span>
                  </div>
                )}
                <div className="totals-row grand-total">
                  <span>Total</span>
                  <strong>
                    {totalAmount == null 
                      ? 'TBD' 
                      : formatMoney(totalAmount)}
                  </strong>
                </div>
                {totalAmount != null && (
                  <div className="totals-row cod-row">
                    <span>Cash Collected (BDT)</span>
                    <span>{money(totalAmount)}</span>
                  </div>
                )}
              </div>

              {error && <div className="error-msg animate-shake">{error}</div>}

              <button 
                type="submit" 
                className="btn-primary full-width" 
                disabled={submitting}
              >
                {submitting ? (
                  <span className="btn-loading"><span className="btn-spinner" /> Placing Order...</span>
                ) : (
                  `Place Order ${totalAmount != null ? `· ${formatMoney(totalAmount)}` : ''}`
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
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }

        .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-fade-in { animation: fadeIn 0.4s ease both; }
        .animate-shake { animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }

        .checkout-page { min-height: 100vh; background: #ffffff; padding-top: 80px; }
        .banner-wrapper { width: 100%; height: 140px; overflow: hidden; background: #f5f5f5; }
        .checkout-banner { width: 100%; height: 100%; object-fit: cover; display: block; animation: fadeIn 1s ease both; }
        .checkout-shell { width: 100%; max-width: 600px; margin: 0 auto; padding: 0 20px 60px; }
        .checkout-title { font-size: 28px; font-weight: 300; margin: 32px 0 40px 0; letter-spacing: 2px; text-transform: uppercase; text-align: center; }
        .section-heading { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 20px 0; color: #000; }
        .form-block { margin-bottom: 32px; }

        /* --- Product List --- */
        .summary-list { display: flex; flex-direction: column; gap: 20px; }
        .summary-item { display: flex; align-items: flex-start; gap: 16px; }
        .item-img-wrap { position: relative; width: 50px; height: 65px; flex-shrink: 0; background: #f5f5f5; overflow: hidden; border-radius: 2px; }
        .item-qty-badge { 
          position: absolute; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%); 
          background: #000; 
          color: #fff; 
          width: 24px; 
          height: 24px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 11px; 
          font-weight: 500; 
        }
        .item-details { flex: 1; display: flex; flex-direction: column; }
        .item-details h3 { font-size: 12px; font-weight: 500; margin: 0 0 4px; color: #000; text-transform: uppercase; letter-spacing: 0.5px; }
        .item-variant { font-size: 11px; color: #777; margin: 0; }
        .item-price { font-size: 12px; font-weight: 500; color: #000; display: inline-block; }

        /* --- Profile Section --- */
        .profile-block { border-top: 1px solid #e5e5e5; padding-top: 32px; }
        .compact-profile { display: flex; flex-direction: column; gap: 14px; }
        .profile-top-row { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 500; flex-shrink: 0; }
        .profile-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .profile-name { font-size: 14px; font-weight: 600; color: #000; line-height: 1.3; }
        .profile-meta { font-size: 12px; color: #777; line-height: 1.4; overflow-wrap: anywhere; }
        .profile-address { display: flex; flex-direction: column; gap: 4px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
        .address-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; font-weight: 500; }
        .address-value { font-size: 12px; color: #333; line-height: 1.5; overflow-wrap: anywhere; }

        /* --- Skeleton Loader --- */
        .skeleton-profile { display: flex; align-items: center; gap: 12px; }
        .skeleton-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
        .skeleton-lines { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .skeleton-line { height: 12px; border-radius: 4px; }
        .shimmer { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite linear; }

        /* --- Payment Method --- */
        .payment-method-selected {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border: 1px solid #000;
          background: #fafafa;
        }
        .method-icon {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          background: #000;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 500;
          border-radius: 50%;
        }
        .method-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .method-info strong {
          font-size: 13px;
          font-weight: 600;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .method-info span {
          font-size: 11px;
          color: #777;
          line-height: 1.4;
        }
        .method-check {
          color: #000;
          font-size: 16px;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* --- Order Note --- */
        .order-note-display {
          padding: 14px;
          background: #fafafa;
          border-left: 2px solid #000;
          font-size: 12px;
          color: #333;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        /* --- Totals & Button --- */
        .final-totals { margin: 32px 0; padding-top: 24px; border-top: 1px solid #e5e5e5; display: flex; flex-direction: column; gap: 12px; }
        .totals-row { display: flex; justify-content: space-between; font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .totals-row span:last-child { color: #000; }
        .grand-total { margin-top: 8px; font-size: 14px; font-weight: 500; color: #000; }
        .grand-total strong { font-size: 20px; font-weight: 500; display: inline-block; }
        .cod-row { 
          padding-top: 12px; 
          margin-top: 4px; 
          border-top: 1px solid #f0f0f0; 
          color: #000 !important; 
          font-weight: 600;
        }
        .cod-row span:last-child { color: #000; font-weight: 600; }

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

        .minimal-box { padding: 24px; background: #fafafa; text-align: center; }
        .minimal-box p { margin: 0 0 16px; font-size: 13px; color: #555; line-height: 1.6; }

        /* --- Desktop Responsive --- */
        @media (min-width: 768px) {
          .checkout-page { padding-top: 120px; }
          .checkout-shell { max-width: 800px; padding: 0 40px 80px; }
          .banner-wrapper { height: 320px; }
          .checkout-title { font-size: 42px; margin: 48px 0 56px 0; }
          .section-heading { font-size: 13px; margin-bottom: 28px; }
          
          .summary-item { gap: 24px; }
          .item-img-wrap { width: 80px; height: 100px; }
          .item-qty-badge { width: 32px; height: 32px; font-size: 14px; }
          .item-details h3 { font-size: 16px; }
          .item-variant { font-size: 14px; }
          .item-price { font-size: 16px; }
          
          .skeleton-avatar { width: 56px; height: 56px; }
          .avatar { width: 56px; height: 56px; font-size: 22px; }
          .profile-name { font-size: 18px; }
          .profile-meta { font-size: 14px; }
          .address-label { font-size: 12px; }
          .address-value { font-size: 14px; }
          
          .payment-method-selected { padding: 24px; gap: 20px; }
          .method-icon { width: 56px; height: 56px; font-size: 24px; }
          .method-info strong { font-size: 16px; }
          .method-info span { font-size: 14px; }
          .method-check { font-size: 20px; }
          
          .order-note-display { font-size: 14px; padding: 20px; }
          
          .totals-row { font-size: 14px; margin-bottom: 8px; }
          .grand-total { font-size: 18px; margin-top: 16px; }
          .grand-total strong { font-size: 32px; }
          
          .btn-primary { height: 72px; font-size: 14px; letter-spacing: 3px; }
          .final-totals { padding-top: 32px; margin: 48px 0; gap: 16px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up, .animate-fade-in, .animate-shake, .shimmer, .btn-spinner, .checkout-banner { animation: none !important; }
          .btn-primary { transition: none !important; }
        }
      `}</style>
    </>
  );
}
