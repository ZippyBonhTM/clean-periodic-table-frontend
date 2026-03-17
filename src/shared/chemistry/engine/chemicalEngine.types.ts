import type { BalancedChemicalReaction, ChemicalReaction } from '@/shared/chemistry/reaction';

export type ChemicalEngineNoticeLevel = 'info' | 'warning';

export type ChemicalEngineNotice = {
  level: ChemicalEngineNoticeLevel;
  code: string;
  message: string;
};

export type ChemicalEngineReactionAnalysis = {
  valid: boolean | null;
  classification: string | null;
  score: number | null;
  notices: ChemicalEngineNotice[];
  metadata?: Record<string, boolean | number | string | null>;
};

export type ChemicalEngineAnalyzeReactionInput = {
  input: string;
  reaction: ChemicalReaction;
  balancedReaction: BalancedChemicalReaction;
  formatted: string;
};

export type ChemicalEngineAnalyzeReactionFailureCode =
  | 'unavailable'
  | 'unauthorized'
  | 'invalid-response'
  | 'network-error'
  | 'unknown-error';

export type ChemicalEngineAnalyzeReactionSuccess = {
  ok: true;
  value: ChemicalEngineReactionAnalysis;
};

export type ChemicalEngineAnalyzeReactionFailure = {
  ok: false;
  code: ChemicalEngineAnalyzeReactionFailureCode;
  message: string;
};

export type ChemicalEngineAnalyzeReactionResult =
  | ChemicalEngineAnalyzeReactionSuccess
  | ChemicalEngineAnalyzeReactionFailure;

export type ChemicalEngineReactionAnalyzer = (
  input: ChemicalEngineAnalyzeReactionInput,
) => Promise<ChemicalEngineAnalyzeReactionResult>;
