import type { Employee, EmployeeSort, ListEmployeesQuery } from '@salary/shared';
import { and, asc, count, desc, eq, like, or, type SQL } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { employees, type EmployeeRow } from '../../db/schema';
import { employeeCode } from '../../seed/seed-database';
import type { EmployeeRepository, NewEmployee } from './employees.service';

const SORTS: Record<EmployeeSort, SQL[]> = {
  fullName: [asc(employees.fullName), asc(employees.id)],
  '-fullName': [desc(employees.fullName), desc(employees.id)],
  salary: [asc(employees.salaryMinor), asc(employees.id)],
  '-salary': [desc(employees.salaryMinor), desc(employees.id)],
  hireDate: [asc(employees.hireDate), asc(employees.id)],
  '-hireDate': [desc(employees.hireDate), desc(employees.id)],
};

/** Escapes LIKE wildcards so a search for "50%" means the literal text. */
function containsPattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

function toEmployee(row: EmployeeRow): Employee {
  return row as Employee;
}

export class DrizzleEmployeeRepository implements EmployeeRepository {
  constructor(private readonly db: Db) {}

  async list(query: ListEmployeesQuery) {
    const filters: (SQL | undefined)[] = [
      query.country ? eq(employees.countryCode, query.country) : undefined,
      query.jobTitle ? eq(employees.jobTitle, query.jobTitle) : undefined,
      query.department ? eq(employees.department, query.department) : undefined,
      query.search
        ? or(
            like(employees.fullName, containsPattern(query.search)),
            like(employees.email, containsPattern(query.search)),
          )
        : undefined,
    ];
    const where = and(...filters);

    const [rows, [totalRow]] = await Promise.all([
      this.db
        .select()
        .from(employees)
        .where(where)
        .orderBy(...SORTS[query.sort])
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ n: count() }).from(employees).where(where),
    ]);
    return { rows: rows.map(toEmployee), total: totalRow?.n ?? 0 };
  }

  async findById(id: number) {
    const row = await this.db.query.employees.findFirst({ where: eq(employees.id, id) });
    return row && toEmployee(row);
  }

  async findByEmail(email: string) {
    const row = await this.db.query.employees.findFirst({ where: eq(employees.email, email) });
    return row && toEmployee(row);
  }

  async create(employee: NewEmployee) {
    return this.db.transaction(async (tx) => {
      // Insert with a temporary unique code, then derive the real one from the id.
      const [inserted] = await tx
        .insert(employees)
        .values({ ...employee, employeeCode: `PENDING-${crypto.randomUUID()}` })
        .returning({ id: employees.id });
      const id = inserted!.id;
      const [row] = await tx
        .update(employees)
        .set({ employeeCode: employeeCode(id) })
        .where(eq(employees.id, id))
        .returning();
      return toEmployee(row!);
    });
  }

  async update(id: number, patch: Partial<NewEmployee>) {
    const [row] = await this.db
      .update(employees)
      .set(patch)
      .where(eq(employees.id, id))
      .returning();
    return row && toEmployee(row);
  }

  async delete(id: number) {
    const deleted = await this.db
      .delete(employees)
      .where(eq(employees.id, id))
      .returning({ id: employees.id });
    return deleted.length > 0;
  }
}
