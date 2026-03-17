import type {
  FormulaParseIssue,
  ParsedChemicalFormula,
} from '@/shared/chemistry/formula/formula.types';

export type ParseChemicalFormulaOptions = {
  allowCharge?: boolean;
  allowHydrateDot?: boolean;
  allowGroupedFormula?: boolean;
};

export type ParseChemicalFormulaSuccess = {
  ok: true;
  value: ParsedChemicalFormula;
  warnings: FormulaParseIssue[];
};

export type ParseChemicalFormulaFailure = {
  ok: false;
  issues: FormulaParseIssue[];
};

export type ParseChemicalFormulaResult = ParseChemicalFormulaSuccess | ParseChemicalFormulaFailure;

export type ChemicalFormulaParser = (
  input: string,
  options?: ParseChemicalFormulaOptions,
) => ParseChemicalFormulaResult;
