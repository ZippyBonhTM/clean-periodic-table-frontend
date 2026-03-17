import type { ParseChemicalFormulaOptions } from '@/shared/chemistry/formula/formulaParser.types';
import type {
  ChemicalFormulaCharge,
  FormulaParseIssue,
} from '@/shared/chemistry/formula/formula.types';

export type ResolvedParseChemicalFormulaOptions = Required<ParseChemicalFormulaOptions>;

export type ParseFormulaSegmentResult = {
  counts: Map<string, number>;
  nextIndex: number;
  issues: FormulaParseIssue[];
};

export type ParsedFormulaChargeSuffix = {
  formulaSource: string;
  charge: ChemicalFormulaCharge | null;
  normalizedSuffix: string;
  issues: FormulaParseIssue[];
};

export type FormulaHydrateSegments = {
  segments: string[];
  usesHydrateDot: boolean;
};
