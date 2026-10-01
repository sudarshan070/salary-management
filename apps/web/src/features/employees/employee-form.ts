import {
  employeeInputSchema,
  findCountry,
  type Employee,
  type EmployeeInput,
  type EmploymentType,
} from '@salary/shared';
import type { FieldErrors, Resolver } from 'react-hook-form';
import { fromMinor, toMinor } from '../../lib/format';

/** What the form holds: the salary as typed text, everything else as the API expects. */
export interface EmployeeFormValues {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  countryCode: string;
  salary: string;
  employmentType: EmploymentType;
  hireDate: string;
}

export const emptyForm: EmployeeFormValues = {
  fullName: '',
  email: '',
  jobTitle: '',
  department: '',
  countryCode: 'IN',
  salary: '',
  employmentType: 'full-time',
  hireDate: '',
};

export function toFormValues(e: Employee): EmployeeFormValues {
  return {
    fullName: e.fullName,
    email: e.email,
    jobTitle: e.jobTitle,
    department: e.department,
    countryCode: e.countryCode,
    salary: fromMinor(e.salaryMinor, e.currency),
    employmentType: e.employmentType,
    hireDate: e.hireDate,
  };
}

export function currencyOf(countryCode: string): string {
  return findCountry(countryCode)?.currency ?? 'USD';
}

/** Friendly wording for the rules the shared schema enforces. */
const MESSAGES: Partial<Record<keyof EmployeeFormValues, string>> = {
  fullName: 'Enter the full name (2 to 100 characters).',
  email: 'Enter a valid email address.',
  jobTitle: 'Enter a job title.',
  department: 'Enter a department.',
  countryCode: 'Pick a country.',
  salary: 'Enter an amount like 85000 or 85,000.',
  employmentType: 'Pick an employment type.',
  hireDate: 'Pick a hire date.',
};

/**
 * Validates with the SAME shared schema the API uses, after turning the typed
 * salary into minor units, so client and server rules can never drift apart.
 */
export const employeeFormResolver: Resolver<EmployeeFormValues, unknown, EmployeeInput> = async (
  values,
) => {
  const salaryMinor = toMinor(values.salary, currencyOf(values.countryCode));
  const { salary: _salary, ...rest } = values;
  const result = employeeInputSchema.safeParse({ ...rest, salaryMinor: salaryMinor ?? undefined });

  const errors: FieldErrors<EmployeeFormValues> = {};
  if (salaryMinor === null) errors.salary = { type: 'format', message: MESSAGES.salary! };
  if (!result.success) {
    for (const issue of result.error.issues) {
      const raw = String(issue.path[0]);
      const field = (raw === 'salaryMinor' ? 'salary' : raw) as keyof EmployeeFormValues;
      if (!errors[field])
        errors[field] = { type: issue.code, message: MESSAGES[field] ?? issue.message };
    }
  }
  if (Object.keys(errors).length > 0 || !result.success) return { values: {}, errors };
  return { values: result.data, errors: {} };
};
