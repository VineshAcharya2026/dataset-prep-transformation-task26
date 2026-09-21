export class AppError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  NOT_PROCESSED: 'NOT_PROCESSED',
  INVALID_TRANSFORMATION: 'INVALID_TRANSFORMATION',
  TYPE_CONVERSION: 'TYPE_CONVERSION',
  TRANSFORMATION_FAILED: 'TRANSFORMATION_FAILED',
  EMPTY_RESULT: 'EMPTY_RESULT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
};

export function sendError(res, err) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }
  console.error(err);
  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.DATABASE_ERROR,
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
}
