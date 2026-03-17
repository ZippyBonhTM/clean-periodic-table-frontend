'use client';

import type {
  AnalyzeChemicalEquationFlowResult,
} from '@/shared/chemistry/analysis';
import type { ChemistryBalanceRemoteAnalysisState } from '@/components/templates/chemistryBalanceRemoteAnalysis.types';

export const CHEMISTRY_BALANCE_REMOTE_ANALYSIS_OPTIONS = {
  format: {
    includePhase: true,
    hideCoefficientOne: true,
  },
} as const;

export function buildIdleRemoteAnalysisState(): ChemistryBalanceRemoteAnalysisState {
  return { status: 'idle' };
}

export function buildLoadingRemoteAnalysisState(
  input: string,
): Extract<ChemistryBalanceRemoteAnalysisState, { status: 'loading' }> {
  return {
    status: 'loading',
    input,
  };
}

export function buildUnknownRemoteFailure(
  input: string,
  error: unknown,
): Extract<ChemistryBalanceRemoteAnalysisState, { status: 'failed' }> {
  return {
    status: 'failed',
    input,
    error:
      error instanceof Error && error.message.trim().length > 0
        ? {
            ok: false,
            code: 'unknown-error',
            message: error.message,
          }
        : {
            ok: false,
            code: 'unknown-error',
            message: 'The optional chemical engine failed unexpectedly.',
          },
  };
}

export function resolveRemoteAnalysisStateFromResult(
  input: string,
  result: AnalyzeChemicalEquationFlowResult,
): ChemistryBalanceRemoteAnalysisState {
  if (!result.ok || result.value.engine.status === 'skipped') {
    return buildIdleRemoteAnalysisState();
  }

  if (result.value.engine.status === 'available') {
    return {
      status: 'available',
      input,
      value: result.value.engine.value,
    };
  }

  return {
    status: 'failed',
    input,
    error: result.value.engine.error,
  };
}
