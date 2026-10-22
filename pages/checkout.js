import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCartState } from '../components/layout/CartDrawer';

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
    district: address?.district || address?.state_province || address?.city || address?.area || '',
    city: address?.city || address?.area || address?.district || address?.state_province || '',
    postal_code: address?.postal_code || '',
    country_code: /^[A-Z]{2}$/.test(rawCountryCode) ? rawCountryCode : 'BD',
  };
}

function money(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart: storedCart } = useCartState();
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
  const address = primaryAddress ? addressFields(primaryAddress, profile) : null;

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
      <main className="checkout-page">
        <div className="checkout-shell">
          <div className="checkout-topline">
            <Link href="/" className="back-link">← Continue shopping</Link>
            <span className="secure-note"><span aria-hidden="true">◆</span> PROFILE CONFIRMATION</span>
          </div>
          <header className="checkout-heading">
            <div><span className="eyebrow">JABIYEN · YOUR ORDER</span><h1>Checkout<span>.</span></h1><p>Confirm the profile and delivery address saved in BINZEO Central Auth.</p></div>
            <div className="step-marker"><span>01 PROFILE</span><i /><span>02 PAYMENT</span></div>
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
              <form className="checkout-form" onSubmit={continueToPayment}>
                <section className="form-section">
                  <div className="section-title"><span className="section-number">01</span><div><span className="eyebrow">CENTRAL AUTH PROFILE</span><h2>Confirm your profile</h2></div></div>
                  <div className={`account-notice ${accountStatus === 'connected' ? 'is-connected' : ''}`} role="status" aria-live="polite">
                    <span className="account-notice-icon">{accountLoading ? '…' : accountStatus === 'connected' ? '✓' : 'i'}</span>
                    <div className="account-notice-copy">
                      <strong>{accountLoading ? 'Loading your Central Auth profile' : accountStatus === 'connected' ? 'BINZEO Central Auth connected' : 'Central Auth profile required'}</strong>
                      <p>{accountMessage}</p>
                      {accountStatus === 'signed_out' && <Link href="/auth/signin">Sign in securely</Link>}
                      {accountStatus === 'unavailable' && <Link href={CENTRAL_AUTH_ACCOUNT_URL}>Open Central Management</Link>}
                      {accountStatus === 'connected' && !primaryAddress && !accountLoading && <a href={CENTRAL_AUTH_ACCOUNT_URL} target="_blank" rel="noreferrer">Manage saved address in Central Management</a>}
                    </div>
                  </div>

                  {profile && (
                    <div className="profile-card" aria-label="Read-only Central Auth profile">
                      <div className="profile-details">
                        <div className="profile-detail"><span>Full name</span><strong>{profile.name || 'Not available'}</strong></div>
                        <div className="profile-detail"><span>Mobile number</span><strong>{profile.phone || 'Not available'}</strong></div>
                        <div className="profile-detail"><span>Email</span><strong>{profile.email || 'Not provided'}</strong></div>
                        <div className="profile-detail"><span>Country code</span><strong>{address?.country_code || '—'}</strong></div>
                        <div className="profile-detail full"><span>Primary delivery address</span><strong>{address ? [address.line1, address.line2, address.city, address.district, address.postal_code].filter(Boolean).join(', ') : 'No saved address'}</strong></div>
                      </div>
                      {profile && primaryAddress && <p className="confirm-hint">Continuing to payment confirms this Central Auth profile and primary delivery address for your order.</p>}
                    </div>
                  )}
                </section>

                <section className="form-section note-section">
                  <div className="section-title"><span className="section-number">02</span><div><span className="eyebrow">OPTIONAL</span><h2>Order note</h2></div></div>
                  <label className="note-label" htmlFor="delivery-note">Note for the delivery team</label>
                  <textarea id="delivery-note" value={deliveryNote} onChange={(event) => setDeliveryNote(event.target.value.slice(0, 500))} maxLength={500} rows={4} placeholder="Add a delivery instruction or note (optional)." />
                  <small>{deliveryNote.length}/500 characters</small>
                </section>

                {error && <div className="error-alert" role="alert"><span aria-hidden="true">!</span><p>{error}</p></div>}
                <button className="continue-button" type="submit" disabled={submitting || accountLoading || (mounted && !cart.length)}>
                  {submitting ? <><span className="spinner" /> Preparing payment…</> : <>Continue to Payment <span aria-hidden="true">↗</span></>}
                </button>
                <p className="privacy-copy">Your profile is read-only here. Continuing confirms it for this order; update personal details or addresses only in BINZEO Central Auth.</p>
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
                <p className="summary-footnote">You will choose the available payment method on the next page. Delivery fee is confirmed before dispatch.</p>
                <div className="summary-trust"><span>✓</span><span>Profile confirmed securely<br /><small>Read from Central Auth</small></span></div>
              </aside>
            </div>
          )}
          <footer className="checkout-footer"><span>JABIYEN · MADE FOR EVERY DAY</span><Link href="/">Return to store</Link></footer>
        </div>
      </main>
      <style jsx>{`
        .checkout-page{min-height:calc(100vh - 150px);padding:clamp(100px,11vw,132px) 18px 66px;background:#f5f3ef;color:#171715}.checkout-shell{width:min(100%,1120px);margin:0 auto}.checkout-topline{display:flex;align-items:center;justify-content:space-between;padding-bottom:22px;border-bottom:1px solid #dfdbd3}.back-link{color:#49473f;text-decoration:none;font-size:11px;font-weight:700}.back-link:hover{color:#a47241}.secure-note,.eyebrow{color:#8a857b;font-size:9px;font-weight:850;letter-spacing:.15em}.secure-note{display:flex;gap:8px;align-items:center}.secure-note span{font-size:7px;color:#a77e4f}.checkout-heading{display:flex;justify-content:space-between;align-items:flex-end;padding:42px 0 29px}.checkout-heading h1{margin:9px 0 8px;font:400 clamp(42px,7vw,66px)/.98 Georgia,'Times New Roman',serif;letter-spacing:-.055em}.checkout-heading h1 span{color:#b17d46}.checkout-heading p{margin:0;color:#77736b;font-size:12px}.step-marker{display:flex;align-items:center;gap:9px;color:#8a857b;font:700 9px Inter,sans-serif;letter-spacing:.08em}.step-marker span:first-child{color:#1d1c18}.step-marker i{width:28px;height:1px;background:#ddd8cf}.checkout-layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(280px,.8fr);align-items:start;gap:22px}.checkout-form{min-width:0}.form-section,.order-summary,.empty-card{border:1px solid #e5e1d9;border-radius:16px;background:#fff;box-shadow:0 10px 32px rgba(33,31,26,.025)}.form-section{padding:clamp(20px,3vw,30px);margin-bottom:14px}.section-title{display:flex;align-items:center;gap:14px;margin-bottom:21px}.section-number{display:grid;width:34px;height:34px;flex:0 0 34px;place-items:center;border:1px solid #e9e5dd;border-radius:50%;color:#9a764e;font:italic 14px Georgia,serif}.section-title h2,.summary-heading h2{margin:4px 0 0;color:#26251f;font:400 23px Georgia,'Times New Roman',serif;letter-spacing:-.025em}.account-notice{display:flex;align-items:flex-start;gap:10px;margin:-4px 0 18px;padding:12px 13px;border:1px solid #e8e3da;border-radius:11px;background:#faf9f6}.account-notice.is-connected{border-color:#d8e6d8;background:#f6faf5}.account-notice-icon{display:grid;width:22px;height:22px;flex:0 0 22px;place-items:center;border-radius:50%;background:#eae5dc;color:#80623e;font-size:12px;font-weight:800}.account-notice.is-connected .account-notice-icon{background:#e1eee0;color:#4c754e}.account-notice-copy{display:grid;gap:4px}.account-notice-copy strong{color:#3a3932;font-size:10px}.account-notice-copy p{margin:0;color:#77736a;font-size:9px;line-height:1.55}.account-notice-copy a{width:fit-content;color:#8c6741;font-size:9px;font-weight:750;text-decoration:underline;text-underline-offset:2px}.profile-card{padding:16px;border:1px solid #eae6de;border-radius:12px;background:#fcfbf8}.profile-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.profile-detail{display:grid;gap:6px;min-width:0}.profile-detail.full{grid-column:1/-1}.profile-detail span,.note-label{color:#8a857b;font-size:9px;font-weight:750;letter-spacing:.06em;text-transform:uppercase}.profile-detail strong{overflow-wrap:anywhere;color:#302e28;font-size:12px;font-weight:650;line-height:1.6}.confirm-profile{display:flex;align-items:flex-start;gap:10px;margin-top:18px;padding-top:15px;border-top:1px solid #e9e5dd;color:#514f47;font-size:10px;line-height:1.55;cursor:pointer}.confirm-profile input{width:16px;height:16px;flex:0 0 16px;margin:1px 0 0;accent-color:#1b1a17}.note-section textarea{display:block;width:100%;min-height:96px;margin-top:8px;padding:12px;border:1px solid #e5e1d9;border-radius:9px;outline:none;background:#fff;color:#292823;font:500 12px Inter,Arial,sans-serif;resize:vertical}.note-section textarea:focus{border-color:#a77b4c;box-shadow:0 0 0 3px rgba(167,123,76,.1)}.note-section textarea::placeholder{color:#aaa59b}.note-section small{display:block;margin-top:6px;color:#9b958a;font-size:9px}.continue-button,.dark-button{display:flex;width:100%;min-height:52px;align-items:center;justify-content:center;gap:14px;border:0;border-radius:999px;background:#1b1a17;color:#fff;font-size:11px;font-weight:800;text-decoration:none;cursor:pointer;transition:background .18s,transform .18s}.continue-button:hover:not(:disabled),.dark-button:hover{background:#3e3b33;transform:translateY(-1px)}.continue-button:disabled{opacity:.55;cursor:not-allowed}.continue-button span{font-size:15px}.privacy-copy{margin:11px 0 0;color:#928c82;font-size:9px;line-height:1.6;text-align:center}.error-alert{display:flex;align-items:flex-start;gap:9px;margin-bottom:13px;padding:13px 14px;border:1px solid #ebcac5;border-radius:10px;background:#fff8f6;color:#8b423d}.error-alert>span{display:grid;width:17px;height:17px;flex:0 0 17px;place-items:center;border:1px solid #d9aaa2;border-radius:50%;font-size:10px}.error-alert p{margin:0;font-size:11px;line-height:1.55}.spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.28);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.order-summary{position:sticky;top:112px;padding:24px}.summary-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:19px}.item-count{color:#b5aea2;font:italic 29px Georgia,serif}.summary-items{display:grid;gap:15px;max-height:330px;overflow-y:auto;padding-right:2px}.summary-item{display:flex;align-items:center;gap:10px;min-width:0}.summary-image-wrap{position:relative;width:51px;height:58px;flex:0 0 51px}.summary-image{width:100%;height:100%;border:1px solid #eeeae3;border-radius:8px;background:#f6f4ef;object-fit:cover}.quantity-badge{position:absolute;top:-6px;right:-6px;display:grid;width:18px;height:18px;place-items:center;border-radius:50%;background:#2a2924;color:#fff;font-size:9px;font-weight:800}.summary-item-copy{display:grid;min-width:0;flex:1;gap:5px}.summary-item-copy strong{overflow:hidden;color:#3c3a34;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.summary-item-copy span{overflow:hidden;color:#8f897e;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.summary-item-price{flex:0 0 auto;color:#39372f;font-size:10px}.summary-rule{height:1px;margin:18px 0;background:#eeeae3}.summary-row{display:flex;justify-content:space-between;gap:12px;margin:11px 0;color:#77736a;font-size:10px}.summary-row>span:last-child{color:#45433c;font-weight:700}.summary-row .to-confirm{color:#997444!important;font-weight:650}.total-row{align-items:center;color:#292823;font-size:11px}.total-row strong{font:400 23px Georgia,'Times New Roman',serif}.summary-footnote{margin:12px 0 17px;padding:11px;border-radius:8px;background:#f7f5f0;color:#827d72;font-size:9px;line-height:1.6}.summary-trust{display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid #f0eee9;color:#514f47;font-size:9px;font-weight:700;line-height:1.5}.summary-trust>span:first-child{display:grid;width:22px;height:22px;flex:0 0 22px;place-items:center;border-radius:50%;background:#edf3ec;color:#547554;font-size:11px}.summary-trust small{color:#969084;font-size:8px;font-weight:500}.empty-card{display:flex;min-height:290px;flex-direction:column;align-items:flex-start;justify-content:center;padding:clamp(25px,6vw,56px)}.empty-card h2{margin:9px 0;font:400 clamp(27px,4vw,36px) Georgia,serif}.empty-card p{max-width:430px;margin:0 0 22px;color:#77736b;font-size:12px;line-height:1.7}.dark-button{width:auto;padding:0 20px}.checkout-footer{display:flex;justify-content:space-between;gap:10px;margin-top:36px;padding-top:17px;border-top:1px solid #dfdbd3;color:#9a9489;font-size:8px;font-weight:800;letter-spacing:.12em}.checkout-footer a{color:#625e55;text-decoration:none;letter-spacing:normal}@media(max-width:800px){.checkout-layout{grid-template-columns:minmax(0,1fr) minmax(260px,.8fr);gap:13px}.order-summary{padding:18px}.form-section{padding:21px 18px}}@media(max-width:680px){.checkout-page{padding:97px 14px 48px}.checkout-heading{align-items:flex-start;flex-direction:column;gap:18px;padding:32px 0 23px}.step-marker{gap:5px}.step-marker i{width:16px}.checkout-layout{grid-template-columns:1fr}.order-summary{position:static;grid-row:1;padding:19px}.checkout-form{grid-row:2}.summary-items{max-height:250px}.checkout-footer{margin-top:25px}}@media(max-width:430px){.profile-details{grid-template-columns:1fr}.profile-detail.full{grid-column:auto}.checkout-heading p{max-width:270px;line-height:1.55}.secure-note{font-size:8px}.form-section{padding:19px 15px}}@media(prefers-reduced-motion:reduce){.spinner{animation-duration:2s}.continue-button,.dark-button{transition:none}}
      `}</style>
    </>
  );
}
