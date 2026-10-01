import { vi } from 'vitest';

type Handler = (req: { url: URL; body: unknown }) => { status?: number; body?: unknown };

export interface RecordedCall {
  method: string;
  path: string;
  search: URLSearchParams;
  body: unknown;
}

/**
 * Replaces fetch with a tiny in-memory router keyed by "METHOD /path".
 * Unknown routes answer 404 in the API's error shape. Returns the call log.
 */
export function mockApi(routes: Record<string, Handler | { status?: number; body?: unknown }>) {
  const calls: RecordedCall[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path: url.pathname, search: url.searchParams, body });

    const route = routes[`${method} ${url.pathname}`];
    const result =
      typeof route === 'function'
        ? route({ url, body })
        : (route ?? { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Not mocked' } } });
    const status = result.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(result.body ?? {}), { status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}
