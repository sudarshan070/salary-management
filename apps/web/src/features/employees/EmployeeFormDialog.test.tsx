import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { employee, filters, page } from '../../test/fixtures';
import { mockApi } from '../../test/mock-api';
import { renderWithProviders } from '../../test/render';
import { EmployeesPage } from './EmployeesPage';

const existing = employee();

function setup(extra: Parameters<typeof mockApi>[0] = {}) {
  const calls = mockApi({
    'GET /api/v1/employees': { body: page([existing], 1) },
    'GET /api/v1/meta/filters': { body: filters },
    ...extra,
  });
  renderWithProviders(<EmployeesPage />);
  return { calls, user: userEvent.setup() };
}

async function fillNewEmployee(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) {
  const d = within(dialog);
  await user.type(d.getByLabelText('Full name'), 'Dana Fischer');
  await user.type(d.getByLabelText('Work email'), 'dana@acme.example');
  await user.type(d.getByLabelText('Job title'), 'Software Engineer');
  await user.type(d.getByLabelText('Department'), 'Engineering');
  await user.selectOptions(d.getByLabelText('Country'), 'DE');
  await user.type(d.getByLabelText('Annual gross salary'), '65,000');
  await user.type(d.getByLabelText('Hire date'), '2024-03-01');
}

describe('Employee form', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('creates an employee, sending the salary in minor units of the country currency', async () => {
    const { calls, user } = setup({
      'POST /api/v1/employees': ({ body }) => ({
        status: 201,
        body: { ...existing, ...(body as object), id: 9 },
      }),
    });
    await user.click(await screen.findByRole('button', { name: 'Add employee' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add employee' });

    await fillNewEmployee(user, dialog);
    expect(within(dialog).getByText('Paid in EUR (set by country)')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.body).toEqual({
      fullName: 'Dana Fischer',
      email: 'dana@acme.example',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      countryCode: 'DE',
      salaryMinor: 6_500_000,
      employmentType: 'full-time',
      hireDate: '2024-03-01',
    });
  });

  it('checks the form before sending anything', async () => {
    const { calls, user } = setup();
    await user.click(await screen.findByRole('button', { name: 'Add employee' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add employee' });

    await user.type(within(dialog).getByLabelText('Work email'), 'not-an-email');
    await user.type(within(dialog).getByLabelText('Annual gross salary'), 'lots');
    await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    expect(await within(dialog).findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(within(dialog).getByText('Enter an amount like 85000 or 85,000.')).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('shows a duplicate email from the API on the email field', async () => {
    const { user } = setup({
      'POST /api/v1/employees': {
        status: 409,
        body: {
          error: {
            code: 'EMAIL_TAKEN',
            message: 'Another employee already uses dana@acme.example',
          },
        },
      },
    });
    await user.click(await screen.findByRole('button', { name: 'Add employee' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add employee' });

    await fillNewEmployee(user, dialog);
    await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    expect(
      await within(dialog).findByText('Another employee already uses this email.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Work email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('edits an existing employee with the current values filled in', async () => {
    const { calls, user } = setup({
      'PATCH /api/v1/employees/2380': ({ body }) => ({
        body: { ...existing, ...(body as object) },
      }),
    });
    await user.click(await screen.findByRole('button', { name: 'Edit Aarav Ahmed' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit employee' });
    const salary = within(dialog).getByLabelText('Annual gross salary');
    expect(salary).toHaveValue('2064000');

    await user.clear(salary);
    await user.type(salary, '22,00,000');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(calls.find((c) => c.method === 'PATCH')?.body).toMatchObject({
      salaryMinor: 220_000_000,
    });
  });
});
