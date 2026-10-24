import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type CurrencyRow = { country_code: string; currency_code: string; id?: number | string; sort_order?: number; currency_symbol?: string; exchange_rate?: number | string; country_name?: string; is_default?: boolean; is_active?: boolean; currency_name?: string };
type CurrencyContextValue = { countries: CurrencyRow[]; setAvailableCurrencies: (countries: CurrencyRow[], rates: CurrencyRow[]) => void; selectedCountryCode: string; selectedCurrency: CurrencyRow; selectCountry: (code: string) => void; convertUsd: (amount: number | string) => number; convertToUsd: (amount: number | string) => number; convertBdt: (amount: number | string) => number; convertToBdt: (amount: number | string) => number; formatMoney: (amount: number | string) => string };
const CurrencyContext = createContext<CurrencyContextValue | null>(null);
const STORAGE_KEY = 'jabiyen_country_currency_v1';
const USD_FALLBACK: CurrencyRow = { currency_code: 'USD', currency_symbol: '$', exchange_rate: 1, country_code: 'US', country_name: 'United States', is_default: true };

function countryFlag(countryCode: string) {
  const code = countryCode.toUpperCase() === 'UK' ? 'GB' : countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '◎';
  return String.fromCodePoint(...code.split('').map((letter) => 127397 + letter.charCodeAt(0)));
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<CurrencyRow[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('US');
  const [showCountryPrompt, setShowCountryPrompt] = useState(false);
  const [pendingCountryCode, setPendingCountryCode] = useState('US');
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && /^[A-Z]{2}$/.test(saved)) {
        setSelectedCountryCode(saved);
        setPendingCountryCode(saved);
      } else {
        setSelectedCountryCode('US');
        setPendingCountryCode('US');
        setShowCountryPrompt(true);
      }
    } catch {
      setShowCountryPrompt(true);
    }
  }, []);
  const setAvailableCurrencies = useCallback((countryRows: CurrencyRow[], rateRows: CurrencyRow[]) => {
    // currency_rates.exchange_rate is the amount of display currency equal to 1 USD.
    const rates = new Map((Array.isArray(rateRows) ? rateRows : []).filter((rate) => rate?.is_active !== false && Number(rate?.exchange_rate) > 0).map((rate) => [String(rate.currency_code).toUpperCase(), rate]));
    const mapped = (Array.isArray(countryRows) ? countryRows : []).filter((country) => country?.is_active !== false && country?.country_code && country?.currency_code).map((country) => {
      const rate = rates.get(String(country.currency_code).toUpperCase());
      return rate ? { ...country, currency_code: rate.currency_code, currency_name: rate.currency_name, currency_symbol: rate.currency_symbol, exchange_rate: rate.exchange_rate, is_default: rate.is_default } : null;
    }).filter(Boolean) as CurrencyRow[];
    setCountries(mapped);
    setSelectedCountryCode((current) => mapped.some((row) => row.country_code === current) ? current : mapped.find((row) => row.currency_code === 'USD')?.country_code || mapped.find((row) => row.is_default)?.country_code || 'US');
  }, []);
  const selectCountry = useCallback((countryCode: string) => {
    const normalized = String(countryCode || '').trim().toUpperCase();
    if (!countries.some((row) => row.country_code === normalized) && normalized !== 'US') return;
    setSelectedCountryCode(normalized); try { window.localStorage.setItem(STORAGE_KEY, normalized); } catch {}
  }, [countries]);
  const selectedCurrency = useMemo(() => countries.find((row) => row.country_code === selectedCountryCode) || countries.find((row) => row.currency_code === 'USD') || countries.find((row) => row.is_default) || USD_FALLBACK, [countries, selectedCountryCode]);
  const convertUsd = useCallback((amount: number | string) => { const value = Number(amount); const rate = Number(selectedCurrency.exchange_rate); if (!Number.isFinite(value)) return 0; return value * (Number.isFinite(rate) && rate > 0 ? rate : 1); }, [selectedCurrency]);
  const convertToUsd = useCallback((amount: number | string) => { const value = Number(amount); const rate = Number(selectedCurrency.exchange_rate); if (!Number.isFinite(value)) return 0; return value / (Number.isFinite(rate) && rate > 0 ? rate : 1); }, [selectedCurrency]);
  const formatMoney = useCallback((amount: number | string) => {
    const value = convertUsd(amount); const code = selectedCurrency.currency_code || 'USD';
    const locale = ({ BDT: 'en-BD', USD: 'en-US', GBP: 'en-GB', EUR: 'de-DE', INR: 'en-IN', SAR: 'en-SA' } as Record<string, string>)[code] || 'en-US';
    const formatted = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    return `${selectedCurrency.currency_symbol || USD_FALLBACK.currency_symbol}${formatted}`;
  }, [convertUsd, selectedCurrency]);
  const value = useMemo(() => ({ countries, setAvailableCurrencies, selectedCountryCode, selectedCurrency, selectCountry, convertUsd, convertToUsd, convertBdt: convertUsd, convertToBdt: convertToUsd, formatMoney }), [countries, setAvailableCurrencies, selectedCountryCode, selectedCurrency, selectCountry, convertUsd, convertToUsd, formatMoney]);
  const countryOptions = countries.length ? [...countries].sort((a, b) => {
    if (a.country_code === 'US') return -1;
    if (b.country_code === 'US') return 1;
    return (a.sort_order || 0) - (b.sort_order || 0);
  }) : [USD_FALLBACK];
  const pendingCountry = countryOptions.find((country) => country.country_code === pendingCountryCode) || countryOptions.find((country) => country.currency_code === 'USD') || USD_FALLBACK;
  const canContinue = pendingCountry.currency_code === 'USD' || countries.some((country) => country.country_code === pendingCountry.country_code);

  const confirmCountry = () => {
    if (!canContinue) return;
    selectCountry(pendingCountry.country_code);
    setShowCountryPrompt(false);
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
      {showCountryPrompt && (
        <div className="market-overlay" role="presentation">
          <section className="market-dialog" role="dialog" aria-modal="true" aria-labelledby="market-title">
            <div className="market-art" aria-hidden="true">
              <div className="market-orbit market-orbit-one" />
              <div className="market-orbit market-orbit-two" />
              <div className="market-mark">J<span>.</span></div>
              <div className="market-edition">JABIYEN · GLOBAL STORE</div>
            </div>
            <div className="market-content">
              <div className="market-kicker"><span /> YOUR SHOPPING REGION</div>
              <h1 id="market-title">Where should<br />we take you?</h1>
              <p className="market-copy">Choose your country to see prices in your currency. All product prices are based in USD and converted for your market.</p>
              <div className="market-label">SELECT YOUR COUNTRY</div>
              <div className="market-countries" role="listbox" aria-label="Choose your country">
                {countryOptions.map((country) => {
                  const selected = pendingCountry.country_code === country.country_code;
                  return (
                    <button key={country.country_code} type="button" role="option" aria-selected={selected} className={`market-country${selected ? ' selected' : ''}`} onClick={() => setPendingCountryCode(country.country_code)}>
                      <span className="country-flag">{countryFlag(country.country_code)}</span>
                      <span className="country-copy"><strong>{country.country_name || country.country_code}</strong><small>{country.currency_name || country.currency_code} · {country.currency_code}</small></span>
                      <span className="country-check">{selected ? '✓' : ''}</span>
                    </button>
                  );
                })}
              </div>
              <div className="market-rate-note">
                <span className="rate-note-icon">↗</span>
                <span>{pendingCountry.currency_code === 'USD' ? 'Prices will be shown in USD.' : `1 USD ≈ ${pendingCountry.currency_symbol || ''}${Number(pendingCountry.exchange_rate || 0).toLocaleString('en-US', { maximumFractionDigits: 4 })} ${pendingCountry.currency_code}`}</span>
              </div>
              <button className="market-continue" type="button" onClick={confirmCountry} disabled={!canContinue}>
                <span>CONTINUE TO STORE</span><span className="continue-arrow">→</span>
              </button>
              <p className="market-footnote">Your selection is saved for next time. Change it anytime from the footer.</p>
            </div>
          </section>
        </div>
      )}
      <style jsx>{`
        .market-overlay { position:fixed; inset:0; z-index:10020; display:grid; place-items:center; padding:22px; background:rgba(8,8,8,.74); backdrop-filter:blur(9px); animation:market-fade .28s ease both; }
        .market-dialog { display:grid; grid-template-columns:.82fr 1fr; width:min(850px,100%); max-height:min(680px,calc(100vh - 44px)); overflow:hidden; border:1px solid rgba(255,255,255,.18); border-radius:7px; background:#fff; color:#111; box-shadow:0 32px 100px rgba(0,0,0,.38); animation:market-rise .4s cubic-bezier(.2,.8,.2,1) both; }
        .market-art { position:relative; display:flex; min-height:100%; align-items:center; justify-content:center; overflow:hidden; background:#080808; color:#fff; }
        .market-art::before { position:absolute; inset:0; background:radial-gradient(ellipse at 48% 45%,rgba(255,255,255,.1),transparent 40%),linear-gradient(155deg,transparent 35%,rgba(255,255,255,.035) 35.2%,transparent 35.5%); content:''; }
        .market-orbit { position:absolute; width:380px; height:380px; border:1px solid rgba(255,255,255,.12); border-radius:50%; transform:rotate(-24deg) scaleY(.57); }
        .market-orbit-one { width:460px; height:460px; }
        .market-orbit-two { width:330px; height:330px; border-color:rgba(255,255,255,.08); transform:rotate(36deg) scaleY(.7); }
        .market-mark { position:relative; z-index:1; margin-top:-9px; font:300 112px/.9 Georgia,serif; letter-spacing:-.12em; }
        .market-mark span { display:inline-block; margin-left:8px; font:300 28px Georgia,serif; vertical-align:top; }
        .market-edition { position:absolute; bottom:29px; left:30px; color:rgba(255,255,255,.53); font:600 8px/1.5 Inter,Arial,sans-serif; letter-spacing:.22em; }
        .market-content { display:flex; flex-direction:column; justify-content:center; overflow:auto; padding:36px clamp(25px,4.5vw,49px); }
        .market-kicker { display:flex; align-items:center; gap:8px; color:#777; font:700 8px/1 Inter,Arial,sans-serif; letter-spacing:.2em; }
        .market-kicker span { width:6px; height:6px; border-radius:50%; background:#111; }
        .market-content h1 { margin:18px 0 10px; font:400 clamp(34px,4vw,46px)/1.04 Georgia,'Times New Roman',serif; letter-spacing:-.055em; }
        .market-copy { max-width:370px; margin:0 0 20px; color:#737373; font:400 10px/1.75 Inter,Arial,sans-serif; }
        .market-label { margin-bottom:8px; color:#777; font:700 8px/1 Inter,Arial,sans-serif; letter-spacing:.16em; }
        .market-countries { display:grid; gap:6px; max-height:202px; overflow:auto; padding:1px 3px 1px 1px; }
        .market-country { display:flex; width:100%; min-height:46px; align-items:center; gap:10px; padding:7px 10px; border:1px solid #e8e8e8; border-radius:3px; background:#fff; color:#161616; text-align:left; cursor:pointer; transition:border-color .18s,background .18s,transform .18s; }
        .market-country:hover { border-color:#777; transform:translateY(-1px); }
        .market-country.selected { border-color:#111; background:#f7f7f7; box-shadow:inset 0 0 0 1px #111; }
        .country-flag { width:24px; font-size:17px; text-align:center; }
        .country-copy { display:flex; flex:1; min-width:0; flex-direction:column; gap:3px; }
        .country-copy strong { overflow:hidden; color:#191919; font:600 10px/1.2 Inter,Arial,sans-serif; text-overflow:ellipsis; white-space:nowrap; }
        .country-copy small { color:#888; font:400 8px/1.2 Inter,Arial,sans-serif; }
        .country-check { display:grid; width:16px; height:16px; place-items:center; border:1px solid #ddd; border-radius:50%; color:#fff; font:700 9px Inter,Arial,sans-serif; }
        .selected .country-check { border-color:#111; background:#111; }
        .market-rate-note { display:flex; min-height:34px; align-items:center; gap:8px; margin:7px 0 9px; color:#777; font:400 8px/1.4 Inter,Arial,sans-serif; }
        .rate-note-icon { display:grid; width:19px; height:19px; flex:0 0 19px; place-items:center; border:1px solid #e5e5e5; border-radius:50%; color:#333; font-size:10px; }
        .market-continue { display:flex; width:100%; min-height:45px; align-items:center; justify-content:space-between; padding:0 16px; border:1px solid #080808; border-radius:3px; background:#080808; color:#fff; font:700 8px Inter,Arial,sans-serif; letter-spacing:.14em; cursor:pointer; transition:background .2s,color .2s,transform .2s; }
        .market-continue:hover:not(:disabled) { transform:translateY(-1px); background:#fff; color:#080808; }
        .market-continue:disabled { opacity:.42; cursor:wait; }
        .continue-arrow { font:400 18px/1 Arial,sans-serif; }
        .market-footnote { margin:11px 0 0; color:#a1a1a1; font:400 7px/1.5 Inter,Arial,sans-serif; text-align:center; }
        @keyframes market-fade { from { opacity:0; } to { opacity:1; } }
        @keyframes market-rise { from { opacity:0; transform:translateY(12px) scale(.985); } to { opacity:1; transform:translateY(0) scale(1); } }
        @media(max-width:640px) { .market-overlay { padding:12px; } .market-dialog { grid-template-columns:1fr; width:min(460px,100%); max-height:calc(100vh - 24px); border-radius:6px; } .market-art { min-height:105px; } .market-orbit-one { width:300px; height:300px; } .market-orbit-two { width:220px; height:220px; } .market-mark { font-size:55px; } .market-mark span { font-size:16px; } .market-edition { bottom:11px; left:15px; font-size:6px; } .market-content { padding:21px 20px 19px; } .market-content h1 { margin:11px 0 7px; font-size:32px; } .market-copy { margin-bottom:14px; font-size:9px; } .market-countries { max-height:174px; } .market-country { min-height:42px; } .market-rate-note { margin:4px 0 7px; } }
        @media(prefers-reduced-motion:reduce) { .market-overlay,.market-dialog { animation:none; } }
      `}</style>
    </CurrencyContext.Provider>
  );
}
export function useCurrency() { const context = useContext(CurrencyContext); if (!context) throw new Error('useCurrency must be used inside CurrencyProvider'); return context; }
