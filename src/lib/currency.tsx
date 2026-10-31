// Prices in the shopper's own currency. Everything is priced and charged in US dollars (or naira
// through Bachs); other currencies are shown at live rates as a guide. Rates come from
// open.er-api.com (free, refreshed daily) and are cached for a few hours; the figures below are a
// rough fallback for when that can't be reached.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Region = "Africa" | "Europe" | "Americas" | "Middle East & Asia-Pacific";
export type Country = { code: string; name: string; currency: string; region: Region };

export const countries: Country[] = [
  // Africa
  { code: "NG", name: "Nigeria", currency: "NGN", region: "Africa" },
  { code: "GH", name: "Ghana", currency: "GHS", region: "Africa" },
  { code: "KE", name: "Kenya", currency: "KES", region: "Africa" },
  { code: "ZA", name: "South Africa", currency: "ZAR", region: "Africa" },
  { code: "EG", name: "Egypt", currency: "EGP", region: "Africa" },
  { code: "MA", name: "Morocco", currency: "MAD", region: "Africa" },
  { code: "SN", name: "Senegal", currency: "XOF", region: "Africa" },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", region: "Africa" },
  { code: "CM", name: "Cameroon", currency: "XAF", region: "Africa" },
  { code: "ET", name: "Ethiopia", currency: "ETB", region: "Africa" },
  { code: "TZ", name: "Tanzania", currency: "TZS", region: "Africa" },
  { code: "UG", name: "Uganda", currency: "UGX", region: "Africa" },
  { code: "RW", name: "Rwanda", currency: "RWF", region: "Africa" },
  { code: "ZM", name: "Zambia", currency: "ZMW", region: "Africa" },
  { code: "BW", name: "Botswana", currency: "BWP", region: "Africa" },
  { code: "NA", name: "Namibia", currency: "NAD", region: "Africa" },
  { code: "DZ", name: "Algeria", currency: "DZD", region: "Africa" },
  { code: "TN", name: "Tunisia", currency: "TND", region: "Africa" },
  { code: "MU", name: "Mauritius", currency: "MUR", region: "Africa" },
  { code: "ZW", name: "Zimbabwe", currency: "USD", region: "Africa" },
  // Europe
  { code: "GB", name: "United Kingdom", currency: "GBP", region: "Europe" },
  { code: "IE", name: "Ireland", currency: "EUR", region: "Europe" },
  { code: "FR", name: "France", currency: "EUR", region: "Europe" },
  { code: "DE", name: "Germany", currency: "EUR", region: "Europe" },
  { code: "IT", name: "Italy", currency: "EUR", region: "Europe" },
  { code: "ES", name: "Spain", currency: "EUR", region: "Europe" },
  { code: "PT", name: "Portugal", currency: "EUR", region: "Europe" },
  { code: "NL", name: "Netherlands", currency: "EUR", region: "Europe" },
  { code: "BE", name: "Belgium", currency: "EUR", region: "Europe" },
  { code: "AT", name: "Austria", currency: "EUR", region: "Europe" },
  { code: "FI", name: "Finland", currency: "EUR", region: "Europe" },
  { code: "GR", name: "Greece", currency: "EUR", region: "Europe" },
  { code: "LU", name: "Luxembourg", currency: "EUR", region: "Europe" },
  { code: "HR", name: "Croatia", currency: "EUR", region: "Europe" },
  { code: "CH", name: "Switzerland", currency: "CHF", region: "Europe" },
  { code: "SE", name: "Sweden", currency: "SEK", region: "Europe" },
  { code: "NO", name: "Norway", currency: "NOK", region: "Europe" },
  { code: "DK", name: "Denmark", currency: "DKK", region: "Europe" },
  { code: "PL", name: "Poland", currency: "PLN", region: "Europe" },
  { code: "CZ", name: "Czechia", currency: "CZK", region: "Europe" },
  { code: "HU", name: "Hungary", currency: "HUF", region: "Europe" },
  { code: "RO", name: "Romania", currency: "RON", region: "Europe" },
  { code: "IS", name: "Iceland", currency: "ISK", region: "Europe" },
  // Americas
  { code: "US", name: "United States", currency: "USD", region: "Americas" },
  { code: "CA", name: "Canada", currency: "CAD", region: "Americas" },
  { code: "MX", name: "Mexico", currency: "MXN", region: "Americas" },
  { code: "BR", name: "Brazil", currency: "BRL", region: "Americas" },
  { code: "AR", name: "Argentina", currency: "ARS", region: "Americas" },
  { code: "CO", name: "Colombia", currency: "COP", region: "Americas" },
  { code: "CL", name: "Chile", currency: "CLP", region: "Americas" },
  { code: "JM", name: "Jamaica", currency: "JMD", region: "Americas" },
  { code: "TT", name: "Trinidad and Tobago", currency: "TTD", region: "Americas" },
  { code: "BB", name: "Barbados", currency: "BBD", region: "Americas" },
  // Middle East & Asia-Pacific
  {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    region: "Middle East & Asia-Pacific",
  },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", region: "Middle East & Asia-Pacific" },
  { code: "QA", name: "Qatar", currency: "QAR", region: "Middle East & Asia-Pacific" },
  { code: "IL", name: "Israel", currency: "ILS", region: "Middle East & Asia-Pacific" },
  { code: "TR", name: "Türkiye", currency: "TRY", region: "Middle East & Asia-Pacific" },
  { code: "IN", name: "India", currency: "INR", region: "Middle East & Asia-Pacific" },
  { code: "CN", name: "China", currency: "CNY", region: "Middle East & Asia-Pacific" },
  { code: "JP", name: "Japan", currency: "JPY", region: "Middle East & Asia-Pacific" },
  { code: "KR", name: "South Korea", currency: "KRW", region: "Middle East & Asia-Pacific" },
  { code: "HK", name: "Hong Kong", currency: "HKD", region: "Middle East & Asia-Pacific" },
  { code: "SG", name: "Singapore", currency: "SGD", region: "Middle East & Asia-Pacific" },
  { code: "MY", name: "Malaysia", currency: "MYR", region: "Middle East & Asia-Pacific" },
  { code: "PH", name: "Philippines", currency: "PHP", region: "Middle East & Asia-Pacific" },
  { code: "AU", name: "Australia", currency: "AUD", region: "Middle East & Asia-Pacific" },
  { code: "NZ", name: "New Zealand", currency: "NZD", region: "Middle East & Asia-Pacific" },
];

