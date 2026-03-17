import type {
  ChemicalEquationArrow,
  ChemicalEquationPhase,
  ChemicalEquationSide,
} from '@/shared/chemistry/equation';
import type { ParsedChemicalFormula } from '@/shared/chemistry/formula';

export type ChemicalReactionParticipant = {
  raw: string;
  normalized: string;
  side: ChemicalEquationSide;
  inputCoefficient: number | null;
  formula: ParsedChemicalFormula;
  phase: ChemicalEquationPhase | null;
};

export type ChemicalReaction = {
  raw: string;
  normalized: string;
  arrow: ChemicalEquationArrow;
  reactants: ChemicalReactionParticipant[];
  products: ChemicalReactionParticipant[];
  elementSymbols: string[];
};

export type ChemicalReactionIssueCode =
  | 'empty-reaction'
  | 'invalid-participant'
  | 'invalid-formula'
  | 'missing-reactants'
  | 'missing-products'
  | 'missing-elements'
  | 'unsupported-reaction';

export type ChemicalReactionIssue = {
  code: ChemicalReactionIssueCode;
  message: string;
};
