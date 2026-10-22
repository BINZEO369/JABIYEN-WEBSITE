import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCartState } from '../components/layout/CartDrawer';

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

  return (
    <>
      <Head>
        <title>Payment | JABIYEN</title>
        <meta name="description" content="Choose how to pay for your JABIYEN order." />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <main className="payment-page">
        <div className="payment-shell">
          <div className="topline"><Link href="/checkout" className="back-link">← Back to checkout</Link><span className="eyebrow">JABIYEN · PAYMENT</span></div>
          {draftStatus === 'loading' && <section className="state-card"><span className="spinner" /><h1>Loading payment step…</h1></section>}
          {draftStatus === 'missing' && <section className="state-card"><span className="eyebrow">CHECKOUT DETAILS EXPIRED</span><h1>Let’s confirm your order again<span>.</span></h1><p>Your secure checkout details are unavailable or expired. Return to checkout to review your profile.</p><Link className="dark-button" href="/checkout">Return to checkout <span>↗</span></Link></section>}
          {draftStatus === 'ready' && (
            <>
              <header className="page-heading"><span className="eyebrow">STEP 02 · PAYMENT</span><h1>Choose how to pay<span>.</span></h1><p>Your confirmed profile, address, delivery type, and BDT quote are carried securely to this payment step.</p></header>
              <div className="payment-layout">
                <form className="payment-form" onSubmit={placeOrder}>
                  <section className="payment-card">
                    <div className="section-title"><span className="step-number">02</span><div><span className="eyebrow">AVAILABLE PAYMENT METHOD</span><h2>Payment method</h2></div></div>
                    <label className="method-option">
                      <input type="radio" name="payment_method" value="cash_on_delivery" checked readOnly />
                      <span className="method-icon" aria-hidden="true">৳</span>
                      <span className="method-copy"><strong>Cash on delivery</strong><small>{totalAmount == null ? 'The delivery charge and final BDT total will be advised later. No online payment is taken.' : `Pay the displayed ${money(totalAmount)} BDT total when your order arrives. No online payment is taken.`}</small></span>
                      <span className="available-tag">AVAILABLE</span>
                    </label>
                    {draft.customer.delivery_notes && <div className="note-preview"><span className="eyebrow">YOUR ORDER NOTE</span><p>{draft.customer.delivery_notes}</p></div>}
                  </section>
                  {error && <div className="error-alert" role="alert"><span>!</span><p>{error}</p></div>}
                  <button className="place-order-button" type="submit" disabled={submitting}>
                    {submitting ? <><span className="spinner" /> Submitting your order…</> : <>Place order <span aria-hidden="true">↗</span></>}
                  </button>
                  <p className="privacy-copy">No online payment is taken for cash on delivery.</p>
                </form>
                <aside className="order-summary" aria-label="Order summary">
                  <div className="summary-heading"><div><span className="eyebrow">YOUR SELECTION</span><h2>Order summary</h2></div><span className="item-count">{String(totalItems).padStart(2, '0')}</span></div>
                  <div className="summary-items">
                    {items.map((item, index) => (
                      <div className="summary-item" key={`${item.title}-${index}`}>
                        <div className="quantity-badge">{item.quantity || 1}</div>
                        <div className="item-copy"><strong>{item.title || 'JABIYEN item'}</strong><span>{[item.color_name, item.size_name].filter(Boolean).join(' · ') || 'Selected item'}</span></div>
                        <strong className="item-price">{money(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="rule" />
                  <div className="summary-row"><span>Items ({totalItems})</span><span>{money(subtotal)}</span></div>
                  <div className="summary-row"><span>{draft.delivery_type} delivery</span><span>{deliveryFee == null ? 'আপনাকে পরে জানানো হবে' : deliveryFee === 0 ? 'Free' : money(deliveryFee)}</span></div>
                  {draft.shipping_quote.estimated_days_min && draft.shipping_quote.estimated_days_max && <div className="summary-row"><span>Estimated delivery</span><span>{draft.shipping_quote.estimated_days_min}–{draft.shipping_quote.estimated_days_max} days</span></div>}
                  <div className="rule" />
                  <div className="summary-row total"><span>Total due at delivery</span><strong>{totalAmount == null ? 'আপনাকে পরে জানানো হবে' : money(totalAmount)}</strong></div>
                  <div className="profile-summary"><span className="eyebrow">DELIVERING TO · BDT</span><strong>{draft.customer.name}</strong><span>{[draft.customer.address.line1, draft.customer.address.city, draft.customer.address.state, draft.customer.address.district, draft.customer.address.postal_code, draft.shipping_quote.country_name || draft.customer.address.country_code].filter(Boolean).join(', ')}</span></div>
                </aside>
              </div>
            </>
          )}
          <footer className="payment-footer"><span>JABIYEN · MADE FOR EVERY DAY</span><Link href="/">Return to store</Link></footer>
        </div>
      </main>
      <style jsx>{`
        .payment-page{min-height:calc(100vh - 150px);padding:clamp(100px,11vw,132px) 18px 64px;background:#f5f3ef;color:#171715}.payment-shell{width:min(100%,1000px);margin:0 auto}.topline{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:1px solid #dfdbd3}.back-link{color:#49473f;font-size:11px;font-weight:700;text-decoration:none}.eyebrow{color:#8a857b;font-size:9px;font-weight:850;letter-spacing:.15em}.page-heading{padding:38px 0 26px}.page-heading h1,.state-card h1{margin:9px 0;font:400 clamp(38px,7vw,58px)/1 Georgia,'Times New Roman',serif;letter-spacing:-.05em}.page-heading h1 span,.state-card h1 span{color:#b17d46}.page-heading p,.state-card p{margin:0;color:#77736b;font-size:12px;line-height:1.7}.payment-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);align-items:start;gap:18px}.payment-card,.order-summary,.state-card{border:1px solid #e5e1d9;border-radius:16px;background:#fff;box-shadow:0 10px 32px rgba(33,31,26,.025)}.payment-card{padding:clamp(20px,3vw,30px);margin-bottom:14px}.section-title{display:flex;align-items:center;gap:14px;margin-bottom:22px}.step-number{display:grid;width:34px;height:34px;flex:0 0 34px;place-items:center;border:1px solid #e9e5dd;border-radius:50%;color:#9a764e;font:italic 14px Georgia,serif}.section-title h2,.summary-heading h2{margin:4px 0 0;color:#26251f;font:400 23px Georgia,'Times New Roman',serif}.method-option{display:flex;align-items:center;gap:12px;padding:16px 14px;border:1px solid #b9a17f;border-radius:12px;background:#fcfaf6;cursor:default}.method-option input{width:16px;height:16px;accent-color:#80623e}.method-icon{display:grid;width:38px;height:38px;flex:0 0 38px;place-items:center;border-radius:11px;background:#eee7dc;color:#655238;font:18px Georgia,serif}.method-copy{display:grid;flex:1;gap:5px}.method-copy strong{color:#2c2a24;font-size:11px}.method-copy small{color:#868176;font-size:9px;line-height:1.6}.available-tag{flex:0 0 auto;color:#588066;font-size:8px;font-weight:850;letter-spacing:.1em}.note-preview{margin-top:16px;padding:13px;border-radius:10px;background:#f7f5f0}.note-preview p{margin:7px 0 0;color:#555147;font-size:10px;line-height:1.6;white-space:pre-wrap}.place-order-button,.dark-button{display:flex;width:100%;min-height:52px;align-items:center;justify-content:center;gap:14px;border:0;border-radius:999px;background:#1b1a17;color:#fff;font-size:11px;font-weight:800;text-decoration:none;cursor:pointer}.place-order-button:disabled{opacity:.6;cursor:wait}.privacy-copy{margin:11px 0 0;color:#928c82;font-size:9px;text-align:center}.error-alert{display:flex;gap:9px;margin-bottom:13px;padding:13px;border:1px solid #ebcac5;border-radius:10px;background:#fff8f6;color:#8b423d}.error-alert p{margin:0;font-size:11px;line-height:1.55}.spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.28);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.order-summary{position:sticky;top:112px;padding:24px}.summary-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.item-count{color:#b5aea2;font:italic 29px Georgia,serif}.summary-items{display:grid;gap:13px;max-height:300px;overflow:auto}.summary-item{display:flex;align-items:center;gap:10px}.quantity-badge{display:grid;width:24px;height:24px;flex:0 0 24px;place-items:center;border-radius:50%;background:#2a2924;color:#fff;font-size:9px;font-weight:800}.item-copy{display:grid;min-width:0;flex:1;gap:4px}.item-copy strong{overflow:hidden;color:#3c3a34;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.item-copy span{color:#8f897e;font-size:9px}.item-price{color:#39372f;font-size:10px}.rule{height:1px;margin:17px 0;background:#eeeae3}.summary-row{display:flex;justify-content:space-between;gap:12px;margin:10px 0;color:#77736a;font-size:10px}.summary-row>span:last-child{color:#45433c;font-weight:700}.summary-row .pending{color:#997444}.summary-row.total{align-items:center;color:#292823}.summary-row.total strong{font:400 22px Georgia,'Times New Roman',serif}.profile-summary{display:grid;gap:7px;margin-top:18px;padding:14px;border-radius:10px;background:#f7f5f0}.profile-summary strong{color:#3c3a34;font-size:11px}.profile-summary>span:last-child{color:#77736b;font-size:9px;line-height:1.6}.state-card{display:flex;min-height:300px;flex-direction:column;align-items:flex-start;justify-content:center;margin-top:35px;padding:clamp(24px,5vw,40px)}.state-card .dark-button{width:auto;margin-top:20px;padding:0 20px}.payment-footer{display:flex;justify-content:space-between;gap:10px;margin-top:34px;padding-top:16px;border-top:1px solid #dfdbd3;color:#9a9489;font-size:8px;font-weight:800;letter-spacing:.12em}.payment-footer a{color:#625e55;text-decoration:none;letter-spacing:normal}@media(max-width:720px){.payment-page{padding:97px 14px 48px}.payment-layout{grid-template-columns:1fr}.order-summary{position:static;grid-row:1;padding:19px}.payment-form{grid-row:2}.page-heading{padding:32px 0 23px}.payment-footer{margin-top:25px}}@media(max-width:430px){.method-option{gap:8px;padding:12px 9px}.method-copy small{max-width:190px}.available-tag{font-size:7px}}@media(prefers-reduced-motion:reduce){.spinner{animation-duration:2s}}
      `}</style>
    </>
  );
}
