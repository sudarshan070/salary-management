import type { Employee, EmployeeInput } from '@salary/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../../errors';
import { EmployeeService, type EmployeeRepository, type NewEmployee } from './employees.service';

/** In-memory stand-in for the database, so business rules are tested in isolation. */
class FakeEmployeeRepository implements EmployeeRepository {
  rows: Employee[] = [];

  async list() {
    return { rows: this.rows, total: this.rows.length };
  }
  async findById(id: number) {
    return this.rows.find((r) => r.id === id);
  }
  async findByEmail(email: string) {
    return this.rows.find((r) => r.email === email);
  }
  async create(employee: NewEmployee) {
    const id = this.rows.length + 1;
    const row: Employee = { ...employee, id, employeeCode: `EMP-${id}` };
    this.rows.push(row);
    return row;
  }
  async update(id: number, patch: Partial<Employee>) {
    const row = await this.findById(id);
    if (!row) return undefined;
    Object.assign(row, patch);
    return row;
  }
  async delete(id: number) {
    const before = this.rows.length;
    this.rows = this.rows.filter((r) => r.id !== id);
    return this.rows.length < before;
  }
}

const NOW = new Date('2026-10-01T09:00:00.000Z');

const input: EmployeeInput = {
  fullName: 'Asha Rao',
  email: 'asha.rao@acme.example',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  countryCode: 'IN',
  salaryMinor: 180_000_000,
  employmentType: 'full-time',
  hireDate: '2023-04-01',
};

async function expectAppError(promise: Promise<unknown>, status: number, code: string) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(AppError);
  expect(error).toMatchObject({ status, code });
}

describe('EmployeeService', () => {
  let repo: FakeEmployeeRepository;
  let service: EmployeeService;

  beforeEach(() => {
    repo = new FakeEmployeeRepository();
    service = new EmployeeService(repo, () => NOW);
  });

  describe('create', () => {
    it('derives the currency from the country and stamps both timestamps', async () => {
      const created = await service.create(input);

      expect(created).toMatchObject({
        ...input,
        currency: 'INR',
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      });
    });

    it('refuses an email that another employee already uses', async () => {
      await service.create(input);

      await expectAppError(
        service.create({ ...input, fullName: 'Someone Else' }),
        409,
        'EMAIL_TAKEN',
      );
    });

    it('refuses a hire date in the future', async () => {
      await expectAppError(
        service.create({ ...input, hireDate: '2026-10-02' }),
        400,
        'HIRE_DATE_IN_FUTURE',
      );
    });
  });

  describe('update', () => {
    it('changes the currency when the country changes', async () => {
      const created = await service.create(input);

      const updated = await service.update(created.id, {
        countryCode: 'DE',
        salaryMinor: 7_000_000,
      });

      expect(updated).toMatchObject({ countryCode: 'DE', currency: 'EUR', salaryMinor: 7_000_000 });
    });

    it('allows keeping the same email', async () => {
      const created = await service.create(input);

      await expect(service.update(created.id, { email: input.email })).resolves.toBeDefined();
    });

    it('refuses an email that belongs to a different employee', async () => {
      await service.create(input);
      const other = await service.create({ ...input, email: 'other@acme.example' });

      await expectAppError(service.update(other.id, { email: input.email }), 409, 'EMAIL_TAKEN');
    });

    it('reports a missing employee as not found', async () => {
      await expectAppError(service.update(99, { salaryMinor: 1 }), 404, 'EMPLOYEE_NOT_FOUND');
    });
  });

  describe('get and remove', () => {
    it('reports a missing employee as not found', async () => {
      await expectAppError(service.get(99), 404, 'EMPLOYEE_NOT_FOUND');
      await expectAppError(service.remove(99), 404, 'EMPLOYEE_NOT_FOUND');
    });
  });
});
