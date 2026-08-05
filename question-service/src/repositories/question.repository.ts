import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql, SQL } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from '../database/db';
import {
  questions,
  questionExamples,
  questionStarterCodes,
  questionTestCases,
  questionBookmarks,
  questionTags,
  questionTopics,
  questionLanguages,
  questionHints,
  questionEditorials,
  questionAssets,
  questionRequirements,
  questionAiReviewRules,
  questionSupportedFrameworks,
  questionReferenceDesigns,
  QuestionRow,
  ExampleRow,
  StarterCodeRow,
  TestCaseRow,
} from '../database/schema';
import {
  QuestionDetail,
  QuestionStatistics,
  QuestionStatus,
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionListQuery,
  InternalStatsInput,
} from '../types';
import {
  PaginatedResult,
  getOffset,
  buildPaginationMeta,
  sanitizeSortColumn,
} from '../utils/pagination';

/** Row returned by the relational query builder (question + children). */
export interface QuestionWithRelations extends QuestionRow {
  examples: ExampleRow[];
  starterCodes: StarterCodeRow[];
  testCases: TestCaseRow[];
  tagRows?: Array<{ name: string }>;
  topicRows?: Array<{ name: string }>;
  languageRows?: Array<{ language: string; sortOrder: number }>;
  hints?: Array<{ content: string; sortOrder: number }>;
  editorialRows?: Array<{ content: string }>;
  assets?: Array<any>;
  requirementRows?: Array<any>;
  aiReviewRules?: Array<any>;
  frameworkRows?: Array<{ name: string }>;
  referenceDesigns?: Array<any>;
}

const SORTABLE_COLUMNS = [
  'title',
  'difficulty',
  'acceptanceRate',
  'estimatedMinutes',
  'createdAt',
  'updatedAt',
];

const PROBLEM_TYPES = [
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
] as const;

const withChildren = {
  examples: true,
  starterCodes: true,
  testCases: true,
  tagRows: true,
  topicRows: true,
  languageRows: true,
  hints: true,
  editorialRows: true,
  assets: true,
  requirementRows: true,
  aiReviewRules: true,
  frameworkRows: true,
  referenceDesigns: true,
} as const;

/** Assemble a flat row + children into the API QuestionDetail shape. */
const assemble = (row: QuestionWithRelations, isBookmarked = false): QuestionDetail => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  description: row.description,
  problemStatement: (row as any).problemStatement ?? null,
  inputFormat: (row as any).inputFormat ?? null,
  outputFormat: (row as any).outputFormat ?? null,
  notes: (row as any).notes ?? null,
  type: row.type as any,
  difficulty: row.difficulty as any,
  category: row.category,
  tags: row.tagRows?.length ? row.tagRows.map((t) => t.name) : (row.tags ?? []),
  topics: row.topicRows?.map((t) => t.name) ?? [],
  companies: row.companies ?? [],
  technology: row.technology ?? [],
  requirements: row.requirements ?? [],
  constraints: row.constraints ?? [],
  supportedLanguages:
    row.languageRows
      ?.slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((l) => l.language) ?? [],
  acceptanceRate: row.acceptanceRate ?? 0,
  estimatedMinutes: row.estimatedMinutes ?? 30,
  maxScore: (row as any).maxScore ?? 100,
  timeLimitMs: row.timeLimitMs ?? 2000,
  memoryLimitMb: row.memoryLimitMb ?? 256,
  maxCodeSizeKb: (row as any).maxCodeSizeKb ?? 256,
  executionTimeoutMs: (row as any).executionTimeoutMs ?? 5000,
  isPremium: row.isPremium ?? false,
  visibility: ((row as any).visibility ?? 'organization') as any,
  status: row.status as any,
  plagiarismEnabled: (row as any).plagiarismEnabled ?? false,
  similarityThreshold: (row as any).similarityThreshold ?? 80,
  maxAttempts: (row as any).maxAttempts ?? null,
  submissionDeadline: (row as any).submissionDeadline
    ? (row as any).submissionDeadline.toISOString()
    : null,
  allowLateSubmission: (row as any).allowLateSubmission ?? false,
  scoringConfig: ((row as any).scoringConfig ?? {}) as any,
  createdBy: row.createdBy,
  attemptedCount: row.attemptedCount ?? 0,
  solvedCount: row.solvedCount ?? 0,
  publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  examples: [...row.examples]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((e) => ({ input: e.input, output: e.output, explanation: e.explanation ?? null })),
  starterCode: Object.fromEntries(row.starterCodes.map((s) => [s.language, s.code])),
  testCases: [...row.testCases]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => ({
      id: t.id,
      input: t.input,
      expectedOutput: t.expectedOutput,
      explanation: (t as any).explanation ?? null,
      isHidden: t.isHidden,
      isSample: t.isSample,
      weight: (t as any).weight ?? 1,
      sortOrder: t.sortOrder,
    })),
  hints:
    row.hints
      ?.slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((h) => h.content) ?? [],
  editorial: row.editorialRows?.[0]?.content ?? null,
  assets:
    row.assets
      ?.slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((a) => ({
        id: a.id,
        type: a.type,
        name: a.name,
        url: a.url,
        metadata: a.metadata ?? {},
        sortOrder: a.sortOrder ?? 0,
      })) ?? [],
  normalizedRequirements:
    row.requirementRows
      ?.slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((r) => ({
        id: r.id,
        type: r.type,
        content: r.content,
        metadata: r.metadata ?? {},
        sortOrder: r.sortOrder ?? 0,
      })) ?? [],
  aiReviewRules:
    row.aiReviewRules?.map((r) => ({
      id: r.id,
      criterion: r.criterion,
      enabled: r.enabled,
      weight: r.weight,
    })) ?? [],
  supportedFrameworks: row.frameworkRows?.map((f) => f.name) ?? [],
  referenceDesigns:
    row.referenceDesigns
      ?.slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((d) => ({
        id: d.id,
        type: d.type,
        url: d.url ?? null,
        figmaUrl: d.figmaUrl ?? null,
        description: d.description ?? null,
        sortOrder: d.sortOrder ?? 0,
      })) ?? [],
  isBookmarked,
});


