import { z } from 'zod';
import { COUNTRY_CODES } from './countries';

export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD');

export const employeeInputSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  jobTitle: z.string().trim().min(2).max(100),
  department: z.string().trim().min(2).max(100),
  countryCode: z.enum(COUNTRY_CODES),
  /** Annual gross salary in the currency's minor unit (paise, cents). */
  salaryMinor: z.number().int().positive().max(1_000_000_000_000),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  hireDate: isoDate,
});
export type EmployeeInput = z.infer<typeof employeeInputSchema>;

export const employeeUpdateSchema = employeeInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');
export type EmployeeUpdate = z.infer<typeof employeeUpdateSchema>;

export const employeeSchema = employeeInputSchema.extend({
  id: z.number().int(),
  employeeCode: z.string(),
  currency: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Employee = z.infer<typeof employeeSchema>;

export const EMPLOYEE_SORTS = [
  'fullName',
  '-fullName',
  'salary',
  '-salary',
  'hireDate',
  '-hireDate',
] as const;
export type EmployeeSort = (typeof EMPLOYEE_SORTS)[number];

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().min(1).max(100).optional(),
  country: z.enum(COUNTRY_CODES).optional(),
  jobTitle: z.string().trim().min(1).max(100).optional(),
  department: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(EMPLOYEE_SORTS).default('fullName'),
});
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });
}

export const employeeListSchema = paginatedSchema(employeeSchema);
export type EmployeeList = z.infer<typeof employeeListSchema>;

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
