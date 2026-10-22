import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCurrency } from '../components/currency/CurrencyProvider';

const REQUEST_TIMEOUT_MS = 12000;

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { formatMoney, selectedCurrency } = useCurrency();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const orderNumber = router.query.order;

  // Read token from URL hash (#token=xxx)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    const match = hash.match(/token=([^&]+)/);
    if (match) setToken(decodeURIComponent(match[1]));
  }, []);

  // Fetch order details
  useEffect(() => {
    if (!router.isReady) return;

    if (!orderNumber) {
      setStatus('missing');
      return;
    }

    if (!token) {
      const t = setTimeout(() => {
        if (typeof window !== 'undefined' && !window.location.hash.includes('token=')) {
          setStatus('missing');
        }
      }, 200);
      return () => clearTimeout(t);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    fetch(`/api/orders/${encodeURIComponent(orderNumber)}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success || !result.order) {
          throw new Error(result?.error || 'We could not load your order.');
        }
        setOrder(result.order);
        setStatus('ready');
      })
      .catch((err) => {
        if (err?.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(err?.message || 'We could not load your order.');
        }
        setStatus('error');
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [router.isReady, orderNumber, token]);

  const items = useMemo(() => {
    if (!order) return [];
    return order.items || order.display_items || order.order_items || [];
  }, [order]);

  const subtotal = useMemo(() => {
    if (!order) return 0;
    if (order.subtotal != null) return Number(order.subtotal);
    return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  }, [order, items]);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity || 1), 0), [items]);

  const deliveryFee = useMemo(() => {
    if (!order) return null;
    const fee = order.delivery_fee ?? order.quoted_delivery_fee ?? order.shipping_fee;
    return fee == null ? null : Number(fee);
  }, [order]);

  const totalAmount = useMemo(() => {
    if (!order) return null;
    if (order.total != null) return Number(order.total);
    if (deliveryFee == null) return null;
    return subtotal + deliveryFee;
  }, [order, subtotal, deliveryFee]);

  const customer = order?.customer || {};
  const customerAddress = customer?.address || {};
  const fullAddressLine = useMemo(
    () => [customerAddress.line1, customerAddress.line2, customerAddress.city, customerAddress.state, customerAddress.district, customerAddress.postal_code, customerAddress.country_code]
      .filter(Boolean)
      .join(', '),
    [customerAddress]
  );
  const customerInitials = customer?.name ? customer.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <Head>
        <title>Order Confirmed | JABIYEN</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>

      <div className="checkout-page">
        
        <div className="banner-wrapper">
          <img 
            src="https://raw.githubusercontent.com/BINZEO369/auth.binzeo/main/public/images/connected-accounts-checkout.jpg" 
            alt="Order Confirmed" 
            className="checkout-banner"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        <div className="checkout-shell">
          
          <h1 className="checkout-title animate-fade-up">Order Confirmed</h1>

          {status === 'loading' && (
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

          {(status === 'missing' || status === 'error') && (
            <section className="form-block animate-fade-up">
              <div className="minimal-box">
                <p>{status === 'error' ? error : 'We could not find your order details. Please check the link or contact support.'}</p>
                <Link href="/" className="btn-outline">Return to Store</Link>
              </div>
            </section>
          )}

          {status === 'ready' && order && (
            <div>
              
              {/* Success Badge */}
              <section className="form-block animate-fade-up">
                <div className="success-badge">
                  <span className="success-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <div className="success-copy">
                    <strong>Thank you for your order</strong>
                    <span>Order #{order.order_number || orderNumber}</span>
                  </div>
                </div>
              </section>

              {/* Product List */}
              {items.length > 0 && (
                <section className="form-block animate-fade-up">
                  <h2 className="section-heading">Your Bag <span className="item-count-label">({totalItems})</span></h2>
                  <div className="summary-list">
                    {items.map((item, index) => {
                      const imageSrc = item.img || item.image || '/logo.png';
                      return (
                        <div 
                          className="summary-item animate-fade-up" 
                          key={`${item.title || item.product_title}-${index}`}
                          style={{ animationDelay: `${index * 0.06}s` }}
                        >
                          <div className="item-img-wrap">
                            <img 
                              src={imageSrc} 
                              alt={item.title || item.product_title || 'JABIYEN item'}
                              className="item-img"
                              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                            />
                            <span className="item-qty-badge">{item.quantity || 1}</span>
                          </div>
                          <div className="item-details">
                            <h3>{item.title || item.product_title || 'JABIYEN Item'}</h3>
                            <p className="item-variant">{[item.color_name, item.size_name].filter(Boolean).join(' · ') || 'Selected item'}</p>
                            <span className="item-price">
                              {formatMoney(Number(item.price || 0) * Number(item.quantity || 1))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Account & Delivery */}
              {customer?.name && (
                <section className="form-block profile-block">
                  <h2 className="section-heading">Account & Delivery</h2>
                  <div className="compact-profile animate-fade-up">
                    <div className="profile-top-row">
                      <div className="avatar">{customerInitials}</div>
                      <div className="profile-text">
                        <strong className="profile-name">{customer.name}</strong>
                        <span className="profile-meta">
                          {[customer.email, customer.phone].filter(Boolean).join(' · ') || 'No contact info'}
                        </span>
                      </div>
                    </div>
                    <div className="profile-address">
                      <span className="address-label">Delivering to</span>
                      <span className="address-value">{fullAddressLine || 'No address saved'}</span>
                    </div>
                  </div>
                </section>
              )}

              {/* Order Notes */}
              {customer?.delivery_notes && (
                <section className="form-block animate-fade-up">
                  <h2 className="section-heading">Order Notes</h2>
                  <div className="order-note-display">{customer.delivery_notes}</div>
                </section>
              )}

              {/* Totals */}
              <div className="final-totals animate-fade-up">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="totals-row">
                  <span>{(order.delivery_type || 'Standard')} Delivery</span>
                  <span>
                    {deliveryFee == null 
                      ? 'TBD' 
                      : deliveryFee === 0 ? 'Free' : formatMoney(deliveryFee)}
                  </span>
                </div>
                {order.estimated_days_min && order.estimated_days_max && (
                  <div className="totals-row">
                    <span>Estimated Delivery</span>
                    <span>{order.estimated_days_min}–{order.estimated_days_max} days</span>
                  </div>
                )}
                <div className="totals-row grand-total">
                  <span>Total</span>
                  <strong>
                    {totalAmount == null ? 'TBD' : formatMoney(totalAmount)}
                  </strong>
                </div>
              </div>

              {/* Continue Shopping */}
              <Link href="/" className="btn-primary full-width">
                Continue Shopping
              </Link>
            </div>
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
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }

        .checkout-page { min-height: 100vh; background: #ffffff; padding-top: 80px; }
        .banner-wrapper { width: 100%; height: 140px; overflow: hidden; background: #f5f5f5; }
        .checkout-banner { width: 100%; height: 100%; object-fit: cover; display: block; animation: fadeIn 1s ease both; }
        .checkout-shell { width: 100%; max-width: 600px; margin: 0 auto; padding: 0 20px 60px; }
        .checkout-title { font-size: 28px; font-weight: 300; margin: 32px 0 40px 0; letter-spacing: 2px; text-transform: uppercase; text-align: center; }
        .section-heading { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 16px 0; color: #000; display: flex; align-items: center; gap: 8px; }
        .item-count-label { color: #999; font-weight: 400; letter-spacing: 0; text-transform: none; font-size: 11px; }
        .form-block { margin-bottom: 24px; }

        /* Success Badge */
        .success-badge {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border: 1px solid #000;
          background: #fafafa;
        }
        .success-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          background: #000;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .success-icon svg { width: 20px; height: 20px; }
        .success-copy {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .success-copy strong {
          font-size: 12px;
          font-weight: 600;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          line-height: 1.3;
        }
        .success-copy span {
          font-size: 11px;
          color: #777;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        /* Product List */
        .summary-list { display: flex; flex-direction: column; gap: 12px; }
        .summary-item { display: flex; align-items: center; gap: 12px; padding: 8px; border: 1px solid #f0f0f0; background: #fafafa; }
        .item-img-wrap { position: relative; width: 48px; height: 60px; flex-shrink: 0; background: #ffffff; overflow: visible; }
        .item-img { width: 100%; height: 100%; object-fit: cover; display: block; border: 1px solid #eaeaea; }
        .item-qty-badge { position: absolute; top: -6px; right: -6px; background: #000; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; border: 2px solid #fff; z-index: 2; }
        .item-details { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .item-details h3 { font-size: 11px; font-weight: 500; margin: 0; color: #000; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-variant { font-size: 10px; color: #777; margin: 0; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-price { font-size: 11px; font-weight: 600; color: #000; display: inline-block; margin-top: 2px; }

        /* Profile */
        .profile-block { border-top: 1px solid #e5e5e5; padding-top: 24px; }
        .compact-profile { display: flex; flex-direction: column; gap: 12px; }
        .profile-top-row { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 500; flex-shrink: 0; }
        .profile-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .profile-name { font-size: 14px; font-weight: 600; color: #000; line-height: 1.3; }
        .profile-meta { font-size: 12px; color: #777; line-height: 1.4; overflow-wrap: anywhere; }
        .profile-address { display: flex; flex-direction: column; gap: 4px; padding-top: 10px; border-top: 1px solid #f0f0f0; }
        .address-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; font-weight: 500; }
        .address-value { font-size: 12px; color: #333; line-height: 1.5; overflow-wrap: anywhere; }

        /* Skeleton */
        .skeleton-profile { display: flex; align-items: center; gap: 12px; }
        .skeleton-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
        .skeleton-lines { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .skeleton-line { height: 12px; border-radius: 4px; }
        .shimmer { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite linear; }

        /* Order Note */
        .order-note-display { padding: 14px; background: #fafafa; border-left: 2px solid #000; font-size: 12px; color: #333; line-height: 1.6; white-space: pre-wrap; }

        /* Totals */
        .final-totals { margin: 24px 0; padding-top: 20px; border-top: 1px solid #e5e5e5; display: flex; flex-direction: column; gap: 10px; }
        .totals-row { display: flex; justify-content: space-between; font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .totals-row span:last-child { color: #000; }
        .grand-total { margin-top: 8px; font-size: 14px; font-weight: 500; color: #000; }
        .grand-total strong { font-size: 20px; font-weight: 500; display: inline-block; }

        /* Button */
        .btn-primary { display: inline-flex; align-items: center; justify-content: center; height: 56px; padding: 0 32px; background: #000; color: #fff; border: none; border-radius: 0; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; cursor: pointer; transition: background 0.3s, transform 0.15s; }
        .btn-primary:hover { background: #333; transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .full-width { width: 100%; }

        .btn-outline { display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 20px; background: transparent; color: #000; border: 1px solid #000; border-radius: 0; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; transition: all 0.2s; }
        .btn-outline:hover { background: #000; color: #fff; }

        .minimal-box { padding: 24px; background: #fafafa; text-align: center; }
        .minimal-box p { margin: 0 0 16px; font-size: 13px; color: #555; line-height: 1.6; }

        /* Desktop */
        @media (min-width: 768px) {
          .checkout-page { padding-top: 120px; }
          .checkout-shell { max-width: 800px; padding: 0 40px 80px; }
          .banner-wrapper { height: 320px; }
          .checkout-title { font-size: 42px; margin: 48px 0 56px 0; }
          .section-heading { font-size: 13px; margin-bottom: 20px; }
          .item-count-label { font-size: 13px; }
          .form-block { margin-bottom: 32px; }
          
          .success-badge { padding: 20px 24px; gap: 18px; }
          .success-icon { width: 52px; height: 52px; }
          .success-icon svg { width: 26px; height: 26px; }
          .success-copy strong { font-size: 15px; }
          .success-copy span { font-size: 13px; }
          
          .summary-list { gap: 14px; }
          .summary-item { gap: 16px; padding: 10px; }
          .item-img-wrap { width: 64px; height: 80px; }
          .item-qty-badge { width: 24px; height: 24px; font-size: 11px; top: -7px; right: -7px; }
          .item-details h3 { font-size: 13px; }
          .item-variant { font-size: 12px; }
          .item-price { font-size: 13px; }
          
          .skeleton-avatar { width: 56px; height: 56px; }
          .avatar { width: 56px; height: 56px; font-size: 22px; }
          .profile-name { font-size: 18px; }
          .profile-meta { font-size: 14px; }
          .address-label { font-size: 12px; }
          .address-value { font-size: 14px; }
          
          .order-note-display { font-size: 14px; padding: 20px; }
          
          .totals-row { font-size: 14px; margin-bottom: 8px; }
          .grand-total { font-size: 18px; margin-top: 16px; }
          .grand-total strong { font-size: 32px; }
          
          .btn-primary { height: 72px; font-size: 14px; letter-spacing: 3px; }
          .final-totals { padding-top: 32px; margin: 40px 0; gap: 14px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up, .shimmer, .checkout-banner { animation: none !important; }
          .btn-primary { transition: none !important; }
        }
      `}</style>
    </>
  );
}
