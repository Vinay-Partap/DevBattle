import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  doublePrecision,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/* ----------------------------- Enums ----------------------------------- */
/**
 * Difficulty and problem type values are aligned with the DevBattle frontend
 * data model (frontend/src/types) so the API can be consumed without mapping.
 */
export const difficultyEnum = pgEnum('difficulty', ['Easy', 'Medium', 'Hard', 'Expert']);
export const problemTypeEnum = pgEnum('problem_type', [
  'dsa',
  'sql',
  'frontend',
  'backend',
  'fullstack',
  'react',
  'nodejs',
  'javascript',
  'typescript',
  'html-css',
  'bug-fixing',
  'debugging',
  'mcq',
  'system-design',
  'ai-challenge',
]);
export const questionStatusEnum = pgEnum('question_status', ['draft', 'published', 'archived']);
export const questionVisibilityEnum = pgEnum('question_visibility', [
  'public',
  'private',
  'organization',
]);
export const requirementTypeEnum = pgEnum('requirement_type', [
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
]);
export const assetTypeEnum = pgEnum('asset_type', [
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
]);
export const referenceDesignTypeEnum = pgEnum('reference_design_type', [
  'desktop',
  'tablet',
  'mobile',
  'figma',
  'other',
]);

/* ----------------------------- Tables ---------------------------------- */

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description').notNull(),
    type: problemTypeEnum('type').notNull().default('dsa'),
    difficulty: difficultyEnum('difficulty').notNull().default('Medium'),
    category: varchar('category', { length: 100 }).notNull().default('General'),
    tags: text('tags').array().notNull().default([]),
    companies: text('companies').array().notNull().default([]),
    technology: text('technology').array().notNull().default([]),
    requirements: text('requirements').array().notNull().default([]),
    constraints: text('constraints').array().notNull().default([]),
    problemStatement: text('problem_statement'),
    inputFormat: text('input_format'),
    outputFormat: text('output_format'),
    notes: text('notes'),
    acceptanceRate: doublePrecision('acceptance_rate').notNull().default(0),
    estimatedMinutes: integer('estimated_minutes').notNull().default(30),
    maxScore: integer('max_score').notNull().default(100),
    timeLimitMs: integer('time_limit_ms').notNull().default(2000),
    memoryLimitMb: integer('memory_limit_mb').notNull().default(256),
    maxCodeSizeKb: integer('max_code_size_kb').notNull().default(256),
    executionTimeoutMs: integer('execution_timeout_ms').notNull().default(5000),
    isPremium: boolean('is_premium').notNull().default(false),
    visibility: questionVisibilityEnum('visibility').notNull().default('organization'),
    status: questionStatusEnum('status').notNull().default('draft'),
    plagiarismEnabled: boolean('plagiarism_enabled').notNull().default(false),
    similarityThreshold: integer('similarity_threshold').notNull().default(80),
    maxAttempts: integer('max_attempts'),
    submissionDeadline: timestamp('submission_deadline', { withTimezone: true }),
    allowLateSubmission: boolean('allow_late_submission').notNull().default(false),
    scoringConfig: jsonb('scoring_config').notNull().default({}),
    /** auth_user_id of the mentor/admin who authored the question. */
    createdBy: uuid('created_by').notNull(),
    attemptedCount: integer('attempted_count').notNull().default(0),
    solvedCount: integer('solved_count').notNull().default(0),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex('questions_slug_idx').on(table.slug),
    statusIdx: index('questions_status_idx').on(table.status),
    difficultyIdx: index('questions_difficulty_idx').on(table.difficulty),
    typeIdx: index('questions_type_idx').on(table.type),
    categoryIdx: index('questions_category_idx').on(table.category),
    createdByIdx: index('questions_created_by_idx').on(table.createdBy),
    titleIdx: index('questions_title_idx').on(table.title),
  }),
);

export const questionExamples = pgTable(
  'question_examples',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    input: text('input').notNull(),
    output: text('output').notNull(),
    explanation: text('explanation'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    questionIdx: index('question_examples_question_id_idx').on(table.questionId),
  }),
);

