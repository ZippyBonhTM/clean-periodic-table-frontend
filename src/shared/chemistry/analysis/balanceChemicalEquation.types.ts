import type { ParseChemicalEquationOptions, ParsedChemicalEquation } from '@/shared/chemistry/equation';
import type { ParseChemicalFormulaOptions } from '@/shared/chemistry/formula';
import type {
  BalancedChemicalReaction,
  ChemicalReaction,
  FormatBalancedReactionOptions,
} from '@/shared/chemistry/reaction';

export type BalanceChemicalEquationStage =
  | 'equation-parse'
  | 'reaction-create'
  | 'reaction-balance';

export type BalanceChemicalEquationIssue = {
  stage: BalanceChemicalEquationStage;
  code: string;
  message: string;
  start?: number;
  end?: number;
  side?: 'reactant' | 'product';
  termIndex?: number;
};

export type BalanceChemicalEquationFlowOptions = {
  equation?: ParseChemicalEquationOptions;
  formula?: ParseChemicalFormulaOptions;
  format?: FormatBalancedReactionOptions;
};

export type BalanceChemicalEquationFlowValue = {
  input: string;
  equation: ParsedChemicalEquation;
  reaction: ChemicalReaction;
  balancedReaction: BalancedChemicalReaction;
  formatted: string;
};

export type BalanceChemicalEquationFlowSuccess = {
  ok: true;
  value: BalanceChemicalEquationFlowValue;
  warnings: BalanceChemicalEquationIssue[];
};

export type BalanceChemicalEquationFlowFailure = {
  ok: false;
  stage: BalanceChemicalEquationStage;
  issues: BalanceChemicalEquationIssue[];
};

export type BalanceChemicalEquationFlowResult =
  | BalanceChemicalEquationFlowSuccess
  | BalanceChemicalEquationFlowFailure;
