import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCartState } from '../components/layout/CartDrawer';

function money(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function newAccessToken() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function checkoutKeys() {
  const key = 'jabiyen_pending_checkout_v1';
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(key) || 'null');
    if (saved?.idempotency_key && saved?.access_token) return saved;
  } catch {}
  const idempotencyKey = window.crypto?.randomUUID?.()
    || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.random() * 16 | 0;
      return (char === 'x' ? random : (random & 0x3 | 0x8)).toString(16);
    });
  const saved = { idempotency_key: idempotencyKey, access_token: newAccessToken() };
  window.sessionStorage.setItem(key, JSON.stringify(saved));
  return saved;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart: storedCart, clearCart } = useCartState();
  const [cart, setCart] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', line1: '', line2: '', district: '', city: '', postal_code: '', delivery_notes: '',
  });

  useEffect(() => {
    setMounted(true);
    setCart(Array.isArray(storedCart) ? storedCart : []);
  }, [storedCart]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0), [cart]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    if (error) setError('');
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setError('');
    if (!cart.length) {
      setError('Your shopping bag is empty. Add an item before checking out.');
      return;
    }
    if (!event.currentTarget.reportValidity()) return;

    setSubmitting(true);
    try {
      const keys = checkoutKeys();
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin',
        body: JSON.stringify({
          ...keys,
          customer: {
            name: form.name,
            phone: form.phone,
            email: form.email,
            address: {
              line1: form.line1,
              line2: form.line2,
              district: form.district,
              city: form.city,
              postal_code: form.postal_code,
              country_code: 'BD',
            },
            delivery_notes: form.delivery_notes,
          },
          items: cart.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: Number(item.quantity || 1),
          })),
          website: '',
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.order?.order_number) {
        throw new Error(result?.error || 'We could not place your order. Please check your connection and try again.');
      }

      clearCart();
      window.sessionStorage.removeItem('jabiyen_pending_checkout_v1');
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
        <title>Checkout | JABIYEN</title>
        <meta name="description" content="Secure JABIYEN checkout with cash on delivery." />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <main className="checkout-page">
        <div className="checkout-shell">
          <div className="checkout-topline">
            <Link href="/" className="back-link">← Continue shopping</Link>
            <span className="secure-note"><span aria-hidden="true">◆</span> SECURE CHECKOUT</span>
          </div>
          <header className="checkout-heading">
            <div><span className="eyebrow">JABIYEN · YOUR ORDER</span><h1>Checkout<span>.</span></h1><p>Delivery details first. Pay cash when your order arrives.</p></div>
            <div className="step-marker"><span>01</span><i /> <span>02</span><i /> <span>03</span></div>
          </header>

          {mounted && cart.length === 0 ? (
            <section className="empty-card">
              <span className="eyebrow">NOTHING IN YOUR BAG YET</span>
              <h2>Your next favourite starts here.</h2>
              <p>Choose something from the collection and it will be waiting here at checkout.</p>
              <Link href="/" className="dark-button">Explore the collection <span>↗</span></Link>
            </section>
          ) : (
            <div className="checkout-layout">
              <form className="checkout-form" onSubmit={placeOrder}>
                <section className="form-section">
                  <div className="section-title"><span className="section-number">01</span><div><span className="eyebrow">WHO SHOULD WE CONTACT?</span><h2>Contact details</h2></div></div>
                  <div className="field-grid">
                    <label className="field full"><span>Full name <b>*</b></span><input name="name" autoComplete="name" value={form.name} onChange={update} required minLength={2} maxLength={120} placeholder="Name for the delivery" /></label>
                    <label className="field"><span>Mobile number <b>*</b></span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={update} required pattern="[0-9+() .-]{8,24}" placeholder="01XXXXXXXXX" /><small>Bangladesh mobile number</small></label>
                    <label className="field"><span>Email <em>Optional</em></span><input name="email" type="email" autoComplete="email" value={form.email} onChange={update} maxLength={254} placeholder="you@example.com" /></label>
                  </div>
                </section>

                <section className="form-section">
                  <div className="section-title"><span className="section-number">02</span><div><span className="eyebrow">WHERE SHOULD WE DELIVER?</span><h2>Delivery address</h2></div></div>
                  <div className="field-grid">
                    <label className="field full"><span>Street address <b>*</b></span><input name="line1" autoComplete="address-line1" value={form.line1} onChange={update} required minLength={4} maxLength={240} placeholder="House, road, building, area" /></label>
                    <label className="field full"><span>Apartment, floor, landmark <em>Optional</em></span><input name="line2" autoComplete="address-line2" value={form.line2} onChange={update} maxLength={240} placeholder="Additional directions for the courier" /></label>
                    <label className="field"><span>District <b>*</b></span><input name="district" autoComplete="address-level1" value={form.district} onChange={update} required minLength={2} maxLength={100} placeholder="District" /></label>
                    <label className="field"><span>City / Upazila <b>*</b></span><input name="city" autoComplete="address-level2" value={form.city} onChange={update} required minLength={2} maxLength={100} placeholder="City or upazila" /></label>
                    <label className="field"><span>Postcode <em>Optional</em></span><input name="postal_code" autoComplete="postal-code" value={form.postal_code} onChange={update} maxLength={20} placeholder="Postcode" /></label>
                    <label className="field"><span>Country</span><input value="Bangladesh" readOnly aria-readonly="true" /></label>
                    <label className="field full"><span>Delivery note <em>Optional</em></span><textarea name="delivery_notes" value={form.delivery_notes} onChange={update} maxLength={500} rows={3} placeholder="Anything the delivery team should know?" /></label>
                  </div>
                </section>

                <section className="form-section payment-section">
                  <div className="section-title"><span className="section-number">03</span><div><span className="eyebrow">PAYMENT METHOD</span><h2>Pay on delivery</h2></div></div>
                  <div className="cod-choice">
                    <span className="radio-outer"><span /></span>
                    <span className="cod-icon" aria-hidden="true">৳</span>
                    <span className="cod-copy"><strong>Cash on delivery</strong><small>Pay cash to the delivery person when your order arrives.</small></span>
                    <span className="active-tag">AVAILABLE</span>
                  </div>
                  <p className="fee-note">Delivery fee and final payable amount will be confirmed with you by phone before dispatch. No online payment is taken at checkout.</p>
                </section>

                {error && <div className="error-alert" role="alert"><span aria-hidden="true">!</span><p>{error}</p></div>}
                <button className="place-order-button" type="submit" disabled={submitting || (mounted && !cart.length)}>
                  {submitting ? <><span className="spinner" /> Submitting your order…</> : <>Place COD order <span aria-hidden="true">↗</span></>}
                </button>
                <p className="privacy-copy">By placing your order, you agree that JABIYEN may contact you to confirm delivery details.</p>
              </form>

              <aside className="order-summary" aria-label="Order summary">
                <div className="summary-heading"><div><span className="eyebrow">YOUR SELECTION</span><h2>Order summary</h2></div><span className="item-count">{String(totalItems).padStart(2, '0')}</span></div>
                <div className="summary-items">
                  {cart.map((item, index) => (
                    <div className="summary-item" key={`${item.product_id}-${item.variant_id || index}-${item.id || index}`}>
                      <div className="summary-image-wrap"><img src={item.img || '/logo.png'} alt="" className="summary-image" onError={(event) => { event.currentTarget.src = '/logo.png'; }} /><span className="quantity-badge">{item.quantity || 1}</span></div>
                      <div className="summary-item-copy"><strong>{item.title || 'JABIYEN item'}</strong><span>{[item.color_name, item.size_name].filter(Boolean).join(' · ') || 'Selected item'}</span></div>
                      <strong className="summary-item-price">{money(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
                    </div>
                  ))}
                </div>
                <div className="summary-rule" />
                <div className="summary-row"><span>Items ({totalItems})</span><span>{money(subtotal)}</span></div>
                <div className="summary-row"><span>Delivery</span><span className="to-confirm">To be confirmed</span></div>
                <div className="summary-rule" />
                <div className="summary-row total-row"><span>Current subtotal</span><strong>{money(subtotal)}</strong></div>
                <p className="summary-footnote">Final total = current product prices + delivery fee confirmed by our team. Your order is not charged online.</p>
                <div className="summary-trust"><span>✓</span><span>Cash on delivery<br /><small>No advance payment</small></span></div>
                <div className="summary-trust"><span>✓</span><span>Price checked securely<br /><small>Confirmed against current catalog</small></span></div>
              </aside>
            </div>
          )}
          <footer className="checkout-footer"><span>JABIYEN · MADE FOR EVERY DAY</span><Link href="/">Return to store</Link></footer>
        </div>
      </main>
      <style jsx>{`
        .checkout-page { min-height: calc(100vh - 150px); padding: clamp(100px, 11vw, 132px) 18px 66px; background:#f5f3ef; color:#171715; }
        .checkout-shell { width:min(100%, 1120px); margin:0 auto; }
        .checkout-topline { display:flex; align-items:center; justify-content:space-between; padding-bottom:22px; border-bottom:1px solid #dfdbd3; }
        .back-link { color:#49473f; text-decoration:none; font-size:11px; font-weight:700; }
        .back-link:hover { color:#a47241; }
        .secure-note,.eyebrow { color:#8a857b; font-size:9px; font-weight:850; letter-spacing:.15em; }
        .secure-note { display:flex; gap:8px; align-items:center; }
        .secure-note span { font-size:7px; color:#a77e4f; }
        .checkout-heading { display:flex; justify-content:space-between; align-items:flex-end; padding:42px 0 29px; }
        .checkout-heading h1 { margin:9px 0 8px; font:400 clamp(42px,7vw,66px)/.98 Georgia,'Times New Roman',serif; letter-spacing:-.055em; }
        .checkout-heading h1 span { color:#b17d46; }
        .checkout-heading p { margin:0; color:#77736b; font-size:12px; }
        .step-marker { display:flex; align-items:center; gap:9px; color:#bbb5aa; font:700 9px Inter, sans-serif; letter-spacing:.08em; }
        .step-marker span:first-child { color:#1d1c18; }
        .step-marker i { width:28px; height:1px; background:#ddd8cf; }
        .checkout-layout { display:grid; grid-template-columns:minmax(0,1.4fr) minmax(280px,.8fr); align-items:start; gap:22px; }
        .checkout-form { min-width:0; }
        .form-section,.order-summary,.empty-card { border:1px solid #e5e1d9; border-radius:16px; background:#fff; box-shadow:0 10px 32px rgba(33,31,26,.025); }
        .form-section { padding:clamp(20px,3vw,30px); margin-bottom:14px; }
        .section-title { display:flex; align-items:center; gap:14px; margin-bottom:24px; }
        .section-number { display:grid; width:34px; height:34px; flex:0 0 34px; place-items:center; border:1px solid #e9e5dd; border-radius:50%; color:#9a764e; font:italic 14px Georgia,serif; }
        .section-title h2,.summary-heading h2 { margin:4px 0 0; color:#26251f; font:400 23px Georgia,'Times New Roman',serif; letter-spacing:-.025em; }
        .field-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:17px 13px; }
        .field { display:flex; min-width:0; flex-direction:column; gap:7px; }
        .field.full { grid-column:1/-1; }
        .field>span { color:#4e4b43; font-size:10px; font-weight:750; }
        .field b { color:#ab684b; }
        .field em { margin-left:4px; color:#a29c91; font-size:9px; font-style:normal; font-weight:500; }
        .field input,.field textarea { width:100%; min-height:45px; padding:11px 12px; border:1px solid #e5e1d9; border-radius:9px; outline:none; background:#fff; color:#292823; font:500 12px Inter,Arial,sans-serif; transition:border .15s,box-shadow .15s; }
        .field input:focus,.field textarea:focus { border-color:#a77b4c; box-shadow:0 0 0 3px rgba(167,123,76,.1); }
        .field input::placeholder,.field textarea::placeholder { color:#aaa59b; font-weight:400; }
        .field input[readonly] { background:#f8f7f4; color:#827d72; }
        .field small { color:#9b958a; font-size:9px; }
        .field textarea { resize:vertical; min-height:76px; }
        .cod-choice { display:flex; align-items:center; gap:12px; padding:15px 14px; border:1px solid #b9a17f; border-radius:12px; background:#fcfaf6; }
        .radio-outer { display:grid; width:17px; height:17px; flex:0 0 17px; place-items:center; border:1px solid #6d5c45; border-radius:50%; }
        .radio-outer span { width:8px; height:8px; border-radius:50%; background:#80623e; }
        .cod-icon { display:grid; width:37px; height:37px; flex:0 0 37px; place-items:center; border-radius:11px; background:#eee7dc; color:#655238; font:18px Georgia,serif; }
        .cod-copy { display:grid; gap:4px; flex:1; }
        .cod-copy strong { color:#2c2a24; font-size:11px; }
        .cod-copy small { color:#868176; font-size:9px; line-height:1.5; }
        .active-tag { flex:0 0 auto; color:#588066; font-size:8px; font-weight:850; letter-spacing:.1em; }
        .fee-note { margin:13px 0 0 1px; color:#827c72; font-size:10px; line-height:1.65; }
        .place-order-button,.dark-button { display:flex; width:100%; min-height:52px; align-items:center; justify-content:center; gap:14px; border:0; border-radius:999px; background:#1b1a17; color:#fff; font-size:11px; font-weight:800; text-decoration:none; cursor:pointer; transition:background .18s,transform .18s; }
        .place-order-button:hover:not(:disabled),.dark-button:hover { background:#3e3b33; transform:translateY(-1px); }
        .place-order-button:disabled { opacity:.6; cursor:wait; }
        .place-order-button span { font-size:15px; }
        .privacy-copy { margin:11px 0 0; color:#928c82; font-size:9px; line-height:1.6; text-align:center; }
        .error-alert { display:flex; align-items:flex-start; gap:9px; margin-bottom:13px; padding:13px 14px; border:1px solid #ebcac5; border-radius:10px; background:#fff8f6; color:#8b423d; }
        .error-alert>span { display:grid; width:17px; height:17px; flex:0 0 17px; place-items:center; border:1px solid #d9aaa2; border-radius:50%; font-size:10px; }
        .error-alert p { margin:0; font-size:11px; line-height:1.55; }
        .spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,.28); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .order-summary { position:sticky; top:112px; padding:24px; }
        .summary-heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:19px; }
        .item-count { color:#b5aea2; font:italic 29px Georgia,serif; }
        .summary-items { display:grid; gap:15px; max-height:330px; overflow-y:auto; padding-right:2px; }
        .summary-item { display:flex; align-items:center; gap:10px; min-width:0; }
        .summary-image-wrap { position:relative; width:51px; height:58px; flex:0 0 51px; }
        .summary-image { width:100%; height:100%; border:1px solid #eeeae3; border-radius:8px; background:#f6f4ef; object-fit:cover; }
        .quantity-badge { position:absolute; top:-6px; right:-6px; display:grid; width:18px; height:18px; place-items:center; border-radius:50%; background:#2a2924; color:#fff; font-size:9px; font-weight:800; }
        .summary-item-copy { display:grid; min-width:0; flex:1; gap:5px; }
        .summary-item-copy strong { overflow:hidden; color:#3c3a34; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
        .summary-item-copy span { overflow:hidden; color:#8f897e; font-size:9px; text-overflow:ellipsis; white-space:nowrap; }
        .summary-item-price { flex:0 0 auto; color:#39372f; font-size:10px; }
        .summary-rule { height:1px; margin:18px 0; background:#eeeae3; }
        .summary-row { display:flex; justify-content:space-between; gap:12px; margin:11px 0; color:#77736a; font-size:10px; }
        .summary-row>span:last-child { color:#45433c; font-weight:700; }
        .summary-row .to-confirm { color:#997444 !important; font-weight:650; }
        .total-row { align-items:center; color:#292823; font-size:11px; }
        .total-row strong { font:400 23px Georgia,'Times New Roman',serif; }
        .summary-footnote { margin:12px 0 17px; padding:11px; border-radius:8px; background:#f7f5f0; color:#827d72; font-size:9px; line-height:1.6; }
        .summary-trust { display:flex; align-items:center; gap:10px; padding:11px 0; border-top:1px solid #f0eee9; color:#514f47; font-size:9px; font-weight:700; line-height:1.5; }
        .summary-trust>span:first-child { display:grid; width:22px; height:22px; flex:0 0 22px; place-items:center; border-radius:50%; background:#edf3ec; color:#547554; font-size:11px; }
        .summary-trust small { color:#969084; font-size:8px; font-weight:500; }
        .empty-card { display:flex; min-height:290px; flex-direction:column; align-items:flex-start; justify-content:center; padding:clamp(25px,6vw,56px); }
        .empty-card h2 { margin:9px 0; font:400 clamp(27px,4vw,36px) Georgia,serif; }
        .empty-card p { max-width:430px; margin:0 0 22px; color:#77736b; font-size:12px; line-height:1.7; }
        .dark-button { width:auto; padding:0 20px; }
        .checkout-footer { display:flex; justify-content:space-between; gap:10px; margin-top:36px; padding-top:17px; border-top:1px solid #dfdbd3; color:#9a9489; font-size:8px; font-weight:800; letter-spacing:.12em; }
        .checkout-footer a { color:#625e55; text-decoration:none; letter-spacing:normal; }
        @media(max-width:800px){.checkout-layout{grid-template-columns:minmax(0,1fr) minmax(260px,.8fr);gap:13px}.order-summary{padding:18px}.form-section{padding:21px 18px}}
        @media(max-width:680px){.checkout-page{padding:97px 14px 48px}.checkout-heading{padding:32px 0 23px}.step-marker{gap:5px}.step-marker i{width:16px}.checkout-layout{grid-template-columns:1fr}.order-summary{position:static;grid-row:1;padding:19px}.checkout-form{grid-row:2}.summary-items{max-height:250px}.checkout-footer{margin-top:25px}}
        @media(max-width:430px){.field-grid{grid-template-columns:1fr;gap:14px}.field.full{grid-column:auto}.checkout-heading p{max-width:230px;line-height:1.55}.secure-note{font-size:8px}.active-tag{font-size:7px}.cod-choice{gap:8px;padding:12px 9px}.cod-copy small{max-width:190px}.form-section{padding:19px 15px}}
        @media(prefers-reduced-motion:reduce){.spinner{animation-duration:2s}.place-order-button,.dark-button{transition:none}}
      `}</style>
    </>
  );
}