export const questionStarterCodes = pgTable(
  'question_starter_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    language: varchar('language', { length: 50 }).notNull(),
    code: text('code').notNull(),
  },
  (table) => ({
    questionLanguageIdx: uniqueIndex('question_starter_codes_question_language_idx').on(
      table.questionId,
      table.language,
    ),
  }),
);

export const questionTestCases = pgTable(
  'question_test_cases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    input: text('input').notNull(),
    expectedOutput: text('expected_output').notNull(),
    explanation: text('explanation'),
    isHidden: boolean('is_hidden').notNull().default(false),
    isSample: boolean('is_sample').notNull().default(false),
    weight: integer('weight').notNull().default(1),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    questionIdx: index('question_test_cases_question_id_idx').on(table.questionId),
  }),
);

export const questionBookmarks = pgTable(
  'question_bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** auth_user_id of the user who bookmarked the question. */
    userId: uuid('user_id').notNull(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userQuestionIdx: uniqueIndex('question_bookmarks_user_question_idx').on(
      table.userId,
      table.questionId,
    ),
    userIdIdx: index('question_bookmarks_user_id_idx').on(table.userId),
  }),
);


export const questionTags = pgTable(
  'question_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
  },
  (table) => ({
    questionNameIdx: uniqueIndex('question_tags_question_name_idx').on(table.questionId, table.name),
    nameIdx: index('question_tags_name_idx').on(table.name),
  }),
);

export const questionTopics = pgTable(
  'question_topics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
  },
  (table) => ({
    questionNameIdx: uniqueIndex('question_topics_question_name_idx').on(table.questionId, table.name),
    nameIdx: index('question_topics_name_idx').on(table.name),
  }),
);

export const questionLanguages = pgTable(
  'question_languages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    language: varchar('language', { length: 50 }).notNull(),
    displayName: varchar('display_name', { length: 100 }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    questionLanguageIdx: uniqueIndex('question_languages_question_language_idx').on(
      table.questionId,
      table.language,
    ),
  }),
);

export const questionHints = pgTable(
  'question_hints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    questionIdx: index('question_hints_question_id_idx').on(table.questionId),
  }),
);

export const questionEditorials = pgTable(
  'question_editorials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
  },
  (table) => ({
    questionIdx: uniqueIndex('question_editorials_question_id_idx').on(table.questionId),
  }),
);

export const questionAssets = pgTable(
  'question_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    type: assetTypeEnum('type').notNull().default('other'),
    name: varchar('name', { length: 255 }).notNull(),
    url: text('url').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    questionIdx: index('question_assets_question_id_idx').on(table.questionId),
    typeIdx: index('question_assets_type_idx').on(table.type),
  }),
);

export const questionRequirements = pgTable(
  'question_requirements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    type: requirementTypeEnum('type').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    questionIdx: index('question_requirements_question_id_idx').on(table.questionId),
    typeIdx: index('question_requirements_type_idx').on(table.type),
  }),
);

export const questionAiReviewRules = pgTable(
  'question_ai_review_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    criterion: varchar('criterion', { length: 100 }).notNull(),
    enabled: boolean('enabled').notNull().default(true),
    weight: integer('weight').notNull().default(1),
  },
  (table) => ({
    questionCriterionIdx: uniqueIndex('question_ai_rules_question_criterion_idx').on(
      table.questionId,
      table.criterion,
    ),
  }),
);

export const questionSupportedFrameworks = pgTable(
  'question_supported_frameworks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
  },
  (table) => ({
    questionNameIdx: uniqueIndex('question_frameworks_question_name_idx').on(
      table.questionId,
      table.name,
    ),
  }),
);

export const questionReferenceDesigns = pgTable(
  'question_reference_designs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    type: referenceDesignTypeEnum('type').notNull().default('other'),
    url: text('url'),
    figmaUrl: text('figma_url'),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    questionIdx: index('question_reference_designs_question_id_idx').on(table.questionId),
  }),
);

/* ----------------------------- Relations ------------------------------- */

