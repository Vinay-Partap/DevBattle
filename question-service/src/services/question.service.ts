import { questionRepository } from '../repositories/question.repository';
import {
  QuestionDetail,
  QuestionSummary,
  QuestionStatistics,
  QuestionStatus,
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionListQuery,
  Requester,
  InternalStatsInput,
} from '../types';
import { Role } from '../constants/roles';
import { ApiError } from '../utils/error';
import { Messages } from '../constants/messages';
import { PaginatedResult } from '../utils/pagination';

/** Abstraction so the service can be unit-tested with a mock repository. */
export interface IQuestionRepository {
  findById(id: string, userId?: string): Promise<QuestionDetail | null>;
  existsBySlug(slug: string, exceptId?: string): Promise<boolean>;
  findMany(query: QuestionListQuery): Promise<PaginatedResult<QuestionDetail>>;
  create(
    dto: CreateQuestionDto & { slug: string; createdBy: string; status: QuestionStatus },
  ): Promise<QuestionDetail>;
  update(id: string, patch: UpdateQuestionDto & { slug?: string }): Promise<QuestionDetail | null>;
  setStatus(id: string, status: QuestionStatus): Promise<QuestionDetail | null>;
  delete(id: string): Promise<boolean>;
  addBookmark(userId: string, questionId: string): Promise<void>;
  removeBookmark(userId: string, questionId: string): Promise<void>;
  isBookmarked(userId: string, questionId: string): Promise<boolean>;
  listBookmarks(userId: string, query: QuestionListQuery): Promise<PaginatedResult<QuestionDetail>>;
  incrementStats(id: string, input: InternalStatsInput): Promise<QuestionDetail | null>;
  statistics(): Promise<QuestionStatistics>;
}

const isStaff = (requester: Requester): boolean =>
  requester.role === Role.MENTOR || requester.role === Role.ADMIN;

const slugify = (title: string): string => {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return slug || 'question';
};

export class QuestionService {
  constructor(private readonly repository: IQuestionRepository = questionRepository) {}

  /* ----------------------------- Reads --------------------------------- */

  async list(
    query: QuestionListQuery,
    requester: Requester,
  ): Promise<PaginatedResult<QuestionSummary>> {
    const staff = isStaff(requester);
    const effectiveQuery: QuestionListQuery = {
      ...query,
      // Students may only ever see published questions; staff can filter by status.
      status: staff ? query.status : 'published',
      userId: requester.id,
    };

    const result = await this.repository.findMany(effectiveQuery);
    return {
      items: result.items.map((q) => this.toSummary(q, staff)),
      pagination: result.pagination,
    };
  }

  async getById(id: string, requester: Requester): Promise<QuestionDetail> {
    const staff = isStaff(requester);
    const question = await this.repository.findById(id, requester.id);
    if (!question) throw ApiError.notFound(Messages.QUESTION_NOT_FOUND, 'QUESTION_NOT_FOUND');

    // Students must not see drafts/archived questions or hidden test cases.
    if (!staff) {
      if (question.status !== 'published') {
        throw ApiError.notFound(Messages.QUESTION_NOT_FOUND, 'QUESTION_NOT_FOUND');
      }
      return { ...question, testCases: question.testCases.filter((tc) => !tc.isHidden) };
    }
    return question;
  }

  async getBookmarks(
    requester: Requester,
    query: QuestionListQuery,
  ): Promise<PaginatedResult<QuestionSummary>> {
    const result = await this.repository.listBookmarks(requester.id, {
      ...query,
      status: 'published',
    });
    return {
      items: result.items.map((q) => this.toSummary(q, isStaff(requester))),
      pagination: result.pagination,
    };
  }

  /* ----------------------------- Writes -------------------------------- */

  async create(requester: Requester, dto: CreateQuestionDto): Promise<QuestionDetail> {
    const slug = await this.uniqueSlug(dto.title);
    return this.repository.create({
      ...dto,
      slug,
      createdBy: requester.id,
      status: dto.status ?? 'draft',
    });
  }

