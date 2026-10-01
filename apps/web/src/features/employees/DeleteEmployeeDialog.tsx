import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { Employee } from '@salary/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, ErrorNotice } from '../../components/ui';
import { deleteEmployee } from '../../lib/api';
import { invalidateEmployeeData } from './EmployeeFormDialog';

export function DeleteEmployeeDialog({
  employee,
  onClose,
}: {
  employee: Employee | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => {
      invalidateEmployeeData(queryClient);
      onClose();
    },
  });

  return (
    <AlertDialog.Root open={employee !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-[rgba(21,24,29,0.45)]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/3 z-50 w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 rounded-[14px] bg-surface p-6 shadow-[0_12px_32px_rgba(21,24,29,0.18)]">
          <AlertDialog.Title className="text-[17px] font-semibold">
            Delete {employee?.fullName}?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-[13px] text-muted">
            {employee?.employeeCode} will be removed permanently and insights will update. This
            can&apos;t be undone.
          </AlertDialog.Description>
          {remove.isError ? (
            <div className="mt-4">
              <ErrorNotice message={remove.error.message} />
            </div>
          ) : null}
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialog.Cancel>
            <Button
              variant="danger"
              disabled={remove.isPending}
              onClick={() => employee && remove.mutate(employee.id)}
            >
              {remove.isPending ? 'Deleting…' : 'Delete employee'}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
