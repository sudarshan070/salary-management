import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

function mockFetch(response: Promise<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => response),
  );
}

describe('App', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows the API version once the health check succeeds', async () => {
    mockFetch(
      Promise.resolve(
        new Response(JSON.stringify({ status: 'ok', service: 'salary-api', version: '1.2.3' })),
      ),
    );

    render(<App />);

    expect(screen.getByRole('heading', { name: /salary management/i })).toBeInTheDocument();
    expect(await screen.findByText('API is up (v1.2.3)')).toBeInTheDocument();
  });

  it('explains that the server may be waking up when the health check fails', async () => {
    mockFetch(Promise.reject(new Error('network down')));

    render(<App />);

    expect(await screen.findByText(/can't reach the API/i)).toBeInTheDocument();
  });
});
