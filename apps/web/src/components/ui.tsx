import { clsx } from 'clsx';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { forwardRef } from 'react';

/** Small set of primitives in the style of shadcn/ui, owned by the repo. */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white font-semibold hover:bg-[#172f72]',
  secondary: 'bg-surface border border-control text-ink font-medium hover:bg-subtle',
  ghost: 'bg-transparent text-[#1e40af] font-medium hover:bg-chip',
  danger: 'bg-danger text-white font-semibold hover:bg-[#912018]',
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'md' | 'icon' }
>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'icon' ? 'size-9' : 'h-10 px-4',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});

const controlClass =
  'h-10 w-full rounded-lg border border-control bg-surface px-3 text-ink placeholder:text-faint aria-[invalid=true]:border-danger aria-[invalid=true]:border-[1.5px]';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={clsx(controlClass, className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={clsx(controlClass, 'px-2.5', className)} {...props} />;
  },
);

export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string | undefined;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Card({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <section className={clsx('rounded-xl border border-line bg-surface', className)} {...rest}>
      {children}
    </section>
  );
}

export function CountryChip({ code }: { code: string }) {
  return (
    <span className="rounded bg-chip px-1.5 py-0.5 font-mono text-[11px] text-muted">{code}</span>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 rounded-lg border border-[#f3c7c3] bg-[#fdf2f1] px-4 py-3 text-[13px] text-[#7a1a12]"
    >
      <span>{message}</span>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
