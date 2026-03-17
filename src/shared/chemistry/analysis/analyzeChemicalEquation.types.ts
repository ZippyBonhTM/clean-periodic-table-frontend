import type {
  BalanceChemicalEquationFlowFailure,
  BalanceChemicalEquationFlowOptions,
  BalanceChemicalEquationFlowValue,
  BalanceChemicalEquationIssue,
} from '@/shared/chemistry/analysis';
import type {
  ChemicalEngineAnalyzeReactionFailure,
  ChemicalEngineReactionAnalysis,
  ChemicalEngineReactionAnalyzer,
} from '@/shared/chemistry/engine';
import type { AnalyzeBalancedReactionOptions, BalancedReactionAnalysis } from '@/shared/chemistry/rules';

export type AnalyzeChemicalEquationFlowOptions = {
  balance?: BalanceChemicalEquationFlowOptions;
  rules?: AnalyzeBalancedReactionOptions;
  engineAnalyzer?: ChemicalEngineReactionAnalyzer;
};

export type AnalyzeChemicalEquationEngineResult =
  | {
      status: 'skipped';
    }
  | {
      status: 'available';
      value: ChemicalEngineReactionAnalysis;
    }
  | {
      status: 'failed';
      error: ChemicalEngineAnalyzeReactionFailure;
    };

export type AnalyzeChemicalEquationFlowValue = {
  balance: BalanceChemicalEquationFlowValue;
  localAnalysis: BalancedReactionAnalysis;
  engine: AnalyzeChemicalEquationEngineResult;
};

export type AnalyzeChemicalEquationFlowSuccess = {
  ok: true;
  value: AnalyzeChemicalEquationFlowValue;
  warnings: BalanceChemicalEquationIssue[];
};

export type AnalyzeChemicalEquationFlowFailure = BalanceChemicalEquationFlowFailure;

export type AnalyzeChemicalEquationFlowResult =
  | AnalyzeChemicalEquationFlowSuccess
  | AnalyzeChemicalEquationFlowFailure;
