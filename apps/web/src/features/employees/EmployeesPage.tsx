import { EMPLOYEE_SORTS, type Employee, type EmployeeSort } from '@salary/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button, Card, CountryChip, ErrorNotice, Input, Select } from '../../components/ui';
import { fetchFilters, listEmployees } from '../../lib/api';
import { formatDate, formatMoney, formatNumber } from '../../lib/format';
import { useDebouncedValue } from '../../lib/use-debounced-value';
import { DeleteEmployeeDialog } from './DeleteEmployeeDialog';
import { EmployeeFormDialog } from './EmployeeFormDialog';

const PAGE_SIZES = [25, 50, 100] as const;
const FILTER_KEYS = ['search', 'country', 'department', 'jobTitle'] as const;

const TYPE_STYLES: Record<string, { label: string; className: string }> = {
  'full-time': { label: 'Full-time', className: 'bg-[#e7ecfb] text-brand' },
  'part-time': { label: 'Part-time', className: 'bg-line-soft text-ink-2' },
  contract: { label: 'Contract', className: 'bg-[#fdebdd] text-[#9a3412]' },
};

/** Filters, sort and page live in the URL, so a filtered view can be bookmarked or shared. */
function useListState() {
  const [params, setParams] = useSearchParams();
  const sortParam = params.get('sort') as EmployeeSort | null;
  const pageSizeParam = Number(params.get('pageSize'));
  const state = {
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSizeParam) ? pageSizeParam : 25,
    sort:
      sortParam && EMPLOYEE_SORTS.includes(sortParam) ? sortParam : ('fullName' as EmployeeSort),
    search: params.get('search') ?? '',
    country: params.get('country') ?? '',
    department: params.get('department') ?? '',
    jobTitle: params.get('jobTitle') ?? '',
  };

  /** Any change other than the page itself starts again from page 1. */
  const update = (changes: Partial<Record<keyof typeof state, string | number>>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value === '' || value === undefined) next.delete(key);
          else next.set(key, String(value));
        }
        if (!('page' in changes)) next.set('page', '1');
        return next;
      },
      { replace: true },
    );
  };
  const clearFilters = () => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, ''])));
  return { state, update, clearFilters };
}

