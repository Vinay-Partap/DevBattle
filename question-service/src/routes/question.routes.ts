import { Router } from 'express';
import { questionController, STAFF_ROLES } from '../controllers/question.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../middlewares/asyncHandler';
import { Role } from '../constants/roles';
import {
  questionIdParamSchema,
  questionListQuerySchema,
  createQuestionSchema,
  updateQuestionSchema,
  changeStatusSchema,
} from '../validations/question.validations';

const router = Router();

// Public-ish: any authenticated user can browse the published question bank.
router.get(
  '/',
  authenticate,
  validate({ query: questionListQuerySchema }),
  asyncHandler(questionController.list),
);

// My bookmarks (must be registered before the /:id routes)
router.get(
  '/bookmarks',
  authenticate,
  validate({ query: questionListQuerySchema }),
  asyncHandler(questionController.listBookmarks),
);

// Platform-wide statistics (admin only)
router.get(
  '/statistics',
  authenticate,
  authorize(Role.ADMIN),
  asyncHandler(questionController.statistics),
);

// Single question (students see published questions only; hidden test cases are stripped)
router.get(
  '/:id',
  authenticate,
  validate({ params: questionIdParamSchema }),
  asyncHandler(questionController.getById),
);

// Bookmark toggling (any authenticated user)
router.post(
  '/:id/bookmark',
  authenticate,
  validate({ params: questionIdParamSchema }),
  asyncHandler(questionController.addBookmark),
);
router.delete(
  '/:id/bookmark',
  authenticate,
  validate({ params: questionIdParamSchema }),
  asyncHandler(questionController.removeBookmark),
);

// Authoring (mentors & admins)
router.post(
  '/',
  authenticate,
  authorize(...STAFF_ROLES),
  validate({ body: createQuestionSchema }),
  asyncHandler(questionController.create),
);
router.put(
  '/:id',
  authenticate,
  authorize(...STAFF_ROLES),
  validate({ params: questionIdParamSchema, body: updateQuestionSchema }),
  asyncHandler(questionController.update),
);
router.patch(
  '/:id/status',
  authenticate,
  authorize(...STAFF_ROLES),
  validate({ params: questionIdParamSchema, body: changeStatusSchema }),
  asyncHandler(questionController.changeStatus),
);
router.delete(
  '/:id',
  authenticate,
  authorize(...STAFF_ROLES),
  validate({ params: questionIdParamSchema }),
  asyncHandler(questionController.remove),
);

export default router;
