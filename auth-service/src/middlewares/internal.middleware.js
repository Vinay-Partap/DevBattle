// ===========================================
// Internal Service Authentication Middleware
// ===========================================

import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Protects service-to-service endpoints with a shared internal API key.
 * These routes are not intended for browsers or public clients.
 */
const requireInternalKey = (req, _res, next) => {
  const key = req.header('x-internal-api-key');

  if (!key || key !== env.INTERNAL_API_KEY) {
    return next(new UnauthorizedError('Invalid or missing internal service key.'));
  }

  next();
};

export { requireInternalKey };
export default requireInternalKey;
