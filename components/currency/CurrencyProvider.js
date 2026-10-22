import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CurrencyContext = createContext(null);
const STORAGE_KEY = 'jabiyen_country_currency_v1';
const BDT_FALLBACK = { currency_code: 'BDT', currency_symbol: '৳', exchange_rate: 1, country_code: 'BD', country_name: 'Bangladesh', is_default: true };

export function CurrencyProvider({ children }) {
  const [countries, setCountries] = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('BD');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && /^[A-Z]{2}$/.test(saved)) setSelectedCountryCode(saved);
    } catch {}
  }, []);

  const setAvailableCurrencies = useCallback((countryRows, rateRows) => {
    const rates = new Map((Array.isArray(rateRows) ? rateRows : [])
      .filter((rate) => rate?.is_active !== false && Number(rate?.exchange_rate) > 0)
      .map((rate) => [String(rate.currency_code).toUpperCase(), rate]));
    const mapped = (Array.isArray(countryRows) ? countryRows : [])
      .filter((country) => country?.is_active !== false && country?.country_code && country?.currency_code)
      .map((country) => {
        const rate = rates.get(String(country.currency_code).toUpperCase());
        return rate ? {
          ...country,
          currency_code: rate.currency_code,
          currency_name: rate.currency_name,
          currency_symbol: rate.currency_symbol,
          exchange_rate: rate.exchange_rate,
          is_default: rate.is_default,
        } : null;
      })
      .filter(Boolean);
    setCountries(mapped);
    setSelectedCountryCode((current) => {
      if (mapped.some((row) => row.country_code === current)) return current;
      return mapped.find((row) => row.is_default)?.country_code || 'BD';
    });
  }, []);

  const selectCountry = useCallback((countryCode) => {
    const normalized = String(countryCode || '').trim().toUpperCase();
    if (!countries.some((row) => row.country_code === normalized)) return;
    setSelectedCountryCode(normalized);
    try { window.localStorage.setItem(STORAGE_KEY, normalized); } catch {}
  }, [countries]);

  const selectedCurrency = useMemo(() =>
    countries.find((row) => row.country_code === selectedCountryCode) || countries.find((row) => row.is_default) || BDT_FALLBACK,
  [countries, selectedCountryCode]);

  // currency_rates.exchange_rate is the amount of foreign currency equal to 1 BDT.
  const convertBdt = useCallback((amount) => {
    const value = Number(amount);
    const rate = Number(selectedCurrency.exchange_rate);
    if (!Number.isFinite(value)) return 0;
    return selectedCurrency.currency_code === 'BDT' ? value : value * (Number.isFinite(rate) && rate > 0 ? rate : 1);
  }, [selectedCurrency]);

  const convertToBdt = useCallback((amount) => {
    const value = Number(amount);
    const rate = Number(selectedCurrency.exchange_rate);
    if (!Number.isFinite(value)) return 0;
    return selectedCurrency.currency_code === 'BDT' ? value : value / (Number.isFinite(rate) && rate > 0 ? rate : 1);
  }, [selectedCurrency]);

  const formatMoney = useCallback((amount) => {
    const value = convertBdt(amount);
    const code = selectedCurrency.currency_code || 'BDT';
    const locale = ({ BDT: 'en-BD', USD: 'en-US', GBP: 'en-GB', EUR: 'de-DE', INR: 'en-IN', SAR: 'en-SA' })[code] || 'en-US';
    const formatted = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    return `${selectedCurrency.currency_symbol || BDT_FALLBACK.currency_symbol}${formatted}`;
  }, [convertBdt, selectedCurrency]);

  const value = useMemo(() => ({
    countries,
    setAvailableCurrencies,
    selectedCountryCode,
    selectedCurrency,
    selectCountry,
    convertBdt,
    convertToBdt,
    formatMoney,
  }), [countries, setAvailableCurrencies, selectedCountryCode, selectedCurrency, selectCountry, convertBdt, convertToBdt, formatMoney]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used inside CurrencyProvider');
  return context;
}
