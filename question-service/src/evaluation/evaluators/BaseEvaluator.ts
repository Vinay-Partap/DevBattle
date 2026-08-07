import { EvaluationResult, EvaluationStatus } from '../types';

export abstract class BaseEvaluator {
  protected notAvailable(message: string, maxScore = 0): EvaluationResult {
    return {
      status: 'NOT_AVAILABLE' satisfies EvaluationStatus,
      score: 0,
      maxScore,
      passedTests: 0,
      failedTests: 0,
      executionTime: 0,
      memoryUsed: 0,
      testResults: [],
      message,
    };
  }
}
