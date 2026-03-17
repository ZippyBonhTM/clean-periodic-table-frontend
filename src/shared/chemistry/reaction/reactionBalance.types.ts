import type {
  ChemicalReaction,
  ChemicalReactionIssue,
  ChemicalReactionParticipant,
} from '@/shared/chemistry/reaction/reaction.types';

export type BalanceChemicalReactionMethod = 'matrix-null-space';

export type BalancedChemicalReactionParticipant = ChemicalReactionParticipant & {
  coefficient: number;
};

export type BalancedChemicalReaction = Omit<ChemicalReaction, 'reactants' | 'products'> & {
  reactants: BalancedChemicalReactionParticipant[];
  products: BalancedChemicalReactionParticipant[];
  coefficientVector: number[];
  wasNormalized: boolean;
};

export type BalanceReactionIssueCode =
  | ChemicalReactionIssue['code']
  | 'already-balanced'
  | 'non-integer-solution'
  | 'unsatisfiable-system';

export type BalanceReactionIssue = {
  code: BalanceReactionIssueCode;
  message: string;
};

export type BalanceChemicalReactionSuccess = {
  ok: true;
  value: BalancedChemicalReaction;
  method: BalanceChemicalReactionMethod;
  warnings: BalanceReactionIssue[];
};

export type BalanceChemicalReactionFailure = {
  ok: false;
  issues: BalanceReactionIssue[];
};

export type BalanceChemicalReactionResult =
  | BalanceChemicalReactionSuccess
  | BalanceChemicalReactionFailure;

export type ChemicalReactionBalancer = (
  reaction: ChemicalReaction,
) => BalanceChemicalReactionResult;
