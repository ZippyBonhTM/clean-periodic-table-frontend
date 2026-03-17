import type { ChemicalEquationSide, ParsedChemicalEquation } from '@/shared/chemistry/equation';
import type { ChemicalFormulaParser, FormulaParseIssue } from '@/shared/chemistry/formula';
import type { ChemicalReaction, ChemicalReactionIssue } from '@/shared/chemistry/reaction/reaction.types';

export type CreateChemicalReactionIssueCode =
  | ChemicalReactionIssue['code']
  | 'formula-parse-failure';

export type CreateChemicalReactionIssue = {
  code: CreateChemicalReactionIssueCode;
  message: string;
  side?: ChemicalEquationSide;
  termIndex?: number;
  formulaIssues?: FormulaParseIssue[];
};

export type CreateChemicalReactionSuccess = {
  ok: true;
  value: ChemicalReaction;
  warnings: CreateChemicalReactionIssue[];
};

export type CreateChemicalReactionFailure = {
  ok: false;
  issues: CreateChemicalReactionIssue[];
};

export type CreateChemicalReactionResult =
  | CreateChemicalReactionSuccess
  | CreateChemicalReactionFailure;

export type ChemicalReactionFactory = (
  equation: ParsedChemicalEquation,
  parseFormula: ChemicalFormulaParser,
) => CreateChemicalReactionResult;
