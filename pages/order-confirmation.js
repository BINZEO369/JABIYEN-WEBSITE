import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCurrency } from '../components/currency/CurrencyProvider';

const REQUEST_TIMEOUT_MS = 12000;
const SNAPSHOT_KEY = 'jabiyen_last_order_snapshot';

// ============================================
// HELPERS — Robust value extraction
// ============================================
function pickFirst(obj, keys, fallback = '') {
  if (!obj || typeof obj !== 'object') return fallback;
  for (const key of keys) {
    const val = obj[key];
    if (val != null && val !== '' && val !== 'undefined') return val;
  }
  return fallback;
}

function extractImage(raw, product, matched) {
  return (
    raw.img ||
    raw.image ||
    raw.image_url ||
    raw.imageUrl ||
    raw.product_image ||
    raw.product_image_url ||
    raw.thumbnail ||
    raw.photo ||
    (product && (product.img || product.image || product.image_url || product.thumbnail || product.photo)) ||
    (matched && (matched.img || matched.image || matched.image_url)) ||
    '/logo.png'
  );
}

function normalizeItem(rawItem, index, cartFallback = []) {
  if (!rawItem || typeof rawItem !== 'object') return null;

  const productId = rawItem.product_id ?? rawItem.productId ?? rawItem.id ?? (rawItem.product && rawItem.product.id);
  const variantId = rawItem.variant_id ?? rawItem.variantId ?? (rawItem.variant && rawItem.variant.id);

  // Match against snapshot cart fallback
  const matched = cartFallback.find((c) => {
    const cId = c.product_id ?? c.productId ?? c.id;
    const cVid = c.variant_id ?? c.variantId;
    if (productId && cId && String(cId) === String(productId)) {
      if (variantId && cVid) return String(cVid) === String(variantId);
      return true;
    }
    return false;
  }) || null;

  const product = rawItem.product || (rawItem.variants && rawItem.variants[0]) || null;

  const color =
    pickFirst(rawItem, ['color_name', 'color', 'colorName', 'variant_color']) ||
    pickFirst(product, ['color_name', 'color', 'colorName']) ||
    pickFirst(matched, ['color_name', 'color', 'colorName']);

  const size =
    pickFirst(rawItem, ['size_name', 'size', 'sizeName', 'variant_size']) ||
    pickFirst(product, ['size_name', 'size', 'sizeName']) ||
    pickFirst(matched, ['size_name', 'size', 'sizeName']);

  const title =
    pickFirst(rawItem, ['title', 'product_title', 'product_name', 'name']) ||
    pickFirst(product, ['title', 'name', 'product_title']) ||
    pickFirst(matched, ['title', 'name', 'product_title']) ||
    'JABIYEN Item';

  const image = extractImage(rawItem, product, matched);

  const price = Number(
    rawItem.price ??
    rawItem.unit_price ??
    rawItem.amount ??
    (product && product.price) ??
    (matched && matched.price) ??
    0
  );

  const quantity = Number(rawItem.quantity ?? rawItem.qty ?? (matched && matched.quantity) ?? 1);

  return {
    key: `${productId || 'p'}-${variantId || index}`,
    title: String(title),
    variant: [color, size].filter(Boolean).join(' · ') || 'Selected item',
    image,
    price,
    quantity,
  };
}

