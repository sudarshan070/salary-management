import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { countries, jobTitles, overview } from '../../test/fixtures';
import { mockApi, type RecordedCall } from '../../test/mock-api';
import { renderWithProviders } from '../../test/render';
import { InsightsPage } from './InsightsPage';

describe('InsightsPage', () => {
  let calls: RecordedCall[];

  beforeEach(() => {
    calls = mockApi({
      'GET /api/v1/insights/overview': { body: overview },
      'GET /api/v1/insights/countries': { body: countries },
      'GET /api/v1/insights/countries/IN/job-titles': { body: jobTitles('IN') },
      'GET /api/v1/insights/countries/US/job-titles': { body: jobTitles('US') },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows organisation totals', async () => {
    renderWithProviders(<InsightsPage />);

    const totals = await screen.findByRole('region', { name: 'Organisation totals' });
    expect(within(totals).getByText('10,000')).toBeInTheDocument();
    expect(within(totals).getByText('17')).toBeInTheDocument();
  });

  it('lists pay per country in each local currency', async () => {
    renderWithProviders(<InsightsPage />);

    const india = await screen.findByRole('row', { name: /India/ });
    expect(within(india).getByText('₹17,39,000')).toBeInTheDocument();
    expect(within(india).getByText('2,975')).toBeInTheDocument();
    const us = screen.getByRole('row', { name: /United States/ });
    expect(within(us).getByText('$85,000')).toBeInTheDocument();
  });

  it('breaks the largest country down by job title, and switches country on request', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InsightsPage />);

    expect(
      await screen.findByRole('heading', { name: 'Pay by job title in India' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Engineering Manager')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Country'), 'US');

    expect(await screen.findByText('Support Specialist')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Pay by job title in United States' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(calls.some((c) => c.path === '/api/v1/insights/countries/US/job-titles')).toBe(true),
    );
  });

  it('selects a country by clicking its row', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InsightsPage />);

    await user.click(
      await screen.findByRole('button', { name: 'Show job titles in United States' }),
    );

    expect(await screen.findByText('Support Specialist')).toBeInTheDocument();
  });

  it('shows headcount by department and employment type', async () => {
    renderWithProviders(<InsightsPage />);

    expect(await screen.findByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('8,546 · 85.5%')).toBeInTheDocument();
  });

  it('offers a retry when insights fail to load', async () => {
    mockApi({});
    renderWithProviders(<InsightsPage />);

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    expect(screen.getAllByRole('button', { name: 'Retry' }).length).toBeGreaterThan(0);
  });
});
