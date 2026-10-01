import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { mockApi } from './test/mock-api';
import { health } from './test/fixtures';

describe('App shell', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows the product name, both sections and an online status', async () => {
    mockApi({ 'GET /health': { body: health } });

    render(<App />);

    expect(screen.getByText('Salary Management')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Employees' })).toBeInTheDocument();
    expect(await screen.findByText('API online')).toBeInTheDocument();
  });

  it('warns that the free server may be waking up when the API cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('offline'))),
    );

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/waking up/i);
  });
});
