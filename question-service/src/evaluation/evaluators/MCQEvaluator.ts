import { QuestionEvaluator, EvaluationInput, EvaluationResult } from '../types';

const normalizeAnswer = (answer: unknown): string[] => {
  if (Array.isArray(answer)) return answer.map(String).sort();
  if (answer === undefined || answer === null) return [];
  return [String(answer)];
};

export class MCQEvaluator implements QuestionEvaluator {
  async evaluate({ question, submission }: EvaluationInput): Promise<EvaluationResult> {
    const config = (question.evaluationConfig ?? {}) as {
      correctAnswers?: unknown[];
      points?: number;
    };
    const expected = normalizeAnswer(config.correctAnswers ?? []);
    const actual = normalizeAnswer(submission.answer);
    const maxScore = config.points ?? question.maxScore ?? 1;
    const passed = expected.length > 0 && JSON.stringify(expected) === JSON.stringify(actual);

    return {
      status: passed ? 'ACCEPTED' : 'WRONG_ANSWER',
      score: passed ? maxScore : 0,
      maxScore,
      passedTests: passed ? 1 : 0,
      failedTests: passed ? 0 : 1,
      executionTime: 0,
      memoryUsed: 0,
      testResults: [
        {
          id: 'mcq-answer',
          status: passed ? 'PASSED' : 'FAILED',
          visible: true,
          score: passed ? maxScore : 0,
          maxScore,
          message: passed ? 'Answer is correct.' : 'Answer is incorrect.',
        },
      ],
    };
  }
}
