// ===========================================
// Internal Service Routes
// ===========================================

import { Router } from 'express';

import internalController from '../controllers/internal.controller.js';
import requireInternalKey from '../middlewares/internal.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  uuidParamSchema,
  updateInternalRoleSchema,
  updateInternalStatusSchema,
} from '../validations/auth.validation.js';

const router = Router();

router.patch(
  '/users/:id/role',
  requireInternalKey,
  validate({ params: uuidParamSchema, body: updateInternalRoleSchema }),
  internalController.updateRole,
);

router.patch(
  '/users/:id/status',
  requireInternalKey,
  validate({ params: uuidParamSchema, body: updateInternalStatusSchema }),
  internalController.updateStatus,
);

export default router;
