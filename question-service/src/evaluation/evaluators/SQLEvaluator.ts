import { QuestionEvaluator, EvaluationInput, EvaluationResult } from '../types';
import { BaseEvaluator } from './BaseEvaluator';

export class SQLEvaluator extends BaseEvaluator implements QuestionEvaluator {
  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    return this.notAvailable(
      'SQLEvaluator requires an isolated evaluation worker/runner. It is intentionally not executed inside the Question Service process.',
      input.question.maxScore ?? 0,
    );
  }
}
