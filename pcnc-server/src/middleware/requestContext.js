import { randomUUID } from 'node:crypto';
import logger from '../lib/logger.js';

/**
 * Attach a request id + start time, and log every request once
 * the response finishes (status, duration, size).
 */
export function requestContext(req, res, next) {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', req.id);

  const start = process.hrtime.bigint();
  req.log = logger.child({ reqId: req.id });

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    req.log.info(
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: Math.round(durationMs),
      },
      'request completed',
    );
  });

  next();
}

/** Wrap async route handlers — forwards errors to the error handler. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