export const questionsRelations = relations(questions, ({ many }) => ({
  examples: many(questionExamples),
  starterCodes: many(questionStarterCodes),
  testCases: many(questionTestCases),
  bookmarks: many(questionBookmarks),
  tagRows: many(questionTags),
  topicRows: many(questionTopics),
  languageRows: many(questionLanguages),
  hints: many(questionHints),
  editorialRows: many(questionEditorials),
  assets: many(questionAssets),
  requirementRows: many(questionRequirements),
  aiReviewRules: many(questionAiReviewRules),
  frameworkRows: many(questionSupportedFrameworks),
  referenceDesigns: many(questionReferenceDesigns),
}));

export const questionExamplesRelations = relations(questionExamples, ({ one }) => ({
  question: one(questions, { fields: [questionExamples.questionId], references: [questions.id] }),
}));

export const questionStarterCodesRelations = relations(questionStarterCodes, ({ one }) => ({
  question: one(questions, {
    fields: [questionStarterCodes.questionId],
    references: [questions.id],
  }),
}));

export const questionTestCasesRelations = relations(questionTestCases, ({ one }) => ({
  question: one(questions, {
    fields: [questionTestCases.questionId],
    references: [questions.id],
  }),
}));

export const questionBookmarksRelations = relations(questionBookmarks, ({ one }) => ({
  question: one(questions, {
    fields: [questionBookmarks.questionId],
    references: [questions.id],
  }),
}));


export const questionTagsRelations = relations(questionTags, ({ one }) => ({
  question: one(questions, { fields: [questionTags.questionId], references: [questions.id] }),
}));

export const questionTopicsRelations = relations(questionTopics, ({ one }) => ({
  question: one(questions, { fields: [questionTopics.questionId], references: [questions.id] }),
}));

export const questionLanguagesRelations = relations(questionLanguages, ({ one }) => ({
  question: one(questions, {
    fields: [questionLanguages.questionId],
    references: [questions.id],
  }),
}));

export const questionHintsRelations = relations(questionHints, ({ one }) => ({
  question: one(questions, { fields: [questionHints.questionId], references: [questions.id] }),
}));

export const questionEditorialsRelations = relations(questionEditorials, ({ one }) => ({
  question: one(questions, {
    fields: [questionEditorials.questionId],
    references: [questions.id],
  }),
}));

export const questionAssetsRelations = relations(questionAssets, ({ one }) => ({
  question: one(questions, { fields: [questionAssets.questionId], references: [questions.id] }),
}));

export const questionRequirementsRelations = relations(questionRequirements, ({ one }) => ({
  question: one(questions, {
    fields: [questionRequirements.questionId],
    references: [questions.id],
  }),
}));

export const questionAiReviewRulesRelations = relations(questionAiReviewRules, ({ one }) => ({
  question: one(questions, {
    fields: [questionAiReviewRules.questionId],
    references: [questions.id],
  }),
}));

export const questionSupportedFrameworksRelations = relations(
  questionSupportedFrameworks,
  ({ one }) => ({
    question: one(questions, {
      fields: [questionSupportedFrameworks.questionId],
      references: [questions.id],
    }),
  }),
);

export const questionReferenceDesignsRelations = relations(questionReferenceDesigns, ({ one }) => ({
  question: one(questions, {
    fields: [questionReferenceDesigns.questionId],
    references: [questions.id],
  }),
}));

/* ----------------------------- Types ----------------------------------- */

export type NewQuestion = typeof questions.$inferInsert;
export type QuestionRow = typeof questions.$inferSelect;
export type ExampleRow = typeof questionExamples.$inferSelect;
export type StarterCodeRow = typeof questionStarterCodes.$inferSelect;
export type TestCaseRow = typeof questionTestCases.$inferSelect;
export type BookmarkRow = typeof questionBookmarks.$inferSelect;
export type TagRow = typeof questionTags.$inferSelect;
export type TopicRow = typeof questionTopics.$inferSelect;
export type LanguageRow = typeof questionLanguages.$inferSelect;
export type HintRow = typeof questionHints.$inferSelect;
export type EditorialRow = typeof questionEditorials.$inferSelect;
export type AssetRow = typeof questionAssets.$inferSelect;
export type RequirementRow = typeof questionRequirements.$inferSelect;
export type AiReviewRuleRow = typeof questionAiReviewRules.$inferSelect;
export type FrameworkRow = typeof questionSupportedFrameworks.$inferSelect;
export type ReferenceDesignRow = typeof questionReferenceDesigns.$inferSelect;
