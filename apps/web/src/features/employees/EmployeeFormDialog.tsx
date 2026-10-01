import { COUNTRIES, EMPLOYMENT_TYPES, type Employee, type EmployeeInput } from '@salary/shared';
import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, ErrorNotice, Field, Input, Select } from '../../components/ui';
import { ApiRequestError, createEmployee, updateEmployee } from '../../lib/api';
import { formatDate } from '../../lib/format';
import {
  currencyOf,
  emptyForm,
  employeeFormResolver,
  toFormValues,
  type EmployeeFormValues,
} from './employee-form';

const TYPE_LABELS = { 'full-time': 'Full-time', 'part-time': 'Part-time', contract: 'Contract' };

export function invalidateEmployeeData(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of ['employees', 'overview', 'countries', 'job-titles', 'filters']) {
    void queryClient.invalidateQueries({ queryKey: [key] });
  }
}

export function EmployeeFormDialog({
  open,
  employee,
  departments,
  jobTitles,
  onClose,
}: {
  open: boolean;
  employee: Employee | null;
  departments: string[];
  jobTitles: string[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = employee !== null;
  const form = useForm<EmployeeFormValues, unknown, EmployeeInput>({
    resolver: employeeFormResolver,
    defaultValues: emptyForm,
  });
  const { register, handleSubmit, formState, setError, reset, watch } = form;
  const errors = formState.errors;

  useEffect(() => {
    if (open) reset(employee ? toFormValues(employee) : emptyForm);
  }, [open, employee, reset]);

  const save = useMutation({
    mutationFn: (input: EmployeeInput) =>
      employee ? updateEmployee(employee.id, input) : createEmployee(input),
    onSuccess: () => {
      invalidateEmployeeData(queryClient);
      onClose();
    },
    onError: (error) => {
      if (!(error instanceof ApiRequestError)) return;
      if (error.code === 'EMAIL_TAKEN') {
        setError('email', { message: 'Another employee already uses this email.' });
      } else if (error.code === 'HIRE_DATE_IN_FUTURE') {
        setError('hireDate', { message: "Hire date can't be in the future." });
      } else if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details)) {
        for (const d of error.details as { path: string; message: string }[]) {
          const field = (d.path === 'salaryMinor' ? 'salary' : d.path) as keyof EmployeeFormValues;
          setError(field, { message: d.message });
        }
      }
    },
  });

  const currency = currencyOf(watch('countryCode'));
  const today = new Date().toISOString().slice(0, 10);
  const generalError =
    save.error instanceof ApiRequestError &&
    !['EMAIL_TAKEN', 'HIRE_DATE_IN_FUTURE', 'VALIDATION_ERROR'].includes(save.error.code)
      ? save.error.message
      : null;

  const invalid = (name: keyof EmployeeFormValues) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `emp-${name}-error` : undefined,
  });

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(21,24,29,0.45)]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-14 z-50 max-h-[calc(100vh-7rem)] w-[calc(100%-2rem)] max-w-[640px] -translate-x-1/2 overflow-y-auto rounded-[14px] bg-surface shadow-[0_12px_32px_rgba(21,24,29,0.18)]"
        >
          <form onSubmit={handleSubmit((values) => save.mutate(values))} noValidate>
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div>
                <Dialog.Title className="text-[19px] font-semibold">
                  {isEdit ? 'Edit employee' : 'Add employee'}
                </Dialog.Title>
                {employee ? (
                  <p className="mt-1 text-[13px] text-muted">
                    <span className="font-mono">{employee.employeeCode}</span> · last updated{' '}
                    {formatDate(employee.updatedAt.slice(0, 10))}
                  </p>
                ) : null}
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close" className="text-ink-2">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path
                      d="m4.5 4.5 9 9m0-9-9 9"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </Button>
              </Dialog.Close>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <Field id="emp-fullName" label="Full name" error={errors.fullName?.message}>
                <Input
                  id="emp-fullName"
                  autoComplete="off"
                  {...register('fullName')}
                  {...invalid('fullName')}
                />
              </Field>
              <Field id="emp-email" label="Work email" error={errors.email?.message}>
                <Input
                  id="emp-email"
                  type="email"
                  autoComplete="off"
                  {...register('email')}
                  {...invalid('email')}
                />
              </Field>
              <Field id="emp-jobTitle" label="Job title" error={errors.jobTitle?.message}>
                <Input
                  id="emp-jobTitle"
                  list="job-title-options"
                  {...register('jobTitle')}
                  {...invalid('jobTitle')}
                />
                <datalist id="job-title-options">
                  {jobTitles.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>
              <Field id="emp-department" label="Department" error={errors.department?.message}>
                <Input
                  id="emp-department"
                  list="department-options"
                  {...register('department')}
                  {...invalid('department')}
                />
                <datalist id="department-options">
                  {departments.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </Field>
              <Field
                id="emp-countryCode"
                label="Country"
                hint={`Paid in ${currency} (set by country)`}
                error={errors.countryCode?.message}
              >
                <Select
                  id="emp-countryCode"
                  {...register('countryCode')}
                  {...invalid('countryCode')}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                id="emp-salary"
                label="Annual gross salary"
                hint={`Gross per year, in ${currency}`}
                error={errors.salary?.message}
              >
                <div className="flex h-10 overflow-hidden rounded-lg border border-control has-[[aria-invalid=true]]:border-danger">
                  <span className="flex items-center border-r border-control bg-chip px-3 font-medium text-ink-2">
                    {currency}
                  </span>
                  <input
                    id="emp-salary"
                    inputMode="decimal"
                    autoComplete="off"
                    className="min-w-0 grow px-3 text-ink"
                    {...register('salary')}
                    {...invalid('salary')}
                  />
                </div>
              </Field>

              <fieldset className="flex flex-col gap-1.5 sm:col-span-2">
                <legend className="mb-1.5 text-[13px] font-medium">Employment type</legend>
                <div className="flex flex-wrap gap-2">
                  {EMPLOYMENT_TYPES.map((type) => (
                    <label
                      key={type}
                      className={clsx(
                        'inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3.5',
                        watch('employmentType') === type
                          ? 'border-[1.5px] border-brand bg-brand-soft font-medium'
                          : 'border-control',
                      )}
                    >
                      <input
                        type="radio"
                        value={type}
                        className="accent-brand"
                        {...register('employmentType')}
                      />
                      {TYPE_LABELS[type]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Field
                id="emp-hireDate"
                label="Hire date"
                hint="Can't be in the future"
                error={errors.hireDate?.message}
              >
                <Input
                  id="emp-hireDate"
                  type="date"
                  max={today}
                  {...register('hireDate')}
                  {...invalid('hireDate')}
                />
              </Field>
            </div>

            {generalError ? (
              <div className="px-6 pb-4">
                <ErrorNotice message={generalError} />
              </div>
            ) : null}

            <div className="flex items-center gap-3 border-t border-line px-6 py-4">
              <Dialog.Close asChild>
                <Button variant="secondary" className="ml-auto">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" variant="primary" disabled={save.isPending}>
                {save.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add employee'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
