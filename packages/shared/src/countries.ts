/** Countries ACME employs people in, with the currency salaries are paid in. */
export const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
  { code: 'JP', name: 'Japan', currency: 'JPY' },
] as const;

export type Country = (typeof COUNTRIES)[number];
export type CountryCode = Country['code'];
export type CurrencyCode = Country['currency'];

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]];

const byCode = new Map<string, Country>(COUNTRIES.map((c) => [c.code, c]));

export function findCountry(code: string): Country | undefined {
  return byCode.get(code);
}

export function currencyForCountry(code: CountryCode): CurrencyCode {
  const country = byCode.get(code);
  if (!country) throw new Error(`Unknown country code: ${code}`);
  return country.currency;
}

/** Digits after the decimal point for each currency (JPY has none). */
export function minorUnitDigits(currency: string): number {
  return currency === 'JPY' ? 0 : 2;
}
