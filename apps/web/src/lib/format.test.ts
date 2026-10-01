import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney, formatNumber, fromMinor, toMinor } from './format';

describe('formatMoney', () => {
  it('uses Indian digit grouping for rupees', () => {
    expect(formatMoney(173_900_000, 'INR')).toBe('₹17,39,000');
  });

  it('formats other currencies without decimals', () => {
    expect(formatMoney(8_500_000, 'USD')).toBe('$85,000');
    expect(formatMoney(5_700_000, 'EUR')).toBe('€57,000');
  });

  it('treats yen as having no minor unit', () => {
    expect(formatMoney(7_817_000, 'JPY')).toBe('¥7,817,000');
  });
});

describe('toMinor', () => {
  it('parses grouped input in major units', () => {
    expect(toMinor('20,64,000', 'INR')).toBe(206_400_000);
    expect(toMinor('85000.50', 'USD')).toBe(8_500_050);
    expect(toMinor('7,817,000', 'JPY')).toBe(7_817_000);
  });

  it('returns null for text that is not an amount', () => {
    expect(toMinor('', 'USD')).toBeNull();
    expect(toMinor('abc', 'USD')).toBeNull();
    expect(toMinor('-5', 'USD')).toBeNull();
  });
});

describe('fromMinor', () => {
  it('converts minor units back to an editable major amount', () => {
    expect(fromMinor(206_400_000, 'INR')).toBe('2064000');
    expect(fromMinor(8_500_050, 'USD')).toBe('85000.5');
    expect(fromMinor(7_817_000, 'JPY')).toBe('7817000');
  });
});

describe('formatDate and formatNumber', () => {
  it('formats ISO dates as day month year', () => {
    expect(formatDate('2015-12-22')).toBe('22 Dec 2015');
  });

  it('groups thousands', () => {
    expect(formatNumber(10000)).toBe('10,000');
  });
});
