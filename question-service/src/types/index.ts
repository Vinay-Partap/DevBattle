import { Role } from '../constants/roles';

/* ----------------------------- Domain types ---------------------------- */

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export type ProblemType =
  | 'dsa'
  | 'sql'
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'react'
  | 'nodejs'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'html-css'
  | 'bug-fixing'
  | 'debugging'
  | 'mcq'
  | 'system-design'
  | 'ai-challenge';
export type QuestionStatus = 'draft' | 'published' | 'archived';
export type QuestionVisibility = 'public' | 'private' | 'organization';
export type Language =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'go'
  | 'rust'
  | 'sql';

export type RequirementType =
  | 'technology'
  | 'file'
  | 'feature'
  | 'acceptance_criteria'
  | 'api'
  | 'database'
  | 'auth'
  | 'validation'
  | 'business_logic'
  | 'rubric';

export type AssetType =
  | 'starter_project'
  | 'image'
  | 'icon'
  | 'font'
  | 'json'
  | 'svg'
  | 'video'
  | 'swagger'
  | 'postman'
  | 'rest_doc'
  | 'other';

export type ReferenceDesignType = 'desktop' | 'tablet' | 'mobile' | 'figma' | 'other';

export interface QuestionExample {
  input: string;
  output: string;
  explanation?: string | null;
}

export interface QuestionTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  explanation?: string | null;
  isHidden: boolean;
  isSample: boolean;
  weight?: number;
  sortOrder: number;
}

export interface QuestionRequirement {
  id?: string;
  type: RequirementType;
  content: string;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
}

export interface QuestionAsset {
  id?: string;
  type: AssetType;
  name: string;
  url: string;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
}

export interface QuestionAiReviewRule {
  id?: string;
  criterion: string;
  enabled?: boolean;
  weight?: number;
}

export interface QuestionReferenceDesign {
  id?: string;
  type: ReferenceDesignType;
  url?: string | null;
  figmaUrl?: string | null;
  description?: string | null;
  sortOrder?: number;
}

export interface SubmissionSettings {
  maxAttempts?: number | null;
  submissionDeadline?: string | null;
  allowLateSubmission?: boolean;
}

export interface PlagiarismSettings {
  enabled?: boolean;
  similarityThreshold?: number;
}

export interface ScoringSettings {
  correctness?: number;
  performance?: number;
  aiReview?: number;
  codeQuality?: number;
  documentation?: number;
  bonus?: number;
}

/** Full question payload as served by the API (assembled from normalized tables). */
export interface QuestionDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  problemStatement?: string | null;
  inputFormat?: string | null;
  outputFormat?: string | null;
  notes?: string | null;
  type: ProblemType;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  topics?: string[];
  companies: string[];
  technology: string[];
  requirements: string[];
  constraints: string[];
  supportedLanguages?: string[];
  maxScore?: number;
  visibility?: QuestionVisibility;
  acceptanceRate: number;
  estimatedMinutes: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  maxCodeSizeKb?: number;
  executionTimeoutMs?: number;
  isPremium: boolean;
  status: QuestionStatus;
  plagiarismEnabled?: boolean;
  similarityThreshold?: number;
  maxAttempts?: number | null;
  submissionDeadline?: string | null;
  allowLateSubmission?: boolean;
  scoringConfig?: ScoringSettings;
  evaluationConfig?: Record<string, unknown>;
  typeSpecificConfig?: Record<string, unknown>;
  publicMetadata?: Record<string, unknown>;
  createdBy: string;
  attemptedCount: number;
  solvedCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  examples: QuestionExample[];
  starterCode: Record<string, string>;
  testCases: QuestionTestCase[];
  hints?: string[];
  editorial?: string | null;
  assets?: QuestionAsset[];
  normalizedRequirements?: QuestionRequirement[];
  aiReviewRules?: QuestionAiReviewRule[];
  supportedFrameworks?: string[];
  referenceDesigns?: QuestionReferenceDesign[];
  isBookmarked?: boolean;
}

/** Compact card view used by list endpoints. */
export type QuestionSummary = Omit<
  QuestionDetail,
  | 'examples'
  | 'starterCode'
  | 'testCases'
  | 'requirements'
  | 'constraints'
  | 'isPremium'
  | 'assets'
  | 'normalizedRequirements'
  | 'aiReviewRules'
  | 'referenceDesigns'
> & { testCaseCount: number; hiddenTestCaseCount: number };

/* ----------------------------- DTOs ------------------------------------ */

export interface CreateQuestionDto {
  title: string;
  description: string;
  problemStatement?: string | null;
  inputFormat?: string | null;
  outputFormat?: string | null;
  notes?: string | null;
  type?: ProblemType;
  difficulty?: Difficulty;
  category?: string;
  tags?: string[];
  topics?: string[];
  companies?: string[];
  technology?: string[];
  requirements?: string[];
  constraints?: string[];
  supportedLanguages?: string[];
  maxScore?: number;
  visibility?: QuestionVisibility;
  status?: QuestionStatus;
  acceptanceRate?: number;
  estimatedMinutes?: number;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  maxCodeSizeKb?: number;
  executionTimeoutMs?: number;
  isPremium?: boolean;
  plagiarism?: PlagiarismSettings;
  submission?: SubmissionSettings;
  scoring?: ScoringSettings;
  evaluationConfig?: Record<string, unknown>;
  typeSpecificConfig?: Record<string, unknown>;
  publicMetadata?: Record<string, unknown>;
  examples?: QuestionExample[];
  starterCode?: Record<string, string>;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    explanation?: string | null;
    isHidden?: boolean;
    isSample?: boolean;
    weight?: number;
    sortOrder?: number;
  }>;
  hints?: string[];
  editorial?: string | null;
  assets?: QuestionAsset[];
  normalizedRequirements?: QuestionRequirement[];
  aiReviewRules?: QuestionAiReviewRule[];
  supportedFrameworks?: string[];
  referenceDesigns?: QuestionReferenceDesign[];
}

export type UpdateQuestionDto = Partial<CreateQuestionDto>;

export interface QuestionListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  difficulty?: Difficulty;
  type?: ProblemType;
  category?: string;
  tag?: string;
  technology?: string;
  search?: string;
  status?: QuestionStatus;
  bookmarked?: boolean;
  /** Internal: id of the caller, used to attach bookmark flags. */
  userId?: string;
}

export interface QuestionStatistics {
  total: number;
  byStatus: Record<QuestionStatus, number>;
  byDifficulty: Record<Difficulty, number>;
  byType: Partial<Record<ProblemType, number>>;
  totalAttempts: number;
  totalSolves: number;
  overallAcceptanceRate: number;
}

/** Identity of the caller extracted from the verified JWT. */
export interface Requester {
  id: string; // auth_user_id
  role: Role;
  permissions: string[];
}

export interface InternalStatsInput {
  attempted?: boolean;
  solved?: boolean;
}
