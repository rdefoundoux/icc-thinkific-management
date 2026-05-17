import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import logger from '../lib/logger.js';
import config from '../config/env.js';

/** 404 catch-all — must be registered after all routes. */
export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
}

/** Centralised error handler — must be the LAST middleware. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal Server Error';
  let details;

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request payload';
    details = err.issues.map((i) => ({ path: i.path, message: i.message }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      code = 'UNIQUE_VIOLATION';
      message = `Duplicate value for: ${err.meta?.target ?? 'unique field'}`;
    } else if (err.code === 'P2025') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'Record not found';
    } else {
      status = 400;
      code = `PRISMA_${err.code}`;
      message = err.message.split('\n').pop() ?? 'Database error';
    }
  } else if (err?.status && err?.message) {
    // express-validator / other libs that already shape an HTTP error
    status = err.status;
    message = err.message;
  }

  const logPayload = {
    err: { name: err?.name, message: err?.message, stack: err?.stack },
    req: { id: req.id, method: req.method, url: req.originalUrl, ip: req.ip },
    status,
    code,
  };
  if (status >= 500) logger.error(logPayload, 'request failed');
  else logger.warn(logPayload, 'request rejected');

  const body = { success: false, error: message, code };
  if (details) body.details = details;
  if (config.NODE_ENV === 'development' && status >= 500) body.stack = err?.stack;

  res.status(status).json(body);
}
