export type ChemicalFormulaNotation = 'molecular' | 'ionic' | 'hydrate' | 'unknown';

export type ChemicalFormulaElementCount = {
  symbol: string;
  count: number;
};

export type ChemicalFormulaCharge = {
  value: number;
  sign: '+' | '-';
};

export type ParsedChemicalFormula = {
  raw: string;
  normalized: string;
  notation: ChemicalFormulaNotation;
  elements: ChemicalFormulaElementCount[];
  totalAtomCount: number;
  charge: ChemicalFormulaCharge | null;
};

export type FormulaParseIssueCode =
  | 'empty-input'
  | 'invalid-token'
  | 'invalid-multiplier'
  | 'invalid-charge'
  | 'unknown-element-symbol'
  | 'unmatched-group'
  | 'unsupported-notation';

export type FormulaParseIssue = {
  code: FormulaParseIssueCode;
  message: string;
  start: number;
  end: number;
};