function extractCustomer(order, snapshot) {
  if (!order && !snapshot) return {};

  const c =
    order?.customer ||
    order?.shipping_details ||
    order?.recipient ||
    order?.shipping ||
    order?.buyer ||
    {};
  const snapC = snapshot?.customer || {};

  const name =
    pickFirst(c, ['name', 'full_name', 'customer_name', 'fullName']) ||
    pickFirst(order, ['customer_name', 'customerName']) ||
    pickFirst(snapC, ['name', 'full_name']);

  const email =
    pickFirst(c, ['email', 'customer_email']) ||
    pickFirst(order, ['customer_email', 'email']) ||
    pickFirst(snapC, ['email']);

  const phone =
    pickFirst(c, ['phone', 'mobile', 'phone_number', 'customer_phone']) ||
    pickFirst(order, ['customer_phone', 'phone']) ||
    pickFirst(snapC, ['phone', 'mobile']);

  const delivery_notes =
    pickFirst(c, ['delivery_notes', 'notes', 'order_notes']) ||
    pickFirst(order, ['delivery_notes', 'notes']) ||
    pickFirst(snapC, ['delivery_notes']);

  const rawAddress =
    c.address ||
    c.shipping_address ||
    c.delivery_address ||
    order?.shipping_address ||
    order?.delivery_address ||
    order?.address ||
    order?.customer_address ||
    snapC?.address ||
    null;

  return {
    name,
    email,
    phone,
    delivery_notes,
    address: rawAddress,
  };
}

