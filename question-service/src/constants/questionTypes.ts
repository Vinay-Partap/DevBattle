export const QuestionType = {
  DSA: 'dsa',
  JAVASCRIPT: 'javascript',
  SQL: 'sql',
  REACT: 'react',
  HTML: 'html-css',
  CSS: 'css',
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  DEBUGGING: 'debugging',
  MCQ: 'mcq',
  FULLSTACK: 'fullstack',
  NODEJS: 'nodejs',
  TYPESCRIPT: 'typescript',
  BUG_FIXING: 'bug-fixing',
  SYSTEM_DESIGN: 'system-design',
  AI_CHALLENGE: 'ai-challenge',
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const QUESTION_TYPES = Object.values(QuestionType);

export const EXECUTABLE_CODE_TYPES: QuestionType[] = [
  QuestionType.DSA,
  QuestionType.JAVASCRIPT,
  QuestionType.TYPESCRIPT,
  QuestionType.DEBUGGING,
];

export const BROWSER_PREVIEW_TYPES: QuestionType[] = [
  QuestionType.REACT,
  QuestionType.HTML,
  QuestionType.CSS,
  QuestionType.FRONTEND,
  QuestionType.FULLSTACK,
];

export const SQL_TYPES: QuestionType[] = [QuestionType.SQL];
export const BACKEND_TYPES: QuestionType[] = [QuestionType.BACKEND, QuestionType.NODEJS, QuestionType.FULLSTACK];
export const THEORY_TYPES: QuestionType[] = [QuestionType.MCQ, QuestionType.SYSTEM_DESIGN];
