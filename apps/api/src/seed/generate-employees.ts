import {
  minorUnitDigits,
  type CountryCode,
  type EmployeeInput,
  type EmploymentType,
} from '@salary/shared';
import { FIRST_NAMES, LAST_NAMES } from './names';

/**
 * Synthetic but plausible pay data. Base salaries are annual USD figures; each
 * country applies a pay level relative to the US and a fixed conversion rate to
 * its local currency. The numbers are illustrative, not market data.
 */
const ROLES: { department: string; jobTitle: string; baseUsd: number; weight: number }[] = [
  { department: 'Engineering', jobTitle: 'Software Engineer', baseUsd: 95_000, weight: 14 },
  { department: 'Engineering', jobTitle: 'Senior Software Engineer', baseUsd: 130_000, weight: 9 },
  { department: 'Engineering', jobTitle: 'Engineering Manager', baseUsd: 160_000, weight: 3 },
  { department: 'Engineering', jobTitle: 'QA Engineer', baseUsd: 75_000, weight: 5 },
  { department: 'Engineering', jobTitle: 'DevOps Engineer', baseUsd: 105_000, weight: 4 },
  { department: 'Product', jobTitle: 'Product Manager', baseUsd: 120_000, weight: 4 },
  { department: 'Product', jobTitle: 'Product Designer', baseUsd: 95_000, weight: 4 },
  { department: 'Sales', jobTitle: 'Account Executive', baseUsd: 80_000, weight: 9 },
  { department: 'Sales', jobTitle: 'Sales Manager', baseUsd: 110_000, weight: 3 },
  { department: 'Marketing', jobTitle: 'Marketing Specialist', baseUsd: 65_000, weight: 5 },
  { department: 'Marketing', jobTitle: 'Marketing Manager', baseUsd: 100_000, weight: 2 },
  { department: 'Finance', jobTitle: 'Accountant', baseUsd: 65_000, weight: 4 },
  { department: 'Finance', jobTitle: 'Financial Analyst', baseUsd: 80_000, weight: 3 },
  { department: 'People', jobTitle: 'HR Generalist', baseUsd: 60_000, weight: 3 },
  { department: 'People', jobTitle: 'HR Manager', baseUsd: 95_000, weight: 1 },
  { department: 'Operations', jobTitle: 'Operations Analyst', baseUsd: 65_000, weight: 5 },
  { department: 'Operations', jobTitle: 'Support Specialist', baseUsd: 45_000, weight: 12 },
];

const COUNTRY_PAY: {
  code: CountryCode;
  currency: string;
  payLevel: number;
  perUsd: number;
  weight: number;
}[] = [
  { code: 'IN', currency: 'INR', payLevel: 0.25, perUsd: 84, weight: 30 },
  { code: 'US', currency: 'USD', payLevel: 1, perUsd: 1, weight: 25 },
  { code: 'GB', currency: 'GBP', payLevel: 0.75, perUsd: 0.78, weight: 10 },
  { code: 'DE', currency: 'EUR', payLevel: 0.75, perUsd: 0.92, weight: 8 },
  { code: 'NL', currency: 'EUR', payLevel: 0.72, perUsd: 0.92, weight: 4 },
  { code: 'CA', currency: 'CAD', payLevel: 0.8, perUsd: 1.37, weight: 6 },
  { code: 'AU', currency: 'AUD', payLevel: 0.8, perUsd: 1.52, weight: 5 },
  { code: 'SG', currency: 'SGD', payLevel: 0.8, perUsd: 1.33, weight: 5 },
  { code: 'AE', currency: 'AED', payLevel: 0.75, perUsd: 3.67, weight: 3 },
  { code: 'JP', currency: 'JPY', payLevel: 0.6, perUsd: 150, weight: 4 },
];

const EMPLOYMENT: { type: EmploymentType; payShare: number; weight: number }[] = [
  { type: 'full-time', payShare: 1, weight: 85 },
  { type: 'part-time', payShare: 0.5, weight: 7 },
  { type: 'contract', payShare: 1, weight: 8 },
];

const FIRST_HIRE_DATE = '2012-01-01';

export interface GenerateOptions {
  count: number;
  seed: number;
  /** Latest possible hire date (YYYY-MM-DD); passed in so output never depends on the clock. */
  today: string;
}

/** Small, fast, seedable PRNG (mulberry32) so the same seed always yields the same data. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pickWeighted<T extends { weight: number }>(items: readonly T[], r: number): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let threshold = r * total;
  for (const item of items) {
    threshold -= item.weight;
    if (threshold < 0) return item;
  }
  return items[items.length - 1] as T;
}

function pick<T>(items: readonly T[], r: number): T {
  return items[Math.floor(r * items.length)] as T;
}

const DAY_MS = 86_400_000;

function randomDate(from: string, to: string, r: number): string {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  const days = Math.floor(((end - start) / DAY_MS) * r);
  return new Date(start + days * DAY_MS).toISOString().slice(0, 10);
}

function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

export function generateEmployees({ count, seed, today }: GenerateOptions): EmployeeInput[] {
  const random = createRandom(seed);
  const usedEmails = new Set<string>();
  const employees: EmployeeInput[] = [];

  for (let i = 0; i < count; i++) {
    // Cycle through countries for the first few rows so every country is always present.
    const country =
      i < COUNTRY_PAY.length
        ? (COUNTRY_PAY[i] as (typeof COUNTRY_PAY)[number])
        : pickWeighted(COUNTRY_PAY, random());
    const role = pickWeighted(ROLES, random());
    const employment = pickWeighted(EMPLOYMENT, random());
    const firstName = pick(FIRST_NAMES, random());
    const lastName = pick(LAST_NAMES, random());

    const spread = 0.85 + random() * 0.35;
    const localAnnual =
      role.baseUsd * country.payLevel * country.perUsd * employment.payShare * spread;
    const roundedLocal = Math.max(1000, Math.round(localAnnual / 1000) * 1000);
    const salaryMinor = roundedLocal * 10 ** minorUnitDigits(country.currency);

    const base = `${slug(firstName)}.${slug(lastName)}`;
    let email = `${base}@acme.example`;
    for (let n = 2; usedEmails.has(email); n++) email = `${base}${n}@acme.example`;
    usedEmails.add(email);

    employees.push({
      fullName: `${firstName} ${lastName}`,
      email,
      jobTitle: role.jobTitle,
      department: role.department,
      countryCode: country.code,
      salaryMinor,
      employmentType: employment.type,
      hireDate: randomDate(FIRST_HIRE_DATE, today, random()),
    });
  }
  return employees;
}
