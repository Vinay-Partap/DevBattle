// ===========================================
// Route Index
// ===========================================

import { Router } from 'express';

import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import internalRoutes from './internal.routes.js';

const router = Router();

// Mount public/authenticated auth routes
router.use('/auth', authRoutes);

// Mount internal service-to-service routes
router.use('/internal', internalRoutes);

export { healthRoutes };
export default router;
