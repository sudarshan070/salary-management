import { currencyForCountry, type EmployeeInput } from '@salary/shared';
import type { Db } from '../db/client';
import { employees, type NewEmployeeRow } from '../db/schema';

const BATCH_SIZE = 500;

export function employeeCode(sequence: number): string {
  return `EMP-${String(sequence).padStart(6, '0')}`;
}

/** Replaces all employees with `input`, inserting in batches inside one transaction. */
export async function seedDatabase(db: Db, input: EmployeeInput[], now: string): Promise<void> {
  const rows: NewEmployeeRow[] = input.map((employee, index) => ({
    ...employee,
    employeeCode: employeeCode(index + 1),
    currency: currencyForCountry(employee.countryCode),
    createdAt: now,
    updatedAt: now,
  }));

  await db.transaction(async (tx) => {
    await tx.delete(employees);
    await tx.run("DELETE FROM sqlite_sequence WHERE name = 'employees'");
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await tx.insert(employees).values(rows.slice(i, i + BATCH_SIZE));
    }
  });
}