const orderColumnFor = (sortBy: string | undefined) => {
  switch (sanitizeSortColumn(sortBy, SORTABLE_COLUMNS, 'createdAt')) {
    case 'title':
      return questions.title;
    case 'difficulty':
      return questions.difficulty;
    case 'acceptanceRate':
      return questions.acceptanceRate;
    case 'estimatedMinutes':
      return questions.estimatedMinutes;
    case 'updatedAt':
      return questions.updatedAt;
    default:
      return questions.createdAt;
  }
};

/** Build the WHERE clause shared by count + page queries. */
const buildWhere = (query: QuestionListQuery): SQL | undefined => {
  const conds: SQL[] = [];

  if (query.status) conds.push(eq(questions.status, query.status));
  if (query.difficulty) conds.push(eq(questions.difficulty, query.difficulty));
  if (query.type) conds.push(eq(questions.type, query.type));
  if (query.category) conds.push(eq(questions.category, query.category));
  if (query.tag) conds.push(sql`${questions.tags} @> ARRAY[${query.tag}]::text[]`);
  if (query.technology) {
    conds.push(sql`${questions.technology} @> ARRAY[${query.technology}]::text[]`);
  }
  if (query.search) {
    const searchCond = or(
      ilike(questions.title, `%${query.search}%`),
      ilike(questions.description, `%${query.search}%`),
    );
    if (searchCond) conds.push(searchCond);
  }
  if (query.bookmarked && query.userId) {
    conds.push(
      inArray(
        questions.id,
        db
          .select({ questionId: questionBookmarks.questionId })
          .from(questionBookmarks)
          .where(eq(questionBookmarks.userId, query.userId)),
      ),
    );
  }

  return conds.length ? and(...conds) : undefined;
};

/* --------------------------- File Fallback --------------------------- */

const FALLBACK_DIR = path.join(process.cwd(), 'tmp', 'database-fallback');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'questions.json');

