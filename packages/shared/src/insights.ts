import { z } from 'zod';

/** Salary figures are in the minor unit of `currency`; averages and medians are rounded. */
const salaryStats = {
  headcount: z.number().int(),
  minSalary: z.number().int(),
  maxSalary: z.number().int(),
  averageSalary: z.number().int(),
};

export const countryInsightSchema = z.object({
  countryCode: z.string(),
  countryName: z.string(),
  currency: z.string(),
  ...salaryStats,
  medianSalary: z.number().int(),
});
export type CountryInsight = z.infer<typeof countryInsightSchema>;

export const jobTitleInsightSchema = z.object({
  jobTitle: z.string(),
  ...salaryStats,
});
export type JobTitleInsight = z.infer<typeof jobTitleInsightSchema>;

export const countryJobTitlesSchema = z.object({
  countryCode: z.string(),
  countryName: z.string(),
  currency: z.string(),
  jobTitles: z.array(jobTitleInsightSchema),
});
export type CountryJobTitles = z.infer<typeof countryJobTitlesSchema>;

export const overviewSchema = z.object({
  totalEmployees: z.number().int(),
  countries: z.number().int(),
  departments: z.number().int(),
  jobTitles: z.number().int(),
  byEmploymentType: z.array(z.object({ employmentType: z.string(), headcount: z.number().int() })),
  byDepartment: z.array(z.object({ department: z.string(), headcount: z.number().int() })),
});
export type Overview = z.infer<typeof overviewSchema>;

export const filterOptionsSchema = z.object({
  countries: z.array(z.object({ code: z.string(), name: z.string(), currency: z.string() })),
  departments: z.array(z.string()),
  jobTitles: z.array(z.string()),
});
export type FilterOptions = z.infer<typeof filterOptionsSchema>;
