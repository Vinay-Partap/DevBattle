import { EvaluationEngine } from '../../src/evaluation/EvaluationEngine';
import { Role } from '../../src/constants/roles';
import { QuestionDetail, Requester } from '../../src/types';

const requester: Requester = { id: '11111111-1111-4111-8111-111111111111', role: Role.STUDENT, permissions: [] };

const baseQuestion = (overrides: Partial<QuestionDetail> = {}): QuestionDetail => ({
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Theory',
  slug: 'theory',
  description: 'Pick the correct answer.',
  type: 'mcq',
  difficulty: 'Easy',
  category: 'Theory',
  tags: [],
  companies: [],
  technology: [],
  requirements: [],
  constraints: [],
  acceptanceRate: 0,
  estimatedMinutes: 5,
  timeLimitMs: 1000,
  memoryLimitMb: 128,
  isPremium: false,
  status: 'published',
  createdBy: '22222222-2222-4222-8222-222222222222',
  attemptedCount: 0,
  solvedCount: 0,
  publishedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  examples: [],
  starterCode: {},
  testCases: [],
  maxScore: 10,
  evaluationConfig: { correctAnswers: ['A'], points: 10 },
  ...overrides,
});

describe('EvaluationEngine', () => {
  it('uses the MCQ evaluator deterministically', async () => {
    const engine = new EvaluationEngine();
    const result = await engine.evaluate({
      question: baseQuestion(),
      requester,
      submission: { answer: 'A' },
    });

    expect(result.status).toBe('ACCEPTED');
    expect(result.score).toBe(10);
    expect(result.testResults[0].visible).toBe(true);
  });

  it('does not execute code evaluators inside question-service', async () => {
    const engine = new EvaluationEngine();
    const result = await engine.evaluate({
      question: baseQuestion({ type: 'dsa', starterCode: { javascript: 'function f(){}' } }),
      requester,
      submission: { code: 'while(true){}', language: 'javascript' },
    });

    expect(result.status).toBe('NOT_AVAILABLE');
    expect(result.message).toContain('isolated evaluation worker');
  });
});