const loadFallback = (): QuestionDetail[] => {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    if (!fs.existsSync(FALLBACK_FILE)) {
      const defaultQuestions: any[] = [
        {
          id: 'aaaaaaaa-0000-4000-8000-000000000101',
          title: 'Two Sum & Target Pointer',
          slug: 'two-sum-target-pointer',
          description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
          type: 'dsa',
          difficulty: 'Easy',
          category: 'Arrays & Hashing',
          tags: ['Hash Table', 'Two Pointers', 'Arrays'],
          companies: ['Google', 'Amazon', 'Meta', 'Microsoft'],
          technology: ['JavaScript', 'TypeScript', 'Python', 'C++'],
          acceptanceRate: 84.5,
          estimatedMinutes: 15,
          timeLimitMs: 2000,
          memoryLimitMb: 256,
          isPremium: false,
          status: 'published',
          createdBy: '11111111-1111-4111-8111-111111111111',
          attemptedCount: 100,
          solvedCount: 84,
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          requirements: [
            'Time complexity should be O(n)',
            'Space complexity should be O(n)',
            'Must handle negative integers and zeroes',
          ],
          constraints: [
            '2 <= nums.length <= 10^4',
            '-10^9 <= nums[i] <= 10^9',
            '-10^9 <= target <= 10^9',
            'Only one valid answer exists.',
          ],
          examples: [
            {
              input: 'nums = [2,7,11,15], target = 9',
              output: '[0,1]',
              explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
            },
            {
              input: 'nums = [3,2,4], target = 6',
              output: '[1,2]',
              explanation: null,
            },
          ],
          starterCode: {
            javascript: `function twoSum(nums, target) {\n  // Your code here\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) {\n      return [map.get(diff), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
            typescript: `function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement)!, i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
            python: `def two_sum(nums: list[int], target: int) -> list[int]:\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []`,
          },
          testCases: [
            { id: 'tc-1', input: '[2,7,11,15], target = 9', expectedOutput: '[0,1]', isHidden: false, isSample: true, sortOrder: 0 },
            { id: 'tc-2', input: '[3,2,4], target = 6', expectedOutput: '[1,2]', isHidden: false, isSample: true, sortOrder: 1 },
            { id: 'tc-3', input: '[3,3], target = 6', expectedOutput: '[0,1]', isHidden: false, isSample: true, sortOrder: 2 },
          ],
          isBookmarked: true,
        },
        {
          id: 'aaaaaaaa-0000-4000-8000-000000000102',
          title: 'React Kanban Board with Drag & Drop',
          slug: 'react-kanban-board-dnd',
          description: 'Build an interactive Kanban Task Board component in React with 3 columns: To Do, In Progress, Done.',
          type: 'frontend',
          difficulty: 'Medium',
          category: 'Frontend Architecture',
          tags: ['React', 'State Management', 'UI Components', 'Drag and Drop'],
          companies: ['Linear', 'Notion', 'Atlassian', 'Vercel'],
          technology: ['React', 'TypeScript', 'TailwindCSS'],
          acceptanceRate: 62.1,
          estimatedMinutes: 45,
          timeLimitMs: 2000,
          memoryLimitMb: 256,
          isPremium: false,
          status: 'published',
          createdBy: '11111111-1111-4111-8111-111111111111',
          attemptedCount: 50,
          solvedCount: 31,
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          requirements: [
            'Accessible keyboard controls for moving tasks',
            'Smooth Framer Motion state transitions',
            'Filter bar for high/medium/low priority tasks',
            'W3C WCAG AA contrast compliance',
          ],
          constraints: ['Must run with zero external UI libraries beyond React & TailwindCSS'],
          examples: [
            {
              input: 'User clicks "+ Add Task" under To Do column',
              output: 'A modal or inline input opens to input Title & Priority',
              explanation: null,
            },
          ],
          starterCode: {
            javascript: `import React, { useState } from 'react';\n\nexport default function KanbanBoard() {\n  const [columns, setColumns] = useState({\n    todo: [{ id: '1', title: 'Implement Auth Flow', priority: 'High' }],\n    inProgress: [{ id: '2', title: 'Optimize Monaco Bundle', priority: 'Medium' }],\n    done: [{ id: '3', title: 'Design Tokens Setup', priority: 'Low' }],\n  });\n\n  return (\n    <div className="p-6 bg-slate-900 text-white min-h-screen">\n      <h1 className="text-2xl font-bold mb-6">DevBattles Kanban</h1>\n      {/* Build Board Layout Here */}\n    </div>\n  );\n}`,
            typescript: `import React, { useState } from 'react';\n\ninterface Task {\n  id: string;\n  title: string;\n  priority: 'High' | 'Medium' | 'Low';\n}\n\nexport default function KanbanBoard(): JSX.Element {\n  const [tasks, setTasks] = useState<Task[]>([]);\n  return (\n    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen">\n      <h1 className="text-2xl font-bold">Interactive Kanban Board</h1>\n    </div>\n  );\n}`,
          },
          testCases: [
            { id: 'tc-201', input: 'Initial state renders 3 columns', expectedOutput: 'Rendered', isHidden: false, isSample: true, sortOrder: 0 },
            { id: 'tc-202', input: 'Add new task button works', expectedOutput: 'Task Added', isHidden: false, isSample: true, sortOrder: 1 },
          ],
          isBookmarked: false,
        },
        {
          id: 'aaaaaaaa-0000-4000-8000-000000000103',
          title: 'LRU Cache Design & O(1) Operations',
          slug: 'lru-cache-design',
          description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) Cache.',
          type: 'dsa',
          difficulty: 'Hard',
          category: 'System & Data Structures',
          tags: ['Doubly Linked List', 'Hash Map', 'Design'],
          companies: ['Google', 'Meta', 'Stripe', 'Netflix'],
          technology: ['TypeScript', 'C++', 'Java', 'Python'],
          acceptanceRate: 48.9,
          estimatedMinutes: 40,
          timeLimitMs: 2000,
          memoryLimitMb: 256,
          isPremium: false,
          status: 'published',
          createdBy: '11111111-1111-4111-8111-111111111111',
          attemptedCount: 40,
          solvedCount: 19,
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          requirements: ['O(1) time complexity for get and put', 'Thread-safe logical implementation'],
          constraints: ['1 <= capacity <= 3000', '0 <= key <= 10^4', '0 <= value <= 10^5'],
          examples: [
            {
              input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
              output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
              explanation: null,
            },
          ],
          starterCode: {
            typescript: `class LRUCache {\n  private capacity: number;\n  private cache: Map<number, number>;\n\n  constructor(capacity: number) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n\n  get(key: number): number {\n    if (!this.cache.has(key)) return -1;\n    const val = this.cache.get(key)!;\n    this.cache.delete(key);\n    this.cache.set(key, val);\n    return val;\n  }\n\n  put(key: number, value: number): void {\n    if (this.cache.has(key)) {\n      this.cache.delete(key);\n    } else if (this.cache.size >= this.capacity) {\n      const firstKey = this.cache.keys().next().value;\n      if (firstKey !== undefined) this.cache.delete(firstKey);\n    }\n    this.cache.set(key, value);\n  }\n}`,
          },
          testCases: [
            { id: 'tc-301', input: 'capacity=2, put(1,1), put(2,2), get(1)', expectedOutput: '1', isHidden: false, isSample: true, sortOrder: 0 },
          ],
          isBookmarked: true,
        },
        {
          id: 'aaaaaaaa-0000-4000-8000-000000000104',
          title: 'Virtual Scrollable List with Infinite Loading',
          slug: 'virtual-scrollable-list',
          description: 'Build a custom Virtualized List component in React capable of rendering 100,000 items smoothly at 60 FPS without DOM lagging.',
          type: 'frontend',
          difficulty: 'Hard',
          category: 'Performance & Architecture',
          tags: ['Virtualization', 'React Hooks', 'DOM Performance'],
          companies: ['Figma', 'Linear', 'GitHub'],
          technology: ['React', 'TypeScript'],
          acceptanceRate: 51.3,
          estimatedMinutes: 50,
          timeLimitMs: 2000,
          memoryLimitMb: 256,
          isPremium: false,
          status: 'published',
          createdBy: '11111111-1111-4111-8111-111111111111',
          attemptedCount: 30,
          solvedCount: 15,
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          requirements: [
            'Render only visible DOM nodes + buffer pool',
            'Dynamic item heights support',
            'Zero jitter during rapid scroll',
          ],
          constraints: ['Max DOM nodes rendered at any moment <= 30'],
          examples: [],
          starterCode: {
            typescript: `import React, { useState, useRef } from 'react';\n\nexport default function VirtualList({ itemsCount = 100000, itemHeight = 40 }) {\n  const [scrollTop, setScrollTop] = useState(0);\n  return <div className="h-96 overflow-auto">Virtualized List</div>;\n}`,
          },
          testCases: [],
          isBookmarked: false,
        },
        {
          id: 'aaaaaaaa-0000-4000-8000-000000000105',
          title: 'Token Bucket Rate Limiter',
          slug: 'token-bucket-rate-limiter',
          description: 'Implement a Rate Limiter class using the Token Bucket algorithm with burst capacity and refill rate per second.',
          type: 'dsa',
          difficulty: 'Medium',
          category: 'System Design & Algorithms',
          tags: ['System Design', 'Algorithms', 'Concurrency'],
          companies: ['Stripe', 'Cloudflare', 'AWS'],
          technology: ['JavaScript', 'Python', 'Go'],
          acceptanceRate: 68.4,
          estimatedMinutes: 30,
          timeLimitMs: 2000,
          memoryLimitMb: 256,
          isPremium: false,
          status: 'published',
          createdBy: '11111111-1111-4111-8111-111111111111',
          attemptedCount: 80,
          solvedCount: 54,
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          requirements: ['Atomic-like credit refill handling', 'Provide consume(tokens) boolean response'],
          constraints: ['Refill rate > 0'],
          examples: [],
          starterCode: {
            javascript: `class TokenBucket {\n  constructor(capacity, refillRate) {\n    this.capacity = capacity;\n    this.refillRate = refillRate;\n    this.tokens = capacity;\n    this.lastRefill = Date.now();\n  }\n\n  allowRequest(tokens = 1) {\n    // Refill tokens\n    const now = Date.now();\n    const elapsed = (now - this.lastRefill) / 1000;\n    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);\n    this.lastRefill = now;\n\n    if (this.tokens >= tokens) {\n      this.tokens -= tokens;\n      return true;\n    }\n    return false;\n  }\n}`,
          },
          testCases: [],
          isBookmarked: false,
        },
      ];
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(defaultQuestions, null, 2), 'utf8');
      return defaultQuestions;
    }
    const content = fs.readFileSync(FALLBACK_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading question-service fallback:', error);
    return [];
  }
};

