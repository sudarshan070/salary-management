import {
  apiErrorSchema,
  countryInsightSchema,
  countryJobTitlesSchema,
  employeeListSchema,
  employeeSchema,
  filterOptionsSchema,
  healthResponseSchema,
  overviewSchema,
  type CountryCode,
  type EmployeeInput,
  type EmployeeUpdate,
  type ListEmployeesQuery,
} from '@salary/shared';
import { z } from 'zod';

/** Base URL of the API; empty means same origin (local dev uses the Vite proxy). */
export const API_URL: string = import.meta.env.VITE_API_URL ?? '';

/** Any failed request: an API error body, a non-JSON failure, or no network at all. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function request<T extends z.ZodType>(
  path: string,
  schema: T | null,
  init: RequestInit = {},
): Promise<z.infer<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init.body ? { 'content-type': 'application/json' } : undefined,
    });
  } catch {
    throw new ApiRequestError(0, 'NETWORK_ERROR', "Can't reach the API. It may be waking up.");
  }

  const body: unknown = res.status === 204 ? undefined : await res.json().catch(() => undefined);
  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    if (parsed.success) {
      const { code, message, details } = parsed.data.error;
      throw new ApiRequestError(res.status, code, message, details);
    }
    throw new ApiRequestError(res.status, 'HTTP_ERROR', `Request failed with ${res.status}`);
  }
  return (schema ? schema.parse(body) : undefined) as z.infer<T>;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  return search.toString();
}

export type EmployeeListParams = Partial<ListEmployeesQuery> &
  Pick<ListEmployeesQuery, 'page' | 'pageSize' | 'sort'>;

export const fetchHealth = () => request('/health', healthResponseSchema);

export const listEmployees = (params: EmployeeListParams) =>
  request(
    `/api/v1/employees?${queryString({
      page: params.page,
      pageSize: params.pageSize,
      sort: params.sort,
      search: params.search,
      country: params.country,
      jobTitle: params.jobTitle,
      department: params.department,
    })}`,
    employeeListSchema,
  );

export const createEmployee = (input: EmployeeInput) =>
  request('/api/v1/employees', employeeSchema, { method: 'POST', body: JSON.stringify(input) });

export const updateEmployee = (id: number, patch: EmployeeUpdate) =>
  request(`/api/v1/employees/${id}`, employeeSchema, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

export const deleteEmployee = (id: number) =>
  request(`/api/v1/employees/${id}`, null, { method: 'DELETE' });

export const fetchOverview = () => request('/api/v1/insights/overview', overviewSchema);

export const fetchCountryInsights = () =>
  request('/api/v1/insights/countries', z.array(countryInsightSchema));

export const fetchJobTitles = (code: CountryCode) =>
  request(`/api/v1/insights/countries/${code}/job-titles`, countryJobTitlesSchema);

export const fetchFilters = () => request('/api/v1/meta/filters', filterOptionsSchema);
