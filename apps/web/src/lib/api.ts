import { healthResponseSchema, type HealthResponse } from '@salary/shared';

/** Base URL of the API; empty means same origin (local dev uses the Vite proxy). */
export const API_URL: string = import.meta.env.VITE_API_URL ?? '';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed with ${res.status}`);
  return healthResponseSchema.parse(await res.json());
}