const saveFallback = (questionsList: QuestionDetail[]) => {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(questionsList, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving question-service fallback:', error);
  }
};

const replaceRows = async <T>(
  tx: any,
  table: any,
  questionId: string,
  rows: T[] | undefined,
  build: (item: T, index: number) => Record<string, unknown>,
): Promise<void> => {
  if (rows === undefined) return;
  await tx.delete(table).where(eq(table.questionId, questionId));
  if (rows.length > 0) {
    await tx.insert(table).values(rows.map((item, index) => ({ questionId, ...build(item, index) })));
  }
};

const replaceNormalizedChildren = async (
  tx: any,
  questionId: string,
  dto: CreateQuestionDto | UpdateQuestionDto,
): Promise<void> => {
  await replaceRows(tx, questionTags, questionId, dto.tags, (name) => ({ name }));
  await replaceRows(tx, questionTopics, questionId, dto.topics, (name) => ({ name }));

  const languages = dto.supportedLanguages ??
    (dto.starterCode ? Object.keys(dto.starterCode) : undefined);
  await replaceRows(tx, questionLanguages, questionId, languages, (language, index) => ({
    language,
    sortOrder: index,
  }));

  await replaceRows(tx, questionHints, questionId, dto.hints, (content, index) => ({
    content,
    sortOrder: index,
  }));

  if (dto.editorial !== undefined) {
    await tx.delete(questionEditorials).where(eq(questionEditorials.questionId, questionId));
    if (dto.editorial) {
      await tx.insert(questionEditorials).values({ questionId, content: dto.editorial });
    }
  }

  await replaceRows(tx, questionAssets, questionId, dto.assets, (asset, index) => ({
    type: asset.type ?? 'other',
    name: asset.name,
    url: asset.url,
    metadata: asset.metadata ?? {},
    sortOrder: asset.sortOrder ?? index,
  }));

  await replaceRows(
    tx,
    questionRequirements,
    questionId,
    dto.normalizedRequirements,
    (requirement, index) => ({
      type: requirement.type,
      content: requirement.content,
      metadata: requirement.metadata ?? {},
      sortOrder: requirement.sortOrder ?? index,
    }),
  );

  await replaceRows(tx, questionAiReviewRules, questionId, dto.aiReviewRules, (rule) => ({
    criterion: rule.criterion,
    enabled: rule.enabled ?? true,
    weight: rule.weight ?? 1,
  }));

  await replaceRows(tx, questionSupportedFrameworks, questionId, dto.supportedFrameworks, (name) => ({
    name,
  }));

  await replaceRows(tx, questionReferenceDesigns, questionId, dto.referenceDesigns, (design, index) => ({
    type: design.type ?? 'other',
    url: design.url ?? null,
    figmaUrl: design.figmaUrl ?? null,
    description: design.description ?? null,
    sortOrder: design.sortOrder ?? index,
  }));
};

/* --------------------------- Repository Class --------------------------- */

