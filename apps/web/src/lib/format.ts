import { minorUnitDigits } from '@salary/shared';

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** Annual salary in its own currency, e.g. ₹17,39,000 or $85,000 (no conversion, ADR 0005). */
export function formatMoney(minor: number, currency: string): string {
  let formatter = moneyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    moneyFormatters.set(currency, formatter);
  }
  return formatter.format(minor / 10 ** minorUnitDigits(currency));
}

/**
 * Parses what a person types ("20,64,000", "85000.50") into integer minor units.
 * Works on the digits as text, so no floating-point rounding is involved.
 */
export function toMinor(input: string, currency: string): number | null {
  const digits = minorUnitDigits(currency);
  const cleaned = input.replace(/[,\s]/g, '');
  const pattern = digits === 0 ? /^\d+$/ : new RegExp(`^\\d+(\\.\\d{1,${digits}})?$`);
  if (!pattern.test(cleaned)) return null;
  const [whole = '0', fraction = ''] = cleaned.split('.');
  return Number(whole + fraction.padEnd(digits, '0'));
}

/** Minor units back to a plain major amount for an input field. */
export function fromMinor(minor: number, currency: string): string {
  const digits = minorUnitDigits(currency);
  if (digits === 0) return String(minor);
  const whole = Math.floor(minor / 10 ** digits);
  const fraction = String(minor % 10 ** digits)
    .padStart(digits, '0')
    .replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : String(whole);
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

const numberFormatter = new Intl.NumberFormat('en-US');

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
