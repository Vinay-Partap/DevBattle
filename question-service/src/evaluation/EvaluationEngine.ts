import { QuestionType } from '../constants/questionTypes';
import { ApiError } from '../utils/error';
import { QuestionEvaluator, EvaluationInput, EvaluationResult } from './types';
import { DSAEvaluator } from './evaluators/DSAEvaluator';
import { JavaScriptEvaluator } from './evaluators/JavaScriptEvaluator';
import { SQLEvaluator } from './evaluators/SQLEvaluator';
import { ReactEvaluator } from './evaluators/ReactEvaluator';
import { HTMLEvaluator } from './evaluators/HTMLEvaluator';
import { CSSEvaluator } from './evaluators/CSSEvaluator';
import { BackendEvaluator } from './evaluators/BackendEvaluator';
import { DebuggingEvaluator } from './evaluators/DebuggingEvaluator';
import { MCQEvaluator } from './evaluators/MCQEvaluator';

export class EvaluationEngine {
  private readonly evaluators: Partial<Record<QuestionType, QuestionEvaluator>>;

  constructor(evaluators?: Partial<Record<QuestionType, QuestionEvaluator>>) {
    this.evaluators = evaluators ?? {
      [QuestionType.DSA]: new DSAEvaluator(),
      [QuestionType.JAVASCRIPT]: new JavaScriptEvaluator(),
      [QuestionType.TYPESCRIPT]: new JavaScriptEvaluator(),
      [QuestionType.SQL]: new SQLEvaluator(),
      [QuestionType.REACT]: new ReactEvaluator(),
      [QuestionType.FRONTEND]: new ReactEvaluator(),
      [QuestionType.HTML]: new HTMLEvaluator(),
      [QuestionType.CSS]: new CSSEvaluator(),
      [QuestionType.BACKEND]: new BackendEvaluator(),
      [QuestionType.NODEJS]: new BackendEvaluator(),
      [QuestionType.DEBUGGING]: new DebuggingEvaluator(),
      [QuestionType.BUG_FIXING]: new DebuggingEvaluator(),
      [QuestionType.MCQ]: new MCQEvaluator(),
    };
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const evaluator = this.evaluators[input.question.type as QuestionType];
    if (!evaluator) {
      throw ApiError.badRequest(`No evaluator registered for question type: ${input.question.type}`);
    }
    return evaluator.evaluate(input);
  }
}

export const evaluationEngine = new EvaluationEngine();
