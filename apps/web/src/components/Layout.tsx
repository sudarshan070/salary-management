import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router';
import { API_URL, fetchHealth } from '../lib/api';

/** Free Render instances sleep when idle; tell people why the first load is slow. */
function useApiStatus() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: false,
    refetchInterval: (query) => (query.state.status === 'success' ? 60_000 : 5_000),
  });
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!health.isPending) return;
    const timer = setTimeout(() => setSlow(true), 3_000);
    return () => clearTimeout(timer);
  }, [health.isPending]);
  return { status: health.isSuccess ? 'online' : health.isError ? 'down' : 'connecting', slow };
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'flex items-center border-b-2 px-3.5',
    isActive
      ? 'border-brand font-semibold text-ink'
      : 'border-transparent font-medium text-muted hover:text-ink',
  );

export function Layout({ children }: { children: ReactNode }) {
  const { status, slow } = useApiStatus();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:gap-8 sm:px-8">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="26" height="26" rx="7" fill="#1E3A8A" />
              <path
                d="M8 18.5 12 10l4 8.5M9.6 15h4.8M18 10v8.5h3"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-[15px] font-semibold">
              ACME{' '}
              <span className="hidden font-medium text-muted sm:inline">Salary Management</span>
            </div>
          </div>
          <nav aria-label="Main" className="flex h-full gap-1">
            <NavLink to="/" end className={navClass}>
              Insights
            </NavLink>
            <NavLink to="/employees" className={navClass}>
              Employees
            </NavLink>
          </nav>
          <div className="ml-auto hidden items-center gap-2 text-[13px] text-muted sm:flex">
            <span
              className={clsx(
                'size-2 rounded-full',
                status === 'online' ? 'bg-ok' : status === 'down' ? 'bg-danger' : 'bg-faint',
              )}
            />
            <span>
              {status === 'online'
                ? 'API online'
                : status === 'down'
                  ? 'API unreachable'
                  : 'Connecting…'}
            </span>
          </div>
        </div>
      </header>

      {import.meta.env.PROD && !API_URL ? (
        <div
          role="alert"
          className="border-b border-[#f3c7c3] bg-[#fdf2f1] text-[13px] text-[#7a1a12]"
        >
          <div className="mx-auto max-w-[1280px] px-4 py-2.5 sm:px-8">
            Configuration error: this build has no VITE_API_URL, so it cannot reach the API. Set it
            in the hosting settings and redeploy (see docs/deployment.md).
          </div>
        </div>
      ) : status === 'down' || (status === 'connecting' && slow) ? (
        <div
          role="alert"
          className="border-b border-[#f5d9b8] bg-[#fdf3e7] text-[13px] text-[#7c3a0a]"
        >
          <div className="mx-auto max-w-[1280px] px-4 py-2.5 sm:px-8">
            The server is waking up (the free hosting plan sleeps when idle). This can take up to a
            minute; the page will load on its own.
          </div>
        </div>
      ) : null}

      <main className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pb-16 pt-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
