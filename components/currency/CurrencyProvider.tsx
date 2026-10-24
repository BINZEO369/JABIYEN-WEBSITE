import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type CurrencyRow = { country_code: string; currency_code: string; id?: number | string; sort_order?: number; currency_symbol?: string; exchange_rate?: number | string; country_name?: string; is_default?: boolean; is_active?: boolean; currency_name?: string };
type CurrencyContextValue = { countries: CurrencyRow[]; setAvailableCurrencies: (countries: CurrencyRow[], rates: CurrencyRow[]) => void; selectedCountryCode: string; selectedCurrency: CurrencyRow; selectCountry: (code: string) => void; convertUsd: (amount: number | string) => number; convertToUsd: (amount: number | string) => number; convertBdt: (amount: number | string) => number; convertToBdt: (amount: number | string) => number; formatMoney: (amount: number | string) => string };
const CurrencyContext = createContext<CurrencyContextValue | null>(null);
const STORAGE_KEY = 'jabiyen_country_currency_v1';
const USD_FALLBACK: CurrencyRow = { currency_code: 'USD', currency_symbol: '$', exchange_rate: 1, country_code: 'US', country_name: 'United States', is_default: true };

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<CurrencyRow[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('BD');
  useEffect(() => {
    try { const saved = window.localStorage.getItem(STORAGE_KEY); if (saved && /^[A-Z]{2}$/.test(saved)) setSelectedCountryCode(saved); } catch {}
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
    if (!countries.some((row) => row.country_code === normalized)) return;
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
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
export function useCurrency() { const context = useContext(CurrencyContext); if (!context) throw new Error('useCurrency must be used inside CurrencyProvider'); return context; }