export const questionRepository = {
  /** Full detail by id (all test cases, hidden included). */
  async findById(id: string, userId?: string): Promise<QuestionDetail | null> {
    try {
      const row = await db.query.questions.findFirst({
        where: eq(questions.id, id),
        with: withChildren,
      });
      if (!row) return null;
      const bookmarked = userId ? await this.isBookmarked(userId, id) : false;
      return assemble(row as QuestionWithRelations, bookmarked);
    } catch (err) {
      const list = loadFallback();
      const q = list.find((q) => q.id === id) || null;
      if (q && userId) {
        q.isBookmarked = await this.isBookmarked(userId, id);
      }
      return q;
    }
  },

  async existsBySlug(slug: string, exceptId?: string): Promise<boolean> {
    try {
      const rows = await db
        .select({ id: questions.id })
        .from(questions)
        .where(
          exceptId
            ? and(eq(questions.slug, slug), ne(questions.id, exceptId))
            : eq(questions.slug, slug),
        )
        .limit(1);
      return rows.length > 0;
    } catch (err) {
      const list = loadFallback();
      return list.some((q) => q.slug === slug && (!exceptId || q.id !== exceptId));
    }
  },

  async findMany(query: QuestionListQuery): Promise<PaginatedResult<QuestionDetail>> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const where = buildWhere(query);

      const [countRows, rows] = await Promise.all([
        db.select({ value: count() }).from(questions).where(where),
        db.query.questions.findMany({
          where,
          with: withChildren,
          orderBy: [
            query.sortOrder === 'asc'
              ? asc(orderColumnFor(query.sortBy))
              : desc(orderColumnFor(query.sortBy)),
          ],
          offset: getOffset(page, limit),
          limit,
        }),
      ]);

      // Bookmark flags for the requesting user (single query per page)
      let bookmarkedIds = new Set<string>();
      if (query.userId && rows.length > 0) {
        const bookmarks = await db
          .select({ questionId: questionBookmarks.questionId })
          .from(questionBookmarks)
          .where(
            and(
              eq(questionBookmarks.userId, query.userId),
              inArray(
                questionBookmarks.questionId,
                rows.map((r) => r.id),
              ),
            ),
          );
        bookmarkedIds = new Set(bookmarks.map((b) => b.questionId));
      }

      return {
        items: rows.map((r) => assemble(r as QuestionWithRelations, bookmarkedIds.has(r.id))),
        pagination: buildPaginationMeta(countRows[0]?.value ?? 0, page, limit),
      };
    } catch (err) {
      let list = loadFallback();

      if (query.status) {
        list = list.filter((q) => q.status === query.status);
      }
      if (query.difficulty) {
        list = list.filter((q) => q.difficulty === query.difficulty);
      }
      if (query.type) {
        list = list.filter((q) => q.type === query.type);
      }
      if (query.category) {
        list = list.filter((q) => q.category === query.category);
      }
      if (query.search) {
        const term = query.search.toLowerCase();
        list = list.filter((q) => q.title.toLowerCase().includes(term) || q.description.toLowerCase().includes(term));
      }

      const limit = query.limit ?? 20;
      const page = query.page ?? 1;
      const offset = getOffset(page, limit);

      const items = list.slice(offset, offset + limit);

      return {
        items,
        pagination: buildPaginationMeta(list.length, page, limit),
      };
    }
  },

  async create(
    dto: CreateQuestionDto & { slug: string; createdBy: string; status: QuestionStatus },
  ): Promise<QuestionDetail> {
    try {
      return await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(questions)
          .values({
            title: dto.title,
            slug: dto.slug,
            description: dto.description,
            problemStatement: dto.problemStatement ?? null,
            inputFormat: dto.inputFormat ?? null,
            outputFormat: dto.outputFormat ?? null,
            notes: dto.notes ?? null,
            type: dto.type ?? 'dsa',
            difficulty: dto.difficulty ?? 'Medium',
            category: dto.category ?? 'General',
            tags: dto.tags ?? [],
            companies: dto.companies ?? [],
            technology: dto.technology ?? [],
            requirements: dto.requirements ?? [],
            constraints: dto.constraints ?? [],
            acceptanceRate: dto.acceptanceRate ?? 0,
            estimatedMinutes: dto.estimatedMinutes ?? 30,
            maxScore: dto.maxScore ?? 100,
            timeLimitMs: dto.timeLimitMs ?? 2000,
            memoryLimitMb: dto.memoryLimitMb ?? 256,
            maxCodeSizeKb: dto.maxCodeSizeKb ?? 256,
            executionTimeoutMs: dto.executionTimeoutMs ?? 5000,
            isPremium: dto.isPremium ?? false,
            visibility: dto.visibility ?? 'organization',
            status: dto.status,
            plagiarismEnabled: dto.plagiarism?.enabled ?? false,
            similarityThreshold: dto.plagiarism?.similarityThreshold ?? 80,
            maxAttempts: dto.submission?.maxAttempts ?? null,
            submissionDeadline: dto.submission?.submissionDeadline
              ? new Date(dto.submission.submissionDeadline)
              : null,
            allowLateSubmission: dto.submission?.allowLateSubmission ?? false,
            scoringConfig: dto.scoring ?? {},
            createdBy: dto.createdBy,
          })
          .returning();

        const examples = dto.examples ?? [];
        if (examples.length > 0) {
          await tx.insert(questionExamples).values(
            examples.map((e, i) => ({
              questionId: row.id,
              input: e.input,
              output: e.output,
              explanation: e.explanation ?? null,
              sortOrder: i,
            })),
          );
        }

        const starterCodes = Object.entries(dto.starterCode ?? {});
        if (starterCodes.length > 0) {
          await tx
            .insert(questionStarterCodes)
            .values(starterCodes.map(([language, code]) => ({ questionId: row.id, language, code })));
        }

        const testCases = dto.testCases ?? [];
        if (testCases.length > 0) {
          await tx.insert(questionTestCases).values(
            testCases.map((t, i) => ({
              questionId: row.id,
              input: t.input,
              expectedOutput: t.expectedOutput,
              explanation: t.explanation ?? null,
              isHidden: t.isHidden ?? false,
              isSample: t.isSample ?? false,
              weight: t.weight ?? 1,
              sortOrder: t.sortOrder ?? i,
            })),
          );
        }

        await replaceNormalizedChildren(tx, row.id, dto);

        const full = await tx.query.questions.findFirst({
          where: eq(questions.id, row.id),
          with: withChildren,
        });
        return assemble(full as QuestionWithRelations);
      });
    } catch (err) {
      const list = loadFallback();
      const id = crypto.randomUUID();
      const newQ: QuestionDetail = {
        id,
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        problemStatement: dto.problemStatement ?? null,
        inputFormat: dto.inputFormat ?? null,
        outputFormat: dto.outputFormat ?? null,
        notes: dto.notes ?? null,
        type: (dto.type as any) ?? 'dsa',
        difficulty: (dto.difficulty as any) ?? 'Medium',
        category: dto.category ?? 'General',
        tags: dto.tags ?? [],
        topics: dto.topics ?? [],
        companies: dto.companies ?? [],
        technology: dto.technology ?? [],
        requirements: dto.requirements ?? [],
        constraints: dto.constraints ?? [],
        supportedLanguages: dto.supportedLanguages ?? Object.keys(dto.starterCode ?? {}),
        acceptanceRate: dto.acceptanceRate ?? 0,
        estimatedMinutes: dto.estimatedMinutes ?? 30,
        maxScore: dto.maxScore ?? 100,
        timeLimitMs: dto.timeLimitMs ?? 2000,
        memoryLimitMb: dto.memoryLimitMb ?? 256,
        maxCodeSizeKb: dto.maxCodeSizeKb ?? 256,
        executionTimeoutMs: dto.executionTimeoutMs ?? 5000,
        isPremium: dto.isPremium ?? false,
        visibility: dto.visibility ?? 'organization',
        status: dto.status as any,
        plagiarismEnabled: dto.plagiarism?.enabled ?? false,
        similarityThreshold: dto.plagiarism?.similarityThreshold ?? 80,
        maxAttempts: dto.submission?.maxAttempts ?? null,
        submissionDeadline: dto.submission?.submissionDeadline ?? null,
        allowLateSubmission: dto.submission?.allowLateSubmission ?? false,
        scoringConfig: dto.scoring ?? {},
        createdBy: dto.createdBy,
        attemptedCount: 0,
        solvedCount: 0,
        publishedAt: dto.status === 'published' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        examples: (dto.examples ?? []).map((e) => ({ input: e.input, output: e.output, explanation: e.explanation ?? null })),
        starterCode: dto.starterCode ?? {},
        testCases: (dto.testCases ?? []).map((t, i) => ({
          id: `tc-${id}-${i}`,
          input: t.input,
          expectedOutput: t.expectedOutput,
          explanation: t.explanation ?? null,
          isHidden: t.isHidden ?? false,
          isSample: t.isSample ?? false,
          weight: t.weight ?? 1,
          sortOrder: t.sortOrder ?? i,
        })),
        hints: dto.hints ?? [],
        editorial: dto.editorial ?? null,
        assets: dto.assets ?? [],
        normalizedRequirements: dto.normalizedRequirements ?? [],
        aiReviewRules: dto.aiReviewRules ?? [],
        supportedFrameworks: dto.supportedFrameworks ?? [],
        referenceDesigns: dto.referenceDesigns ?? [],
        isBookmarked: false,
      };
      list.push(newQ);
      saveFallback(list);
      return newQ;
    }
  },

  /** Updates base columns and replaces any provided child collections. */
  async update(
    id: string,
    patch: UpdateQuestionDto & { slug?: string },
  ): Promise<QuestionDetail | null> {
    try {
      return await db.transaction(async (tx) => {
        const [row] = await tx
          .update(questions)
          .set({
            ...(patch.title !== undefined ? { title: patch.title } : {}),
            ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
            ...(patch.description !== undefined ? { description: patch.description } : {}),
            ...(patch.problemStatement !== undefined
              ? { problemStatement: patch.problemStatement }
              : {}),
            ...(patch.inputFormat !== undefined ? { inputFormat: patch.inputFormat } : {}),
            ...(patch.outputFormat !== undefined ? { outputFormat: patch.outputFormat } : {}),
            ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
            ...(patch.type !== undefined ? { type: patch.type } : {}),
            ...(patch.difficulty !== undefined ? { difficulty: patch.difficulty } : {}),
            ...(patch.category !== undefined ? { category: patch.category } : {}),
            ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
            ...(patch.companies !== undefined ? { companies: patch.companies } : {}),
            ...(patch.technology !== undefined ? { technology: patch.technology } : {}),
            ...(patch.requirements !== undefined ? { requirements: patch.requirements } : {}),
            ...(patch.constraints !== undefined ? { constraints: patch.constraints } : {}),
            ...(patch.acceptanceRate !== undefined ? { acceptanceRate: patch.acceptanceRate } : {}),
            ...(patch.estimatedMinutes !== undefined
              ? { estimatedMinutes: patch.estimatedMinutes }
              : {}),
            ...(patch.maxScore !== undefined ? { maxScore: patch.maxScore } : {}),
            ...(patch.timeLimitMs !== undefined ? { timeLimitMs: patch.timeLimitMs } : {}),
            ...(patch.memoryLimitMb !== undefined ? { memoryLimitMb: patch.memoryLimitMb } : {}),
            ...(patch.maxCodeSizeKb !== undefined ? { maxCodeSizeKb: patch.maxCodeSizeKb } : {}),
            ...(patch.executionTimeoutMs !== undefined
              ? { executionTimeoutMs: patch.executionTimeoutMs }
              : {}),
            ...(patch.isPremium !== undefined ? { isPremium: patch.isPremium } : {}),
            ...(patch.visibility !== undefined ? { visibility: patch.visibility } : {}),
            ...(patch.plagiarism !== undefined
              ? {
                  plagiarismEnabled: patch.plagiarism.enabled ?? false,
                  similarityThreshold: patch.plagiarism.similarityThreshold ?? 80,
                }
              : {}),
            ...(patch.submission !== undefined
              ? {
                  maxAttempts: patch.submission.maxAttempts ?? null,
                  submissionDeadline: patch.submission.submissionDeadline
                    ? new Date(patch.submission.submissionDeadline)
                    : null,
                  allowLateSubmission: patch.submission.allowLateSubmission ?? false,
                }
              : {}),
            ...(patch.scoring !== undefined ? { scoringConfig: patch.scoring } : {}),
            updatedAt: new Date(),
          })
          .where(eq(questions.id, id))
          .returning();
        if (!row) return null;

        if (patch.examples !== undefined) {
          await tx.delete(questionExamples).where(eq(questionExamples.questionId, id));
          if (patch.examples.length > 0) {
            await tx.insert(questionExamples).values(
              patch.examples.map((e, i) => ({
                questionId: id,
                input: e.input,
                output: e.output,
                explanation: e.explanation ?? null,
                sortOrder: i,
              })),
            );
          }
        }

        if (patch.starterCode !== undefined) {
          await tx.delete(questionStarterCodes).where(eq(questionStarterCodes.questionId, id));
          const entries = Object.entries(patch.starterCode);
          if (entries.length > 0) {
            await tx
              .insert(questionStarterCodes)
              .values(entries.map(([language, code]) => ({ questionId: id, language, code })));
          }
        }

        if (patch.testCases !== undefined) {
          await tx.delete(questionTestCases).where(eq(questionTestCases.questionId, id));
          if (patch.testCases.length > 0) {
            await tx.insert(questionTestCases).values(
              patch.testCases.map((t, i) => ({
                questionId: id,
                input: t.input,
                expectedOutput: t.expectedOutput,
                explanation: t.explanation ?? null,
                isHidden: t.isHidden ?? false,
                isSample: t.isSample ?? false,
                weight: t.weight ?? 1,
                sortOrder: t.sortOrder ?? i,
              })),
            );
          }
        }

        await replaceNormalizedChildren(tx, id, patch);

        const full = await tx.query.questions.findFirst({
          where: eq(questions.id, id),
          with: withChildren,
        });
        return full ? assemble(full as QuestionWithRelations) : null;
      });
    } catch (err) {
      const list = loadFallback();
      const idx = list.findIndex((q) => q.id === id);
      if (idx === -1) return null;

      list[idx] = {
        ...list[idx],
        ...patch,
        updatedAt: new Date().toISOString(),
      } as any;

      if (patch.examples !== undefined) {
        list[idx].examples = patch.examples.map((e) => ({ input: e.input, output: e.output, explanation: e.explanation ?? null }));
      }
      if (patch.starterCode !== undefined) {
        list[idx].starterCode = patch.starterCode;
      }
      if (patch.testCases !== undefined) {
        list[idx].testCases = patch.testCases.map((t, i) => ({
          id: `tc-${id}-${i}`,
          input: t.input,
          expectedOutput: t.expectedOutput,
          explanation: t.explanation ?? null,
          isHidden: t.isHidden ?? false,
          isSample: t.isSample ?? false,
          weight: t.weight ?? 1,
          sortOrder: t.sortOrder ?? i,
        }));
      }

      saveFallback(list);
      return list[idx];
    }
  },

  async setStatus(id: string, status: QuestionStatus): Promise<QuestionDetail | null> {
    try {
      const [row] = await db
        .update(questions)
        .set({
          status,
          publishedAt: status === 'published' ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, id))
        .returning();
      if (!row) return null;
      const full = await db.query.questions.findFirst({
        where: eq(questions.id, id),
        with: withChildren,
      });
      return full ? assemble(full as QuestionWithRelations) : null;
    } catch (err) {
      const list = loadFallback();
      const idx = list.findIndex((q) => q.id === id);
      if (idx === -1) return null;
      list[idx].status = status as any;
      list[idx].publishedAt = status === 'published' ? new Date().toISOString() : null;
      list[idx].updatedAt = new Date().toISOString();
      saveFallback(list);
      return list[idx];
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const rows = await db
        .delete(questions)
        .where(eq(questions.id, id))
        .returning({ id: questions.id });
      return rows.length > 0;
    } catch (err) {
      const list = loadFallback();
      const filtered = list.filter((q) => q.id !== id);
      if (filtered.length === list.length) return false;
      saveFallback(filtered);
      return true;
    }
  },

  /* ----------------------------- Bookmarks ----------------------------- */

  async addBookmark(userId: string, questionId: string): Promise<void> {
    try {
      await db.insert(questionBookmarks).values({ userId, questionId }).onConflictDoNothing();
    } catch (err) {
      const bookmarksFile = path.join(FALLBACK_DIR, 'bookmarks.json');
      let bookmarks: { userId: string; questionId: string }[] = [];
      if (fs.existsSync(bookmarksFile)) {
        bookmarks = JSON.parse(fs.readFileSync(bookmarksFile, 'utf8'));
      }
      if (!bookmarks.some((b) => b.userId === userId && b.questionId === questionId)) {
        bookmarks.push({ userId, questionId });
        fs.writeFileSync(bookmarksFile, JSON.stringify(bookmarks, null, 2), 'utf8');
      }
    }
  },

  async removeBookmark(userId: string, questionId: string): Promise<void> {
    try {
      await db
        .delete(questionBookmarks)
        .where(
          and(eq(questionBookmarks.userId, userId), eq(questionBookmarks.questionId, questionId)),
        );
    } catch (err) {
      const bookmarksFile = path.join(FALLBACK_DIR, 'bookmarks.json');
      if (fs.existsSync(bookmarksFile)) {
        let bookmarks: { userId: string; questionId: string }[] = JSON.parse(fs.readFileSync(bookmarksFile, 'utf8'));
        bookmarks = bookmarks.filter((b) => !(b.userId === userId && b.questionId === questionId));
        fs.writeFileSync(bookmarksFile, JSON.stringify(bookmarks, null, 2), 'utf8');
      }
    }
  },

  async isBookmarked(userId: string, questionId: string): Promise<boolean> {
    try {
      const rows = await db
        .select({ id: questionBookmarks.id })
        .from(questionBookmarks)
        .where(
          and(eq(questionBookmarks.userId, userId), eq(questionBookmarks.questionId, questionId)),
        )
        .limit(1);
      return rows.length > 0;
    } catch (err) {
      const bookmarksFile = path.join(FALLBACK_DIR, 'bookmarks.json');
      if (!fs.existsSync(bookmarksFile)) return false;
      const bookmarks: { userId: string; questionId: string }[] = JSON.parse(fs.readFileSync(bookmarksFile, 'utf8'));
      return bookmarks.some((b) => b.userId === userId && b.questionId === questionId);
    }
  },

  async listBookmarks(
    userId: string,
    query: QuestionListQuery,
  ): Promise<PaginatedResult<QuestionDetail>> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const baseWhere = and(
        eq(questionBookmarks.userId, userId),
        inArray(
          questionBookmarks.questionId,
          db.select({ id: questions.id }).from(questions).where(eq(questions.status, 'published')),
        ),
      );

      const [countRows, bookmarkRows] = await Promise.all([
        db.select({ value: count() }).from(questionBookmarks).where(baseWhere),
        db.query.questionBookmarks.findMany({
          where: baseWhere,
          with: { question: { with: withChildren } },
          orderBy: [desc(questionBookmarks.createdAt)],
          offset: getOffset(page, limit),
          limit,
        }),
      ]);

      const items = bookmarkRows
        .filter((b) => b.question?.status === 'published')
        .map((b) => assemble(b.question as QuestionWithRelations, true));

      return {
        items,
        pagination: buildPaginationMeta(countRows[0]?.value ?? 0, page, limit),
      };
    } catch (err) {
      const bookmarksFile = path.join(FALLBACK_DIR, 'bookmarks.json');
      let bookmarkedIds: string[] = [];
      if (fs.existsSync(bookmarksFile)) {
        const bookmarks: { userId: string; questionId: string }[] = JSON.parse(fs.readFileSync(bookmarksFile, 'utf8'));
        bookmarkedIds = bookmarks.filter((b) => b.userId === userId).map((b) => b.questionId);
      }

      const list = loadFallback().filter((q) => q.status === 'published' && bookmarkedIds.includes(q.id));
      const limit = query.limit ?? 20;
      const page = query.page ?? 1;
      const offset = getOffset(page, limit);
      const items = list.slice(offset, offset + limit);

      return {
        items,
        pagination: buildPaginationMeta(list.length, page, limit),
      };
    }
  },

  /* ----------------------------- Statistics ---------------------------- */

  async incrementStats(id: string, input: InternalStatsInput): Promise<QuestionDetail | null> {
    try {
      const attempted = input.attempted === true;
      const solved = input.solved === true;
      const [row] = await db
        .update(questions)
        .set({
          attemptedCount: sql`${questions.attemptedCount} + ${attempted ? 1 : 0}`,
          solvedCount: sql`${questions.solvedCount} + ${solved ? 1 : 0}`,
          acceptanceRate: sql`CASE
            WHEN ${questions.attemptedCount} + ${attempted ? 1 : 0} > 0
            THEN ROUND(((${questions.solvedCount} + ${solved ? 1 : 0})::numeric /
                        (${questions.attemptedCount} + ${attempted ? 1 : 0})) * 100, 2)::double precision
            ELSE ${questions.acceptanceRate}
          END`,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, id))
        .returning();
      if (!row) return null;

      const full = await db.query.questions.findFirst({
        where: eq(questions.id, id),
        with: withChildren,
      });
      return full ? assemble(full as QuestionWithRelations) : null;
    } catch (err) {
      const list = loadFallback();
      const idx = list.findIndex((q) => q.id === id);
      if (idx === -1) return null;
      const attempted = input.attempted === true ? 1 : 0;
      const solved = input.solved === true ? 1 : 0;

      list[idx].attemptedCount += attempted;
      list[idx].solvedCount += solved;
      if (list[idx].attemptedCount > 0) {
        list[idx].acceptanceRate = Math.round((list[idx].solvedCount / list[idx].attemptedCount) * 10000) / 100;
      }
      list[idx].updatedAt = new Date().toISOString();
      saveFallback(list);
      return list[idx];
    }
  },

  async statistics(): Promise<QuestionStatistics> {
    try {
      const [totalRows, byStatus, byDifficulty, byType, attemptsRows, solvesRows] = await Promise.all(
        [
          db.select({ value: count() }).from(questions),
          db
            .select({ key: questions.status, value: count() })
            .from(questions)
            .groupBy(questions.status),
          db
            .select({ key: questions.difficulty, value: count() })
            .from(questions)
            .groupBy(questions.difficulty),
          db.select({ key: questions.type, value: count() }).from(questions).groupBy(questions.type),
          db
            .select({ value: sql<number>`COALESCE(SUM(${questions.attemptedCount}), 0)` })
            .from(questions),
          db
            .select({ value: sql<number>`COALESCE(SUM(${questions.solvedCount}), 0)` })
            .from(questions),
        ],
      );

      const toRecord = <K extends string>(
        rows: { key: string; value: number }[],
        keys: readonly K[],
      ) => {
        const record = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
        rows.forEach((r) => {
          if (r.key in record) record[r.key as K] = r.value;
        });
        return record;
      };

      const totalAttempts = attemptsRows[0]?.value ?? 0;
      const totalSolves = solvesRows[0]?.value ?? 0;

      return {
        total: totalRows[0]?.value ?? 0,
        byStatus: toRecord(byStatus, ['draft', 'published', 'archived'] as const),
        byDifficulty: toRecord(byDifficulty, ['Easy', 'Medium', 'Hard', 'Expert'] as const),
        byType: toRecord(byType, PROBLEM_TYPES),
        totalAttempts,
        totalSolves,
        overallAcceptanceRate:
          totalAttempts > 0 ? Math.round((totalSolves / totalAttempts) * 10000) / 100 : 0,
      };
    } catch (err) {
      const list = loadFallback();
      const total = list.length;
      const draft = list.filter((q) => q.status === 'draft').length;
      const published = list.filter((q) => q.status === 'published').length;
      const archived = list.filter((q) => q.status === 'archived').length;

      const easy = list.filter((q) => q.difficulty === 'Easy').length;
      const medium = list.filter((q) => q.difficulty === 'Medium').length;
      const hard = list.filter((q) => q.difficulty === 'Hard').length;
      const expert = list.filter((q) => q.difficulty === 'Expert').length;

      const byType = Object.fromEntries(
        PROBLEM_TYPES.map((type) => [type, list.filter((q) => q.type === type).length]),
      ) as any;

      const totalAttempts = list.reduce((acc, q) => acc + q.attemptedCount, 0);
      const totalSolves = list.reduce((acc, q) => acc + q.solvedCount, 0);

      return {
        total,
        byStatus: { draft, published, archived },
        byDifficulty: { Easy: easy, Medium: medium, Hard: hard, Expert: expert },
        byType,
        totalAttempts,
        totalSolves,
        overallAcceptanceRate: totalAttempts > 0 ? Math.round((totalSolves / totalAttempts) * 10000) / 100 : 0,
      };
    }
  },
};

export type QuestionRepository = typeof questionRepository;
