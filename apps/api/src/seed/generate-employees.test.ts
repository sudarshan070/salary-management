import { COUNTRIES, employeeInputSchema } from '@salary/shared';
import { describe, expect, it } from 'vitest';
import { generateEmployees } from './generate-employees';

const TODAY = '2026-10-01';

describe('generateEmployees', () => {
  const employees = generateEmployees({ count: 10_000, seed: 42, today: TODAY });

  it('generates exactly the requested number of employees', () => {
    expect(employees).toHaveLength(10_000);
  });

  it('is deterministic for the same seed and differs for another seed', () => {
    expect(generateEmployees({ count: 50, seed: 42, today: TODAY })).toEqual(
      employees.slice(0, 50),
    );
    expect(generateEmployees({ count: 50, seed: 7, today: TODAY })).not.toEqual(
      employees.slice(0, 50),
    );
  });

  it('produces records that pass the same validation as the API', () => {
    for (const employee of employees) {
      expect(employeeInputSchema.safeParse(employee).success).toBe(true);
    }
  });

  it('gives every employee a unique email', () => {
    expect(new Set(employees.map((e) => e.email)).size).toBe(employees.length);
  });

  it('covers every country and never hires in the future', () => {
    const countries = new Set(employees.map((e) => e.countryCode));
    expect(countries.size).toBe(COUNTRIES.length);
    expect(employees.every((e) => e.hireDate <= TODAY)).toBe(true);
  });

  it('pays a senior engineer more than a support specialist on average in the same country', () => {
    const avg = (title: string) => {
      const pay = employees
        .filter((e) => e.countryCode === 'IN' && e.jobTitle === title)
        .map((e) => e.salaryMinor);
      return pay.reduce((a, b) => a + b, 0) / pay.length;
    };
    expect(avg('Senior Software Engineer')).toBeGreaterThan(avg('Support Specialist'));
  });
});