function normalizeAddress(raw) {
  if (!raw || typeof raw !== 'object') return '';

  return [
    pickFirst(raw, ['line1', 'address_line_1', 'addressLine1', 'street', 'street_address']),
    pickFirst(raw, ['line2', 'address_line_2', 'addressLine2']),
    pickFirst(raw, ['line3', 'address_line_3']),
    pickFirst(raw, ['area', 'thana', 'upazila']),
    pickFirst(raw, ['city', 'town']),
    pickFirst(raw, ['district']),
    pickFirst(raw, ['state', 'state_province', 'province', 'region']),
    pickFirst(raw, ['postal_code', 'postcode', 'zip', 'zip_code', 'zipCode']),
    pickFirst(raw, ['country_name', 'country', 'country_code']),
  ]
    .filter(Boolean)
    .join(', ');
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { formatMoney } = useCurrency();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [snapshot, setSnapshot] = useState(null);

  const orderNumber = router.query.order;

  // Load snapshot from sessionStorage (fallback data)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(SNAPSHOT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSnapshot(parsed);
        console.log('[ORDER_CONFIRMATION] Snapshot loaded:', parsed);
      }
    } catch (err) {
      console.warn('[ORDER_CONFIRMATION] Snapshot read error:', err);
    }
  }, []);

  // Read token from URL hash (#token=xxx)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    const match = hash.match(/token=([^&]+)/);
    if (match) setToken(decodeURIComponent(match[1]));
  }, []);

  // Fetch order from API
  useEffect(() => {
    if (!router.isReady) return;

    if (!orderNumber) {
      setStatus('missing');
      return;
    }

    if (!token) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && !window.location.hash.includes('token=')) {
          setStatus('missing');
        }
      }, 300);
      return () => clearTimeout(timer);
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
        // 🔍 Debug log — open browser console to inspect API shape
        console.log('[ORDER_CONFIRMATION] Raw API response:', result);

        if (!response.ok || !result?.success || !result.order) {
          throw new Error(
            (result?.error && (result.error.message || result.error)) ||
            'We could not load your order.'
          );
        }

        setOrder(result.order);
        setStatus('ready');
      })
      .catch((err) => {
        console.error('[ORDER_CONFIRMATION] Fetch error:', err);

        if (err?.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(err?.message || 'We could not load your order.');
        }

        // If snapshot exists, still show what we have
        if (snapshot && Array.isArray(snapshot.items) && snapshot.items.length > 0) {
          console.log('[ORDER_CONFIRMATION] Falling back to snapshot');
          setStatus('ready');
        } else {
          setStatus('error');
        }
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [router.isReady, orderNumber, token, snapshot]);

  // Cart fallback (from snapshot)
  const cartFallback = useMemo(() => snapshot?.items || [], [snapshot]);

  // Normalize items
  const items = useMemo(() => {
    // 1) Try order from API
    if (order) {
      const rawItems =
        order.items ||
        order.display_items ||
        order.order_items ||
        order.line_items ||
        order.products ||
        [];
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        return rawItems
          .map((item, idx) => normalizeItem(item, idx, cartFallback))
          .filter(Boolean);
      }
    }

    // 2) Fallback to snapshot items
    if (cartFallback.length > 0) {
      return cartFallback
        .map((item, idx) => normalizeItem(item, idx, []))
        .filter(Boolean);
    }

    return [];
  }, [order, cartFallback]);

  // Normalize customer
  const customer = useMemo(() => {
    return extractCustomer(order, snapshot);
  }, [order, snapshot]);

  const fullAddressLine = useMemo(() => normalizeAddress(customer.address), [customer.address]);

  // Totals
  const subtotal = useMemo(() => {
    if (order?.subtotal != null) return Number(order.subtotal);
    if (snapshot?.subtotal != null) return Number(snapshot.subtotal);
    return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  }, [order, snapshot, items]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
    [items]
  );

  const deliveryFee = useMemo(() => {
    const rawFee =
      order?.delivery_fee ??
      order?.quoted_delivery_fee ??
      order?.shipping_fee ??
      snapshot?.delivery_fee ??
      snapshot?.shipping_quote?.delivery_fee;
    return rawFee == null ? null : Number(rawFee);
  }, [order, snapshot]);

  const totalAmount = useMemo(() => {
    if (order?.total != null) return Number(order.total);
    if (snapshot?.total != null) return Number(snapshot.total);
    if (deliveryFee == null) return null;
    return subtotal + deliveryFee;
  }, [order, snapshot, subtotal, deliveryFee]);

  const customerInitials = customer?.name ? customer.name.charAt(0).toUpperCase() : 'U';
  const displayOrderNumber =
    order?.order_number || snapshot?.order_number || orderNumber || '—';
  const displayDeliveryType =
    order?.delivery_type || snapshot?.delivery_type || 'Standard';

  const estimatedDaysMin =
    order?.estimated_days_min ?? snapshot?.shipping_quote?.estimated_days_min;
  const estimatedDaysMax =
    order?.estimated_days_max ?? snapshot?.shipping_quote?.estimated_days_max;

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

          {status === 'missing' && (
            <section className="form-block animate-fade-up">
              <div className="minimal-box">
                <p>We could not find your order details. Please check the link or contact support.</p>
                <Link href="/" className="btn-outline">Return to Store</Link>
              </div>
            </section>
          )}

          {status === 'error' && (
            <section className="form-block animate-fade-up">
              <div className="minimal-box">
                <p>{error}</p>
                <Link href="/" className="btn-outline">Return to Store</Link>
              </div>
            </section>
          )}

          {status === 'ready' && (
            <div>
              {/* Success Badge */}
              <section className="form-block animate-fade-up">
                <div className="success-badge">
                  <span className="success-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div className="success-copy">
                    <strong>Thank you for your order</strong>
                    <span>Order #{displayOrderNumber}</span>
                  </div>
                </div>
              </section>

              {/* Product List */}
              {items.length > 0 && (
                <section className="form-block animate-fade-up">
                  <h2 className="section-heading">
                    Your Bag <span className="item-count-label">({totalItems})</span>
                  </h2>
                  <div className="summary-list">
                    {items.map((item, index) => (
                      <div
                        className="summary-item animate-fade-up"
                        key={item.key}
                        style={{ animationDelay: `${index * 0.06}s` }}
                      >
                        <div className="item-img-wrap">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="item-img"
                            onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                          />
                          <span className="item-qty-badge">{item.quantity}</span>
                        </div>
                        <div className="item-details">
                          <h3>{item.title}</h3>
                          <p className="item-variant">{item.variant}</p>
                          <span className="item-price">
                            {formatMoney(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Account & Delivery */}
              {(customer?.name || fullAddressLine) && (
                <section className="form-block profile-block">
                  <h2 className="section-heading">Account & Delivery</h2>
                  <div className="compact-profile animate-fade-up">
                    <div className="profile-top-row">
                      <div className="avatar">{customerInitials}</div>
                      <div className="profile-text">
                        <strong className="profile-name">{customer.name || 'Customer'}</strong>
                        <span className="profile-meta">
                          {[customer.email, customer.phone].filter(Boolean).join(' · ') || 'No contact info'}
                        </span>
                      </div>
                    </div>
                    {fullAddressLine && (
                      <div className="profile-address">
                        <span className="address-label">Delivering to</span>
                        <span className="address-value">{fullAddressLine}</span>
                      </div>
                    )}
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
                  <span>{displayDeliveryType} Delivery</span>
                  <span>
                    {deliveryFee == null
                      ? 'TBD'
                      : deliveryFee === 0
                      ? 'Free'
                      : formatMoney(deliveryFee)}
                  </span>
                </div>
                {estimatedDaysMin && estimatedDaysMax && (
                  <div className="totals-row">
                    <span>Estimated Delivery</span>
                    <span>{estimatedDaysMin}–{estimatedDaysMax} days</span>
                  </div>
                )}
                <div className="totals-row grand-total">
                  <span>Total</span>
                  <strong>{totalAmount == null ? 'TBD' : formatMoney(totalAmount)}</strong>
                </div>
              </div>

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

        .success-badge { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid #000; background: #fafafa; }
        .success-icon { width: 40px; height: 40px; flex-shrink: 0; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
        .success-icon svg { width: 20px; height: 20px; }
        .success-copy { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .success-copy strong { font-size: 12px; font-weight: 600; color: #000; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.3; }
        .success-copy span { font-size: 11px; color: #777; line-height: 1.4; overflow-wrap: anywhere; }

        .summary-list { display: flex; flex-direction: column; gap: 12px; }
        .summary-item { display: flex; align-items: center; gap: 12px; padding: 8px; border: 1px solid #f0f0f0; background: #fafafa; }
        .item-img-wrap { position: relative; width: 48px; height: 60px; flex-shrink: 0; background: #ffffff; overflow: visible; }
        .item-img { width: 100%; height: 100%; object-fit: cover; display: block; border: 1px solid #eaeaea; }
        .item-qty-badge { position: absolute; top: -6px; right: -6px; background: #000; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; border: 2px solid #fff; z-index: 2; }
        .item-details { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .item-details h3 { font-size: 11px; font-weight: 500; margin: 0; color: #000; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-variant { font-size: 10px; color: #777; margin: 0; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-price { font-size: 11px; font-weight: 600; color: #000; display: inline-block; margin-top: 2px; }

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

        .skeleton-profile { display: flex; align-items: center; gap: 12px; }
        .skeleton-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
        .skeleton-lines { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .skeleton-line { height: 12px; border-radius: 4px; }
        .shimmer { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite linear; }

        .order-note-display { padding: 14px; background: #fafafa; border-left: 2px solid #000; font-size: 12px; color: #333; line-height: 1.6; white-space: pre-wrap; }

        .final-totals { margin: 24px 0; padding-top: 20px; border-top: 1px solid #e5e5e5; display: flex; flex-direction: column; gap: 10px; }
        .totals-row { display: flex; justify-content: space-between; font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .totals-row span:last-child { color: #000; }
        .grand-total { margin-top: 8px; font-size: 14px; font-weight: 500; color: #000; }
        .grand-total strong { font-size: 20px; font-weight: 500; display: inline-block; }

        .btn-primary { display: inline-flex; align-items: center; justify-content: center; height: 56px; padding: 0 32px; background: #000; color: #fff; border: none; border-radius: 0; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; cursor: pointer; transition: background 0.3s, transform 0.15s; }
        .btn-primary:hover { background: #333; transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .full-width { width: 100%; }

        .btn-outline { display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 20px; background: transparent; color: #000; border: 1px solid #000; border-radius: 0; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; transition: all 0.2s; }
        .btn-outline:hover { background: #000; color: #fff; }

        .minimal-box { padding: 24px; background: #fafafa; text-align: center; }
        .minimal-box p { margin: 0 0 16px; font-size: 13px; color: #555; line-height: 1.6; }

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
