import { describe, expect, it } from 'vitest';
import { COUNTRIES, currencyForCountry } from './countries';
import { employeeInputSchema, employeeUpdateSchema, listEmployeesQuerySchema } from './employee';

const validInput = {
  fullName: 'Asha Rao',
  email: 'asha.rao@acme.example',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  countryCode: 'IN',
  salaryMinor: 1_800_000_00,
  employmentType: 'full-time',
  hireDate: '2023-04-01',
};

describe('countries', () => {
  it('maps every supported country to its ISO 4217 currency', () => {
    expect(currencyForCountry('IN')).toBe('INR');
    expect(currencyForCountry('US')).toBe('USD');
    expect(currencyForCountry('DE')).toBe('EUR');
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(8);
  });
});

describe('employeeInputSchema', () => {
  it('accepts a complete, valid employee', () => {
    expect(employeeInputSchema.parse(validInput)).toEqual(validInput);
  });

  it('trims the name and lower-cases the email', () => {
    const parsed = employeeInputSchema.parse({
      ...validInput,
      fullName: '  Asha Rao ',
      email: 'Asha.Rao@ACME.example',
    });
    expect(parsed.fullName).toBe('Asha Rao');
    expect(parsed.email).toBe('asha.rao@acme.example');
  });

  it.each([
    ['fullName', 'A'],
    ['email', 'not-an-email'],
    ['countryCode', 'XX'],
    ['salaryMinor', 0],
    ['salaryMinor', 1234.5],
    ['employmentType', 'intern'],
    ['hireDate', '01/04/2023'],
  ])('rejects an invalid %s (%s)', (field, value) => {
    const result = employeeInputSchema.safeParse({ ...validInput, [field]: value });
    expect(result.success).toBe(false);
  });
});

describe('employeeUpdateSchema', () => {
  it('accepts a partial update', () => {
    expect(employeeUpdateSchema.parse({ salaryMinor: 2_000_000_00 })).toEqual({
      salaryMinor: 2_000_000_00,
    });
  });

  it('rejects an empty update', () => {
    expect(employeeUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe('listEmployeesQuerySchema', () => {
  it('applies defaults for page, page size and sort', () => {
    expect(listEmployeesQuerySchema.parse({})).toEqual({ page: 1, pageSize: 25, sort: 'fullName' });
  });

  it('coerces numeric query strings', () => {
    const q = listEmployeesQuerySchema.parse({ page: '3', pageSize: '50' });
    expect(q.page).toBe(3);
    expect(q.pageSize).toBe(50);
  });

  it('caps page size at 100', () => {
    expect(listEmployeesQuerySchema.safeParse({ pageSize: '500' }).success).toBe(false);
  });

  it('rejects an unknown sort key', () => {
    expect(listEmployeesQuerySchema.safeParse({ sort: 'password' }).success).toBe(false);
  });
});
