import type {
  ChemicalEngineAnalyzeReactionFailure,
  ChemicalEngineAnalyzeReactionInput,
  ChemicalEngineReactionAnalysis,
  ChemicalEngineReactionAnalyzer,
} from '@/shared/chemistry/engine';

export type ChemicalEngineAnalyzeReactionRequest = ChemicalEngineAnalyzeReactionInput;

export type ChemicalEngineAnalyzeReactionResponse = ChemicalEngineReactionAnalysis;

export type CreateChemicalEngineReactionAnalyzerOptions = {
  token?: string | null;
  signal?: AbortSignal;
  path?: string;
};

export type MapChemicalEngineApiError = (
  error: unknown,
) => ChemicalEngineAnalyzeReactionFailure;

export type CreateChemicalEngineReactionAnalyzer = (
  options?: CreateChemicalEngineReactionAnalyzerOptions,
) => ChemicalEngineReactionAnalyzer;
