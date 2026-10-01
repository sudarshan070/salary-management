import { useEffect, useState } from 'react';
import { fetchHealth } from './lib/api';

type ApiStatus = { kind: 'checking' } | { kind: 'up'; version: string } | { kind: 'down' };

export function App() {
  const [status, setStatus] = useState<ApiStatus>({ kind: 'checking' });

  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((health) => active && setStatus({ kind: 'up', version: health.version }))
      .catch(() => active && setStatus({ kind: 'down' }));
    return () => {
      active = false;
    };
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Salary Management</h1>
      <p>Manage ACME employee salaries and see how the organisation pays people.</p>
      <p role="status">
        {status.kind === 'checking' &&
          'Checking the API… the free server can take up to a minute to wake up.'}
        {status.kind === 'up' && `API is up (v${status.version})`}
        {status.kind === 'down' && "Can't reach the API right now. Please retry in a minute."}
      </p>
    </main>
  );
}
