import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination';

/** Languages currently supported by the unified Question Builder. */
export const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'go',
  'rust',
  'sql',
] as const;

export const difficultyValues = ['Easy', 'Medium', 'Hard', 'Expert'] as const;
export const problemTypeValues = [
  'dsa',
  'sql',
  'frontend',
  'backend',
  'fullstack',
  'react',
  'nodejs',
  'javascript',
  'typescript',
  'html',
  'css',
  'html-css',
  'bug-fixing',
  'debugging',
  'mcq',
  'system-design',
  'ai-challenge',
] as const;
export const questionStatusValues = ['draft', 'published', 'archived'] as const;
export const visibilityValues = ['public', 'private', 'organization'] as const;
export const requirementTypeValues = [
  'technology',
  'file',
  'feature',
  'acceptance_criteria',
  'api',
  'database',
  'auth',
  'validation',
  'business_logic',
  'rubric',
] as const;
export const assetTypeValues = [
  'starter_project',
  'image',
  'icon',
  'font',
  'json',
  'svg',
  'video',
  'swagger',
  'postman',
  'rest_doc',
  'other',
] as const;
export const referenceDesignTypeValues = ['desktop', 'tablet', 'mobile', 'figma', 'other'] as const;

const markdownSchema = z.string().trim().max(100_000);
const stringListSchema = z.array(z.string().trim().min(1).max(150));

const exampleSchema = z.object({
  input: z.string().trim().min(1).max(50_000),
  output: z.string().trim().min(1).max(50_000),
  explanation: z.string().trim().min(1).max(20_000).optional().nullable(),
});

const testCaseSchema = z.object({
  input: z.string().trim().min(1).max(100_000),
  expectedOutput: z.string().trim().min(1).max(100_000),
  explanation: z.string().trim().min(1).max(20_000).optional().nullable(),
  isHidden: z.boolean().default(false),
  isSample: z.boolean().default(false),
  weight: z.coerce.number().int().min(1).max(1000).default(1),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
});

const requirementSchema = z.object({
  type: z.enum(requirementTypeValues),
  content: z.string().trim().min(1).max(50_000),
  metadata: z.record(z.unknown()).optional().default({}),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const assetSchema = z.object({
  type: z.enum(assetTypeValues).default('other'),
  name: z.string().trim().min(1).max(255),
  url: z.string().trim().min(1).max(2048),
  metadata: z.record(z.unknown()).optional().default({}),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const aiReviewRuleSchema = z.object({
  criterion: z.string().trim().min(1).max(100),
  enabled: z.boolean().default(true),
  weight: z.coerce.number().int().min(1).max(100).default(1),
});

const referenceDesignSchema = z.object({
  type: z.enum(referenceDesignTypeValues).default('other'),
  url: z.string().trim().max(2048).optional().nullable(),
  figmaUrl: z.string().trim().max(2048).optional().nullable(),
  description: z.string().trim().max(10_000).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const scoringSchema = z
  .object({
    correctness: z.coerce.number().min(0).max(100).optional(),
    performance: z.coerce.number().min(0).max(100).optional(),
    aiReview: z.coerce.number().min(0).max(100).optional(),
    codeQuality: z.coerce.number().min(0).max(100).optional(),
    documentation: z.coerce.number().min(0).max(100).optional(),
    bonus: z.coerce.number().min(0).max(100).optional(),
  })
  .partial();

const plagiarismSchema = z.object({
  enabled: z.boolean().default(false),
  similarityThreshold: z.coerce.number().int().min(0).max(100).default(80),
});

const submissionSchema = z.object({
  maxAttempts: z.coerce.number().int().min(1).max(10_000).optional().nullable(),
  submissionDeadline: z.string().datetime().optional().nullable(),
  allowLateSubmission: z.boolean().default(false),
});

export const createQuestionSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(10).max(100_000),
  problemStatement: markdownSchema.optional().nullable(),
  inputFormat: markdownSchema.optional().nullable(),
  outputFormat: markdownSchema.optional().nullable(),
  notes: markdownSchema.optional().nullable(),
  type: z.enum(problemTypeValues).default('dsa'),
  difficulty: z.enum(difficultyValues).default('Medium'),
  category: z.string().trim().min(1).max(100).default('General'),
  tags: stringListSchema.default([]),
  topics: stringListSchema.default([]),
  companies: stringListSchema.default([]),
  technology: stringListSchema.default([]),
  requirements: stringListSchema.default([]),
  constraints: stringListSchema.default([]),
  supportedLanguages: z.array(z.enum(LANGUAGES)).default([]),
  maxScore: z.coerce.number().int().min(1).max(100_000).default(100),
  visibility: z.enum(visibilityValues).default('organization'),
  status: z.enum(questionStatusValues).optional(),
  acceptanceRate: z.number().min(0).max(100).optional(),
  estimatedMinutes: z.coerce.number().int().min(1).max(10_000).default(30),
  timeLimitMs: z.coerce.number().int().min(100).max(600_000).default(2000),
  memoryLimitMb: z.coerce.number().int().min(16).max(65_536).default(256),
  maxCodeSizeKb: z.coerce.number().int().min(1).max(102_400).default(256),
  executionTimeoutMs: z.coerce.number().int().min(100).max(600_000).default(5000),
  isPremium: z.boolean().default(false),
  plagiarism: plagiarismSchema.default({}),
  submission: submissionSchema.default({}),
  scoring: scoringSchema.default({}),
  evaluationConfig: z.record(z.unknown()).default({}),
  typeSpecificConfig: z.record(z.unknown()).default({}),
  publicMetadata: z.record(z.unknown()).default({}),
  examples: z.array(exampleSchema).default([]),
  starterCode: z.record(z.enum(LANGUAGES), z.string()).default({}),
  testCases: z.array(testCaseSchema).default([]),
  hints: z.array(z.string().trim().min(1).max(20_000)).default([]),
  editorial: markdownSchema.optional().nullable(),
  assets: z.array(assetSchema).default([]),
  normalizedRequirements: z.array(requirementSchema).default([]),
  aiReviewRules: z.array(aiReviewRuleSchema).default([]),
  supportedFrameworks: stringListSchema.default([]),
  referenceDesigns: z.array(referenceDesignSchema).default([]),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const updateQuestionSchema = createQuestionSchema.partial();

export const questionIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const questionListQuerySchema = paginationQuerySchema.extend({
  difficulty: z.enum(difficultyValues).optional(),
  type: z.enum(problemTypeValues).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  tag: z.string().trim().min(1).max(100).optional(),
  technology: z.string().trim().min(1).max(100).optional(),
  search: z.string().trim().min(1).max(200).optional(),
  status: z.enum(questionStatusValues).optional(),
  bookmarked: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  sortBy: z
    .enum(['title', 'difficulty', 'acceptanceRate', 'estimatedMinutes', 'createdAt', 'updatedAt'])
    .optional(),
});

export type QuestionListQueryInput = z.infer<typeof questionListQuerySchema>;

export const changeStatusSchema = z.object({
  status: z.enum(questionStatusValues),
});

export const bookmarkParamSchema = questionIdParamSchema;

/* --------------------------- Internal schemas --------------------------- */

export const evaluationSubmissionSchema = z.object({
  code: z.string().max(1_000_000).optional(),
  language: z.string().max(50).optional(),
  answer: z.unknown().optional(),
  files: z.record(z.string()).optional(),
  query: z.string().max(1_000_000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const internalStatsSchema = z.object({
  attempted: z.boolean().optional(),
  solved: z.boolean().optional(),
});
