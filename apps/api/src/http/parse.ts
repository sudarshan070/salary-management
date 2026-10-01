import type { z } from 'zod';
import { AppError } from '../errors';

/** Validates untrusted input; failures become a 400 with one entry per invalid field. */
export function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const details = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  throw new AppError(400, 'VALIDATION_ERROR', 'Request is invalid', details);
}