export const regions: Region[] = ["Americas", "Europe", "Africa", "Middle East & Asia-Pacific"];
export const findCountry = (code: string) => countries.find((c) => c.code === code);
export const countryByName = (name: string) => countries.find((c) => c.name === name);
const US = findCountry("US")!;

// rough units per US dollar, only used until live rates load
const FALLBACK: Record<string, number> = {
  USD: 1,
  NGN: 1550,
  GHS: 12,
  KES: 129,
  ZAR: 18,
  EGP: 49,
  MAD: 9.2,
  XOF: 580,
  XAF: 580,
  ETB: 135,
  TZS: 2600,
  UGX: 3650,
  RWF: 1420,
  ZMW: 25,
  BWP: 13.5,
  NAD: 18,
  DZD: 133,
  TND: 3,
  MUR: 46,
  GBP: 0.76,
  EUR: 0.88,
  CHF: 0.81,
  SEK: 9.6,
  NOK: 10.2,
  DKK: 6.6,
  PLN: 3.7,
  CZK: 21.5,
  HUF: 345,
  RON: 4.4,
  ISK: 125,
  CAD: 1.38,
  MXN: 18.8,
  BRL: 5.5,
  ARS: 1200,
  COP: 4000,
  CLP: 950,
  JMD: 160,
  TTD: 6.8,
  BBD: 2,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  ILS: 3.5,
  TRY: 40,
  INR: 86,
  CNY: 7.2,
  JPY: 147,
  KRW: 1380,
  HKD: 7.8,
  SGD: 1.29,
  MYR: 4.25,
  PHP: 57,
  AUD: 1.53,
  NZD: 1.68,
};

// without the host's IP lookup, the browser's time zone (or language region) says where they are
const ZONES: Record<string, string> = {
  "Africa/Lagos": "NG",
  "Africa/Accra": "GH",
  "Africa/Nairobi": "KE",
  "Africa/Johannesburg": "ZA",
  "Africa/Cairo": "EG",
  "Africa/Casablanca": "MA",
  "Africa/Dakar": "SN",
  "Africa/Abidjan": "CI",
  "Africa/Douala": "CM",
  "Africa/Addis_Ababa": "ET",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Kampala": "UG",
  "Africa/Kigali": "RW",
  "Africa/Lusaka": "ZM",
  "Africa/Gaborone": "BW",
  "Africa/Windhoek": "NA",
  "Africa/Algiers": "DZ",
  "Africa/Tunis": "TN",
  "Indian/Mauritius": "MU",
  "Africa/Harare": "ZW",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Europe/Lisbon": "PT",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Vienna": "AT",
  "Europe/Helsinki": "FI",
  "Europe/Athens": "GR",
  "Europe/Luxembourg": "LU",
  "Europe/Zagreb": "HR",
  "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Budapest": "HU",
  "Europe/Bucharest": "RO",
  "Atlantic/Reykjavik": "IS",
  "Europe/Istanbul": "TR",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "America/Mexico_City": "MX",
  "America/Sao_Paulo": "BR",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Buenos_Aires": "AR",
  "America/Bogota": "CO",
  "America/Santiago": "CL",
  "America/Jamaica": "JM",
  "America/Port_of_Spain": "TT",
  "America/Barbados": "BB",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Qatar": "QA",
  "Asia/Jerusalem": "IL",
  "Asia/Tel_Aviv": "IL",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Shanghai": "CN",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Hong_Kong": "HK",
  "Asia/Singapore": "SG",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Manila": "PH",
  "Pacific/Auckland": "NZ",
};