  async update(id: string, requester: Requester, dto: UpdateQuestionDto): Promise<QuestionDetail> {
    const existing = await this.repository.findById(id, requester.id);
    if (!existing) throw ApiError.notFound(Messages.QUESTION_NOT_FOUND, 'QUESTION_NOT_FOUND');

    const patch: UpdateQuestionDto & { slug?: string } = { ...dto };
    if (dto.title && dto.title.trim() !== existing.title) {
      patch.slug = await this.uniqueSlug(dto.title, id);
    }

    const updated = await this.repository.update(id, patch);
    if (!updated) throw ApiError.notFound(Messages.QUESTION_NOT_FOUND, 'QUESTION_NOT_FOUND');
    return updated;
  }

  async setStatus(id: string, status: QuestionStatus): Promise<QuestionDetail> {
    const updated = await this.repository.setStatus(id, status);
    if (!updated) throw ApiError.notFound(Messages.QUESTION_NOT_FOUND, 'QUESTION_NOT_FOUND');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw ApiError.notFound(Messages.QUESTION_NOT_FOUND, 'QUESTION_NOT_FOUND');
  }

  /* ----------------------------- Bookmarks ----------------------------- */

  async toggleBookmark(questionId: string, requester: Requester): Promise<{ bookmarked: boolean }> {
    const question = await this.repository.findById(questionId, requester.id);
    if (!question) throw ApiError.notFound(Messages.QUESTION_NOT_FOUND, 'QUESTION_NOT_FOUND');
    if (!isStaff(requester) && question.status !== 'published') {
      throw ApiError.notFound(Messages.QUESTION_NOT_FOUND, 'QUESTION_NOT_FOUND');
    }

    const current = await this.repository.isBookmarked(requester.id, questionId);
    if (current) {
      await this.repository.removeBookmark(requester.id, questionId);
      return { bookmarked: false };
    }
    await this.repository.addBookmark(requester.id, questionId);
    return { bookmarked: true };
  }

  async addBookmark(questionId: string, requester: Requester): Promise<{ bookmarked: boolean }> {
    const question = await this.repository.findById(questionId, requester.id);
    if (!question) throw ApiError.notFound(Messages.QUESTION_NOT_FOUND, 'QUESTION_NOT_FOUND');
    if (!isStaff(requester) && question.status !== 'published') {
      throw ApiError.notFound(Messages.QUESTION_NOT_FOUND, 'QUESTION_NOT_FOUND');
    }

    await this.repository.addBookmark(requester.id, questionId);
    return { bookmarked: true };
  }

  async removeBookmark(questionId: string, requester: Requester): Promise<{ bookmarked: boolean }> {
    await this.repository.removeBookmark(requester.id, questionId);
    return { bookmarked: false };
  }

  /* ----------------------------- Admin --------------------------------- */

  async statistics(): Promise<QuestionStatistics> {
    return this.repository.statistics();
  }

  /* --------------------------- Internal (S2S) -------------------------- */

  /** Full payload including hidden test cases — used by the Judge/Submission service. */
  async getInternal(id: string): Promise<QuestionDetail> {
    const question = await this.repository.findById(id);
    if (!question) throw ApiError.notFound(Messages.QUESTION_NOT_FOUND, 'QUESTION_NOT_FOUND');
    return question;
  }

  async recordStats(id: string, input: InternalStatsInput): Promise<QuestionDetail> {
    const updated = await this.repository.incrementStats(id, input);
    if (!updated) throw ApiError.notFound(Messages.QUESTION_NOT_FOUND, 'QUESTION_NOT_FOUND');
    return updated;
  }

  /* ----------------------------- Helpers ------------------------------- */

  private async uniqueSlug(title: string, exceptId?: string): Promise<string> {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;
    while (await this.repository.existsBySlug(candidate, exceptId)) {
      const suffixStr = `-${suffix}`;
      candidate = `${base.slice(0, 100 - suffixStr.length)}${suffixStr}`;
      suffix += 1;
      if (suffix > 100)
        throw ApiError.conflict('Could not generate a unique slug.', 'SLUG_EXHAUSTED');
    }
    return candidate;
  }

  private toSummary(q: QuestionDetail, staff: boolean): QuestionSummary {
    const {
      testCases,
      examples: _examples,
      starterCode: _starterCode,
      requirements: _requirements,
      constraints: _constraints,
      isPremium: _isPremium,
      ...rest
    } = q;
    const visible = staff ? testCases : testCases.filter((tc) => !tc.isHidden);
    return {
      ...rest,
      testCaseCount: visible.length,
      hiddenTestCaseCount: staff ? testCases.filter((tc) => tc.isHidden).length : 0,
    };
  }
}

export const questionService = new QuestionService();
