import { Request, Response } from 'express';
import { questionService } from '../services/question.service';
import { ok, created } from '../utils/response';
import { Messages } from '../constants/messages';
import { CreateQuestionDto, UpdateQuestionDto, QuestionStatus } from '../types';
import { Role } from '../constants/roles';

/**
 * Question controller — request/response only. All business logic lives in QuestionService.
 */
export const questionController = {
  list: async (req: Request, res: Response): Promise<void> => {
    const result = await questionService.list(req.query as any, req.user!);
    ok(res, Messages.QUESTION_LISTED, result);
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const question = await questionService.getById(req.params.id, req.user!);
    ok(res, Messages.QUESTION_FETCHED, question);
  },

  create: async (req: Request, res: Response): Promise<void> => {
    const question = await questionService.create(req.user!, req.body as CreateQuestionDto);
    created(res, Messages.CREATED, question);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const question = await questionService.update(
      req.params.id,
      req.user!,
      req.body as UpdateQuestionDto,
    );
    ok(res, Messages.UPDATED, question);
  },

  changeStatus: async (req: Request, res: Response): Promise<void> => {
    const status = req.body.status as QuestionStatus;
    const question = await questionService.setStatus(req.params.id, status);
    const message =
      status === 'published'
        ? Messages.QUESTION_PUBLISHED
        : status === 'archived'
          ? Messages.QUESTION_ARCHIVED
          : Messages.QUESTION_DRAFTED;
    ok(res, message, question);
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    await questionService.remove(req.params.id);
    ok(res, Messages.DELETED);
  },

  listBookmarks: async (req: Request, res: Response): Promise<void> => {
    const result = await questionService.getBookmarks(req.user!, req.query as any);
    ok(res, Messages.BOOKMARKS_LISTED, result);
  },

  addBookmark: async (req: Request, res: Response): Promise<void> => {
    const result = await questionService.addBookmark(req.params.id, req.user!);
    ok(res, Messages.BOOKMARK_ADDED, result);
  },

  removeBookmark: async (req: Request, res: Response): Promise<void> => {
    const result = await questionService.removeBookmark(req.params.id, req.user!);
    ok(res, Messages.BOOKMARK_REMOVED, result);
  },

  statistics: async (_req: Request, res: Response): Promise<void> => {
    const stats = await questionService.statistics();
    ok(res, Messages.STATISTICS_FETCHED, stats);
  },

  /* ------------------------- Internal (S2S) ------------------------- */

  getInternal: async (req: Request, res: Response): Promise<void> => {
    const question = await questionService.getInternal(req.params.id);
    ok(res, Messages.INTERNAL_QUESTION_FETCHED, question);
  },

  recordStats: async (req: Request, res: Response): Promise<void> => {
    const question = await questionService.recordStats(req.params.id, req.body);
    ok(res, Messages.INTERNAL_STATS_RECORDED, question);
  },
};

export const STAFF_ROLES = [Role.MENTOR, Role.ADMIN] as const;