function detect(): string {
  try {
    // the host's IP lookup is the most accurate (set by src/server.ts on Vercel)
    const geo = /(?:^|; )ada-geo=([A-Z]{2})/.exec(document.cookie)?.[1];
    if (geo && findCountry(geo)) return geo;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (ZONES[zone]) return ZONES[zone]!;
    if (zone.startsWith("Australia/")) return "AU";
    // a language with a region ("en-GB") is the next best hint; plain "en" says nothing
    for (const lang of navigator.languages ?? []) {
      const region = lang.split("-")[1]?.toUpperCase();
      if (region && findCountry(region)) return region;
    }
  } catch {
    // fall through
  }
  return "US";
}

const COUNTRY_KEY = "ada-country";
const RATES_KEY = "ada-rates";
const RATES_TTL = 6 * 60 * 60 * 1000;

function read<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode: the choice just isn't remembered
  }
}

// currencies whose narrow symbol is a bare "$" keep their prefix (CA$, A$…) so they aren't misread
const DOLLAR_LIKE = new Set([
  "CAD",
  "AUD",
  "NZD",
  "SGD",
  "HKD",
  "MXN",
  "ARS",
  "COP",
  "CLP",
  "JMD",
  "TTD",
  "BBD",
  "NAD",
]);

/** "$245.00" in dollars; whole units elsewhere ("₦379,750", "£186"). */
export function formatIn(usd: number, currency: string, rate: number) {
  if (currency === "USD") return `$${usd.toFixed(2)}`;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    currencyDisplay: DOLLAR_LIKE.has(currency) ? "symbol" : "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(usd * rate);
}

type CurrencyContext = {
  country: Country;
  setCountry: (code: string) => void;
  /** formats a US-dollar amount in the shopper's currency */
  format: (usd: number) => string;
  /** true when prices are shown in a currency other than the one charged */
  converted: boolean;
};

const Ctx = createContext<CurrencyContext | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // dollars on the server and first paint; the shopper's own currency right after
  const [code, setCode] = useState("US");
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK);

  useEffect(() => {
    setCode(read<string>(COUNTRY_KEY) ?? detect());
    const cached = read<{ at: number; rates: Record<string, number> }>(RATES_KEY);
    if (cached) setRates({ ...FALLBACK, ...cached.rates });
    if (cached && Date.now() - cached.at < RATES_TTL) return;
    void fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((j: { result?: string; rates?: Record<string, number> }) => {
        if (j.result !== "success" || !j.rates) return;
        setRates({ ...FALLBACK, ...j.rates });
        write(RATES_KEY, { at: Date.now(), rates: j.rates });
      })
      .catch(() => {});
  }, []);

  const setCountry = useCallback((next: string) => {
    if (!findCountry(next)) return;
    setCode(next);
    write(COUNTRY_KEY, next);
  }, []);

  const value = useMemo(() => {
    const country = findCountry(code) ?? US;
    const rate = rates[country.currency] ?? 1;
    return {
      country,
      setCountry,
      format: (usd: number) => formatIn(usd, country.currency, rate),
      converted: country.currency !== "USD",
    };
  }, [code, rates, setCountry]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}

/** Country and currency picker, grouped by region. */
export function CountryPicker({
  className = "",
  label = "Country / currency",
}: {
  className?: string;
  label?: string;
}) {
  const { country, setCountry } = useCurrency();
  return (
    <select
      aria-label={label}
      value={country.code}
      onChange={(e) => setCountry(e.target.value)}
      className={`cursor-pointer bg-transparent outline-none ${className}`}
    >
      {regions.map((r) => (
        <optgroup key={r} label={r}>
          {countries
            .filter((c) => c.region === r)
            .map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} · {c.currency}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}
