import type {
  EquationParseIssue,
  ParsedChemicalEquation,
} from '@/shared/chemistry/equation/equation.types';

export type ParseChemicalEquationOptions = {
  allowReversibleArrow?: boolean;
  allowPhaseLabels?: boolean;
  allowIonicCharge?: boolean;
  allowExplicitCoefficients?: boolean;
};

export type ParseChemicalEquationSuccess = {
  ok: true;
  value: ParsedChemicalEquation;
  warnings: EquationParseIssue[];
};

export type ParseChemicalEquationFailure = {
  ok: false;
  issues: EquationParseIssue[];
};

export type ParseChemicalEquationResult = ParseChemicalEquationSuccess | ParseChemicalEquationFailure;

export type ChemicalEquationParser = (
  input: string,
  options?: ParseChemicalEquationOptions,
) => ParseChemicalEquationResult;
