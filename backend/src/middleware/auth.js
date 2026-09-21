import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401));
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    next(new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid or expired token', 401));
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(ErrorCodes.FORBIDDEN, 'You do not have permission for this action', 403));
    }
    next();
  };
}
