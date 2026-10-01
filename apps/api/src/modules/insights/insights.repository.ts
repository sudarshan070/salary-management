import { asc, avg, count, countDistinct, desc, eq, max, min, sql } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { employees } from '../../db/schema';

export interface SalaryAggregate {
  headcount: number;
  minSalary: number;
  maxSalary: number;
  averageSalary: number;
}

const aggregates = {
  headcount: count(),
  minSalary: min(employees.salaryMinor),
  maxSalary: max(employees.salaryMinor),
  averageSalary: avg(employees.salaryMinor),
};

function toAggregate(row: {
  headcount: number;
  minSalary: number | null;
  maxSalary: number | null;
  averageSalary: string | null;
}): SalaryAggregate {
  return {
    headcount: row.headcount,
    minSalary: row.minSalary ?? 0,
    maxSalary: row.maxSalary ?? 0,
    averageSalary: Math.round(Number(row.averageSalary ?? 0)),
  };
}

/** All aggregation happens in SQLite; only grouped results cross into JavaScript. */
export class InsightsRepository {
  constructor(private readonly db: Db) {}

  async byCountry() {
    const rows = await this.db
      .select({ countryCode: employees.countryCode, currency: employees.currency, ...aggregates })
      .from(employees)
      .groupBy(employees.countryCode, employees.currency)
      .orderBy(desc(count()), asc(employees.countryCode));
    return rows.map((r) => ({
      countryCode: r.countryCode,
      currency: r.currency,
      ...toAggregate(r),
    }));
  }

  /**
   * Median per country: rank salaries within each country, then average the
   * middle one (odd count) or middle two (even count) rows.
   */
  async medianByCountry(): Promise<Map<string, number>> {
    const rows = await this.db.all<{ countryCode: string; median: number }>(sql`
      WITH ranked AS (
        SELECT country_code,
               salary_minor,
               ROW_NUMBER() OVER (PARTITION BY country_code ORDER BY salary_minor) AS rn,
               COUNT(*) OVER (PARTITION BY country_code) AS cnt
        FROM employees
      )
      SELECT country_code AS countryCode, AVG(salary_minor) AS median
      FROM ranked
      WHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2)
      GROUP BY country_code
    `);
    return new Map(rows.map((r) => [r.countryCode, Math.round(Number(r.median))]));
  }

  async byJobTitle(countryCode: string) {
    const rows = await this.db
      .select({ jobTitle: employees.jobTitle, ...aggregates })
      .from(employees)
      .where(eq(employees.countryCode, countryCode))
      .groupBy(employees.jobTitle)
      .orderBy(desc(avg(employees.salaryMinor)), asc(employees.jobTitle));
    return rows.map((r) => ({ jobTitle: r.jobTitle, ...toAggregate(r) }));
  }

  async totals() {
    const [row] = await this.db
      .select({
        totalEmployees: count(),
        countries: countDistinct(employees.countryCode),
        departments: countDistinct(employees.department),
        jobTitles: countDistinct(employees.jobTitle),
      })
      .from(employees);
    return row ?? { totalEmployees: 0, countries: 0, departments: 0, jobTitles: 0 };
  }

  async headcountByEmploymentType() {
    return this.db
      .select({ employmentType: employees.employmentType, headcount: count() })
      .from(employees)
      .groupBy(employees.employmentType)
      .orderBy(desc(count()), asc(employees.employmentType));
  }

  async headcountByDepartment() {
    return this.db
      .select({ department: employees.department, headcount: count() })
      .from(employees)
      .groupBy(employees.department)
      .orderBy(desc(count()), asc(employees.department));
  }

  async distinctDepartments(): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ value: employees.department })
      .from(employees)
      .orderBy(asc(employees.department));
    return rows.map((r) => r.value);
  }

  async distinctJobTitles(): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ value: employees.jobTitle })
      .from(employees)
      .orderBy(asc(employees.jobTitle));
    return rows.map((r) => r.value);
  }
}
