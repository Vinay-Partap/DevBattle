import { QuestionEvaluator, EvaluationInput, EvaluationResult } from '../types';
import { BaseEvaluator } from './BaseEvaluator';

export class BackendEvaluator extends BaseEvaluator implements QuestionEvaluator {
  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    return this.notAvailable(
      'BackendEvaluator requires an isolated evaluation worker/runner. It is intentionally not executed inside the Question Service process.',
      input.question.maxScore ?? 0,
    );
  }
}
