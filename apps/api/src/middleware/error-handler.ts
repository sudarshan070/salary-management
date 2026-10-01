import type { ApiError } from '@salary/shared';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../errors';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));
};

/** The only place that turns errors into HTTP responses, so every failure has one shape. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    const body: ApiError = { error: { code: err.code, message: err.message } };
    if (err.details !== undefined) body.error.details = err.details;
    res.status(err.status).json(body);
    return;
  }
  if (isJsonSyntaxError(err)) {
    const body: ApiError = {
      error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' },
    };
    res.status(400).json(body);
    return;
  }
  console.error(err);
  const body: ApiError = { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } };
  res.status(500).json(body);
};

function isJsonSyntaxError(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    (err as SyntaxError & { type?: string }).type === 'entity.parse.failed'
  );
}
