import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, listEmployees, createEmployee } from './api';

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('sends only the filters that are set', async () => {
    const fetchMock = stubFetch(200, { data: [], page: 2, pageSize: 25, total: 0, totalPages: 0 });

    await listEmployees({
      page: 2,
      pageSize: 25,
      sort: 'fullName',
      search: 'rao',
      country: undefined,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/employees?page=2&pageSize=25&sort=fullName&search=rao',
      expect.anything(),
    );
  });

  it('turns an API error body into an ApiRequestError with its code and details', async () => {
    stubFetch(409, { error: { code: 'EMAIL_TAKEN', message: 'Another employee already uses x' } });

    const error = await createEmployee({
      fullName: 'Asha Rao',
      email: 'x@acme.example',
      jobTitle: 'Engineer',
      department: 'Engineering',
      countryCode: 'IN',
      salaryMinor: 100,
      employmentType: 'full-time',
      hireDate: '2024-01-01',
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ status: 409, code: 'EMAIL_TAKEN' });
  });

  it('reports a network failure as an ApiRequestError with status 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );

    const error = await listEmployees({ page: 1, pageSize: 25, sort: 'fullName' }).catch(
      (e: unknown) => e,
    );

    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('reports an HTML page instead of JSON (for example a missing VITE_API_URL) as BAD_RESPONSE', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<!doctype html><html></html>', { status: 200 })),
    );

    const error = await listEmployees({ page: 1, pageSize: 25, sort: 'fullName' }).catch(
      (e: unknown) => e,
    );

    expect(error).toMatchObject({ code: 'BAD_RESPONSE' });
  });
});
