import { QuestionDetail, Requester } from '../types';

export type EvaluationStatus =
  | 'ACCEPTED'
  | 'PARTIAL'
  | 'WRONG_ANSWER'
  | 'COMPILE_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'NOT_AVAILABLE';

export interface EvaluationInput {
  question: QuestionDetail;
  requester: Requester;
  submission: {
    code?: string;
    language?: string;
    answer?: unknown;
    files?: Record<string, string>;
    query?: string;
    metadata?: Record<string, unknown>;
  };
  includeHidden?: boolean;
}

export interface EvaluationTestResult {
  id: string;
  status: 'PASSED' | 'FAILED' | 'ERROR' | 'SKIPPED';
  visible: boolean;
  score?: number;
  maxScore?: number;
  message?: string;
}

export interface EvaluationResult {
  status: EvaluationStatus;
  score: number;
  maxScore: number;
  passedTests: number;
  failedTests: number;
  executionTime: number;
  memoryUsed: number;
  testResults: EvaluationTestResult[];
  message?: string;
}

export interface QuestionEvaluator {
  evaluate(input: EvaluationInput): Promise<EvaluationResult>;
}
