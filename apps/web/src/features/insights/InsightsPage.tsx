import type { CountryCode, CountryInsight, Overview } from '@salary/shared';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CountryChip, ErrorNotice, Select } from '../../components/ui';
import { fetchCountryInsights, fetchJobTitles, fetchOverview } from '../../lib/api';
import { formatMoney, formatNumber } from '../../lib/format';

const TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
};
const TYPE_COLORS: Record<string, string> = {
  'full-time': 'bg-bar',
  contract: 'bg-median',
  'part-time': 'bg-[#8a94a6]',
};

const th = 'border-y border-line px-3 py-2.5 font-medium';

function Kpis({ overview }: { overview: Overview }) {
  const items = [
    { label: 'Employees', value: overview.totalEmployees },
    { label: 'Countries', value: overview.countries },
    { label: 'Departments', value: overview.departments },
    { label: 'Job titles', value: overview.jobTitles },
  ];
  return (
    <section aria-label="Organisation totals" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-5">
          <div className="text-[13px] font-medium text-muted">{item.label}</div>
          <div className="mt-1.5 text-[32px] font-bold tracking-tight">
            {formatNumber(item.value)}
          </div>
        </Card>
      ))}
    </section>
  );
}

function CountryTable({
  rows,
  selected,
  onSelect,
}: {
  rows: CountryInsight[];
  selected: string | undefined;
  onSelect: (code: CountryCode) => void;
}) {
  return (
    <Card aria-labelledby="by-country" className="overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-4 px-5 pb-3 pt-5">
        <div>
          <h2 id="by-country" className="text-[17px] font-semibold">
            Pay by country
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            Bar shows the range from lowest to highest salary; the tick marks the median.
          </p>
        </div>
        <div className="flex items-center gap-3.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-[18px] rounded-sm bg-range" />
            Min → max
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-[3px] bg-median" />
            Median
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th scope="col" className={clsx(th, 'pl-5')}>
                Country
              </th>
              <th scope="col" className={clsx(th, 'text-right')}>
                People
              </th>
              <th scope="col" className={clsx(th, 'text-right')}>
                Median
              </th>
              <th scope="col" className={clsx(th, 'text-right')}>
                Average
              </th>
              <th scope="col" className={clsx(th, 'w-[34%] pr-5')}>
                Range
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const spread = c.maxSalary - c.minSalary;
              const medianPct = spread > 0 ? ((c.medianSalary - c.minSalary) / spread) * 100 : 0;
              const isSelected = c.countryCode === selected;
              return (
                <tr
                  key={c.countryCode}
                  className={clsx('border-b border-line-soft', isSelected && 'bg-brand-soft')}
                >
                  <th scope="row" className="py-3 pl-5 pr-3 text-left font-medium">
                    <button
                      type="button"
                      onClick={() => onSelect(c.countryCode as CountryCode)}
                      aria-label={`Show job titles in ${c.countryName}`}
                      aria-pressed={isSelected}
                      className="flex items-center gap-2.5 rounded text-left hover:text-brand"
                    >
                      <CountryChip code={c.countryCode} />
                      <span>{c.countryName}</span>
                    </button>
                  </th>
                  <td className="px-3 py-3 text-right">{formatNumber(c.headcount)}</td>
                  <td className="px-3 py-3 text-right font-semibold">
                    {formatMoney(c.medianSalary, c.currency)}
                  </td>
                  <td className="px-3 py-3 text-right text-ink-2">
                    {formatMoney(c.averageSalary, c.currency)}
                  </td>
                  <td className="py-3 pl-3 pr-5">
                    <div className="flex items-center gap-2.5 text-xs text-muted">
                      <span className="min-w-[72px] text-right">
                        {formatMoney(c.minSalary, c.currency)}
                      </span>
                      <div className="relative h-2 grow rounded bg-range">
                        <div
                          className="absolute -top-1 h-4 w-[3px] rounded-sm bg-median"
                          style={{ left: `${medianPct}%` }}
                        />
                      </div>
                      <span className="min-w-[80px]">{formatMoney(c.maxSalary, c.currency)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-5 py-3 text-xs text-muted">Select a country to see pay by job title.</p>
    </Card>
  );
}

function HeadcountPanels({ overview }: { overview: Overview }) {
  const largest = Math.max(...overview.byDepartment.map((d) => d.headcount), 1);
  const total = overview.totalEmployees || 1;
  return (
    <div className="flex flex-col gap-4">
      <Card aria-labelledby="by-dept" className="p-5">
        <h2 id="by-dept" className="mb-3.5 text-[17px] font-semibold">
          Headcount by department
        </h2>
        <ul className="flex flex-col gap-3">
          {overview.byDepartment.map((d) => (
            <li key={d.department}>
              <div className="mb-1 flex justify-between text-[13px]">
                <span>{d.department}</span>
                <span className="text-muted">{formatNumber(d.headcount)}</span>
              </div>
              <div className="h-2 rounded bg-line-soft">
                <div
                  className="h-2 rounded bg-bar"
                  style={{ width: `${(d.headcount / largest) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Card aria-labelledby="by-type" className="p-5">
        <h2 id="by-type" className="mb-3.5 text-[17px] font-semibold">
          Employment type
        </h2>
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-md">
          {overview.byEmploymentType.map((t) => (
            <div
              key={t.employmentType}
              className={TYPE_COLORS[t.employmentType] ?? 'bg-faint'}
              style={{ width: `${(t.headcount / total) * 100}%` }}
            />
          ))}
        </div>
        <ul className="mt-3.5 flex flex-col gap-2">
          {overview.byEmploymentType.map((t) => (
            <li key={t.employmentType} className="flex items-center gap-2 text-[13px]">
              <span
                className={clsx('size-2.5 rounded-sm', TYPE_COLORS[t.employmentType] ?? 'bg-faint')}
              />
              <span>{TYPE_LABELS[t.employmentType] ?? t.employmentType}</span>
              <span className="ml-auto text-muted">
                {formatNumber(t.headcount)} · {((t.headcount / total) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function JobTitles({
  country,
  countries,
  onSelect,
}: {
  country: CountryInsight;
  countries: CountryInsight[];
  onSelect: (code: CountryCode) => void;
}) {
  const code = country.countryCode as CountryCode;
  const query = useQuery({ queryKey: ['job-titles', code], queryFn: () => fetchJobTitles(code) });
  const titles = query.data?.jobTitles ?? [];
  const top = Math.max(...titles.map((t) => t.averageSalary), 1);

  return (
    <Card aria-labelledby="by-title" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 id="by-title" className="text-[17px] font-semibold">
            Pay by job title in {country.countryName}
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            {formatNumber(country.headcount)} people · {country.currency} · sorted by average
            salary, highest first
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="country-pick" className="text-xs font-medium text-muted">
            Country
          </label>
          <Select
            id="country-pick"
            className="min-w-[220px]"
            value={code}
            onChange={(e) => onSelect(e.target.value as CountryCode)}
          >
            {countries.map((c) => (
              <option key={c.countryCode} value={c.countryCode}>
                {c.countryName} ({c.currency})
              </option>
            ))}
          </Select>
        </div>
      </div>
      {query.isError ? (
        <div className="px-5 pb-5">
          <ErrorNotice message="Couldn't load job titles." onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse" aria-busy={query.isPending}>
            <thead>
              <tr className="text-left text-xs text-muted">
                <th scope="col" className={clsx(th, 'pl-5')}>
                  Job title
                </th>
                <th scope="col" className={clsx(th, 'text-right')}>
                  People
                </th>
                <th scope="col" className={clsx(th, 'text-right')}>
                  Lowest
                </th>
                <th scope="col" className={clsx(th, 'text-right')}>
                  Average
                </th>
                <th scope="col" className={clsx(th, 'text-right')}>
                  Highest
                </th>
                <th scope="col" className={clsx(th, 'w-[30%] pr-5')}>
                  Average vs top-paid title
                </th>
              </tr>
            </thead>
            <tbody>
              {titles.map((t) => (
                <tr key={t.jobTitle} className="border-b border-line-soft">
                  <th scope="row" className="py-2.5 pl-5 pr-3 text-left font-medium">
                    {t.jobTitle}
                  </th>
                  <td className="px-3 py-2.5 text-right">{formatNumber(t.headcount)}</td>
                  <td className="px-3 py-2.5 text-right text-ink-2">
                    {formatMoney(t.minSalary, country.currency)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold">
                    {formatMoney(t.averageSalary, country.currency)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-ink-2">
                    {formatMoney(t.maxSalary, country.currency)}
                  </td>
                  <td className="py-2.5 pl-3 pr-5">
                    <div className="h-2 rounded bg-line-soft">
                      <div
                        className="h-2 rounded bg-bar"
                        style={{ width: `${(t.averageSalary / top) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {query.isSuccess && titles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">
                    No employees in {country.countryName} yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function InsightsPage() {
  const overview = useQuery({ queryKey: ['overview'], queryFn: fetchOverview });
  const countries = useQuery({ queryKey: ['countries'], queryFn: fetchCountryInsights });
  const [picked, setPicked] = useState<CountryCode | undefined>();

  const rows = countries.data ?? [];
  const selected = rows.find((c) => c.countryCode === picked) ?? rows[0];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">How ACME pays people</h1>
          <p className="mt-1.5 text-muted">
            Annual gross salary in each country&apos;s own currency. Figures never mix currencies.
          </p>
        </div>
        <Link
          to="/employees"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-control bg-surface px-4 font-medium text-ink hover:bg-subtle"
        >
          Manage employees
        </Link>
      </div>

      {overview.isError ? (
        <ErrorNotice
          message="Couldn't load organisation totals."
          onRetry={() => void overview.refetch()}
        />
      ) : overview.data ? (
        <Kpis overview={overview.data} />
      ) : (
        <div className="h-[110px] animate-pulse rounded-xl bg-line-soft" aria-hidden="true" />
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        {countries.isError ? (
          <ErrorNotice
            message="Couldn't load pay by country."
            onRetry={() => void countries.refetch()}
          />
        ) : countries.data ? (
          <CountryTable rows={rows} selected={selected?.countryCode} onSelect={setPicked} />
        ) : (
          <div className="h-[480px] animate-pulse rounded-xl bg-line-soft" aria-hidden="true" />
        )}
        {overview.data ? <HeadcountPanels overview={overview.data} /> : null}
      </div>

      {selected ? <JobTitles country={selected} countries={rows} onSelect={setPicked} /> : null}
    </>
  );
}
