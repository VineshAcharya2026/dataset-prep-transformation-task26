import { sendError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  sendError(res, err);
}