function SortButton({
  label,
  field,
  sort,
  onSort,
  align = 'left',
}: {
  label: string;
  field: 'fullName' | 'salary' | 'hireDate';
  sort: EmployeeSort;
  onSort: (sort: EmployeeSort) => void;
  align?: 'left' | 'right';
}) {
  const active = sort === field || sort === `-${field}`;
  const descending = sort === `-${field}`;
  return (
    <button
      type="button"
      onClick={() => onSort((active && !descending ? `-${field}` : field) as EmployeeSort)}
      className={clsx(
        'inline-flex items-center gap-1 hover:text-ink',
        active ? 'font-semibold text-ink' : 'font-medium',
        align === 'right' && 'ml-auto',
      )}
    >
      {label}
      <span className="sr-only">
        {active ? (descending ? ', sorted descending' : ', sorted ascending') : ''}
      </span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
        className={clsx(!active && 'opacity-30', descending && 'rotate-180')}
      >
        <path
          d="M3 7.5 6 4.5l3 3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function EmployeesPage() {
  const { state, update, clearFilters } = useListState();
  const [searchText, setSearchText] = useState(state.search);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);
  const [formFor, setFormFor] = useState<Employee | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  useEffect(() => {
    // Only react to what the person typed (update is recreated on every render).
    if (debouncedSearch !== state.search) update({ search: debouncedSearch });
  }, [debouncedSearch]);

  const filters = useQuery({ queryKey: ['filters'], queryFn: fetchFilters, staleTime: 5 * 60_000 });
  const list = useQuery({
    queryKey: ['employees', state],
    queryFn: () =>
      listEmployees({
        page: state.page,
        pageSize: state.pageSize,
        sort: state.sort,
        search: state.search || undefined,
        country: (state.country || undefined) as never,
        department: state.department || undefined,
        jobTitle: state.jobTitle || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const result = list.data;
  const first = result && result.total > 0 ? (result.page - 1) * result.pageSize + 1 : 0;
  const last = result ? Math.min(result.page * result.pageSize, result.total) : 0;
  const hasFilters = FILTER_KEYS.some((k) => state[k] !== '');
  const th = 'border-b border-line px-3 py-3 font-medium';

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Employees</h1>
          <p className="mt-1.5 text-muted">
            {result
              ? `${formatNumber(result.total)} ${hasFilters ? 'matching' : ''} people · `
              : ''}
            search, filter and edit salary records
          </p>
        </div>
        <Button variant="primary" onClick={() => setFormFor('new')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          Add employee
        </Button>
      </div>

      <Card
        aria-label="Filters"
        className="grid items-end gap-3 p-4 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="search" className="text-xs font-medium text-muted">
            Search
          </label>
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="absolute left-3 top-3"
            >
              <circle cx="7" cy="7" r="4.5" stroke="#5B6370" strokeWidth="1.5" />
              <path d="m10.5 10.5 3 3" stroke="#5B6370" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <Input
              id="search"
              type="search"
              placeholder="Name or email"
              className="pl-9"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="f-country" className="text-xs font-medium text-muted">
            Country
          </label>
          <Select
            id="f-country"
            value={state.country}
            onChange={(e) => update({ country: e.target.value })}
          >
            <option value="">All countries</option>
            {filters.data?.countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="f-department" className="text-xs font-medium text-muted">
            Department
          </label>
          <Select
            id="f-department"
            value={state.department}
            onChange={(e) => update({ department: e.target.value })}
          >
            <option value="">All departments</option>
            {filters.data?.departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="f-jobTitle" className="text-xs font-medium text-muted">
            Job title
          </label>
          <Select
            id="f-jobTitle"
            value={state.jobTitle}
            onChange={(e) => update({ jobTitle: e.target.value })}
          >
            <option value="">All job titles</option>
            {filters.data?.jobTitles.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant="ghost"
          disabled={!hasFilters}
          onClick={() => {
            setSearchText('');
            clearFilters();
          }}
        >
          Clear filters
        </Button>
      </Card>

      {list.isError ? (
        <ErrorNotice message={list.error.message} onRetry={() => void list.refetch()} />
      ) : (
        <Card aria-label="Employee list" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse" aria-busy={list.isFetching}>
              <thead>
                <tr className="bg-subtle text-left text-xs text-muted">
                  <th scope="col" className={clsx(th, 'pl-5')}>
                    <SortButton
                      label="Name"
                      field="fullName"
                      sort={state.sort}
                      onSort={(sort) => update({ sort })}
                    />
                  </th>
                  <th scope="col" className={th}>
                    Job title
                  </th>
                  <th scope="col" className={th}>
                    Department
                  </th>
                  <th scope="col" className={th}>
                    Country
                  </th>
                  <th scope="col" className={th}>
                    Type
                  </th>
                  <th scope="col" className={th}>
                    <SortButton
                      label="Hired"
                      field="hireDate"
                      sort={state.sort}
                      onSort={(sort) => update({ sort })}
                    />
                  </th>
                  <th scope="col" className={clsx(th, 'text-right')}>
                    <SortButton
                      label="Annual salary"
                      field="salary"
                      align="right"
                      sort={state.sort}
                      onSort={(sort) => update({ sort })}
                    />
                  </th>
                  <th scope="col" className={clsx(th, 'pr-5')}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className={clsx(list.isPlaceholderData && 'opacity-60')}>
                {list.isPending
                  ? Array.from({ length: 8 }, (_, i) => (
                      <tr key={i} className="border-b border-line-soft" aria-hidden="true">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="h-4 animate-pulse rounded bg-line-soft" />
                        </td>
                      </tr>
                    ))
                  : result?.data.map((e) => {
                      const type = TYPE_STYLES[e.employmentType];
                      const country =
                        filters.data?.countries.find((c) => c.code === e.countryCode)?.name ??
                        e.countryCode;
                      return (
                        <tr key={e.id} className="border-b border-line-soft hover:bg-subtle">
                          <td className="py-3 pl-5 pr-3">
                            <div className="font-semibold">{e.fullName}</div>
                            <div className="text-xs text-muted">
                              <span className="font-mono">{e.employeeCode}</span> · {e.email}
                            </div>
                          </td>
                          <td className="px-3 py-3">{e.jobTitle}</td>
                          <td className="px-3 py-3 text-ink-2">{e.department}</td>
                          <td className="px-3 py-3">
                            <span className="mr-1.5">
                              <CountryChip code={e.countryCode} />
                            </span>
                            {country}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={clsx(
                                'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                                type?.className,
                              )}
                            >
                              {type?.label ?? e.employmentType}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-ink-2">{formatDate(e.hireDate)}</td>
                          <td className="px-3 py-3 text-right font-semibold">
                            {formatMoney(e.salaryMinor, e.currency)}
                          </td>
                          <td className="py-2 pl-3 pr-5">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Edit ${e.fullName}`}
                                className="text-ink-2"
                                onClick={() => setFormFor(e)}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M10.5 2.5 13.5 5.5 6 13H3v-3l7.5-7.5Z"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete ${e.fullName}`}
                                className="text-danger"
                                onClick={() => setDeleting(e)}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                {result && result.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <p className="font-medium">No employees match these filters.</p>
                      <Button
                        variant="ghost"
                        className="mt-2"
                        onClick={() => {
                          setSearchText('');
                          clearFilters();
                        }}
                      >
                        Clear filters
                      </Button>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-subtle px-5 py-3 text-[13px] text-muted">
            <div className="flex items-center gap-2">
              <label htmlFor="page-size">Rows per page</label>
              <Select
                id="page-size"
                className="h-8 w-auto"
                value={state.pageSize}
                onChange={(e) => update({ pageSize: e.target.value })}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </div>
            <div aria-live="polite">
              {result
                ? `${formatNumber(first)}–${formatNumber(last)} of ${formatNumber(result.total)}`
                : ''}
            </div>
            <div className="flex gap-2">
              <Button disabled={state.page <= 1} onClick={() => update({ page: state.page - 1 })}>
                Previous
              </Button>
              <Button
                disabled={!result || state.page >= result.totalPages}
                onClick={() => update({ page: state.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      <EmployeeFormDialog
        open={formFor !== null}
        employee={formFor === 'new' ? null : formFor}
        departments={filters.data?.departments ?? []}
        jobTitles={filters.data?.jobTitles ?? []}
        onClose={() => setFormFor(null)}
      />
      <DeleteEmployeeDialog employee={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
