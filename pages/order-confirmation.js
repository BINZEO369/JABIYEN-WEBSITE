import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

function money(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!router.isReady) return undefined;
    const orderNumber = Array.isArray(router.query.order) ? router.query.order[0] : router.query.order;
    const token = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.hash.slice(1)).get('token')
      : null;
    if (!orderNumber || !token) {
      setStatus('error');
      setMessage('The private order link is incomplete. Use the confirmation link from checkout on this device.');
      return undefined;
    }

    const controller = new AbortController();
    setStatus('loading');
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}`, {
      method: 'GET', headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, cache: 'no-store', credentials: 'same-origin', signal: controller.signal,
    }).then(async (response) => {
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.order) throw new Error(result?.error || 'We could not load this order.');
      setOrder(result.order);
      setStatus('loaded');
    }).catch((error) => {
      if (error?.name === 'AbortError') return;
      setMessage(error instanceof Error ? error.message : 'Order details are temporarily unavailable.');
      setStatus('error');
    });
    return () => controller.abort();
  }, [router.isReady, router.query.order]);

  return (
    <>
      <Head>
        <title>Order received | JABIYEN</title>
        <meta name="description" content="JABIYEN order confirmation." />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <main className="confirmation-page">
        <div className="confirmation-shell">
          <div className="topline"><Link href="/" className="back-link">← Back to store</Link><span className="eyebrow">JABIYEN · ORDER DESK</span></div>
          {status === 'loading' && <section className="state-card"><span className="spinner" /><span className="eyebrow">SECURE ORDER LOOKUP</span><h1>Retrieving your order…</h1><p>We’re checking your private confirmation details.</p></section>}
          {status === 'error' && <section className="state-card"><span className="eyebrow">ORDER LINK</span><h1>We couldn’t open this order<span>.</span></h1><p>{message}</p><Link className="dark-button" href="/">Return to store <span>↗</span></Link></section>}
          {status === 'loaded' && order && (
            <>
              <section className="success-heading">
                <div className="success-mark" aria-hidden="true">✓</div>
                <span className="eyebrow">ORDER RECEIVED</span>
                <h1>Thank you<span>.</span></h1>
                <p>Your JABIYEN order is in. The delivery charge and total below are calculated in BDT from your saved delivery address.</p>
              </section>
              <section className="order-card">
                <div className="order-top"><div><span className="eyebrow">YOUR ORDER NUMBER</span><h2>{order.order_number}</h2></div><span className="status-pill"><i /> {String(order.status || 'pending_confirmation').replaceAll('_', ' ')}</span></div>
                <div className="order-meta"><span>Placed {order.created_at ? new Date(order.created_at).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }) : 'just now'}</span><span>Cash on delivery</span></div>
                <div className="order-lines">
                  {(order.items || []).map((item, index) => (
                    <div className="order-line" key={`${item.sku || item.product_name}-${index}`}>
                      <div className="item-copy"><strong>{item.product_name}</strong><span>{[item.color_name, item.size_name, item.variant_name].filter(Boolean).join(' · ') || 'JABIYEN collection'}</span><small>Qty {item.quantity} × {money(item.unit_price)}</small></div>
                      <strong>{money(item.line_total)}</strong>
                    </div>
                  ))}
                </div>
                <div className="totals">
                  <div><span>Items subtotal</span><strong>{money(order.subtotal)}</strong></div>
                  <div><span>{order.delivery_type || 'Standard'} delivery fee</span><strong className={order.delivery_fee == null ? 'pending-fee' : ''}>{order.delivery_fee == null ? 'আপনাকে পরে জানানো হবে' : order.delivery_fee === 0 ? '৳0.00' : money(order.delivery_fee)}</strong></div>
                  <div><span>Estimated delivery</span><strong>{order.estimated_days_min && order.estimated_days_max ? `${order.estimated_days_min}–${order.estimated_days_max} days` : 'আপনাকে পরে জানানো হবে'}</strong></div>
                  <div className="due-row"><span>Cash due at delivery · BDT</span><strong>{order.total_amount == null ? 'আপনাকে পরে জানানো হবে' : money(order.total_amount)}</strong></div>
                </div>
                <div className="cod-note"><span aria-hidden="true">৳</span><p><strong>No online payment was taken.</strong><br />Pay the displayed total in BDT when your order arrives. JABIYEN may contact you to confirm delivery details.</p></div>
              </section>
              <section className="delivery-card">
                <div><span className="eyebrow">DELIVERING TO</span><h2>{order.customer?.name || 'Customer'}</h2><p>{order.customer?.phone}</p><p>{[order.shipping_address?.line1, order.shipping_address?.line2, order.shipping_address?.city, order.shipping_address?.state || order.shipping_address?.state_province || order.shipping_address?.district, order.shipping_address?.postal_code, order.shipping_address?.country_code].filter(Boolean).join(', ')}</p></div>
                <span className="delivery-icon" aria-hidden="true">⌂</span>
              </section>
              <div className="bottom-actions"><Link className="dark-button" href="/">Continue shopping <span>↗</span></Link><span>We’ll contact you if any detail needs confirming.</span></div>
            </>
          )}
          <footer className="confirmation-footer"><span>JABIYEN · MADE FOR EVERY DAY</span><Link href="/">Return to store</Link></footer>
        </div>
      </main>
      <style jsx>{`
        .confirmation-page { min-height:calc(100vh - 150px); padding:clamp(100px,11vw,132px) 18px 64px; background:#f5f3ef; color:#1a1916; }
        .confirmation-shell { width:min(100%,820px); margin:0 auto; }
        .topline { display:flex; align-items:center; justify-content:space-between; padding-bottom:20px; border-bottom:1px solid #dfdbd3; }
        .back-link { color:#49473f; font-size:11px; font-weight:700; text-decoration:none; }
        .eyebrow { color:#8a857b; font-size:9px; font-weight:850; letter-spacing:.15em; }
        .state-card { display:flex; min-height:360px; flex-direction:column; align-items:flex-start; justify-content:center; padding:40px 0; }
        .state-card h1,.success-heading h1 { margin:11px 0 9px; font:400 clamp(39px,7vw,61px)/1 Georgia,'Times New Roman',serif; letter-spacing:-.055em; }
        .state-card h1 span,.success-heading h1 span { color:#ae7842; }
        .state-card p,.success-heading p { max-width:540px; margin:0; color:#77736b; font-size:12px; line-height:1.7; }
        .spinner { width:25px; height:25px; margin-bottom:18px; border:2px solid #e7e2d9; border-top-color:#21201b; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .success-heading { padding:clamp(35px,7vw,64px) 0 28px; }
        .success-mark { display:grid; width:43px; height:43px; margin-bottom:22px; place-items:center; border:1px solid #dce7da; border-radius:50%; background:#f1f7ef; color:#557951; font-size:20px; }
        .success-heading h1 { margin-top:8px; }
        .order-card,.delivery-card { border:1px solid #e4e0d8; border-radius:16px; background:#fff; box-shadow:0 10px 32px rgba(33,31,26,.025); }
        .order-card { padding:clamp(20px,4vw,32px); }
        .order-top { display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .order-top h2 { margin:6px 0 0; color:#292823; font:400 clamp(21px,4vw,30px) Georgia,serif; letter-spacing:.01em; }
        .status-pill { display:inline-flex; align-items:center; gap:7px; padding:8px 11px; border:1px solid #ecdcc7; border-radius:999px; background:#fdf8f0; color:#7b5c38; font-size:9px; font-weight:800; text-transform:capitalize; }
        .status-pill i { width:6px; height:6px; border-radius:50%; background:#b88951; }
        .order-meta { display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px; margin-top:15px; padding-bottom:18px; border-bottom:1px solid #eeeae3; color:#8c867c; font-size:10px; }
        .order-lines { display:grid; gap:13px; padding:20px 0; }
        .order-line { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; color:#3c3a34; font-size:11px; }
        .item-copy { display:grid; gap:5px; }
        .item-copy span,.item-copy small { color:#898479; font-size:9px; }
        .item-copy small { color:#9b958b; }
        .totals { padding-top:17px; border-top:1px solid #eeeae3; }
        .totals>div { display:flex; justify-content:space-between; gap:15px; margin:11px 0; color:#77736a; font-size:10px; }
        .totals strong { color:#3c3a34; font-size:10px; }
        .totals .pending-fee { color:#987441; }
        .totals .due-row { align-items:center; margin-top:17px; padding-top:16px; border-top:1px solid #eeeae3; color:#292823; font-weight:800; }
        .totals .due-row strong { color:#292823; font:400 17px Georgia,serif; text-align:right; }
        .cod-note { display:flex; gap:11px; align-items:center; margin-top:18px; padding:14px; border-radius:10px; background:#f7f5f0; }
        .cod-note>span { display:grid; width:30px; height:30px; flex:0 0 30px; place-items:center; border-radius:50%; background:#ebe5da; color:#6e5738; font:16px Georgia,serif; }
        .cod-note p { margin:0; color:#777268; font-size:9px; line-height:1.65; }
        .cod-note strong { color:#4c493f; }
        .delivery-card { display:flex; justify-content:space-between; gap:20px; margin-top:14px; padding:22px clamp(20px,4vw,32px); }
        .delivery-card h2 { margin:7px 0; font:400 20px Georgia,serif; }
        .delivery-card p { margin:4px 0; color:#77736b; font-size:10px; line-height:1.6; }
        .delivery-icon { display:grid; width:36px; height:36px; flex:0 0 36px; place-items:center; border:1px solid #e9e5dd; border-radius:50%; color:#927249; font:21px Georgia,serif; }
        .bottom-actions { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-top:21px; }
        .dark-button { display:inline-flex; min-height:44px; align-items:center; justify-content:center; gap:13px; padding:0 19px; border-radius:999px; background:#1b1a17; color:#fff; font-size:10px; font-weight:800; text-decoration:none; }
        .bottom-actions>span { color:#908a7f; font-size:9px; text-align:right; }
        .confirmation-footer { display:flex; justify-content:space-between; gap:10px; margin-top:34px; padding-top:16px; border-top:1px solid #dfdbd3; color:#9a9489; font-size:8px; font-weight:800; letter-spacing:.12em; }
        .confirmation-footer a { color:#625e55; text-decoration:none; letter-spacing:normal; }
        @media(max-width:500px){.confirmation-page{padding:96px 14px 48px}.order-top{align-items:flex-start; flex-direction:column}.status-pill{align-self:flex-start}.order-card{padding:20px 16px}.bottom-actions{align-items:flex-start; flex-direction:column}.bottom-actions>span{text-align:left}.delivery-card{padding:20px 16px}}
      `}</style>
    </>
  );
}
