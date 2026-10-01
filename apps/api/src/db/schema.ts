import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const employees = sqliteTable(
  'employees',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    employeeCode: text('employee_code').notNull().unique(),
    fullName: text('full_name').notNull(),
    email: text('email').notNull().unique(),
    jobTitle: text('job_title').notNull(),
    department: text('department').notNull(),
    countryCode: text('country_code').notNull(),
    currency: text('currency').notNull(),
    /** Annual gross salary in the currency's minor unit (ADR 0005). */
    salaryMinor: integer('salary_minor').notNull(),
    employmentType: text('employment_type', {
      enum: ['full-time', 'part-time', 'contract'],
    }).notNull(),
    hireDate: text('hire_date').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [
    index('employees_country_job_title_idx').on(t.countryCode, t.jobTitle),
    index('employees_country_salary_idx').on(t.countryCode, t.salaryMinor),
    index('employees_department_idx').on(t.department),
    index('employees_job_title_idx').on(t.jobTitle),
    index('employees_full_name_idx').on(t.fullName),
  ],
);

export type EmployeeRow = typeof employees.$inferSelect;
export type NewEmployeeRow = typeof employees.$inferInsert;
