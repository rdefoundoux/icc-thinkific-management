/**
 * Standardised application error. Carries an HTTP status and a stable
 * machine-readable code so the frontend can react accordingly.
 */
export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const BadRequest    = (msg, details) => new AppError(msg, { status: 400, code: 'BAD_REQUEST',    details });
export const Unauthorized  = (msg = 'Unauthorized')                   => new AppError(msg, { status: 401, code: 'UNAUTHORIZED'  });
export const Forbidden     = (msg = 'Forbidden')                      => new AppError(msg, { status: 403, code: 'FORBIDDEN'     });
export const NotFound      = (msg = 'Resource not found')             => new AppError(msg, { status: 404, code: 'NOT_FOUND'     });
export const Conflict      = (msg, details) => new AppError(msg, { status: 409, code: 'CONFLICT',       details });
export const Unprocessable = (msg, details) => new AppError(msg, { status: 422, code: 'UNPROCESSABLE',  details });
