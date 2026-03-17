import type {
  ChemicalEngineAnalyzeReactionFailure,
  ChemicalEngineReactionAnalysis,
} from '@/shared/chemistry/engine';

export type ChemistryBalanceRemoteAnalysisState =
  | {
      status: 'idle';
    }
  | {
      status: 'loading';
      input: string;
    }
  | {
      status: 'available';
      input: string;
      value: ChemicalEngineReactionAnalysis;
    }
  | {
      status: 'failed';
      input: string;
      error: ChemicalEngineAnalyzeReactionFailure;
    };
