import type { BalancedChemicalReaction } from '@/shared/chemistry/reaction';
import type { ChemicalElement } from '@/shared/types/element';

export type ReactionRuleElementMetadata = Pick<
  ChemicalElement,
  'symbol' | 'group' | 'category' | 'electronegativity_pauling'
>;

export type ReactionHeuristicType =
  | 'combustion-like'
  | 'synthesis'
  | 'decomposition'
  | 'exchange'
  | 'unknown';

export type ReactionHeuristicNoticeLevel = 'info' | 'warning';

export type ReactionHeuristicNoticeCode =
  | 'charge-balanced'
  | 'charge-imbalanced'
  | 'noble-gas-compound'
  | 'metadata-missing';

export type ReactionHeuristicNotice = {
  level: ReactionHeuristicNoticeLevel;
  code: ReactionHeuristicNoticeCode;
  message: string;
};

export type AnalyzeBalancedReactionOptions = {
  elementMetadataBySymbol?: ReadonlyMap<string, ReactionRuleElementMetadata>;
};

export type BalancedReactionAnalysis = {
  reactionType: ReactionHeuristicType;
  score: number;
  likelyPlausible: boolean;
  notices: ReactionHeuristicNotice[];
  reaction: BalancedChemicalReaction;
};
