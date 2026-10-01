import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { employee, filters, page } from '../../test/fixtures';
import { mockApi, type RecordedCall } from '../../test/mock-api';
import { renderWithProviders } from '../../test/render';
import { EmployeesPage } from './EmployeesPage';

const asha = employee({
  id: 1,
  employeeCode: 'EMP-000001',
  fullName: 'Asha Rao',
  email: 'asha@acme.example',
});
const ben = employee({
  id: 2,
  employeeCode: 'EMP-000002',
  fullName: 'Ben Carter',
  email: 'ben@acme.example',
  countryCode: 'US',
  currency: 'USD',
  salaryMinor: 8_500_000,
  employmentType: 'contract',
});

const lastList = (calls: RecordedCall[]) =>
  calls.filter((c) => c.method === 'GET' && c.path === '/api/v1/employees').at(-1);

describe('EmployeesPage', () => {
  let calls: RecordedCall[];
  let rows = [asha, ben];

  beforeEach(() => {
    rows = [asha, ben];
    calls = mockApi({
      'GET /api/v1/employees': () => ({ body: page(rows, rows.length === 0 ? 0 : 10_000) }),
      'GET /api/v1/meta/filters': { body: filters },
      'DELETE /api/v1/employees/1': () => {
        rows = [ben];
        return { status: 204 };
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('lists employees with code, local-currency salary and type', async () => {
    renderWithProviders(<EmployeesPage />);

    const row = await screen.findByRole('row', { name: /Asha Rao/ });
    expect(within(row).getByText(/EMP-000001/)).toBeInTheDocument();
    expect(within(row).getByText('₹20,64,000')).toBeInTheDocument();
    const benRow = screen.getByRole('row', { name: /Ben Carter/ });
    expect(within(benRow).getByText('$85,000')).toBeInTheDocument();
    expect(within(benRow).getByText('Contract')).toBeInTheDocument();
    expect(screen.getByText('1–25 of 10,000')).toBeInTheDocument();
  });

  it('searches by name or email and goes back to page 1', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />, { route: '/employees?page=3' });
    await screen.findByRole('row', { name: /Asha Rao/ });

    await user.type(screen.getByLabelText('Search'), 'rao');

    await waitFor(() => expect(lastList(calls)?.search.get('search')).toBe('rao'));
    expect(lastList(calls)?.search.get('page')).toBe('1');
  });

  it('filters by country, department and job title', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />);
    await screen.findByRole('option', { name: 'Sales' });

    await user.selectOptions(screen.getByLabelText('Country'), 'IN');
    await user.selectOptions(screen.getByLabelText('Department'), 'Sales');
    await user.selectOptions(screen.getByLabelText('Job title'), 'Sales Manager');

    await waitFor(() => {
      const q = lastList(calls)?.search;
      expect([q?.get('country'), q?.get('department'), q?.get('jobTitle')]).toEqual([
        'IN',
        'Sales',
        'Sales Manager',
      ]);
    });
  });

  it('sorts by salary, highest first on the second click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />);
    await screen.findByRole('row', { name: /Asha Rao/ });

    await user.click(screen.getByRole('button', { name: /Annual salary/ }));
    await waitFor(() => expect(lastList(calls)?.search.get('sort')).toBe('salary'));
    await user.click(screen.getByRole('button', { name: /Annual salary/ }));
    await waitFor(() => expect(lastList(calls)?.search.get('sort')).toBe('-salary'));
  });

  it('moves to the next page', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />);
    await screen.findByRole('row', { name: /Asha Rao/ });

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(lastList(calls)?.search.get('page')).toBe('2'));
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('explains when nothing matches and lets people clear the filters', async () => {
    rows = [];
    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />, { route: '/employees?search=zzz' });

    expect(await screen.findByText('No employees match these filters.')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]!);
    await waitFor(() => expect(lastList(calls)?.search.get('search')).toBeNull());
  });

  it('deletes an employee only after confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />);

    await user.click(await screen.findByRole('button', { name: 'Delete Asha Rao' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete Asha Rao?' });
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);

    await user.click(within(dialog).getByRole('button', { name: 'Delete employee' }));

    await waitFor(() =>
      expect(screen.queryByRole('row', { name: /Asha Rao/ })).not.toBeInTheDocument(),
    );
    expect(calls.some((c) => c.method === 'DELETE' && c.path === '/api/v1/employees/1')).toBe(true);
  });
});
