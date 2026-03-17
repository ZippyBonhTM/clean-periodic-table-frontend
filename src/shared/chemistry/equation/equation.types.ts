export type ChemicalEquationArrow = '->' | '<->' | '=';

export type ChemicalEquationPhase = 's' | 'l' | 'g' | 'aq' | 'unknown';

export type ChemicalEquationSide = 'reactant' | 'product';

export type ParsedChemicalEquationTerm = {
  raw: string;
  normalized: string;
  coefficient: number | null;
  formula: string;
  phase: ChemicalEquationPhase | null;
};

export type ParsedChemicalEquation = {
  raw: string;
  normalized: string;
  arrow: ChemicalEquationArrow;
  reactants: ParsedChemicalEquationTerm[];
  products: ParsedChemicalEquationTerm[];
  termCount: number;
};

export type EquationParseIssueCode =
  | 'empty-input'
  | 'missing-arrow'
  | 'multiple-arrows'
  | 'empty-side'
  | 'invalid-coefficient'
  | 'invalid-term'
  | 'invalid-formula'
  | 'invalid-phase'
  | 'unsupported-notation';

export type EquationParseIssue = {
  code: EquationParseIssueCode;
  message: string;
  start: number;
  end: number;
};
