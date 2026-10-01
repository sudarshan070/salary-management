import {
  COUNTRIES,
  currencyForCountry,
  findCountry,
  type CountryCode,
  type CountryInsight,
  type CountryJobTitles,
  type FilterOptions,
  type Overview,
} from '@salary/shared';
import type { InsightsRepository } from './insights.repository';

export class InsightsService {
  constructor(private readonly repo: InsightsRepository) {}

  async countries(): Promise<CountryInsight[]> {
    const [rows, medians] = await Promise.all([this.repo.byCountry(), this.repo.medianByCountry()]);
    return rows.map((row) => ({
      countryCode: row.countryCode,
      countryName: findCountry(row.countryCode)?.name ?? row.countryCode,
      currency: row.currency,
      headcount: row.headcount,
      minSalary: row.minSalary,
      maxSalary: row.maxSalary,
      averageSalary: row.averageSalary,
      medianSalary: medians.get(row.countryCode) ?? 0,
    }));
  }

  async jobTitles(countryCode: CountryCode): Promise<CountryJobTitles> {
    return {
      countryCode,
      countryName: findCountry(countryCode)?.name ?? countryCode,
      currency: currencyForCountry(countryCode),
      jobTitles: await this.repo.byJobTitle(countryCode),
    };
  }

  async overview(): Promise<Overview> {
    const [totals, byEmploymentType, byDepartment] = await Promise.all([
      this.repo.totals(),
      this.repo.headcountByEmploymentType(),
      this.repo.headcountByDepartment(),
    ]);
    return { ...totals, byEmploymentType, byDepartment };
  }

  async filters(): Promise<FilterOptions> {
    const [departments, jobTitles] = await Promise.all([
      this.repo.distinctDepartments(),
      this.repo.distinctJobTitles(),
    ]);
    return {
      countries: COUNTRIES.map(({ code, name, currency }) => ({ code, name, currency })),
      departments,
      jobTitles,
    };
  }
}
