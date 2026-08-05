import {
  createQuestionSchema,
  updateQuestionSchema,
  questionIdParamSchema,
  changeStatusSchema,
  questionListQuerySchema,
  internalStatsSchema,
} from '../../src/validations/question.validations';

describe('question validations', () => {
  describe('createQuestionSchema', () => {
    it('accepts a minimal valid payload', () => {
      const result = createQuestionSchema.safeParse({
        title: 'Two Sum',
        description:
          'Given an array of integers, return indices of the two numbers that add up to a target.',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('dsa');
        expect(result.data.difficulty).toBe('Medium');
        expect('status' in result.data).toBe(false); // status is managed by the service, not the payload
        expect(result.data.tags).toEqual([]);
      }
    });

    it('rejects a missing title', () => {
      const result = createQuestionSchema.safeParse({
        description: 'A long enough description for validation purposes.',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a short description', () => {
      const result = createQuestionSchema.safeParse({ title: 'X', description: 'too short' });
      expect(result.success).toBe(false);
    });

    it('rejects an unknown difficulty', () => {
      const result = createQuestionSchema.safeParse({
        title: 'X',
        description: 'A long enough description for validation purposes.',
        difficulty: 'impossible',
      });
      expect(result.success).toBe(false);
    });

    it('rejects unknown starter-code languages', () => {
      const result = createQuestionSchema.safeParse({
        title: 'X',
        description: 'A long enough description for validation purposes.',
        starterCode: { cobol: 'IDENTIFICATION DIVISION.' },
      });
      expect(result.success).toBe(false);
    });

    it('accepts full payload with examples and test cases', () => {
      const result = createQuestionSchema.safeParse({
        title: 'Two Sum',
        description:
          'Given an array of integers, return indices of the two numbers that add up to a target.',
        type: 'dsa',
        difficulty: 'Easy',
        category: 'Arrays',
        tags: ['Hash Table'],
        examples: [{ input: 'a', output: 'b', explanation: 'why' }],
        starterCode: { javascript: 'function f() {}', python: 'def f(): pass' },
        testCases: [
          { input: '1', expectedOutput: '2', isHidden: true },
          { input: '3', expectedOutput: '4', isSample: true },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('accepts large test-case suites for evaluator-grade challenges', () => {
      const testCases = Array.from({ length: 201 }, (_, i) => ({
        input: String(i),
        expectedOutput: String(i + 1),
      }));
      const result = createQuestionSchema.safeParse({
        title: 'X',
        description: 'A long enough description for validation purposes.',
        testCases,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateQuestionSchema', () => {
    it('accepts partial updates', () => {
      const result = updateQuestionSchema.safeParse({ difficulty: 'Hard' });
      expect(result.success).toBe(true);
    });

    it('accepts an empty object (no-op update)', () => {
      const result = updateQuestionSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('questionIdParamSchema', () => {
    it('accepts a UUID', () => {
      expect(
        questionIdParamSchema.safeParse({ id: '11111111-1111-4111-8111-111111111111' }).success,
      ).toBe(true);
    });

    it('rejects a non-UUID', () => {
      expect(questionIdParamSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
    });
  });

  describe('changeStatusSchema', () => {
    it('accepts known statuses', () => {
      for (const status of ['draft', 'published', 'archived']) {
        expect(changeStatusSchema.safeParse({ status }).success).toBe(true);
      }
    });

    it('rejects unknown statuses', () => {
      expect(changeStatusSchema.safeParse({ status: 'deleted' }).success).toBe(false);
    });
  });

  describe('questionListQuerySchema', () => {
    it('applies pagination defaults', () => {
      const result = questionListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('parses bookmark flag as boolean', () => {
      const result = questionListQuerySchema.safeParse({ bookmarked: 'true' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.bookmarked).toBe(true);
    });

    it('rejects an unknown sort column', () => {
      const result = questionListQuerySchema.safeParse({ sortBy: 'id; DROP TABLE' });
      expect(result.success).toBe(false);
    });
  });

  describe('internalStatsSchema', () => {
    it('accepts booleans', () => {
      expect(internalStatsSchema.safeParse({ attempted: true, solved: false }).success).toBe(true);
      expect(internalStatsSchema.safeParse({}).success).toBe(true);
    });

    it('rejects non-booleans', () => {
      expect(internalStatsSchema.safeParse({ attempted: 'yes' }).success).toBe(false);
    });
  });
});
