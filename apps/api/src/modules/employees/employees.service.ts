import {
  currencyForCountry,
  type Employee,
  type EmployeeInput,
  type EmployeeUpdate,
  type ListEmployeesQuery,
} from '@salary/shared';
import { AppError } from '../../errors';

export type NewEmployee = Omit<Employee, 'id' | 'employeeCode'>;

/** What the service needs from storage; the Drizzle repository implements it. */
export interface EmployeeRepository {
  list(query: ListEmployeesQuery): Promise<{ rows: Employee[]; total: number }>;
  findById(id: number): Promise<Employee | undefined>;
  findByEmail(email: string): Promise<Employee | undefined>;
  create(employee: NewEmployee): Promise<Employee>;
  update(id: number, patch: Partial<NewEmployee>): Promise<Employee | undefined>;
  delete(id: number): Promise<boolean>;
}

export type Clock = () => Date;

const notFound = (id: number) =>
  new AppError(404, 'EMPLOYEE_NOT_FOUND', `Employee ${id} does not exist`);

export class EmployeeService {
  constructor(
    private readonly repo: EmployeeRepository,
    private readonly clock: Clock,
  ) {}

  async list(query: ListEmployeesQuery) {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async get(id: number): Promise<Employee> {
    const employee = await this.repo.findById(id);
    if (!employee) throw notFound(id);
    return employee;
  }

  async create(input: EmployeeInput): Promise<Employee> {
    this.assertHireDateNotInFuture(input.hireDate);
    await this.assertEmailAvailable(input.email);
    const now = this.clock().toISOString();
    return this.repo.create({
      ...input,
      currency: currencyForCountry(input.countryCode),
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(id: number, patch: EmployeeUpdate): Promise<Employee> {
    if (!(await this.repo.findById(id))) throw notFound(id);
    if (patch.hireDate) this.assertHireDateNotInFuture(patch.hireDate);
    if (patch.email) await this.assertEmailAvailable(patch.email, id);

    const changes: Partial<NewEmployee> = { ...patch, updatedAt: this.clock().toISOString() };
    if (patch.countryCode) changes.currency = currencyForCountry(patch.countryCode);

    const updated = await this.repo.update(id, changes);
    if (!updated) throw notFound(id);
    return updated;
  }

  async remove(id: number): Promise<void> {
    if (!(await this.repo.delete(id))) throw notFound(id);
  }

  private assertHireDateNotInFuture(hireDate: string) {
    const today = this.clock().toISOString().slice(0, 10);
    if (hireDate > today) {
      throw new AppError(
        400,
        'HIRE_DATE_IN_FUTURE',
        `Hire date ${hireDate} is after today (${today})`,
      );
    }
  }

  private async assertEmailAvailable(email: string, exceptId?: number) {
    const existing = await this.repo.findByEmail(email);
    if (existing && existing.id !== exceptId) {
      throw new AppError(409, 'EMAIL_TAKEN', `Another employee already uses ${email}`);
    }
  }
}
