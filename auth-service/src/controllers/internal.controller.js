// ===========================================
// Internal Auth Controller
// ===========================================

import authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.helper.js';
import { STATUS_CODES } from '../constants/index.js';

/**
 * Internal service-to-service endpoints used by the User Service to keep the
 * authentication authority synchronized with profile administration changes.
 */
class InternalController {
  updateRole = async (req, res, next) => {
    try {
      const result = await authService.updateInternalRole(req.params.id, req.body.role);
      sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: result.message,
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const result = await authService.updateInternalStatus(req.params.id, req.body.isActive);
      sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: result.message,
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new InternalController();
